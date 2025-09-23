# Guide d'Utilisation Complet - SEO Analytics Dashboard

## Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Premiers pas](#premiers-pas)
3. [Dashboard Principal](#dashboard-principal)
4. [Calendrier Éditorial](#calendrier-éditorial)
5. [Configuration des Réseaux Sociaux](#configuration-des-réseaux-sociaux)
6. [Paramètres et Configuration](#paramètres-et-configuration)
7. [Fonctionnalités Avancées](#fonctionnalités-avancées)
8. [Dépannage](#dépannage)

---

## Vue d'ensemble

### Qu'est-ce que le SEO Analytics Dashboard ?
Le SEO Analytics Dashboard est une application complète d'analyse SEO et de gestion de contenu éditorial. Elle combine l'intelligence artificielle (GPT-4o) avec des outils d'automatisation (n8n) pour vous offrir :

- **Analyse SEO automatisée** de vos sites web
- **Génération de contenu éditorial** avec l'IA
- **Planification de calendrier éditorial** intelligent
- **Gestion multi-plateformes** (réseaux sociaux, blog, newsletter)
- **Recommandations personnalisées** pour améliorer votre référencement

### Architecture technique
- **Frontend** : Interface moderne et responsive
- **Backend** : API sécurisée avec intégrations multiples
- **IA** : GPT-4o pour l'analyse et la génération de contenu
- **Stockage** : Airtable pour la synchronisation des données
- **Automatisation** : n8n pour les workflows

---

## Premiers pas

### 1. Accès à l'application
L'application s'ouvre directement sur le **Dashboard principal** à l'adresse `/`.

### 2. Navigation
L'interface propose une navigation adaptée à tous les écrans :

**Navigation desktop :**
- **Dashboard** (page d'accueil)
- **Calendrier** (gestion éditorial)
- **Paramètres** (configuration)

**Navigation mobile :**
- Navigation simplifiée avec icônes
- Menu hamburger pour accès rapide

### 3. Ajouter votre premier site web

1. Cliquez sur le bouton "+" à côté du sélecteur de site
2. Saisissez l'URL de votre site web (ex: https://www.monsite.com)
3. Donnez-lui un nom descriptif
4. Cliquez sur "Ajouter le site"

Le site sera automatiquement sélectionné et une première analyse SEO sera lancée.

---

## Dashboard Principal

### Vue d'ensemble du Dashboard

Le Dashboard est le cœur de l'application, offrant une vue complète des performances SEO de vos sites.

#### Sélection du site web
- **Sélecteur** : Menu déroulant en haut à gauche
- **Sites récents** : Les nouveaux sites sont automatiquement sélectionnés
- **Persistence** : Votre choix est mémorisé entre les sessions

#### Boutons d'action principaux
- **"Réseaux sociaux"** : Configuration des tokens API
- **"Calendrier éditorial"** : Génération de contenu planifié
- **"Actualiser l'analyse"** : Nouvelle analyse SEO via n8n

### Métriques principales

#### 1. Score SEO Global
- **Affichage** : Score sur 100 avec barre de progression
- **Interprétation** :
  - 80-100 : Excellent
  - 60-79 : Bon
  - 0-59 : À améliorer

#### 2. PageSpeed
- **Métrique** : Vitesse de chargement du site
- **Détail** : Score de performance affiché
- **Importance** : Impact direct sur le référencement Google

#### 3. Mots-clés
- **Nombre total** de mots-clés analysés
- **Variantes** : Inclut géolocalisés et saisonniers
- **Utilisation** : Base pour la stratégie de contenu

#### 4. Liens internes/externes
- **Liens internes** : Navigation entre vos pages
- **Liens externes** : Références vers d'autres sites
- **SEO** : Améliore l'autorité et la navigation

### Core Web Vitals

Section dédiée aux métriques Google essentielles :

#### LCP (Largest Contentful Paint)
- **Objectif** : ≤ 2,5 secondes
- **Mesure** : Temps d'affichage du plus gros élément
- **Impact** : Expérience utilisateur cruciale

#### CLS (Cumulative Layout Shift)
- **Objectif** : ≤ 0,1
- **Mesure** : Stabilité visuelle pendant le chargement
- **Impact** : Évite les éléments qui bougent

#### FCP (First Contentful Paint)
- **Objectif** : ≤ 1,8 secondes
- **Mesure** : Premier élément visible
- **Impact** : Perception de rapidité

#### TBT (Total Blocking Time)
- **Objectif** : ≤ 300ms
- **Mesure** : Temps où la page ne répond pas
- **Impact** : Interactivité

### Graphiques et analyses

#### Analyse des mots-clés
- **Graphique en barres** : Densité par mot-clé
- **Top 6** des mots-clés les plus importants
- **Données** : Densité et occurrences

#### Recommandations SEO
- **Priorités** : High, Medium, Low avec codes couleur
- **Catégories** : Technique, Contenu, Performance
- **Actions** : Steps concrets à suivre

### Agent IA SEO

#### Fonctionnalités
- **Analyse intelligente** des données SEO
- **Recommandations personnalisées** par GPT-4o
- **Points forts et faiblesses** identifiés
- **Plan d'action** priorisé

#### Utilisation
1. Cliquez sur "Nouvelle analyse"
2. L'IA analyse vos données SEO
3. Recevez un rapport détaillé avec :
   - Score global
   - Recommandations prioritaires
   - Plan d'amélioration
   - Estimations d'impact

---

## Calendrier Éditorial

### Navigation vers le Calendrier
Accès via :
- Menu principal "Calendrier"
- Bouton "Calendrier éditorial" du Dashboard
- Bouton "Voir le calendrier" après génération

### Interface du Calendrier

#### Vue mensuelle
- **Navigation** : Flèches gauche/droite pour changer de mois
- **Affichage** : Tous les contenus planifiés par date
- **Codes couleur** par type de contenu et statut

#### Filtres disponibles
- **Par site web** : Sélecteur de site
- **Par plateforme** : Newsletter, Blog, Réseaux sociaux
- **Par statut** : En attente, À réviser, Validé, Publié

### Gestion du contenu

#### Ajouter du contenu manuellement
1. Cliquez sur "+" ou sur une date
2. Remplissez le formulaire :
   - **Contenu** : Texte principal
   - **Type** : Newsletter, TikTok, Instagram, etc.
   - **Statut** : État d'avancement
   - **Date** : Planification
   - **Site** : Attribution
   - **Image** : Upload ou génération IA

#### Générer un calendrier complet
1. **Depuis le Dashboard** : Bouton "Calendrier éditorial"
2. **Configuration** :
   - Site web cible
   - Période (mensuel ou dates personnalisées)
   - Utilisation de l'analyse SEO existante
3. **Génération IA** : Processus de 1 heure
4. **Résultat** : Calendrier complet avec contenus optimisés

### Types de contenu supportés
- **Newsletter** : Email marketing
- **TikTok** : Vidéos courtes
- **Instagram** : Posts et stories
- **X (Twitter)** : Tweets
- **YouTube** : Vidéos longues
- **Facebook** : Publications
- **Blog** : Articles de blog
- **Google My Business** : Publications locales
- **Pinterest** : Épingles

### États des contenus
- **En attente** : Nouveau contenu créé
- **À réviser** : Nécessite une relecture
- **Validé** : Prêt à publier
- **Publié** : Contenu diffusé

### Fonctionnalités d'édition

#### Éditer un contenu existant
1. Cliquez sur un contenu dans le calendrier
2. Utilisez les options :
   - **Éditer** : Modifier le contenu
   - **Supprimer** : Retirer du calendrier
   - **Dupliquer** : Créer une variante

#### Génération IA de contenu
1. **Bouton IA** dans l'éditeur
2. **Paramètres** :
   - Prompt personnalisé
   - Ton (professionnel, décontracté, etc.)
   - Audience cible
   - Type de contenu
3. **Résultat** : Contenu optimisé généré par GPT-4o

#### Gestion des images
- **Upload local** : Depuis votre ordinateur
- **Génération DALL-E** : IA pour créer des images
- **Prévisualisation** : Agrandissement en modal
- **Source tracking** : Distinction upload/IA

### Mode édition en lot
- **Sélection multiple** : Cases à cocher
- **Actions groupées** : Changement de statut en masse
- **Efficacité** : Traitement rapide des volumes

---

## Configuration des Réseaux Sociaux

### Accès à la configuration
**Deux méthodes** :
1. Dashboard → Bouton "Réseaux sociaux"
2. Dashboard → Bouton discret "Tokens API" (à côté du nom du site)

### Interface de configuration

La configuration est organisée en **3 onglets thématiques** :

#### 1. Réseaux sociaux principaux
Plateformes de publication sociale standard :

**Facebook**
- **Page ID** : Identifiant de votre page Facebook
- **Token d'accès** : Clé pour publier automatiquement
- **Difficulté** : Facile
- **Tutoriels vidéo** :
  - Trouver l'ID de ta page Facebook
  - Générer un token via Graph API

**Instagram**
- **User ID** : Identifiant de votre compte Instagram
- **Token d'accès** : Autorisation pour publier
- **Difficulté** : Moyen
- **Tutoriels vidéo** :
  - Trouver ton Instagram User ID
  - Générer un long-lived access token

**X (Twitter)**
- **Bearer Token** : Token d'autorisation Twitter/X
- **Difficulté** : Facile
- **Tutoriels vidéo** :
  - Obtenir les clés API et Bearer Token (2024)
  - Démarrer sur l'API v2

#### 2. Création de contenu
Plateformes spécialisées dans le contenu :

**Pinterest**
- **Board ID** : Identifiant de votre tableau Pinterest
- **Token d'accès** : Clé d'API Pinterest
- **Difficulté** : Difficile
- **Tutoriels vidéo** :
  - Trouver le Board ID - Méthode rapide
  - Pinterest API – Getting Access - Création d'app complète
  - URL de redirection OAuth Pinterest - Guide détaillé

**TikTok**
- **Token d'accès** : Autorisation TikTok Business
- **Difficulté** : Difficile
- **Tutoriels vidéo** :
  - Créer une app TikTok Business - Access tokens
  - Login TikTok et access tokens - Implémentation
  - TikTok Ads API – Getting access - Vue d'ensemble

**Blog Prestashop**
- **URL de base** : Adresse de votre site Prestashop
- **Clé API** : Clé webservice Prestashop
- **Difficulté** : Moyen
- **Tutoriels vidéo** :
  - Générer une clé API PrestaShop - Guide FR complet
  - Créer une clé API de webservice - YATEO
  - PrestaShop 8 – Webservices - Cours complet FR

#### 3. Marketing et newsletter
Outils de marketing et communication :

**Google My Business**
- **Account ID** : Identifiant de votre compte GMB
- **Location ID** : Identifiant de votre établissement
- **Token d'accès** : Clé d'API Google My Business
- **Difficulté** : Difficile (soumis à approbation Google)
- **Tutoriels vidéo** :
  - Trouver Business Profile ID et Place ID - Indispensables
  - Récupérer Place ID / CID - Autres méthodes
  - Token OAuth 2.0 Google APIs - Démonstration Postman
  - Flux OAuth 2.0 Google pas-à-pas - Implémentation

**Brevo Newsletter**
- **Clé API** : Clé d'API pour envoyer des emails via Brevo
- **Difficulté** : Facile
- **Tutoriels vidéo** :
  - Créer/obtenir votre clé API Brevo - Guide rapide 2024
  - Get Brevo API Key (2025) - Méthode mise à jour
  - Tutoriel Brevo complet débutants - Configuration complète
  - Intégrer formulaire Brevo sur site - Capture d'emails
  - Connecter Brevo avec WordPress - Intégration complète

### Fonctionnalités de l'interface

#### État de configuration
- **Indicateurs visuels** : Icônes de statut (configuré/non configuré)
- **Codes couleur** : Vert (OK), Rouge (manquant)
- **Compteur** : Plateformes configurées vs total

#### Ressources d'aide
- **Documentation officielle** : Liens vers les guides développeurs
- **Tutoriels YouTube** : Vidéos authentiques sélectionnées
- **Design distinctif** : Tutoriels vidéo avec gradient violet et icône PlayCircle

#### Sécurité
- **Masquage des tokens** : Boutons œil pour afficher/cacher
- **Sauvegarde sécurisée** : Chiffrement des données sensibles
- **Validation** : Vérification des formats de tokens

### Configuration du programme de publication

#### Accès
Dashboard → Bouton "Réseaux sociaux" → Onglet dédié

#### Paramétrage par plateforme
Pour chaque réseau social, définissez :
- **Publications par semaine**
- **Publications par mois**
- **Cohérence automatique** : Le système vérifie la cohérence

#### Plateformes supportées
- Newsletter Brevo
- TikTok
- Instagram
- X (Twitter)
- YouTube
- Facebook
- Blog
- Pinterest

#### Utilisation pour le calendrier
Ces fréquences sont utilisées par l'IA pour :
- **Générer le bon nombre** de contenus
- **Répartir intelligemment** sur la période
- **Optimiser par plateforme** selon vos objectifs

---

## Paramètres et Configuration

### Page Paramètres
Accès via le menu principal "Paramètres" ou l'icône engrenage.

### Gestion des sites web

#### Liste des sites
- **Affichage** : Tous vos sites avec informations clés
- **Actions disponibles** : Analyse, Modification, Suppression

#### Ajouter un nouveau site
1. Bouton "Ajouter un site"
2. **URL** : Adresse complète du site
3. **Nom** : Nom descriptif pour l'identifier
4. **Validation** : Vérification automatique de l'URL

#### Analyser un site existant
- **Analyse manuelle** : Bouton d'analyse pour chaque site
- **Feedback** : Progression et résultats en temps réel
- **Automatique** : Analyses programmées possibles

#### Supprimer un site
1. Bouton de suppression (rouge)
2. **Confirmation** : Dialog de sécurité
3. **Impact** : Suppression de toutes les données associées

### Configuration thème et interface

#### Mode sombre/clair
- **Basculement** : Switch dans la barre de paramètres
- **Persistance** : Choix sauvegardé automatiquement
- **Adaptation** : Interface complètement adaptée

#### Notifications
- **Activation/désactivation** des notifications
- **Types** : Analyses terminées, nouveaux contenus, erreurs
- **Personnalisation** : Par type d'événement

### Gestion des prompts système (Avancé)

#### Qu'est-ce qu'un prompt système ?
Les prompts système définissent comment l'IA (GPT-4o) génère le contenu éditorial.

#### Prompts disponibles
- **Liste** : Tous les prompts configurés
- **Statut** : Actif/Inactif clairement indiqué
- **Actions** : Éditer, Activer, Supprimer

#### Créer/Modifier un prompt
1. **Nom** : Identifier le prompt
2. **Contenu** : Instructions pour l'IA
3. **Structure de sortie** : Format attendu
4. **Activation** : Un seul prompt actif à la fois

#### Impact sur la génération
- **Ton et style** : Professionnel, décontracté, etc.
- **Structure** : Organisation du contenu
- **Optimisation SEO** : Intégration des mots-clés
- **Spécificités** : Adaptation à votre secteur

---

## Fonctionnalités Avancées

### Intégration n8n (Workflow Automation)

#### Qu'est-ce que n8n ?
n8n est la plateforme d'automatisation qui orchestre les analyses SEO et la génération de calendrier éditorial.

#### Workflows configurés
1. **Analyse SEO automatisée**
   - Déclenchement depuis le Dashboard
   - Récupération des métriques PageSpeed
   - Analyse technique complète
   - Retour des résultats structurés

2. **Génération calendrier éditorial**
   - Analyse du site et de la concurrence
   - Génération IA du contenu
   - Planification optimale
   - Intégration dans Airtable

#### Configuration webhook
- **URL automatique** : Configurée dans l'environnement
- **Test de connexion** : Diagnostic intégré
- **Gestion d'erreurs** : Messages explicites
- **Mode test** : Support du mode développement n8n

#### Diagnostic de connexion
Endpoint `/api/webhook/diagnostic` pour vérifier :
- **Connectivité** webhook
- **Méthodes supportées** (GET/POST)
- **Réponses** du serveur n8n
- **Recommandations** de configuration

### Intégration Airtable

#### Synchronisation des données
- **Sites web** : Stockage et analyse SEO
- **Contenu éditorial** : Calendrier et articles
- **Prompts système** : Configuration IA
- **Paramètres sociaux** : Tokens et configuration

#### Tables utilisées
1. **analyse SEO** : Données principales des sites
2. **content** : Calendrier éditorial
3. **prompts_system** : Configuration IA
4. (Tables dynamiques selon la configuration)

#### Avantages
- **Sauvegarde cloud** : Données protégées
- **Collaboration** : Accès équipe possible
- **Historique** : Versions et modifications
- **Flexibilité** : Structure adaptable

### Intelligence Artificielle (GPT-4o)

#### Capacités d'analyse SEO
- **Analyse contextuelle** des données techniques
- **Recommandations personnalisées** par secteur
- **Priorisation intelligente** des actions
- **Estimation d'impact** des améliorations

#### Génération de contenu éditorial
- **Adaptation au ton** et style demandé
- **Optimisation SEO** automatique
- **Personnalisation** par audience cible
- **Cohérence** multi-plateformes

#### Génération d'images (DALL-E 3)
- **Création automatique** d'images pertinentes
- **Adaptation au contenu** textuel
- **Styles variés** selon le type de publication
- **Intégration transparente** dans le workflow

### Chat n8n intégré

#### Accès
Widget de chat automatique sur la page Calendrier.

#### Fonctionnalités
- **Assistant intelligent** pour l'utilisation
- **Support technique** automatisé
- **Réponses contextuelles** aux questions
- **Escalade humaine** si nécessaire

---

## Dépannage

### Problèmes courants

#### 1. Site web non analysé
**Symptômes** : Score SEO "N/A", pas de métriques
**Solutions** :
1. Vérifier que l'URL est correcte et accessible
2. Cliquer sur "Actualiser l'analyse"
3. Vérifier la connexion n8n
4. Attendre quelques minutes (analyse en cours)

#### 2. Webhook n8n non fonctionnel
**Symptômes** : Erreur lors de l'analyse, message d'erreur n8n
**Solutions** :
1. Vérifier que le workflow n8n est activé
2. Cliquer sur "Execute workflow" en mode test
3. Réessayer l'analyse immédiatement
4. Consulter le diagnostic webhook

#### 3. Génération de calendrier échoue
**Symptômes** : Erreur pendant la génération 1h
**Solutions** :
1. Vérifier la sélection du site web
2. S'assurer que l'analyse SEO est disponible
3. Réduire la période de génération
4. Réessayer avec des paramètres différents

#### 4. Images non affichées
**Symptômes** : Placeholders à la place des images
**Solutions** :
1. Vérifier la connexion internet
2. Actualiser la page
3. Vérifier les URLs d'images dans Airtable
4. Régénérer l'image avec l'IA

#### 5. Configuration réseaux sociaux non sauvegardée
**Symptômes** : Tokens perdus après actualisation
**Solutions** :
1. Vérifier que tous les champs requis sont remplis
2. S'assurer que les tokens sont valides
3. Actualiser la page et ressaisir
4. Vérifier la connexion Airtable

### Messages d'erreur fréquents

#### "Webhook n8n non activé"
- **Cause** : Workflow n8n éteint
- **Solution** : Activer le workflow dans n8n

#### "Video unavailable" (YouTube)
- **Cause** : Restrictions géographiques ou suppression
- **Impact** : N'affecte pas le fonctionnement
- **Action** : Aucune, les liens sont corrects

#### "Impossible de récupérer les données"
- **Cause** : Problème de connexion Airtable
- **Solution** : Vérifier la configuration API

### Diagnostic avancé

#### Logs de l'application
Les logs sont automatiquement collectés et permettent de :
- **Identifier** les erreurs précises
- **Tracer** les requêtes API
- **Monitorer** les performances
- **Déboguer** les intégrations

#### Tests de connectivité
- **Webhook** : `/api/webhook/diagnostic`
- **OpenAI** : `/api/openai/test`
- **Airtable** : Logs des requêtes

---

## Support et contact

### Auto-diagnostic
1. **Vérifier** les messages d'erreur affichés
2. **Consulter** cette documentation
3. **Tester** les fonctionnalités de base
4. **Consulter** les logs si accessible

### Informations utiles pour le support
- **URL** du site en analyse
- **Message d'erreur** exact
- **Étapes** pour reproduire le problème
- **Navigateur** et version utilisée

---

**Cette documentation couvre toutes les fonctionnalités de votre SEO Analytics Dashboard. Elle sera mise à jour régulièrement en fonction des évolutions de l'application.**

**Votre application dispose de 20 tutoriels vidéo YouTube authentiques pour configurer facilement toutes les 8 plateformes de réseaux sociaux supportées. C'est un système complet qui combine analyse SEO intelligente, génération de contenu IA, et gestion éditoriale avancée.**