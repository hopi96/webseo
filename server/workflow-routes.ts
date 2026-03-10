/**
 * Routes API pour les workflows (remplace n8n)
 * Expose les services d'analyse SEO et de génération de contenu
 */

import { Router, Request, Response } from 'express';
import { seoAnalysisService } from './seo-analysis-service';
import { contentCalendarService, SUPPORTED_PLATFORMS } from './content-calendar-service';
import { contentGeneratorService } from './content-generator-service';
import { socialPublisherService } from './social-publisher-service';

const router = Router();

// ============================================
// ROUTES ANALYSE SEO
// ============================================

/**
 * POST /api/workflows/analyze-seo
 * Analyse SEO complète d'un site web
 */
router.post('/analyze-seo', async (req: Request, res: Response) => {
    try {
        const { url, siteName } = req.body;

        if (!url) {
            return res.status(400).json({
                error: 'URL requise',
                message: 'Le champ "url" est obligatoire'
            });
        }

        // Valider l'URL
        try {
            new URL(url);
        } catch {
            return res.status(400).json({
                error: 'URL invalide',
                message: 'L\'URL fournie n\'est pas valide'
            });
        }

        console.log(`📊 API: Analyse SEO demandée pour ${url}`);

        const result = await seoAnalysisService.generateAndSaveSeoReport(url, siteName);

        res.json({
            success: true,
            siteId: result.siteId,
            analysis: result.analysis
        });

    } catch (error: any) {
        console.error('❌ API Erreur analyse SEO:', error);
        res.status(500).json({
            error: 'Erreur analyse SEO',
            message: error.message
        });
    }
});

/**
 * GET /api/workflows/seo/:siteId
 * Récupère l'analyse SEO d'un site existant
 */
router.get('/seo/:siteId', async (req: Request, res: Response) => {
    try {
        const siteId = parseInt(req.params.siteId);

        if (isNaN(siteId)) {
            return res.status(400).json({ error: 'ID site invalide' });
        }

        const analysis = await seoAnalysisService.getSiteAnalysis(siteId);

        if (!analysis) {
            return res.status(404).json({ error: 'Analyse non trouvée' });
        }

        res.json({ success: true, analysis });

    } catch (error: any) {
        console.error('❌ API Erreur récupération SEO:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ROUTES CALENDRIER ÉDITORIAL
// ============================================

/**
 * POST /api/workflows/generate-calendar
 * Génère un calendrier éditorial pour un site
 */
router.post('/generate-calendar', async (req: Request, res: Response) => {
    try {
        const { siteId, period, platforms, keywords } = req.body;

        // Validation
        if (!siteId) {
            return res.status(400).json({ error: 'siteId requis' });
        }

        if (!period?.startDate || !period?.endDate) {
            return res.status(400).json({
                error: 'Période requise',
                message: 'Les champs period.startDate et period.endDate sont obligatoires'
            });
        }

        // Plateformes par défaut si non spécifiées
        const selectedPlatforms = platforms?.length > 0
            ? platforms
            : ['instagram', 'facebook', 'newsletter', 'linkedin'];

        // Valider les plateformes
        const invalidPlatforms = selectedPlatforms.filter(
            (p: string) => !SUPPORTED_PLATFORMS.includes(p as any)
        );
        if (invalidPlatforms.length > 0) {
            return res.status(400).json({
                error: 'Plateformes invalides',
                invalid: invalidPlatforms,
                supported: SUPPORTED_PLATFORMS
            });
        }

        console.log(`📅 API: Génération calendrier pour site ${siteId}`);

        const calendar = await contentCalendarService.generateCalendar({
            siteId: parseInt(siteId),
            period,
            platforms: selectedPlatforms,
            keywords
        });

        res.json({
            success: true,
            count: calendar.length,
            calendar
        });

    } catch (error: any) {
        console.error('❌ API Erreur génération calendrier:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/workflows/generate-calendar-flow
 * Génère le calendrier ET les contenus dans la base de données
 * (Endpoint dédié pour le frontend)
 */
router.post('/generate-calendar-flow', async (req: Request, res: Response) => {
    try {
        const { siteId, period, platforms, keywords, seoResult } = req.body;

        console.log(`🚀 API: Flux calendrier complet pour site ${siteId}`);

        // 1. Génération du calendrier (idées)
        const calendar = await contentCalendarService.generateCalendar({
            siteId: parseInt(siteId),
            period,
            platforms: platforms || ['instagram', 'facebook', 'newsletter', 'linkedin'],
            keywords
        });

        console.log(`✅ Calendrier généré: ${calendar.length} idées`);

        // 2. Génération des contenus en base (status: en attente)
        // On ne génère pas le texte complet tout de suite pour aller vite, 
        // ou on le fait si c'est demandé. 
        // Le workflow n8n original créait les entrées dans Airtable.
        // Ici generateBatch crée les entrées dans Supabase.

        // Lancement en arrière-plan (fire-and-forget)
        contentGeneratorService.generateBatch(calendar).catch(err => {
            console.error('❌ ERREUR BACKGROUND generateBatch:', err);
        });

        res.json({
            success: true,
            calendarCount: calendar.length,
            message: "Génération du calendrier terminée. La rédaction des contenus continue en arrière-plan.",
            backgroundParam: true // Indicateur pour le frontend
        });

    } catch (error: any) {
        console.error('❌ API Erreur flow calendrier:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/workflows/generate-calendar-stream
 * Version SSE (Server-Sent Events) pour streaming de la progression en temps réel
 */
router.post('/generate-calendar-stream', async (req: Request, res: Response) => {
    // Configuration SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const sendSSE = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        const { siteId, period, platforms, keywords } = req.body;

        console.log(`🚀 SSE: Génération calendrier avec progression pour site ${siteId}`);

        // Créer une instance dédiée avec callback de progression
        const { ContentCalendarService } = await import('./content-calendar-service');
        const calendarServiceWithProgress = new ContentCalendarService();

        const CALENDAR_WEIGHT = 40;
        const CONTENT_WEIGHT = 60;
        let lastPercent = 0;

        // Configurer le callback de progression
        calendarServiceWithProgress.onProgress = (progress) => {
            const scaled = Math.min(
                CALENDAR_WEIGHT,
                Math.round((progress.percent / 100) * CALENDAR_WEIGHT)
            );
            const clamped = Math.max(lastPercent, scaled);
            lastPercent = clamped;
            sendSSE({
                type: 'progress',
                ...progress,
                percent: clamped,
                phase: 'calendar'
            });
        };

        // Générer le calendrier (les événements SSE seront émis automatiquement)
        const calendar = await calendarServiceWithProgress.generateCalendar({
            siteId: parseInt(siteId),
            period,
            platforms: platforms || ['instagram', 'facebook', 'newsletter', 'linkedin'],
            keywords
        });

        if (calendar.length === 0) {
            sendSSE({
                type: 'progress',
                percent: 100,
                step: 'Aucune idée générée.',
                phase: 'calendar'
            });
            sendSSE({
                type: 'complete',
                success: true,
                calendarCount: 0,
                message: 'Aucune idée générée pour la période sélectionnée.'
            });
            res.end();
            return;
        }

        sendSSE({
            type: 'progress',
            percent: Math.max(lastPercent, CALENDAR_WEIGHT),
            step: `Calendrier généré (${calendar.length} idées). Rédaction en cours...`,
            phase: 'content'
        });

        const contentResult = await contentGeneratorService.generateBatch(calendar, (contentProgress) => {
            const scaled = CALENDAR_WEIGHT + Math.round((contentProgress.percent / 100) * CONTENT_WEIGHT);
            const clamped = Math.max(lastPercent, scaled);
            lastPercent = clamped;
            const step = `Rédaction des contenus ${contentProgress.current}/${contentProgress.total}` +
                (contentProgress.platform ? ` (${contentProgress.platform})` : '');
            sendSSE({
                type: 'progress',
                percent: clamped,
                step,
                phase: 'content'
            });
        });

        // Envoyer le résultat final
        sendSSE({
            type: 'complete',
            success: true,
            calendarCount: calendar.length,
            generated: contentResult.generated,
            errors: contentResult.errors,
            message: contentResult.errors > 0
                ? `Calendrier généré. ${contentResult.generated} contenus créés, ${contentResult.errors} erreurs.`
                : `Calendrier généré. ${contentResult.generated} contenus créés avec succès.`
        });

        res.end();

    } catch (error: any) {
        console.error('❌ SSE Erreur:', error);
        sendSSE({
            type: 'error',
            error: error.message
        });
        res.end();
    }
});

/**
 * GET /api/workflows/platforms
 * Liste les plateformes supportées
 */
router.get('/platforms', (req: Request, res: Response) => {
    res.json({
        platforms: SUPPORTED_PLATFORMS,
        descriptions: {
            newsletter: 'Email marketing HTML',
            instagram: 'Posts et carrousels Instagram',
            facebook: 'Posts Facebook',
            linkedin: 'Posts LinkedIn',
            xtwitter: 'Threads Twitter/X',
            blog: 'Articles de blog SEO',
            pinterest: 'Pins Pinterest',
            'google my business': 'Posts Google My Business',
            youtube: 'Scripts vidéo YouTube',
            tiktok: 'Scripts TikTok'
        }
    });
});

// ============================================
// ROUTES GÉNÉRATION DE CONTENU
// ============================================

/**
 * POST /api/workflows/generate-content
 * Génère un seul contenu pour une plateforme
 */
router.post('/generate-content', async (req: Request, res: Response) => {
    try {
        const { siteId, platform, theme, context, publicationDate, generateImage } = req.body;

        // Validation
        if (!siteId || !platform || !theme) {
            return res.status(400).json({
                error: 'Paramètres manquants',
                required: ['siteId', 'platform', 'theme']
            });
        }

        if (!SUPPORTED_PLATFORMS.includes(platform as any)) {
            return res.status(400).json({
                error: 'Plateforme invalide',
                supported: SUPPORTED_PLATFORMS
            });
        }

        console.log(`📝 API: Génération contenu ${platform} pour site ${siteId}`);

        const content = await contentGeneratorService.generateContent({
            siteId: parseInt(siteId),
            platform,
            theme,
            context: context || '',
            publicationDate: publicationDate || new Date().toISOString(),
            generateImage
        });

        res.json({
            success: true,
            content
        });

    } catch (error: any) {
        console.error('❌ API Erreur génération contenu:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/workflows/generate-batch
 * Génère tous les contenus d'un calendrier
 */
router.post('/generate-batch', async (req: Request, res: Response) => {
    try {
        const { calendarEntries } = req.body;

        if (!calendarEntries || !Array.isArray(calendarEntries) || calendarEntries.length === 0) {
            return res.status(400).json({
                error: 'calendarEntries requis',
                message: 'Un tableau d\'entrées de calendrier est requis'
            });
        }

        // Limiter le batch à 50 contenus max
        if (calendarEntries.length > 50) {
            return res.status(400).json({
                error: 'Trop d\'entrées',
                message: 'Maximum 50 contenus par batch'
            });
        }

        console.log(`🚀 API: Génération batch de ${calendarEntries.length} contenus`);

        const result = await contentGeneratorService.generateBatch(calendarEntries);

        res.json({
            success: true,
            ...result
        });

    } catch (error: any) {
        console.error('❌ API Erreur génération batch:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/workflows/publish-due
 * Publie les contenus du jour (auto-publisher)
 */
router.post('/publish-due', async (_req: Request, res: Response) => {
    try {
        const result = await socialPublisherService.runOnce();
        res.json({
            success: true,
            ...result
        });
    } catch (error: any) {
        console.error('❌ API Erreur publication auto:', error);
        res.status(500).json({ error: error.message || 'Erreur publication auto' });
    }
});

/**
 * POST /api/workflows/generate-image
 * Génère une image DALL-E pour un contenu existant
 */
router.post('/generate-image', async (req: Request, res: Response) => {
    try {
        const { contentText, platform } = req.body;

        if (!contentText) {
            return res.status(400).json({ error: 'contentText requis' });
        }

        console.log(`🎨 API: Génération image DALL-E`);

        const imageUrl = await contentGeneratorService.generateImage(
            contentText,
            platform || 'instagram'
        );

        res.json({
            success: true,
            imageUrl
        });

    } catch (error: any) {
        console.error('❌ API Erreur génération image:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ROUTE WORKFLOW COMPLET
// ============================================

/**
 * POST /api/workflows/full-pipeline
 * Exécute le workflow complet: analyse SEO → calendrier → contenus
 */
router.post('/full-pipeline', async (req: Request, res: Response) => {
    try {
        const {
            url,
            siteName,
            period,
            platforms,
            generateContents = false
        } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL requise' });
        }

        console.log(`🚀 API: Pipeline complet pour ${url}`);

        // 1. Analyse SEO
        console.log('  → Étape 1: Analyse SEO...');
        const seoResult = await seoAnalysisService.generateAndSaveSeoReport(url, siteName);

        // 2. Génération calendrier
        console.log('  → Étape 2: Génération calendrier...');
        const calendar = await contentCalendarService.generateCalendar({
            siteId: seoResult.siteId,
            period: period || {
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            platforms: platforms || ['instagram', 'facebook', 'newsletter', 'linkedin']
        });

        // 3. Génération contenus (optionnel)
        let contents = null;
        if (generateContents && calendar.length > 0) {
            console.log('  → Étape 3: Génération contenus...');
            contents = await contentGeneratorService.generateBatch(calendar);
        }

        console.log('✅ Pipeline complet terminé');

        res.json({
            success: true,
            siteId: seoResult.siteId,
            seoAnalysis: seoResult.analysis,
            calendar: {
                count: calendar.length,
                entries: calendar
            },
            contents: contents ? {
                generated: contents.generated,
                errors: contents.errors
            } : null
        });

    } catch (error: any) {
        console.error('❌ API Erreur pipeline:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
