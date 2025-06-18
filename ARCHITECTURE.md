# Architecture du Projet SEO Analytics

## Vue d'ensemble
Application web d'analyse SEO complète construite avec une architecture full-stack moderne, optimisée pour afficher des données SEO réelles avec une interface douce et épurée.

## Structure du Projet

```
├── client/                          # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/              # Composants de mise en page
│   │   │   │   ├── mobile-header.tsx
│   │   │   │   └── bottom-navigation.tsx
│   │   │   ├── ui/                  # Composants UI essentiels
│   │   │   │   ├── alert-dialog.tsx # Dialogues de confirmation
│   │   │   │   ├── badge.tsx        # Badges de statut
│   │   │   │   ├── button.tsx       # Boutons interactifs
│   │   │   │   ├── card.tsx         # Cartes de contenu
│   │   │   │   ├── dialog.tsx       # Modales
│   │   │   │   ├── form.tsx         # Formulaires
│   │   │   │   ├── input.tsx        # Champs de saisie
│   │   │   │   ├── label.tsx        # Étiquettes
│   │   │   │   ├── progress.tsx     # Barres de progression
│   │   │   │   ├── select.tsx       # Listes déroulantes
│   │   │   │   ├── separator.tsx    # Séparateurs
│   │   │   │   ├── shimmer.tsx      # Animations de chargement
│   │   │   │   ├── skeleton.tsx     # Squelettes de chargement
│   │   │   │   ├── switch.tsx       # Interrupteurs
│   │   │   │   ├── toast.tsx        # Notifications
│   │   │   │   ├── toaster.tsx      # Gestionnaire de notifications
│   │   │   │   └── tooltip.tsx      # Info-bulles
│   │   │   └── website/             # Composants spécifiques aux sites
│   │   │       ├── add-website-dialog.tsx
│   │   │       └── website-selector.tsx
│   │   ├── hooks/                   # Hooks personnalisés
│   │   │   ├── use-mobile.tsx       # Détection mobile
│   │   │   ├── use-theme.tsx        # Gestion des thèmes
│   │   │   └── use-toast.ts         # Gestion des notifications
│   │   ├── lib/                     # Utilitaires et configuration
│   │   │   ├── queryClient.ts       # Configuration TanStack Query
│   │   │   └── utils.ts             # Fonctions utilitaires
│   │   ├── pages/                   # Pages de l'application
│   │   │   ├── dashboard.tsx        # Tableau de bord principal
│   │   │   ├── keywords.tsx         # Page mots-clés (redirige vers dashboard)
│   │   │   ├── reports.tsx          # Page rapports (redirige vers dashboard)
│   │   │   ├── settings.tsx         # Paramètres et gestion des sites
│   │   │   └── not-found.tsx        # Page 404
│   │   ├── App.tsx                  # Composant racine et routage
│   │   ├── main.tsx                 # Point d'entrée React
│   │   └── index.css                # Styles globaux et variables CSS
│   └── index.html                   # Template HTML
├── server/                          # Backend Express
│   ├── index.ts                     # Serveur principal
│   ├── routes.ts                    # Routes API simplifiées
│   ├── storage.ts                   # Stockage en mémoire avec données Plug2AI
│   └── vite.ts                      # Configuration Vite pour le développement
├── shared/                          # Types partagés
│   └── schema.ts                    # Schémas Drizzle et types TypeScript
├── attached_assets/                 # Données sources
│   └── Pasted--meta-pageAnalyzed-https-www-plug2ai-com-services...txt
├── components.json                  # Configuration Shadcn/ui
├── tailwind.config.ts               # Configuration Tailwind CSS
├── vite.config.ts                   # Configuration Vite
├── tsconfig.json                    # Configuration TypeScript
├── package.json                     # Dépendances npm
└── replit.md                        # Documentation du projet
```

## Stack Technique

### Frontend
- **React 18** avec TypeScript pour une interface typée et réactive
- **Vite** pour un développement rapide et un build optimisé
- **Wouter** pour un routage léger côté client
- **TanStack Query** pour la gestion d'état serveur et la mise en cache
- **Tailwind CSS** pour un styling utilitaire avec design soft
- **Recharts** pour les graphiques de données SEO
- **Shadcn/ui** composants accessibles basés sur Radix UI

### Backend
- **Node.js** avec TypeScript pour un serveur typé
- **Express.js** pour les API REST
- **Stockage en mémoire** avec données réelles Plug2AI pré-chargées
- **Drizzle ORM** pour la définition des schémas de données

### Outils de Développement
- **TSX** pour l'exécution TypeScript en développement
- **ESBuild** pour le bundling de production
- **Replit** pour l'environnement de développement intégré

## Architecture des Données

### Modèles Principaux

#### Website
```typescript
{
  id: number
  url: string
  name: string
  createdAt: Date
}
```

#### SEO Analysis
```typescript
{
  id: number
  websiteId: number
  overallScore: number
  organicTraffic: number
  keywordsRanking: number
  backlinks: number
  pageSpeed: number
  technicalSeo: {
    mobileFriendly: boolean
    httpsSecure: boolean
    xmlSitemap: boolean
    robotsTxt: boolean
  }
  recommendations: Array<{
    id: string
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    category: string
  }>
  keywords: Array<{
    keyword: string
    position: number
    volume: number
    trend: 'up' | 'down' | 'stable'
  }>
  trafficData: Array<{
    date: string
    visitors: number
  }>
  createdAt: Date
  updatedAt: Date
}
```

## API Endpoints

### Websites
- `GET /api/websites` - Liste tous les sites
- `GET /api/websites/:id` - Détails d'un site
- `POST /api/websites` - Créer un nouveau site
- `DELETE /api/websites/:id` - Supprimer un site

### SEO Analysis
- `GET /api/websites/:id/seo-analysis` - Récupérer l'analyse SEO
- `POST /api/websites/:id/seo-analysis` - Créer une analyse SEO
- `PUT /api/websites/:id/seo-analysis` - Mettre à jour une analyse

## Composants Dashboard

### Graphiques de Données (Recharts)
1. **Core Web Vitals** - Graphique en barres comparant mobile/desktop
2. **Scores Techniques** - Graphique radial des scores par catégorie
3. **Analyse Concurrentielle** - Graphique en barres horizontales du trafic
4. **Distribution des Mots-clés** - Graphique circulaire marque vs générique

### Métriques Affichées
- Score SEO global (76/100)
- Trafic organique (30 visiteurs/mois)
- Nombre de mots-clés (16)
- Nombre de backlinks (5)
- Vitesse de page (65/100)

## Données Plug2AI Intégrées

L'application utilise exclusivement les données réelles extraites du JSON d'analyse Plug2AI :
- Métriques de performance authentiques
- Core Web Vitals réels (LCP, CLS, INP)
- Analyse concurrentielle factuelle
- 16 mots-clés réels avec positions exactes
- Recommandations SEO basées sur l'audit véritable

## Philosophie de Design

### Approche "Soft" (Douce)
- Couleurs pastel et dégradés subtils
- Animations fluides et transitions douces
- Effets de glassmorphisme légers
- Pas d'éléments flashy ou ultra-modernes
- Interface apaisante et professionnelle

### Responsive Design
- Mobile-first avec navigation en bas d'écran
- Grilles adaptatives pour desktop
- Typographie lisible sur tous les écrans
- Interactions tactiles optimisées

## Déploiement

### Développement
```bash
npm run dev  # Lance Vite dev server + Express backend
```

### Production
```bash
npm run build  # Build frontend + backend
npm start      # Lance le serveur de production
```

### Structure de Build
- Frontend compilé dans `dist/public`
- Backend bundlé dans `dist/index.js`
- Fichiers statiques servis par Express en production

## Sécurité et Performance

- Validation des données avec Zod
- Mise en cache intelligent avec TanStack Query
- Bundle splitting automatique avec Vite
- Optimisation des images et assets
- Gestion d'erreurs robuste côté client et serveur

## Évolutivité

L'architecture permet facilement :
- L'ajout de nouvelles métriques SEO
- L'intégration d'APIs externes (Google PageSpeed, etc.)
- L'extension des graphiques et visualisations
- La migration vers une base de données persistante
- L'ajout de fonctionnalités d'authentification

Cette architecture épurée se concentre sur l'essentiel : afficher les données SEO réelles de manière claire et accessible, sans complexité inutile.