import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Link,
  PieChart,
  Activity,
  RefreshCw
} from "lucide-react";
import { WebsiteSelector } from "@/components/website/website-selector";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Website, SeoAnalysis } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, RadialBarChart, RadialBar, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number>(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: websites = [] } = useQuery<Website[]>({
    queryKey: ['/api/websites'],
  });

  const { data: seoAnalysis, isLoading } = useQuery<SeoAnalysis>({
    queryKey: ['/api/websites', selectedWebsiteId, 'seo-analysis'],
    enabled: !!selectedWebsiteId,
  });

  // Mutation pour rafraîchir l'analyse SEO avec le webhook
  const refreshAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/websites/${selectedWebsiteId}/refresh-analysis`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/websites', selectedWebsiteId, 'seo-analysis'] });
      toast({
        title: "Analyse SEO mise à jour",
        description: "L'analyse SEO a été actualisée avec les dernières données.",
      });
    },
    onError: (error: any) => {
      // Gestion spécifique pour l'erreur webhook n8n
      if (error.message && error.message.includes('Webhook n8n non activé')) {
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

  const selectedWebsite = websites.find(w => w.id === selectedWebsiteId);

  // Données pour les graphiques basées sur le JSON réel
  const performanceData = [
    { name: 'LCP Mobile', value: 3.1, target: 2.5, status: 'danger' },
    { name: 'LCP Desktop', value: 1.9, target: 2.5, status: 'good' },
    { name: 'CLS Mobile', value: 0.22, target: 0.1, status: 'warning' },
    { name: 'CLS Desktop', value: 0.08, target: 0.1, status: 'good' },
    { name: 'INP Mobile', value: 310, target: 200, status: 'danger' },
    { name: 'INP Desktop', value: 130, target: 200, status: 'good' }
  ];

  const keywordDistribution = [
    { name: 'Marque', value: 63, color: '#10b981' },
    { name: 'Générique', value: 37, color: '#f59e0b' }
  ];

  const competitorData = [
    { name: 'Plug2AI', da: 11, traffic: 30 },
    { name: 'Datasulting', da: 33, traffic: 1100 },
    { name: 'Quantmetry', da: 38, traffic: 4000 },
    { name: 'Axionable', da: 36, traffic: 1600 }
  ];

  const technicalScores = [
    { category: 'Performance', score: 65, maxScore: 100 },
    { category: 'SEO', score: 76, maxScore: 100 },
    { category: 'Accessibilité', score: 85, maxScore: 100 },
    { category: 'Bonnes pratiques', score: 80, maxScore: 100 }
  ];

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
              
              <div className="flex flex-col items-end space-y-4">
                <Button
                  onClick={() => refreshAnalysisMutation.mutate()}
                  disabled={refreshAnalysisMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 soft-button"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshAnalysisMutation.isPending ? 'animate-spin' : ''}`} />
                  {refreshAnalysisMutation.isPending ? 'Analyse en cours...' : 'Actualiser l\'analyse'}
                </Button>
                
                <WebsiteSelector 
                  selectedWebsiteId={selectedWebsiteId}
                  onWebsiteChange={setSelectedWebsiteId}
                />
                
                <div className="hidden lg:block">
                  <div className="text-center soft-card p-6">
                    <div className={`text-4xl font-bold mb-2 ${getScoreColor(seoAnalysis?.overallScore || 0)}`}>
                      {seoAnalysis?.overallScore || 0}
                    </div>
                    <div className="text-sm soft-text mb-3">Score SEO Global</div>
                    <div className="w-16 h-2 bg-slate-200 rounded-full">
                      <div 
                        className="h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000"
                        style={{ width: `${seoAnalysis?.overallScore || 0}%` }}
                      ></div>
                    </div>
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

        {/* Core Web Vitals avec graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Graphique des performances */}
          <div className="soft-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 soft-metric-orange rounded-lg">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-700">Performance Web Vitals</h3>
                <p className="text-sm soft-text">Comparaison Mobile vs Desktop</p>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scores techniques en radar */}
          <div className="soft-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 soft-metric-blue rounded-lg">
                <PieChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-700">Scores Techniques</h3>
                <p className="text-sm soft-text">Évaluation globale du site</p>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={technicalScores}>
                  <RadialBar 
                    dataKey="score" 
                    cornerRadius={10} 
                    fill="#3b82f6"
                    background={{ fill: '#f1f5f9' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              {technicalScores.map((score) => (
                <div key={score.category} className="text-center">
                  <div className={`text-lg font-semibold ${
                    score.score >= 80 ? 'text-emerald-600' : 
                    score.score >= 60 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {score.score}
                  </div>
                  <div className="text-xs soft-text">{score.category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analyse complète des mots-clés */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Distribution des mots-clés */}
          <div className="soft-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 soft-metric-blue rounded-lg">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-700">Distribution du Trafic</h3>
                <p className="text-sm soft-text">Répartition marque vs générique</p>
              </div>
            </div>
            
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart data={keywordDistribution}>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value}%`, 'Part de trafic']}
                  />
                  {keywordDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-slate-700">Mots-clés de marque</div>
                  <div className="text-lg font-bold text-emerald-600">63%</div>
                </div>
                <div className="text-xs soft-text">Mot-clé principal : "plug2ai" (position 1)</div>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-slate-700">Mots-clés génériques</div>
                  <div className="text-lg font-bold text-amber-600">37%</div>
                </div>
                <div className="text-xs soft-text">Meilleure position : "expert ia paris" (position 8)</div>
              </div>
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

          {/* Analyse concurrentielle avec graphique */}
          <div className="soft-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 soft-metric-orange rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-700">Analyse Concurrentielle</h3>
                <p className="text-sm soft-text">Position vs concurrents directs</p>
              </div>
            </div>
            
            <div className="h-48 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={competitorData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [
                      name === 'traffic' ? `${value} visiteurs/mois` : `DA ${value}`,
                      name === 'traffic' ? 'Trafic' : 'Domain Authority'
                    ]}
                  />
                  <Bar dataKey="traffic" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-slate-700">Plug2AI (Vous)</div>
                  <div className="text-sm font-semibold text-emerald-600">DA 11</div>
                </div>
                <div className="text-xs soft-text">Trafic : 30 visiteurs/mois • Potentiel de croissance élevé</div>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {competitorData.slice(1).map((competitor, index) => (
                  <div key={competitor.name} className="p-3 bg-white/50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-slate-700">{competitor.name}</div>
                      <div className="text-sm font-semibold text-blue-600">DA {competitor.da}</div>
                    </div>
                    <div className="text-xs soft-text">Trafic : {competitor.traffic.toLocaleString()} visiteurs/mois</div>
                  </div>
                ))}
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