import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWebsiteSchema, insertSeoAnalysisSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Website routes
  app.get("/api/websites", async (req, res) => {
    try {
      const websites = await storage.getWebsites();
      res.json(websites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch websites" });
    }
  });

  app.get("/api/websites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const website = await storage.getWebsite(id);
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }
      res.json(website);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch website" });
    }
  });

  app.post("/api/websites", async (req, res) => {
    try {
      const validatedData = insertWebsiteSchema.parse(req.body);
      const website = await storage.createWebsite(validatedData);
      res.status(201).json(website);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid website data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create website" });
    }
  });

  app.delete("/api/websites/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWebsite(id);
      if (!deleted) {
        return res.status(404).json({ message: "Website not found" });
      }
      res.json({ message: "Website deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete website" });
    }
  });

  // SEO Analysis routes
  app.get("/api/websites/:id/seo-analysis", async (req, res) => {
    try {
      const websiteId = parseInt(req.params.id);
      const analysis = await storage.getSeoAnalysis(websiteId);
      if (!analysis) {
        return res.status(404).json({ message: "SEO analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SEO analysis" });
    }
  });

  app.post("/api/websites/:id/seo-analysis", async (req, res) => {
    try {
      const websiteId = parseInt(req.params.id);
      const validatedData = insertSeoAnalysisSchema.parse({
        ...req.body,
        websiteId
      });
      const analysis = await storage.createSeoAnalysis(validatedData);
      res.status(201).json(analysis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid SEO analysis data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create SEO analysis" });
    }
  });

  app.put("/api/websites/:id/seo-analysis", async (req, res) => {
    try {
      const websiteId = parseInt(req.params.id);
      const analysis = await storage.updateSeoAnalysis(websiteId, req.body);
      if (!analysis) {
        return res.status(404).json({ message: "SEO analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to update SEO analysis" });
    }
  });

  // Trigger new SEO analysis
  app.post("/api/websites/:id/analyze", async (req, res) => {
    try {
      const websiteId = parseInt(req.params.id);
      const website = await storage.getWebsite(websiteId);
      
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }

      // Simulate SEO analysis (in real app, this would call external APIs)
      const analysisData = {
        websiteId,
        overallScore: Math.floor(Math.random() * 30) + 70,
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
            description: "Pages are missing meta descriptions. This impacts click-through rates from search results.",
            priority: "high" as const,
            category: "On-Page SEO"
          },
          {
            id: "image-alt-text",
            title: "Optimize Image Alt Text",
            description: "Images lack descriptive alt text. Improve accessibility and SEO by adding relevant descriptions.",
            priority: "medium" as const,
            category: "Technical SEO"
          }
        ],
        keywords: [
          { keyword: "react tutorials", position: Math.floor(Math.random() * 20) + 1, volume: 8200, trend: "up" as const },
          { keyword: "javascript guide", position: Math.floor(Math.random() * 20) + 1, volume: 12100, trend: "down" as const },
          { keyword: "web development", position: Math.floor(Math.random() * 20) + 1, volume: 15300, trend: "stable" as const }
        ],
        trafficData: generateTrafficData()
      };

      const existingAnalysis = await storage.getSeoAnalysis(websiteId);
      let analysis;
      
      if (existingAnalysis) {
        analysis = await storage.updateSeoAnalysis(websiteId, analysisData);
      } else {
        analysis = await storage.createSeoAnalysis(analysisData);
      }

      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze website" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateTrafficData() {
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
