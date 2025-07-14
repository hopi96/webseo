import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FileText, Download, Users, Search, Zap, Target, TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, Globe, Link, MapPin, Calendar } from "lucide-react";
import { WebsiteSelector } from "@/components/website/website-selector";
import { UnifiedHeader } from "@/components/layout/unified-header";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Reports() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number>(1);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  // Types pour les données
  type WebsiteType = {
    id: number;
    url: string;
    name: string;
    createdAt: string;
  };

  type SeoAnalysisType = {
    id: number;
    websiteId: number;
    overallScore: number;
    organicTraffic: number;
    keywordsRanking: number;
    backlinks: number;
    pageSpeed: number;
    technicalSeo: any;
    recommendations: any[];
    keywords: any[];
    trafficData: any[];
    rawWebhookData?: string;
    analyzedAt: string;
  };

  // Récupération des sites web
  const { data: websites = [] } = useQuery<WebsiteType[]>({
    queryKey: ['/api/websites'],
  });

  // S'assurer qu'on a un website ID valide si les sites sont chargés
  // Sélectionner automatiquement le site le plus récent (ID le plus élevé) seulement au premier chargement
  useEffect(() => {
    if (websites.length > 0) {
      // Trier par ID décroissant pour avoir le plus récent en premier
      const sortedWebsites = [...websites].sort((a, b) => b.id - a.id);
      const newestWebsite = sortedWebsites[0];
      
      // Si aucun site n'est sélectionné ou si le site sélectionné n'existe plus
      if (!selectedWebsiteId || !websites.find(w => w.id === selectedWebsiteId)) {
        setSelectedWebsiteId(newestWebsite.id);
      }
    }
  }, [websites.length]);

  // Récupération de l'analyse SEO
  const { data: seoAnalysis, isLoading } = useQuery<SeoAnalysisType>({
    queryKey: [`/api/websites/${selectedWebsiteId}/seo-analysis`],
    enabled: !!selectedWebsiteId,
  });

  const selectedWebsite = (websites as WebsiteType[]).find((w: WebsiteType) => w.id === selectedWebsiteId);

  // Parse des données webhook pour obtenir les vraies données
  const webhookData = seoAnalysis?.rawWebhookData ? JSON.parse(seoAnalysis.rawWebhookData) : {};

  // Fonction pour obtenir l'icône de tendance
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  // Préparation des données pour les graphiques
  const keywordDensityData = webhookData.keywordAnalysis?.map((kw: any) => ({
    keyword: kw.keyword,
    density: kw.density,
    count: kw.count
  })).slice(0, 6) || [];

  const coreWebVitalsData = [
    { name: 'LCP', value: webhookData.pageSpeedMetrics?.largestContentfulPaint || 0, target: 2.5, unit: 's' },
    { name: 'CLS', value: webhookData.pageSpeedMetrics?.cumulativeLayoutShift || 0, target: 0.1, unit: '' },
    { name: 'FCP', value: webhookData.pageSpeedMetrics?.firstContentfulPaint || 0, target: 1.8, unit: 's' }
  ];

  // Fonction pour générer le PDF structuré comme le dashboard
  const generatePDF = async () => {
    if (!seoAnalysis || !selectedWebsite) {
      toast({
        title: "Erreur",
        description: "Aucune donnée d'analyse disponible pour générer le rapport",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // En-tête du rapport - style dashboard
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RAPPORT SEO DASHBOARD', 20, yPosition);
      yPosition += 20;

      // Ligne de séparation
      pdf.setLineWidth(0.5);
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 15;

      // Informations du site
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedWebsite.name, 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(selectedWebsite.url, 20, yPosition);
      yPosition += 8;

      pdf.text(`Dernière analyse: ${new Date(seoAnalysis.analyzedAt).toLocaleDateString('fr-FR')}`, 20, yPosition);
      yPosition += 8;

      pdf.text(`Rapport généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition);
      yPosition += 25;

      // Section Score SEO Global - mise en forme comme dashboard
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SCORE SEO GLOBAL', 20, yPosition);
      yPosition += 15;

      // Cadre pour le score
      pdf.setLineWidth(0.3);
      pdf.rect(20, yPosition - 5, 80, 30);

      pdf.setFontSize(36);
      const scoreColor = seoAnalysis.overallScore >= 70 ? [34, 197, 94] : 
                        seoAnalysis.overallScore >= 40 ? [251, 191, 36] : [239, 68, 68];
      pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      pdf.text(`${seoAnalysis.overallScore}/100`, 25, yPosition + 20);
      pdf.setTextColor(0, 0, 0);

      // Évaluation textuelle
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const scoreText = seoAnalysis.overallScore >= 70 ? 'Excellent' : 
                       seoAnalysis.overallScore >= 40 ? 'Moyen' : 'À améliorer';
      pdf.text(`Évaluation: ${scoreText}`, 110, yPosition + 15);
      yPosition += 45;

      // Section Métriques Principales - format tableau
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MÉTRIQUES PRINCIPALES', 20, yPosition);
      yPosition += 15;

      // Parse webhook data to match dashboard exactly
      const webhookData = seoAnalysis.rawWebhookData ? JSON.parse(seoAnalysis.rawWebhookData) : {};
      
      const metricsData = [
        { icon: '🌐', label: 'Score SEO', value: webhookData.seoScore || seoAnalysis.overallScore, desc: 'Score global d\'optimisation SEO' },
        { icon: '⚡', label: 'PageSpeed', value: webhookData.pageSpeed || seoAnalysis.pageSpeed, desc: 'Performance de chargement' },
        { icon: '🔍', label: 'Mots-clés', value: webhookData.keywordCount || seoAnalysis.keywordsRanking, desc: 'Mots-clés analysés' },
        { icon: '🔗', label: 'Liens internes', value: webhookData.internalLinks || seoAnalysis.backlinks, desc: 'Maillage interne du site' }
      ];

      metricsData.forEach((metric, index) => {
        const yPos = yPosition + (index * 20);
        
        // Cadre pour chaque métrique
        pdf.setLineWidth(0.2);
        pdf.rect(20, yPos - 3, pageWidth - 40, 18);
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${metric.value}`, 25, yPos + 8);
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(metric.label, 60, yPos + 8);
        
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(metric.desc, 60, yPos + 13);
        pdf.setTextColor(0, 0, 0);
      });
      yPosition += 95;

      // Nouvelle page si nécessaire
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 20;
      }

      // Section Audit Technique SEO
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AUDIT TECHNIQUE SEO', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Vérifications techniques essentielles pour le référencement', 20, yPosition);
      yPosition += 20;

      const technicalChecks = [
        { name: 'Mobile-Friendly', status: seoAnalysis.technicalSeo?.mobileFriendly, desc: 'Site optimisé pour mobile' },
        { name: 'HTTPS Secure', status: seoAnalysis.technicalSeo?.httpsSecure, desc: 'Connexion sécurisée SSL' },
        { name: 'XML Sitemap', status: seoAnalysis.technicalSeo?.xmlSitemap, desc: 'Plan du site pour moteurs de recherche' },
        { name: 'Robots.txt', status: seoAnalysis.technicalSeo?.robotsTxt, desc: 'Instructions pour robots d\'indexation' }
      ];

      technicalChecks.forEach((check, index) => {
        const yPos = yPosition + (index * 15);
        
        // Indicateur de statut coloré
        if (check.status) {
          pdf.setFillColor(34, 197, 94);
          pdf.circle(25, yPos + 5, 2, 'F');
          pdf.text('✓ Conforme', 32, yPos + 7);
        } else {
          pdf.setFillColor(239, 68, 68);
          pdf.circle(25, yPos + 5, 2, 'F');
          pdf.text('✗ À corriger', 32, yPos + 7);
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(check.name, 80, yPos + 7);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(check.desc, 80, yPos + 12);
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
      });
      yPosition += 75;

      // Section Top 5 Mots-clés
      if (seoAnalysis.keywords && seoAnalysis.keywords.length > 0) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TOP 5 MOTS-CLÉS', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Classement des mots-clés les mieux positionnés', 20, yPosition);
        yPosition += 20;

        // En-têtes du tableau
        pdf.setFont('helvetica', 'bold');
        pdf.text('Position', 25, yPosition);
        pdf.text('Mot-clé', 60, yPosition);
        pdf.text('Volume', 130, yPosition);
        pdf.text('Tendance', 160, yPosition);
        yPosition += 8;

        // Ligne de séparation
        pdf.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 8;

        pdf.setFont('helvetica', 'normal');
        seoAnalysis.keywords.slice(0, 5).forEach((keyword: any, index: number) => {
          const yPos = yPosition + (index * 12);
          
          pdf.text(`#${keyword.position}`, 25, yPos);
          pdf.text(keyword.keyword, 60, yPos);
          pdf.text(`${keyword.volume || 'N/A'}`, 130, yPos);
          
          // Tendance avec couleur
          if (keyword.trend === 'up') {
            pdf.setTextColor(34, 197, 94);
            pdf.text('↗ Hausse', 160, yPos);
          } else if (keyword.trend === 'down') {
            pdf.setTextColor(239, 68, 68);
            pdf.text('↘ Baisse', 160, yPos);
          } else {
            pdf.setTextColor(100, 100, 100);
            pdf.text('→ Stable', 160, yPos);
          }
          pdf.setTextColor(0, 0, 0);
        });
        yPosition += 80;
      }

      // Section Recommandations Prioritaires
      if (seoAnalysis.recommendations && seoAnalysis.recommendations.length > 0) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('RECOMMANDATIONS PRIORITAIRES', 20, yPosition);
        yPosition += 15;

        seoAnalysis.recommendations.slice(0, 5).forEach((rec: any, index: number) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }

          // Indicateur de priorité
          const priorityColor = rec.priority === 'high' ? [239, 68, 68] : 
                               rec.priority === 'medium' ? [251, 191, 36] : [100, 100, 100];
          pdf.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
          pdf.rect(20, yPosition - 2, 4, 12, 'F');

          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${rec.title}`, 28, yPosition + 5);
          yPosition += 10;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const description = rec.description || '';
          const lines = pdf.splitTextToSize(description, pageWidth - 50);
          pdf.text(lines, 28, yPosition);
          yPosition += lines.length * 4 + 5;

          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Priorité: ${rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'}`, 28, yPosition);
          pdf.setTextColor(0, 0, 0);
          yPosition += 15;
        });
      }

      // Pied de page avec style
      const totalPages = pdf.internal.pages.length - 1; // -1 car le premier élément est toujours vide
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Rapport généré par SEO Dashboard', 20, pageHeight - 10);
        pdf.text(`Page ${i} sur ${totalPages}`, pageWidth - 40, pageHeight - 10);
        pdf.text(new Date().toLocaleDateString('fr-FR'), pageWidth - 40, pageHeight - 5);
      }

      // Télécharger le PDF
      const fileName = `rapport-seo-${selectedWebsite.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Rapport généré",
        description: "Le rapport PDF a été téléchargé avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du rapport PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UnifiedHeader />

      <div className="p-6 space-y-6">
        {/* En-tête */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rapports SEO</h1>
              <p className="text-gray-600 dark:text-gray-400">Générez des rapports PDF détaillés de vos analyses SEO</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sélectionner un site web
            </label>
            <WebsiteSelector
              selectedWebsiteId={selectedWebsiteId}
              onWebsiteChange={setSelectedWebsiteId}
              onWebsiteAdded={(websiteId) => {
                // Sélectionner automatiquement le nouveau site ajouté
                setSelectedWebsiteId(websiteId);
              }}
            />
          </div>

          {selectedWebsite && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{selectedWebsite.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedWebsite.url}</p>
              </div>
              <Button 
                onClick={generatePDF}
                disabled={isGeneratingPDF || !seoAnalysis}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Générer PDF
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Données manquantes ou erreur */}
        {!seoAnalysis || !seoAnalysis.rawWebhookData ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="text-center py-12">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Aucune donnée d'analyse disponible</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Veuillez d'abord effectuer une analyse SEO sur le dashboard pour générer ce rapport.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Informations du site sélectionné */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-blue-600 mb-2">{selectedWebsite?.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{selectedWebsite?.url}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-green-600">{webhookData?.seoScore || 'N/A'}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Score SEO</div>
                </div>
              </div>
            </div>

            {/* Métriques principales en cartes - identiques au dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Score SEO */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    Score SEO
                    <HelpTooltip content="Score global d'optimisation SEO de votre site web, calculé sur la base de différents critères techniques et de contenu" />
                  </CardTitle>
                  <Globe className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {webhookData.seoScore}
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Progress value={webhookData.seoScore} className="flex-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {webhookData.seoScore >= 80 ? 'Excellent' : 
                       webhookData.seoScore >= 60 ? 'Bon' : 'À améliorer'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* PageSpeed */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    PageSpeed
                    <HelpTooltip content="Vitesse de chargement de votre site web. Un score élevé améliore l'expérience utilisateur et le classement Google" />
                  </CardTitle>
                  <Zap className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {webhookData.pageSpeed}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Performance: {webhookData.pageSpeedMetrics?.performanceScore || 'N/A'}
                  </div>
                </CardContent>
              </Card>

              {/* Mots-clés */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    Mots-clés
                    <HelpTooltip content="Nombre total de mots-clés identifiés sur votre site web, incluant les variantes géolocalisées et saisonnières" />
                  </CardTitle>
                  <Search className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {webhookData.keywordCount}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Mots-clés analysés
                  </div>
                </CardContent>
              </Card>

              {/* Liens */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    Liens internes
                    <HelpTooltip content="Nombre de liens internes qui relient les pages de votre site entre elles. Améliore la navigation et le référencement" />
                  </CardTitle>
                  <Link className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {webhookData.internalLinks}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {webhookData.externalLinks} liens externes
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Core Web Vitals - identique au dashboard */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  Core Web Vitals
                  <HelpTooltip content="Métriques essentielles de Google pour l'expérience utilisateur : temps de chargement, interactivité et stabilité visuelle" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* LCP */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {webhookData.pageSpeedMetrics?.largestContentfulPaint || 'N/A'}s
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                      LCP
                      <HelpTooltip content="Temps nécessaire pour afficher le plus gros élément visible de la page. Une LCP rapide (≤2.5s) améliore l'expérience utilisateur." />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {webhookData.pageSpeedMetrics?.largestContentfulPaint <= 2.5 ? 'Bon' : 
                       webhookData.pageSpeedMetrics?.largestContentfulPaint <= 4 ? 'À améliorer' : 'Mauvais'}
                    </div>
                    <Progress 
                      value={Math.min(100, Math.max(0, (4 - (webhookData.pageSpeedMetrics?.largestContentfulPaint || 0)) / 4 * 100))} 
                      className="mt-2"
                    />
                  </div>

                  {/* CLS */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {webhookData.pageSpeedMetrics?.cumulativeLayoutShift || 'N/A'}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                      CLS
                      <HelpTooltip content="Mesure la stabilité visuelle de la page. Un CLS faible (≤0.1) indique que les éléments ne bougent pas de manière inattendue pendant le chargement." />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {webhookData.pageSpeedMetrics?.cumulativeLayoutShift <= 0.1 ? 'Bon' : 
                       webhookData.pageSpeedMetrics?.cumulativeLayoutShift <= 0.25 ? 'À améliorer' : 'Mauvais'}
                    </div>
                    <Progress 
                      value={Math.min(100, Math.max(0, (0.25 - (webhookData.pageSpeedMetrics?.cumulativeLayoutShift || 0)) / 0.25 * 100))} 
                      className="mt-2"
                    />
                  </div>

                  {/* FCP */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {webhookData.pageSpeedMetrics?.firstContentfulPaint || 'N/A'}s
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                      FCP
                      <HelpTooltip content="Temps nécessaire pour afficher le premier élément de contenu visible. Un FCP rapide (≤1.8s) indique que la page commence à se charger rapidement." />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {webhookData.pageSpeedMetrics?.firstContentfulPaint <= 1.8 ? 'Bon' : 
                       webhookData.pageSpeedMetrics?.firstContentfulPaint <= 3 ? 'À améliorer' : 'Mauvais'}
                    </div>
                    <Progress 
                      value={Math.min(100, Math.max(0, (3 - (webhookData.pageSpeedMetrics?.firstContentfulPaint || 0)) / 3 * 100))} 
                      className="mt-2"
                    />
                  </div>

                  {/* Performance globale */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {webhookData.pageSpeedMetrics?.performanceScore || 'N/A'}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Performance
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Score global
                    </div>
                    <Progress 
                      value={webhookData.pageSpeedMetrics?.performanceScore || 0} 
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Graphiques en grille */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Graphique des mots-clés par densité */}
              {keywordDensityData.length > 0 && (
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      Densité des Mots-clés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={keywordDensityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="keyword" 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          fontSize={12}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="density" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Core Web Vitals en graphique */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Core Web Vitals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={coreWebVitalsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [`${value}${name === 'value' ? coreWebVitalsData.find(d => d.name === name)?.unit || '' : ''}`, 'Valeur']}
                      />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recommandations SEO - identiques au dashboard */}
            {webhookData.recommendations && webhookData.recommendations.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Recommandations SEO
                    <HelpTooltip content="Suggestions d'amélioration prioritaires basées sur l'analyse technique de votre site web" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {webhookData.recommendations.slice(0, 5).map((rec: any, index: number) => (
                      <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className={`w-2 h-12 rounded-full ${
                          rec.priority === 'high' ? 'bg-red-500' : 
                          rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}></div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{rec.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.description}</p>
                          <div className="flex items-center mt-2 space-x-2">
                            <Badge 
                              variant="outline"
                              className={
                                rec.priority === 'high' ? 'border-red-200 text-red-700' :
                                rec.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                'border-gray-200 text-gray-700'
                              }
                            >
                              Priorité {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{rec.category}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audit technique SEO */}
            {webhookData.technicalSeo && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Audit Technique SEO
                    <HelpTooltip content="Vérifications techniques essentielles pour le référencement de votre site web" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      {webhookData.technicalSeo.mobileFriendly ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Mobile-Friendly</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Optimisation mobile</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {webhookData.technicalSeo.httpsSecure ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">HTTPS Secure</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Connexion sécurisée</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {webhookData.technicalSeo.xmlSitemap ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">XML Sitemap</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Plan du site</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {webhookData.technicalSeo.robotsTxt ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Robots.txt</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Instructions robots</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Mots-clés */}
            {webhookData.keywords && webhookData.keywords.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Top Mots-clés
                    <HelpTooltip content="Classement des mots-clés les mieux positionnés avec leur tendance d'évolution" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {webhookData.keywords.slice(0, 10).map((keyword: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">#{keyword.position}</Badge>
                          <span className="font-medium text-gray-900 dark:text-white">{keyword.keyword}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{keyword.volume} recherches/mois</span>
                          {getTrendIcon(keyword.trend)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}