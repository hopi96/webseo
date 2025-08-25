
# Dashboard SEO & Marketing Digital

Une application complète de gestion SEO et de génération de contenu éditorial pour sites web, développée avec React et Node.js.

## 🚀 Fonctionnalités

### Analyse SEO
- Analyse technique complète des sites web
- Métriques de performance (Core Web Vitals)
- Suivi des mots-clés et backlinks
- Recommandations d'amélioration

### Calendrier Éditorial
- Génération automatique de contenu via IA
- Planning multi-plateformes (Instagram, TikTok, YouTube, etc.)
- Gestion centralisée des publications

### Intégrations
- Webhook n8n pour analyses SEO automatisées
- OpenAI GPT-4 pour la génération de contenu
- Airtable pour le stockage des données

## 🛠 Stack Technique

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Drizzle ORM
- **Base de données**: PostgreSQL (Neon)
- **Outils**: Vite, TanStack Query, Radix UI

## 📦 Installation

```bash
npm install
npm run dev
```

L'application sera accessible sur `http://localhost:5000`

## 🔧 Configuration

1. Configurez vos variables d'environnement
2. Mettez à jour l'URL du webhook dans `server/config.ts`
3. Configurez vos clés API (OpenAI, Airtable)

## 📱 Utilisation

1. Ajoutez vos sites web dans les paramètres
2. Lancez une analyse SEO depuis le dashboard
3. Consultez les rapports détaillés
4. Générez votre calendrier éditorial

## 🏗 Architecture

Le projet suit une architecture modulaire avec séparation claire entre frontend et backend. Consultez `ARCHITECTURE.md` pour plus de détails.
