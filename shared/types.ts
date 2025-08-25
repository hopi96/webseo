
// Types centralisés pour l'application
export interface Website {
  id: number;
  name: string;
  url: string;
  programmeRs?: string;
  seoAnalysis?: SeoAnalysis;
}

export interface SeoAnalysis {
  id: number;
  url: string;
  title: string;
  analysisType: string;
  seoScore: number;
  pageSpeed: number;
  issuesCount: number;
  keywordCount: number;
  internalLinks: number;
  externalLinks: number;
  technicalSeo: TechnicalSeo;
  pageSpeedMetrics: PageSpeedMetrics;
  contentStrategy?: ContentStrategy;
  createdAt: string;
  rawWebhookData?: string;
}

export interface TechnicalSeo {
  mobileFriendly: boolean;
  httpsSecure: boolean;
  xmlSitemap: boolean;
  robotsTxt: boolean;
}

export interface PageSpeedMetrics {
  performanceScore: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
}

export interface ContentStrategy {
  trendingKeywords: Array<{
    keyword: string;
    searchVolume: number;
    difficulty: number;
  }>;
}
