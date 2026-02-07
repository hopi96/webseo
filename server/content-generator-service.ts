/**
 * Service de génération de contenu par plateforme
 * Remplace le workflow n8n "content management" - partie génération contenu
 */

import OpenAI from 'openai';
import { supabaseService } from './supabase-service';
import type { CalendarEntry } from './content-calendar-service';

// Types
export interface ContentGenerationRequest {
    siteId: number;
    platform: string;
    theme: string;
    context: string;
    publicationDate: string;
    generateImage?: boolean;
}

export interface GeneratedContent {
    id?: number;
    siteId: number;
    platform: string;
    contentText: string;
    hasImage: boolean;
    imageUrl?: string;
    imageSource?: 'ai' | 'upload';
    status: string;
    publicationDate: string;
}

// Prompts système avancés par plateforme
const buildSystemPrompt = (platform: string, context: string = ''): string => {
    const baseIdentity = `Tu es un Expert Créateur de Contenu Senior spécialisé sur ${platform}.
Ton objectif est de produire un post à fort potentiel de viralité et d'engagement pour la marque décrite ci-dessous.

MARQUE :
${context}

Ta plume doit être irréprochable, adaptée à l'audience, et apporter une réelle valeur ajoutée.`;

    switch (platform.toLowerCase()) {
        case 'newsletter':
            return `${baseIdentity}

STRUCTURE DE LA NEWSLETTER :
1. **Objet (Subject Line)** : Court, intrigant, impossible à ignorer (max 50 caractères).
2. **Preheader** : Complète l'objet pour inciter au clic.
3. **Introduction** : Personnelle et accrocheuse. Pose le problème ou le contexte.
4. **Corps (Body)** : Apporte de la valeur (Conseils, Histoire, Nouveauté). Utilise des sauts de ligne pour la lisibilité.
   - Utilise une structure H2 claire pour séparer les idées.
5. **Call to Action (CTA)** : Unique et clair. Qu'attend-on du lecteur ?

TON : Proche, expert, mais accessible. Pas de jargon inutile.`;

        case 'instagram':
            return `${baseIdentity}

GUIDE DE RÉDACTION INSTAGRAM :
1. **Le Hook (Accroche)** : La première phrase doit stopper le scroll. (Ex: "Arrêtez de faire ça...", "Le secret que personne ne vous dit...").
2. **La Valeur** : Développe le sujet de manière concise. Utilise des listes à puces (emojis) si possible.
3. **L'Interaction** : Pose une question engageante à la fin pour les commentaires.
4. **Hashtags** : Sélectionne 25-30 hashtags ultra-ciblés (mélange de niche et de volume moyen). Mettez-les à la fin.
5. **Suggestion Visuelle** : Décris précisément l'image ou le Réel qui doit accompagner ce texte pour maximiser l'impact.

TON : Visuel, dynamique, authentique.`;

        case 'facebook':
            return `${baseIdentity}

GUIDE DE RÉDACTION FACEBOOK :
1. **L'Accroche** : Doit susciter l'émotion ou la curiosité immédiate.
2. **Le Contenu** : Raconte une histoire (Storytelling). Facebook est une plateforme sociale et communautaire. Les gens veulent du vécu, des avis, des histoires.
   - Longueur modérée (300-800 caractères).
3. **Engagement** : Invite à partager son expérience ou à identifier un ami.

TON : Communautaire, chaleureux, conversationnel.`;

        case 'linkedin':
            return `${baseIdentity}

GUIDE DE RÉDACTION LINKEDIN (Format "Bro-etry" ou Expert) :
1. **La "Punchline"** : Une phrase courte et percutante en haut.
2. **L'Espace blanc** : Aère ton texte. Une idée par paragraphe. Rend la lecture fluide sur mobile.
3. **Le Développement** : Apporte une expertise concrète, une leçon apprise, ou une opinion tranchée sur le secteur.
4. **La Conclusion** : Résume la valeur en une phrase.
5. **Le CTA** : "Et vous, qu'en pensez-vous ?" ou similaire pour lancer le débat.

TON : Professionnel, Leader d'opinion, Inspirant. Évite le langage trop "commercial".`;

        case 'xtwitter':
            return `${baseIdentity}

GUIDE DE RÉDACTION X (Twitter) :
1. **Si Thread** : Le premier tweet est vital. Il doit promettre une valeur immédiate ("Voici comment X en 5 étapes").
2. **Concision** : Chaque mot doit payer son loyer. Pas de remplissage.
3. **Rythme** : Phrases punchy.
4. **Hashtags** : 1 ou 2 maximum, pas plus.

TON : Incisif, Direct, "Thought Leader".`;

        case 'pinterest':
            return `${baseIdentity}

GUIDE DE RÉDACTION PINTEREST :
1. **Titre** : Doit contenir les mots-clés SEO (C'est un moteur de recherche visuel).
2. **Description** : Inspire l'utilisateur. Explique pourquoi cette épingle va améliorer sa vie/projet.
3. **Mots-clés** : Intègre les variantes longue traîne naturellement.
4. **Idée Visuelle** : Décris l'épingle parfaite (Texte sur l'image, couleurs, composition).

TON : Inspirationnel, "Life-changing", Esthétique.`;

        case 'google my business':
            return `${baseIdentity}

GUIDE DE RÉDACTION GOOGLE MY BUSINESS :
1. **Info Clé** : Quoi ? Quand ? Où ? (Offre, Event, Nouveauté).
2. **SEO Local** : Mentionne la ville, le quartier, le service précis.
3. **Action** : Tout le post doit mener au bouton (Appeler, Réserver, Itinéraire).

TON : Informatif, Local, Accueillant.`;

        case 'youtube':
            return `${baseIdentity}

GUIDE DE SCRIPT YOUTUBE :
1. **Hook (0-15s)** : Promesse de la vidéo. "Dans cette vidéo, vous allez découvrir..."
2. **Intro Générique** : Très courte.
3. **Contenu (Le "Meat")** : Structuré en points clés.
4. **Engagement** : "Abonnez-vous" placé stratégiquement APRES avoir donné de la valeur.
5. **Outro** : Résumé + Prochaine vidéo à regarder.

Génère aussi le **Titre** (Clickbait mais honnête) et la **Description SEO**.`;

        case 'tiktok':
            return `${baseIdentity}

GUIDE DE SCRIPT TIKTOK :
1. **Hook Visuel et Sonore** : Qu'est-ce qu'on voit/entend dès la première seconde ?
2. **Structure** : Situation Initiale -> Problème -> Solution (Le produit/service) -> Résultat.
3. **Durée** : Optimise pour 30-45 secondes.
4. **Tendances** : Suggère une musique ou un type de montage tendance.

TON : Rapide, Divertissant, "UGC" (User Generated Content).`;

        default:
            return `${baseIdentity}
            
Génère un contenu optimisé pour cette plateforme avec une structure claire : Accroche, Valeur, Appel à l'action.`;
    }
};

// Initialisation OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export class ContentGeneratorService {

    /**
     * Génère le contenu pour une seule entrée du calendrier
     */
    async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
        console.log(`📝 Génération contenu ${request.platform} pour site ${request.siteId}`);
        console.log(`   Thème: ${request.theme}`);
        console.log(`   Date publication: ${request.publicationDate}`);

        // 1. Récupérer le prompt système (personnalisé ou par défaut)
        const systemPrompt = await this.getSystemPrompt(request.platform, request.siteId);
        console.log('🤖 SYSTEM PROMPT GENERATED:');
        console.log(systemPrompt);
        console.log('--------------------------------');

        // 2. Générer le contenu via OpenAI
        const contentText = await this.callOpenAI(systemPrompt, request);

        // 3. Générer une image si demandé (Instagram, Pinterest)
        let imageUrl: string | undefined;
        let imageSource: 'ai' | 'upload' | undefined;

        if (request.generateImage || ['instagram', 'pinterest'].includes(request.platform)) {
            try {
                imageUrl = await this.generateImage(contentText, request.platform);
                imageSource = 'ai';
            } catch (error) {
                console.warn('⚠️ Génération image échouée:', error);
            }
        }

        // 4. Sauvegarder dans Supabase
        const content = await supabaseService.createContent({
            idSite: request.siteId,
            typeContent: request.platform,
            contentText,
            hasImage: !!imageUrl,
            imageUrl,
            imageSource,
            statut: 'en attente',
            dateDePublication: request.publicationDate
        });

        console.log(`💾 Sauvegarde en cours... Date: ${request.publicationDate}`);

        console.log(`✅ Contenu créé: ID ${content.id}`);

        return {
            id: content.id as number,
            siteId: request.siteId,
            platform: request.platform,
            contentText,
            hasImage: !!imageUrl,
            imageUrl,
            imageSource,
            status: 'en attente',
            publicationDate: request.publicationDate
        };
    }

    /**
     * Génère le contenu pour un batch d'entrées du calendrier
     */
    async generateBatch(calendarEntries: CalendarEntry[]): Promise<{
        generated: number;
        errors: number;
        contents: GeneratedContent[];
    }> {
        console.log(`🚀 Génération batch: ${calendarEntries.length} contenus`);

        const contents: GeneratedContent[] = [];
        let errors = 0;

        for (const entry of calendarEntries) {
            console.log(`🔄 Traitement entrée: ${entry.plateforme} - ${entry.date_de_publication}`);
            try {
                const content = await this.generateContent({
                    siteId: entry.id_site,
                    platform: entry.plateforme,
                    theme: entry.theme_de_publication,
                    context: entry.contexte,
                    publicationDate: entry.date_de_publication
                });
                contents.push(content);

                // Pause pour éviter les rate limits OpenAI
                await this.delay(1000);
            } catch (error) {
                console.error(`❌ Erreur génération pour ${entry.plateforme} (${entry.date_de_publication}):`, error);
                errors++;
            }
        }

        console.log(`✅ Batch terminé: ${contents.length} générés, ${errors} erreurs`);
        return { generated: contents.length, errors, contents };
    }

    /**
     * Appelle OpenAI pour générer le contenu
     */
    private async callOpenAI(systemPrompt: string, request: ContentGenerationRequest): Promise<string> {
        // Construction du prompt utilisateur avec le contexte spécifique du post
        const userPrompt = `DÉTAILS DU POST À CRÉER :
Thème: ${request.theme}
Contexte/Angle: ${request.context}
Date de publication: ${request.publicationDate}

MISSION: Rédige le contenu final prêt à être publié.
N'ajoute pas de guillemets autour du texte.
N'ajoute pas de texte d'introduction type "Voici le post".`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Pas de réponse OpenAI');
        }

        // Nettoyer le markdown si présent
        return this.cleanContent(content);
    }

    /**
     * Génère une image via DALL-E 3
     */
    async generateImage(contentText: string, platform: string): Promise<string> {
        console.log(`🎨 Génération image DALL-E pour ${platform}`);

        // D'abord, générer un prompt d'image à partir du contenu
        const promptResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Tu génères des prompts pour DALL-E 3. Réponds uniquement avec le prompt, sans explication.'
                },
                {
                    role: 'user',
                    content: `Génère un prompt DALL-E 3 pour créer une image professionnelle pour ce post ${platform}:\n\n${contentText.substring(0, 500)}`
                }
            ],
            temperature: 0.7
        });

        const imagePrompt = promptResponse.choices[0]?.message?.content || contentText.substring(0, 200);

        // Générer l'image
        const imageResponse = await openai.images.generate({
            model: 'dall-e-3',
            prompt: imagePrompt,
            n: 1,
            size: platform === 'pinterest' ? '1024x1792' : '1024x1024',
            quality: 'standard'
        });

        const imageUrl = imageResponse.data?.[0]?.url;
        if (!imageUrl) {
            throw new Error('Pas d\'URL image retournée');
        }

        console.log(`✅ Image générée avec succès`);
        return imageUrl;
    }

    /**
     * Récupère le prompt système (personnalisé depuis DB ou par défaut)
     * Enriched with dynamic context construction
     */
    private async getSystemPrompt(platform: string, siteId: number): Promise<string> {
        let contextString = '';

        try {
            // Récupérer les infos du site pour enrichir le prompt
            const site = await supabaseService.getSiteById(siteId);
            if (site) {
                // Essayer de construire un contexte à partir de l'analyse SEO ou des infos de base
                const seoData = site.seoAnalysis;
                const description = seoData?.metaDescriptions?.description || `Site: ${site.name} (${site.url})`;

                contextString = `Nom: ${site.name}
URL: ${site.url}
Description: ${description}`;

                if (seoData?.contentStrategy?.themes) {
                    contextString += `\nThèmes: ${seoData.contentStrategy.themes.join(', ')}`;
                }
            }
        } catch (err) {
            console.warn('⚠️ Erreur récupération contexte site:', err);
        }

        try {
            // Chercher un prompt personnalisé (SITE-SPÉCIFIQUE ou global) pour cette plateforme
            // La méthode getSitePrompt cherche d'abord un prompt spécifique au site,
            // puis fallback sur le prompt global si non trouvé
            const customPrompt = await supabaseService.getSitePrompt(siteId, platform);

            if (customPrompt?.promptSystem) {
                console.log(`✅ Prompt récupéré pour ${platform}: ${customPrompt.promptSystem.substring(0, 50)}...`);
                // Combiner le prompt custom avec le contexte du site
                return customPrompt.promptSystem + (contextString ? `\n\nCONTEXTE SITE:\n${contextString}` : '');
            }
        } catch (error) {
            console.warn('⚠️ Erreur récupération prompt DB, utilisation par défaut');
        }

        // Fallback: Retourner le prompt construit dynamiquement (en dur)
        console.log(`📋 Utilisation du prompt par défaut pour ${platform}`);
        return buildSystemPrompt(platform, contextString);
    }

    /**
     * Nettoie le contenu généré (enlève les markdown blocks, etc.)
     */
    private cleanContent(content: string): string {
        return content
            .replace(/```json\n?/g, '')
            .replace(/```html\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
    }

    /**
     * Utilitaire de délai
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const contentGeneratorService = new ContentGeneratorService();
