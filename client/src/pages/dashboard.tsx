import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Globe, 
  Search, 
  Link, 
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  BarChart3,
  Users,
  ArrowUpRight
} from "lucide-react";
import { 
  Shimmer, 
  MetricShimmer, 
  ScoreShimmer, 
  KeywordShimmer, 
  RecommendationShimmer, 
  TechnicalCheckShimmer 
} from "@/components/ui/shimmer";
import type { Website, SeoAnalysis } from "@shared/schema";

export default function Dashboard() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number>(1);

  const { data: websites, isLoading: websitesLoading } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
  });

  const { data: seoAnalysis, isLoading: analysisLoading } = useQuery<SeoAnalysis>({
    queryKey: [`/api/websites/${selectedWebsiteId}/seo-analysis`],
    enabled: !!selectedWebsiteId,
  });

  useEffect(() => {
    if (websites && websites.length > 0 && selectedWebsiteId === 1) {
      // Vérifier si le site Plug2AI existe, sinon prendre le premier
      const plug2aiSite = websites.find(w => w.id === 1);
      if (!plug2aiSite && websites[0]) {
        setSelectedWebsiteId(websites[0].id);
      }
    }
  }, [websites, selectedWebsiteId]);

  if (websitesLoading || analysisLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          
          {/* En-tête avec animation */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-3">
                <Shimmer className="h-8 w-48 rounded-lg" />
                <Shimmer className="h-5 w-64 rounded" />
              </div>
              <div className="flex items-center space-x-3">
                <Shimmer className="h-8 w-32 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Score principal avec animation shimmer */}
          <div className="mb-8">
            <ScoreShimmer className="animate-pulse-glow" />
          </div>

          {/* Métriques principales avec effet flottant */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-float" style={{ animationDelay: `${i * 0.2}s` }}>
                <MetricShimmer />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Section mots-clés avec shimmer avancé */}
            <Card className="lg:col-span-2 border-0 shadow-lg animate-pulse-glow">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <Shimmer className="h-5 w-5 rounded" />
                  <Shimmer className="h-6 w-40 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <KeywordShimmer count={5} />
              </CardContent>
            </Card>

            {/* État technique avec animation */}
            <Card className="border-0 shadow-lg animate-float" style={{ animationDelay: '0.5s' }}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shimmer className="h-5 w-5 rounded" />
                  <Shimmer className="h-6 w-32 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <TechnicalCheckShimmer />
              </CardContent>
            </Card>
          </div>

          {/* Recommandations avec effet de pulsation */}
          <Card className="mt-8 border-0 shadow-lg animate-pulse-glow" style={{ animationDelay: '0.8s' }}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shimmer className="h-5 w-5 rounded" />
                <Shimmer className="h-6 w-48 rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <RecommendationShimmer count={6} />
            </CardContent>
          </Card>

          {/* Indicateur de chargement élégant */}
          <div className="fixed bottom-8 right-8">
            <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg animate-pulse-glow">
              <div className="relative">
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-4 h-4 bg-blue-600 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-sm font-medium text-slate-700">Analyse en cours...</span>
            </div>
          </div>

        </div>
      </div>
    );
  }



  if (!seoAnalysis && !analysisLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-slate-500 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucune analyse SEO disponible</h3>
          <p className="text-slate-600 mb-4">Sélectionnez un site web pour voir son analyse SEO détaillée.</p>
        </Card>
      </div>
    );
  }

  // Vérifier que l'analyse existe avant de continuer
  if (!seoAnalysis) {
    return null; // Afficher le loading state
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50 border-emerald-200";
    if (score >= 60) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-slate-600" />;
    }
  };

  const selectedWebsite = websites?.find(w => w.id === selectedWebsiteId);

  return (
    <div className="min-h-screen gradient-mesh overflow-hidden relative">
      {/* Arrière-plan dynamique avec éléments morphing */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Élément morphing principal */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-500/30 animate-morph blur-3xl"></div>
        
        {/* Éléments flottants avec glow */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-r from-blue-600/25 to-purple-600/25 rounded-full blur-2xl animate-float animate-glow"></div>
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-to-l from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
        
        {/* Mesh gradient animé */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-gradient-x"></div>
        
        {/* Particules flottantes */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/60 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400/60 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-emerald-400/60 rounded-full animate-ping" style={{animationDelay: '2.5s'}}></div>
      </div>
      
      <div className="relative container mx-auto px-4 py-8 max-w-7xl">
        
        {/* En-tête ultra-moderne avec animations d'entrée */}
        <div className="mb-16 animate-slide-in-left">
          <div className="glass-morphism rounded-[2rem] p-10 shadow-2xl border border-white/20 relative overflow-hidden">
            {/* Éléments décoratifs internes */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-400/20 to-cyan-500/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
            
            <div className="relative flex items-center justify-between">
              <div className="space-y-6">
                <div className="flex items-center space-x-4 animate-scale-in">
                  <div className="relative">
                    <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-3xl shadow-2xl animate-glow">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <h1 className="text-5xl font-black text-gradient mb-2">
                      Tableau de bord SEO
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 text-xl font-medium">
                      Analyse complète de {selectedWebsite?.name || 'votre site web'}
                    </p>
                  </div>
                </div>
                
                {/* Indicateurs premium avec animations */}
                <div className="flex items-center space-x-8 animate-slide-in-left" style={{animationDelay: '0.3s'}}>
                  <div className="flex items-center space-x-3 px-4 py-2 bg-white/20 dark:bg-slate-700/30 rounded-full backdrop-blur-sm">
                    <div className="relative">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Données en temps réel</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 px-4 py-2 bg-white/20 dark:bg-slate-700/30 rounded-full backdrop-blur-sm">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Mis à jour: {seoAnalysis?.analyzedAt ? new Date(seoAnalysis.analyzedAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3 px-4 py-2 bg-white/20 dark:bg-slate-700/30 rounded-full backdrop-blur-sm">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {seoAnalysis.recommendations?.length || 0} optimisations détectées
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Score principal redesigné */}
              <div className="hidden lg:block animate-slide-in-right">
                <div className="relative p-8 glass-morphism rounded-3xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-3xl animate-pulse"></div>
                  <div className="relative text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1 animate-glow">
                        <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
                          <div className="text-3xl font-bold text-gradient">{seoAnalysis.overallScore}</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Score SEO Global</div>
                    <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2 mx-auto animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grille de métriques principales avec animations séquentielles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="animate-scale-in" style={{animationDelay: '0.1s'}}>
            <div className="group relative glass-morphism rounded-[1.5rem] p-6 hover:scale-105 transition-all duration-500 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-emerald-600 mb-1">{seoAnalysis.organicTraffic}</div>
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Visiteurs/mois</div>
                  <div className="text-xs text-emerald-600 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% ce mois
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="animate-scale-in" style={{animationDelay: '0.2s'}}>
            <div className="group relative glass-morphism rounded-[1.5rem] p-6 hover:scale-105 transition-all duration-500 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">{seoAnalysis.keywordsRanking}</div>
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Mots-clés suivis</div>
                  <div className="text-xs text-blue-600 mt-1 flex items-center">
                    <Target className="h-3 w-3 mr-1" />
                    5 en top 10
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow">
                  <Search className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="animate-scale-in" style={{animationDelay: '0.3s'}}>
            <div className="group relative glass-morphism rounded-[1.5rem] p-6 hover:scale-105 transition-all duration-500 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-1">{seoAnalysis.backlinks}</div>
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Backlinks actifs</div>
                  <div className="text-xs text-purple-600 mt-1 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    Qualité élevée
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow">
                  <Link className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="animate-scale-in" style={{animationDelay: '0.4s'}}>
            <div className="group relative glass-morphism rounded-[1.5rem] p-6 hover:scale-105 transition-all duration-500 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-amber-600 mb-1">{seoAnalysis.pageSpeed}</div>
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Performance</div>
                  <div className="text-xs text-amber-600 mt-1 flex items-center">
                    <Zap className="h-3 w-3 mr-1" />
                    Optimisable
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sections principales ultra-modernes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">
          
          {/* Section Mots-clés premium avec animations */}
          <div className="animate-slide-in-left">
            <div className="group relative glass-morphism rounded-[2rem] p-8 shadow-2xl border border-white/20 overflow-hidden hover:shadow-3xl transition-all duration-700">
              {/* Éléments décoratifs animés */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-400/30 to-teal-500/30 rounded-full blur-2xl animate-morph"></div>
              <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-gradient-to-tr from-blue-400/20 to-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="p-4 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-500 rounded-3xl shadow-2xl animate-glow">
                        <Search className="h-7 w-7 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gradient">Top Mots-clés</h3>
                      <p className="text-slate-600 dark:text-slate-300 font-medium">{seoAnalysis.keywordsRanking} positions suivies</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-emerald-600 font-semibold">Tendance</div>
                    <div className="text-lg font-bold text-emerald-600">+8%</div>
                  </div>
                </div>
                
                <div className="space-y-5">
                  {seoAnalysis.keywords?.slice(0, 4).map((keyword, index) => (
                    <div 
                      key={keyword.keyword} 
                      className="group/item flex items-center justify-between p-5 glass-morphism rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02]"
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                            {keyword.position}
                          </div>
                          {keyword.position <= 3 && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white text-lg">{keyword.keyword}</div>
                          <div className="text-xs text-slate-500 flex items-center space-x-2">
                            <span>{keyword.volume} recherches/mois</span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                            <span className="text-emerald-600">Compétitif</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${keyword.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : keyword.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                          {keyword.trend === 'up' ? 'Hausse' : keyword.trend === 'down' ? 'Baisse' : 'Stable'}
                        </div>
                        {keyword.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                        {keyword.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                        {keyword.trend === 'stable' && <Minus className="h-4 w-4 text-slate-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section Technique ultra-moderne */}
          <div className="animate-slide-in-right">
            <div className="group relative glass-morphism rounded-[2rem] p-8 shadow-2xl border border-white/20 overflow-hidden hover:shadow-3xl transition-all duration-700">
              {/* Éléments décoratifs dynamiques */}
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-gradient-to-br from-blue-400/30 to-indigo-500/30 rounded-full blur-2xl animate-morph" style={{animationDelay: '2s'}}></div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-500/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 rounded-3xl shadow-2xl animate-glow">
                        <Globe className="h-7 w-7 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gradient">État Technique</h3>
                      <p className="text-slate-600 dark:text-slate-300 font-medium">Vérifications SEO avancées</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-600 font-semibold">Conformité</div>
                    <div className="text-lg font-bold text-blue-600">85%</div>
                  </div>
                </div>
                
                {/* Métriques rapides */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="group/metric text-center p-5 glass-morphism rounded-2xl border border-white/10 hover:border-emerald-300/30 transition-all duration-300 hover:scale-105">
                    <div className="text-3xl font-bold text-emerald-600 mb-1">{seoAnalysis.organicTraffic}</div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Visiteurs mensuels</div>
                    <div className="w-full h-1 bg-emerald-200 rounded-full mt-2">
                      <div className="w-3/4 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="group/metric text-center p-5 glass-morphism rounded-2xl border border-white/10 hover:border-purple-300/30 transition-all duration-300 hover:scale-105">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{seoAnalysis.backlinks}</div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Liens entrants</div>
                    <div className="w-full h-1 bg-purple-200 rounded-full mt-2">
                      <div className="w-4/5 h-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Vérifications techniques */}
                <div className="space-y-4">
                  {[
                    { label: 'Optimisation Mobile', status: seoAnalysis.technicalSeo?.mobileFriendly, icon: CheckCircle, color: 'emerald' },
                    { label: 'Certificat HTTPS', status: seoAnalysis.technicalSeo?.httpsSecure, icon: CheckCircle, color: 'emerald' },
                    { label: 'Plan de site XML', status: seoAnalysis.technicalSeo?.xmlSitemap, icon: AlertTriangle, color: 'amber' },
                    { label: 'Fichier Robots.txt', status: seoAnalysis.technicalSeo?.robotsTxt, icon: CheckCircle, color: 'emerald' }
                  ].map((check, index) => (
                    <div 
                      key={check.label}
                      className="flex items-center justify-between p-4 glass-morphism rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]"
                      style={{animationDelay: `${index * 0.05}s`}}
                    >
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{check.label}</span>
                      <div className="flex items-center space-x-2">
                        {check.status ? (
                          <>
                            <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">Actif</span>
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          </>
                        ) : (
                          <>
                            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">À configurer</span>
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Recommandations Ultra-Moderne */}
        <div className="animate-scale-in">
          <div className="group relative glass-morphism rounded-[2rem] p-10 shadow-2xl border border-white/20 overflow-hidden">
            {/* Éléments décoratifs de fond */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-orange-400/30 via-red-500/20 to-pink-500/30 rounded-full blur-3xl animate-morph" style={{animationDelay: '1s'}}></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-amber-400/20 to-orange-500/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
            
            <div className="relative">
              {/* En-tête premium */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center space-x-5">
                  <div className="relative">
                    <div className="p-5 bg-gradient-to-br from-orange-500 via-red-600 to-pink-500 rounded-3xl shadow-2xl animate-glow">
                      <AlertTriangle className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-400 rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-gradient mb-2">Recommandations Prioritaires</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">Plan d'action pour optimiser votre référencement</p>
                  </div>
                </div>
                
                <div className="hidden lg:block text-right">
                  <div className="glass-morphism p-4 rounded-2xl">
                    <div className="text-sm text-orange-600 font-semibold mb-1">Impact potentiel</div>
                    <div className="text-2xl font-bold text-orange-600">+24 points</div>
                    <div className="text-xs text-slate-500 mt-1">Score SEO estimé</div>
                  </div>
                </div>
              </div>
              
              {/* Grille de recommandations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {seoAnalysis.recommendations?.map((rec, index) => (
                  <div 
                    key={rec.id}
                    className="group/rec relative glass-morphism rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl cursor-pointer"
                    style={{animationDelay: `${index * 0.15}s`}}
                  >
                    {/* Indicateur de priorité visuel */}
                    <div className={`absolute top-0 left-6 w-1 h-16 rounded-full ${
                      rec.priority === 'high' ? 'bg-gradient-to-b from-red-500 to-orange-500' : 
                      rec.priority === 'medium' ? 'bg-gradient-to-b from-amber-500 to-yellow-500' : 
                      'bg-gradient-to-b from-slate-400 to-slate-500'
                    }`}></div>
                    
                    <div className="ml-4">
                      {/* Tags et métadonnées */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Badge className={`px-3 py-1 font-semibold ${getPriorityColor(rec.priority)}`}>
                            {rec.priority === 'high' ? 'Critique' : rec.priority === 'medium' ? 'Important' : 'Mineur'}
                          </Badge>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                            {rec.category}
                          </span>
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover/rec:opacity-100 transition-all duration-300 group-hover/rec:scale-110">
                          <ArrowUpRight className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      
                      {/* Contenu principal */}
                      <h4 className="font-bold text-slate-800 dark:text-white text-xl mb-3 group-hover/rec:text-blue-600 transition-colors duration-300 leading-tight">
                        {rec.title}
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4 text-sm">
                        {rec.description}
                      </p>
                      
                      {/* Métadonnées du bas */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/20 dark:border-slate-600/20">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2 text-slate-500">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs font-medium">
                              {rec.priority === 'high' ? '1-2 semaines' : rec.priority === 'medium' ? '2-4 semaines' : '1-2 mois'}
                            </span>
                          </div>
                          <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                          <div className="flex items-center space-x-2 text-emerald-600">
                            <Target className="h-4 w-4" />
                            <span className="text-xs font-medium">
                              +{rec.priority === 'high' ? '8' : rec.priority === 'medium' ? '5' : '2'} pts
                            </span>
                          </div>
                        </div>
                        
                        {/* Indicateur de difficulté */}
                        <div className="flex items-center space-x-1">
                          {[...Array(rec.priority === 'high' ? 3 : rec.priority === 'medium' ? 2 : 1)].map((_, i) => (
                            <div key={i} className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" style={{animationDelay: `${i * 0.2}s`}}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Call-to-action section */}
              <div className="mt-10 text-center">
                <div className="inline-flex items-center space-x-3 px-6 py-3 glass-morphism rounded-full border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Prêt à améliorer votre SEO ? Commencez par les actions prioritaires
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}