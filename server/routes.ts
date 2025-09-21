import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWebsiteSchema, insertSeoAnalysisSchema, insertEditorialContentSchema } from "@shared/schema";
import { requestSeoAnalysisFromWebhook } from "./webhook-service";
import { airtableService } from "./airtable-service";
import { openaiService } from "./openai-service";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configuration multer pour l'upload d'images
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `image-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

  // Nouvelle route pour récupérer les sites depuis la table analyse SEO d'Airtable avec données d'analyse SEO
  app.get("/api/sites-airtable", async (req, res) => {
    try {
      console.log('🔍 Récupération des sites depuis la table analyse SEO avec JSON...');
      const sites = await airtableService.getAllSites();
      console.log('✅ Sites récupérés avec analyse SEO:', sites);
      res.json(sites);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des sites Airtable:', error);
      res.status(500).json({ message: "Failed to fetch sites from Airtable", error: error.message });
    }
  });

  // Route pour récupérer le programme des réseaux sociaux d'un site
  app.get("/api/sites-airtable/:id/social-program", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      
      if (isNaN(siteId)) {
        return res.status(400).json({ message: "ID de site invalide" });
      }
      
      console.log(`🔍 Récupération du programme RS pour le site ${siteId}`);
      
      const programme = await airtableService.getSocialMediaProgram(siteId);
      res.json({ programme_rs: programme });
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du programme RS:', error);
      res.status(500).json({ 
        message: "Impossible de récupérer le programme des réseaux sociaux" 
      });
    }
  });

  // Route pour mettre à jour le programme des réseaux sociaux
  app.put("/api/sites-airtable/:id/social-program", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      const { programme_rs } = req.body;
      
      if (!programme_rs) {
        return res.status(400).json({ message: "Le programme des réseaux sociaux est requis" });
      }
      
      await airtableService.updateSocialMediaProgram(siteId, programme_rs);
      res.json({ message: "Programme des réseaux sociaux mis à jour avec succès" });
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du programme RS:", error);
      res.status(500).json({ message: error.message || "Erreur lors de la mise à jour du programme" });
    }
  });

  // Route pour supprimer un site Airtable
  app.delete("/api/sites-airtable/:id", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      await airtableService.deleteSite(siteId);
      res.json({ message: "Site supprimé avec succès" });
    } catch (error) {
      console.error("❌ Erreur lors de la suppression du site:", error);
      res.status(500).json({ message: error.message || "Erreur lors de la suppression du site" });
    }
  });

  // Route pour analyser un site Airtable
  app.post("/api/sites-airtable/:id/analyze", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      const sites = await airtableService.getAllSites();
      const site = sites.find(s => s.id === siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }

      console.log(`🔄 Déclenchement de l'analyse SEO pour ${site.url} via webhook n8n...`);
      
      // Appel du webhook n8n pour déclencher une nouvelle analyse
      const webhookAnalysisData = await requestSeoAnalysisFromWebhook(site.url);
      
      console.log('✅ Nouvelle analyse SEO reçue du webhook:', webhookAnalysisData);
      
      res.json(webhookAnalysisData);
    } catch (error) {
      console.error("❌ Erreur lors de l'analyse du site:", error);
      res.status(500).json({ message: error.message || "Erreur lors de l'analyse du site" });
    }
  });



  // Nouvelle route pour déclencher l'analyse SEO d'un site Airtable via webhook n8n
  app.post("/api/sites-airtable/:id/refresh-analysis", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      const sites = await airtableService.getAllSites();
      const site = sites.find(s => s.id === siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }

      console.log(`🔄 Déclenchement de l'analyse SEO pour ${site.url} via webhook n8n...`);
      
      // Appel du webhook n8n pour déclencher une nouvelle analyse
      const webhookAnalysisData = await requestSeoAnalysisFromWebhook(site.url);
      
      console.log('✅ Nouvelle analyse SEO reçue du webhook:', webhookAnalysisData);
      
      // Retourner les données de l'analyse mise à jour
      res.json(webhookAnalysisData);
    } catch (error) {
      console.error("❌ Erreur lors du rafraîchissement de l'analyse via webhook:", error);
      res.status(500).json({ message: "Failed to refresh analysis via webhook", error: error.message });
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
        imageUrl: req.body.imageUrl || null,
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

  // Nouvel endpoint pour la mise à jour en lot des statuts (DOIT être défini AVANT la route avec :id)
  app.put("/api/editorial-content/bulk-update", async (req, res) => {
    try {
      const { ids, statut } = req.body;
      
      console.log(`🔄 Mise à jour en lot demandée pour ${ids?.length || 0} contenus`);
      console.log('IDs reçus:', ids);
      console.log('Nouveau statut:', statut);
      console.log('Type des IDs:', ids?.map(id => typeof id));
      console.log('Détail complet de la requête:', JSON.stringify(req.body, null, 2));
      
      // Validation des données
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ 
          message: "Le champ 'ids' doit être un tableau non vide d'identifiants" 
        });
      }
      
      if (!statut || typeof statut !== 'string') {
        return res.status(400).json({ 
          message: "Le champ 'statut' est requis" 
        });
      }
      
      const validStatuses = ['en attente', 'à réviser', 'validé'];
      if (!validStatuses.includes(statut)) {
        return res.status(400).json({ 
          message: `Statut invalide: ${statut}. Statuts valides: ${validStatuses.join(', ')}` 
        });
      }
      
      // Effectuer la mise à jour en lot via Airtable
      const updatedContents = await airtableService.bulkUpdateStatus(ids, statut);
      
      const successCount = updatedContents.length;
      const totalCount = ids.length;
      
      console.log(`✅ Mise à jour en lot terminée: ${successCount}/${totalCount} réussies`);
      
      // Gérer le cas où aucune mise à jour n'a réussi
      if (successCount === 0) {
        console.warn(`⚠️ Aucun article n'a pu être mis à jour`);
        return res.status(207).json({ // 207 Multi-Status pour succès partiel
          success: false,
          updated: 0,
          total: totalCount,
          message: `Aucun article n'a pu être mis à jour. Les enregistrements sont peut-être introuvables ou supprimés.`,
          updatedContents: []
        });
      }
      
      // Succès total ou partiel
      const isPartialSuccess = successCount < totalCount;
      res.status(isPartialSuccess ? 207 : 200).json({ 
        success: true,
        updated: successCount,
        total: totalCount,
        message: isPartialSuccess 
          ? `${successCount}/${totalCount} article(s) mis à jour avec le statut "${statut}". ${totalCount - successCount} article(s) n'ont pas pu être mis à jour.`
          : `${successCount} article(s) mis à jour avec le statut "${statut}"`,
        updatedContents
      });
      
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour en lot:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la mise à jour en lot',
        error: error.message 
      });
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

  // Route pour générer des images avec DALL-E 3
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { contentText, typeContent, prompt } = req.body;
      
      if (!contentText || !typeContent) {
        return res.status(400).json({ message: "Content text and type are required" });
      }
      
      console.log(`🎨 Génération d'image IA pour ${typeContent}: "${contentText}"`);
      
      // Générer l'image avec OpenAI DALL-E 3
      const imageResult = await openaiService.generateImage(contentText, typeContent);
      
      if (imageResult.imageUrl) {
        console.log('✅ Image générée avec succès:', imageResult.imageUrl);
        res.json({ imageUrl: imageResult.imageUrl });
      } else {
        res.status(500).json({ message: "Failed to generate image" });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la génération d\'image:', error);
      res.status(500).json({ 
        message: "Failed to generate image", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Routes pour gérer les paramètres des réseaux sociaux
  app.get("/api/sites-airtable/:id/social-params", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      
      if (isNaN(siteId)) {
        return res.status(400).json({ message: "ID de site invalide" });
      }
      
      console.log(`🔍 Récupération des paramètres réseaux sociaux pour le site ${siteId}`);
      
      const socialParams = await airtableService.getSocialParams(siteId);
      res.json(socialParams);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des paramètres réseaux sociaux:', error);
      res.status(500).json({ 
        message: "Impossible de récupérer les paramètres des réseaux sociaux" 
      });
    }
  });

  app.put("/api/sites-airtable/:id/social-params", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      const socialParams = req.body;
      
      if (isNaN(siteId)) {
        return res.status(400).json({ message: "ID de site invalide" });
      }
      
      // Validation basique de la structure
      if (!socialParams || typeof socialParams !== 'object') {
        return res.status(400).json({ 
          message: "Structure des paramètres invalide. Les paramètres doivent être un objet valide." 
        });
      }
      
      console.log(`🔄 Mise à jour des paramètres réseaux sociaux pour le site ${siteId}`);
      
      await airtableService.updateSocialParams(siteId, socialParams);
      res.json({ message: "Paramètres des réseaux sociaux mis à jour avec succès" });
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des paramètres réseaux sociaux:', error);
      res.status(500).json({ 
        message: "Impossible de mettre à jour les paramètres des réseaux sociaux" 
      });
    }
  });

  // Route pour vérifier le statut de génération du calendrier éditorial
  app.get("/api/check-generation-status/:siteId", async (req, res) => {
    try {
      const siteId = parseInt(req.params.siteId);
      const since = req.query.since ? new Date(req.query.since as string) : new Date(Date.now() - 10 * 60 * 1000); // 10 minutes par défaut
      
      console.log(`🔍 Vérification du statut de génération pour le site ${siteId} depuis ${since.toISOString()}`);
      
      // Récupérer le contenu éditorial récent pour ce site
      const recentContent = await airtableService.getContentBySite(siteId);
      
      // Filtrer le contenu créé après la date de début de génération
      const newContent = recentContent.filter(content => {
        const createdAt = new Date(content.createdAt || content.dateDeCreation || Date.now());
        return createdAt > since;
      });
      
      const hasNewContent = newContent.length > 0;
      const totalContent = recentContent.length;
      
      console.log(`📊 Résultat vérification:`, {
        siteId,
        hasNewContent,
        newContentCount: newContent.length,
        totalContent,
        since: since.toISOString()
      });
      
      res.json({
        hasNewContent,
        newContentCount: newContent.length,
        totalContent,
        latestContent: newContent.slice(0, 3), // Retourner les 3 derniers contenus
        checkTime: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut:', error);
      res.status(500).json({ 
        message: "Failed to check generation status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Route pour générer un calendrier éditorial via webhook n8n
  app.post("/api/generate-editorial-calendar", async (req, res) => {
    try {
      const { websiteId, websiteName, websiteUrl, seoAnalysis, period } = req.body;
      
      if (!websiteId || !websiteName || !websiteUrl) {
        return res.status(400).json({ message: "websiteId, websiteName, and websiteUrl are required" });
      }
      
      // Préparer les données pour le webhook n8n selon le format attendu
      const webhookData = {
        id_site: websiteId,
        analyse_seo: seoAnalysis || null,
        period: period
      };
      
      console.log('📅 Génération du calendrier éditorial pour le site', websiteId);
      console.log('📊 Données SEO reçues:', seoAnalysis ? 'Oui' : 'Non');
      console.log('⏰ Période sélectionnée:', period);
      
      // Valider les dates selon le mode sélectionné
      if (period === 'monthly') {
        console.log('📅 Mode mensuel sélectionné');
      } else if (period && typeof period === 'object' && period.startDate && period.endDate) {
        console.log('📅 Mode dates personnalisées sélectionné');
        console.log('📅 Date de début:', period.startDate);
        console.log('📅 Date de fin:', period.endDate);
        
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        
        if (endDate <= startDate) {
          return res.status(400).json({ 
            message: "La date de fin doit être postérieure à la date de début" 
          });
        }
        
        // Calculer la durée
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
        console.log('📊 Durée de la période:', durationDays, 'jours');
      } else {
        return res.status(400).json({ 
          message: "La période (mensuelle ou dates personnalisées) est requise" 
        });
      }
      console.log('🔍 JSON COMPLET ENVOYÉ AU WEBHOOK:');
      console.log('================================================');
      console.log('STRUCTURE JSON WEBHOOK:');
      console.log('id_site:', webhookData.id_site);
      console.log('analyse_seo présente:', !!webhookData.analyse_seo);
      if (webhookData.analyse_seo) {
        console.log('analyse_seo.url:', webhookData.analyse_seo.url);
        console.log('analyse_seo.seoScore:', webhookData.analyse_seo.seoScore);
        console.log('analyse_seo.keywordCount:', webhookData.analyse_seo.keywordCount);
        console.log('analyse_seo.keywordAnalysis présent:', !!webhookData.analyse_seo.keywordAnalysis);
        console.log('analyse_seo.contentStrategy présent:', !!webhookData.analyse_seo.contentStrategy);
      }
      console.log('================================================');
      
      // Vérifier que l'analyse SEO contient bien les données nécessaires
      if (seoAnalysis) {
        console.log('✅ Analyse SEO complète trouvée:', {
          url: seoAnalysis.url,
          title: seoAnalysis.title,
          seoScore: seoAnalysis.seoScore,
          keywordCount: seoAnalysis.keywordCount,
          hasKeywordAnalysis: seoAnalysis.keywordAnalysis ? seoAnalysis.keywordAnalysis.length : 0,
          hasContentStrategy: !!seoAnalysis.contentStrategy
        });
      } else {
        console.log('⚠️ Aucune analyse SEO fournie au webhook');
      }
      
      // URL du webhook n8n pour la génération de calendrier éditorial
      const webhookUrl = 'https://doseit.app.n8n.cloud/webhook/b254a7dc-af2a-4994-8d24-82200f836f57';
      
      // Envoyer la requête au webhook n8n avec timeout réduit
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 secondes timeout
      
      console.log('🚀 Envoi du JSON au webhook n8n...');
      console.log('📍 URL webhook:', webhookUrl);
      console.log('📦 CONFIRMATION: Structure JSON utilisée:');
      console.log('   - id_site:', webhookData.id_site);
      console.log('   - analyse_seo:', webhookData.analyse_seo ? 'PRÉSENTE' : 'ABSENTE');
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Webhook error ${response.status}: ${errorText}`);
        
        // Gestion spécifique des erreurs
        if (response.status === 524 || response.status === 502 || response.status === 503) {
          throw new Error('Webhook n8n non disponible: Le workflow n8n est peut-être en mode test ou non activé. Activez-le en mode production ou cliquez sur \'Execute workflow\' pour le mode test.');
        } else if (response.status === 404) {
          throw new Error('Webhook n8n non trouvé: Vérifiez l\'URL du webhook dans les paramètres n8n');
        } else if (response.status === 500) {
          throw new Error('Erreur interne n8n: Le workflow n8n a rencontré une erreur pendant l\'exécution');
        } else if (response.status === 400) {
          throw new Error('Données invalides: Le webhook n8n a reçu des données qu\'il ne peut pas traiter');
        } else {
          throw new Error(`Webhook n8n indisponible (${response.status}): Le workflow est peut-être en mode test ou non activé`);
        }
      }
      
      const result = await response.json();
      
      console.log('✅ Calendrier éditorial généré avec succès !');
      console.log('📥 Réponse du webhook n8n reçue');
      console.log('   - Status:', response.status);
      console.log('   - Response présente:', !!result);
      
      res.json({
        success: true,
        message: "Calendrier éditorial généré avec succès",
        data: result
      });
    } catch (error) {
      console.error("❌ Erreur lors de la génération du calendrier éditorial:", error);
      
      // Gestion spécifique des erreurs pour le frontend
      if (error.message?.includes('timeout') || error.message?.includes('aborted')) {
        res.status(500).json({ 
          message: "Timeout webhook n8n: Le workflow n8n est peut-être en mode test ou non activé", 
          error: error.message,
          solution: "Activez votre workflow n8n ou cliquez sur 'Execute workflow' pour le mode test"
        });
      } else if (error.message?.includes('mode test')) {
        res.status(500).json({ 
          message: "Workflow n8n en mode test", 
          error: error.message,
          solution: "Cliquez sur 'Execute workflow' dans votre canvas n8n puis réessayez"
        });
      } else {
        res.status(500).json({ 
          message: "Erreur lors de la génération du calendrier éditorial", 
          error: error.message 
        });
      }
    }
  });

  // Route pour uploader des images
  app.post("/api/upload-image", (req, res) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        console.error('❌ Erreur multer:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "File too large (max 5MB)" });
        }
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        console.error('❌ Aucun fichier reçu');
        return res.status(400).json({ message: "No image file provided" });
      }

      console.log(`📤 Upload d'image: ${req.file.filename}`);
      console.log('Fichier reçu:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      
      // Générer l'URL accessible pour l'image
      const imageUrl = `/uploads/${req.file.filename}`;
      
      console.log('✅ Image uploadée avec succès:', imageUrl);
      res.json({ imageUrl });
    });
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

  // Route pour l'analyse IA SEO
  app.post("/api/seo-ai-analysis", async (req, res) => {
    try {
      const { siteId, seoData } = req.body;

      if (!seoData) {
        return res.status(400).json({ error: 'Données SEO manquantes' });
      }

      console.log('🤖 Analyse IA SEO pour le site:', siteId);

      // Préparer le prompt pour GPT-4o avec les données SEO réelles
      const prompt = `Tu es un expert SEO senior avec 15 ans d'expérience. Analyse les données SEO suivantes et fournis des recommandations détaillées et actionnables.

DONNÉES SEO À ANALYSER:
- Score SEO: ${seoData.seoScore}/100
- Vitesse de page: ${seoData.pageSpeed}
- Nombre de problèmes: ${seoData.issuesCount}
- Mots-clés suivis: ${seoData.keywordCount}
- Liens internes: ${seoData.internalLinks}
- Liens externes: ${seoData.externalLinks}
- URL: ${seoData.url}

DONNÉES TECHNIQUES:
${JSON.stringify(seoData.technicalSeo, null, 2)}

MÉTRIQUES DE VITESSE:
${JSON.stringify(seoData.pageSpeedMetrics, null, 2)}

ANALYSE DES MOTS-CLÉS:
${JSON.stringify(seoData.keywordAnalysis, null, 2)}

CONSIGNES:
1. Fournis un score global d'évaluation /100 basé sur ton expertise
2. Identifie 3-5 points forts spécifiques
3. Identifie 3-5 points d'amélioration prioritaires  
4. Génère 4-6 recommandations concrètes avec:
   - Priorité (high/medium/low)
   - Catégorie (technique, contenu, mots-clés, vitesse, etc.)
   - Titre court et impactant
   - Description détaillée du problème
   - Impact attendu précis
   - 3-5 étapes d'action concrètes
   - Estimation d'amélioration quantifiée

Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "overallScore": number,
  "summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "string",
      "title": "string",
      "description": "string",
      "impact": "string",
      "actionSteps": ["string"],
      "estimatedImprovement": "string"
    }
  ]
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "Tu es un expert SEO senior. Analyse les données et fournis des recommandations en JSON strict."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 4000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur OpenAI: ${response.status}`);
      }

      const openaiResult = await response.json();
      const analysis = JSON.parse(openaiResult.choices[0].message.content);
      
      console.log('✅ Analyse IA SEO générée avec succès');
      res.json(analysis);
    } catch (error: any) {
      console.error('Erreur lors de l\'analyse IA SEO:', error);
      res.status(500).json({ 
        error: 'Impossible de générer l\'analyse IA',
        details: error.message 
      });
    }
  });

  // ================================================
  // ROUTES POUR LA GESTION DES PROMPTS SYSTÈME
  // ================================================

  // Récupérer tous les prompts système
  app.get("/api/system-prompts", async (req, res) => {
    try {
      console.log('🔍 Récupération de tous les prompts système');
      const prompts = await airtableService.getAllSystemPrompts();
      console.log(`✅ ${prompts.length} prompts système récupérés`);
      res.json(prompts);
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des prompts système:', error);
      res.status(500).json({ 
        message: "Impossible de récupérer les prompts système",
        error: error.message 
      });
    }
  });

  // Récupérer le prompt système actif
  app.get("/api/system-prompts/active", async (req, res) => {
    try {
      console.log('🔍 Récupération du prompt système actif');
      const activePrompt = await airtableService.getActiveSystemPrompt();
      
      if (!activePrompt) {
        return res.status(404).json({ 
          message: "Aucun prompt système actif trouvé" 
        });
      }
      
      console.log('✅ Prompt système actif récupéré:', activePrompt.nom || 'Sans nom');
      res.json(activePrompt);
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération du prompt système actif:', error);
      res.status(500).json({ 
        message: "Impossible de récupérer le prompt système actif",
        error: error.message 
      });
    }
  });

  // Créer un nouveau prompt système
  app.post("/api/system-prompts", async (req, res) => {
    try {
      const { promptSystem, structureSortie, nom, description, actif } = req.body;
      
      console.log('🆕 Création d\'un nouveau prompt système');
      console.log('Données reçues:', { nom, description, actif, promptLength: promptSystem?.length });
      
      if (!promptSystem || promptSystem.trim() === '') {
        return res.status(400).json({ 
          message: "Le prompt système est obligatoire" 
        });
      }

      const promptData = {
        promptSystem: promptSystem.trim(),
        structureSortie: structureSortie || '',
        nom: nom || '',
        description: description || '',
        actif: actif || false
      };

      const createdPrompt = await airtableService.createSystemPrompt(promptData);
      
      console.log('✅ Prompt système créé avec succès:', createdPrompt.id);
      res.status(201).json(createdPrompt);
    } catch (error: any) {
      console.error('❌ Erreur lors de la création du prompt système:', error);
      res.status(500).json({ 
        message: "Impossible de créer le prompt système",
        error: error.message 
      });
    }
  });

  // Mettre à jour un prompt système
  app.put("/api/system-prompts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { promptSystem, structureSortie, nom, description, actif } = req.body;
      
      console.log('🔄 Mise à jour du prompt système:', id);
      console.log('Données reçues:', { nom, description, actif, promptLength: promptSystem?.length });
      
      if (!id) {
        return res.status(400).json({ 
          message: "ID du prompt système manquant" 
        });
      }

      const updateData: any = {};
      
      if (promptSystem !== undefined) {
        if (promptSystem.trim() === '') {
          return res.status(400).json({ 
            message: "Le prompt système ne peut pas être vide" 
          });
        }
        updateData.promptSystem = promptSystem.trim();
      }
      
      if (structureSortie !== undefined) updateData.structureSortie = structureSortie;
      if (nom !== undefined) updateData.nom = nom;
      if (description !== undefined) updateData.description = description;
      if (actif !== undefined) updateData.actif = actif;

      const updatedPrompt = await airtableService.updateSystemPrompt(id, updateData);
      
      console.log('✅ Prompt système mis à jour avec succès');
      res.json(updatedPrompt);
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour du prompt système:', error);
      res.status(500).json({ 
        message: "Impossible de mettre à jour le prompt système",
        error: error.message 
      });
    }
  });

  // Supprimer un prompt système
  app.delete("/api/system-prompts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log('🗑️ Suppression du prompt système:', id);
      
      if (!id) {
        return res.status(400).json({ 
          message: "ID du prompt système manquant" 
        });
      }

      const deleted = await airtableService.deleteSystemPrompt(id);
      
      if (!deleted) {
        return res.status(404).json({ 
          message: "Prompt système non trouvé" 
        });
      }
      
      console.log('✅ Prompt système supprimé avec succès');
      res.json({ message: "Prompt système supprimé avec succès" });
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression du prompt système:', error);
      res.status(500).json({ 
        message: "Impossible de supprimer le prompt système",
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}