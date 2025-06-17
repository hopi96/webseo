import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SeoScoreCardProps {
  score: number;
  goodCount: number;
  warningCount: number;
  errorCount: number;
  lastUpdated?: string;
}

export function SeoScoreCard({ 
  score, 
  goodCount, 
  warningCount, 
  errorCount, 
  lastUpdated = "2h ago" 
}: SeoScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-seo-success";
    if (score >= 60) return "text-seo-warning";
    return "text-seo-error";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return "bg-seo-success";
    if (score >= 60) return "bg-seo-warning";
    return "bg-seo-error";
  };

  return (
    <div className="px-4 py-4">
      <Card className="bg-white dark:bg-dark-surface shadow-sm border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Score de Santé SEO</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Dernière mise à jour : {lastUpdated}</span>
          </div>
          
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200 dark:text-gray-700"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={getScoreColor(score)}
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${score}, 100`}
                  strokeLinecap="round"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">out of 100</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm font-medium text-seo-success">{goodCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Good</div>
            </div>
            <div>
              <div className="text-sm font-medium text-seo-warning">{warningCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Warnings</div>
            </div>
            <div>
              <div className="text-sm font-medium text-seo-error">{errorCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Errors</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
