import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { WebsiteSelector } from "@/components/website/website-selector";
import { SeoScoreCard } from "@/components/dashboard/seo-score-card";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { TrafficChart } from "@/components/dashboard/traffic-chart";
import { KeywordsTable } from "@/components/dashboard/keywords-table";
import { RecommendationsCard } from "@/components/dashboard/recommendations-card";
import { TechnicalSeoCard } from "@/components/dashboard/technical-seo-card";
import { Skeleton } from "@/components/ui/skeleton";
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

  // Auto-select first website if none selected
  useEffect(() => {
    if (websites && websites.length > 0 && !selectedWebsiteId) {
      setSelectedWebsiteId(websites[0].id);
    }
  }, [websites, selectedWebsiteId]);

  const handleWebsiteChange = (websiteId: number) => {
    setSelectedWebsiteId(websiteId);
  };

  if (websitesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark">
        <MobileHeader />
        <div className="px-4 py-8">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!websites || websites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark">
        <MobileHeader />
        <WebsiteSelector
          selectedWebsiteId={selectedWebsiteId}
          onWebsiteChange={handleWebsiteChange}
        />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No websites found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Add your first website to start monitoring SEO performance.
            </p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark pb-20">
      <MobileHeader />
      
      <WebsiteSelector
        selectedWebsiteId={selectedWebsiteId}
        onWebsiteChange={handleWebsiteChange}
      />

      <main>
        {analysisLoading || !seoAnalysis ? (
          <div className="px-4 py-8">
            <Skeleton className="h-48 w-full mb-4" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-64 w-full mb-4" />
            <Skeleton className="h-48 w-full mb-4" />
            <Skeleton className="h-48 w-full mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <SeoScoreCard
              score={seoAnalysis.overallScore}
              goodCount={seoAnalysis.recommendations.filter(r => r.priority === 'low').length + 15}
              warningCount={seoAnalysis.recommendations.filter(r => r.priority === 'medium').length}
              errorCount={seoAnalysis.recommendations.filter(r => r.priority === 'high').length}
            />

            <StatsGrid
              organicTraffic={seoAnalysis.organicTraffic}
              keywordsRanking={seoAnalysis.keywordsRanking}
              backlinks={seoAnalysis.backlinks}
              pageSpeed={seoAnalysis.pageSpeed}
            />

            <TrafficChart data={seoAnalysis.trafficData} />

            <KeywordsTable keywords={seoAnalysis.keywords} />

            <RecommendationsCard recommendations={seoAnalysis.recommendations} />

            <TechnicalSeoCard technicalSeo={seoAnalysis.technicalSeo} />
          </>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
