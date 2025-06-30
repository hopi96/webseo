import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWebsiteSchema, insertSeoAnalysisSchema, insertEditorialContentSchema } from "@shared/schema";
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

  // New analyze endpoint that calls webhook
  app.post("/api/websites/:id/analyze", async (req, res) => {
    try {
      const websiteId = parseInt(req.params.id);
      const website = await storage.getWebsite(websiteId);
      
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }

      // Call webhook service to get new SEO analysis
      const webhookAnalysisData = await requestSeoAnalysisFromWebhook(website.url);
      
      // Update or create SEO analysis with webhook data
      let analysis = await storage.getSeoAnalysis(websiteId);
      if (analysis) {
        analysis = await storage.updateSeoAnalysis(websiteId, webhookAnalysisData);
      } else {
        analysis = await storage.createSeoAnalysis({
          ...webhookAnalysisData,
          websiteId
        });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing website:", error);
      res.status(500).json({ message: "Failed to analyze website" });
    }
  });

  // Refresh analysis endpoint (alias for analyze)
  app.post("/api/websites/:id/refresh-analysis", async (req, res) => {
    try {
      const websiteId = parseInt(req.params.id);
      const website = await storage.getWebsite(websiteId);
      
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }

      // Call webhook service to get new SEO analysis
      const webhookAnalysisData = await requestSeoAnalysisFromWebhook(website.url);
      
      // Update existing SEO analysis with webhook data
      const analysis = await storage.updateSeoAnalysis(websiteId, webhookAnalysisData);
      
      if (!analysis) {
        return res.status(404).json({ message: "SEO analysis not found" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error refreshing analysis:", error);
      res.status(500).json({ message: "Failed to refresh analysis" });
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
          
        const { config } = await import('./config');
        return res.status(503).json({ 
          message: "Webhook n8n requis",
          error: errorMessage,
          webhookUrl: config.webhook.url
        });
      }
      
      res.status(500).json({ 
        message: "Failed to refresh SEO analysis",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Diagnostic webhook endpoint
  app.get('/api/webhook/diagnostic', async (_req, res) => {
    const { config } = await import('./config');
    const webhookUrl = config.webhook.url;
    const results = {
      get: null as any,
      post: null as any
    };

    // Test GET
    try {
      const getUrl = `${webhookUrl}?url=https://www.plug2ai.com&test=diagnostic`;
      const getResponse = await fetch(getUrl);
      results.get = {
        status: getResponse.status,
        statusText: getResponse.statusText,
        body: await getResponse.text()
      };
    } catch (error) {
      results.get = { error: error instanceof Error ? error.message : "Network error" };
    }

    // Test POST
    try {
      const postResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://www.plug2ai.com', test: 'diagnostic' })
      });
      results.post = {
        status: postResponse.status,
        statusText: postResponse.statusText,
        body: await postResponse.text()
      };
    } catch (error) {
      results.post = { error: error instanceof Error ? error.message : "Network error" };
    }

    res.json({
      webhook_url: webhookUrl,
      tests: results,
      recommendation: results.post.status === 200 ? 'POST fonctionne' : 
                     results.get.status === 200 ? 'GET fonctionne' : 
                     'Aucune méthode ne fonctionne - vérifiez la configuration n8n'
    });
  });

  // Editorial Content routes
  app.get("/api/editorial-content", async (req, res) => {
    try {
      const siteId = req.query.siteId ? parseInt(req.query.siteId as string) : undefined;
      const content = await storage.getEditorialContent(siteId);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch editorial content" });
    }
  });

  app.get("/api/editorial-content/date/:date", async (req, res) => {
    try {
      const date = new Date(req.params.date);
      const siteId = req.query.siteId ? parseInt(req.query.siteId as string) : undefined;
      const content = await storage.getEditorialContentByDate(date, siteId);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch editorial content by date" });
    }
  });

  app.post("/api/editorial-content", async (req, res) => {
    try {
      const validatedData = insertEditorialContentSchema.parse(req.body);
      const content = await storage.createEditorialContent(validatedData);
      res.status(201).json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create editorial content" });
    }
  });

  app.put("/api/editorial-content/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const content = await storage.updateEditorialContent(id, req.body);
      if (!content) {
        return res.status(404).json({ message: "Editorial content not found" });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to update editorial content" });
    }
  });

  app.delete("/api/editorial-content/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEditorialContent(id);
      if (!deleted) {
        return res.status(404).json({ message: "Editorial content not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete editorial content" });
    }
  });

  // Test endpoint pour diagnostiquer Airtable
  app.get("/api/test-airtable", async (req, res) => {
    try {
      const { airtableService } = await import('./airtable-service');
      
      // Test de la configuration
      const hasApiKey = !!process.env.AIRTABLE_API_KEY;
      const hasBaseId = !!process.env.AIRTABLE_BASE_ID;
      
      console.log('🔧 Test Airtable Config:', {
        hasApiKey,
        hasBaseId,
        apiKeyLength: process.env.AIRTABLE_API_KEY?.length || 0,
        baseIdPrefix: process.env.AIRTABLE_BASE_ID?.substring(0, 4) || 'none'
      });

      if (!hasApiKey || !hasBaseId) {
        return res.status(500).json({
          success: false,
          message: "Configuration Airtable manquante",
          config: { hasApiKey, hasBaseId }
        });
      }

      // Test de connexion
      const isConnected = await airtableService.testConnection();
      
      if (isConnected) {
        const content = await airtableService.getAllContent();
        res.json({
          success: true,
          message: "Connexion Airtable réussie",
          contentCount: content.length,
          firstContent: content[0] || null
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Échec de la connexion Airtable"
        });
      }
    } catch (error: any) {
      console.error('❌ Erreur test Airtable:', error.message);
      res.status(500).json({
        success: false,
        message: "Erreur lors du test Airtable",
        error: error.message,
        errorType: error.constructor.name
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}