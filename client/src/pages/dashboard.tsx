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

        {/* Vue d'ensemble détaillée */}
        <div className="soft-card p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 soft-metric-blue rounded-lg">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-700">Vue d'ensemble du site</h3>
              <p className="text-sm soft-text">Données extraites de l'analyse du 17 juin 2024</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white/50 rounded-lg border border-slate-100">
              <div className="text-xl font-semibold text-blue-600">200</div>
              <div className="text-xs soft-text">Statut HTTP</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg border border-slate-100">
              <div className="text-xl font-semibold text-green-600">2300</div>
              <div className="text-xs soft-text">Mots sur la page</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg border border-slate-100">
              <div className="text-xl font-semibold text-purple-600">18</div>
              <div className="text-xs soft-text">Images détectées</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg border border-slate-100">
              <div className="text-xl font-semibold text-orange-600">2.7 MB</div>
              <div className="text-xs soft-text">Poids total images</div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-slate-700 mb-2">Titre de la page :</div>
            <div className="text-sm soft-text mb-3">Plug2AI – Accélérez votre transformation Data & IA</div>
            <div className="text-sm font-medium text-slate-700 mb-2">Description Meta :</div>
            <div className="text-sm soft-text">Plug2AI accompagne votre transformation numérique grâce à l'IA, la Data Science et l'Automatisation. Conseil, développement et formation.</div>
          </div>
        </div>

        {/* Core Web Vitals détaillés */}
        <div className="soft-card p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 soft-metric-orange rounded-lg">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-700">Core Web Vitals</h3>
              <p className="text-sm soft-text">Métriques de performance utilisateur</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-slate-700 mb-4">📱 Mobile</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium soft-text">LCP (Largest Contentful Paint)</span>
                  <span className="text-sm font-semibold text-red-600">3.1s</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium soft-text">CLS (Cumulative Layout Shift)</span>
                  <span className="text-sm font-semibold text-amber-600">0.22</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium soft-text">INP (Interaction to Next Paint)</span>
                  <span className="text-sm font-semibold text-red-600">310ms</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-slate-700 mb-4">🖥️ Desktop</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium soft-text">LCP (Largest Contentful Paint)</span>
                  <span className="text-sm font-semibold text-emerald-600">1.9s</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium soft-text">CLS (Cumulative Layout Shift)</span>
                  <span className="text-sm font-semibold text-emerald-600">0.08</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium soft-text">INP (Interaction to Next Paint)</span>
                  <span className="text-sm font-semibold text-emerald-600">130ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analyse complète des mots-clés */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Mots-clés de marque */}
          <div className="soft-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 soft-metric-blue rounded-lg">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-700">Mots-clés de marque</h3>
                <p className="text-sm soft-text">Performance sur les termes de marque</p>
              </div>
            </div>
            
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-slate-700">plug2ai</div>
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                  1
                </div>
              </div>
              <div className="text-xs soft-text mb-2">Volume global : 30 • Volume FR : 15</div>
              <div className="text-xs soft-text mb-2">Difficulté : 2/100 • CPC : 0.00€</div>
              <div className="text-xs font-medium text-emerald-700">Part de trafic : 63%</div>
            </div>
          </div>

          {/* Mots-clés non-marque Top 10 */}
          <div className="soft-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 soft-metric-purple rounded-lg">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-700">Mots-clés Top 10 FR</h3>
                <p className="text-sm soft-text">Positionnement sur termes génériques</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 bg-white/50 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-slate-700">expert ia paris</div>
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                    8
                  </div>
                </div>
                <div className="text-xs soft-text">Volume : 20 • Difficulté : 21 • Trafic estimé : 2</div>
              </div>
              
              <div className="p-4 bg-white/50 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-slate-700">conseil data science</div>
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                    10
                  </div>
                </div>
                <div className="text-xs soft-text">Volume : 30 • Difficulté : 23 • Trafic estimé : 2</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mots-clés questions et concurrents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Mots-clés questions */}
          <div className="soft-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 soft-metric-green rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-700">Opportunités Questions</h3>
                <p className="text-sm soft-text">Mots-clés questions détectés</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 bg-white/50 rounded-lg border border-slate-100">
                <div className="font-medium text-slate-700 mb-1">comment déployer une stratégie ia</div>
                <div className="text-xs soft-text">Volume : 15 recherches/mois</div>
              </div>
              
              <div className="p-4 bg-white/50 rounded-lg border border-slate-100">
                <div className="font-medium text-slate-700 mb-1">qu'est-ce qu'une data factory</div>
                <div className="text-xs soft-text">Volume : 30 recherches/mois</div>
              </div>
            </div>
          </div>

          {/* Analyse concurrentielle */}
          <div className="soft-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 soft-metric-orange rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-700">Concurrents principaux</h3>
                <p className="text-sm soft-text">Analyse comparative du marché</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 bg-white/50 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-slate-700">datasulting.fr</div>
                  <div className="text-sm font-semibold text-blue-600">DA 33</div>
                </div>
                <div className="text-xs soft-text mb-1">Trafic estimé : 1,100 • Mots-clés communs : 7</div>
                <div className="text-xs text-slate-600">Positionnement : Conseil Data PME</div>
              </div>
              
              <div className="p-4 bg-white/50 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-slate-700">quantmetry.com</div>
                  <div className="text-sm font-semibold text-blue-600">DA 38</div>
                </div>
                <div className="text-xs soft-text mb-1">Trafic estimé : 4,000 • Mots-clés communs : 11</div>
                <div className="text-xs text-slate-600">Positionnement : IA/ML Grandes entreprises</div>
              </div>
              
              <div className="p-4 bg-white/50 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-slate-700">axionable.com</div>
                  <div className="text-sm font-semibold text-blue-600">DA 36</div>
                </div>
                <div className="text-xs soft-text mb-1">Trafic estimé : 1,600 • Mots-clés communs : 6</div>
                <div className="text-xs text-slate-600">Positionnement : Sustainable AI, Développement IA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Métriques de domaine et état technique */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Métriques de domaine */}
          <div className="soft-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 soft-metric-purple rounded-lg">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-700">Autorité du domaine</h3>
                <p className="text-sm soft-text">Métriques de référencement</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white/50 rounded-lg border border-slate-100">
                <div className="text-2xl font-semibold text-blue-600">11</div>
                <div className="text-xs soft-text">Domain Authority (Moz)</div>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-lg border border-slate-100">
                <div className="text-2xl font-semibold text-green-600">24</div>
                <div className="text-xs soft-text">Domaines référents</div>
              </div>
            </div>
          </div>

          {/* État technique détaillé */}
          <div className="soft-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 soft-metric-green rounded-lg">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-700">État Technique</h3>
                <p className="text-sm soft-text">Vérifications SEO avancées</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium soft-text">Balise canonique</span>
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium soft-text">Balises hreflang</span>
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium soft-text">Données structurées</span>
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium soft-text">Lazy loading images</span>
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium soft-text">Format WebP/AVIF</span>
                <span className="text-sm font-semibold text-amber-600">28%</span>
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