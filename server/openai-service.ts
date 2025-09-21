import OpenAI from "openai";
import { airtableService } from "./airtable-service";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

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
   * Récupère le prompt système actif depuis Airtable ou utilise un fallback
   */
  private async getSystemPrompt(): Promise<{ systemMessage: string; outputStructure: string }> {
    try {
      console.log('🔍 Récupération du prompt système actif depuis Airtable...');
      const activePrompt = await airtableService.getActiveSystemPrompt();
      
      if (activePrompt && activePrompt.promptSystem) {
        console.log('✅ Prompt système actif récupéré:', activePrompt.nom || 'Sans nom');
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
   * Génère ou régénère un article avec GPT-4o basé sur les mots-clés et paramètres
   */
  async generateArticle(request: ArticleGenerationRequest): Promise<GeneratedArticle> {
    try {
      // Récupérer le prompt système depuis Airtable
      const { systemMessage, outputStructure } = await this.getSystemPrompt();
      
      const isRegeneration = !!request.existingContent;
      
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
Mots-clés à optimiser : ${request.keywords.join(', ')}
${request.targetAudience ? `Public cible : ${request.targetAudience}` : ''}
${request.tone ? `Ton souhaité : ${request.tone}` : ''}

Instructions :
- Améliore le contenu existant tout en gardant l'intention originale
- Intègre naturellement les mots-clés fournis
- Optimise pour le SEO sans sacrifier la qualité
- Garde un style engageant et authentique
- Adapte la longueur au type de contenu (court pour Twitter/Instagram, plus long pour articles/newsletters)

Réponds en JSON avec ce format exact :
${outputFormat}`;
      } else {
        prompt = `Génère un nouveau contenu optimisé basé sur les paramètres fournis.

Type de contenu : ${request.contentType}
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

Réponds en JSON avec ce format exact :
${outputFormat}`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemMessage
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        title: result.title || 'Titre généré',
        content: result.content || 'Contenu généré',
        suggestions: result.suggestions || []
      };

    } catch (error) {
      console.error('Erreur lors de la génération avec OpenAI:', error);
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: keywordSystemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.keywords || [];

    } catch (error) {
      console.error('Erreur lors de la suggestion de mots-clés:', error);
      return [];
    }
  }

  /**
   * Génère une image avec DALL-E 3 basée sur le contenu et le type
   */
  async generateImage(contentText: string, typeContent: string): Promise<{ imageUrl: string }> {
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