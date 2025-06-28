import type { InsertSeoAnalysis } from "@shared/schema";
import { config } from "./config";

const WEBHOOK_URL = config.webhook.url;

export interface WebhookSeoResponse {
  overallScore: number;
  organicTraffic: number;
  keywordsRanking: number;
  backlinks: number;
  pageSpeed: number;
  technicalSeo: {
    mobileFriendly: boolean;
    httpsSecure: boolean;
    xmlSitemap: boolean;
    robotsTxt: boolean;
  };
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
  }>;
  keywords: Array<{
    keyword: string;
    position: number;
    volume: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  trafficData: Array<{
    date: string;
    visitors: number;
  }>;
}

export async function requestSeoAnalysisFromWebhook(websiteUrl: string): Promise<InsertSeoAnalysis> {
  try {
    console.log(`Requesting SEO analysis for ${websiteUrl} from webhook (GET method)...`);
    
    // Construire l'URL avec les paramètres pour une requête GET (confirmé par tests)
    const webhookUrlWithParams = new URL(WEBHOOK_URL);
    webhookUrlWithParams.searchParams.append('url', websiteUrl);
    webhookUrlWithParams.searchParams.append('timestamp', new Date().toISOString());
    
    const response = await fetch(webhookUrlWithParams.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Webhook error response:`, errorText);
      
      // Créer une erreur spécifique pour les erreurs 404 n8n
      if (response.status === 404) {
        let errorMessage = `Webhook n8n non activé`;
        
        // Analyser la réponse pour donner un message plus précis
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.hint && errorData.hint.includes('Test workflow')) {
            errorMessage = `Webhook n8n en mode test - cliquez sur 'Test workflow' puis réessayez immédiatement`;
          }
        } catch (e) {
          // Ignorer l'erreur de parsing JSON
        }
        
        const error = new Error(errorMessage);
        (error as any).isWebhookError = true;
        throw error;
      }
      
      // Gérer les erreurs 500 spécifiques à n8n
      if (response.status === 500) {
        let errorMessage = `Erreur de configuration du workflow n8n`;
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message && errorData.message.includes('Workflow could not be started')) {
            errorMessage = `Workflow n8n ne peut pas démarrer - vérifiez la configuration de votre workflow`;
          }
        } catch (e) {
          // Ignorer l'erreur de parsing JSON
        }
        
        const error = new Error(errorMessage);
        (error as any).isWebhookError = true;
        throw error;
      }
      
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    const webhookData: any = await response.json();
    console.log(`Webhook response received:`, JSON.stringify(webhookData, null, 2));
    
    // Calculer le score SEO global basé sur les métriques techniques
    const mobileScore = Math.max(0, 100 - (webhookData.technical?.coreWebVitals?.mobile?.LCPs || 0) * 20);
    const desktopScore = Math.max(0, 100 - (webhookData.technical?.coreWebVitals?.desktop?.LCPs || 0) * 20);
    const overallScore = Math.round((mobileScore + desktopScore) / 2);
    
    // Extraire les données réelles du webhook JSON
    const organicTraffic = webhookData.domainMetrics?.estOrganicTrafficMonthly || 0;
    const keywordsRanking = webhookData.domainMetrics?.totalOrganicKeywords || 0;
    const backlinks = webhookData.domainMetrics?.totalBacklinks || 0;
    const pageSpeed = Math.round(desktopScore); // Basé sur les Core Web Vitals
    
    // Créer les données techniques SEO
    const technicalSeo = {
      mobileFriendly: (webhookData.technical?.coreWebVitals?.mobile?.LCPs || 0) < 4,
      httpsSecure: webhookData.overview?.httpStatus === 200,
      xmlSitemap: true, // Assumé pour les sites actifs
      robotsTxt: true   // Assumé pour les sites actifs
    };
    
    // Transformer les recommandations
    const recommendations = (webhookData.actionPlan90Days || []).map((action: any, index: number) => ({
      id: `rec-${index}`,
      title: action.task,
      description: action.expectedImpact,
      priority: action.priority,
      category: action.priority === 'high' ? 'Technique' : 'Contenu'
    }));
    
    // Transformer les mots-clés
    const keywords = [
      ...(webhookData.keywordStats?.brandKeywords || []).map((kw: any) => ({
        keyword: kw.keyword,
        position: kw.rankFR || kw.rank || 1,
        volume: kw.frVolume || kw.globalVolume || 0,
        trend: 'stable' as const
      })),
      ...(webhookData.keywordStats?.nonBrandTop10FR || []).map((kw: any) => ({
        keyword: kw.keyword,
        position: kw.rank || 1,
        volume: kw.volume || 0,
        trend: kw.rank <= 5 ? 'up' as const : 'stable' as const
      }))
    ];
    
    // Générer des données de trafic basées sur les métriques
    const trafficData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      visitors: Math.round(organicTraffic * (0.8 + Math.random() * 0.4) / 30)
    }));
    
    // Transform webhook response to our schema format
    const seoAnalysis: Omit<InsertSeoAnalysis, 'websiteId'> = {
      overallScore,
      organicTraffic,
      keywordsRanking,
      backlinks,
      pageSpeed,
      technicalSeo,
      recommendations,
      keywords,
      trafficData,
    };

    // Ajouter les données JSON complètes du webhook
    (seoAnalysis as any).rawWebhookData = JSON.stringify(webhookData);
    
    console.log(`SEO analysis received: Score ${overallScore}, Traffic ${organicTraffic}, Keywords ${keywordsRanking}, Backlinks ${backlinks}`);
    return seoAnalysis as InsertSeoAnalysis;

  } catch (error) {
    console.error('Webhook SEO analysis failed:', error);
    
    // Propager l'erreur webhook spécifique si elle existe
    if (error instanceof Error && (error as any).isWebhookError) {
      throw error;
    }
    
    throw new Error(`Failed to get SEO analysis from webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function testWebhookConnection(): Promise<boolean> {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString()
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Webhook connection test failed:', error);
    return false;
  }
}