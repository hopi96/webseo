/**
 * Service d'analyse GEO (Generative Engine Optimization)
 * Évalue l'optimisation du contenu pour les moteurs de recherche IA
 * (Google AI Overview, Bing Chat, Perplexity, ChatGPT, etc.)
 */

import OpenAI from 'openai';

// Types pour l'analyse GEO
export interface GEOAnalysisResult {
    geoScore: number;
    factors: {
        directAnswers: GEOFactor;
        structuredContent: GEOFactor;
        authoritySignals: GEOFactor;
        entityClarity: GEOFactor;
        freshness: GEOFactor;
        conciseness: GEOFactor;
        semanticDepth: GEOFactor;
    };
    recommendations: GEORecommendation[];
    analyzedAt: string;
}

export interface GEOFactor {
    score: number;        // 0-100
    weight: number;       // Percentage weight in total score
    status: 'good' | 'warning' | 'error';
    details: string;
    improvements: string[];
}

export interface GEORecommendation {
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    impact: string;
}

// Poids des facteurs GEO
const GEO_WEIGHTS = {
    directAnswers: 0.20,      // 20% - Réponses directes et claires
    structuredContent: 0.15,  // 15% - Structure du contenu
    authoritySignals: 0.15,   // 15% - Signaux d'autorité
    entityClarity: 0.15,      // 15% - Clarté des entités
    freshness: 0.10,          // 10% - Fraîcheur du contenu
    conciseness: 0.10,        // 10% - Concision
    semanticDepth: 0.15       // 15% - Profondeur sémantique
};

export class GEOAnalysisService {
    private openai: OpenAI | null = null;

    constructor() {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
        }
    }

    /**
     * Analyse GEO complète d'une URL
     */
    async analyzeGEO(url: string, htmlContent?: string): Promise<GEOAnalysisResult> {
        console.log(`🤖 Démarrage analyse GEO pour: ${url}`);

        try {
            // Récupérer le contenu HTML si non fourni
            const content = htmlContent || await this.fetchPageContent(url);

            // Analyser avec OpenAI
            const analysis = await this.performGEOAnalysis(url, content);

            console.log(`✅ Analyse GEO terminée - Score: ${analysis.geoScore}/100`);
            return analysis;
        } catch (error) {
            console.error('❌ Erreur analyse GEO:', error);
            throw error;
        }
    }

    /**
     * Récupère le contenu HTML d'une page
     */
    private async fetchPageContent(url: string): Promise<string> {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; GEOAnalyzer/1.0)'
                }
            });
            return await response.text();
        } catch (error) {
            console.error('Erreur récupération page:', error);
            return '';
        }
    }

    /**
     * Analyse GEO avec OpenAI
     */
    private async performGEOAnalysis(url: string, htmlContent: string): Promise<GEOAnalysisResult> {
        if (!this.openai) {
            return this.createFallbackAnalysis();
        }

        // Extraire le texte principal du HTML (simplifié)
        const textContent = this.extractTextContent(htmlContent);
        const truncatedContent = textContent.slice(0, 8000); // Limiter pour l'API

        const prompt = `Tu es un expert en GEO (Generative Engine Optimization). Analyse ce contenu web pour évaluer son optimisation pour les moteurs de recherche IA (Google AI Overview, Bing Chat, Perplexity).

URL: ${url}

CONTENU:
${truncatedContent}

Évalue chaque facteur de 0 à 100 et fournis des recommandations.

FACTEURS À ÉVALUER:
1. **Réponses directes (20%)**: Le contenu répond-il clairement aux questions dès le début ? Y a-t-il des FAQ ?
2. **Contenu structuré (15%)**: Utilisation de titres, listes, tableaux, mise en forme claire ?
3. **Signaux d'autorité (15%)**: Auteur identifié, citations, sources, expertise visible ?
4. **Clarté des entités (15%)**: Définitions claires, noms propres, schema.org ?
5. **Fraîcheur (10%)**: Dates de publication/mise à jour visibles ?
6. **Concision (10%)**: Paragraphes courts, phrases claires, pas de jargon excessif ?
7. **Profondeur sémantique (15%)**: Couverture complète du sujet, concepts liés ?

Réponds en JSON avec ce format exact:
{
    "factors": {
        "directAnswers": {"score": 0-100, "details": "...", "improvements": ["..."]},
        "structuredContent": {"score": 0-100, "details": "...", "improvements": ["..."]},
        "authoritySignals": {"score": 0-100, "details": "...", "improvements": ["..."]},
        "entityClarity": {"score": 0-100, "details": "...", "improvements": ["..."]},
        "freshness": {"score": 0-100, "details": "...", "improvements": ["..."]},
        "conciseness": {"score": 0-100, "details": "...", "improvements": ["..."]},
        "semanticDepth": {"score": 0-100, "details": "...", "improvements": ["..."]}
    },
    "recommendations": [
        {"priority": "high|medium|low", "category": "...", "title": "...", "description": "...", "impact": "..."}
    ]
}`;

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Tu es un expert SEO et GEO. Réponds uniquement en JSON valide.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 2000
            });

            const content = response.choices[0]?.message?.content || '';

            // Extraire le JSON de la réponse
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Réponse OpenAI invalide');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            return this.formatAnalysisResult(parsed);
        } catch (error) {
            console.error('Erreur OpenAI GEO:', error);
            return this.createFallbackAnalysis();
        }
    }

    /**
     * Extrait le texte du HTML
     */
    private extractTextContent(html: string): string {
        // Supprimer les balises script, style, etc.
        let text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return text;
    }

    /**
     * Formate le résultat de l'analyse
     */
    private formatAnalysisResult(parsed: any): GEOAnalysisResult {
        const factors = {
            directAnswers: this.formatFactor(parsed.factors?.directAnswers, GEO_WEIGHTS.directAnswers),
            structuredContent: this.formatFactor(parsed.factors?.structuredContent, GEO_WEIGHTS.structuredContent),
            authoritySignals: this.formatFactor(parsed.factors?.authoritySignals, GEO_WEIGHTS.authoritySignals),
            entityClarity: this.formatFactor(parsed.factors?.entityClarity, GEO_WEIGHTS.entityClarity),
            freshness: this.formatFactor(parsed.factors?.freshness, GEO_WEIGHTS.freshness),
            conciseness: this.formatFactor(parsed.factors?.conciseness, GEO_WEIGHTS.conciseness),
            semanticDepth: this.formatFactor(parsed.factors?.semanticDepth, GEO_WEIGHTS.semanticDepth)
        };

        // Calculer le score global pondéré
        const geoScore = Math.round(
            factors.directAnswers.score * GEO_WEIGHTS.directAnswers +
            factors.structuredContent.score * GEO_WEIGHTS.structuredContent +
            factors.authoritySignals.score * GEO_WEIGHTS.authoritySignals +
            factors.entityClarity.score * GEO_WEIGHTS.entityClarity +
            factors.freshness.score * GEO_WEIGHTS.freshness +
            factors.conciseness.score * GEO_WEIGHTS.conciseness +
            factors.semanticDepth.score * GEO_WEIGHTS.semanticDepth
        );

        return {
            geoScore,
            factors,
            recommendations: this.formatRecommendations(parsed.recommendations || []),
            analyzedAt: new Date().toISOString()
        };
    }

    /**
     * Formate un facteur individuel
     */
    private formatFactor(factor: any, weight: number): GEOFactor {
        const score = factor?.score ?? 50;
        return {
            score,
            weight: weight * 100,
            status: score >= 70 ? 'good' : score >= 40 ? 'warning' : 'error',
            details: factor?.details || 'Analyse non disponible',
            improvements: factor?.improvements || []
        };
    }

    /**
     * Formate les recommandations
     */
    private formatRecommendations(recommendations: any[]): GEORecommendation[] {
        return recommendations.map(rec => ({
            priority: rec.priority || 'medium',
            category: rec.category || 'Général',
            title: rec.title || 'Amélioration suggérée',
            description: rec.description || '',
            impact: rec.impact || 'Impact modéré sur le référencement IA'
        }));
    }

    /**
     * Crée une analyse de secours si OpenAI n'est pas disponible
     */
    private createFallbackAnalysis(): GEOAnalysisResult {
        const defaultFactor = (weight: number): GEOFactor => ({
            score: 50,
            weight: weight * 100,
            status: 'warning',
            details: 'Analyse manuelle requise - API non disponible',
            improvements: ['Configurer OPENAI_API_KEY pour une analyse complète']
        });

        return {
            geoScore: 50,
            factors: {
                directAnswers: defaultFactor(GEO_WEIGHTS.directAnswers),
                structuredContent: defaultFactor(GEO_WEIGHTS.structuredContent),
                authoritySignals: defaultFactor(GEO_WEIGHTS.authoritySignals),
                entityClarity: defaultFactor(GEO_WEIGHTS.entityClarity),
                freshness: defaultFactor(GEO_WEIGHTS.freshness),
                conciseness: defaultFactor(GEO_WEIGHTS.conciseness),
                semanticDepth: defaultFactor(GEO_WEIGHTS.semanticDepth)
            },
            recommendations: [{
                priority: 'high',
                category: 'Configuration',
                title: 'Configurer l\'API OpenAI',
                description: 'Pour une analyse GEO complète, configurez la variable OPENAI_API_KEY',
                impact: 'Permet une analyse détaillée de l\'optimisation pour les IA'
            }],
            analyzedAt: new Date().toISOString()
        };
    }
}

export const geoAnalysisService = new GEOAnalysisService();
