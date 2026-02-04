/**
 * Service d'analyse SEO - Remplace le workflow n8n "module analyse SEO"
 * Analyse SEO complète d'un site web avec métriques PageSpeed
 */

import { supabaseService } from './supabase-service';

// Types pour l'analyse SEO
export interface SEOAnalysisRequest {
    url: string;
    analysisType?: 'quick' | 'deep';
}

export interface PageSpeedMetrics {
    performanceScore: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    totalBlockingTime: number;
}

export interface TitleTagAnalysis {
    title: string;
    length: number;
    status: 'good' | 'warning' | 'error';
    hasBrand: boolean;
    hasKeyword: boolean;
    suggestions: string[];
}

export interface MetaDescriptionAnalysis {
    description: string | null;
    length: number;
    status: 'good' | 'warning' | 'error';
    hasKeyword: boolean;
    suggestions: string[];
    missingPages: string[];
}

export interface KeywordAnalysis {
    keyword: string;
    count: number;
    density: number;
}

export interface HeadingStructure {
    level: string;
    text: string;
    hasKeyword: boolean;
}

export interface LinkAnalysis {
    internalLinks: number;
    externalLinks: number;
    brokenLinks: number;
    topExternalDomains: { domain: string; count: number }[];
}

export interface TechnicalSEO {
    https: boolean;
    robotsTxt: boolean;
    xmlSitemap: boolean;
    mobileFriendly: boolean;
    compression: boolean;
    imageAltTags: boolean;
}

export interface ContentStrategy {
    themes: string[];
    longTailKeywords: string[];
    seasonalKeywords: string[];
    trendingKeywords: { keyword: string; trend: string; searchVolume: number; seasonality: string; relatedQueries: string[] }[];
    contentQuestions: string[];
    localOpportunities: string[];
}

export interface SEOAnalysisResult {
    id?: number;
    url: string;
    title: string;
    seoScore: number;
    createdAt: string;
    analysisType: string;
    pageSpeed: number;
    titleTags: TitleTagAnalysis;
    metaDescriptions: MetaDescriptionAnalysis;
    keywordAnalysis: KeywordAnalysis[];
    keywordCount: number;
    headingStructure: HeadingStructure[];
    linkAnalysis: LinkAnalysis;
    internalLinks: number;
    externalLinks: number;
    technicalSeo: TechnicalSEO;
    contentStrategy: ContentStrategy;
    pageSpeedMetrics: PageSpeedMetrics;
    issuesCount: number;
}

// API externe pour l'analyse SEO
const SEO_ANALYZER_API = 'https://seo-analyzer-plug2ai.replit.app/api/analyze';
const PAGESPEED_API = 'https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed';

// Clé API PageSpeed (à déplacer vers .env en production)
const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY || 'AIzaSyDj8szkif6LNp8CvQg8AZ28Qgepd3zsLaQ';

export class SEOAnalysisService {

    /**
     * Analyse SEO complète d'une URL
     */
    async analyzeUrl(request: SEOAnalysisRequest): Promise<SEOAnalysisResult> {
        console.log(`🔍 Démarrage analyse SEO pour: ${request.url}`);

        try {
            // Appel à l'API SEO externe
            const response = await fetch(SEO_ANALYZER_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: request.url,
                    analysisType: request.analysisType || 'deep'
                })
            });

            if (!response.ok) {
                throw new Error(`API SEO erreur: ${response.status} ${response.statusText}`);
            }

            const analysisResult = await response.json() as SEOAnalysisResult;
            console.log(`✅ Analyse SEO terminée pour: ${request.url}`);

            return analysisResult;
        } catch (error) {
            console.error('❌ Erreur lors de l\'analyse SEO:', error);
            throw error;
        }
    }

    /**
     * Récupère les métriques PageSpeed Insights
     */
    async getPageSpeedMetrics(url: string): Promise<PageSpeedMetrics> {
        console.log(`📊 Récupération métriques PageSpeed pour: ${url}`);

        try {
            const apiUrl = `${PAGESPEED_API}?url=${encodeURIComponent(url)}&key=${PAGESPEED_API_KEY}&strategy=mobile`;

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`PageSpeed API erreur: ${response.status}`);
            }

            const data = await response.json();
            const lighthouse = data.lighthouseResult;

            const metrics: PageSpeedMetrics = {
                performanceScore: Math.round((lighthouse?.categories?.performance?.score || 0) * 100),
                firstContentfulPaint: lighthouse?.audits?.['first-contentful-paint']?.numericValue / 1000 || 0,
                largestContentfulPaint: lighthouse?.audits?.['largest-contentful-paint']?.numericValue / 1000 || 0,
                cumulativeLayoutShift: lighthouse?.audits?.['cumulative-layout-shift']?.numericValue || 0,
                totalBlockingTime: lighthouse?.audits?.['total-blocking-time']?.numericValue || 0
            };

            console.log(`✅ Métriques PageSpeed récupérées: Score ${metrics.performanceScore}`);
            return metrics;
        } catch (error) {
            console.error('❌ Erreur PageSpeed:', error);
            // Retourner des valeurs par défaut en cas d'erreur
            return {
                performanceScore: 0,
                firstContentfulPaint: 0,
                largestContentfulPaint: 0,
                cumulativeLayoutShift: 0,
                totalBlockingTime: 0
            };
        }
    }

    /**
     * Génère un rapport SEO complet et le sauvegarde dans Supabase
     */
    async generateAndSaveSeoReport(url: string, siteName?: string): Promise<{ siteId: number; analysis: SEOAnalysisResult }> {
        console.log(`🚀 Génération rapport SEO complet pour: ${url}`);

        // 1. Analyse SEO via API externe
        const seoAnalysis = await this.analyzeUrl({ url, analysisType: 'deep' });

        // 2. Enrichissement avec PageSpeed (optionnel, peut échouer)
        try {
            const pageSpeedMetrics = await this.getPageSpeedMetrics(url);
            seoAnalysis.pageSpeedMetrics = pageSpeedMetrics;
            seoAnalysis.pageSpeed = pageSpeedMetrics.performanceScore;
        } catch (error) {
            console.warn('⚠️ PageSpeed non disponible, utilisation des données existantes');
        }

        // 3. Sauvegarder dans Supabase
        const name = siteName || seoAnalysis.title || new URL(url).hostname;

        // Vérifier si le site existe déjà
        const existingSites = await supabaseService.getAllSites();
        const existingSite = existingSites.find(s =>
            s.url.toLowerCase().includes(new URL(url).hostname.toLowerCase())
        );

        let siteId: number;

        if (existingSite) {
            // Mise à jour du site existant
            await supabaseService.updateSite(existingSite.id, {
                seoAnalysis: seoAnalysis
            });
            siteId = existingSite.id;
            console.log(`✅ Site existant mis à jour: ID ${siteId}`);
        } else {
            // Création d'un nouveau site
            const newSite = await supabaseService.createSite({
                name,
                url,
                seoAnalysis: seoAnalysis
            });
            siteId = newSite.id;
            console.log(`✅ Nouveau site créé: ID ${siteId}`);
        }

        return { siteId, analysis: seoAnalysis };
    }

    /**
     * Récupère l'analyse SEO d'un site existant
     */
    async getSiteAnalysis(siteId: number): Promise<SEOAnalysisResult | null> {
        const site = await supabaseService.getSiteById(siteId);
        return site?.seoAnalysis || null;
    }
}

export const seoAnalysisService = new SEOAnalysisService();
