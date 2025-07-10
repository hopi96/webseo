import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface ArticleGenerationRequest {
  keywords: string[];
  topic?: string;
  contentType: string; // twitter, instagram, article, newsletter
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
   * Génère ou régénère un article avec GPT-4o basé sur les mots-clés et paramètres
   */
  async generateArticle(request: ArticleGenerationRequest): Promise<GeneratedArticle> {
    try {
      const isRegeneration = !!request.existingContent;
      
      let prompt = "";
      
      if (isRegeneration) {
        prompt = `Tu es un expert en création de contenu éditorial et SEO. Régénère et améliore ce contenu existant en l'optimisant pour les mots-clés fournis.

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
{
  "title": "Titre optimisé du contenu",
  "content": "Contenu régénéré et optimisé",
  "suggestions": ["3 suggestions d'amélioration spécifiques"]
}`;
      } else {
        prompt = `Tu es un expert en création de contenu éditorial et SEO. Génère un nouveau contenu optimisé basé sur les paramètres fournis.

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
{
  "title": "Titre accrocheur du contenu",
  "content": "Contenu complet généré",
  "suggestions": ["3 suggestions d'optimisation SEO"]
}`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en création de contenu éditorial et SEO. Réponds toujours en JSON valide avec les champs demandés."
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
            content: "Tu es un expert SEO. Réponds toujours en JSON valide."
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