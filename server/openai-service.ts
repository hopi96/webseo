import OpenAI from "openai";
import { supabaseService } from "./supabase-service";
import { extractClaudeText, getClaudeModel, requireAnthropic } from "./claude-client";

let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} else {
  console.warn('⚠️ OPENAI_API_KEY non configurée. La génération d\'images et le test OpenAI seront désactivés.');
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️ ANTHROPIC_API_KEY non configurée. La génération de contenu via Claude sera désactivée.');
}

const CONTENT_GEN_DEBUG = process.env.CONTENT_GEN_DEBUG === 'true';

const countWords = (text: string): number => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return 0;
  return normalized.split(' ').length;
};

if (CONTENT_GEN_DEBUG) {
  console.log('🧠 Content generation debug logs enabled (CONTENT_GEN_DEBUG=true).');
}

export interface ArticleGenerationRequest {
  keywords: string[];
  topic?: string;
  contentType: string; // newsletter, tiktok, instagram, xtwitter, youtube, facebook, blog
  targetAudience?: string;
  tone?: string;
  existingContent?: string;
}

export interface GeneratedArticle {
  title: string;
  content: string;
  suggestions: string[];
}

export class OpenAIService {

  /**
   * Récupère le prompt système actif depuis Supabase ou utilise un fallback
   */
  private async getSystemPrompt(): Promise<{ systemMessage: string; outputStructure: string }> {
    try {
      console.log('🔍 Récupération du prompt système actif depuis Supabase...');
      const prompts = await supabaseService.getAllSystemPrompts();

      // Chercher un prompt marqué comme "General" ou prendre le premier
      const activePrompt = prompts.find(p => p.nom?.toLowerCase().includes('general') || p.actif) || prompts[0];

      if (activePrompt && activePrompt.promptSystem) {
        console.log('✅ Prompt système actif récupéré from Supabase');
        return {
          systemMessage: activePrompt.promptSystem,
          outputStructure: activePrompt.structureSortie || ''
        };
      } else {
        console.log('⚠️ Aucun prompt système actif trouvé, utilisation du prompt par défaut');
        return {
          systemMessage: "Tu es un expert en création de contenu éditorial et SEO. Réponds toujours en JSON valide avec les champs demandés.",
          outputStructure: ''
        };
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du prompt système, utilisation du fallback:', error);
      return {
        systemMessage: "Tu es un expert en création de contenu éditorial et SEO. Réponds toujours en JSON valide avec les champs demandés.",
        outputStructure: ''
      };
    }
  }

  /**
   * Génère ou régénère un article avec Claude basé sur les mots-clés et paramètres
   */
  async generateArticle(request: ArticleGenerationRequest): Promise<GeneratedArticle> {
    try {
      const anthropic = requireAnthropic();
      // Récupérer le prompt système depuis Airtable
      const { systemMessage, outputStructure } = await this.getSystemPrompt();

      const isRegeneration = !!request.existingContent;
      const platformGuidelines = this.getPlatformGuidelines(request.contentType);

      let prompt = "";

      // Intégrer la structure de sortie si disponible
      const outputFormat = outputStructure || `{
  "title": "Titre ${isRegeneration ? 'optimisé' : 'accrocheur'} du contenu",
  "content": "Contenu ${isRegeneration ? 'régénéré et optimisé' : 'complet généré'}",
  "suggestions": ["3 suggestions d'${isRegeneration ? 'amélioration spécifiques' : 'optimisation SEO'}"]
}`;

      if (isRegeneration) {
        prompt = `Régénère et améliore ce contenu existant en l'optimisant pour les mots-clés fournis.

Contenu existant : "${request.existingContent}"

Type de contenu : ${request.contentType}
Contraintes de plateforme :
${platformGuidelines}

Mots-clés à optimiser : ${request.keywords.join(', ')}
${request.targetAudience ? `Public cible : ${request.targetAudience}` : ''}
${request.tone ? `Ton souhaité : ${request.tone}` : ''}

Instructions :
- Améliore le contenu existant tout en gardant l'intention originale
- Intègre naturellement les mots-clés fournis
- Optimise pour le SEO sans sacrifier la qualité
- Garde un style engageant et authentique
- Adapte la longueur au type de contenu (court pour Twitter/Instagram, plus long pour articles/newsletters)
- Respecte strictement les contraintes de la plateforme
- Le contenu doit être prêt à publier (aucune explication ou méta-texte)

Réponds en JSON avec ce format exact :
${outputFormat}`;
      } else {
        prompt = `Génère un nouveau contenu optimisé basé sur les paramètres fournis.

Type de contenu : ${request.contentType}
Contraintes de plateforme :
${platformGuidelines}

Mots-clés principaux : ${request.keywords.join(', ')}
${request.topic ? `Sujet principal : ${request.topic}` : ''}
${request.targetAudience ? `Public cible : ${request.targetAudience}` : ''}
${request.tone ? `Ton souhaité : ${request.tone}` : ''}

Instructions :
- Crée un contenu original et engageant
- Intègre naturellement les mots-clés fournis
- Optimise pour le SEO sans sur-optimisation
- Adapte le style et la longueur au type de contenu
- Utilise un langage accessible et captivant
- Respecte strictement les contraintes de la plateforme
- Le contenu doit être prêt à publier (aucune explication ou méta-texte)

Réponds en JSON avec ce format exact :
${outputFormat}`;
      }

      if (CONTENT_GEN_DEBUG) {
        console.log('🧠 [Claude][Article] Request', {
          model: getClaudeModel(),
          max_tokens: 12000,
          temperature: 0.7,
          contentType: request.contentType,
          targetAudience: request.targetAudience,
          tone: request.tone,
          keywordsCount: request.keywords?.length || 0,
          hasExistingContent: Boolean(request.existingContent)
        });
        console.log('🧠 [Claude][Article] System prompt:\n' + systemMessage);
        console.log('🧠 [Claude][Article] Platform guidelines:\n' + platformGuidelines);
        console.log('🧠 [Claude][Article] User prompt:\n' + prompt);
      }

      const response = await anthropic.messages.create({
        model: getClaudeModel(),
        max_tokens: 12000,
        system: systemMessage,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      });

      const content = extractClaudeText(response);
      if (!content) {
        throw new Error('Pas de réponse Claude');
      }

      const result = this.parseJsonResponse(content) ?? {};

      const finalTitle = this.pickString(result.title, 'Titre généré');
      const finalContent = this.pickString(result.content, 'Contenu généré');
      const finalSuggestions = this.pickStringArray(result.suggestions);

      if (CONTENT_GEN_DEBUG) {
        console.log('🧠 [Claude][Article] Usage', response.usage);
        console.log('🧠 [Claude][Article] Stop reason', response.stop_reason);
        console.log('🧠 [Claude][Article] Output stats', {
          words: countWords(finalContent),
          characters: finalContent.length,
          suggestions: finalSuggestions.length
        });
      }

      return {
        title: finalTitle,
        content: finalContent,
        suggestions: finalSuggestions
      };

    } catch (error) {
      console.error('Erreur lors de la génération avec Claude:', error);
      throw new Error(`Impossible de générer le contenu: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Génère des suggestions de mots-clés basées sur un sujet
   */
  async suggestKeywords(topic: string, contentType: string): Promise<string[]> {
    try {
      // Récupérer le prompt système depuis Airtable (avec un fallback spécialisé pour les mots-clés)
      const { systemMessage } = await this.getSystemPrompt();

      // Si le prompt système est générique, utiliser un prompt spécialisé pour SEO
      const keywordSystemPrompt = systemMessage.includes('mots-clés') || systemMessage.includes('SEO')
        ? systemMessage
        : "Tu es un expert SEO spécialisé dans la recherche de mots-clés. Réponds toujours en JSON valide.";

      const prompt = `Génère une liste de mots-clés pertinents pour un contenu de type "${contentType}" sur le sujet "${topic}".

Instructions :
- Propose 10 mots-clés pertinents et recherchés
- Inclus des mots-clés longue traîne
- Adapte au contexte français
- Privilégie les mots-clés avec un bon potentiel SEO

Réponds en JSON avec ce format exact :
{
  "keywords": ["mot-clé 1", "mot-clé 2", ...]
}`;

      const anthropic = requireAnthropic();
      const response = await anthropic.messages.create({
        model: getClaudeModel(),
        max_tokens: 500,
        system: keywordSystemPrompt,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5
      });

      const content = extractClaudeText(response);
      const result = content ? this.parseJsonResponse(content) : null;
      return this.pickStringArray(result?.keywords);

    } catch (error) {
      console.error('Erreur lors de la suggestion de mots-clés (Claude):', error);
      return [];
    }
  }

  /**
   * Adapte et enrichit un prompt système pour un sujet spécifique
   */
  async adaptSystemPrompt(basePrompt: string, topic: string, platform: string): Promise<string> {
    try {
      const anthropic = requireAnthropic();

      const systemMessage = `Tu es un expert en ingénierie de prompt (Prompt Engineer) spécialisé dans la création de contenu pour le web.
Ton rôle est de prendre un prompt système de base et de l'hyper-spécialiser pour un sujet précis, en y ajoutant des directives pour une recherche approfondie.`;

      const prompt = `Voici un prompt système de base conçu pour la plateforme "${platform}" :
"""
${basePrompt}
"""

Je veux générer du contenu sur le sujet exact suivant : "${topic}"

Ta tâche :
Réécris et enrichis ce prompt système de base pour qu'il soit parfaitement adapté à ce sujet.
Ajoute spécifiquement des directives exigeant de l'IA (qui exécutera ce prompt) qu'elle effectue une recherche approfondie sur ce sujet précis.
Le résultat doit être un prompt DIRECT (sans méta-commentaire comme "Voici le prompt...") prêt à être exécuté.

Le prompt enrichi DOIT inclure des consignes comme :
- "Agis comme un expert incontesté sur le sujet de [Sujet]"
- "Effectue une analyse profonde et factuelle"
- "Utilise un angle original et évite les banalités"
- Garder toutes les consignes de formatage du prompt de base relatives à la plateforme.

Renvoie UNIQUEMENT le texte du nouveau prompt.`;

      if (CONTENT_GEN_DEBUG) {
        console.log(`🧠 [Claude][AdaptPrompt] Sujet: ${topic}, Plateforme: ${platform}`);
      }

      const response = await anthropic.messages.create({
        model: getClaudeModel(),
        max_tokens: 4000,
        system: systemMessage,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      });

      const content = extractClaudeText(response);
      return content ? content.trim() : basePrompt;

    } catch (error) {
      console.error('❌ Erreur lors de l\'adaptation du prompt:', error);
      // Fallback: On retourne le prompt de base en cas d'erreur
      return basePrompt;
    }
  }

  private parseJsonResponse(content: string): Record<string, unknown> | null {
    const cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .trim();

    try {
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1 || end <= start) {
        return null;
      }
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
  }

  private getPlatformGuidelines(contentType: string): string {
    const platform = (contentType || '').toLowerCase();
    switch (platform) {
      case 'newsletter':
        return `Format attendu :
- Objet (max 50 caractères) et Preheader.
- Introduction courte.
- Corps structuré avec titres (H2) et paragraphes aérés.
- CTA unique et clair.
Ton : proche, expert, accessible.
Inclure "Objet:" et "Preheader:" dans le contenu.`;
      case 'instagram':
        return `Format attendu :
- Hook fort dès la 1ère phrase.
- Valeur concise (listes courtes possibles).
- Question finale pour commentaires.
- 12 à 25 hashtags ciblés en fin de post.
Ton : visuel, dynamique, authentique.
Ne dépasse pas ~1 200 caractères.`;
      case 'facebook':
        return `Format attendu :
- Accroche émotionnelle ou curieuse.
- Storytelling avec ton chaleureux.
- Longueur 300-800 caractères.
- Invitation à commenter/partager/identifier.`;
      case 'linkedin':
        return `Format attendu :
- Punchline d'ouverture.
- Paragraphes très courts (lecture mobile).
- Expertise concrète / opinion tranchée.
- Conclusion + question de débat.
Ton : professionnel, leader d'opinion.`;
      case 'xtwitter':
        return `Format attendu :
- Texte ultra-concis.
- Si thread : 3 à 7 tweets séparés par des sauts de ligne, avec un 1er tweet accrocheur.
- 1 à 2 hashtags maximum.
Ton : incisif, direct.`;
      case 'pinterest':
        return `Format attendu :
- Titre SEO + description inspirante.
- Mots-clés longue traîne intégrés naturellement.
- Mentionner l'idée visuelle en une ligne.`;
      case 'google my business':
        return `Format attendu :
- Quoi/Quand/Où clairement.
- Mention de la ville/quartier et service.
- CTA vers Appeler/Réserver/Itinéraire.
Ton : informatif, local, accueillant.`;
      case 'youtube':
        return `Format attendu :
- Script avec Hook (0-15s), Intro courte, Corps structuré, CTA abonnement, Outro.
- Inclure "Titre:" et "Description SEO:" dans le contenu.`;
      case 'tiktok':
        return `Format attendu :
- Script 30-45s.
- Hook visuel/sonore dès 1ère seconde.
- Structure Problème → Solution → Résultat.
- Mentionner une tendance ou un style de montage.`;
      case 'blog':
      case 'article':
        return `Format attendu :
- Titre clair.
- Introduction, sections H2/H3, listes si utile, conclusion.
- Ton pédagogique et SEO.`;
      default:
        return `Respecte les codes de la plateforme et livre un contenu prêt à publier.`;
    }
  }

  private pickString(value: unknown, fallback: string): string {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    return fallback;
  }

  private pickStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
  }

  /**
   * Génère une image avec DALL-E 3 basée sur le contenu et le type
   */
  async generateImage(contentText: string, typeContent: string): Promise<{ imageUrl: string }> {
    if (!openai) {
      throw new Error('OpenAI non configuré. Veuillez définir la variable OPENAI_API_KEY.');
    }
    try {
      // Créer un prompt optimisé pour DALL-E 3 basé sur le contenu et le type
      let imagePrompt = "";

      switch (typeContent) {
        case "xtwitter":
          imagePrompt = `Créer une image moderne et engageante pour Twitter avec un style épuré et professionnel. L'image doit illustrer visuellement le concept suivant : "${contentText}". Style : minimal, couleurs vives, typographie moderne, format carré optimisé pour les réseaux sociaux.`;
          break;
        case "instagram":
          imagePrompt = `Créer une image esthétique et visuellement attrayante pour Instagram. L'image doit représenter de manière créative et artistique : "${contentText}". Style : photography-like, couleurs saturées, composition équilibrée, format carré, tendance Instagram.`;
          break;
        case "facebook":
          imagePrompt = `Créer une image accrocheuse pour Facebook qui illustre clairement : "${contentText}". Style : moderne, accessible, couleurs harmonieuses, format rectangulaire, adapté au partage social.`;
          break;
        case "tiktok":
          imagePrompt = `Créer une image verticale et dynamique pour TikTok représentant : "${contentText}". Style : moderne, vibrant, couleurs vives, format vertical, tendance TikTok.`;
          break;
        case "youtube":
          imagePrompt = `Créer une miniature YouTube accrocheuse illustrant : "${contentText}". Style : professionnel, couleurs vives, format rectangulaire, haute qualité.`;
          break;
        case "blog":
          imagePrompt = `Créer une image d'en-tête de blog professionnelle illustrant : "${contentText}". Style : éditorial, moderne, couleurs neutres, format bannière, qualité web.`;
          break;
        case "google my business":
          imagePrompt = `Créer une image professionnelle pour Google My Business illustrant : "${contentText}". Style : professionnel, crédible, couleurs corporate, format adapté aux entreprises.`;
          break;
        case "pinterest":
          imagePrompt = `Créer une image verticale inspirante pour Pinterest représentant : "${contentText}". Style : esthétique, inspirant, couleurs douces, composition verticale, haute qualité visuelle.`;
          break;
        case "newsletter":
          imagePrompt = `Créer une image d'en-tête pour newsletter représentant : "${contentText}". Style : professionnel, clean, couleurs de marque, format email, lisible.`;
          break;
        default:
          imagePrompt = `Créer une image moderne et professionnelle illustrant : "${contentText}". Style : clean, moderne, couleurs harmonieuses, haute qualité.`;
      }

      console.log('🎨 Génération d\'image avec DALL-E 3 - Prompt:', imagePrompt);

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid",
      });

      const imageUrl = response.data[0].url;

      if (!imageUrl) {
        throw new Error("Aucune URL d'image retournée par DALL-E 3");
      }

      return { imageUrl };

    } catch (error) {
      console.error('Erreur lors de la génération d\'image avec DALL-E 3:', error);
      throw error;
    }
  }

  /**
   * Teste la connexion à l'API OpenAI
   */
  async testConnection(): Promise<boolean> {
    if (!openai) {
      console.warn('OpenAI non configuré.');
      return false;
    }
    try {
      await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Test de connexion" }],
        max_tokens: 10
      });
      return true;
    } catch (error) {
      console.error('Erreur de connexion OpenAI:', error);
      return false;
    }
  }
}

export const openaiService = new OpenAIService();
