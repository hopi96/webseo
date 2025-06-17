import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Shimmer, MetricShimmer, KeywordShimmer } from "@/components/ui/shimmer";
import type { Website, SeoAnalysis } from "@shared/schema";

export default function Keywords() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"position" | "volume" | "keyword">("position");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-slate-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'down': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (position <= 10) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const filteredAndSortedKeywords = seoAnalysis?.keywords
    ?.filter(keyword => 
      keyword.keyword.toLowerCase().includes(searchQuery.toLowerCase())
    )
    ?.sort((a, b) => {
      const order = sortOrder === "asc" ? 1 : -1;
      switch (sortBy) {
        case "position":
          return (a.position - b.position) * order;
        case "volume":
          return (a.volume - b.volume) * order;
        case "keyword":
          return a.keyword.localeCompare(b.keyword) * order;
        default:
          return 0;
      }
    }) || [];

  const selectedWebsite = websites?.find(w => w.id === selectedWebsiteId);

  if (websitesLoading || analysisLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          
          {/* En-tête avec animation */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-3">
                <Shimmer className="h-8 w-56 rounded-lg" />
                <Shimmer className="h-5 w-64 rounded" />
              </div>
              <Shimmer className="h-8 w-24 rounded-lg" />
            </div>

            {/* Statistiques globales avec animation flottante */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-float" style={{ animationDelay: `${i * 0.15}s` }}>
                  <MetricShimmer />
                </div>
              ))}
            </div>
          </div>

          {/* Contrôles de recherche avec shimmer */}
          <Card className="mb-8 border-0 shadow-lg animate-pulse-glow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Shimmer className="h-10 w-full rounded-lg" />
                </div>
                <div className="flex gap-2">
                  <Shimmer className="h-10 w-20 rounded-lg" />
                  <Shimmer className="h-10 w-20 rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des mots-clés avec animation séquentielle */}
          <Card className="border-0 shadow-lg animate-pulse-glow" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shimmer className="h-5 w-5 rounded" />
                <Shimmer className="h-6 w-40 rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <KeywordShimmer count={8} />
            </CardContent>
          </Card>

          {/* Indicateur de chargement sophistiqué */}
          <div className="fixed bottom-8 right-8">
            <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg animate-pulse-glow">
              <div className="relative">
                <div className="w-4 h-4 bg-emerald-600 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-4 h-4 bg-emerald-600 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-sm font-medium text-slate-700">Analyse des mots-clés...</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Analyse des Mots-clés
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {selectedWebsite?.name || "Performances des mots-clés"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="px-3 py-1">
                {filteredAndSortedKeywords.length} mots-clés
              </Badge>
            </div>
          </div>

          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {seoAnalysis?.keywordsRanking || 0}
                    </div>
                    <div className="text-sm text-slate-600">Total Mots-clés</div>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {filteredAndSortedKeywords.filter(k => k.position <= 10).length}
                    </div>
                    <div className="text-sm text-slate-600">Top 10</div>
                  </div>
                  <ArrowUpRight className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {filteredAndSortedKeywords.filter(k => k.position <= 3).length}
                    </div>
                    <div className="text-sm text-slate-600">Top 3</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {filteredAndSortedKeywords.reduce((sum, k) => sum + k.volume, 0)}
                    </div>
                    <div className="text-sm text-slate-600">Volume Total</div>
                  </div>
                  <Eye className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contrôles de recherche et tri */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher un mot-clé..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={sortBy === "position" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (sortBy === "position") {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortBy("position");
                      setSortOrder("asc");
                    }
                  }}
                  className="flex items-center space-x-1"
                >
                  <span>Position</span>
                  {sortBy === "position" && (
                    sortOrder === "asc" ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                  )}
                </Button>
                
                <Button
                  variant={sortBy === "volume" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (sortBy === "volume") {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortBy("volume");
                      setSortOrder("desc");
                    }
                  }}
                  className="flex items-center space-x-1"
                >
                  <span>Volume</span>
                  {sortBy === "volume" && (
                    sortOrder === "asc" ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des mots-clés */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Mots-clés Performants</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAndSortedKeywords.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  Aucun mot-clé trouvé
                </h3>
                <p className="text-slate-500">
                  {searchQuery ? 
                    "Essayez avec des termes différents" : 
                    "Aucun mot-clé disponible pour ce site"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedKeywords.map((keyword, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-slate-900 text-lg">
                          {keyword.keyword}
                        </h3>
                        <Badge className={`${getTrendColor(keyword.trend)} border`}>
                          {getTrendIcon(keyword.trend)}
                          <span className="ml-1 text-xs">
                            {keyword.trend === 'up' ? 'En hausse' : 
                             keyword.trend === 'down' ? 'En baisse' : 'Stable'}
                          </span>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <span>Volume de recherche: {keyword.volume.toLocaleString()}/mois</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-slate-500 mb-1">Position</div>
                        <Badge className={`${getPositionColor(keyword.position)} text-sm px-3 py-1`}>
                          #{keyword.position}
                        </Badge>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-slate-500 mb-1">Opportunité</div>
                        <div className="text-sm font-semibold">
                          {keyword.position <= 3 ? (
                            <span className="text-emerald-600">Excellent</span>
                          ) : keyword.position <= 10 ? (
                            <span className="text-amber-600">Bon</span>
                          ) : keyword.position <= 20 ? (
                            <span className="text-orange-600">Moyen</span>
                          ) : (
                            <span className="text-red-600">Faible</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation mobile */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-slate-200 px-4 py-2">
          <div className="flex justify-around">
            <Button variant="ghost" size="sm" className="flex-1">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="flex-1">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="flex-1">
              <Target className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}