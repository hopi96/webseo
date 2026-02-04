/**
 * Service de génération de calendrier éditorial
 * Remplace le workflow n8n "content management" - partie calendrier
 */

import OpenAI from 'openai';
import { supabaseService } from './supabase-service';

// Types
export interface CalendarGenerationRequest {
    siteId: number;
    period: {
        startDate: string;
        endDate: string;
    };
    platforms: string[];
    keywords?: string[];
}

export interface CalendarEntry {
    id_site: number;
    plateforme: string;
    theme_de_publication: string;
    date_de_publication: string;
    contexte: string;
}

export interface SocialProgramFrequency {
    posts_par_semaine?: number;
    posts_par_mois?: number;
    jours_preferentiels?: string[];
    heures_optimales?: string[];
}

export interface SocialProgram {
    frequence_publication: {
        plateformes: Record<string, SocialProgramFrequency>;
    };
}

// Plateformes supportées
export const SUPPORTED_PLATFORMS = [
    'newsletter',
    'tiktok',
    'instagram',
    'xtwitter',
    'youtube',
    'facebook',
    'blog',
    'google my business',
    'pinterest'
] as const;

export type Platform = typeof SUPPORTED_PLATFORMS[number];

// Initialisation OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export class ContentCalendarService {

    /**
     * Génère un calendrier éditorial complet pour un site
     */
    async generateCalendar(request: CalendarGenerationRequest): Promise<CalendarEntry[]> {
        console.log(`📅 Génération calendrier pour site ${request.siteId}`);
        console.log(`   Période: ${request.period.startDate} → ${request.period.endDate}`);
        console.log(`   Plateformes: ${request.platforms.join(', ')}`);

        // 1. Récupérer les données du site
        const site = await supabaseService.getSiteById(request.siteId);
        if (!site) {
            throw new Error(`Site ${request.siteId} non trouvé`);
        }

        // 2. Récupérer le programme social et l'analyse SEO
        const socialProgram = site.socialParams as SocialProgram | null;
        const seoAnalysis = site.seoAnalysis;

        // Extraire le contexte riche de l'analyse SEO
        const richContext = this.extractRichContextFromSeo(seoAnalysis, site);

        // 3. Générer le calendrier pour chaque plateforme
        const allEntries: CalendarEntry[] = [];

        for (const platform of request.platforms) {
            const frequency = socialProgram?.frequence_publication?.plateformes?.[platform];

            const entries = await this.generatePlatformCalendar({
                siteId: request.siteId,
                siteName: site.name,
                siteUrl: site.url,
                platform,
                period: request.period,
                frequency,
                context: richContext
            });

            allEntries.push(...entries);
        }

        console.log(`✅ Calendrier généré: ${allEntries.length} entrées`);
        return allEntries;
    }

    /**
     * Génère le calendrier pour une plateforme spécifique
     */
    private async generatePlatformCalendar(params: {
        siteId: number;
        siteName: string;
        siteUrl: string;
        platform: string;
        period: { startDate: string; endDate: string };
        frequency?: SocialProgramFrequency;
        context: RichContext;
    }): Promise<CalendarEntry[]> {

        const prompt = this.buildCalendarPrompt(params);

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `Tu es un expert Stratège Éditorial Senior.
Ta mission est de créer un calendrier éditorial ULTRA-PERTINENT et ENGAGEANT pour la marque décrite.

TES OBJECTIFS :
1. DÉVELOPPER L'AUTORITÉ DE LA MARQUE : Utilise les thèmes d'expertise fournis.
2. MAXIMISER L'ENGAGEMENT : Propose des sujets qui incitent à la réaction (questions, débats, coulisses).
3. VARIER LES PLAISIRS : Alterne entre éducatif, promotionnel, inspirant et divertissant.
4. ADAPTER À LA PLATEFORME : Respecte les codes spécifiques de ${params.platform}.

RÈGLES D'OR :
- Pas de sujets génériques ("Bonne journée"). Chaque post doit apporter de la valeur.
- Utilise le contexte local si disponible.
- Exploite les mots-clés de manière naturelle.

FORMAT DE RÉPONSE ATTENDU : JSON valide uniquement, sans markdown.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.5, // Un peu plus créatif
                response_format: { type: 'json_object' }
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                console.warn(`⚠️ Pas de réponse pour ${params.platform}`);
                return [];
            }

            const parsed = JSON.parse(content);
            const entries = parsed.calendrier || parsed.calendar || [];

            // S'assurer que chaque entrée a le bon id_site
            return entries.map((entry: any) => ({
                id_site: params.siteId,
                plateforme: params.platform,
                theme_de_publication: entry.theme_de_publication || entry.theme || entry.title,
                date_de_publication: entry.date_de_publication || entry.date,
                contexte: entry.contexte || entry.context || ''
            }));

        } catch (error) {
            console.error(`❌ Erreur génération calendrier ${params.platform}:`, error);
            return [];
        }
    }

    /**
     * Construit le prompt pour la génération de calendrier
     */
    private buildCalendarPrompt(params: {
        siteId: number;
        siteName: string;
        siteUrl: string;
        platform: string;
        period: { startDate: string; endDate: string };
        frequency?: SocialProgramFrequency;
        context: RichContext;
    }): string {
        const frequencyText = params.frequency
            ? `Fréquence: ${params.frequency.posts_par_semaine || 2} posts par semaine`
            : 'Fréquence: 2 posts par semaine (par défaut)';

        const context = params.context;

        return `CONTEXTE DE LA MARQUE :
Nom: ${params.siteName}
URL: ${params.siteUrl}
Description: ${context.description}
Secteur/Thèmes: ${context.themes.join(', ')}
${context.audience ? `Cible: ${context.audience}` : ''}
${context.localInfo ? `Ancrage Local: ${context.localInfo}` : ''}

MISSION : Crée un calendrier éditorial pour **${params.platform}**.
Période: du ${params.period.startDate} au ${params.period.endDate}
${frequencyText}

MOTS-CLÉS À INCLURE SUBTILEMENT :
${context.keywords.slice(0, 15).join(', ')}

TRENDS & SAISONNALITÉ :
${context.trends.length > 0 ? `Tendances actuelles : ${context.trends.join(', ')}` : 'Prends en compte la saisonnalité du moment.'}

Format de sortie JSON attendu:
{
  "calendrier": [
    {
      "date_de_publication": "YYYY-MM-DD",
      "theme_de_publication": "Titre accrocheur du post",
      "contexte": "Brief détaillé pour le rédacteur : Quel est l'angle ? Quel est le but (Vente, Engagement, Notoriété) ? Quel ton adopter ? Information clé à mentionner."
    }
  ]
}`;
    }

    /**
     * Extrait les mots-clés pertinents de l'analyse SEO
     */
    private extractRichContextFromSeo(seoData: any, site: any): RichContext {
        const context: RichContext = {
            description: '',
            keywords: [],
            themes: [],
            trends: []
        };

        if (!seoData) {
            // Fallback si pas de données SEO
            context.description = site.description || `Site web de ${site.name}`;
            return context;
        }

        // 1. Description & Value Prop
        context.description = seoData.metaDescriptions?.description ||
            seoData.titleTags?.title ||
            `Site web proposant des services de ${site.name}`;

        // 2. Thèmes & Piliers
        if (seoData.contentStrategy?.themes) {
            context.themes = seoData.contentStrategy.themes;
        }

        // 3. Mots-clés (Mélange de high volume et long tail)
        const keywords = new Set<string>();
        if (seoData.keywordAnalysis) {
            seoData.keywordAnalysis.slice(0, 8).forEach((k: any) => keywords.add(k.keyword));
        }
        if (seoData.contentStrategy?.longTailKeywords) {
            seoData.contentStrategy.longTailKeywords.slice(0, 8).forEach((k: string) => keywords.add(k));
        }
        context.keywords = Array.from(keywords);

        // 4. Trends
        if (seoData.contentStrategy?.trendingKeywords) {
            context.trends = seoData.contentStrategy.trendingKeywords
                .map((k: any) => k.keyword + (k.seasonality ? ` (${k.seasonality})` : ''));
        }

        // 5. Info Locale
        if (seoData.contentStrategy?.localOpportunities && seoData.contentStrategy.localOpportunities.length > 0) {
            context.localInfo = seoData.contentStrategy.localOpportunities.join(', ');
        }

        // 6. Audience (Inférence basique si non présente, à améliorer avec plus d'analyse)
        // On pourrait deviner l'audience via les mots clés, pour l'instant on laisse générique

        return context;
    }

    /**
     * Récupère le programme social d'un site
     */
    async getSocialProgram(siteId: number): Promise<SocialProgram | null> {
        const site = await supabaseService.getSiteById(siteId);
        return site?.socialParams as SocialProgram | null;
    }

    /**
     * Met à jour le programme social d'un site
     */
    async updateSocialProgram(siteId: number, program: SocialProgram): Promise<void> {
        await supabaseService.updateSite(siteId, {
            socialParams: program
        });
        console.log(`✅ Programme social mis à jour pour site ${siteId}`);
    }
}

// Interface pour le contexte enrichi
interface RichContext {
    description: string;
    keywords: string[];
    themes: string[];
    trends: string[];
    localInfo?: string;
    audience?: string;
}

export const contentCalendarService = new ContentCalendarService();
