import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UnifiedHeader } from "@/components/layout/unified-header";
import { useSite } from "@/lib/site-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Bot, AlertTriangle, CheckCircle2, Clock, XCircle, Timer } from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";
import { fr } from "date-fns/locale";

type MonitoringOverview = {
  now: string;
  counts: {
    total: number;
    byStatus: Record<string, number>;
    dueToday: number;
    publishedToday: number;
    pendingToday: number;
    overdue: number;
    upcoming7d: number;
  };
  lastPublished: Array<{
    id: number;
    siteId: number;
    platform: string;
    status: string;
    publicationDate: string;
    excerpt: string;
  }>;
  nextScheduled: Array<{
    id: number;
    siteId: number;
    platform: string;
    status: string;
    publicationDate: string;
    excerpt: string;
  }>;
  failedPosts: Array<{
    id: number;
    contentId: number | null;
    siteId: number | null;
    platform: string;
    message: string;
    createdAt: string;
    publicationDate: string | null;
    excerpt: string;
  }>;
};

type MonitoringSummary = {
  resume: string;
  alertes: string[];
  actions: string[];
};

export default function Monitoring() {
  const { currentSite } = useSite();
  const [summary, setSummary] = useState<MonitoringSummary | null>(null);

  const siteId = currentSite?.id;

  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ["/api/monitoring/overview", siteId],
    enabled: !!siteId,
    queryFn: async (): Promise<MonitoringOverview> => {
      const url = `/api/monitoring/overview?siteId=${siteId}`;
      const response = await apiRequest("GET", url);
      const data = await response.json();
      return {
        ...data,
        failedPosts: Array.isArray(data?.failedPosts) ? data.failedPosts : []
      };
    }
  });

  const summaryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/monitoring/summary", {
        siteId
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSummary(data.summary || null);
    }
  });

  useEffect(() => {
    if (siteId && overview && !summary && !summaryMutation.isPending) {
      summaryMutation.mutate();
    }
  }, [siteId, overview, summary, summaryMutation.isPending]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  const getTimeStatus = (dateString: string) => {
    const pubDate = new Date(dateString);
    if (isPast(pubDate)) {
      return <span className="text-orange-600 flex items-center gap-1"><Timer className="w-3 h-3"/>Publication imminente (en cours...)</span>;
    }
    return <span className="text-blue-600 flex items-center gap-1"><Timer className="w-3 h-3"/>Dans {formatDistanceToNow(pubDate, { locale: fr })}</span>;
  };

  return (
    <div className="min-h-screen app-shell page-enter">
      <UnifiedHeader />

      <main className="container mx-auto px-4 pt-20 pb-20 max-w-7xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Monitoring IA</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Cartographie en temps réel des publications et alertes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading || !siteId}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Rafraîchir
            </Button>
            <Button onClick={() => summaryMutation.mutate()} disabled={summaryMutation.isPending || !siteId}>
              {summaryMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bot className="h-4 w-4 mr-2" />
              )}
              Résumé IA
            </Button>
          </div>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="py-8 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement des données...
            </CardContent>
          </Card>
        )}

        {!siteId && !isLoading && (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground text-center">
              Aucun site selectionne. Choisissez un site pour afficher le monitoring.
            </CardContent>
          </Card>
        )}

        {!isLoading && overview && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">À publier aujourd'hui</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{overview.counts.pendingToday}</span>
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Publiés aujourd'hui</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{overview.counts.publishedToday}</span>
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">En retard</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{overview.counts.overdue}</span>
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">À venir (7j)</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{overview.counts.upcoming7d}</span>
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Échecs récents</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{overview.failedPosts.length}</span>
                  <XCircle className="h-6 w-6 text-red-500" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  Agent IA - Synthèse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary ? (
                  <>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{summary.resume}</p>
                    {summary.alertes.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Alertes</p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                          {summary.alertes.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {summary.actions.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Actions recommandées</p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                          {summary.actions.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Cliquez sur “Résumé IA” pour générer l’analyse.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par statut</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {overview.counts?.byStatus ? Object.entries(overview.counts.byStatus).map(([status, value]) => (
                  <Badge key={status} variant="outline" className="text-xs">
                    {status}: {value}
                  </Badge>
                )) : (
                  <p className="text-sm text-gray-500">Aucune donnée de statut.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publications échouées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(overview.failedPosts || []).length === 0 && (
                  <p className="text-sm text-gray-500">Aucun échec de publication récent.</p>
                )}
                {(overview.failedPosts || []).map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.platform}</Badge>
                        {item.publicationDate && (
                          <span className="text-xs text-gray-500">
                            Publication prévue: {formatDate(item.publicationDate)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">Échec: {formatDateTime(item.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{item.excerpt}</p>
                    <p className="text-xs text-red-600 mt-2">Cause: {item.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Derniers contenus publiés</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(overview.lastPublished || []).length === 0 && (
                    <p className="text-sm text-gray-500">Aucun contenu publié récemment.</p>
                  )}
                  {(overview.lastPublished || []).map((item) => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{item.platform}</Badge>
                        <span className="text-xs text-gray-500">{formatDate(item.publicationDate)}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{item.excerpt}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>À publier prochainement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(overview.nextScheduled || []).length === 0 && (
                    <p className="text-sm text-gray-500">Aucun contenu planifié.</p>
                  )}
                  {(overview.nextScheduled || []).map((item) => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.platform}</Badge>
                          {item.status === 'validé' && <Badge variant="default" className="bg-green-600">Prêt</Badge>}
                          {item.status !== 'validé' && <Badge variant="outline">{item.status}</Badge>}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-500">{formatDate(item.publicationDate)}</span>
                          <span className="text-xs font-medium mt-1">
                            {item.status === 'validé' ? getTimeStatus(item.publicationDate) : <span className="text-gray-400">En attente de validation</span>}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{item.excerpt}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
