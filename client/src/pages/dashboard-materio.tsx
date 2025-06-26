import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, TrendingUp, Users, Search, Zap, Trophy, Target, BarChart3, Home, FileText, Settings, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WebsiteSelector } from "@/components/website/website-selector";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

export default function DashboardMaterio() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number>(1);
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

  // Récupération de l'analyse SEO
  const { data: seoAnalysis, isLoading, refetch } = useQuery<SeoAnalysisType>({
    queryKey: [`/api/websites/${selectedWebsiteId}/seo-analysis`],
    enabled: !!selectedWebsiteId,
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Mutation pour actualiser l'analyse
  const refreshAnalysis = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/websites/${selectedWebsiteId}/refresh-analysis`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      const cacheKey = [`/api/websites/${selectedWebsiteId}/seo-analysis`];
      queryClient.removeQueries({ queryKey: cacheKey });
      queryClient.invalidateQueries({ queryKey: cacheKey });
      
      setTimeout(() => {
        refetch();
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: cacheKey });
        }, 1000);
      }, 500);
      
      toast({
        title: "Analyse SEO terminée",
        description: "Le dashboard va se mettre à jour automatiquement avec les nouvelles données",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      let parsedError;
      try {
        parsedError = JSON.parse(errorMessage);
      } catch {
        parsedError = { message: errorMessage };
      }
      
      toast({
        title: "Erreur lors de l'analyse",
        description: parsedError.message || errorMessage,
        variant: "destructive",
      });
    },
  });

  const selectedWebsite = websites.find((w: WebsiteType) => w.id === selectedWebsiteId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="bg-gray-200 rounded-3xl p-6 h-32"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-2xl h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!seoAnalysis) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-6 py-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Aucune analyse disponible</h2>
            <p className="text-gray-600">Cliquez sur "Actualiser l'analyse" pour générer une nouvelle analyse SEO.</p>
            <Button 
              onClick={() => refreshAnalysis.mutate()} 
              disabled={refreshAnalysis.isPending}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              {refreshAnalysis.isPending ? (
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

  // Préparation des données pour les graphiques
  const trafficData = seoAnalysis?.trafficData || [];
  const keywordsData = seoAnalysis?.keywords?.slice(0, 5).map(k => ({
    name: k.keyword,
    position: k.position,
    volume: k.volume
  })) || [];
  
  const technicalData = [
    { name: 'Mobile-Friendly', value: seoAnalysis?.technicalSeo?.mobileFriendly ? 100 : 0, color: '#10b981' },
    { name: 'HTTPS Secure', value: seoAnalysis?.technicalSeo?.httpsSecure ? 100 : 0, color: '#3b82f6' },
    { name: 'XML Sitemap', value: seoAnalysis?.technicalSeo?.xmlSitemap ? 100 : 0, color: '#8b5cf6' },
    { name: 'Robots.txt', value: seoAnalysis?.technicalSeo?.robotsTxt ? 100 : 0, color: '#f59e0b' }
  ];

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Barre de navigation supérieure */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">SEO Dashboard</h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tableau de bord principal affichant les métriques SEO et performances de votre site web</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex space-x-6">
              <Link href="/" className="flex items-center space-x-2 text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-400 px-3 py-2 rounded-md">
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link href="/keywords" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md">
                <Search className="h-4 w-4" />
                <span>Mots-clés</span>
              </Link>
              <Link href="/reports" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md">
                <FileText className="h-4 w-4" />
                <span>Rapports</span>
              </Link>
              <Link href="/settings" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md">
                <Settings className="h-4 w-4" />
                <span>Paramètres</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <WebsiteSelector
              selectedWebsiteId={selectedWebsiteId}
              onWebsiteChange={setSelectedWebsiteId}
            />
            <Button 
              onClick={() => refreshAnalysis.mutate()} 
              disabled={refreshAnalysis.isPending}
              variant="outline"
              size="sm"
            >
              {refreshAnalysis.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Actualiser
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
      </nav>

      <div className="px-6 py-6 space-y-6">
        {/* En-tête simplifié */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {selectedWebsite?.name || 'Site web'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Dernière analyse: {seoAnalysis?.analyzedAt ? new Date(seoAnalysis.analyzedAt).toLocaleDateString('fr-FR') : 'N/A'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{seoAnalysis?.overallScore || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Score SEO global</div>
              </div>
              <Button 
                onClick={() => refreshAnalysis.mutate()} 
                disabled={refreshAnalysis.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {refreshAnalysis.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualiser l'analyse SEO
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Métriques principales simplifiées */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{seoAnalysis?.organicTraffic || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Trafic organique</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <Search className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{seoAnalysis?.keywordsRanking || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Mots-clés</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <Zap className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{seoAnalysis?.pageSpeed || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">PageSpeed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <Target className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">{seoAnalysis?.backlinks || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Backlinks</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques basés sur les données JSON du webhook */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique de trafic dans le temps */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-700 dark:text-gray-300">Évolution du trafic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <RechartsTooltip />
                    <Line 
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Positions des mots-clés */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-700 dark:text-gray-300">Top 5 mots-clés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={keywordsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <RechartsTooltip />
                    <Bar 
                      dataKey="position" 
                      fill="#6b7280"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit technique et recommandations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audit technique avec explications */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-700 dark:text-gray-300">Audit technique SEO</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Vérifications techniques essentielles pour le référencement
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {technicalData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {item.name === 'Mobile-Friendly' && 'Site optimisé pour mobile'}
                          {item.name === 'HTTPS Secure' && 'Connexion sécurisée SSL'}
                          {item.name === 'XML Sitemap' && 'Plan du site pour moteurs de recherche'}
                          {item.name === 'Robots.txt' && 'Instructions pour les robots d\'indexation'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.value === 100 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' 
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                      }`}>
                        {item.value === 100 ? '✓ Conforme' : '✗ À corriger'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommandations simplifiées */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-700 dark:text-gray-300">Recommandations prioritaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {seoAnalysis?.recommendations?.slice(0, 4).map((rec: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{rec.title}</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">{rec.description}</p>
                      </div>
                      <Badge 
                        variant="outline"
                        className={`ml-2 text-xs ${
                          rec.priority === 'high' 
                            ? 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' 
                            : rec.priority === 'medium' 
                            ? 'border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300' 
                            : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </Badge>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Aucune recommandation disponible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
    </TooltipProvider>
  );
}