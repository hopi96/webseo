/**
 * Agent IA de support pour la génération de contenus
 * Utilise la recherche web native d'OpenAI (Responses API)
 */

import OpenAI from 'openai';
import { supabaseService } from './supabase-service';

export interface ResearchBrief {
  synthese: string;
  faitsCles: string[];
  angles: string[];
  conseilsPlateforme: string[];
  elementsAEviter: string[];
  ctaSuggeres: string[];
  sources: Array<{ title: string; url: string }>;
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const DEFAULT_MODEL = process.env.RESEARCH_MODEL || 'gpt-4o';
const CACHE_TTL_MS = Number(process.env.RESEARCH_CACHE_TTL_MS || 15 * 60 * 1000);

export class ResearchAgentService {
  private cache = new Map<string, { expiresAt: number; brief: ResearchBrief }>();

  private isEnabled(): boolean {
    return Boolean(openai);
  }

  async buildBrief(params: {
    siteId: number;
    platform: string;
    theme: string;
    context?: string;
  }): Promise<ResearchBrief | null> {
    if (!this.isEnabled()) {
      console.warn('⚠️ ResearchAgent désactivé: OPENAI_API_KEY manquante.');
      return null;
    }

    const cacheKey = `${params.siteId}:${params.platform}:${params.theme}:${params.context || ''}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.brief;
    }

    const site = await supabaseService.getSiteById(params.siteId).catch(() => null);
    const siteContext = this.buildSiteContext(site);

    const prompt = this.buildPrompt({
      platform: params.platform,
      theme: params.theme,
      context: params.context,
      siteContext
    });

    const brief = await this.callOpenAIWithWebSearch(prompt);
    if (!brief) {
      return null;
    }

    this.cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, brief });
    return brief;
  }

  private buildSiteContext(site: any): string {
    if (!site) return '';

    const seo = site.seoAnalysis;
    const description = seo?.metaDescriptions?.description || site.description || '';
    const themes = seo?.contentStrategy?.themes || [];
    const audience = seo?.contentStrategy?.targetAudience || '';

    return [
      `Nom: ${site.name}`,
      `URL: ${site.url}`,
      description ? `Description: ${description}` : '',
      themes.length ? `Thèmes: ${themes.slice(0, 6).join(', ')}` : '',
      audience ? `Audience: ${audience}` : ''
    ]
      .filter(Boolean)
      .join('\n');
  }

  private buildPrompt(params: {
    platform: string;
    theme: string;
    context?: string;
    siteContext: string;
  }): string {
    return `Tu es un agent IA de recherche qui assiste la génération de contenu éditorial.
Tu dois UTILISER la recherche web pour produire un brief actionnable et récent.
Réponds uniquement avec un JSON valide, en français, sans markdown.

CONTEXTE SITE:
${params.siteContext || 'Non disponible'}

THEME DU POST:
${params.theme}

BRIEF INITIAL:
${params.context || 'Non fourni'}

CONTRAINTES:
- N'invente aucun fait.
- Utilise uniquement les informations issues de la recherche web.
- Si une info est incertaine, reformule de manière prudente.
- Propose des conseils concrets adaptés à ${params.platform}.

FORMAT JSON ATTENDU:
{
  "synthese": "Résumé clair et utile pour guider la rédaction",
  "faits_cles": ["Fait 1", "Fait 2"],
  "angles": ["Angle éditorial 1", "Angle éditorial 2"],
  "conseils_plateforme": ["Conseil 1", "Conseil 2"],
  "elements_a_eviter": ["Écueil 1", "Écueil 2"],
  "cta_suggeres": ["CTA 1", "CTA 2"],
  "sources": [{"title": "Titre source", "url": "https://..."}]
}`;
  }

  private async callOpenAIWithWebSearch(prompt: string): Promise<ResearchBrief | null> {
    if (!openai) return null;

    try {
      const response = await openai.responses.create({
        model: DEFAULT_MODEL,
        input: prompt,
        tools: [
          {
            type: 'web_search',
            search_context_size: 'medium'
          }
        ],
        tool_choice: 'required',
        temperature: 0.2,
        text: {
          format: {
            type: 'json_schema',
            json_schema: {
              name: 'research_brief',
              strict: true,
              schema: {
                type: 'object',
                additionalProperties: false,
                required: [
                  'synthese',
                  'faits_cles',
                  'angles',
                  'conseils_plateforme',
                  'elements_a_eviter',
                  'cta_suggeres',
                  'sources'
                ],
                properties: {
                  synthese: { type: 'string' },
                  faits_cles: { type: 'array', items: { type: 'string' } },
                  angles: { type: 'array', items: { type: 'string' } },
                  conseils_plateforme: { type: 'array', items: { type: 'string' } },
                  elements_a_eviter: { type: 'array', items: { type: 'string' } },
                  cta_suggeres: { type: 'array', items: { type: 'string' } },
                  sources: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['title', 'url'],
                      properties: {
                        title: { type: 'string' },
                        url: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const raw = response.output_text || '';
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const brief: ResearchBrief = {
        synthese: typeof parsed.synthese === 'string' ? parsed.synthese : '',
        faitsCles: Array.isArray(parsed.faits_cles) ? parsed.faits_cles.filter(Boolean) : [],
        angles: Array.isArray(parsed.angles) ? parsed.angles.filter(Boolean) : [],
        conseilsPlateforme: Array.isArray(parsed.conseils_plateforme) ? parsed.conseils_plateforme.filter(Boolean) : [],
        elementsAEviter: Array.isArray(parsed.elements_a_eviter) ? parsed.elements_a_eviter.filter(Boolean) : [],
        ctaSuggeres: Array.isArray(parsed.cta_suggeres) ? parsed.cta_suggeres.filter(Boolean) : [],
        sources: Array.isArray(parsed.sources)
          ? parsed.sources
              .map((s: any) => ({
                title: typeof s?.title === 'string' ? s.title : 'Source',
                url: typeof s?.url === 'string' ? s.url : ''
              }))
              .filter((s: any) => s.url)
          : []
      };

      if (!brief.synthese) return null;
      return brief;
    } catch (error) {
      console.warn('⚠️ ResearchAgent error:', error);
      return null;
    }
  }
}

export const researchAgentService = new ResearchAgentService();
