import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Bot,
    RefreshCw,
    Loader2,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    AlertCircle,
    XCircle,
    Sparkles,
    MessageSquare,
    List,
    Shield,
    Tag,
    Clock,
    FileText,
    Brain
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";

interface GEOFactor {
    score: number;
    weight: number;
    status: 'good' | 'warning' | 'error';
    details: string;
    improvements: string[];
}

interface GEORecommendation {
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    impact: string;
}

interface GEOAnalysis {
    geoScore: number;
    factors: {
        directAnswers: GEOFactor;
        structuredContent: GEOFactor;
        authoritySignals: GEOFactor;
        entityClarity: GEOFactor;
        freshness: GEOFactor;
        conciseness: GEOFactor;
        semanticDepth: GEOFactor;
    };
    recommendations: GEORecommendation[];
    analyzedAt: string;
}

interface GEOAnalysisCardProps {
    siteId: number;
}

const factorConfig = {
    directAnswers: { label: "Réponses directes", icon: MessageSquare, description: "Réponses claires dès le début" },
    structuredContent: { label: "Contenu structuré", icon: List, description: "Titres, listes, tableaux" },
    authoritySignals: { label: "Signaux d'autorité", icon: Shield, description: "Citations, auteur, sources" },
    entityClarity: { label: "Clarté des entités", icon: Tag, description: "Définitions, noms propres" },
    freshness: { label: "Fraîcheur", icon: Clock, description: "Dates de mise à jour" },
    conciseness: { label: "Concision", icon: FileText, description: "Paragraphes courts" },
    semanticDepth: { label: "Profondeur sémantique", icon: Brain, description: "Couverture du sujet" }
};

export function GEOAnalysisCard({ siteId }: GEOAnalysisCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Récupérer l'analyse GEO existante
    const { data: geoData, isLoading } = useQuery<{ geoAnalysis: GEOAnalysis; geoScore: number } | null>({
        queryKey: [`/api/sites/${siteId}/geo-analysis`],
        enabled: !!siteId,
        retry: false,
        queryFn: async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;
            const headers: Record<string, string> = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(`/api/sites/${siteId}/geo-analysis`, {
                headers,
                credentials: "include",
            });

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                const text = (await response.text()) || response.statusText;
                throw new Error(`${response.status}: ${text}`);
            }

            return response.json();
        },
    });

    // Mutation pour lancer une nouvelle analyse
    const analyzeMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest("POST", `/api/sites/${siteId}/analyze-geo`);
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Analyse GEO terminée",
                description: "L'optimisation pour les IA a été analysée avec succès."
            });
            queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/geo-analysis`] });
        },
        onError: () => {
            toast({
                title: "Erreur",
                description: "Impossible de lancer l'analyse GEO.",
                variant: "destructive"
            });
        }
    });

    const analysis = geoData?.geoAnalysis;
    const geoScore = analysis?.geoScore ?? geoData?.geoScore ?? 0;

    const getScoreColor = (score: number) => {
        if (score >= 70) return "text-green-600";
        if (score >= 40) return "text-yellow-600";
        return "text-red-600";
    };

    const getStatusIcon = (status: 'good' | 'warning' | 'error') => {
        switch (status) {
            case 'good': return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
            case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
        }
    };

    const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
        switch (priority) {
            case 'high': return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
            case 'medium': return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
            case 'low': return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                        <Bot className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            Analyse GEO
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Generative Engine Optimization
                        </p>
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => analyzeMutation.mutate()}
                    disabled={analyzeMutation.isPending}
                >
                    {analyzeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {analysis ? "Actualiser" : "Analyser"}
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : analysis && analysis.factors ? (
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                    {/* Score principal */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className={`text-4xl font-bold ${getScoreColor(geoScore)}`}>
                                {geoScore}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                / 100
                                <div className="text-xs">Score GEO</div>
                            </div>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                                {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                                <span className="ml-1 text-xs">
                                    {isExpanded ? "Réduire" : "Détails"}
                                </span>
                            </Button>
                        </CollapsibleTrigger>
                    </div>

                    {/* Aperçu des facteurs */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {Object.entries(analysis.factors).map(([key, factor]) => (
                            <div
                                key={key}
                                className="flex flex-col items-center"
                                title={`${factorConfig[key as keyof typeof factorConfig]?.label}: ${factor.score}/100`}
                            >
                                <div className={`w-full h-2 rounded-full ${factor.status === 'good' ? 'bg-green-400' :
                                    factor.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                                    }`} />
                            </div>
                        ))}
                    </div>

                    <CollapsibleContent className="space-y-4">
                        {/* Détails des facteurs */}
                        <div className="space-y-3 mt-4">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">Facteurs d'optimisation</h4>
                            {Object.entries(analysis.factors).map(([key, factor]) => {
                                const config = factorConfig[key as keyof typeof factorConfig];
                                const Icon = config?.icon || Bot;
                                return (
                                    <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4 text-gray-500" />
                                                <span className="font-medium text-sm">{config?.label}</span>
                                                {getStatusIcon(factor.status)}
                                            </div>
                                            <span className={`font-bold ${getScoreColor(factor.score)}`}>
                                                {factor.score}%
                                            </span>
                                        </div>
                                        <Progress value={factor.score} className="h-1.5 mb-2" />
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{factor.details}</p>
                                        {factor.improvements?.length > 0 && (
                                            <ul className="mt-2 space-y-1">
                                                {factor.improvements.slice(0, 2).map((imp, i) => (
                                                    <li key={i} className="text-xs text-primary flex items-start gap-1">
                                                        <span className="mt-0.5">→</span>
                                                        <span>{imp}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Recommandations */}
                        {analysis.recommendations?.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Recommandations prioritaires</h4>
                                {analysis.recommendations.slice(0, 3).map((rec, i) => (
                                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={getPriorityColor(rec.priority)}>
                                                {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                                            </Badge>
                                            <span className="text-xs text-gray-500">{rec.category}</span>
                                        </div>
                                        <p className="font-medium text-sm">{rec.title}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rec.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="text-xs text-gray-400 text-right mt-2">
                            Analysé le {analysis.analyzedAt ? new Date(analysis.analyzedAt).toLocaleDateString('fr-FR') : 'N/A'}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            ) : (
                <div className="text-center py-6">
                    <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Analysez l'optimisation de votre site pour les moteurs de recherche IA
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        Google AI Overview, Bing Chat, Perplexity...
                    </p>
                </div>
            )}
        </Card>
    );
}
