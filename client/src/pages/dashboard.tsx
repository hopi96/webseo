import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Search, 
  Target, 
  Globe, 
  Users,
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Zap,
  Link
} from "lucide-react";
import { WebsiteSelector } from "@/components/website/website-selector";
import { useState } from "react";
import type { Website, SeoAnalysis } from "@shared/schema";

export default function Dashboard() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number>(1);

  const { data: websites = [] } = useQuery<Website[]>({
    queryKey: ['/api/websites'],
  });

  const { data: seoAnalysis, isLoading } = useQuery<SeoAnalysis>({
    queryKey: ['/api/websites', selectedWebsiteId, 'seo-analysis'],
    enabled: !!selectedWebsiteId,
  });

  const selectedWebsite = websites.find(w => w.id === selectedWebsiteId);

  if (isLoading || !seoAnalysis) {
    return (
      <div className="min-h-screen soft-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="soft-text">Chargement de votre analyse SEO...</p>
        </div>
      </div>
    );
  }

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-500';
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  function getTrendIcon(trend: string) {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-slate-400" />;
    }
  }

  return (
    <div className="min-h-screen soft-background">
      <div className="relative container mx-auto px-6 py-8 max-w-6xl">
        
        {/* En-tête doux et apaisant */}
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
                      Tableau de bord SEO
                    </h1>
                    <p className="soft-text text-lg">
                      Analyse de {selectedWebsite?.name || 'votre site web'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm soft-text">Données actualisées</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm soft-text">
                      {seoAnalysis?.analyzedAt ? new Date(seoAnalysis.analyzedAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="text-center soft-card p-6">
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(seoAnalysis.overallScore)}`}>
                    {seoAnalysis.overallScore}
                  </div>
                  <div className="text-sm soft-text mb-3">Score SEO Global</div>
                  <div className="w-16 h-2 bg-slate-200 rounded-full">
                    <div 
                      className="h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${seoAnalysis.overallScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="soft-card p-6 gentle-hover">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold text-emerald-600 mb-1">
                  {seoAnalysis.organicTraffic}
                </div>
                <div className="text-sm soft-text">Visiteurs/mois</div>
              </div>
              <div className="p-3 soft-metric-green rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="soft-card p-6 gentle-hover">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold text-blue-600 mb-1">
                  {seoAnalysis.keywordsRanking}
                </div>
                <div className="text-sm soft-text">Mots-clés suivis</div>
              </div>
              <div className="p-3 soft-metric-blue rounded-lg">
                <Search className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="soft-card p-6 gentle-hover">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold text-purple-600 mb-1">
                  {seoAnalysis.backlinks}
                </div>
                <div className="text-sm soft-text">Liens entrants</div>
              </div>
              <div className="p-3 soft-metric-purple rounded-lg">
                <Link className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="soft-card p-6 gentle-hover">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold text-orange-600 mb-1">
                  {seoAnalysis.pageSpeed}
                </div>
                <div className="text-sm soft-text">Performance</div>
              </div>
              <div className="p-3 soft-metric-orange rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Sections principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Mots-clés */}
          <div className="soft-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 soft-metric-blue rounded-lg">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-700">Top Mots-clés</h3>
                <p className="text-sm soft-text">{seoAnalysis.keywordsRanking} positions suivies</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {seoAnalysis.keywords?.slice(0, 4).map((keyword, index) => (
                <div key={keyword.keyword} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                      {keyword.position}
                    </div>
                    <div>
                      <div className="font-medium text-slate-700">{keyword.keyword}</div>
                      <div className="text-xs soft-text">{keyword.volume} recherches/mois</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(keyword.trend)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* État technique */}
          <div className="soft-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 soft-metric-green rounded-lg">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-700">État Technique</h3>
                <p className="text-sm soft-text">Vérifications SEO</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-white/50 rounded-lg border border-slate-100">
                <div className="text-2xl font-semibold text-emerald-600">{seoAnalysis.organicTraffic}</div>
                <div className="text-xs soft-text">Visiteurs/mois</div>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-lg border border-slate-100">
                <div className="text-2xl font-semibold text-purple-600">{seoAnalysis.backlinks}</div>
                <div className="text-xs soft-text">Backlinks</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium soft-text">Optimisation Mobile</span>
                {seoAnalysis.technicalSeo?.mobileFriendly ? 
                  <CheckCircle className="h-5 w-5 text-emerald-500" /> : 
                  <XCircle className="h-5 w-5 text-red-500" />
                }
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium soft-text">HTTPS sécurisé</span>
                {seoAnalysis.technicalSeo?.httpsSecure ? 
                  <CheckCircle className="h-5 w-5 text-emerald-500" /> : 
                  <XCircle className="h-5 w-5 text-red-500" />
                }
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium soft-text">Sitemap XML</span>
                {seoAnalysis.technicalSeo?.xmlSitemap ? 
                  <CheckCircle className="h-5 w-5 text-emerald-500" /> : 
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                }
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium soft-text">Robots.txt</span>
                {seoAnalysis.technicalSeo?.robotsTxt ? 
                  <CheckCircle className="h-5 w-5 text-emerald-500" /> : 
                  <XCircle className="h-5 w-5 text-red-500" />
                }
              </div>
            </div>
          </div>
        </div>

        {/* Recommandations */}
        <div className="soft-card p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 soft-metric-orange rounded-lg">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-slate-700">Recommandations</h3>
              <p className="soft-text">Actions pour améliorer votre SEO</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {seoAnalysis.recommendations?.map((rec, index) => (
              <div key={rec.id} className="p-6 bg-white/50 rounded-lg border border-slate-100 gentle-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={`px-3 py-1 ${getPriorityColor(rec.priority)}`}>
                        {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Faible'}
                      </Badge>
                      <span className="text-xs soft-text uppercase tracking-wide">
                        {rec.category}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-700 text-lg mb-2">
                      {rec.title}
                    </h4>
                    <p className="text-sm soft-text leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-xs soft-text">
                      {rec.priority === 'high' ? '1-2 semaines' : rec.priority === 'medium' ? '2-4 semaines' : '1-2 mois'}
                    </span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}