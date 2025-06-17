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
  Users
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-sky-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
      
      <div className="relative container mx-auto px-4 py-8 max-w-7xl">
        
        {/* En-tête moderne avec glassmorphism */}
        <div className="mb-12">
          <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 rounded-3xl border border-white/20 dark:border-slate-700/20 p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                      Tableau de bord SEO
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                      Analyse complète de {selectedWebsite?.name || 'votre site web'}
                    </p>
                  </div>
                </div>
                
                {/* Indicateurs de statut en temps réel */}
                <div className="flex items-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Analyse active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Dernière mise à jour: {seoAnalysis?.analyzedAt ? new Date(seoAnalysis.analyzedAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">{seoAnalysis.overallScore}/100</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">Score global</div>
                    <div className="w-16 h-2 bg-slate-200 dark:bg-slate-600 rounded-full mt-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000"
                        style={{ width: `${seoAnalysis.overallScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Score principal avec design premium */}
        <div className="mb-12">
          <div className="backdrop-blur-xl bg-gradient-to-r from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-800/20 rounded-3xl border border-white/30 dark:border-slate-700/30 p-8 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              
              {/* Score principal */}
              <div className="lg:col-span-1 text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
                  <Target className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Score SEO Global</h3>
                <div className="flex items-center justify-center lg:justify-start space-x-2">
                  <div className={`text-6xl font-bold ${getScoreColor(seoAnalysis.overallScore)}`}>
                    {seoAnalysis.overallScore}
                  </div>
                  <div className="text-slate-500 text-2xl">/100</div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-3">
                    <div 
                      className="h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: `${seoAnalysis.overallScore}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {seoAnalysis.overallScore >= 80 ? 'Excellent' : seoAnalysis.overallScore >= 60 ? 'Bon' : 'À améliorer'}
                  </p>
                </div>
              </div>

              {/* Métriques détaillées */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white/50 dark:bg-slate-700/50 rounded-2xl border border-white/20 dark:border-slate-600/20 backdrop-blur-sm">
                    <div className="text-2xl font-bold text-emerald-600">{seoAnalysis.organicTraffic}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Trafic/mois</div>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-slate-700/50 rounded-2xl border border-white/20 dark:border-slate-600/20 backdrop-blur-sm">
                    <div className="text-2xl font-bold text-blue-600">{seoAnalysis.keywordsRanking}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Mots-clés</div>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-slate-700/50 rounded-2xl border border-white/20 dark:border-slate-600/20 backdrop-blur-sm">
                    <div className="text-2xl font-bold text-purple-600">{seoAnalysis.backlinks}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Backlinks</div>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-slate-700/50 rounded-2xl border border-white/20 dark:border-slate-600/20 backdrop-blur-sm">
                    <div className="text-2xl font-bold text-amber-600">{seoAnalysis.pageSpeed}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Vitesse</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grille de sections principales avec glassmorphism */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Section Mots-clés avec design premium */}
          <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 rounded-3xl border border-white/20 dark:border-slate-700/20 p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Top Mots-clés</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{seoAnalysis.keywordsRanking} positions suivies</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {seoAnalysis.keywords?.slice(0, 4).map((keyword, index) => (
                <div key={keyword.keyword} className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-700/50 rounded-2xl border border-white/20 dark:border-slate-600/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      {keyword.position}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 dark:text-white">{keyword.keyword}</div>
                      <div className="text-xs text-slate-500">{keyword.volume} recherches/mois</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {keyword.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                    {keyword.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {keyword.trend === 'stable' && <Minus className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section Technique avec glassmorphism */}
          <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 rounded-3xl border border-white/20 dark:border-slate-700/20 p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">État Technique</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Vérifications SEO</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-white/50 dark:bg-slate-700/50 rounded-2xl border border-white/20 dark:border-slate-600/20">
                <div className="text-3xl font-bold text-emerald-600">{seoAnalysis.organicTraffic}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Visiteurs/mois</div>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-slate-700/50 rounded-2xl border border-white/20 dark:border-slate-600/20">
                <div className="text-3xl font-bold text-purple-600">{seoAnalysis.backlinks}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Backlinks</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mobile-friendly</span>
                {seoAnalysis.technicalSeo?.mobileFriendly ? 
                  <CheckCircle className="h-5 w-5 text-emerald-500" /> : 
                  <XCircle className="h-5 w-5 text-red-500" />
                }
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">HTTPS sécurisé</span>
                {seoAnalysis.technicalSeo?.httpsSecure ? 
                  <CheckCircle className="h-5 w-5 text-emerald-500" /> : 
                  <XCircle className="h-5 w-5 text-red-500" />
                }
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sitemap XML</span>
                {seoAnalysis.technicalSeo?.xmlSitemap ? 
                  <CheckCircle className="h-5 w-5 text-emerald-500" /> : 
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                }
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Robots.txt</span>
                {seoAnalysis.technicalSeo?.robotsTxt ? 
                  <CheckCircle className="h-5 w-5 text-emerald-500" /> : 
                  <XCircle className="h-5 w-5 text-red-500" />
                }
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Mots-clés - Design moderne */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Mots-clés Performants</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seoAnalysis.keywords?.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{keyword.keyword}</div>
                      <div className="text-sm text-slate-600">
                        Volume: {keyword.volume}/mois
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="px-2 py-1">
                        #{keyword.position}
                      </Badge>
                      {getTrendIcon(keyword.trend)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* État technique */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-emerald-600" />
                <span>État Technique</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Compatible Mobile</span>
                {seoAnalysis.technicalSeo?.mobileFriendly ? 
                  <CheckCircle className="h-5 w-5 text-emerald-600" /> :
                  <XCircle className="h-5 w-5 text-red-600" />
                }
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">HTTPS Sécurisé</span>
                {seoAnalysis.technicalSeo?.httpsSecure ? 
                  <CheckCircle className="h-5 w-5 text-emerald-600" /> :
                  <XCircle className="h-5 w-5 text-red-600" />
                }
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sitemap XML</span>
                {seoAnalysis.technicalSeo?.xmlSitemap ? 
                  <CheckCircle className="h-5 w-5 text-emerald-600" /> :
                  <XCircle className="h-5 w-5 text-red-600" />
                }
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Robots.txt</span>
                {seoAnalysis.technicalSeo?.robotsTxt ? 
                  <CheckCircle className="h-5 w-5 text-emerald-600" /> :
                  <XCircle className="h-5 w-5 text-red-600" />
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommandations prioritaires */}
        <Card className="mt-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span>Recommandations Prioritaires</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {seoAnalysis.recommendations?.map((rec, index) => (
                <div key={index} className="p-6 bg-slate-50 rounded-xl border-l-4 border-l-blue-500">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-slate-900 flex-1">{rec.title}</h4>
                    <Badge className={`ml-2 ${getPriorityColor(rec.priority)}`}>
                      {rec.priority === 'high' ? 'Haute' : 
                       rec.priority === 'medium' ? 'Moyenne' : 'Faible'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{rec.description}</p>
                  <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded">
                    {rec.category}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation mobile en bas */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-slate-200 px-4 py-2">
          <div className="flex justify-around">
            <Button variant="ghost" size="sm" className="flex-1">
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="flex-1">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="flex-1">
              <Target className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="flex-1">
              <Globe className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}