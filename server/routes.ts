import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWebsiteSchema, insertSeoAnalysisSchema } from "@shared/schema";
import { requestSeoAnalysisFromWebhook } from "./webhook-service";
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
      
      // Request real-time SEO analysis from webhook
      try {
        console.log(`Requesting SEO analysis for new website: ${website.url}`);
        const seoAnalysisData = await requestSeoAnalysisFromWebhook(website.url);
        
        // Create SEO analysis with webhook data
        await storage.createSeoAnalysis({
          ...seoAnalysisData,
          websiteId: website.id
        });
        
        console.log(`SEO analysis created for website ${website.id}`);
      } catch (webhookError) {
        console.error(`Webhook analysis failed for ${website.url}:`, webhookError);
        // Website is still created even if SEO analysis fails
      }
      
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
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete website" });
    }
  });

  // SEO Analysis routes
  app.get("/api/websites/:id/seo-analysis", async (req, res) => {
    try {
      const websiteId = parseInt(req.params.id);
      let analysis = await storage.getSeoAnalysis(websiteId);
      
      // Analysis is created during storage initialization
      
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

  // Refresh SEO analysis with real-time webhook data
  app.post("/api/websites/:id/refresh-analysis", async (req, res) => {
    try {
      const websiteId = parseInt(req.params.id);
      const website = await storage.getWebsite(websiteId);
      
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }

      console.log(`Refreshing SEO analysis for ${website.url}...`);
      const seoAnalysisData = await requestSeoAnalysisFromWebhook(website.url);
      
      // Update existing analysis or create new one
      let analysis = await storage.getSeoAnalysis(websiteId);
      if (analysis) {
        analysis = await storage.updateSeoAnalysis(websiteId, seoAnalysisData);
      } else {
        analysis = await storage.createSeoAnalysis({
          ...seoAnalysisData,
          websiteId
        });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("SEO analysis refresh failed:", error);
      
      // Vérifier si c'est une erreur webhook n8n
      if (error instanceof Error && ((error as any).isWebhookError || error.message.includes('Webhook n8n'))) {
        const errorMessage = error.message.includes('mode test') 
          ? "Le webhook n8n est en mode test. Cliquez sur 'Test workflow' dans votre canvas n8n puis réessayez immédiatement."
          : "Le webhook doit être activé en mode test dans n8n. Cliquez sur 'Test workflow' dans votre canvas n8n puis réessayez.";
          
        return res.status(503).json({ 
          message: "Webhook n8n requis",
          error: errorMessage,
          webhookUrl: "https://doseit.app.n8n.cloud/webhook-test/4c07451f-11b9-4d71-8060-ac071029417d"
        });
      }
      
      res.status(500).json({ 
        message: "Failed to refresh SEO analysis",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}