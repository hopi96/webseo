import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  BarChart3, TrendingUp, TrendingDown, Minus, RefreshCw, Clock, 
  Globe, Users, Search, Target, ChevronUp, ChevronDown, 
  CheckCircle, AlertTriangle, XCircle, Info,
  ExternalLink, FileText, Image, Shield, Eye, Link
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { WebsiteSelector } from "@/components/website/website-selector";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, RadialBarChart, RadialBar, LineChart, Line,
  AreaChart, Area
} from "recharts";

export default function Dashboard() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number>(1);
  const { toast } = useToast();

  // Requête pour récupérer les sites web
  const { data: websites = [] } = useQuery({
    queryKey: ['/api/websites'],
  });

  // Requête pour récupérer l'analyse SEO
  const { data: seoAnalysis, isLoading } = useQuery({
    queryKey: ['/api/websites', selectedWebsiteId, 'seo-analysis'],
    enabled: !!selectedWebsiteId,
  });

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

  // Mutation pour rafraîchir l'analyse SEO avec le webhook
  const refreshAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/websites/${selectedWebsiteId}/refresh-analysis`, {});
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur inconnue");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalider et rafraîchir toutes les données SEO
      queryClient.invalidateQueries({ queryKey: ['/api/websites', selectedWebsiteId, 'seo-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['/api/websites'] });
      
      // Forcer le rechargement immédiat des données
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/websites', selectedWebsiteId, 'seo-analysis'] });
      }, 500);
      
      toast({
        title: "Analyse SEO terminée",
        description: `Nouvelle analyse reçue avec un score de ${data.overallScore}/100`,
      });
    },
    onError: (error: any) => {
      // Gestion spécifique pour l'erreur webhook n8n
      if (error.message && error.message.includes('Webhook n8n')) {
        toast({
          title: "Webhook n8n requis",
          description: "Activez le webhook dans n8n en cliquant sur 'Test workflow' puis réessayez.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur d'analyse",
          description: error.message || "Impossible de rafraîchir l'analyse SEO.",
          variant: "destructive",
        });
      }
    },
  });

  const selectedWebsite = (websites as WebsiteType[]).find((w: WebsiteType) => w.id === selectedWebsiteId);

  // Fonction pour obtenir le statut des Core Web Vitals
  const getWebVitalStatus = (value: number, thresholds: { good: number, poor: number }) => {
    if (value <= thresholds.good) return { status: 'good', color: '#10b981', label: 'Bon' };
    if (value <= thresholds.poor) return { status: 'needs-improvement', color: '#f59e0b', label: 'À améliorer' };
    return { status: 'poor', color: '#ef4444', label: 'Mauvais' };
  };

  // Fonction pour obtenir l'icône de priorité
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Fonction pour obtenir la couleur de priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading || !seoAnalysis) {
    return (
      <div className="min-h-screen soft-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg soft-text">Chargement de l'analyse SEO...</p>
        </div>
      </div>
    );
  }

  // Parse des données JSON du webhook si présentes
  const webhookData = (seoAnalysis as SeoAnalysisType)?.rawWebhookData ? JSON.parse((seoAnalysis as SeoAnalysisType).rawWebhookData) : null;

  return (
    <div className="min-h-screen soft-background">
      {/* Superposition de chargement pendant l'analyse */}
      {refreshAnalysisMutation.isPending && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="soft-card p-8 text-center space-y-4 mx-4">
            <div className="flex justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Analyse SEO en cours
              </h3>
              <p className="soft-text">
                Récupération des données depuis le webhook n8n...
              </p>
              <div className="mt-4 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative container mx-auto px-6 py-8 max-w-7xl">
        
        {/* En-tête */}
        <div className="mb-8">
          <div className="soft-card p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 soft-metric-blue rounded-xl">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold text-slate-700 mb-1">
                      Analyse SEO Complète
                    </h1>
                    <p className="soft-text text-lg">
                      {webhookData?.overview?.title || selectedWebsite?.name || 'Site web'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      refreshAnalysisMutation.isPending 
                        ? 'bg-blue-400 animate-pulse' 
                        : 'bg-emerald-400'
                    }`}></div>
                    <span className="text-sm soft-text">
                      {refreshAnalysisMutation.isPending 
                        ? 'Analyse en cours...' 
                        : 'Données actualisées'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <span className="text-sm soft-text">
                      {webhookData?.meta?.pageAnalyzed || selectedWebsite?.url}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm soft-text">
                      {webhookData?.meta?.crawlDate || new Date().toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-4">
                <Button
                  onClick={() => refreshAnalysisMutation.mutate()}
                  disabled={refreshAnalysisMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 soft-button"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshAnalysisMutation.isPending ? 'animate-spin' : ''}`} />
                  {refreshAnalysisMutation.isPending ? 'Analyse en cours...' : 'Actualiser l\'analyse'}
                </Button>
                
                <WebsiteSelector 
                  selectedWebsiteId={selectedWebsiteId}
                  onWebsiteChange={setSelectedWebsiteId}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Métriques principales - style dashboard moderne */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Autorité Domaine</p>
                <p className="text-3xl font-bold text-slate-900">{webhookData?.domainMetrics?.domainAuthorityMoz || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Moz DA</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Trafic Organique</p>
                <p className="text-3xl font-bold text-slate-900">{webhookData?.domainMetrics?.estOrganicTrafficMonthly || 0}</p>
                <p className="text-xs text-slate-500 mt-1">visites/mois</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Mots-clés</p>
                <p className="text-3xl font-bold text-slate-900">{webhookData?.domainMetrics?.totalOrganicKeywords || 0}</p>
                <p className="text-xs text-slate-500 mt-1">positionnés</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Search className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Backlinks</p>
                <p className="text-3xl font-bold text-slate-900">{webhookData?.domainMetrics?.totalBacklinks || 0}</p>
                <p className="text-xs text-slate-500 mt-1">liens entrants</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Link className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Core Web Vitals */}
        {webhookData?.technical?.coreWebVitals && (
          <div className="mb-8">
            <Card className="p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-700 mb-6 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Core Web Vitals
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Mobile */}
                <div>
                  <h4 className="font-medium text-slate-600 mb-4">Mobile</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium">LCP</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{webhookData.technical.coreWebVitals.mobile.LCPs}s</span>
                        <div className={`w-3 h-3 rounded-full ${
                          getWebVitalStatus(webhookData.technical.coreWebVitals.mobile.LCPs, { good: 2.5, poor: 4 }).color
                        }`} style={{ backgroundColor: getWebVitalStatus(webhookData.technical.coreWebVitals.mobile.LCPs, { good: 2.5, poor: 4 }).color }}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium">CLS</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{webhookData.technical.coreWebVitals.mobile.CLS}</span>
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: getWebVitalStatus(webhookData.technical.coreWebVitals.mobile.CLS, { good: 0.1, poor: 0.25 }).color }}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium">INP</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{webhookData.technical.coreWebVitals.mobile.INP}ms</span>
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: getWebVitalStatus(webhookData.technical.coreWebVitals.mobile.INP, { good: 200, poor: 500 }).color }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Desktop */}
                <div>
                  <h4 className="font-medium text-slate-600 mb-4">Desktop</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium">LCP</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{webhookData.technical.coreWebVitals.desktop.LCPs}s</span>
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: getWebVitalStatus(webhookData.technical.coreWebVitals.desktop.LCPs, { good: 2.5, poor: 4 }).color }}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium">CLS</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{webhookData.technical.coreWebVitals.desktop.CLS}</span>
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: getWebVitalStatus(webhookData.technical.coreWebVitals.desktop.CLS, { good: 0.1, poor: 0.25 }).color }}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium">INP</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{webhookData.technical.coreWebVitals.desktop.INP}ms</span>
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: getWebVitalStatus(webhookData.technical.coreWebVitals.desktop.INP, { good: 200, poor: 500 }).color }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Mots-clés Top et Concurrents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top mots-clés */}
          {webhookData?.keywordStats?.nonBrandTop10FR && (
            <Card className="p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-700 mb-6 flex items-center gap-2">
                <Search className="h-5 w-5" />
                Top Mots-clés (Non-marque)
              </h3>
              <div className="space-y-3">
                {webhookData.keywordStats.nonBrandTop10FR.slice(0, 5).map((keyword: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{keyword.keyword}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-slate-500">Position {keyword.rank}</span>
                        <span className="text-xs text-slate-500">{keyword.volume} vol.</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {keyword.estimatedTraffic} visites
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Concurrents */}
          {webhookData?.competitors && (
            <Card className="p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-700 mb-6 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Analyse Concurrentielle
              </h3>
              <div className="space-y-3">
                {webhookData.competitors.slice(0, 4).map((competitor: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{competitor.domain}</p>
                      <p className="text-xs text-slate-500 mt-1">{competitor.positioning}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">DA {competitor.domainAuthority}</p>
                      <p className="text-xs text-slate-500">{competitor.trafficEst.toLocaleString()} visites</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Plan d'action 90 jours */}
        {webhookData?.actionPlan90Days && (
          <div className="mb-8">
            <Card className="p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-700 mb-6 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Plan d'Action 90 Jours
              </h3>
              <div className="space-y-4">
                {webhookData.actionPlan90Days.map((action: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-200 pl-4">
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(action.priority)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(action.priority)}`}>
                            {action.priority === 'high' ? 'Haute' : action.priority === 'medium' ? 'Moyenne' : 'Faible'}
                          </span>
                        </div>
                        <h4 className="font-medium text-slate-700 mb-1">{action.task}</h4>
                        <p className="text-sm text-slate-600 mb-2">{action.expectedImpact}</p>
                        <p className="text-xs text-slate-500">
                          <strong>KPI:</strong> {action.kpi}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Recommandations détaillées */}
        {webhookData?.recommendations && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Recommandations On-Page */}
            <Card className="p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-700 mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Optimisations On-Page
              </h3>
              <div className="space-y-3">
                {webhookData.recommendations.onPage?.map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">{rec}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recommandations techniques */}
            <Card className="p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-700 mb-6 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Optimisations Techniques
              </h3>
              <div className="space-y-3">
                {webhookData.recommendations.technical?.map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">{rec}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Aperçu technique */}
        {webhookData?.technical && (
          <Card className="p-6 bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-700 mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              État Technique
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Images */}
              <div className="text-center">
                <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Image className="h-8 w-8 text-blue-600" />
                </div>
                <p className="font-medium text-slate-700">{webhookData.technical.images?.count || 0} Images</p>
                <p className="text-sm text-slate-500">{webhookData.technical.images?.totalWeightMB || 0} MB</p>
                {webhookData.technical.images?.webpOrAvifRate && (
                  <Badge variant="outline" className="mt-2">
                    {Math.round(webhookData.technical.images.webpOrAvifRate * 100)}% WebP/AVIF
                  </Badge>
                )}
              </div>

              {/* Canonical */}
              <div className="text-center">
                <div className={`p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center ${
                  webhookData.technical.canonical?.present ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {webhookData.technical.canonical?.present ? 
                    <CheckCircle className="h-8 w-8 text-green-600" /> : 
                    <XCircle className="h-8 w-8 text-red-600" />
                  }
                </div>
                <p className="font-medium text-slate-700">Canonical</p>
                <p className="text-sm text-slate-500">
                  {webhookData.technical.canonical?.present ? 'Présent' : 'Manquant'}
                </p>
              </div>

              {/* Hreflang */}
              <div className="text-center">
                <div className={`p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center ${
                  webhookData.technical.hreflang?.present ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {webhookData.technical.hreflang?.present ? 
                    <CheckCircle className="h-8 w-8 text-green-600" /> : 
                    <XCircle className="h-8 w-8 text-red-600" />
                  }
                </div>
                <p className="font-medium text-slate-700">Hreflang</p>
                <p className="text-sm text-slate-500">
                  {webhookData.technical.hreflang?.present ? 'Configuré' : 'Manquant'}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}