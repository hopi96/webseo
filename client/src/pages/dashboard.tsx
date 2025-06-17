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
import type { Website, SeoAnalysis } from "@shared/schema";

export default function Dashboard() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number | undefined>();

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

  if (websitesLoading || analysisLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded-lg w-64"></div>
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!seoAnalysis || !seoAnalysis.technicalSeo) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* En-tête moderne */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Analyse SEO
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {selectedWebsite?.name || "Tableau de bord SEO"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="px-3 py-1">
                <Clock className="h-3 w-3 mr-1" />
                Dernière analyse: {new Date(seoAnalysis.analyzedAt).toLocaleDateString('fr-FR')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Score principal moderne */}
        <Card className={`mb-8 border-2 ${getScoreBgColor(seoAnalysis.overallScore)}`}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-4">
                  <div className={`text-5xl font-bold ${getScoreColor(seoAnalysis.overallScore)}`}>
                    {seoAnalysis.overallScore}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-700">Score SEO Global</div>
                    <div className="text-sm text-slate-500">
                      {seoAnalysis.overallScore >= 80 ? 'Excellent' : 
                       seoAnalysis.overallScore >= 60 ? 'Bon' : 'À améliorer'}
                    </div>
                  </div>
                </div>
                <Progress value={seoAnalysis.overallScore} className="mt-4 h-3" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-600">{seoAnalysis.pageSpeed}</div>
                <div className="text-sm text-slate-500">Vitesse Page</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métriques principales - Design épuré */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{seoAnalysis.organicTraffic}</div>
                  <div className="text-sm text-slate-600">Trafic Organique/mois</div>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{seoAnalysis.keywordsRanking}</div>
                  <div className="text-sm text-slate-600">Mots-clés Classés</div>
                </div>
                <Search className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{seoAnalysis.backlinks}</div>
                  <div className="text-sm text-slate-600">Backlinks</div>
                </div>
                <Link className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{seoAnalysis.pageSpeed}/100</div>
                  <div className="text-sm text-slate-600">Performance</div>
                </div>
                <Zap className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
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