# SEO Analytics Dashboard

## Overview

This is a comprehensive SEO analytics dashboard built as a full-stack web application. The system allows users to analyze website SEO performance, track keywords, monitor traffic data, and receive actionable recommendations for improving search engine optimization.

## System Architecture

The application follows a modern full-stack architecture:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Mobile-First Design**: Responsive design optimized for mobile devices

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for RESTful API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Development**: TSX for TypeScript execution in development

## Key Components

### Database Schema
The application uses two main tables:
- **websites**: Stores website information (id, url, name, created_at)
- **seo_analyses**: Stores comprehensive SEO analysis data including:
  - Overall scores and metrics (traffic, keywords, backlinks, page speed)
  - Technical SEO indicators (mobile-friendly, HTTPS, sitemap, robots.txt)
  - Keyword rankings with trend data
  - Traffic analytics over time
  - Prioritized recommendations for improvements

### API Endpoints
- `GET /api/websites` - Retrieve all websites
- `GET /api/websites/:id` - Get specific website details
- `POST /api/websites` - Create new website
- `DELETE /api/websites/:id` - Remove website
- `GET /api/websites/:id/seo-analysis` - Get SEO analysis for website
- `POST /api/websites/:id/seo-analysis` - Create SEO analysis
- `PUT /api/websites/:id/seo-analysis` - Update existing analysis

### Frontend Pages
- **Dashboard**: Overview of SEO metrics, traffic charts, and key recommendations
- **Keywords**: Detailed keyword rankings, search volumes, and trend analysis
- **Reports**: Comprehensive SEO reports with downloadable insights
- **Settings**: Website management and application preferences

## Data Flow

1. **Website Registration**: Users add websites through the settings page
2. **SEO Analysis**: The system generates comprehensive SEO analyses for each website
3. **Data Visualization**: Metrics are displayed through interactive charts and cards
4. **Real-time Updates**: TanStack Query manages data fetching and caching
5. **Mobile Navigation**: Bottom navigation provides easy access to all features

## External Dependencies

### UI and Styling
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography
- Class Variance Authority for component variants

### Data Management
- TanStack Query for server state management
- React Hook Form with Zod validation
- Date-fns for date manipulation

### Development Tools
- TypeScript for type safety
- ESBuild for production bundling
- Replit-specific plugins for development environment

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend
- TSX execution for backend development
- PostgreSQL database provisioned through Replit

### Production
- Frontend: Static build served through Express
- Backend: Bundled Node.js application
- Database: Neon serverless PostgreSQL
- Deployment: Replit autoscale infrastructure

### Build Process
1. Frontend assets built with Vite to `dist/public`
2. Backend bundled with ESBuild to `dist/index.js`
3. Static files served by Express in production

## Changelog

Changelog:
- June 16, 2025. Initial setup
- June 17, 2025. Integrated real SEO data via Google PageSpeed Insights API, complete French translation, removed all mock data
- June 17, 2025. Enhanced dashboard design with modern glassmorphism effects, animated backgrounds, premium card layouts, and sophisticated loading states with shimmer animations
- June 18, 2025. Complete dashboard redesign with ultra-modern mesh gradient backgrounds, morphing animations, glassmorphism effects, sequential entrance animations, and premium interactive elements
- June 18, 2025. Dashboard redesigned with soft and gentle aesthetics - replaced flashy effects with subtle gradients, pastel colors, and calming interactions per user preference
- June 18, 2025. Added comprehensive data visualization with Recharts graphs for Core Web Vitals, technical scores, competitor analysis, and keyword distribution based on real JSON data
- June 18, 2025. Complete project cleanup - removed unused UI components, dashboard components, libraries, and simplified project structure to focus on essential functionality with real data only
- June 26, 2025. Updated dashboard with new Oh Les Kids data including geolocalized keywords (Paris, Lyon, Marseille, Nice, Nantes, Bordeaux) and seasonal keywords (été, vacances, outdoor, plage, soleil) from authentic JSON analysis
- June 26, 2025. Enhanced reports page with navigation menu and professional PDF generation matching dashboard structure exactly
- June 26, 2025. Added complete website management system: add/delete websites, real-time webhook analysis with progress dialog, help tooltips for all metrics, unified navigation across all pages, and enhanced PDF reports with authentic webhook data
- June 30, 2025. Project cleanup - removed unused dashboard pages (dashboard-complete, dashboard-materio, dashboard-new, dashboard.tsx), renamed dashboard-webhook to dashboard, and created comprehensive editorial calendar page with monthly view, event management, and content planning features
- January 8, 2025. Complete editorial article editing system implementation with Airtable synchronization: added EditArticleDialog component with form validation, integrated edit buttons in calendar, implemented bidirectional Airtable sync with updateContent method, and resolved date formatting issues for seamless content management
- January 10, 2025. Integrated n8n chat widget exclusively on editorial calendar page: installed @n8n/chat package, configured webhook URL https://doseit.app.n8n.cloud/webhook/7682526e-bf2c-4be3-8a9c-161ea2c7098a/chat, implemented React useEffect initialization with French translations, and added dedicated chat container div
- January 11, 2025. Major UX improvements implemented: sites nouvellement analysés maintenant affichés en première position dans tous les sélecteurs (tri par date d'analyse décroissante), ajout de nouveaux types de contenu (Facebook, Pinterest, Google My Business) avec couleurs distinctives, gestion d'erreur robuste pour analyses SEO échouées avec message explicatif et bouton de relance, menu dashboard toujours visible même en cas d'erreur d'analyse
- January 17, 2025. Dashboard now uses Airtable sites data: migrated from local database to Airtable "analyse SEO" table with integrated JSON analysis data, dashboard displays real SEO metrics (seoScore, pageSpeed, keywordCount, internalLinks) directly from Airtable, eliminated dependency on local SEO analysis table, improved site selector with clean names (removed "Analyse SEO -" prefix), all metrics now sourced from authentic Airtable JSON data
- January 17, 2025. Removed "Mots-clés" menu item from navigation: eliminated unused keywords page from all navigation components (UnifiedHeader, BottomNavigation, Navigation), streamlined navigation to focus on essential features (Dashboard, Calendrier, Rapports, Paramètres), cleaned up imports removing unused Search icon
- January 17, 2025. Dashboard synchronization improvements: implemented automatic polling (every 30s) of Airtable data to detect newly added sites, added intelligent detection of new sites with automatic selection and toast notifications, resolved flash error on page load by improving loading state management, enhanced error handling to prevent premature error display, added forced data refresh after website addition with optimized cache invalidation strategies
- January 17, 2025. Dashboard cleanup: removed Core Web Vitals section from dashboard per user request to simplify the interface and focus on essential SEO metrics
- January 17, 2025. Nouvelle fonctionnalité programme réseaux sociaux : ajout bouton "Réseaux sociaux" dans dashboard, création formulaire intuitif SocialMediaProgramDialog avec aperçu JSON et validation, implémentation route API PUT /api/sites-airtable/:id/social-program pour mise à jour champ programme_rs dans Airtable, support structure JSON avec fréquences hebdomadaires/mensuelles pour 8 plateformes (newsletter, tiktok, instagram, xtwitter, youtube, facebook, blog, pinterest), interface avec mode édition/aperçu et visualisation des totaux de publications
- January 17, 2025. Fonctionnalité génération calendrier éditorial : ajout bouton "Calendrier éditorial" dans dashboard, création composant EditorialCalendarGeneratorDialog avec interface complète (informations site, fonctionnalités, progression animée), implémentation route API POST /api/generate-editorial-calendar avec webhook n8n https://doseit.app.n8n.cloud/webhook/b254a7dc-af2a-4994-8d24-82200f836f57, gestion des états d'erreur et redirection vers page calendrier, suppression bouton "Ajouter un site" redondant avec bouton bleu "+" pour interface plus épurée
- January 17, 2025. Correction structure JSON webhook calendrier éditorial : modification format de données envoyées au webhook n8n pour correspondre au format attendu avec "id_site" et "analyse_seo" au lieu de "websiteId" et "seoAnalysis", amélioration du timing de loading pour attendre la fin complète du workflow n8n avec délais adaptés (3s traitement IA + 2s finalisation)
- January 17, 2025. Amélioration complète du scroll intelligent : application systématique des classes CSS .smart-scroll-vertical avec scrollbars personnalisées à tous les composants (calendrier, dashboard, rapports, paramètres, dialogues), ajout scroll intelligent aux sélecteurs de sites et listes longues, optimisation des max-height pour tous les SelectContent (max-h-60), amélioration UX avec barres de défilement visibles uniquement au survol ou usage actif
- January 19, 2025. Synchronisation complète paramètres avec données Airtable : migration page settings de l'ancienne API /api/websites vers l'API Airtable /api/sites-airtable pour afficher tous les sites présents dans la table "analyse SEO", ajout des routes DELETE /api/sites-airtable/:id et POST /api/sites-airtable/:id/analyze pour gestion complète (suppression et analyse) des sites Airtable, implémentation méthode deleteSite() dans AirtableService, amélioration timing génération calendrier éditorial (délai 1 heure au lieu de 30 minutes), suppression affichage détails techniques dans résultat génération pour interface plus épurée
- January 22, 2025. Implémentation système de gestion avancée des images : création bibliothèque image-utils.ts avec logique centralisée, support champs duaux Airtable (image pour upload, image_url pour DALL-E), fonction extractImageData améliorée avec détection automatique de source, méthodes handleImageFieldsForCreation/Update pour synchronisation bidirectionnelle, refactorisation complète EditArticleDialog avec nouvelle architecture FormImageState, correction toutes erreurs LSP TypeScript, système intelligent de priorisation d'affichage (upload > DALL-E > existant)
- January 22, 2025. Intégration agent IA SEO avec GPT-4o : création composant SEOAIAgent avec interface moderne, implémentation route API /api/seo-ai-analysis utilisant GPT-4o pour analyse intelligente des données SEO Airtable, génération de recommandations personnalisées avec priorités et plans d'action détaillés, intégration complète dans le dashboard principal pour conseils d'optimisation en temps réel
- January 22, 2025. Amélioration programme publications réseaux sociaux : logique flexible pour publications mensuelles (< 4 publications/mois), nouveau schéma avec champs hebdomadaires et mensuels, interface modernisée avec cartes individuelles par plateforme, auto-calcul et synchronisation entre modes, indicateurs visuels pour différencier les modes de publication
- January 22, 2025. Système de filtrage avancé calendrier éditorial : ajout filtre par plateforme/réseau social combinable avec filtre par site, interface utilisateur améliorée avec compteur de résultats et bouton d'effacement des filtres, support complet pour toutes les plateformes (X, Instagram, Facebook, Pinterest, Google My Business, articles, newsletter)
- January 22, 2025. Implémentation tooltips d'aide dans formulaire création contenu : ajout icônes point d'interrogation avec tooltips explicatifs devant chaque champ (Contenu, Type de contenu, Statut, Site web, Date de publication, Contient une image), messages d'aide détaillés pour guider les utilisateurs, intégration composant Tooltip avec design cohérent
- January 22, 2025. Optimisation majeure système génération calendrier éditorial : élimination délai d'attente fixe de 1h remplacé par système de polling intelligent, implémentation endpoint `/api/check-generation-status/:siteId` pour détection automatique nouveaux contenus Airtable, polling toutes les 10s avec timeout sécurité 15min, génération désormais détectée en temps réel dès ajout de contenu, amélioration UX avec progression dynamique et messages informatifs
- January 24, 2025. Système hybride sélection période génération calendrier éditorial : option mensuelle cochée par défaut (recommandée) + champs dates début/fin pour mode personnalisé, validation intelligente backend (monthly string ou objet dates), interface adaptative avec désactivation des champs dates en mode mensuel, transmission format optimal au webhook n8n selon mode sélectionné, expérience utilisateur intuitive avec aperçu dynamique de la période
- January 24, 2025. Implémentation complète gestion paramètres réseaux sociaux : création SocialParamsDialog avec formulaire sécurisé pour 8 plateformes (Facebook, Instagram, Pinterest, Google My Business, X/Twitter, TikTok, Prestashop Blog, Brevo Newsletter), extension AirtableService avec méthodes getSocialParams/updateSocialParams pour champ "parametre_rs", routes API GET/PUT /api/sites-airtable/:id/social-params, interface avec masquage tokens et indicateurs de configuration, intégration dashboard avec bouton "Tokens réseaux sociaux"
- January 24, 2025. Migration vers structure JSON complexe des tokens API : refactorisation complète SocialParamsDialog pour supporter objets multichamps (Facebook: page_id+access_token, Instagram: user_id+access_token, Pinterest: board_id+access_token, Google My Business: account_id+location_id+access_token, etc.), mise à jour backend AirtableService pour nouvelle structure, interface améliorée avec champs spécialisés par plateforme, bouton repositionné discrètement près des infos site

## User Preferences

Preferred communication style: Simple, everyday language.
Language: French (user communicates in French)
Interest: Real SEO data integration rather than mock data
Requirements: No fictional/mock data, only authentic SEO analysis from real APIs
Interface: Complete French translation required
Design preference: Soft and gentle aesthetics (not flashy or ultra-modern effects)