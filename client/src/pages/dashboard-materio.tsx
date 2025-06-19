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

  // Récupération des sites web
  const { data: websites = [] } = useQuery({
    queryKey: ['/api/websites'],
  });

  // Récupération de l'analyse SEO
  const { data: seoAnalysis, isLoading, refetch } = useQuery({
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

  const selectedWebsite = websites.find((w: any) => w.id === selectedWebsiteId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
        <div className="px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 h-32"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/20 backdrop-blur-sm rounded-2xl h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!seoAnalysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
        <div className="px-6 py-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Aucune analyse disponible</h2>
            <p className="text-white/80">Cliquez sur "Actualiser l'analyse" pour générer une nouvelle analyse SEO.</p>
            <Button 
              onClick={() => refreshAnalysis.mutate()} 
              disabled={refreshAnalysis.isPending}
              className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      <div className="px-6 py-8 space-y-8">
        {/* En-tête avec félicitations */}
        <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-2xl">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Félicitations {selectedWebsite?.name || 'Site'} ! 🎉
                </h1>
                <p className="text-white/80 text-lg">
                  Meilleur vendeur du mois
                </p>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-white">{seoAnalysis.organicTraffic}</span>
                  <span className="text-white/80 ml-2">visiteurs/mois</span>
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
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-lg px-6"
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

        {/* Cartes de statistiques colorées */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Score SEO */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-2xl overflow-hidden relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="bg-white/20 p-3 rounded-xl">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  +12%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">Score SEO Global</p>
                <p className="text-3xl font-bold">{seoAnalysis.overallScore}</p>
                <div className="flex items-center text-sm text-white/80">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Tendance positive
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trafic Organique */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  +18%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">Trafic Organique</p>
                <p className="text-3xl font-bold">{seoAnalysis.organicTraffic}</p>
                <p className="text-white/80 text-sm">visiteurs/mois</p>
              </div>
            </CardContent>
          </Card>

          {/* Mots-clés */}
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Search className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  Stable
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">Mots-clés Classés</p>
                <p className="text-3xl font-bold">{seoAnalysis.keywordsRanking}</p>
                <p className="text-white/80 text-sm">positions suivies</p>
              </div>
            </CardContent>
          </Card>

          {/* Vitesse Page */}
          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0 shadow-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Zap className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  Bon
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">Vitesse Page</p>
                <p className="text-3xl font-bold">{seoAnalysis.pageSpeed}</p>
                <p className="text-white/80 text-sm">score PageSpeed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques et Recommandations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vue d'ensemble hebdomadaire */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <BarChart3 className="h-5 w-5" />
                Vue d'ensemble hebdomadaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Performance de vos ventes à 45%</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Mieux comparé au mois dernier
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-3" />
                </div>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                  DÉTAILS
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gain total */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Target className="h-5 w-5" />
                Gain total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-gray-800">€24,895</span>
                  <Badge className="bg-green-100 text-green-800 border-0">
                    +10%
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm">Comparé à €84,325 l'année dernière</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Zipcar</span>
                    </div>
                    <span className="font-semibold">€24,895.65</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Bitbank</span>
                    </div>
                    <span className="font-semibold">€8,650.20</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Aviato</span>
                    </div>
                    <span className="font-semibold">€1,245.80</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommandations SEO */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-gray-800">Recommandations prioritaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {seoAnalysis.recommendations?.slice(0, 3).map((rec: any, index: number) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg flex-shrink-0">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-1">{rec.title}</h4>
                    <p className="text-gray-600 text-sm">{rec.description}</p>
                    <Badge 
                      variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                      className="mt-2"
                    >
                      {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'} priorité
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}