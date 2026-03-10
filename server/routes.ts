import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWebsiteSchema, insertSeoAnalysisSchema, insertEditorialContentSchema } from "@shared/schema";
import { requestSeoAnalysisFromWebhook } from "./webhook-service";
import { supabaseService, getSupabaseAdmin } from "./supabase-service";
import { openaiService } from "./openai-service";
import { buildMonitoringSummary } from "./monitoring-agent-service";
import { contentGeneratorService } from "./content-generator-service";
import workflowRoutes from "./workflow-routes";
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

function extractAccessToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return undefined;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Enregistrer les routes de workflow (remplacent n8n)
  app.use('/api/workflows', workflowRoutes);

  // Website routes
  app.get("/api/websites", async (req, res) => {
    try {
      const websites = await storage.getWebsites();
      res.json(websites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch websites" });
    }
  });

  // Route pour récupérer les sites depuis Supabase avec données d'analyse SEO
  app.get("/api/sites", async (req, res) => {
    try {
      console.log('🔍 Récupération des sites depuis Supabase...');

      const token = extractAccessToken(req);

      let sites;
      try {
        sites = await supabaseService.getAllSites(token);
      } catch (tokenError) {
        if (!token) throw tokenError;
        console.warn('⚠️ /api/sites: echec avec token, fallback service role');
        sites = await supabaseService.getAllSites();
      }
      console.log('✅ Sites récupérés:', sites.length);
      res.json(sites);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des sites:', error);
      res.status(500).json({ message: "Failed to fetch sites", error: error.message });
    }
  });

  // Route pour récupérer le programme des réseaux sociaux d'un site
  app.get("/api/sites/:id/social-program", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);

      if (isNaN(siteId)) {
        return res.status(400).json({ message: "ID de site invalide" });
      }

      console.log(`🔍 Récupération du programme RS pour le site ${siteId}`);

      const programme = await supabaseService.getSocialMediaProgram(siteId);
      res.json({ programme_rs: programme });
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du programme RS:', error);
      res.status(500).json({
        message: "Impossible de récupérer le programme des réseaux sociaux"
      });
    }
  });

  // Route pour mettre à jour le programme des réseaux sociaux
  app.put("/api/sites/:id/social-program", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      const { programme_rs } = req.body;

      if (!programme_rs) {
        return res.status(400).json({ message: "Le programme des réseaux sociaux est requis" });
      }

      let socialParams;
      try {
        socialParams = typeof programme_rs === 'string' ? JSON.parse(programme_rs) : programme_rs;
      } catch (e) {
        return res.status(400).json({ message: "Format JSON invalide pour le programme" });
      }

      await supabaseService.updateSocialParams(siteId, socialParams);
      res.json({ message: "Programme des réseaux sociaux mis à jour avec succès" });
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du programme RS:", error);
      res.status(500).json({ message: error.message || "Erreur lors de la mise à jour du programme" });
    }
  });

  // Route pour supprimer un site
  app.delete("/api/sites/:id", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      await supabaseService.deleteSite(siteId);
      res.json({ message: "Site supprimé avec succès" });
    } catch (error) {
      console.error("❌ Erreur lors de la suppression du site:", error);
      res.status(500).json({ message: error.message || "Erreur lors de la suppression du site" });
    }
  });

  // Route pour analyser un site (CORRIGÉ: sauvegarde maintenant dans Supabase)
  app.post("/api/sites/:id/analyze", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      const sites = await supabaseService.getAllSites();
      const site = sites.find(s => s.id === siteId);

      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }

      console.log(`🔄 Déclenchement de l'analyse SEO pour ${site.url}...`);

      // Utiliser le service SEO qui sauvegarde automatiquement dans Supabase
      const { seoAnalysisService } = await import('./seo-analysis-service');
      const result = await seoAnalysisService.generateAndSaveSeoReport(site.url, site.name);

      console.log(`✅ Analyse SEO terminée et sauvegardée pour site ID: ${result.siteId}`);

      res.json({
        success: true,
        siteId: result.siteId,
        analysis: result.analysis
      });
    } catch (error) {
      console.error("❌ Erreur lors de l'analyse du site:", error);
      res.status(500).json({ message: error.message || "Erreur lors de l'analyse du site" });
    }
  });



  // Route pour rafraîchir l'analyse SEO d'un site (CORRIGÉ: sauvegarde maintenant dans Supabase)
  app.post("/api/sites/:id/refresh-analysis", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      const sites = await supabaseService.getAllSites();
      const site = sites.find(s => s.id === siteId);

      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }

      console.log(`🔄 Rafraîchissement de l'analyse SEO pour ${site.url}...`);

      // Utiliser le service SEO qui sauvegarde automatiquement dans Supabase
      const { seoAnalysisService } = await import('./seo-analysis-service');
      const result = await seoAnalysisService.generateAndSaveSeoReport(site.url, site.name);

      console.log(`✅ Analyse SEO rafraîchie et sauvegardée pour site ID: ${result.siteId}`);

      res.json({
        success: true,
        siteId: result.siteId,
        analysis: result.analysis
      });
    } catch (error) {
      console.error("❌ Erreur lors du rafraîchissement de l'analyse:", error);
      res.status(500).json({ message: "Failed to refresh analysis", error: error.message });
    }
  });

  // ============= GEO Analysis Routes =============

  // Route pour lancer une analyse GEO (Generative Engine Optimization)
  app.post("/api/sites/:id/analyze-geo", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      const sites = await supabaseService.getAllSites();
      const site = sites.find(s => s.id === siteId);

      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }

      console.log(`🤖 Lancement analyse GEO pour ${site.url}...`);

      // Importer et utiliser le service GEO
      const { geoAnalysisService } = await import('./geo-analysis-service');
      const geoResult = await geoAnalysisService.analyzeGEO(site.url);

      // Sauvegarder dans Supabase
      await supabaseService.saveGeoAnalysis(siteId, geoResult, geoResult.geoScore);

      console.log(`✅ Analyse GEO terminée - Score: ${geoResult.geoScore}/100`);

      res.json({
        success: true,
        siteId,
        geoScore: geoResult.geoScore,
        analysis: geoResult
      });
    } catch (error: any) {
      console.error("❌ Erreur analyse GEO:", error);
      res.status(500).json({ message: "Failed to analyze GEO", error: error.message });
    }
  });

  // Route pour récupérer l'analyse GEO d'un site
  app.get("/api/sites/:id/geo-analysis", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);

      if (isNaN(siteId)) {
        return res.status(400).json({ message: "ID de site invalide" });
      }

      const result = await supabaseService.getGeoAnalysis(siteId);

      if (!result) {
        return res.status(404).json({
          message: "Aucune analyse GEO disponible",
          hint: "Lancez une analyse GEO avec POST /api/sites/:id/analyze-geo"
        });
      }

      res.json(result);
    } catch (error: any) {
      console.error("❌ Erreur récupération analyse GEO:", error);
      res.status(500).json({ message: "Failed to get GEO analysis", error: error.message });
    }
  });

  // ============= Site Prompts Routes =============

  // Route pour récupérer tous les prompts d'un site (personnalisés + globaux)
  app.get("/api/sites/:id/prompts", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);

      if (isNaN(siteId)) {
        return res.status(400).json({ message: "ID de site invalide" });
      }

      console.log(`🔍 Récupération des prompts pour le site ${siteId}`);
      const prompts = await supabaseService.getAllPromptsForSite(siteId);

      res.json({
        siteId,
        prompts,
        totalCount: prompts.length,
        customCount: prompts.filter(p => p.isCustom).length
      });
    } catch (error: any) {
      console.error("❌ Erreur récupération prompts site:", error);
      res.status(500).json({ message: "Failed to get site prompts", error: error.message });
    }
  });

  // Route pour récupérer un prompt spécifique (site-spécifique ou global)
  app.get("/api/sites/:id/prompts/:platform", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      const platform = req.params.platform;

      if (isNaN(siteId)) {
        return res.status(400).json({ message: "ID de site invalide" });
      }

      const prompt = await supabaseService.getSitePrompt(siteId, platform);

      if (!prompt) {
        return res.status(404).json({
          message: `Aucun prompt trouvé pour ${platform}`,
          hint: "Le prompt global par défaut sera utilisé"
        });
      }

      res.json({
        siteId,
        platform,
        prompt: prompt.promptSystem,
        name: prompt.name
      });
    } catch (error: any) {
      console.error("❌ Erreur récupération prompt:", error);
      res.status(500).json({ message: "Failed to get prompt", error: error.message });
    }
  });

  // Route pour sauvegarder/mettre à jour un prompt personnalisé pour un site
  app.post("/api/sites/:id/prompts/:platform", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      const platform = req.params.platform;
      const { promptSystem, name } = req.body;

      if (isNaN(siteId)) {
        return res.status(400).json({ message: "ID de site invalide" });
      }

      if (!promptSystem || typeof promptSystem !== 'string') {
        return res.status(400).json({ message: "promptSystem requis (string)" });
      }

      console.log(`💾 Sauvegarde prompt personnalisé: site ${siteId}, plateforme ${platform}`);
      const result = await supabaseService.saveSitePrompt(siteId, platform, promptSystem, name);

      res.json({
        success: true,
        message: `Prompt ${platform} personnalisé pour le site ${siteId}`,
        ...result
      });
    } catch (error: any) {
      console.error("❌ Erreur sauvegarde prompt:", error);
      res.status(500).json({ message: "Failed to save prompt", error: error.message });
    }
  });

  // Route pour supprimer un prompt personnalisé (revenir au global)
  app.delete("/api/sites/:id/prompts/:platform", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      const platform = req.params.platform;

      if (isNaN(siteId)) {
        return res.status(400).json({ message: "ID de site invalide" });
      }

      console.log(`🗑️ Suppression prompt personnalisé: site ${siteId}, plateforme ${platform}`);
      const success = await supabaseService.deleteSitePrompt(siteId, platform);

      res.json({
        success,
        message: success
          ? `Prompt ${platform} réinitialisé (utilise maintenant le prompt global)`
          : `Aucun prompt personnalisé à supprimer pour ${platform}`
      });
    } catch (error: any) {
      console.error("❌ Erreur suppression prompt:", error);
      res.status(500).json({ message: "Failed to delete prompt", error: error.message });
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

      console.log(`🆕 Ajout d'un nouveau site web: ${validatedData.url}`);

      // Utiliser le service SEO qui crée le site ET l'analyse dans Supabase
      const { seoAnalysisService } = await import('./seo-analysis-service');
      const result = await seoAnalysisService.generateAndSaveSeoReport(validatedData.url, validatedData.name);

      console.log(`✅ Site créé avec ID: ${result.siteId}, analyse SEO sauvegardée dans Supabase`);

      // Retourner le site créé avec l'analyse
      res.status(201).json({
        id: result.siteId,
        name: validatedData.name,
        url: validatedData.url,
        seoAnalysis: result.analysis
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid website data", errors: error.errors });
      }
      console.error("❌ Erreur lors de la création du site:", error);
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
      const token = extractAccessToken(req);
      // Utiliser supabaseService au lieu de storage (qui pointe vers AirTable/Memory)
      let content;
      try {
        if (siteId) {
          content = await supabaseService.getContentBySite(siteId, token);
        } else {
          content = await supabaseService.getAllContent(token);
        }
      } catch (tokenError) {
        if (!token) throw tokenError;
        console.warn('⚠️ /api/editorial-content: echec avec token, fallback service role');
        if (siteId) {
          content = await supabaseService.getContentBySite(siteId);
        } else {
          content = await supabaseService.getAllContent();
        }
      }
      res.json(content);
    } catch (error) {
      console.error('Erreur GET /api/editorial-content:', error);
      res.status(500).json({ message: "Failed to fetch editorial content" });
    }
  });

  app.get("/api/editorial-content/date/:date", async (req, res) => {
    try {
      const date = new Date(req.params.date);
      const token = extractAccessToken(req);
      // Utiliser supabaseService au lieu de storage
      let content;
      try {
        content = await supabaseService.getContentByDate(date, token);
      } catch (tokenError) {
        if (!token) throw tokenError;
        console.warn('⚠️ /api/editorial-content/date: echec avec token, fallback service role');
        content = await supabaseService.getContentByDate(date);
      }
      res.json(content);
    } catch (error) {
      console.error('Erreur GET /api/editorial-content/date/:date :', error);
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
        typeContent: req.body.typeContent || 'newsletter',
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
      const createdContent = await supabaseService.createContent(contentData);

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
      const updatedContents = await supabaseService.bulkUpdateStatus(ids, statut);

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

  // Route pour créer un nouveau contenu éditorial
  app.post("/api/editorial-content", async (req, res) => {
    try {
      console.log('📝 Création nouveau contenu éditorial via API');
      const newContent = await supabaseService.createContent(req.body);
      res.json(newContent);
    } catch (error: any) {
      console.error('Erreur création contenu:', error);
      res.status(500).json({
        message: "Impossible de créer le contenu",
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
      const updatedContent = await supabaseService.updateContent(airtableId, updateData);

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
      const success = await supabaseService.deleteContent(airtableId);

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

  // Route Express Content Generation — Génère du contenu IA en un clic
  app.post("/api/express-content", async (req, res) => {
    try {
      const { siteId, platform, topic, publicationDate, systemPrompt } = req.body;

      if (!siteId || !platform || !topic || !publicationDate) {
        return res.status(400).json({
          message: "Champs requis: siteId, platform, topic, publicationDate"
        });
      }

      const parsedSiteId = parseInt(siteId.toString());
      console.log(`⚡ Génération Express — Site ${parsedSiteId}, Plateforme: ${platform}, Sujet: ${topic}`);
      console.log(`📅 Date de publication: ${publicationDate}`);
      if (systemPrompt) {
        console.log(`📝 Prompt système personnalisé fourni (${systemPrompt.length} caractères)`);
      }

      // Construire le contexte enrichi avec le prompt système custom si fourni
      const contextParts = [`Sujet principal: ${topic}`];
      if (systemPrompt) {
        contextParts.push(`Instructions supplémentaires: ${systemPrompt}`);
      }

      // Sauvegarder le contenu directement via supabaseService après génération IA
      // On utilise le service de contenu qui gère prompt DB + recherche + Claude
      const result = await contentGeneratorService.generateContent({
        siteId: parsedSiteId,
        platform,
        theme: topic,
        context: contextParts.join('\n'),
        publicationDate: new Date(publicationDate).toISOString(),
        generateImage: ['instagram', 'pinterest'].includes(platform)
      });

      console.log(`✅ Contenu Express créé: ID ${result.id}`);

      res.status(201).json(result);
    } catch (error: any) {
      console.error('❌ Erreur génération express:', error);
      const errorMsg = error.message || 'Erreur inconnue';

      // Identifier les erreurs les plus courantes
      let userMessage = "Erreur lors de la génération express du contenu";
      if (errorMsg.includes('API key') || errorMsg.includes('ANTHROPIC') || errorMsg.includes('authentication')) {
        userMessage = "Clé API Claude/Anthropic non configurée ou invalide.";
      } else if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        userMessage = "Trop de requêtes. Veuillez réessayer dans quelques secondes.";
      } else if (errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED')) {
        userMessage = "Le service IA est temporairement indisponible.";
      }

      res.status(500).json({
        message: userMessage,
        error: errorMsg
      });
    }
  });

  // Route pour adapter un prompt système (enrichissement via l'IA)
  app.post("/api/adapt-prompt", async (req, res) => {
    try {
      const { basePrompt, topic, platform } = req.body;

      if (!basePrompt || !topic || !platform) {
        return res.status(400).json({
          message: "Champs requis: basePrompt, topic, platform"
        });
      }

      console.log(`✨ Adaptation du prompt pour le sujet: "${topic}" (${platform})`);

      const adaptedPrompt = await openaiService.adaptSystemPrompt(basePrompt, topic, platform);

      res.json({ prompt: adaptedPrompt });
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'adaptation du prompt:', error);
      res.status(500).json({
        message: "Erreur lors de l'adaptation du prompt",
        error: error.message
      });
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
  app.get("/api/sites/:id/social-params", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);

      if (isNaN(siteId)) {
        return res.status(400).json({ message: "ID de site invalide" });
      }

      console.log(`🔍 Récupération des paramètres réseaux sociaux pour le site ${siteId}`);

      const socialParams = await supabaseService.getSocialParams(siteId);
      res.json(socialParams);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des paramètres réseaux sociaux:', error);
      res.status(500).json({
        message: "Impossible de récupérer les paramètres des réseaux sociaux"
      });
    }
  });

  app.put("/api/sites/:id/social-params", async (req, res) => {
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

      await supabaseService.updateSocialParams(siteId, socialParams);
      res.json({ message: "Paramètres des réseaux sociaux mis à jour avec succès" });
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des paramètres réseaux sociaux:', error);
      res.status(500).json({
        message: "Impossible de mettre à jour les paramètres des réseaux sociaux"
      });
    }
  });

  // Route pour mettre à jour le programme de publications (fréquences)
  // Cette route est appelée par le dialogue SocialMediaProgramDialog

  // Monitoring & Agent IA
  app.get("/api/monitoring/overview", async (req, res) => {
    try {
      const siteId = req.query.siteId ? parseInt(req.query.siteId as string) : undefined;
      const token = extractAccessToken(req);
      let overview;
      try {
        overview = await supabaseService.getMonitoringSnapshot(siteId, token);
      } catch (tokenError) {
        if (!token) throw tokenError;
        console.warn('⚠️ /api/monitoring/overview: echec avec token, fallback service role');
        overview = await supabaseService.getMonitoringSnapshot(siteId);
      }
      res.json(overview);
    } catch (error: any) {
      console.error('❌ Erreur monitoring overview:', error);
      res.status(500).json({ message: error.message || 'Erreur monitoring' });
    }
  });

  app.post("/api/monitoring/summary", async (req, res) => {
    try {
      const siteId = req.body?.siteId ? parseInt(req.body.siteId) : undefined;
      const token = extractAccessToken(req);
      let overview;
      try {
        overview = await supabaseService.getMonitoringSnapshot(siteId, token);
      } catch (tokenError) {
        if (!token) throw tokenError;
        console.warn('⚠️ /api/monitoring/summary: echec avec token, fallback service role');
        overview = await supabaseService.getMonitoringSnapshot(siteId);
      }
      const summary = await buildMonitoringSummary(overview);
      res.json({ summary });
    } catch (error: any) {
      console.error('❌ Erreur monitoring summary:', error);
      res.status(500).json({ message: error.message || 'Erreur monitoring' });
    }
  });

  app.put("/api/sites/:id/social-program", async (req, res) => {
    try {
      const siteId = parseInt(req.params.id);
      const { programme_rs } = req.body;

      if (isNaN(siteId)) {
        return res.status(400).json({ message: "ID de site invalide" });
      }

      if (!programme_rs) {
        return res.status(400).json({ message: "programme_rs requis" });
      }

      console.log(`📅 Mise à jour du programme de publications pour le site ${siteId}`);

      // Parser le JSON si c'est une chaîne
      let programData;
      try {
        programData = typeof programme_rs === 'string' ? JSON.parse(programme_rs) : programme_rs;
      } catch (e) {
        return res.status(400).json({ message: "Format JSON invalide pour programme_rs" });
      }

      // Récupérer les paramètres existants pour fusionner
      const existingParams = await supabaseService.getSocialParams(siteId);

      // Fusionner les fréquences avec les paramètres existants
      const updatedParams = {
        ...existingParams,
        frequence_publication: programData.frequence_publication
      };

      // Sauvegarder dans social_params
      await supabaseService.updateSocialParams(siteId, updatedParams);

      console.log(`✅ Programme de publications mis à jour pour le site ${siteId}`);
      res.json({
        message: "Programme de publications mis à jour avec succès",
        data: updatedParams
      });
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du programme:', error);
      res.status(500).json({
        message: "Impossible de mettre à jour le programme de publications"
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
      const recentContent = await supabaseService.getContentBySite(siteId);

      // Filtrer le contenu créé après la date de début de génération
      const newContent = recentContent.filter(content => {
        const createdAt = new Date(content.createdAt || Date.now());
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

  // Claude article generation routes
  app.post("/api/generate-article", async (req, res) => {
    try {
      const { keywords, topic, contentType, targetAudience, tone, existingContent } = req.body;

      console.log('🤖 Génération d\'article avec Claude');
      console.log('🔎 CONTENT_GEN_DEBUG:', process.env.CONTENT_GEN_DEBUG === 'true' ? 'enabled' : 'disabled');
      console.log('Paramètres:', { keywords, topic, contentType, existingContent: !!existingContent });

      const generatedArticle = await openaiService.generateArticle({
        keywords: keywords || [],
        topic,
        contentType: contentType || 'xtwitter',
        targetAudience,
        tone,
        existingContent
      });

      console.log('✅ Article généré avec succès (Claude)');
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
      const siteIdParam = req.query.siteId;
      const siteId = siteIdParam ? parseInt(siteIdParam as string) : undefined;

      console.log('🔍 Récupération des prompts système', siteId ? `pour le site ${siteId}` : '(Global)');
      const prompts = await supabaseService.getAllSystemPrompts(siteId);
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
      const activePrompt = await supabaseService.getActiveSystemPrompt();

      if (!activePrompt) {
        return res.status(404).json({
          message: "Aucun prompt système actif trouvé"
        });
      }

      console.log('✅ Prompt système actif récupéré:', activePrompt.name || 'Sans nom');
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
      const { promptSystem, outputStructure, name, description, isActive } = req.body;

      console.log('🆕 Création d\'un nouveau prompt système');
      console.log('Données reçues:', { name, description, isActive, promptLength: promptSystem?.length });

      if (!promptSystem || promptSystem.trim() === '') {
        return res.status(400).json({
          message: "Le prompt système est obligatoire"
        });
      }

      const promptData = {
        promptSystem: promptSystem.trim(),
        outputStructure: outputStructure || '',
        name: name || '',
        description: description || '',
        isActive: isActive || false
      };

      const createdPrompt = await supabaseService.createSystemPrompt(promptData);

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
      const { promptSystem, outputStructure, name, description, isActive, siteId } = req.body;

      console.log('🔄 Mise à jour du prompt système:', id);
      console.log('Données reçues:', { name, description, isActive, promptLength: promptSystem?.length, siteId });

      if (!id) {
        return res.status(400).json({
          message: "ID du prompt système manquant"
        });
      }

      // Check current prompt status (global or local)
      const allPrompts = await supabaseService.getAllSystemPrompts();
      const currentPrompt = allPrompts.find(p => p.id.toString() === id.toString());

      // FORK LOGIC: If editing a global prompt for a specific site, create or update a site-specific prompt
      // Note: We use site_prompts table now via saveSitePrompt
      if (siteId) {  // If siteId provided, we are in site context
        console.log('🔀 Saving site-specific prompt for site:', siteId);

        // We need the platform. If it's a global prompt being forked, it has platform.
        // If it's already a site prompt being updated, it has platform.
        // currentPrompt comes from getAllSystemPrompts which merges both.
        // FALLBACK: If platform is missing (legacy prompts), assume 'seo' (default)
        const platformToUse = currentPrompt?.platform || 'seo';

        if (!currentPrompt) {
          return res.status(400).json({
            message: "Prompt non trouvé"
          });
        }

        const savedPrompt = await supabaseService.saveSitePrompt(
          siteId,
          platformToUse,
          promptSystem !== undefined ? promptSystem.trim() : (currentPrompt.promptSystem || ''),
          name !== undefined ? name : currentPrompt.name
        );

        return res.json({
          id: savedPrompt.id.toString(),
          siteId: savedPrompt.siteId,
          platform: savedPrompt.platform,
          name: savedPrompt.name,
          promptSystem: savedPrompt.promptSystem,
          isActive: true,
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

      if (outputStructure !== undefined) updateData.outputStructure = outputStructure;
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (siteId !== undefined) updateData.siteId = siteId;

      const updatedPrompt = await supabaseService.updateSystemPrompt(id, updateData);

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

      const deleted = await supabaseService.deleteSystemPrompt(id);

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

  // ============= User Management Routes (Admin only) =============

  const allowedAdminRoles = z.enum(["superadmin", "admin", "site_user"]);
  const createAdminUserSchema = z.object({
    email: z.string().min(1, "Identifiant requis"),
    password: z.string().min(6, "Le mot de passe doit faire au moins 6 caracteres"),
    role: allowedAdminRoles,
    sites: z.array(z.number().int().positive()).optional().default([]),
  });

  const normalizeUserEmail = (identifier: string): string => {
    const normalized = identifier.trim().toLowerCase();
    return normalized.includes("@") ? normalized : `${normalized}@webseo.local`;
  };

  app.get("/api/admin/users", async (req, res) => {
    try {
      // NOTE: En production, il faudrait verifier le role de l'utilisateur qui fait la requete
      // via req.headers.authorization (le JWT). Ici on suppose que le middleware le fera ou 
      // que le client frontend le gere en RLS. Mais ce endpoint doit lire toute la liste
      // via l'admin client.
      const adminClient = getSupabaseAdmin();

      const { data: users, error: usersError } = await adminClient.auth.admin.listUsers();
      if (usersError) throw usersError;

      const { data: roles, error: rolesError } = await supabaseService.getAllRoles();
      if (rolesError) throw rolesError;

      const { data: sites, error: sitesError } = await supabaseService.getAllUserSites();
      if (sitesError) throw sitesError;

      const safeRoles = Array.isArray(roles) ? roles : [];
      const safeSites = Array.isArray(sites) ? sites : [];

      const formattedUsers = users.users.map(u => ({
        id: u.id,
        email: u.email,
        role: safeRoles.find((r: any) => r.user_id === u.id)?.role || 'inconnu',
        sites: safeSites.filter((s: any) => s.user_id === u.id).map((s: any) => s.site_id)
      }));

      res.json(formattedUsers);
    } catch (error: any) {
      console.error("Erreur recuperation utilisateurs:", error);
      res.status(500).json({ message: "Erreur lecture utilisateurs", error: error.message });
    }
  });

  app.post("/api/admin/users", async (req, res) => {
    try {
      const parsedBody = createAdminUserSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          message: "Donnees utilisateur invalides",
          error: parsedBody.error.issues.map((issue) => issue.message).join(", "),
        });
      }

      const { email, password, role, sites } = parsedBody.data;
      const normalizedEmail = normalizeUserEmail(email);
      const emailValidation = z.string().email().safeParse(normalizedEmail);
      if (!emailValidation.success) {
        return res.status(400).json({
          message: "Adresse email invalide",
          error: "Utilisez un email valide ou un identifiant simple (ex: jean -> jean@webseo.local)",
        });
      }

      const siteIds = role === "site_user" ? sites : [];
      if (role === "site_user" && siteIds.length === 0) {
        return res.status(400).json({
          message: "Au moins un site est requis",
          error: "Selectionnez au moins un site pour un utilisateur de type site_user.",
        });
      }

      const adminClient = getSupabaseAdmin();

      // 1. Create User
      const { data, error: createError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true
      });

      if (createError) {
        const loweredMessage = (createError.message || "").toLowerCase();
        const statusCode = loweredMessage.includes("already") ? 409 : 400;
        return res.status(statusCode).json({
          message: "Erreur creation utilisateur",
          error: createError.message,
        });
      }

      const userId = data.user?.id;
      if (!userId) {
        throw new Error("Impossible de recuperer l'identifiant du nouvel utilisateur.");
      }

      // 2. Set Role
      const roleResult = await supabaseService.setUserRole(userId, role);
      if (roleResult.error) throw roleResult.error;

      // 3. Set Sites (if applicable)
      const sitesResult = await supabaseService.setUserSites(userId, siteIds);
      if (sitesResult.error) throw sitesResult.error;

      res.status(201).json({
        success: true,
        user: data.user,
        normalizedEmail,
      });
    } catch (error: any) {
      console.error("Erreur creation utilisateur:", error);
      res.status(500).json({ message: "Erreur creation utilisateur", error: error.message });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const adminClient = getSupabaseAdmin();
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) throw error;
      res.json({ success: true, message: "Utilisateur supprime" });
    } catch (error: any) {
      res.status(500).json({ message: "Erreur suppression", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
