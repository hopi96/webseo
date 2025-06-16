import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface RecommendationsCardProps {
  recommendations: Recommendation[];
}

export function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-seo-error';
      case 'medium':
        return 'bg-seo-warning';
      default:
        return 'bg-seo-success';
    }
  };

  return (
    <div className="px-4 pb-4">
      <Card className="bg-white dark:bg-dark-surface shadow-sm border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-seo-secondary rounded-lg flex items-center justify-center mr-3">
              <Lightbulb className="text-white w-4 h-4" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SEO Recommendations</h3>
          </div>
          
          <div className="space-y-4">
            {recommendations.slice(0, 3).map((recommendation) => (
              <div key={recommendation.id} className="flex">
                <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${getPriorityColor(recommendation.priority)}`}></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    {recommendation.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {recommendation.description}
                  </div>
                  <Button variant="ghost" className="text-primary text-sm font-medium p-0 h-auto hover:underline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
