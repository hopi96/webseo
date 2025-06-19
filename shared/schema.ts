import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const websites = pgTable("websites", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const seoAnalyses = pgTable("seo_analyses", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").notNull(),
  overallScore: integer("overall_score").notNull(),
  organicTraffic: integer("organic_traffic").notNull(),
  keywordsRanking: integer("keywords_ranking").notNull(),
  backlinks: integer("backlinks").notNull(),
  pageSpeed: integer("page_speed").notNull(),
  technicalSeo: jsonb("technical_seo").$type<{
    mobileFriendly: boolean;
    httpsSecure: boolean;
    xmlSitemap: boolean;
    robotsTxt: boolean;
  }>().notNull(),
  recommendations: jsonb("recommendations").$type<Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
  }>>().notNull(),
  keywords: jsonb("keywords").$type<Array<{
    keyword: string;
    position: number;
    volume: number;
    trend: 'up' | 'down' | 'stable';
  }>>().notNull(),
  trafficData: jsonb("traffic_data").$type<Array<{
    date: string;
    visitors: number;
  }>>().notNull(),
  rawWebhookData: jsonb("raw_webhook_data").$type<string>(),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
});

export const insertWebsiteSchema = createInsertSchema(websites).pick({
  url: true,
  name: true,
});

export const insertSeoAnalysisSchema = createInsertSchema(seoAnalyses).omit({
  id: true,
  analyzedAt: true,
});

export type Website = typeof websites.$inferSelect;
export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;
export type SeoAnalysis = typeof seoAnalyses.$inferSelect;
export type InsertSeoAnalysis = z.infer<typeof insertSeoAnalysisSchema>;
