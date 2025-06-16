import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Keyword {
  keyword: string;
  position: number;
  volume: number;
  trend: 'up' | 'down' | 'stable';
}

interface KeywordsTableProps {
  keywords: Keyword[];
}

export function KeywordsTable({ keywords }: KeywordsTableProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="text-seo-success w-3 h-3" />;
      case 'down':
        return <TrendingDown className="text-seo-error w-3 h-3" />;
      default:
        return <Minus className="text-gray-400 w-3 h-3" />;
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  return (
    <div className="px-4 pb-4">
      <Card className="bg-white dark:bg-dark-surface shadow-sm border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Keywords</h3>
            <Button variant="ghost" className="text-primary text-sm font-medium">
              View All
            </Button>
          </div>
          
          <div className="space-y-3">
            {keywords?.slice(0, 5).map((keyword, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{keyword.keyword}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Volume: {formatVolume(keyword.volume)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white mr-2">
                      {keyword.position}
                    </span>
                    {getTrendIcon(keyword.trend)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Position</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
