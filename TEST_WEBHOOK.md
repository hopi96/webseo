# Test Webhook Integration

## Webhook URL Configuré
- URL: https://doseit.app.n8n.cloud/webhook-test/4c07451f-11b9-4d71-8060-ac071029417d

## Structure de Requête Attendue
```json
{
  "url": "https://example.com",
  "timestamp": "2025-06-18T19:49:30.000Z"
}
```

## Structure de Réponse Attendue
Le webhook doit retourner une réponse dans la même structure que le JSON Plug2AI :

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
      "id": "improve-mobile-performance",
      "title": "Améliorer les performances mobiles",
      "description": "Les Core Web Vitals mobiles nécessitent une optimisation",
      "priority": "high",
      "category": "Performance"
    }
  ],
  "keywords": [
    {
      "keyword": "expert ia",
      "position": 8,
      "volume": 120,
      "trend": "stable"
    }
  ],
  "trafficData": [
    {
      "date": "2024-05-01",
      "visitors": 25
    },
    {
      "date": "2024-06-01", 
      "visitors": 30
    }
  ]
}
```

## Fonctionnalités Intégrées

1. **Ajout de Site Web**
   - Quand un nouveau site est ajouté via `/api/websites` (POST)
   - L'URL est automatiquement envoyée au webhook
   - La réponse est stockée comme analyse SEO

2. **Rafraîchissement Manuel**
   - Bouton "Actualiser l'analyse" dans le dashboard
   - Route `/api/websites/:id/refresh-analysis` (POST)
   - Met à jour l'analyse existante avec les nouvelles données webhook

3. **Interface Utilisateur**
   - Bouton avec icône de rafraîchissement et animation de chargement
   - Toast notifications pour le succès/échec
   - Invalidation automatique du cache pour affichage immédiat

## Test de l'Intégration

Pour tester l'intégration :
1. Ajouter un nouveau site web via la page Paramètres
2. Vérifier que l'analyse SEO est créée automatiquement
3. Utiliser le bouton "Actualiser l'analyse" dans le dashboard
4. Vérifier que les nouvelles données apparaissent dans les graphiques