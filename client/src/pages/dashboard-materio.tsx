import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, TrendingUp, Users, Search, Zap, Trophy, Target, BarChart3 } from "lucide-react";
import { WebsiteSelector } from "@/components/website/website-selector";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

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

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 py-8 space-y-8">
        {/* En-tête */}
        <div className="bg-blue-600 rounded-lg p-6 shadow-lg">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-700 p-3 rounded-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Tableau de bord SEO - {selectedWebsite?.name || 'Site'}
                </h1>
                <p className="text-blue-100 text-base">
                  Analyse complète de performance
                </p>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-white">{seoAnalysis?.organicTraffic || 0}</span>
                  <span className="text-blue-100 ml-2">visiteurs/mois</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <WebsiteSelector
                selectedWebsiteId={selectedWebsiteId}
                onWebsiteChange={setSelectedWebsiteId}
              />
              <Button 
                onClick={() => refreshAnalysis.mutate()} 
                disabled={refreshAnalysis.isPending}
                className="bg-blue-700 hover:bg-blue-800 text-white border-0 px-4"
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
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Score SEO */}
          <Card className="bg-purple-500 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="bg-purple-600 p-2 rounded">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <Badge className="bg-purple-600 text-white border-0">
                  +12%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-purple-100 text-sm">Score SEO Global</p>
                <p className="text-2xl font-bold">{seoAnalysis?.overallScore || 0}</p>
                <div className="flex items-center text-sm text-purple-100">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  En hausse
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trafic Organique */}
          <Card className="bg-green-500 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="bg-green-600 p-2 rounded">
                  <Users className="h-5 w-5" />
                </div>
                <Badge className="bg-green-600 text-white border-0">
                  +18%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-green-100 text-sm">Trafic Organique</p>
                <p className="text-2xl font-bold">{seoAnalysis?.organicTraffic || 0}</p>
                <p className="text-green-100 text-sm">visiteurs/mois</p>
              </div>
            </CardContent>
          </Card>

          {/* Mots-clés */}
          <Card className="bg-orange-500 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="bg-orange-600 p-2 rounded">
                  <Search className="h-5 w-5" />
                </div>
                <Badge className="bg-orange-600 text-white border-0">
                  Stable
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-orange-100 text-sm">Mots-clés Classés</p>
                <p className="text-2xl font-bold">{seoAnalysis?.keywordsRanking || 0}</p>
                <p className="text-orange-100 text-sm">positions suivies</p>
              </div>
            </CardContent>
          </Card>

          {/* Vitesse Page */}
          <Card className="bg-blue-500 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="bg-blue-600 p-2 rounded">
                  <Zap className="h-5 w-5" />
                </div>
                <Badge className="bg-blue-600 text-white border-0">
                  Bon
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-blue-100 text-sm">Vitesse Page</p>
                <p className="text-2xl font-bold">{seoAnalysis?.pageSpeed || 0}</p>
                <p className="text-blue-100 text-sm">score PageSpeed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance générale */}
          <Card className="bg-white border border-gray-300 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                Performance SEO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Score global</span>
                  <Badge className="bg-gray-100 text-gray-800">
                    {seoAnalysis?.overallScore || 0}/100
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Progress value={seoAnalysis?.overallScore || 0} className="h-2" />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Voir les détails
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Métriques clés */}
          <Card className="bg-white border border-gray-300 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <Target className="h-5 w-5 text-gray-600" />
                Métriques principales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Trafic organique</span>
                  <span className="font-semibold text-gray-800">{seoAnalysis?.organicTraffic || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Mots-clés positionnés</span>
                  <span className="font-semibold text-gray-800">{seoAnalysis?.keywordsRanking || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Score PageSpeed</span>
                  <span className="font-semibold text-gray-800">{seoAnalysis?.pageSpeed || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Backlinks</span>
                  <span className="font-semibold text-gray-800">{seoAnalysis?.backlinks || 0}</span>
                </div>
              </div>  
            </CardContent>
          </Card>
        </div>

        {/* Recommandations SEO */}
        <Card className="bg-white border border-gray-300 shadow-md">
          <CardHeader>
            <CardTitle className="text-gray-700">Recommandations prioritaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {seoAnalysis?.recommendations?.slice(0, 3).map((rec: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
                  <div className="bg-blue-600 p-2 rounded flex-shrink-0">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 mb-1">{rec.title}</h4>
                    <p className="text-gray-600 text-sm mb-2">{rec.description}</p>
                    <Badge 
                      className={`text-xs ${
                        rec.priority === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : rec.priority === 'medium' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'} priorité
                    </Badge>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  Aucune recommandation disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}