import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Globe,
  Zap,
  Users,
  Search,
  Link
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

export default function Reports() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number>(1);

  const { data: websites, isLoading: websitesLoading } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
  });

  const { data: seoAnalysis, isLoading: analysisLoading } = useQuery<SeoAnalysis>({
    queryKey: ["/api/websites", selectedWebsiteId, "seo-analysis"],
    enabled: !!selectedWebsiteId,
  });

  useEffect(() => {
    if (websites && websites.length > 0 && !selectedWebsiteId) {
      setSelectedWebsiteId(websites[0].id);
    }
  }, [websites, selectedWebsiteId]);

  const selectedWebsite = websites?.find(w => w.id === selectedWebsiteId);

  if (websitesLoading || analysisLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          
          {/* En-tête du rapport avec animation */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-3">
                <Shimmer className="h-8 w-64 rounded-lg" />
                <Shimmer className="h-5 w-80 rounded" />
              </div>
              <div className="flex items-center space-x-3">
                <Shimmer className="h-8 w-28 rounded-lg" />
                <Shimmer className="h-8 w-32 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Résumé exécutif avec animation sophistiquée */}
          <Card className="mb-8 border-0 shadow-lg animate-pulse-glow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shimmer className="h-5 w-5 rounded" />
                <Shimmer className="h-6 w-40 rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="p-8 bg-slate-50 rounded-2xl text-center space-y-4">
                    <Shimmer className="h-16 w-16 rounded-2xl mx-auto" />
                    <Shimmer className="h-8 w-20 rounded mx-auto" />
                    <Shimmer className="h-6 w-32 rounded mx-auto" />
                    <Shimmer className="h-2 w-full rounded-full" />
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-float" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="p-4 bg-white rounded-xl shadow-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <Shimmer className="h-6 w-12 rounded" />
                            <Shimmer className="h-6 w-6 rounded" />
                          </div>
                          <Shimmer className="h-4 w-24 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Analyse technique avec shimmer avancé */}
            <Card className="border-0 shadow-lg animate-pulse-glow" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shimmer className="h-5 w-5 rounded" />
                  <Shimmer className="h-6 w-32 rounded" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-xl space-y-2">
                    <Shimmer className="h-6 w-8 rounded mx-auto" />
                    <Shimmer className="h-4 w-20 rounded mx-auto" />
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl space-y-2">
                    <Shimmer className="h-6 w-8 rounded mx-auto" />
                    <Shimmer className="h-4 w-16 rounded mx-auto" />
                  </div>
                </div>
                <TechnicalCheckShimmer />
              </CardContent>
            </Card>

            {/* Top mots-clés avec animation */}
            <Card className="border-0 shadow-lg animate-float" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shimmer className="h-5 w-5 rounded" />
                  <Shimmer className="h-6 w-28 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <KeywordShimmer count={5} />
              </CardContent>
            </Card>
          </div>

          {/* Plan d'action avec animation séquentielle */}
          <Card className="border-0 shadow-lg animate-pulse-glow" style={{ animationDelay: '0.6s' }}>
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

          {/* Conclusion avec animation élégante */}
          <Card className="mt-8 border-0 shadow-lg animate-float" style={{ animationDelay: '0.8s' }}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shimmer className="h-5 w-5 rounded" />
                <Shimmer className="h-6 w-56 rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Shimmer className="h-4 w-full rounded" />
                <Shimmer className="h-4 w-5/6 rounded" />
                <div className="bg-blue-50 p-6 rounded-xl space-y-3">
                  <Shimmer className="h-5 w-40 rounded" />
                  <Shimmer className="h-4 w-full rounded" />
                  <Shimmer className="h-4 w-4/5 rounded" />
                  <Shimmer className="h-4 w-3/5 rounded" />
                </div>
                <div className="bg-amber-50 p-6 rounded-xl space-y-3">
                  <Shimmer className="h-5 w-48 rounded" />
                  <Shimmer className="h-4 w-full rounded" />
                  <Shimmer className="h-4 w-5/6 rounded" />
                  <Shimmer className="h-4 w-2/3 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indicateur de génération de rapport */}
          <div className="fixed bottom-8 right-8">
            <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg animate-pulse-glow">
              <div className="relative">
                <div className="w-4 h-4 bg-purple-600 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-4 h-4 bg-purple-600 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-sm font-medium text-slate-700">Génération du rapport...</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (!seoAnalysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Aucun rapport disponible</h3>
          <p className="text-slate-500">Sélectionnez un site web pour générer son rapport SEO.</p>
        </Card>
      </div>
    );
  }

  const getScoreGrade = (score: number) => {
    if (score >= 80) return { grade: "A", color: "text-emerald-600", bg: "bg-emerald-50" };
    if (score >= 60) return { grade: "B", color: "text-amber-600", bg: "bg-amber-50" };
    if (score >= 40) return { grade: "C", color: "text-orange-600", bg: "bg-orange-50" };
    return { grade: "D", color: "text-red-600", bg: "bg-red-50" };
  };

  const scoreGrade = getScoreGrade(seoAnalysis.overallScore);

  const highPriorityRecommendations = seoAnalysis.recommendations?.filter(r => r.priority === 'high') || [];
  const mediumPriorityRecommendations = seoAnalysis.recommendations?.filter(r => r.priority === 'medium') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* En-tête du rapport */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Rapport SEO Complet
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {selectedWebsite?.name} - {new Date(seoAnalysis.analyzedAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
              <Badge variant="outline" className="px-3 py-1">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(seoAnalysis.analyzedAt).toLocaleDateString('fr-FR')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Résumé exécutif */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Résumé Exécutif</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Score global avec note */}
              <div className="lg:col-span-1">
                <div className={`p-8 rounded-2xl ${scoreGrade.bg} text-center`}>
                  <div className={`text-6xl font-bold ${scoreGrade.color} mb-2`}>
                    {scoreGrade.grade}
                  </div>
                  <div className="text-3xl font-bold text-slate-700 mb-2">
                    {seoAnalysis.overallScore}/100
                  </div>
                  <div className="text-sm text-slate-600">
                    Score SEO Global
                  </div>
                  <Progress value={seoAnalysis.overallScore} className="mt-4 h-2" />
                </div>
              </div>

              {/* Métriques clés */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{seoAnalysis.organicTraffic}</div>
                        <div className="text-sm text-slate-600">Trafic Organique/mois</div>
                      </div>
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{seoAnalysis.keywordsRanking}</div>
                        <div className="text-sm text-slate-600">Mots-clés Classés</div>
                      </div>
                      <Search className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{seoAnalysis.backlinks}</div>
                        <div className="text-sm text-slate-600">Backlinks</div>
                      </div>
                      <Link className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{seoAnalysis.pageSpeed}</div>
                        <div className="text-sm text-slate-600">Performance</div>
                      </div>
                      <Zap className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Analyse technique détaillée */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-emerald-600" />
                <span>Analyse Technique</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {Object.values(seoAnalysis.technicalSeo || {}).filter(Boolean).length}
                  </div>
                  <div className="text-sm text-slate-600">Tests Réussis</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {4 - Object.values(seoAnalysis.technicalSeo || {}).filter(Boolean).length}
                  </div>
                  <div className="text-sm text-slate-600">À Corriger</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <span className="text-sm font-medium">Compatible Mobile</span>
                  {seoAnalysis.technicalSeo?.mobileFriendly ? 
                    <CheckCircle className="h-5 w-5 text-emerald-600" /> :
                    <XCircle className="h-5 w-5 text-red-600" />
                  }
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <span className="text-sm font-medium">HTTPS Sécurisé</span>
                  {seoAnalysis.technicalSeo?.httpsSecure ? 
                    <CheckCircle className="h-5 w-5 text-emerald-600" /> :
                    <XCircle className="h-5 w-5 text-red-600" />
                  }
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <span className="text-sm font-medium">Sitemap XML</span>
                  {seoAnalysis.technicalSeo?.xmlSitemap ? 
                    <CheckCircle className="h-5 w-5 text-emerald-600" /> :
                    <XCircle className="h-5 w-5 text-red-600" />
                  }
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <span className="text-sm font-medium">Robots.txt</span>
                  {seoAnalysis.technicalSeo?.robotsTxt ? 
                    <CheckCircle className="h-5 w-5 text-emerald-600" /> :
                    <XCircle className="h-5 w-5 text-red-600" />
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top mots-clés */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Top Mots-clés</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seoAnalysis.keywords?.slice(0, 5).map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <div className="font-semibold text-slate-900">{keyword.keyword}</div>
                      <div className="text-sm text-slate-600">Volume: {keyword.volume}/mois</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="px-2 py-1">
                        #{keyword.position}
                      </Badge>
                      {keyword.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                      ) : keyword.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan d'action prioritaire */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <span>Plan d'Action Prioritaire</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              
              {/* Actions priorité haute */}
              {highPriorityRecommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-800 mb-4 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Actions Urgentes ({highPriorityRecommendations.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {highPriorityRecommendations.map((rec, index) => (
                      <div key={index} className="p-6 bg-red-50 rounded-xl border-l-4 border-l-red-500">
                        <h5 className="font-semibold text-slate-900 mb-2">{rec.title}</h5>
                        <p className="text-sm text-slate-600 mb-3">{rec.description}</p>
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          {rec.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions priorité moyenne */}
              {mediumPriorityRecommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-amber-800 mb-4 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Actions Recommandées ({mediumPriorityRecommendations.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mediumPriorityRecommendations.map((rec, index) => (
                      <div key={index} className="p-6 bg-amber-50 rounded-xl border-l-4 border-l-amber-500">
                        <h5 className="font-semibold text-slate-900 mb-2">{rec.title}</h5>
                        <p className="text-sm text-slate-600 mb-3">{rec.description}</p>
                        <Badge className="bg-amber-100 text-amber-800 text-xs">
                          {rec.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conclusion et prochaines étapes */}
        <Card className="mt-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Conclusions et Recommandations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-slate-700 mb-4">
                L'analyse SEO de <strong>{selectedWebsite?.name}</strong> révèle un score global de{" "}
                <strong>{seoAnalysis.overallScore}/100</strong>, classé en catégorie{" "}
                <strong>{scoreGrade.grade}</strong>.
              </p>
              
              <div className="bg-blue-50 p-6 rounded-xl mb-6">
                <h4 className="font-semibold text-blue-900 mb-3">Points Forts Identifiés</h4>
                <ul className="space-y-2 text-blue-800">
                  {seoAnalysis.technicalSeo?.httpsSecure && <li>• Site sécurisé avec HTTPS</li>}
                  {seoAnalysis.technicalSeo?.mobileFriendly && <li>• Compatible avec les appareils mobiles</li>}
                  {seoAnalysis.technicalSeo?.robotsTxt && <li>• Fichier robots.txt présent</li>}
                  {seoAnalysis.keywords && seoAnalysis.keywords.length > 0 && (
                    <li>• {seoAnalysis.keywords.length} mots-clés positionnés</li>
                  )}
                </ul>
              </div>

              <div className="bg-amber-50 p-6 rounded-xl">
                <h4 className="font-semibold text-amber-900 mb-3">Axes d'Amélioration Prioritaires</h4>
                <ul className="space-y-2 text-amber-800">
                  {!seoAnalysis.technicalSeo?.xmlSitemap && <li>• Implémentation d'un sitemap XML</li>}
                  {highPriorityRecommendations.length > 0 && (
                    <li>• {highPriorityRecommendations.length} actions urgentes à traiter</li>
                  )}
                  <li>• Optimisation des performances (score actuel: {seoAnalysis.pageSpeed}/100)</li>
                  <li>• Amélioration du contenu et de la structure</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}