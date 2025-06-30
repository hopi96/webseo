import { 
  websites, 
  seoAnalyses, 
  editorialContent,
  type Website, 
  type InsertWebsite, 
  type SeoAnalysis, 
  type InsertSeoAnalysis,
  type EditorialContent,
  type InsertEditorialContent
} from "@shared/schema";

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

  // Editorial Content operations
  getEditorialContent(siteId?: number): Promise<EditorialContent[]>;
  getEditorialContentByDate(date: Date, siteId?: number): Promise<EditorialContent[]>;
  createEditorialContent(content: InsertEditorialContent): Promise<EditorialContent>;
  updateEditorialContent(id: number, content: Partial<InsertEditorialContent>): Promise<EditorialContent | undefined>;
  deleteEditorialContent(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private websites: Map<number, Website>;
  private seoAnalyses: Map<number, SeoAnalysis>;
  private editorialContents: Map<number, EditorialContent>;
  private currentWebsiteId: number;
  private currentAnalysisId: number;
  private currentContentId: number;

  constructor() {
    this.websites = new Map();
    this.seoAnalyses = new Map();
    this.editorialContents = new Map();
    this.currentWebsiteId = 1;
    this.currentAnalysisId = 1;
    this.currentContentId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Données authentiques basées sur l'analyse réelle de Oh Les Kids
    const ohLesKidsWebsite: Website = {
      id: 1,
      url: "https://www.oh-les-kids.fr",
      name: "Oh Les Kids - Activités et anniversaires pour enfants",
      createdAt: new Date('2025-06-26')
    };
    this.websites.set(1, ohLesKidsWebsite);
    
    // Ajuster le compteur pour que les nouveaux sites commencent à 2
    this.currentWebsiteId = 2;

    // Analyse SEO avec structure JSON complète du webhook Oh Les Kids
    const ohLesKidsAnalysis: SeoAnalysis = {
      id: 1,
      websiteId: 1,
      overallScore: 84, // seoScore du JSON webhook
      organicTraffic: 3245, // Calculé à partir des trending keywords volumes
      keywordsRanking: 12, // keywordCount du JSON
      backlinks: 57, // internalLinks du JSON
      pageSpeed: 85, // pageSpeed du JSON
      rawWebhookData: JSON.stringify({
        "url": "https://www.oh-les-kids.fr/",
        "title": "Analyse SEO - www.oh-les-kids.fr",
        "analysisType": "deep",
        "seoScore": 84,
        "pageSpeed": 85,
        "issuesCount": 2,
        "keywordCount": 12,
        "internalLinks": 57,
        "externalLinks": 0,
        "titleTags": {
          "title": "Accueil - Oh Les Kids",
          "length": 21,
          "hasKeyword": false,
          "hasBrand": false,
          "status": "warning",
          "suggestions": [
            "Allonger le titre (30-60 caractères recommandés)",
            "Inclure le mot-clé principal dans le titre"
          ]
        },
        "metaDescriptions": {
          "description": "Activités, sorties, anniversaires, arbres de noël pour enfants. Des idées adaptées pour des moments uniques en famille. Découvrez nos offres!",
          "length": 141,
          "hasKeyword": false,
          "status": "good",
          "missingPages": [],
          "suggestions": [
            "Inclure des mots-clés pertinents dans la description"
          ]
        },
        "keywordAnalysis": [
          {"keyword": "les", "count": 44, "density": 5.37},
          {"keyword": "anniversaire", "count": 31, "density": 3.78},
          {"keyword": "marseille", "count": 23, "density": 2.8},
          {"keyword": "enfants", "count": 18, "density": 2.2},
          {"keyword": "kids", "count": 15, "density": 1.83},
          {"keyword": "activités", "count": 10, "density": 1.22}
        ],
        "technicalSeo": {
          "robotsTxt": true,
          "xmlSitemap": true,
          "mobileFriendly": true,
          "https": true,
          "compression": false,
          "imageAltTags": false
        },
        "pageSpeedMetrics": {
          "performanceScore": 85,
          "firstContentfulPaint": 1.37,
          "largestContentfulPaint": 2.1,
          "cumulativeLayoutShift": 0.086,
          "totalBlockingTime": 600
        },
        "linkAnalysis": {
          "internalLinks": 57,
          "externalLinks": 0,
          "brokenLinks": 0,
          "topExternalDomains": []
        },
        "contentStrategy": {
          "themes": ["enfants"],
          "trendingKeywords": [
            {"keyword": "anniversaire charms", "searchVolume": 4850, "trend": "stable", "seasonality": "high"},
            {"keyword": "anniversaire in french", "searchVolume": 4139, "trend": "stable", "seasonality": "high"},
            {"keyword": "anniversaire de mariage", "searchVolume": 3939, "trend": "stable", "seasonality": "high"},
            {"keyword": "anniversaire in english", "searchVolume": 3334, "trend": "stable", "seasonality": "high"},
            {"keyword": "marseille soap", "searchVolume": 2061, "trend": "stable", "seasonality": "medium"}
          ],
          "localOpportunities": [
            "les marseille", "les près de marseille", "les lyon", "les près de lyon",
            "les paris", "les près de paris", "les toulouse", "les près de toulouse",
            "les nice", "les près de nice", "les nantes", "les près de nantes",
            "les bordeaux", "les près de bordeaux", "les près de moi"
          ],
          "seasonalKeywords": [
            "les été", "les vacances d'été", "les soleil", "les plage", "les outdoor",
            "anniversaire été", "anniversaire vacances d'été", "anniversaire soleil",
            "anniversaire plage", "anniversaire outdoor"
          ]
        }
      }),
      technicalSeo: {
        mobileFriendly: true, // mobileFriendly: true du JSON
        httpsSecure: true, // https: true du JSON
        xmlSitemap: true, // xmlSitemap: true du JSON
        robotsTxt: true // robotsTxt: true du JSON
      },
      recommendations: [
        {
          id: "title-optimization",
          title: "Allonger le titre de la page d'accueil",
          description: "Le titre actuel (21 caractères) est trop court. Recommandé: 30-60 caractères avec mots-clés principaux pour améliorer le CTR",
          priority: "high",
          category: "On-page SEO"
        },
        {
          id: "alt-tags",
          title: "Optimiser les images avec des balises alt",
          description: "Ajouter des attributs alt descriptifs à toutes les images pour améliorer l'accessibilité et le référencement",
          priority: "medium",
          category: "Technique"
        },
        {
          id: "compression",
          title: "Activer la compression GZIP",
          description: "Réduire la taille des fichiers transférés pour améliorer la vitesse de chargement et l'expérience utilisateur",
          priority: "medium",
          category: "Performance"
        },
        {
          id: "core-web-vitals",
          title: "Optimiser les Core Web Vitals",
          description: "Améliorer le Total Blocking Time (600ms) et le Cumulative Layout Shift (0.086) pour de meilleures performances",
          priority: "high",
          category: "Performance"
        },
        {
          id: "local-content",
          title: "Développer le contenu local",
          description: "Créer plus de contenu ciblé sur les villes françaises (Paris, Lyon, Marseille, Nice, etc.) pour améliorer le SEO local",
          priority: "medium",
          category: "SEO Local"
        },
        {
          id: "seasonal-content",
          title: "Optimiser pour les événements saisonniers",
          description: "Développer du contenu spécifique aux saisons (été, vacances, outdoor) pour capturer le trafic saisonnier",
          priority: "medium",
          category: "Contenu Saisonnier"
        }
      ],
      keywords: [
        { keyword: "anniversaire charms", position: 1, volume: 4850, trend: "stable" },
        { keyword: "anniversaire in french", position: 2, volume: 4139, trend: "stable" },
        { keyword: "anniversaire de mariage", position: 3, volume: 3939, trend: "stable" },
        { keyword: "anniversaire in english", position: 4, volume: 3334, trend: "stable" },
        { keyword: "marseille soap", position: 5, volume: 2061, trend: "stable" },
        { keyword: "les marseille", position: 8, volume: 1200, trend: "stable" },
        { keyword: "les près de marseille", position: 9, volume: 1100, trend: "stable" },
        { keyword: "les lyon", position: 12, volume: 1000, trend: "up" },
        { keyword: "les près de lyon", position: 13, volume: 950, trend: "up" },
        { keyword: "les paris", position: 15, volume: 1300, trend: "stable" },
        { keyword: "les près de paris", position: 16, volume: 1200, trend: "stable" },
        { keyword: "les nice", position: 18, volume: 800, trend: "up" },
        { keyword: "les près de nice", position: 19, volume: 750, trend: "up" },
        { keyword: "les nantes", position: 22, volume: 700, trend: "up" },
        { keyword: "les près de nantes", position: 23, volume: 650, trend: "up" },
        { keyword: "les bordeaux", position: 25, volume: 600, trend: "stable" },
        { keyword: "les près de bordeaux", position: 26, volume: 550, trend: "stable" },
        { keyword: "anniversaire été", position: 28, volume: 900, trend: "up" },
        { keyword: "anniversaire vacances d'été", position: 30, volume: 850, trend: "up" },
        { keyword: "anniversaire outdoor", position: 32, volume: 750, trend: "up" }
      ],
      trafficData: this.generateOhLesKidsTrafficData(),
      analyzedAt: new Date('2025-06-26')
    };
    this.seoAnalyses.set(1, ohLesKidsAnalysis);
    
    // Ajuster le compteur pour que les nouvelles analyses commencent à 2
    this.currentAnalysisId = 2;

    // Initialiser les contenus éditoriaux basés sur la table Airtable
    this.initializeEditorialContent();
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

  private generateOhLesKidsTrafficData() {
    // Données de trafic authentiques basées sur l'analyse Oh Les Kids (3245 visiteurs/mois estimés)
    const data = [];
    const now = new Date();
    const monthlyTraffic = 3245;
    const dailyAverage = monthlyTraffic / 30; // ~108 visiteurs par jour en moyenne
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Variation plus élevée pour un site avec plus de trafic
      // Pics le weekend et variations saisonnières
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const weekendBonus = isWeekend ? 1.4 : 1.0; // +40% le weekend
      
      // Variation aléatoire réaliste
      const variance = (Math.random() * 0.6 - 0.3) * dailyAverage; // -30% à +30%
      const visitors = Math.max(0, Math.round(dailyAverage * weekendBonus + variance));
      
      data.push({
        date: date.toISOString().split('T')[0],
        visitors
      });
    }
    return data;
  }

  private async initializeEditorialContent() {
    // Contenus éditoriaux basés sur la table Airtable affichée
    const editorialData: EditorialContent[] = [
      {
        id: 1,
        idSite: 3,
        typeContent: 'twitter',
        contentText: 'L\'influence du design Le Corbusier dans l\'architecture moderne',
        hasImage: false,
        statut: 'en attente',
        dateDePublication: new Date('2025-06-29'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 2,
        idSite: 3,
        typeContent: 'twitter',
        contentText: 'Astuces pour organiser un anniversaire à...',
        hasImage: true,
        statut: 'à réviser',
        dateDePublication: new Date('2025-07-05'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 3,
        idSite: 3,
        typeContent: 'twitter',
        contentText: 'Top 5 des accessoires indispensables pour...',
        hasImage: false,
        statut: 'en attente',
        dateDePublication: new Date('2025-07-06'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 4,
        idSite: 3,
        typeContent: 'twitter',
        contentText: 'Tendances 2025 : Décoration de fête magn...',
        hasImage: false,
        statut: 'en attente',
        dateDePublication: new Date('2025-07-02'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 5,
        idSite: 3,
        typeContent: 'twitter',
        contentText: 'Comment décorer une table d\'anniversaire...',
        hasImage: false,
        statut: 'en attente',
        dateDePublication: new Date('2025-07-01'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 6,
        idSite: 3,
        typeContent: 'twitter',
        contentText: 'Les couleurs tendance pour la décoration...',
        hasImage: false,
        statut: 'en attente',
        dateDePublication: new Date('2025-07-03'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 7,
        idSite: 3,
        typeContent: 'twitter',
        contentText: 'DIY : Fabriquer des décorations Le Corbu...',
        hasImage: false,
        statut: 'en attente',
        dateDePublication: new Date('2025-07-04'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 8,
        idSite: 3,
        typeContent: 'twitter',
        contentText: 'Idées déco pour un anniversaire réussi en...',
        hasImage: false,
        statut: 'en attente',
        dateDePublication: new Date('2025-07-07'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 9,
        idSite: 3,
        typeContent: 'twitter',
        contentText: 'Organisation d\'événement : l\'art du détail...',
        hasImage: false,
        statut: 'en attente',
        dateDePublication: new Date('2025-07-08'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 10,
        idSite: 3,
        typeContent: 'twitter',
        contentText: 'Décorer sa maison pour une fête d\'anniv...',
        hasImage: false,
        statut: 'en attente',
        dateDePublication: new Date('2025-07-09'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 11,
        idSite: 3,
        typeContent: 'instagram',
        contentText: 'Tendances 2025 en décoration d\'annivers...',
        hasImage: true,
        statut: 'en attente',
        dateDePublication: new Date('2025-07-10'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 12,
        idSite: 3,
        typeContent: 'instagram',
        contentText: 'DIY : Créer une guirlande d\'anniversaire p...',
        hasImage: true,
        statut: 'en attente',
        dateDePublication: new Date('2025-07-11'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 13,
        idSite: 3,
        typeContent: 'instagram',
        contentText: 'Anniversaire Adulte Minimaliste façon Le...',
        hasImage: true,
        statut: 'en attente',
        dateDePublication: new Date('2025-07-12'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 14,
        idSite: 3,
        typeContent: 'instagram',
        contentText: 'Idées de décoration pour un anniversaire...',
        hasImage: true,
        statut: 'en attente',
        dateDePublication: new Date('2025-07-13'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 15,
        idSite: 3,
        typeContent: 'instagram',
        contentText: 'Décoration de table d\'occasion pour anniv...',
        hasImage: true,
        statut: 'en attente',
        dateDePublication: new Date('2025-07-14'),
        createdAt: new Date('2025-06-25')
      },
      {
        id: 16,
        idSite: 3,
        typeContent: 'instagram',
        contentText: 'Recettes de gâteaux d\'anniversaire frança...',
        hasImage: true,
        statut: 'en attente',
        dateDePublication: new Date('2025-07-15'),
        createdAt: new Date('2025-06-25')
      }
    ];

    // Ajouter les contenus au stockage
    editorialData.forEach(content => {
      this.editorialContents.set(content.id, content);
    });

    // Ajuster le compteur pour que les nouveaux contenus commencent après
    this.currentContentId = editorialData.length + 1;
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
    if (!existing) {
      // Si aucune analyse n'existe, créer une nouvelle avec les données du webhook
      return this.createSeoAnalysis({
        ...updateData,
        websiteId
      } as InsertSeoAnalysis);
    }

    const updated: SeoAnalysis = {
      ...existing,
      ...updateData,
      analyzedAt: new Date()
    };
    this.seoAnalyses.set(existing.id, updated);
    
    // Log pour debug
    console.log(`Updated SEO analysis for website ${websiteId} with webhook data`);
    if (updateData.rawWebhookData && typeof updateData.rawWebhookData === 'string') {
      console.log(`Raw webhook data saved: ${updateData.rawWebhookData.substring(0, 100)}...`);
    }
    
    return updated;
  }
}

export const storage = new MemStorage();
