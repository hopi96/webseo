import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, BarChart3, Target, Users, TrendingUp, CheckCircle, AlertCircle, XCircle, Globe, Smartphone, Monitor, Search, Eye, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { WebsiteSelector } from "@/components/website/website-selector";
import { Shimmer, MetricShimmer, ScoreShimmer } from "@/components/ui/shimmer";

export default function DashboardComplete() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number>(1);
  const { toast } = useToast();

  // Requête pour récupérer les sites web
  const { data: websites = [] } = useQuery({
    queryKey: ['/api/websites'],
  });

  // Requête pour récupérer l'analyse SEO avec refetch automatique
  const { data: seoAnalysis, isLoading, refetch } = useQuery({
    queryKey: [`/api/websites/${selectedWebsiteId}/seo-analysis`],
    enabled: !!selectedWebsiteId,
    refetchInterval: 2000, // Refetch toutes les 2 secondes pour capter les nouvelles données
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Considérer les données comme périmées immédiatement
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

  // Mutation pour rafraîchir l'analyse
  const refreshAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/websites/${selectedWebsiteId}/refresh-analysis`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Invalider complètement le cache et forcer le refetch avec la bonne clé
      const cacheKey = [`/api/websites/${selectedWebsiteId}/seo-analysis`];
      queryClient.removeQueries({ queryKey: cacheKey });
      queryClient.invalidateQueries({ queryKey: cacheKey });
      
      // Attendre un peu puis forcer le refetch
      setTimeout(() => {
        refetch();
        // Force une seconde invalidation pour être sûr
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: cacheKey });
        }, 1000);
      }, 500);
      
      toast({
        title: "Analyse SEO terminée",
        description: `Le dashboard va se mettre à jour automatiquement avec les nouvelles données`,
      });
    },
    onError: (error: any) => {
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

  // Parse des données JSON du webhook si présentes
  const webhookData = (seoAnalysis as SeoAnalysisType)?.rawWebhookData ? 
    JSON.parse((seoAnalysis as SeoAnalysisType).rawWebhookData!) : null;

  // Fonction pour obtenir le statut d'un score
  const getScoreStatus = (score: number) => {
    if (score >= 80) return { color: '#10b981', label: 'Excellent', icon: CheckCircle };
    if (score >= 60) return { color: '#f59e0b', label: 'Correct', icon: AlertCircle };
    return { color: '#ef4444', label: 'À améliorer', icon: XCircle };
  };

  // Fonction pour obtenir la couleur de priorité
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen soft-background">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Shimmer className="h-8 w-64" />
              <Shimmer className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <MetricShimmer key={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Shimmer key={i} className="h-96" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!seoAnalysis) {
    return (
      <div className="min-h-screen soft-background">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Aucune analyse disponible</h2>
            <p className="text-gray-600">Cliquez sur "Actualiser l'analyse" pour générer une nouvelle analyse SEO.</p>
            <Button onClick={() => refreshAnalysisMutation.mutate()} disabled={refreshAnalysisMutation.isPending}>
              {refreshAnalysisMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualiser l'analyse
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen soft-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* En-tête avec sélecteur de site */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Tableau de bord SEO</h1>
            <p className="text-gray-600">
              Analyse complète de {selectedWebsite?.name || 'votre site'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <WebsiteSelector
              selectedWebsiteId={selectedWebsiteId}
              onWebsiteChange={setSelectedWebsiteId}
            />
            <Button 
              onClick={() => refreshAnalysisMutation.mutate()} 
              disabled={refreshAnalysisMutation.isPending}
              size="sm"
            >
              {refreshAnalysisMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualiser
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="soft-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Score SEO Global
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-800">
                  {webhookData?.seoScore || (seoAnalysis as SeoAnalysisType)?.overallScore || 0}
                </span>
                <Badge variant={getScoreStatus(webhookData?.seoScore || (seoAnalysis as SeoAnalysisType)?.overallScore || 0).label === 'Excellent' ? 'default' : 'secondary'}>
                  {getScoreStatus(webhookData?.seoScore || (seoAnalysis as SeoAnalysisType)?.overallScore || 0).label}
                </Badge>
              </div>
              <Progress 
                value={webhookData?.seoScore || (seoAnalysis as SeoAnalysisType)?.overallScore || 0} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card className="soft-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Trafic Organique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-800">
                  {webhookData?.organicTraffic || (seoAnalysis as SeoAnalysisType)?.organicTraffic || 0}
                </span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">visiteurs/mois</p>
            </CardContent>
          </Card>

          <Card className="soft-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Mots-clés Classés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-800">
                  {webhookData?.keywordAnalysis?.totalKeywords || (seoAnalysis as SeoAnalysisType)?.keywordsRanking || 0}
                </span>
                <Search className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">positions suivies</p>
            </CardContent>
          </Card>

          <Card className="soft-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Vitesse Page
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-800">
                  {webhookData?.coreWebVitals?.desktop?.overallScore || (seoAnalysis as SeoAnalysisType)?.pageSpeed || 0}
                </span>
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">score PageSpeed</p>
            </CardContent>
          </Card>
        </div>

        {/* Core Web Vitals détaillés */}
        {webhookData?.coreWebVitals && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="soft-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Core Web Vitals - Desktop
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {webhookData.coreWebVitals.desktop.lcp}s
                    </div>
                    <div className="text-xs text-gray-500">LCP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {webhookData.coreWebVitals.desktop.fid}ms
                    </div>
                    <div className="text-xs text-gray-500">FID</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {webhookData.coreWebVitals.desktop.cls}
                    </div>
                    <div className="text-xs text-gray-500">CLS</div>
                  </div>
                </div>
                <Progress value={webhookData.coreWebVitals.desktop.overallScore} />
              </CardContent>
            </Card>

            <Card className="soft-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Core Web Vitals - Mobile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {webhookData.coreWebVitals.mobile.lcp}s
                    </div>
                    <div className="text-xs text-gray-500">LCP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {webhookData.coreWebVitals.mobile.fid}ms
                    </div>
                    <div className="text-xs text-gray-500">FID</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {webhookData.coreWebVitals.mobile.cls}
                    </div>
                    <div className="text-xs text-gray-500">CLS</div>
                  </div>
                </div>
                <Progress value={webhookData.coreWebVitals.mobile.overallScore} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top mots-clés non-marque */}
        {webhookData?.keywordAnalysis?.topNonBrandKeywords && (
          <Card className="soft-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Top Mots-clés Non-Marque
              </CardTitle>
              <CardDescription>
                Mots-clés les plus performants hors marque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {webhookData.keywordAnalysis.topNonBrandKeywords.slice(0, 5).map((keyword: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{keyword.keyword}</div>
                      <div className="text-sm text-gray-500">Volume: {keyword.volume?.toLocaleString() || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-800">#{keyword.position}</div>
                      <Badge variant={keyword.position <= 3 ? 'default' : keyword.position <= 10 ? 'secondary' : 'outline'}>
                        Page {Math.ceil(keyword.position / 10)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analyse concurrentielle */}
        {webhookData?.competitorAnalysis && (
          <Card className="soft-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Analyse Concurrentielle
              </CardTitle>
              <CardDescription>
                Comparaison avec vos principaux concurrents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhookData.competitorAnalysis.slice(0, 3).map((competitor: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{competitor.domain}</div>
                      <div className="text-sm text-gray-500">
                        Trafic estimé: {competitor.traffic?.toLocaleString() || 'N/A'}/mois
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm">
                        <span className="text-gray-500">DA:</span>
                        <span className="font-bold ml-1">{competitor.domainAuthority}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Mots-clés:</span>
                        <span className="font-bold ml-1">{competitor.keywords?.toLocaleString() || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan d'action 90 jours */}
        {webhookData?.actionPlan90Days && (
          <Card className="soft-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Plan d'Action 90 Jours
              </CardTitle>
              <CardDescription>
                Tâches prioritaires pour améliorer votre SEO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhookData.actionPlan90Days.map((task: any, index: number) => (
                  <div key={index} className="p-4 bg-white/50 rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{task.task}</div>
                        <div className="text-sm text-gray-600 mt-1">{task.expectedImpact}</div>
                      </div>
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority === 'high' ? 'Haute' : 
                         task.priority === 'medium' ? 'Moyenne' : 'Faible'}
                      </Badge>
                    </div>
                    {task.kpi && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <strong>KPI:</strong> {task.kpi}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommandations détaillées */}
        {webhookData?.recommendations && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {webhookData.recommendations.onPage && (
              <Card className="soft-card">
                <CardHeader>
                  <CardTitle>Recommandations On-Page</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {webhookData.recommendations.onPage.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {webhookData.recommendations.technical && (
              <Card className="soft-card">
                <CardHeader>
                  <CardTitle>Recommandations Techniques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {webhookData.recommendations.technical.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* État technique détaillé */}
        {webhookData?.technicalAudit && (
          <Card className="soft-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                État Technique Détaillé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(webhookData.technicalAudit).map(([key, value]: [string, any]) => (
                  <div key={key} className="p-3 bg-white/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      {value === true ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : value === false ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <span className="text-xs text-gray-500">{String(value)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes et informations supplémentaires */}
        {webhookData?.notes && (
          <Card className="soft-card border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-blue-700">Notes de l'Analyse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{webhookData.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}