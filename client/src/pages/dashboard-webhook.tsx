import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Navigation } from "@/components/layout/navigation";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { 
  Globe, 
  Zap, 
  Search, 
  Link, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Calendar
} from "lucide-react";

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

export default function DashboardWebhook() {
  // Récupération des sites web
  const { data: websites = [] } = useQuery<WebsiteType[]>({
    queryKey: ['/api/websites'],
  });

  // Récupération de l'analyse SEO pour le premier site
  const { data: seoAnalysis, isLoading } = useQuery<SeoAnalysisType>({
    queryKey: [`/api/websites/1/seo-analysis`],
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement de l'analyse...</p>
        </div>
      </div>
    );
  }

  if (!seoAnalysis || !seoAnalysis.rawWebhookData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Aucune donnée d'analyse disponible</p>
        </div>
      </div>
    );
  }

  // Parse des données webhook
  const webhookData = JSON.parse(seoAnalysis.rawWebhookData);
  const website = websites.find(w => w.id === 1);

  // Fonction pour obtenir l'icône de tendance
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  // Préparation des données pour le graphique de densité des mots-clés
  const keywordDensityData = webhookData.keywordAnalysis?.map((kw: any) => ({
    keyword: kw.keyword,
    density: kw.density,
    count: kw.count
  })).slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="p-6 space-y-6">
        {/* En-tête avec informations du site */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Analyse SEO du site web
              </h1>
              <p className="text-lg text-blue-600 font-medium">{website?.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{webhookData.url}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">{webhookData.seoScore}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Score SEO</div>
            </div>
          </div>
        </div>

        {/* Métriques principales en cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Score SEO */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                Score SEO
                <HelpTooltip content="Score global d'optimisation SEO de votre site web, calculé sur la base de différents critères techniques et de contenu" />
              </CardTitle>
              <Globe className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {webhookData.seoScore}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Progress value={webhookData.seoScore} className="flex-1" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {webhookData.seoScore >= 80 ? 'Excellent' : 
                   webhookData.seoScore >= 60 ? 'Bon' : 'À améliorer'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* PageSpeed */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                PageSpeed
                <HelpTooltip content="Vitesse de chargement de votre site web. Un score élevé améliore l'expérience utilisateur et le classement Google" />
              </CardTitle>
              <Zap className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {webhookData.pageSpeed}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Performance: {webhookData.pageSpeedMetrics?.performanceScore || 'N/A'}
              </div>
            </CardContent>
          </Card>

          {/* Mots-clés */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                Mots-clés
                <HelpTooltip content="Nombre total de mots-clés identifiés sur votre site web, incluant les variantes géolocalisées et saisonnières" />
              </CardTitle>
              <Search className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {webhookData.keywordCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Mots-clés analysés
              </div>
            </CardContent>
          </Card>

          {/* Liens */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                Liens internes
                <HelpTooltip content="Nombre de liens internes qui relient les pages de votre site entre elles. Améliore la navigation et le référencement" />
              </CardTitle>
              <Link className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {webhookData.internalLinks}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {webhookData.externalLinks} liens externes
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analyse des titres et méta-descriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balises de titre */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Analyse des titres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Titre principal
                    </span>
                    <Badge variant={webhookData.titleTags?.status === 'good' ? 'default' : 'secondary'}>
                      {webhookData.titleTags?.status || 'warning'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    "{webhookData.titleTags?.title}"
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Longueur: {webhookData.titleTags?.length} caractères
                  </p>
                </div>
                
                {webhookData.titleTags?.suggestions && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Suggestions d'amélioration:
                    </p>
                    <ul className="space-y-1">
                      {webhookData.titleTags.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                          <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1 mt-0.5" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Méta-descriptions */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Méta-descriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description principale
                    </span>
                    <Badge variant={webhookData.metaDescriptions?.status === 'good' ? 'default' : 'secondary'}>
                      {webhookData.metaDescriptions?.status || 'warning'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    "{webhookData.metaDescriptions?.description?.slice(0, 100)}..."
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Longueur: {webhookData.metaDescriptions?.length} caractères
                  </p>
                </div>
                
                {webhookData.metaDescriptions?.suggestions && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Suggestions d'amélioration:
                    </p>
                    <ul className="space-y-1">
                      {webhookData.metaDescriptions.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                          <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1 mt-0.5" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit technique SEO */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Audit technique SEO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(webhookData.technicalSeo || {}).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  {value ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {key === 'robotsTxt' ? 'Robots.txt' :
                       key === 'xmlSitemap' ? 'XML Sitemap' :
                       key === 'mobileFriendly' ? 'Mobile-Friendly' :
                       key === 'https' ? 'HTTPS' :
                       key === 'compression' ? 'Compression' :
                       key === 'imageAltTags' ? 'Balises Alt' : key}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {value ? 'Conforme' : 'À corriger'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analyse de densité des mots-clés */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Analyse de densité des mots-clés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={keywordDensityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                  <XAxis 
                    dataKey="keyword" 
                    className="text-gray-600 dark:text-gray-400"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis className="text-gray-600 dark:text-gray-400" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      color: '#374151'
                    }}
                    formatter={(value, name) => [
                      `${value}${name === 'density' ? '%' : ''}`,
                      name === 'density' ? 'Densité' : 'Occurrences'
                    ]}
                  />
                  <Bar dataKey="density" fill="#3b82f6" name="density" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stratégie de contenu avec mots-clés géolocalisés et saisonniers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Opportunités locales */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Opportunités locales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {webhookData.contentStrategy?.localOpportunities?.slice(0, 8).map((keyword: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm text-gray-900 dark:text-white">{keyword}</span>
                    <Badge variant="outline" className="text-xs">Local</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mots-clés saisonniers */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Mots-clés saisonniers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {webhookData.contentStrategy?.seasonalKeywords?.slice(0, 8).map((keyword: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm text-gray-900 dark:text-white">{keyword}</span>
                    <Badge variant="outline" className="text-xs">Saisonnier</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stratégie de contenu suggérée */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              🎯 Stratégie de contenu suggérée
            </CardTitle>
            <div className="flex justify-end">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Recevoir Single Page Report →
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mots-clés longue traîne (Google Suggest) */}
            <div className="mb-8">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                🔍 Mots-clés longue traîne (Google Suggest)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {webhookData.contentStrategy?.trendingKeywords?.slice(0, 8).map((keyword: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {keyword.keyword}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({keyword.searchVolume?.toLocaleString()} vol)
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-white">
                      {keyword.seasonality} saison
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Mots-clés sémantique longue traîne */}
            <div className="mb-8">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                📚 Mots-clés sémantique longue traîne
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {webhookData.contentStrategy?.seasonalKeywords?.slice(0, 12).map((keyword: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{keyword}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions pour créer du contenu */}
            <div className="mb-8">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                ❓ Questions pour créer du contenu
              </h3>
              <div className="space-y-3">
                {[
                  "Comment organiser un anniversaire enfant?",
                  "Que faire lors d'un anniversaire?",
                  "Comment préparer des activités pour enfants?",
                  "Comment gérer un groupe d'enfants?",
                  "Comment réussir une fête d'anniversaire?",
                  "Quels jeux pour un anniversaire enfant?"
                ].map((question, index) => (
                  <div key={index} className="p-3 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800">
                    <input 
                      type="text" 
                      value={question}
                      readOnly
                      className="w-full text-sm text-gray-700 dark:text-gray-300 bg-transparent border-none outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunités locales et mots-clés longue traîne */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Opportunités locales */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  🗺️ Opportunités locales
                </h3>
                <div className="space-y-2">
                  {webhookData.contentStrategy?.localOpportunities?.slice(0, 8).map((location: string, index: number) => (
                    <div key={index} className="p-2 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800">
                      <div className="text-sm text-gray-700 dark:text-gray-300">{location}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mots-clés longue traîne */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  🎯 Mots-clés longue traîne
                </h3>
                <div className="space-y-2">
                  {webhookData.contentStrategy?.seasonalKeywords?.slice(0, 8).map((keyword: string, index: number) => (
                    <div key={index} className="p-2 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800">
                      <div className="text-sm text-gray-700 dark:text-gray-300">{keyword}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core Web Vitals */}
        {webhookData.pageSpeedMetrics && (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Core Web Vitals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {webhookData.pageSpeedMetrics.firstContentfulPaint}s
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">FCP</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {webhookData.pageSpeedMetrics.largestContentfulPaint}s
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">LCP</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {webhookData.pageSpeedMetrics.cumulativeLayoutShift}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">CLS</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {webhookData.pageSpeedMetrics.totalBlockingTime}ms
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">TBT</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}