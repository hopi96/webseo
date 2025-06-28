# Configuration Centralisée

## Modification de l'URL Webhook

Pour changer l'URL du webhook n8n, modifiez uniquement le fichier `server/config.ts` :

```typescript
export const config = {
  webhook: {
    url: "VOTRE_NOUVELLE_URL_WEBHOOK_ICI"
  }
};
```

### Exemple de modification

```typescript
export const config = {
  webhook: {
    url: "https://doseit.app.n8n.cloud/webhook/nouveau-id-webhook"
  }
};
```

## Redémarrage automatique

Après modification du fichier `config.ts`, l'application redémarre automatiquement et utilise la nouvelle URL pour :
- Les requêtes d'analyse SEO 
- Les tests de diagnostic webhook
- Toute communication avec n8n

## Avantages de cette approche

✅ **Un seul fichier à modifier** - Plus de recherche dans multiple fichiers
✅ **Cohérence garantie** - Toute l'application utilise la même URL
✅ **Documentation centralisée** - Configuration claire et accessible
✅ **Moins d'erreurs** - Évite les oublis de mise à jour

## Fichiers utilisant cette configuration

- `server/webhook-service.ts` - Service principal webhook
- `server/routes.ts` - Endpoint de diagnostic
- Toute future fonctionnalité webhook