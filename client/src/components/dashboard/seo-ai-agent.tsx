import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// ScrollArea remplacé par div avec scroll pour compatibilité
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Bot, Sparkles, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SEORecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  actionSteps: string[];
  estimatedImprovement: string;
}

interface AIAnalysisResult {
  overallScore: number;
  recommendations: SEORecommendation[];
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

interface SEOAIAgentProps {
  siteId: number;
  seoData: any;
}

export function SEOAIAgent({ siteId, seoData }: SEOAIAgentProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);

  const generateAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await apiRequest("POST", "/api/seo-ai-analysis", {
        siteId,
        seoData
      });
      
      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error("Erreur lors de l'analyse IA:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Agent IA SEO</CardTitle>
            <CardDescription>
              Analyse intelligente et recommandations personnalisées par GPT-4o
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!analysis && !isAnalyzing && (
          <div className="text-center py-8">
            <div className="mb-4">
              <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Analyse SEO intelligente
              </h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Laissez notre agent IA analyser vos données SEO et générer des recommandations 
                personnalisées pour améliorer votre référencement.
              </p>
            </div>
            <Button 
              onClick={generateAnalysis}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Analyser avec l'IA
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Analyse en cours...
            </h3>
            <p className="text-sm text-gray-600">
              L'agent IA examine vos données SEO et prépare des recommandations personnalisées.
            </p>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Score global et résumé */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Évaluation globale</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">{analysis.overallScore}/100</div>
                  <div className="text-xs text-gray-600">Score IA</div>
                </div>
              </div>
              <Progress value={analysis.overallScore} className="mb-3" />
              <p className="text-sm text-gray-700">{analysis.summary}</p>
            </div>

            {/* Forces et faiblesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Points forts
                </h4>
                <ul className="space-y-1">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Points d'amélioration
                </h4>
                <ul className="space-y-1">
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-sm text-orange-700 flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommandations */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Recommandations personnalisées
              </h3>
              
              <div className="h-96 overflow-y-auto pr-4 smart-scroll-vertical">
                <div className="space-y-4">
                  {analysis.recommendations.map((rec, index) => (
                    <Card key={index} className="border-l-4 border-l-purple-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant="outline" 
                                className={getPriorityColor(rec.priority)}
                              >
                                {getPriorityIcon(rec.priority)}
                                <span className="ml-1 capitalize">{rec.priority}</span>
                              </Badge>
                              <Badge variant="outline">{rec.category}</Badge>
                            </div>
                            <CardTitle className="text-base">{rec.title}</CardTitle>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">
                              {rec.estimatedImprovement}
                            </div>
                            <div className="text-xs text-gray-500">Impact estimé</div>
                          </div>
                        </div>
                        <CardDescription>{rec.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-900 mb-1">Impact attendu:</h5>
                          <p className="text-sm text-gray-700">{rec.impact}</p>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Plan d'action:</h5>
                          <ol className="space-y-1">
                            {rec.actionSteps.map((step, stepIndex) => (
                              <li key={stepIndex} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-purple-600 font-medium mt-0.5">
                                  {stepIndex + 1}.
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={generateAnalysis}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Bot className="h-4 w-4 mr-2" />
                Nouvelle analyse
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}