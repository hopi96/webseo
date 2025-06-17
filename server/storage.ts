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
    // Aucune donnée simulée - seules les vraies données via APIs seront utilisées
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
