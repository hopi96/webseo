import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UnifiedHeader } from "@/components/layout/unified-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSite } from "@/lib/site-context";
import { queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { CalendarPlus, FileSpreadsheet, RefreshCw, Search, Upload, Pencil, Save, Trash2, X } from "lucide-react";

type PlanningCalendar = {
  id: number;
  name: string;
  period_start: string | null;
  period_end: string | null;
  source_type: string;
  source_file_name: string | null;
  total_rows: number;
  created_at: string;
};

type PlanningItem = {
  id: number;
  calendar_id: number;
  row_number: number;
  publication_date: string | null;
  month_label: string | null;
  day_label: string | null;
  title: string;
  primary_keyword: string | null;
  brief_url: string | null;
  brief_text: string | null;
  content_seed: string | null;
  raw_status: string | null;
  workflow_status: "todo" | "ready" | "scheduled" | "published" | "other";
  target_editorial_status: "en attente" | "à réviser" | "validé" | "publié";
  source_url: string | null;
  topic: string | null;
  objective: string | null;
  content_type: string;
  created_at: string;
};

type ImportPreview = {
  totalRows: number;
  parsedRows: number;
  skippedRows: number;
  duplicateRows: number;
  rowsToImport: number;
  periodStart: string | null;
  periodEnd: string | null;
  preview: Array<{
    rowNumber: number;
    publicationDate: string | null;
    title: string;
    keyword: string;
    workflowStatus: string;
    targetEditorialStatus: string;
    sourceUrl: string | null;
  }>;
};

function workflowStatusBadge(status: PlanningItem["workflow_status"]) {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    case "scheduled":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    case "ready":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100";
    case "other":
      return "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100";
    default:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
  }
}

export default function PlanningPage() {
  const { toast } = useToast();
  const { currentSite, selectedSiteId } = useSite();
  const activeSiteId = selectedSiteId ?? currentSite?.id ?? null;

  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [calendarFilter, setCalendarFilter] = useState("all");
  const [importYear, setImportYear] = useState(String(new Date().getFullYear()));
  const [calendarName, setCalendarName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  const { data: calendars = [], isLoading: isLoadingCalendars } = useQuery<PlanningCalendar[]>({
    queryKey: ["/api/planning/calendars", activeSiteId],
    enabled: Boolean(activeSiteId),
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const response = await fetch(`/api/planning/calendars?siteId=${activeSiteId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    }
  });

  const { data: items = [], isLoading: isLoadingItems } = useQuery<PlanningItem[]>({
    queryKey: ["/api/planning/items", activeSiteId, monthFilter, statusFilter, calendarFilter, search],
    enabled: Boolean(activeSiteId),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("siteId", String(activeSiteId));
      if (monthFilter !== "all") params.set("month", monthFilter);
      if (statusFilter !== "all") params.set("workflowStatus", statusFilter);
      if (calendarFilter !== "all") params.set("calendarId", calendarFilter);
      if (search.trim()) params.set("search", search.trim());

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const response = await fetch(`/api/planning/items?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    }
  });

  const doImport = async (dryRun: boolean) => {
    if (!activeSiteId) {
      toast({ title: "Site requis", description: "Sélectionnez un site avant import.", variant: "destructive" });
      return;
    }
    if (!selectedFile) {
      toast({ title: "Fichier requis", description: "Choisissez un CSV à importer.", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("siteId", String(activeSiteId));
    formData.append("year", importYear || String(new Date().getFullYear()));
    formData.append("dryRun", String(dryRun));
    formData.append("calendarName", calendarName);
    formData.append("contentType", "blog");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch("/api/planning/import", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  };

  const previewMutation = useMutation({
    mutationFn: async () => doImport(true),
    onSuccess: (data) => {
      setPreview(data);
      toast({
        title: "Prévisualisation prête",
        description: `${data.rowsToImport} ligne(s) peuvent être importées.`
      });
    },
    onError: (error: any) => {
      toast({ title: "Erreur import", description: error.message || "Prévisualisation impossible", variant: "destructive" });
    }
  });

  const importMutation = useMutation({
    mutationFn: async () => doImport(false),
    onSuccess: (data) => {
      toast({
        title: "Import effectué",
        description: `${data.rowsImported || 0} ligne(s) importée(s).`
      });
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/planning/calendars"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planning/items"] });
    },
    onError: (error: any) => {
      toast({ title: "Erreur import", description: error.message || "Import impossible", variant: "destructive" });
    }
  });

  const createContentMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const response = await fetch(`/api/planning/items/${itemId}/create-content`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Contenu créé", description: "La ligne planning a été envoyée dans le calendrier éditorial." });
      queryClient.invalidateQueries({ queryKey: ["/api/editorial-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planning/items"] });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message || "Création impossible", variant: "destructive" });
    }
  });

  const createContentBatchMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const response = await fetch("/api/planning/items/create-content-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ids })
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Creation en lot terminee",
        description: `${data.created || 0} cree(s), ${data.existing || 0} deja existant(s), ${data.failed || 0} erreur(s).`
      });
      setSelectedItemIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/editorial-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/planning/items"] });
    },
    onError: (error: any) => {
      toast({ title: "Erreur lot", description: error.message || "Creation en lot impossible", variant: "destructive" });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const response = await fetch(`/api/planning/items/${itemId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Ligne supprimee", description: "La ligne a ete supprimee du planning." });
      queryClient.invalidateQueries({ queryKey: ["/api/planning/items"] });
    },
    onError: (error: any) => {
      toast({ title: "Erreur suppression", description: error.message || "Suppression impossible", variant: "destructive" });
    }
  });

  const deleteBatchMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const response = await fetch("/api/planning/items/delete-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ids })
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Suppression terminee", description: `${data.deletedCount || 0} ligne(s) supprimee(s).` });
      setSelectedItemIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/planning/items"] });
    },
    onError: (error: any) => {
      toast({ title: "Erreur suppression", description: error.message || "Suppression en lot impossible", variant: "destructive" });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async (params: { id: number; payload: Record<string, unknown> }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const response = await fetch(`/api/planning/items/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(params.payload)
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Ligne mise a jour", description: "Les modifications du planning ont ete enregistrees." });
      setEditingItemId(null);
      setEditDraft({});
      queryClient.invalidateQueries({ queryKey: ["/api/planning/items"] });
    },
    onError: (error: any) => {
      toast({ title: "Erreur sauvegarde", description: error.message || "Mise a jour impossible", variant: "destructive" });
    }
  });

  const formatDateInput = (value: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const beginEdit = (item: PlanningItem) => {
    setEditingItemId(item.id);
    setEditDraft({
      title: item.title || "",
      primary_keyword: item.primary_keyword || "",
      brief_text: item.brief_text || "",
      content_seed: item.content_seed || "",
      source_url: item.source_url || "",
      raw_status: item.raw_status || "",
      publication_date: formatDateInput(item.publication_date),
      workflow_status: item.workflow_status,
      target_editorial_status: item.target_editorial_status,
    });
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditDraft({});
  };

  const saveEdit = (itemId: number) => {
    updateItemMutation.mutate({
      id: itemId,
      payload: {
        title: editDraft.title,
        primary_keyword: editDraft.primary_keyword,
        brief_text: editDraft.brief_text,
        content_seed: editDraft.content_seed,
        source_url: editDraft.source_url,
        raw_status: editDraft.raw_status,
        publication_date: editDraft.publication_date || null,
        workflow_status: editDraft.workflow_status,
        target_editorial_status: editDraft.target_editorial_status,
      }
    });
  };

  const stats = useMemo(() => {
    const total = items.length;
    const published = items.filter((i) => i.workflow_status === "published").length;
    const scheduled = items.filter((i) => i.workflow_status === "scheduled").length;
    const ready = items.filter((i) => i.workflow_status === "ready").length;
    return { total, published, scheduled, ready };
  }, [items]);

  const visibleItemIds = useMemo(() => items.map((item) => item.id), [items]);
  const selectedCount = selectedItemIds.length;
  const allVisibleSelected = visibleItemIds.length > 0 && visibleItemIds.every((id) => selectedItemIds.includes(id));
  const hasPendingBulkAction =
    createContentBatchMutation.isPending || deleteBatchMutation.isPending || createContentMutation.isPending;

  useEffect(() => {
    const visibleSet = new Set(visibleItemIds);
    setSelectedItemIds((prev) => prev.filter((id) => visibleSet.has(id)));
  }, [visibleItemIds]);

  const toggleItemSelection = (id: number, checked: boolean) => {
    setSelectedItemIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((existingId) => existingId !== id);
    });
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    if (!checked) {
      setSelectedItemIds([]);
      return;
    }
    setSelectedItemIds(visibleItemIds);
  };

  return (
    <div className="min-h-screen app-shell page-enter">
      <UnifiedHeader />
      <main className="container mx-auto px-4 pt-20 pb-20 max-w-7xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Planning éditorial</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Import CSV/Sheet, validation des lignes et transfert vers le calendrier éditorial.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/planning/calendars"] });
              queryClient.invalidateQueries({ queryKey: ["/api/planning/items"] });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Lignes affichées</p>
              <p className="text-2xl font-semibold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Prêtes / Planifiées</p>
              <p className="text-2xl font-semibold mt-1">{stats.ready + stats.scheduled}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Déjà publiées</p>
              <p className="text-2xl font-semibold mt-1">{stats.published}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import CSV planning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-3">
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <Input
                value={calendarName}
                onChange={(e) => setCalendarName(e.target.value)}
                placeholder="Nom du calendrier (optionnel)"
              />
              <Input
                value={importYear}
                onChange={(e) => setImportYear(e.target.value)}
                placeholder="Année (ex: 2026)"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => previewMutation.mutate()}
                  disabled={previewMutation.isPending || importMutation.isPending || !activeSiteId}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Prévisualiser
                </Button>
                <Button
                  className="w-full"
                  onClick={() => importMutation.mutate()}
                  disabled={importMutation.isPending || previewMutation.isPending || !activeSiteId}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importer
                </Button>
              </div>
            </div>

            {preview && (
              <div className="rounded-md border p-3 space-y-2">
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">Total CSV: {preview.totalRows}</Badge>
                  <Badge variant="secondary">Lignes valides: {preview.parsedRows}</Badge>
                  <Badge variant="secondary">Doublons: {preview.duplicateRows}</Badge>
                  <Badge variant="secondary">À importer: {preview.rowsToImport}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Période détectée: {preview.periodStart || "N/A"} → {preview.periodEnd || "N/A"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              Filtres planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-3">
              <Select value={calendarFilter} onValueChange={setCalendarFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Calendrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les calendriers</SelectItem>
                  {calendars.map((calendar) => (
                    <SelectItem key={calendar.id} value={String(calendar.id)}>
                      {calendar.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Mois" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les mois</SelectItem>
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <SelectItem key={idx + 1} value={String(idx + 1)}>
                      {new Date(2000, idx, 1).toLocaleDateString("fr-FR", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Workflow" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Recherche titre / mot-clé / URL..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lignes du planning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{selectedCount} selectionnee(s)</Badge>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedCount === 0 || hasPendingBulkAction}
                onClick={() => createContentBatchMutation.mutate(selectedItemIds)}
              >
                Creer contenus selectionnes
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={selectedCount === 0 || hasPendingBulkAction}
                onClick={() => deleteBatchMutation.mutate(selectedItemIds)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer selection
              </Button>
            </div>
            {(isLoadingCalendars || isLoadingItems) ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune ligne de planning pour ce filtre.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-3">
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={(value) => toggleSelectAllVisible(Boolean(value))}
                          aria-label="Selectionner toutes les lignes visibles"
                        />
                      </th>
                      <th className="py-2 pr-3">Mois</th>
                      <th className="py-2 pr-3">Jour</th>
                      <th className="py-2 pr-3">Titre</th>
                      <th className="py-2 pr-3">Mot-clé</th>
                      <th className="py-2 pr-3">Brief</th>
                      <th className="py-2 pr-3">Contenu</th>
                      <th className="py-2 pr-3">Statut Sheet</th>
                      <th className="py-2 pr-3">Workflow</th>
                      <th className="py-2 pr-3">URL</th>
                      <th className="py-2 pr-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b align-top">
                        <td className="py-2 pr-3">
                          <Checkbox
                            checked={selectedItemIds.includes(item.id)}
                            onCheckedChange={(value) => toggleItemSelection(item.id, Boolean(value))}
                            aria-label={`Selectionner la ligne ${item.id}`}
                          />
                        </td>
                        <td className="py-2 pr-3">{item.month_label || "-"}</td>
                        <td className="py-2 pr-3">{item.day_label || "-"}</td>
                        <td className="py-2 pr-3 font-medium max-w-[260px]">
                          {editingItemId === item.id ? (
                            <Input
                              value={editDraft.title || ""}
                              onChange={(e) => setEditDraft((prev) => ({ ...prev, title: e.target.value }))}
                            />
                          ) : (
                            <div className="line-clamp-3">{item.title}</div>
                          )}
                        </td>
                        <td className="py-2 pr-3 max-w-[220px]">
                          {editingItemId === item.id ? (
                            <Input
                              value={editDraft.primary_keyword || ""}
                              onChange={(e) => setEditDraft((prev) => ({ ...prev, primary_keyword: e.target.value }))}
                            />
                          ) : (
                            <div className="line-clamp-3">{item.primary_keyword || "-"}</div>
                          )}
                        </td>
                        <td className="py-2 pr-3 max-w-[220px]">
                          {editingItemId === item.id ? (
                            <Textarea
                              value={editDraft.brief_text || ""}
                              onChange={(e) => setEditDraft((prev) => ({ ...prev, brief_text: e.target.value }))}
                              rows={4}
                            />
                          ) : (
                            <div className="line-clamp-3">{item.brief_text || "-"}</div>
                          )}
                        </td>
                        <td className="py-2 pr-3 max-w-[220px]">
                          {editingItemId === item.id ? (
                            <Textarea
                              value={editDraft.content_seed || ""}
                              onChange={(e) => setEditDraft((prev) => ({ ...prev, content_seed: e.target.value }))}
                              rows={4}
                            />
                          ) : (
                            <div className="line-clamp-3">{item.content_seed || "-"}</div>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {editingItemId === item.id ? (
                            <Input
                              value={editDraft.raw_status || ""}
                              onChange={(e) => setEditDraft((prev) => ({ ...prev, raw_status: e.target.value }))}
                            />
                          ) : (
                            item.raw_status || "-"
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {editingItemId === item.id ? (
                            <div className="space-y-2 min-w-[170px]">
                              <Select
                                value={editDraft.workflow_status || item.workflow_status}
                                onValueChange={(value) => setEditDraft((prev) => ({ ...prev, workflow_status: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todo">todo</SelectItem>
                                  <SelectItem value="ready">ready</SelectItem>
                                  <SelectItem value="scheduled">scheduled</SelectItem>
                                  <SelectItem value="published">published</SelectItem>
                                  <SelectItem value="other">other</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select
                                value={editDraft.target_editorial_status || item.target_editorial_status}
                                onValueChange={(value) => setEditDraft((prev) => ({ ...prev, target_editorial_status: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="en attente">en attente</SelectItem>
                                  <SelectItem value="à réviser">à réviser</SelectItem>
                                  <SelectItem value="validé">validé</SelectItem>
                                  <SelectItem value="publié">publié</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <Badge className={workflowStatusBadge(item.workflow_status)}>
                              {item.workflow_status}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 pr-3 w-[300px] max-w-[300px]">
                          {editingItemId === item.id ? (
                            <div className="space-y-2">
                              <Input
                                value={editDraft.source_url || ""}
                                onChange={(e) => setEditDraft((prev) => ({ ...prev, source_url: e.target.value }))}
                                placeholder="https://..."
                              />
                              <Input
                                type="date"
                                value={editDraft.publication_date || ""}
                                onChange={(e) => setEditDraft((prev) => ({ ...prev, publication_date: e.target.value }))}
                              />
                            </div>
                          ) : (
                            item.source_url ? (
                              <a
                                className="block max-w-[300px] truncate text-blue-600 hover:underline"
                                href={item.source_url}
                                target="_blank"
                                rel="noreferrer"
                                title={item.source_url}
                              >
                                {item.source_url}
                              </a>
                            ) : "-"
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex gap-2">
                            {editingItemId === item.id ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updateItemMutation.isPending}
                                  onClick={() => saveEdit(item.id)}
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Enregistrer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={updateItemMutation.isPending}
                                  onClick={cancelEdit}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Annuler
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={editingItemId !== null}
                                  onClick={() => beginEdit(item)}
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Modifier
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={createContentMutation.isPending || hasPendingBulkAction}
                                  onClick={() => createContentMutation.mutate(item.id)}
                                >
                                  Creer contenu
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={deleteItemMutation.isPending || hasPendingBulkAction}
                                  onClick={() => deleteItemMutation.mutate(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Supprimer
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

