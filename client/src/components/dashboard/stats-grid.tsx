import { Card, CardContent } from "@/components/ui/card";
import { Search, Key, Link, Gauge, TrendingUp, TrendingDown } from "lucide-react";

interface StatsGridProps {
  organicTraffic: number;
  keywordsRanking: number;
  backlinks: number;
  pageSpeed: number;
}

export function StatsGrid({ organicTraffic, keywordsRanking, backlinks, pageSpeed }: StatsGridProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const stats = [
    {
      title: "Organic Traffic",
      value: formatNumber(organicTraffic),
      icon: Search,
      color: "text-primary",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      trend: "+12.5%",
      trendUp: true,
    },
    {
      title: "Keywords Ranking",
      value: keywordsRanking.toString(),
      icon: Key,
      color: "text-seo-success",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      trend: "+8.2%",
      trendUp: true,
    },
    {
      title: "Backlinks",
      value: formatNumber(backlinks),
      icon: Link,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      trend: "+5.1%",
      trendUp: true,
    },
    {
      title: "Page Speed",
      value: pageSpeed.toString(),
      icon: Gauge,
      color: "text-seo-warning",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      trend: "-2.3%",
      trendUp: false,
    },
  ];

  return (
    <div className="px-4 pb-4">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white dark:bg-dark-surface shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center mr-3`}>
                  <stat.icon className={`${stat.color} w-5 h-5`} />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">{stat.value}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center">
                {stat.trendUp ? (
                  <TrendingUp className="text-seo-success w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="text-seo-error w-3 h-3 mr-1" />
                )}
                <span className={`text-sm font-medium ${stat.trendUp ? "text-seo-success" : "text-seo-error"}`}>
                  {stat.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
