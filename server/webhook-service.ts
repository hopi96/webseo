import type { InsertSeoAnalysis } from "@shared/schema";

const WEBHOOK_URL = "https://doseit.app.n8n.cloud/webhook-test/a92c86af-1667-4186-9b06-048dd2b67866";

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
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: websiteUrl,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    const webhookData: WebhookSeoResponse = await response.json();
    
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