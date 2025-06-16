import { websites, seoAnalyses, type Website, type InsertWebsite, type SeoAnalysis, type InsertSeoAnalysis } from "@shared/schema";

export interface IStorage {
  // Website operations
  getWebsites(): Promise<Website[]>;
  getWebsite(id: number): Promise<Website | undefined>;
  createWebsite(website: InsertWebsite): Promise<Website>;
  deleteWebsite(id: number): Promise<boolean>;

  // SEO Analysis operations
  getSeoAnalysis(websiteId: number): Promise<SeoAnalysis | undefined>;
  createSeoAnalysis(analysis: InsertSeoAnalysis): Promise<SeoAnalysis>;
  updateSeoAnalysis(websiteId: number, analysis: Partial<InsertSeoAnalysis>): Promise<SeoAnalysis | undefined>;
}

export class MemStorage implements IStorage {
  private websites: Map<number, Website>;
  private seoAnalyses: Map<number, SeoAnalysis>;
  private currentWebsiteId: number;
  private currentAnalysisId: number;

  constructor() {
    this.websites = new Map();
    this.seoAnalyses = new Map();
    this.currentWebsiteId = 1;
    this.currentAnalysisId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample websites
    const sampleWebsites = [
      { url: "https://example.com", name: "Example Site" },
      { url: "https://mystore.com", name: "My Store" },
      { url: "https://techblog.net", name: "Tech Blog" }
    ];

    for (const site of sampleWebsites) {
      const website = await this.createWebsite(site);
      
      // Create sample SEO analysis for each website
      await this.createSeoAnalysis({
        websiteId: website.id,
        overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
        organicTraffic: Math.floor(Math.random() * 10000) + 5000,
        keywordsRanking: Math.floor(Math.random() * 200) + 100,
        backlinks: Math.floor(Math.random() * 1000) + 500,
        pageSpeed: Math.floor(Math.random() * 20) + 80,
        technicalSeo: {
          mobileFriendly: Math.random() > 0.2,
          httpsSecure: Math.random() > 0.1,
          xmlSitemap: Math.random() > 0.3,
          robotsTxt: Math.random() > 0.2
        },
        recommendations: [
          {
            id: "meta-descriptions",
            title: "Fix Missing Meta Descriptions",
            description: "12 pages are missing meta descriptions. This impacts click-through rates from search results.",
            priority: "high" as const,
            category: "On-Page SEO"
          },
          {
            id: "image-alt-text",
            title: "Optimize Image Alt Text",
            description: "45 images lack descriptive alt text. Improve accessibility and SEO by adding relevant descriptions.",
            priority: "medium" as const,
            category: "Technical SEO"
          },
          {
            id: "internal-linking",
            title: "Improve Internal Linking",
            description: "Add more internal links to improve page authority distribution and user navigation.",
            priority: "low" as const,
            category: "Link Building"
          }
        ],
        keywords: [
          { keyword: "react tutorials", position: 3, volume: 8200, trend: "up" as const },
          { keyword: "javascript guide", position: 7, volume: 12100, trend: "down" as const },
          { keyword: "web development", position: 12, volume: 15300, trend: "stable" as const },
          { keyword: "frontend frameworks", position: 5, volume: 6800, trend: "up" as const },
          { keyword: "programming tips", position: 15, volume: 4500, trend: "stable" as const }
        ],
        trafficData: this.generateTrafficData()
      });
    }
  }

  private generateTrafficData() {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        visitors: Math.floor(Math.random() * 500) + 1000
      });
    }
    return data;
  }

  async getWebsites(): Promise<Website[]> {
    return Array.from(this.websites.values());
  }

  async getWebsite(id: number): Promise<Website | undefined> {
    return this.websites.get(id);
  }

  async createWebsite(insertWebsite: InsertWebsite): Promise<Website> {
    const id = this.currentWebsiteId++;
    const website: Website = {
      ...insertWebsite,
      id,
      createdAt: new Date()
    };
    this.websites.set(id, website);
    return website;
  }

  async deleteWebsite(id: number): Promise<boolean> {
    const deleted = this.websites.delete(id);
    if (deleted) {
      // Also delete associated SEO analysis
      this.seoAnalyses.delete(id);
    }
    return deleted;
  }

  async getSeoAnalysis(websiteId: number): Promise<SeoAnalysis | undefined> {
    return Array.from(this.seoAnalyses.values()).find(
      analysis => analysis.websiteId === websiteId
    );
  }

  async createSeoAnalysis(insertAnalysis: InsertSeoAnalysis): Promise<SeoAnalysis> {
    const id = this.currentAnalysisId++;
    const analysis: SeoAnalysis = {
      ...insertAnalysis,
      id,
      analyzedAt: new Date()
    };
    this.seoAnalyses.set(id, analysis);
    return analysis;
  }

  async updateSeoAnalysis(websiteId: number, updateData: Partial<InsertSeoAnalysis>): Promise<SeoAnalysis | undefined> {
    const existing = await this.getSeoAnalysis(websiteId);
    if (!existing) return undefined;

    const updated: SeoAnalysis = {
      ...existing,
      ...updateData,
      analyzedAt: new Date()
    };
    this.seoAnalyses.set(existing.id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
