import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { WebsiteSelector } from "@/components/website/website-selector";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Website, SeoAnalysis } from "@shared/schema";

export default function Keywords() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: websites } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
  });

  const { data: seoAnalysis } = useQuery<SeoAnalysis>({
    queryKey: ["/api/websites", selectedWebsiteId, "seo-analysis"],
    enabled: !!selectedWebsiteId,
  });

  // Auto-select first website if none selected
  useEffect(() => {
    if (websites && websites.length > 0 && !selectedWebsiteId) {
      setSelectedWebsiteId(websites[0].id);
    }
  }, [websites, selectedWebsiteId]);

  const handleWebsiteChange = (websiteId: number) => {
    setSelectedWebsiteId(websiteId);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="text-seo-success w-4 h-4" />;
      case 'down':
        return <TrendingDown className="text-seo-error w-4 h-4" />;
      default:
        return <Minus className="text-gray-400 w-4 h-4" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-seo-success';
      case 'down':
        return 'text-seo-error';
      default:
        return 'text-gray-400';
    }
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'bg-seo-success text-white';
    if (position <= 10) return 'bg-seo-warning text-white';
    return 'bg-gray-500 text-white';
  };

  const filteredKeywords = seoAnalysis?.keywords?.filter(keyword =>
    keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark pb-20">
      <MobileHeader />
      
      <WebsiteSelector
        selectedWebsiteId={selectedWebsiteId}
        onWebsiteChange={handleWebsiteChange}
      />

      <main className="px-4 py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Keywords</h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {seoAnalysis && (
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {seoAnalysis.keywords?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Keywords</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-seo-success">
                    {seoAnalysis.keywords?.filter(k => k.position <= 10).length || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Top 10</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-seo-warning">
                    {seoAnalysis.keywords?.filter(k => k.position <= 3).length || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Top 3</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="space-y-0">
              {filteredKeywords.map((keyword, index) => (
                <div key={index} className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      {keyword.keyword}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Volume: {keyword.volume.toLocaleString()}</span>
                      <div className="flex items-center">
                        <span className="mr-1">Trend:</span>
                        <span className={getTrendColor(keyword.trend)}>
                          {keyword.trend}
                        </span>
                        {getTrendIcon(keyword.trend)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getPositionColor(keyword.position)} mb-1`}>
                      #{keyword.position}
                    </Badge>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Position</div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredKeywords.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No keywords found matching your search.' : 'No keywords data available.'}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}
