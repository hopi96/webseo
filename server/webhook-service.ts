import type { InsertSeoAnalysis } from "@shared/schema";

const WEBHOOK_URL = "https://doseit.app.n8n.cloud/webhook-test/4c07451f-11b9-4d71-8060-ac071029417d";

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
    console.log(`Requesting SEO analysis for ${websiteUrl} from webhook...`);
    
    // Construire l'URL avec les paramètres pour une requête GET
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
      
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    const webhookData: WebhookSeoResponse = await response.json();
    console.log(`Webhook response received:`, JSON.stringify(webhookData, null, 2));
    
    // Transform webhook response to our schema format
    const seoAnalysis: Omit<InsertSeoAnalysis, 'websiteId'> = {
      overallScore: webhookData.overallScore,
      organicTraffic: webhookData.organicTraffic,
      keywordsRanking: webhookData.keywordsRanking,
      backlinks: webhookData.backlinks,
      pageSpeed: webhookData.pageSpeed,
      technicalSeo: webhookData.technicalSeo,
      recommendations: webhookData.recommendations,
      keywords: webhookData.keywords,
      trafficData: webhookData.trafficData,
    };

    console.log(`SEO analysis received: Score ${webhookData.overallScore}, Traffic ${webhookData.organicTraffic}`);
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