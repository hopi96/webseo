import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { WebsiteSelector } from "@/components/website/website-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Calendar, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import type { Website, SeoAnalysis } from "@shared/schema";

export default function Reports() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number | undefined>();

  const { data: websites } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
  });

  const { data: seoAnalysis } = useQuery<SeoAnalysis>({
    queryKey: ["/api/websites", selectedWebsiteId, "seo-analysis"],
    enabled: !!selectedWebsiteId,
  });

  // Auto-select first website if none selected
  React.useEffect(() => {
    if (websites && websites.length > 0 && !selectedWebsiteId) {
      setSelectedWebsiteId(websites[0].id);
    }
  }, [websites, selectedWebsiteId]);

  const handleWebsiteChange = (websiteId: number) => {
    setSelectedWebsiteId(websiteId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-seo-success";
    if (score >= 60) return "text-seo-warning";
    return "text-seo-error";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-seo-error" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-seo-warning" />;
      default:
        return <CheckCircle className="w-4 h-4 text-seo-success" />;
    }
  };

  const technicalChecks = seoAnalysis ? [
    { name: "Mobile Friendly", status: seoAnalysis.technicalSeo.mobileFriendly },
    { name: "HTTPS Secure", status: seoAnalysis.technicalSeo.httpsSecure },
    { name: "XML Sitemap", status: seoAnalysis.technicalSeo.xmlSitemap },
    { name: "Robots.txt", status: seoAnalysis.technicalSeo.robotsTxt },
  ] : [];

  const passedChecks = technicalChecks.filter(check => check.status).length;
  const technicalScore = (passedChecks / technicalChecks.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark pb-20">
      <MobileHeader />
      
      <WebsiteSelector
        selectedWebsiteId={selectedWebsiteId}
        onWebsiteChange={handleWebsiteChange}
      />

      <main className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SEO Reports</h1>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {seoAnalysis && (
          <div className="space-y-4">
            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Overall SEO Score</span>
                  <Badge variant="outline" className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(seoAnalysis.analyzedAt).toLocaleDateString()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-3xl font-bold ${getScoreColor(seoAnalysis.overallScore)}`}>
                    {seoAnalysis.overallScore}/100
                  </span>
                  <span className={`text-sm font-medium ${getScoreColor(seoAnalysis.overallScore)}`}>
                    {getScoreLabel(seoAnalysis.overallScore)}
                  </span>
                </div>
                <Progress value={seoAnalysis.overallScore} className="h-2" />
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {seoAnalysis.organicTraffic.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Organic Traffic</div>
                    <div className="flex items-center justify-center mt-1 text-seo-success">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      <span className="text-xs">+12.5%</span>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-seo-success mb-1">
                      {seoAnalysis.keywordsRanking}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Keywords Ranking</div>
                    <div className="flex items-center justify-center mt-1 text-seo-success">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      <span className="text-xs">+8.2%</span>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {seoAnalysis.backlinks.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Backlinks</div>
                    <div className="flex items-center justify-center mt-1 text-seo-success">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      <span className="text-xs">+5.1%</span>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-seo-warning mb-1">
                      {seoAnalysis.pageSpeed}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Page Speed</div>
                    <div className="flex items-center justify-center mt-1 text-seo-error">
                      <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                      <span className="text-xs">-2.3%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical SEO */}
            <Card>
              <CardHeader>
                <CardTitle>Technical SEO Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Technical Score</span>
                    <span className={`text-sm font-bold ${getScoreColor(technicalScore)}`}>
                      {Math.round(technicalScore)}%
                    </span>
                  </div>
                  <Progress value={technicalScore} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  {technicalChecks.map((check, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{check.name}</span>
                      <div className="flex items-center">
                        <span className={`text-xs font-medium mr-2 ${check.status ? 'text-seo-success' : 'text-seo-error'}`}>
                          {check.status ? 'Passed' : 'Failed'}
                        </span>
                        {check.status ? (
                          <CheckCircle className="w-4 h-4 text-seo-success" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-seo-error" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Issues & Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Issues & Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {seoAnalysis.recommendations.map((recommendation) => (
                    <div key={recommendation.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {getPriorityIcon(recommendation.priority)}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white mb-1">
                          {recommendation.title}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {recommendation.description}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {recommendation.category}
                          </Badge>
                          <Badge 
                            variant={recommendation.priority === 'high' ? 'destructive' : 
                                   recommendation.priority === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {recommendation.priority} priority
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Keywords */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {seoAnalysis.keywords.slice(0, 5).map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <div className="font-medium text-sm">{keyword.keyword}</div>
                        <div className="text-xs text-gray-500">Volume: {keyword.volume.toLocaleString()}</div>
                      </div>
                      <Badge variant={keyword.position <= 3 ? 'default' : keyword.position <= 10 ? 'secondary' : 'outline'}>
                        #{keyword.position}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!seoAnalysis && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              No analysis data available. Please select a website with existing analysis.
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
