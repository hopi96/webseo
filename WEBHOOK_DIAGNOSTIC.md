# Diagnostic Webhook n8n

## Problème Actuel
Erreur 404 : "The requested webhook is not registered" 

## Solution
Le webhook n8n nécessite une activation manuelle en mode test avant chaque utilisation.

## Étapes de Résolution

### 1. Activer le Webhook dans n8n
1. Ouvrez votre workflow n8n
2. Localisez le nœud Webhook
3. Cliquez sur le bouton **"Test workflow"** ou **"Execute Workflow"**
4. Le webhook sera temporairement actif pour recevoir une requête

### 2. Tester Immédiatement
Après activation, testez rapidement via le bouton "Actualiser l'analyse" dans le dashboard.

### 3. Structure de Données Attendue
Votre webhook n8n doit retourner exactement cette structure :

```json
{
  "overallScore": 76,
  "organicTraffic": 30,
  "keywordsRanking": 16,
  "backlinks": 5,
  "pageSpeed": 65,
  "technicalSeo": {
    "mobileFriendly": true,
    "httpsSecure": true,
    "xmlSitemap": true,
    "robotsTxt": true
  },
  "recommendations": [
    {
      "id": "performance-mobile",
      "title": "Améliorer les performances mobiles",
      "description": "Optimiser les Core Web Vitals",
      "priority": "high",
      "category": "Performance"
    }
  ],
  "keywords": [
    {
      "keyword": "expert ia paris",
      "position": 8,
      "volume": 120,
      "trend": "stable"
    }
  ],
  "trafficData": [
    {
      "date": "2024-06-01",
      "visitors": 30
    }
  ]
}
```

## Messages d'Erreur Améliorés
L'application affiche maintenant des messages spécifiques :
- "Webhook n8n requis" quand le webhook n'est pas actif
- Instructions claires pour l'activation

## URL Webhook Actuelle
Configuration centralisée dans `server/config.ts`
URL : https://doseit.app.n8n.cloud/webhook/4c07451f-11b9-4d71-8060-ac071029417d

### Modification de l'URL
Pour changer l'URL du webhook, modifiez uniquement le fichier `server/config.ts`