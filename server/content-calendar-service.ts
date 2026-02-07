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

interface NormalizedPeriod {
    start: Date;
    end: Date;
    startDate: string;
    endDate: string;
    dateRange: string[];
    dateSet: Set<string>;
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


const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const FR_DATE_ONLY = /^(\d{2})[\/-](\d{2})[\/-](\d{4})$/;

function formatDateOnly(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateOnly(value: string | Date | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) {
        return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
    }
    if (typeof value !== 'string') return null;

    const isoMatch = ISO_DATE_ONLY.exec(value);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    }

    const frMatch = FR_DATE_ONLY.exec(value);
    if (frMatch) {
        const [, day, month, year] = frMatch;
        return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    }
            const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
        return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
    }

    return null;
}

function buildDateRange(start: Date, end: Date): string[] {
    const dates: string[] = [];
    const cursor = new Date(start.getTime());
    while (cursor.getTime() <= end.getTime()) {
        dates.push(formatDateOnly(cursor));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return dates;
}

function normalizePeriod(period: { startDate: string; endDate: string }): NormalizedPeriod {
    const start = parseDateOnly(period?.startDate);
    const end = parseDateOnly(period?.endDate);

    if (!start || !end) {
        throw new Error(`Periode invalide. Format attendu YYYY-MM-DD. Recu: ${period?.startDate} -> ${period?.endDate}`);
    }

    if (end.getTime() < start.getTime()) {
        throw new Error(`Periode invalide: la date de fin est anterieure a la date de debut (${formatDateOnly(start)} -> ${formatDateOnly(end)})`);
    }

    const startDate = formatDateOnly(start);
    const endDate = formatDateOnly(end);
    const dateRange = buildDateRange(start, end);

    return {
        start,
        end,
        startDate,
        endDate,
        dateRange,
        dateSet: new Set(dateRange)
    };
}

function calculatePostCount(period: NormalizedPeriod, frequency?: SocialProgramFrequency): number {
    const days = period.dateRange.length;
    if (days <= 0) return 0;

    const postsPerWeek = frequency?.posts_par_semaine ?? 0;
    const postsPerMonth = frequency?.posts_par_mois ?? 0;

    let count: number;
    if (postsPerWeek > 0) {
        count = Math.ceil((days / 7) * postsPerWeek);
    } else if (postsPerMonth > 0) {
        count = Math.ceil((days / 30) * postsPerMonth);
    } else {
        count = Math.ceil((days / 7) * 2); // défaut: ~2 posts/semaine
    }

    if (count < 1) count = 1;
    return count;
}

function buildDateSlots(period: NormalizedPeriod, count: number): string[] {
    if (count <= 0) return [];
    const days = period.dateRange.length;
    if (days === 0) return [];

    const slots: string[] = [];

    if (count <= days) {
        const step = days / count;
        for (let i = 0; i < count; i += 1) {
            const index = Math.min(days - 1, Math.floor(i * step));
            slots.push(period.dateRange[index]);
        }
        return slots;
    }

    for (let i = 0; i < count; i += 1) {
        slots.push(period.dateRange[i % days]);
    }

    return slots;
}


export class ContentCalendarService {

    /**
     * Callback type for progress reporting
     */
    public onProgress?: (progress: {
        percent: number;
        step: string;
        platform?: string;
        platformIndex?: number;
        totalPlatforms?: number;
    }) => void;

    /**
     * Génère un calendrier éditorial complet pour un site
     */
    async generateCalendar(request: CalendarGenerationRequest): Promise<CalendarEntry[]> {
        const normalizedPeriod = normalizePeriod(request.period);
        console.log(`📅 Génération calendrier pour site ${request.siteId}`);
        console.log(`   Période: ${normalizedPeriod.startDate} → ${normalizedPeriod.endDate}`);
        console.log(`   Plateformes: ${request.platforms.join(', ')}`);

        // Notify start
        this.emitProgress(5, 'Récupération des données du site...');

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

        this.emitProgress(10, 'Analyse des plateformes actives...');

        // 3. Filtrer les plateformes actives (fréquence > 0, par semaine OU par mois)
        const activePlatforms = request.platforms.filter(platform => {
            const frequency = socialProgram?.frequence_publication?.plateformes?.[platform];
            const postsPerWeek = frequency?.posts_par_semaine ?? 0;
            const postsPerMonth = frequency?.posts_par_mois ?? 0;

            // Une plateforme est active si elle a au moins une fréquence > 0
            if (postsPerWeek === 0 && postsPerMonth === 0) {
                console.log(`⏭️ Skip ${platform}: aucune fréquence configurée`);
                return false;
            }

            console.log(`✅ ${platform} actif: ${postsPerWeek} posts/semaine, ${postsPerMonth} posts/mois`);
            return true;
        });

        if (activePlatforms.length === 0) {
            this.emitProgress(100, 'Aucune plateforme active');
            console.log('⚠️ Aucune plateforme avec fréquence > 0');
            return [];
        }

        // 4. Générer le calendrier pour chaque plateforme active
        const allEntries: CalendarEntry[] = [];
        const progressPerPlatform = 80 / activePlatforms.length; // 80% réparti entre plateformes

        for (let i = 0; i < activePlatforms.length; i++) {
            const platform = activePlatforms[i];
            const frequency = socialProgram?.frequence_publication?.plateformes?.[platform];
            const postCount = calculatePostCount(normalizedPeriod, frequency);
            const dateSlots = buildDateSlots(normalizedPeriod, postCount);
            const postsPerWeek = frequency?.posts_par_semaine ?? 0;

            const baseProgress = 15 + (i * progressPerPlatform);
            this.emitProgress(
                Math.round(baseProgress),
                `Génération ${platform}...`,
                platform,
                i + 1,
                activePlatforms.length
            );

            console.log(`📝 Génération calendrier ${platform} (${postCount} idées planifiées)...`);

            const entries = await this.generatePlatformCalendar({
                siteId: request.siteId,
                siteName: site.name,
                siteUrl: site.url,
                platform,
                period: normalizedPeriod,
                dateSlots,
                frequency,
                context: richContext
            });

            allEntries.push(...entries);

            // Progress after platform complete
            this.emitProgress(
                Math.round(baseProgress + progressPerPlatform),
                `${platform} terminé (${entries.length} idées)`,
                platform,
                i + 1,
                activePlatforms.length
            );
        }

        this.emitProgress(100, `Calendrier terminé: ${allEntries.length} entrées`);
        console.log(`✅ Calendrier généré: ${allEntries.length} entrées`);
        return allEntries;
    }

    /**
     * Émet un événement de progression si un callback est défini
     */
    private emitProgress(
        percent: number,
        step: string,
        platform?: string,
        platformIndex?: number,
        totalPlatforms?: number
    ) {
        if (this.onProgress) {
            this.onProgress({ percent, step, platform, platformIndex, totalPlatforms });
        }
    }

    /**
     * Génère le calendrier pour une plateforme spécifique
     */
    private async generatePlatformCalendar(params: {
        siteId: number;
        siteName: string;
        siteUrl: string;
        platform: string;
        period: NormalizedPeriod;
        dateSlots: string[];
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

⚠️ CONTRAINTE ABSOLUE :
- Tu dois UNIQUEMENT proposer des idées de publications pour la période spécifiée.
- Ne fournis aucune date dans ta réponse.
- Si la période est courte (ex: 3 jours), génère peu de contenu.

TES OBJECTIFS :
1. DÉVELOPPER L'AUTORITÉ DE LA MARQUE : Utilise les thèmes d'expertise fournis.
2. MAXIMISER L'ENGAGEMENT : Propose des sujets qui incitent à la réaction (questions, débats, coulisses).
3. VARIER LES PLAISIRS : Alterne entre éducatif, promotionnel, inspirant et divertissant.
4. ADAPTER À LA PLATEFORME : Respecte les codes spécifiques de ${params.platform}.

RÈGLES D'OR :
- Pas de sujets génériques ("Bonne journée"). Chaque post doit apporter de la valeur.
- Utilise le contexte local si disponible.
- Exploite les mots-clés de manière naturelle.
- Respecte la période demandée (les dates seront assignées côté serveur).

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
            const entries = parsed.calendrier || parsed.calendar || parsed.ideas || [];

            if (!Array.isArray(entries) || entries.length === 0) {
                console.warn(`⚠️ Aucune idée retournée pour ${params.platform}`);
                return [];
            }

            const ideas = entries.map((entry: any) => ({
                id_site: params.siteId,
                plateforme: params.platform,
                theme_de_publication: entry.theme_de_publication || entry.theme || entry.title,
                contexte: entry.contexte || entry.context || ''
            })).filter((entry: CalendarEntry) => entry.theme_de_publication);

            if (ideas.length === 0) {
                console.warn(`⚠️ Idées invalides pour ${params.platform}`);
                return [];
            }

            const totalSlots = params.dateSlots.length;
            if (totalSlots === 0) {
                console.warn(`⚠️ Aucun slot de date disponible pour ${params.platform}`);
                return [];
            }

            if (ideas.length < totalSlots) {
                console.warn(`⚠️ ${ideas.length} idées retournées pour ${totalSlots} slots. Duplication des idées pour compléter.`);
            }

            const results: CalendarEntry[] = [];
            for (let i = 0; i < totalSlots; i += 1) {
                const idea = ideas[i % ideas.length];
                results.push({
                    ...idea,
                    date_de_publication: params.dateSlots[i]
                });
            }

            return results;

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
        period: NormalizedPeriod;
        dateSlots: string[];
        frequency?: SocialProgramFrequency;
        context: RichContext;
    }): string {
        // Calculer la fréquence correcte (mensuelle OU hebdomadaire)
        let frequencyText: string;
        let expectedPosts: number;

        if (params.frequency) {
            const postsPerWeek = params.frequency.posts_par_semaine ?? 0;
            const postsPerMonth = params.frequency.posts_par_mois ?? 0;

            if (postsPerWeek > 0) {
                // Mode hebdomadaire
                frequencyText = `Fréquence: ${postsPerWeek} posts par semaine`;
                expectedPosts = postsPerWeek * 4; // Environ par mois
            } else if (postsPerMonth > 0) {
                // Mode mensuel
                frequencyText = `Fréquence: ${postsPerMonth} posts par MOIS (publication mensuelle, pas hebdomadaire)`;
                expectedPosts = postsPerMonth;
            } else {
                frequencyText = 'Fréquence: 2 posts par semaine (par défaut)';
                expectedPosts = 8;
            }
        } else {
            frequencyText = 'Fréquence: 2 posts par semaine (par défaut)';
            expectedPosts = 8;
        }

        const context = params.context;

        // Calculer le nombre de jours dans la période
        const diffTime = Math.abs(params.period.end.getTime() - params.period.start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        return `CONTEXTE DE LA MARQUE :
Nom: ${params.siteName}
URL: ${params.siteUrl}
Description: ${context.description}
Secteur/Thèmes: ${context.themes.join(', ')}
${context.audience ? `Cible: ${context.audience}` : ''}
${context.localInfo ? `Ancrage Local: ${context.localInfo}` : ''}

⚠️ CONTRAINTE DE DATES OBLIGATOIRE :
- Date de DÉBUT : ${params.period.startDate}
- Date de FIN : ${params.period.endDate}
- Durée totale : ${diffDays} jour(s)
- TOUTES les dates de publication doivent être STRICTEMENT comprises entre ces deux dates incluses.
- NE GÉNÈRE AUCUN contenu avant ${params.period.startDate} ni après ${params.period.endDate}.

MISSION : Crée un calendrier éditorial pour **${params.platform}**.
${frequencyText}
Nombre d'idées à générer : ${params.dateSlots.length}

MOTS-CLÉS À INCLURE SUBTILEMENT :
${context.keywords.slice(0, 15).join(', ')}

TRENDS & SAISONNALITÉ :
${context.trends.length > 0 ? `Tendances actuelles : ${context.trends.join(', ')}` : 'Prends en compte la saisonnalité du moment.'}

Format de sortie JSON attendu:
{
  "calendrier": [
    {
      "theme_de_publication": "Titre accrocheur du post",
      "contexte": "Brief détaillé pour le rédacteur : Quel est l'angle ? Quel est le but (Vente, Engagement, Notoriété) ? Quel ton adopter ? Information clé à mentionner."
    }
  ]
}

RAPPEL FINAL : Ne fournis AUCUNE date, seulement des idées.`;
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



















