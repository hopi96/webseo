import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Loader2, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';

// Documentation content - version sans émojis
const documentationContent = `
# Guide d'Utilisation Complet - SEO Analytics Dashboard

## Table des Matières
1. Vue d'ensemble
2. Premiers pas
3. Dashboard Principal
4. Calendrier Éditorial
5. Configuration des Réseaux Sociaux
6. Paramètres et Configuration
7. Fonctionnalités Avancées
8. Dépannage

## 1. Vue d'ensemble

### Qu'est-ce que le SEO Analytics Dashboard ?
Le SEO Analytics Dashboard est une application complète d'analyse SEO et de gestion de contenu éditorial. Elle combine l'intelligence artificielle (GPT-4o) avec des outils d'automatisation (n8n) pour vous offrir :

- Analyse SEO automatisée de vos sites web
- Génération de contenu éditorial avec l'IA  
- Planification de calendrier éditorial intelligent
- Gestion multi-plateformes (réseaux sociaux, blog, newsletter)
- Recommandations personnalisées pour améliorer votre référencement

### Architecture technique
- Frontend : Interface moderne et responsive
- Backend : API sécurisée avec intégrations multiples
- IA : GPT-4o pour l'analyse et la génération de contenu
- Stockage : Airtable pour la synchronisation des données
- Automatisation : n8n pour les workflows

## 2. Premiers pas

### 1. Accès à l'application
L'application s'ouvre directement sur le Dashboard principal à l'adresse /.

### 2. Navigation
L'interface propose une navigation adaptée à tous les écrans :

Navigation desktop :
- Dashboard (page d'accueil)
- Calendrier (gestion éditorial)
- Paramètres (configuration)

Navigation mobile :
- Navigation simplifiée avec icônes
- Menu hamburger pour accès rapide

### 3. Ajouter votre premier site web
1. Cliquez sur le bouton "+" à côté du sélecteur de site
2. Saisissez l'URL de votre site web (ex: https://www.monsite.com)
3. Donnez-lui un nom descriptif
4. Cliquez sur "Ajouter le site"

Le site sera automatiquement sélectionné et une première analyse SEO sera lancée.

## 3. Dashboard Principal

### Vue d'ensemble du Dashboard
Le Dashboard est le cœur de l'application, offrant une vue complète des performances SEO de vos sites.

#### Sélection du site web
- Sélecteur : Menu déroulant en haut à gauche
- Sites récents : Les nouveaux sites sont automatiquement sélectionnés
- Persistence : Votre choix est mémorisé entre les sessions

#### Boutons d'action principaux
- "Réseaux sociaux" : Configuration des tokens API
- "Calendrier éditorial" : Génération de contenu planifié
- "Actualiser l'analyse" : Nouvelle analyse SEO via n8n

### Métriques principales

#### 1. Score SEO Global
- Affichage : Score sur 100 avec barre de progression
- Interprétation :
  * 80-100 : Excellent
  * 60-79 : Bon
  * 0-59 : À améliorer

#### 2. PageSpeed
- Métrique : Vitesse de chargement du site
- Détail : Score de performance affiché
- Importance : Impact direct sur le référencement Google

#### 3. Mots-clés
- Nombre total de mots-clés analysés
- Variantes : Inclut géolocalisés et saisonniers
- Utilisation : Base pour la stratégie de contenu

#### 4. Liens internes/externes
- Liens internes : Navigation entre vos pages
- Liens externes : Références vers d'autres sites
- SEO : Améliore l'autorité et la navigation

### Core Web Vitals
Section dédiée aux métriques Google essentielles :

#### LCP (Largest Contentful Paint)
- Objectif : ≤ 2,5 secondes
- Mesure : Temps d'affichage du plus gros élément
- Impact : Expérience utilisateur cruciale

#### CLS (Cumulative Layout Shift)
- Objectif : ≤ 0,1
- Mesure : Stabilité visuelle pendant le chargement
- Impact : Évite les éléments qui bougent

#### FCP (First Contentful Paint)
- Objectif : ≤ 1,8 secondes
- Mesure : Premier élément visible
- Impact : Perception de rapidité

#### TBT (Total Blocking Time)
- Objectif : ≤ 300ms
- Mesure : Temps où la page ne répond pas
- Impact : Interactivité

### Agent IA SEO

#### Fonctionnalités
- Analyse intelligente des données SEO
- Recommandations personnalisées par GPT-4o
- Points forts et faiblesses identifiés
- Plan d'action priorisé

#### Utilisation
1. Cliquez sur "Nouvelle analyse"
2. L'IA analyse vos données SEO
3. Recevez un rapport détaillé avec :
   - Score global
   - Recommandations prioritaires
   - Plan d'amélioration
   - Estimations d'impact

## 4. Calendrier Éditorial

### Navigation vers le Calendrier
Accès via :
- Menu principal "Calendrier"
- Bouton "Calendrier éditorial" du Dashboard
- Bouton "Voir le calendrier" après génération

### Interface du Calendrier

#### Vue mensuelle
- Navigation : Flèches gauche/droite pour changer de mois
- Affichage : Tous les contenus planifiés par date
- Codes couleur par type de contenu et statut

#### Filtres disponibles
- Par site web : Sélecteur de site
- Par plateforme : Newsletter, Blog, Réseaux sociaux
- Par statut : En attente, À réviser, Validé, Publié

### Gestion du contenu

#### Ajouter du contenu manuellement
1. Cliquez sur "+" ou sur une date
2. Remplissez le formulaire :
   - Contenu : Texte principal
   - Type : Newsletter, TikTok, Instagram, etc.
   - Statut : État d'avancement
   - Date : Planification
   - Site : Attribution
   - Image : Upload ou génération IA

#### Générer un calendrier complet
1. Depuis le Dashboard : Bouton "Calendrier éditorial"
2. Configuration :
   - Site web cible
   - Période (mensuel ou dates personnalisées)
   - Utilisation de l'analyse SEO existante
3. Génération IA : Processus de 1 heure
4. Résultat : Calendrier complet avec contenus optimisés

### Types de contenu supportés
- Newsletter : Email marketing
- TikTok : Vidéos courtes
- Instagram : Posts et stories
- X (Twitter) : Tweets
- YouTube : Vidéos longues
- Facebook : Publications
- Blog : Articles de blog
- Google My Business : Publications locales
- Pinterest : Épingles

### États des contenus
- En attente : Nouveau contenu créé
- À réviser : Nécessite une relecture
- Validé : Prêt à publier
- Publié : Contenu diffusé

## 5. Configuration des Réseaux Sociaux

### Accès à la configuration
Deux méthodes :
1. Dashboard → Bouton "Réseaux sociaux"
2. Dashboard → Bouton discret "Tokens API" (à côté du nom du site)

### Interface de configuration
La configuration est organisée en 3 onglets thématiques :

#### 1. Réseaux sociaux principaux
Plateformes de publication sociale standard :

Facebook :
- Page ID : Identifiant de votre page Facebook
- Token d'accès : Clé pour publier automatiquement
- Difficulté : Facile
- Tutoriels vidéo : Trouver l'ID de ta page Facebook, Générer un token via Graph API

Instagram :
- User ID : Identifiant de votre compte Instagram
- Token d'accès : Autorisation pour publier
- Difficulté : Moyen
- Tutoriels vidéo : Trouver ton Instagram User ID, Générer un long-lived access token

X (Twitter) :
- Bearer Token : Token d'autorisation Twitter/X
- Difficulté : Facile
- Tutoriels vidéo : Obtenir les clés API et Bearer Token (2024), Démarrer sur l'API v2

#### 2. Création de contenu
Plateformes spécialisées dans le contenu :

Pinterest :
- Board ID : Identifiant de votre tableau Pinterest
- Token d'accès : Clé d'API Pinterest
- Difficulté : Difficile
- Tutoriels vidéo : 3 vidéos complètes sur l'API Pinterest

TikTok :
- Token d'accès : Autorisation TikTok Business
- Difficulté : Difficile
- Tutoriels vidéo : 3 vidéos sur TikTok Business API

Blog Prestashop :
- URL de base : Adresse de votre site Prestashop
- Clé API : Clé webservice Prestashop
- Difficulté : Moyen
- Tutoriels vidéo : 3 vidéos sur les APIs PrestaShop

#### 3. Marketing et newsletter
Outils de marketing et communication :

Google My Business :
- Account ID : Identifiant de votre compte GMB
- Location ID : Identifiant de votre établissement
- Token d'accès : Clé d'API Google My Business
- Difficulté : Difficile (soumis à approbation Google)
- Tutoriels vidéo : 4 vidéos sur les APIs Google My Business

Brevo Newsletter :
- Clé API : Clé d'API pour envoyer des emails via Brevo
- Difficulté : Facile
- Tutoriels vidéo : 5 vidéos sur Brevo et l'integration

### Fonctionnalités de l'interface

#### État de configuration
- Indicateurs visuels : Icônes de statut (configuré/non configuré)
- Codes couleur : Vert (OK), Rouge (manquant)
- Compteur : Plateformes configurées vs total

#### Sécurité
- Masquage des tokens : Boutons œil pour afficher/cacher
- Sauvegarde sécurisée : Chiffrement des données sensibles
- Validation : Vérification des formats de tokens

## 6. Paramètres et Configuration

### Page Paramètres
Accès via le menu principal "Paramètres" ou l'icône engrenage.

### Gestion des sites web

#### Liste des sites
- Affichage : Tous vos sites avec informations clés
- Actions disponibles : Analyse, Modification, Suppression

#### Ajouter un nouveau site
1. Bouton "Ajouter un site"
2. URL : Adresse complète du site
3. Nom : Nom descriptif pour l'identifier
4. Validation : Vérification automatique de l'URL

#### Configuration thème et interface
- Mode sombre/clair : Switch dans la barre de paramètres
- Persistance : Choix sauvegardé automatiquement
- Adaptation : Interface complètement adaptée

### Gestion des prompts système (Avancé)
Les prompts système définissent comment l'IA (GPT-4o) génère le contenu éditorial.

#### Impact sur la génération
- Ton et style : Professionnel, décontracté, etc.
- Structure : Organisation du contenu
- Optimisation SEO : Intégration des mots-clés
- Spécificités : Adaptation à votre secteur

## 7. Fonctionnalités Avancées

### Intégration n8n (Workflow Automation)
n8n est la plateforme d'automatisation qui orchestre les analyses SEO et la génération de calendrier éditorial.

#### Workflows configurés
1. Analyse SEO automatisée
   - Déclenchement depuis le Dashboard
   - Récupération des métriques PageSpeed
   - Analyse technique complète
   - Retour des résultats structurés

2. Génération calendrier éditorial
   - Analyse du site et de la concurrence
   - Génération IA du contenu
   - Planification optimale
   - Intégration dans Airtable

### Intégration Airtable

#### Synchronisation des données
- Sites web : Stockage et analyse SEO
- Contenu éditorial : Calendrier et articles
- Prompts système : Configuration IA
- Paramètres sociaux : Tokens et configuration

#### Avantages
- Sauvegarde cloud : Données protégées
- Collaboration : Accès équipe possible
- Historique : Versions et modifications
- Flexibilité : Structure adaptable

### Intelligence Artificielle (GPT-4o)

#### Capacités d'analyse SEO
- Analyse contextuelle des données techniques
- Recommandations personnalisées par secteur
- Priorisation intelligente des actions
- Estimation d'impact des améliorations

#### Génération de contenu éditorial
- Adaptation au ton et style demandé
- Optimisation SEO automatique
- Personnalisation par audience cible
- Cohérence multi-plateformes

#### Génération d'images (DALL-E 3)
- Création automatique d'images pertinentes
- Adaptation au contenu textuel
- Styles variés selon le type de publication
- Intégration transparente dans le workflow

## 8. Dépannage

### Problèmes courants

#### 1. Site web non analysé
Symptômes : Score SEO "N/A", pas de métriques
Solutions :
1. Vérifier que l'URL est correcte et accessible
2. Cliquer sur "Actualiser l'analyse"
3. Vérifier la connexion n8n
4. Attendre quelques minutes (analyse en cours)

#### 2. Webhook n8n non fonctionnel
Symptômes : Erreur lors de l'analyse, message d'erreur n8n
Solutions :
1. Vérifier que le workflow n8n est activé
2. Cliquer sur "Execute workflow" en mode test
3. Réessayer l'analyse immédiatement
4. Consulter le diagnostic webhook

#### 3. Génération de calendrier échoue
Symptômes : Erreur pendant la génération 1h
Solutions :
1. Vérifier la sélection du site web
2. S'assurer que l'analyse SEO est disponible
3. Réduire la période de génération
4. Réessayer avec des paramètres différents

### Messages d'erreur fréquents

#### "Webhook n8n non activé"
- Cause : Workflow n8n éteint
- Solution : Activer le workflow dans n8n

#### "Video unavailable" (YouTube)
- Cause : Restrictions géographiques ou suppression
- Impact : N'affecte pas le fonctionnement
- Action : Aucune, les liens sont corrects

#### "Impossible de récupérer les données"
- Cause : Problème de connexion Airtable
- Solution : Vérifier la configuration API

### Support et contact

#### Auto-diagnostic
1. Vérifier les messages d'erreur affichés
2. Consulter cette documentation
3. Tester les fonctionnalités de base
4. Consulter les logs si accessible

#### Informations utiles pour le support
- URL du site en analyse
- Message d'erreur exact
- Étapes pour reproduire le problème
- Navigateur et version utilisée

Cette documentation couvre toutes les fonctionnalités de votre SEO Analytics Dashboard. 
Votre application dispose de 20 tutoriels vidéo YouTube authentiques pour configurer 
facilement toutes les 8 plateformes de réseaux sociaux supportées.
`;

export default function DocumentationPDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    setProgress(0);
    setIsComplete(false);

    try {
      // Créer un nouveau document PDF
      const doc = new jsPDF();
      
      // Configuration des styles
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const lineHeight = 7;
      let currentY = margin;

      // Fonction pour ajouter une nouvelle page si nécessaire
      const addNewPageIfNeeded = (requiredSpace: number) => {
        if (currentY + requiredSpace > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
      };

      // Titre principal
      setProgress(10);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Guide d\'Utilisation Complet', pageWidth / 2, currentY, { align: 'center' });
      currentY += lineHeight + 5;
      
      doc.setFontSize(16);
      doc.text('SEO Analytics Dashboard', pageWidth / 2, currentY, { align: 'center' });
      currentY += lineHeight * 3;

      // Diviser le contenu en sections
      const sections = documentationContent.split(/(?=##\s+\d)/);
      const totalSections = sections.length;
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (!section) continue;

        setProgress(10 + (i / totalSections) * 80);

        const lines = section.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          addNewPageIfNeeded(lineHeight * 2);

          if (line.startsWith('## ')) {
            // Titre de section (H2)
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(line.replace('## ', ''), margin, currentY);
            currentY += lineHeight + 3;
            
          } else if (line.startsWith('### ')) {
            // Sous-titre (H3)
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(line.replace('### ', ''), margin, currentY);
            currentY += lineHeight + 2;
            
          } else if (line.startsWith('#### ')) {
            // Sous-sous-titre (H4)
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(line.replace('#### ', ''), margin, currentY);
            currentY += lineHeight + 1;
            
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            // Liste à puces
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const text = line.replace(/^[-*]\s*/, '');
            const wrappedText = doc.splitTextToSize(text, pageWidth - margin * 2 - 10);
            doc.text('• ' + wrappedText[0], margin + 10, currentY);
            
            // Si le texte est trop long, ajouter les lignes suivantes
            if (wrappedText.length > 1) {
              for (let j = 1; j < wrappedText.length; j++) {
                currentY += lineHeight;
                addNewPageIfNeeded(lineHeight);
                doc.text('  ' + wrappedText[j], margin + 10, currentY);
              }
            }
            currentY += lineHeight;
            
          } else if (line.match(/^\d+\./)) {
            // Liste numérotée
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const wrappedText = doc.splitTextToSize(line, pageWidth - margin * 2 - 10);
            doc.text(wrappedText[0], margin + 10, currentY);
            
            if (wrappedText.length > 1) {
              for (let j = 1; j < wrappedText.length; j++) {
                currentY += lineHeight;
                addNewPageIfNeeded(lineHeight);
                doc.text('  ' + wrappedText[j], margin + 10, currentY);
              }
            }
            currentY += lineHeight;
            
          } else if (line.trim() !== '') {
            // Texte normal
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            // Gérer le texte en gras avec **text**
            if (line.includes('**')) {
              const parts = line.split('**');
              let x = margin;
              
              for (let j = 0; j < parts.length; j++) {
                const part = parts[j];
                if (j % 2 === 1) {
                  // Texte en gras
                  doc.setFont('helvetica', 'bold');
                } else {
                  // Texte normal
                  doc.setFont('helvetica', 'normal');
                }
                
                const partWidth = doc.getTextWidth(part);
                if (x + partWidth < pageWidth - margin) {
                  doc.text(part, x, currentY);
                  x += partWidth;
                } else {
                  // Nouvelle ligne si le texte dépasse
                  currentY += lineHeight;
                  addNewPageIfNeeded(lineHeight);
                  x = margin;
                  doc.text(part, x, currentY);
                  x += partWidth;
                }
              }
              currentY += lineHeight;
              
            } else {
              // Texte simple avec retour à la ligne automatique
              const wrappedText = doc.splitTextToSize(line, pageWidth - margin * 2);
              doc.text(wrappedText, margin, currentY);
              currentY += lineHeight * wrappedText.length;
            }
          }
          
          // Ajouter un petit espacement après chaque ligne
          currentY += 1;
        }
        
        // Espacement entre les sections
        currentY += lineHeight;
      }

      setProgress(95);

      // Ajouter numérotation des pages
      const totalPages = doc.internal.pages.length - 1; // -1 car la première page est vide
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Page ${i} / ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      setProgress(100);
      setIsComplete(true);

      // Télécharger le PDF
      doc.save('Guide-Utilisation-SEO-Analytics-Dashboard.pdf');

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-3">
              <FileText className="h-6 w-6" />
              Documentation PDF
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Générez et téléchargez le guide d'utilisation complet au format PDF
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Contenu inclus :</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Vue d'ensemble et architecture technique
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Guide complet du Dashboard principal
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Calendrier éditorial et gestion de contenu
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Configuration des 8 plateformes sociales
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  20 tutoriels vidéo YouTube authentiques
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Paramètres et fonctionnalités avancées
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Guide de dépannage complet
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Format professionnel sans émojis
                </li>
              </ul>
            </div>

            {isGenerating && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Génération du PDF en cours...</span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-gray-500 text-center">
                  {progress}% - Traitement du contenu
                </p>
              </div>
            )}

            {isComplete && (
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">PDF généré avec succès!</span>
                </div>
                <p className="text-sm text-gray-500">
                  Le téléchargement a été lancé automatiquement
                </p>
              </div>
            )}

            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Générer et télécharger le PDF
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              <p>Le PDF sera automatiquement téléchargé une fois généré.</p>
              <p>Taille approximative : 15-20 pages</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}