import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWebsiteSchema, insertSeoAnalysisSchema, insertEditorialContentSchema } from "@shared/schema";
import { requestSeoAnalysisFromWebhook } from "./webhook-service";
import { airtableService } from "./airtable-service";
import { openaiService } from "./openai-service";
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

  // Nouvelle route pour récupérer les sites depuis la table analyse SEO d'Airtable
  app.get("/api/sites-airtable", async (req, res) => {
    try {
      console.log('🔍 Récupération des sites depuis la table analyse SEO...');
      const sites = await airtableService.getAllSites();
      console.log('✅ Sites récupérés:', sites);
      res.json(sites);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des sites Airtable:', error);
      res.status(500).json({ message: "Failed to fetch sites from Airtable", error: error.message });
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
      console.log('🔄 Création d\'un nouveau contenu éditorial');
      console.log('Données reçues:', req.body);

      // Validation des données
      const contentData = {
        idSite: req.body.siteId || 1, // Site par défaut
        typeContent: req.body.typeContent || 'xtwitter',
        contentText: req.body.contentText,
        statut: req.body.statut || 'en attente',
        hasImage: req.body.hasImage || false,
        dateDePublication: req.body.dateDePublication || new Date().toISOString()
      };

      // Validation des champs requis
      if (!contentData.contentText) {
        return res.status(400).json({ message: 'Le contenu texte est requis' });
      }

      // Créer le contenu via Airtable
      const createdContent = await airtableService.createContent(contentData);
      
      console.log('✅ Contenu créé avec succès:', createdContent.id);
      res.status(201).json(createdContent);
    } catch (error) {
      console.error('Erreur lors de la création du contenu éditorial:', error);
      res.status(500).json({ message: 'Failed to create editorial content' });
    }
  });

  app.put("/api/editorial-content/:id", async (req, res) => {
    try {
      const airtableId = decodeURIComponent(req.params.id); // Décoder l'ID Airtable
      const updateData = req.body;
      
      console.log(`Mise à jour du contenu Airtable ID: ${airtableId}`);
      
      // Mettre à jour directement dans Airtable
      const updatedContent = await airtableService.updateContent(airtableId, updateData);
      
      res.json(updatedContent);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du contenu éditorial:', error);
      res.status(500).json({ message: "Failed to update editorial content" });
    }
  });

  app.delete("/api/editorial-content/:id", async (req, res) => {
    try {
      const airtableId = decodeURIComponent(req.params.id); // Décoder l'ID Airtable
      
      console.log(`🗑️ Suppression du contenu éditorial ID: ${airtableId}`);
      
      // Supprimer directement dans Airtable
      const success = await airtableService.deleteContent(airtableId);
      
      if (success) {
        console.log('✅ Contenu supprimé avec succès');
        res.json({ message: 'Content deleted successfully', id: airtableId });
      } else {
        res.status(404).json({ message: 'Content not found' });
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression du contenu éditorial:', error.message);
      res.status(500).json({ message: 'Failed to delete editorial content', error: error.message });
    }
  });

  // Test endpoint pour diagnostiquer Airtable avec API REST
  app.get("/api/test-airtable", async (req, res) => {
    try {
      const apiKey = process.env.AIRTABLE_API_KEY;
      const baseId = process.env.AIRTABLE_BASE_ID;
      
      if (!apiKey || !baseId) {
        return res.status(500).json({
          success: false,
          message: "Configuration Airtable manquante"
        });
      }

      console.log('🔧 Test direct API REST Airtable...');
      console.log('Base ID:', baseId);
      console.log('API Key length:', apiKey.length);

      // Utilisation du bon Base ID pour tous les tests
      const correctBaseId = 'app9L4iAzg6Nms9Qq';
      const metaResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${correctBaseId}/tables`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (metaResponse.ok) {
        const metaData = await metaResponse.json();
        console.log('✅ Meta API réussie - Tables disponibles:', metaData.tables?.map((t: any) => t.name));
        
        // Cherchons la table "content" dans la liste
        const contentTable = metaData.tables?.find((t: any) => 
          t.name.toLowerCase() === 'content' || t.name === 'content'
        );
        
        if (contentTable) {
          console.log('✅ Table "content" trouvée:', contentTable.name);
          
          // Maintenant testons l'accès aux données
          const response = await fetch(`https://api.airtable.com/v0/${correctBaseId}/${contentTable.name}?maxRecords=1`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (response.ok) {
            return res.json({
              success: true,
              message: "Connexion Airtable réussie",
              tableName: contentTable.name,
              contentCount: data.records?.length || 0,
              firstRecord: data.records?.[0] || null,
              availableTables: metaData.tables?.map((t: any) => t.name)
            });
          } else {
            return res.status(response.status).json({
              success: false,
              message: "Erreur d'accès aux données",
              error: data,
              tableName: contentTable.name
            });
          }
        } else {
          return res.status(404).json({
            success: false,
            message: "Table 'content' non trouvée",
            availableTables: metaData.tables?.map((t: any) => t.name)
          });
        }
      }

      // Si meta API échoue, essayons l'accès direct
      const response = await fetch(`https://api.airtable.com/v0/${correctBaseId}/content?maxRecords=1`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ API REST réussie');
        console.log('Nombre d\'enregistrements:', data.records?.length || 0);
        
        res.json({
          success: true,
          message: "Connexion Airtable réussie via API REST",
          contentCount: data.records?.length || 0,
          firstRecord: data.records?.[0] || null,
          apiResponse: data
        });
      } else {
        console.error('❌ Erreur API REST:', data);
        res.status(response.status).json({
          success: false,
          message: "Erreur API REST Airtable",
          error: data,
          statusCode: response.status
        });
      }
    } catch (error: any) {
      console.error('❌ Erreur test Airtable:', error.message);
      res.status(500).json({
        success: false,
        message: "Erreur lors du test Airtable",
        error: error.message
      });
    }
  });

  // OpenAI article generation routes
  app.post("/api/generate-article", async (req, res) => {
    try {
      const { keywords, topic, contentType, targetAudience, tone, existingContent } = req.body;
      
      console.log('🤖 Génération d\'article avec OpenAI GPT-4o');
      console.log('Paramètres:', { keywords, topic, contentType, existingContent: !!existingContent });
      
      const generatedArticle = await openaiService.generateArticle({
        keywords: keywords || [],
        topic,
        contentType: contentType || 'xtwitter',
        targetAudience,
        tone,
        existingContent
      });
      
      console.log('✅ Article généré avec succès');
      res.json(generatedArticle);
    } catch (error) {
      console.error('Erreur lors de la génération d\'article:', error);
      res.status(500).json({ 
        message: "Failed to generate article",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/suggest-keywords", async (req, res) => {
    try {
      const { topic, contentType } = req.body;
      
      console.log('🔍 Suggestion de mots-clés avec OpenAI');
      console.log('Paramètres:', { topic, contentType });
      
      const keywords = await openaiService.suggestKeywords(topic || '', contentType || 'xtwitter');
      
      console.log('✅ Mots-clés suggérés:', keywords.length);
      res.json({ keywords });
    } catch (error) {
      console.error('Erreur lors de la suggestion de mots-clés:', error);
      res.status(500).json({ 
        message: "Failed to suggest keywords",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/openai/test", async (req, res) => {
    try {
      const isConnected = await openaiService.testConnection();
      res.json({ connected: isConnected });
    } catch (error) {
      res.status(500).json({ 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}