import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { UnifiedHeader } from "@/components/layout/unified-header";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { AddWebsiteDialog } from "@/components/website/add-website-dialog";
import { WebsiteSelector } from "@/components/website/website-selector";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  Zap, 
  Search, 
  Link,
  Info, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Calendar,
  Plus,
  RefreshCw,
  Loader2
} from "lucide-react";

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

export default function DashboardWebhook() {
  const [isAddWebsiteOpen, setIsAddWebsiteOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number>(1);
  const { toast } = useToast();

  // Récupération des sites web
  const { data: websites = [] } = useQuery<WebsiteType[]>({
    queryKey: ['/api/websites'],
  });

  // S'assurer qu'on a un website ID valide si les sites sont chargés
  // Sélectionner automatiquement le site le plus récent (ID le plus élevé)
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
  }, [websites, selectedWebsiteId]);

  // Récupération de l'analyse SEO pour le site sélectionné
  const { data: seoAnalysis, isLoading, error: seoError } = useQuery<SeoAnalysisType>({
    queryKey: [`/api/websites/${selectedWebsiteId}/seo-analysis`],
    enabled: !!selectedWebsiteId,
  });

  // Mutation pour actualiser l'analyse
  const refreshAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/websites/${selectedWebsiteId}/refresh-analysis`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/websites'] });
      queryClient.invalidateQueries({ queryKey: [`/api/websites/${selectedWebsiteId}/seo-analysis`] });
      toast({
        title: "Analyse actualisée",
        description: "L'analyse SEO a été mise à jour avec succès",
      });
      setIsAnalysisOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Impossible d'actualiser l'analyse";
      
      // Vérifier si c'est une erreur de webhook
      if (errorMessage.includes("webhook") || errorMessage.includes("Webhook") || errorMessage.includes("n8n")) {
        setWebhookError(`Erreur de connexion webhook: ${errorMessage}`);
      } else {
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
      setIsAnalysisOpen(false);
    },
  });

  const hasAnalysisError = seoError || !seoAnalysis || !seoAnalysis.rawWebhookData;
  const website = websites.find(w => w.id === selectedWebsiteId);

  // Traiter les données webhook seulement si disponibles
  let webhookData: any = null;
  if (seoAnalysis?.rawWebhookData) {
    try {
      webhookData = JSON.parse(seoAnalysis.rawWebhookData);
    } catch (e) {
      console.error('Erreur lors du parsing des données webhook:', e);
    }
  }



  // Fonction pour obtenir l'icône de tendance
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  // Préparation des données pour le graphique de densité des mots-clés
  const keywordDensityData = webhookData?.keywordAnalysis?.map((kw: any) => ({
    keyword: kw.keyword,
    density: kw.density,
    count: kw.count
  })).slice(0, 6) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <UnifiedHeader />
        <div className="p-6 space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement de l'analyse...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UnifiedHeader />
      <div className="p-6 space-y-6 animate-in fade-in duration-700">
        {/* En-tête avec sélecteur de site et boutons d'action */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-all duration-300 hover:shadow-md animate-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col gap-4">
            {/* Première ligne : Titre et sélecteur */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Analyse SEO du site web
              </h1>
              
              <div className="flex items-center gap-4">
                {/* Sélecteur de site web */}
                <div className="min-w-64">
                  <WebsiteSelector
                    selectedWebsiteId={selectedWebsiteId}
                    onWebsiteChange={setSelectedWebsiteId}
                  />
                </div>
                
                {/* Boutons d'action */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsAddWebsiteOpen(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
                  >
                    <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
                    Ajouter un site
                  </Button>
                  
                  <Button
                    onClick={() => setIsAnalysisOpen(true)}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
                    disabled={refreshAnalysisMutation.isPending}
                  >
                    {refreshAnalysisMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 transition-transform duration-200 hover:rotate-180" />
                    )}
                    Actualiser l'analyse
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Deuxième ligne : Informations du site sélectionné */}
            {website && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg text-blue-600 font-medium">{website.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{website.url}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600 transition-all duration-500 animate-in zoom-in-50">{webhookData?.seoScore || 'N/A'}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Score SEO</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message d'erreur si l'analyse échoue */}
        {hasAnalysisError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  Analyse SEO indisponible
                </h3>
                <p className="text-red-700 dark:text-red-300 mt-1">
                  Les données d'analyse pour ce site ne sont pas disponibles. Cela peut être dû à :
                </p>
                <ul className="text-red-700 dark:text-red-300 mt-2 ml-4 list-disc">
                  <li>Une erreur de connexion au service d'analyse</li>
                  <li>Un problème temporaire avec le webhook</li>
                  <li>Une analyse qui n'a pas encore été effectuée</li>
                </ul>
              </div>
              <Button
                onClick={() => setIsAnalysisOpen(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/30"
                disabled={refreshAnalysisMutation.isPending}
              >
                {refreshAnalysisMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Réessayer l'analyse
              </Button>
            </div>
          </div>
        )}

        {/* Contenu de l'analyse - affiché seulement si les données sont disponibles */}
        {!hasAnalysisError && webhookData && (
          <>
            {/* Métriques principales en cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Score SEO */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-105 animate-in slide-in-from-left-4 duration-500 delay-100">
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
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-105 animate-in slide-in-from-left-4 duration-500 delay-200">
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
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-105 animate-in slide-in-from-left-4 duration-500 delay-300">
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
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-105 animate-in slide-in-from-left-4 duration-500 delay-[400ms]">
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

        {/* Core Web Vitals */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-4 duration-700 delay-600">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Core Web Vitals
              <HelpTooltip content="Métriques essentielles de Google pour l'expérience utilisateur : temps de chargement, interactivité et stabilité visuelle" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* LCP - Largest Contentful Paint */}
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

              {/* CLS - Cumulative Layout Shift */}
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

              {/* FCP - First Contentful Paint */}
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

              {/* TBT - Total Blocking Time */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {webhookData.pageSpeedMetrics?.totalBlockingTime || 'N/A'}ms
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                  TBT
                  <HelpTooltip content="Temps total de blocage des interactions utilisateur. Un TBT faible (≤200ms) garantit une page réactive aux interactions." />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {webhookData.pageSpeedMetrics?.totalBlockingTime <= 200 ? 'Bon' : 
                   webhookData.pageSpeedMetrics?.totalBlockingTime <= 600 ? 'À améliorer' : 'Mauvais'}
                </div>
                <Progress 
                  value={Math.min(100, Math.max(0, (600 - (webhookData.pageSpeedMetrics?.totalBlockingTime || 0)) / 600 * 100))} 
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analyse des titres et méta-descriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-700 delay-500">
          {/* Balises de titre */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Analyse des titres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Titre principal
                    </span>
                    <Badge variant={webhookData.titleTags?.status === 'good' ? 'default' : 'secondary'}>
                      {webhookData.titleTags?.status || 'warning'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    "{webhookData.titleTags?.title}"
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Longueur: {webhookData.titleTags?.length} caractères
                  </p>
                </div>
                
                {webhookData.titleTags?.suggestions && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Suggestions d'amélioration:
                    </p>
                    <ul className="space-y-1">
                      {webhookData.titleTags.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                          <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1 mt-0.5" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Méta-descriptions */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Méta-descriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description principale
                    </span>
                    <Badge variant={webhookData.metaDescriptions?.status === 'good' ? 'default' : 'secondary'}>
                      {webhookData.metaDescriptions?.status || 'warning'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    "{webhookData.metaDescriptions?.description?.slice(0, 100)}..."
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Longueur: {webhookData.metaDescriptions?.length} caractères
                  </p>
                </div>
                
                {webhookData.metaDescriptions?.suggestions && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Suggestions d'amélioration:
                    </p>
                    <ul className="space-y-1">
                      {webhookData.metaDescriptions.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                          <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1 mt-0.5" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit technique SEO */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Audit technique SEO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(webhookData.technicalSeo || {}).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  {value ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {key === 'robotsTxt' ? 'Robots.txt' :
                       key === 'xmlSitemap' ? 'XML Sitemap' :
                       key === 'mobileFriendly' ? 'Mobile-Friendly' :
                       key === 'https' ? 'HTTPS' :
                       key === 'compression' ? 'Compression' :
                       key === 'imageAltTags' ? 'Balises Alt' : key}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {value ? 'Conforme' : 'À corriger'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analyse de densité des mots-clés */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Analyse de densité des mots-clés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={keywordDensityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                  <XAxis 
                    dataKey="keyword" 
                    className="text-gray-600 dark:text-gray-400"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis className="text-gray-600 dark:text-gray-400" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      color: '#374151'
                    }}
                    formatter={(value, name) => [
                      `${value}${name === 'density' ? '%' : ''}`,
                      name === 'density' ? 'Densité' : 'Occurrences'
                    ]}
                  />
                  <Bar dataKey="density" fill="#3b82f6" name="density" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stratégie de contenu avec mots-clés géolocalisés et saisonniers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Opportunités locales */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Opportunités locales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {webhookData.contentStrategy?.localOpportunities?.slice(0, 8).map((keyword: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm text-gray-900 dark:text-white">{keyword}</span>
                    <Badge variant="outline" className="text-xs">Local</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mots-clés saisonniers */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Mots-clés saisonniers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {webhookData.contentStrategy?.seasonalKeywords?.slice(0, 8).map((keyword: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm text-gray-900 dark:text-white">{keyword}</span>
                    <Badge variant="outline" className="text-xs">Saisonnier</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stratégie de contenu suggérée */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              🎯 Stratégie de contenu suggérée
            </CardTitle>
            <div className="flex justify-end">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Recevoir Single Page Report →
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mots-clés longue traîne (Google Suggest) */}
            <div className="mb-8">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                🔍 Mots-clés longue traîne (Google Suggest)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {webhookData.contentStrategy?.trendingKeywords?.slice(0, 8).map((keyword: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {keyword.keyword}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({keyword.searchVolume?.toLocaleString()} vol)
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-white">
                      {keyword.seasonality} saison
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Mots-clés sémantique longue traîne */}
            <div className="mb-8">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                📚 Mots-clés sémantique longue traîne
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {webhookData.contentStrategy?.seasonalKeywords?.slice(0, 12).map((keyword: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{keyword}</span>
                  </div>
                ))}
              </div>
            </div>



            {/* Opportunités locales et mots-clés longue traîne */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Opportunités locales */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  🗺️ Opportunités locales
                </h3>
                <div className="space-y-2">
                  {webhookData.contentStrategy?.localOpportunities?.slice(0, 8).map((location: string, index: number) => (
                    <div key={index} className="p-2 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800">
                      <div className="text-sm text-gray-700 dark:text-gray-300">{location}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mots-clés longue traîne */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  🎯 Mots-clés longue traîne
                </h3>
                <div className="space-y-2">
                  {webhookData.contentStrategy?.seasonalKeywords?.slice(0, 8).map((keyword: string, index: number) => (
                    <div key={index} className="p-2 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800">
                      <div className="text-sm text-gray-700 dark:text-gray-300">{keyword}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core Web Vitals */}
        {webhookData.pageSpeedMetrics && (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Core Web Vitals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {webhookData.pageSpeedMetrics.firstContentfulPaint}s
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">FCP</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {webhookData.pageSpeedMetrics.largestContentfulPaint}s
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">LCP</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {webhookData.pageSpeedMetrics.cumulativeLayoutShift}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">CLS</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {webhookData.pageSpeedMetrics.totalBlockingTime}ms
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">TBT</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
          </>
        )}
      </div>

      {/* Dialogue d'ajout de site web */}
      <AddWebsiteDialog 
        open={isAddWebsiteOpen}
        onOpenChange={setIsAddWebsiteOpen}
        onWebsiteAdded={(websiteId) => {
          // Sélectionner automatiquement le nouveau site ajouté
          setSelectedWebsiteId(websiteId);
        }}
      />

      {/* Dialogue d'actualisation d'analyse */}
      <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Actualisation de l'analyse SEO</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-6">
            {refreshAnalysisMutation.isPending ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-600 text-center">
                  Actualisation en cours...
                  <br />
                  Récupération des dernières données SEO via webhook
                </p>
              </>
            ) : (
              <>
                <RefreshCw className="h-8 w-8 text-blue-600" />
                <p className="text-sm text-gray-600 text-center">
                  Voulez-vous actualiser l'analyse SEO du site ?
                  <br />
                  Cette action récupérera les dernières données via webhook.
                </p>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAnalysisOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => refreshAnalysisMutation.mutate()}
                    disabled={refreshAnalysisMutation.isPending}
                  >
                    Actualiser
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue d'erreur webhook */}
      <AlertDialog open={!!webhookError} onOpenChange={() => setWebhookError(null)}>
        <AlertDialogContent className="border-red-200 dark:border-red-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Erreur de connexion webhook
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-700 dark:text-red-300">
              {webhookError}
              <br /><br />
              {webhookError?.includes('mode test') ? (
                <>
                  <strong>📋 Instructions pour le mode test n8n :</strong>
                  <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li><strong>Allez dans votre canvas n8n</strong></li>
                      <li><strong>Cliquez sur "Execute workflow"</strong></li>
                      <li><strong>Revenez ici immédiatement</strong></li>
                      <li><strong>Cliquez sur "Actualiser l'analyse"</strong></li>
                    </ol>
                    <p className="text-xs mt-2 text-yellow-800 dark:text-yellow-200">
                      ⚠️ Important : En mode test, le webhook ne fonctionne que pour un seul appel après activation.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <strong>Solutions possibles :</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Activez votre workflow dans n8n (mode production)</li>
                    <li>Ou cliquez sur "Execute workflow" pour le mode test</li>
                    <li>Vérifiez l'URL du webhook dans les paramètres</li>
                    <li>Contactez l'administrateur système si le problème persiste</li>
                  </ul>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {webhookError?.includes('mode test') && (
              <AlertDialogAction 
                onClick={() => {
                  setWebhookError(null);
                  // Attendre un peu puis relancer automatiquement
                  setTimeout(() => {
                    setIsAnalysisOpen(true);
                  }, 500);
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white mr-2"
              >
                J'ai activé n8n, relancer
              </AlertDialogAction>
            )}
            <AlertDialogAction 
              onClick={() => setWebhookError(null)}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Fermer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}