import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UnifiedHeader } from "@/components/layout/unified-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, RefreshCw, Bell, Moon, Sun, Plus, Globe, MessageSquare, Edit } from "lucide-react";
import { AddWebsiteDialog } from "@/components/website/add-website-dialog";
import { EditPromptDialog } from "@/components/prompts/edit-prompt-dialog";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useSite } from "@/lib/site-context";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { SystemPrompt } from "@shared/schema";

type SitePrompt = SystemPrompt & { isCustom?: boolean };

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { currentSite } = useSite();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  const [showAddWebsiteDialog, setShowAddWebsiteDialog] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingWebsite, setAnalyzingWebsite] = useState<string>("");
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [editingPromptSiteId, setEditingPromptSiteId] = useState<number | null>(null);
  const [promptsDialogOpen, setPromptsDialogOpen] = useState(false);
  const [selectedPromptSiteId, setSelectedPromptSiteId] = useState<number | null>(null);

  const { data: websites = [] } = useQuery<any[]>({
    queryKey: ["/api/sites"],
  });

  useEffect(() => {
    if (promptsDialogOpen) {
      setSelectedPromptSiteId(null);
    }
  }, [promptsDialogOpen]);

  const { data: promptsData, isLoading: isLoadingPrompts } = useQuery({
    queryKey: ["/api/sites", selectedPromptSiteId, "prompts"],
    queryFn: async () => {
      if (!selectedPromptSiteId) return { prompts: [] };
      const res = await apiRequest("GET", `/api/sites/${selectedPromptSiteId}/prompts`);
      return res.json();
    },
    enabled: !!selectedPromptSiteId && promptsDialogOpen,
  });

  const systemPrompts: SitePrompt[] = promptsData?.prompts || [];
  const selectedPromptSite = websites?.find((website) => website.id === selectedPromptSiteId);
  const totalPromptsCount = promptsData?.totalCount ?? systemPrompts.length;
  const customPromptsCount =
    promptsData?.customCount ?? systemPrompts.filter((prompt) => prompt.isCustom).length;

  const deleteWebsiteMutation = useMutation({
    mutationFn: async (websiteId: number) => {
      await apiRequest("DELETE", `/api/sites/${websiteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      toast({
        title: "Succès",
        description: "Site web supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le site web",
        variant: "destructive",
      });
    },
  });

  const analyzeWebsiteMutation = useMutation({
    mutationFn: async (websiteId: number) => {
      const website = websites?.find(w => w.id === websiteId);
      if (website) {
        setIsAnalyzing(true);
        setAnalyzingWebsite(website.name);
      }
      const response = await apiRequest("POST", `/api/sites/${websiteId}/analyze`);
      return response.json();
    },
    onSuccess: () => {
      setIsAnalyzing(false);
      setAnalyzingWebsite("");
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      toast({
        title: "Succès",
        description: "Analyse du site web terminée avec succès",
      });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      setAnalyzingWebsite("");
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'analyser le site web",
        variant: "destructive",
      });
    },
  });

  const updateSystemPromptMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      siteId,
    }: {
      id: string;
      data: Partial<SystemPrompt>;
      siteId?: number;
    }) => {
      return await apiRequest("PUT", `/api/system-prompts/${id}`, {
        ...data,
        siteId,
      });
    },
    onSuccess: (_data, variables) => {
      const targetSiteId = variables?.siteId ?? selectedPromptSiteId ?? currentSite?.id;
      if (targetSiteId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/sites", targetSiteId, "prompts"],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["/api/system-prompts"],
      });

      setEditingPrompt(null);
      setEditingPromptSiteId(null);
      toast({
        title: "Succès",
        description: "Prompt système et configuration mis à jour.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le prompt système",
        variant: "destructive",
      });
    },
  });


  const handleDeleteWebsite = (websiteId: number) => {
    deleteWebsiteMutation.mutate(websiteId);
  };

  const handleAnalyzeWebsite = (websiteId: number) => {
    analyzeWebsiteMutation.mutate(websiteId);
  };

  const handleEditPrompt = (prompt: SitePrompt) => {
    if (!selectedPromptSiteId) {
      toast({
        title: "Site requis",
        description: "Selectionnez un site avant de modifier les prompts.",
        variant: "destructive",
      });
      return;
    }
    setEditingPrompt(prompt);
    setEditingPromptSiteId(selectedPromptSiteId);
  };

  const handleDeletePrompt = (prompt: SitePrompt, siteId?: number | null) => {
    const isCustom = prompt.isCustom === true;

    if (!isCustom) {
      return;
    }

    if (!siteId || !prompt.platform) {
      toast({
        title: "Site requis",
        description: "Selectionnez un site avant de modifier les prompts.",
        variant: "destructive",
      });
      return;
    }
    apiRequest("DELETE", `/api/sites/${siteId}/prompts/${prompt.platform}`)
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ["/api/sites", siteId, "prompts"],
        });
        toast({ title: "Succes", description: "Prompt reinitialise au defaut" });
      })
      .catch(() =>
        toast({ title: "Erreur", description: "Erreur suppression", variant: "destructive" })
      );
  };

  return (
    <div className="min-h-screen app-shell page-enter">
      <UnifiedHeader />

      <main className="px-6 py-6 smart-scroll-vertical">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Paramètres</h1>

        <div className="space-y-4">
          {/* Apparence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {theme === "dark" ? <Moon className="w-5 h-5 mr-2" /> : <Sun className="w-5 h-5 mr-2" />}
                Apparence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode" className="text-sm font-medium">
                    Mode sombre
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Basculer entre les thèmes clair et sombre
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications" className="text-sm font-medium">
                    Notifications push
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recevoir des notifications sur les changements SEO
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-analysis" className="text-sm font-medium">
                    Analyse automatique
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Analyser automatiquement les sites web chaque semaine
                  </p>
                </div>
                <Switch
                  id="auto-analysis"
                  checked={autoAnalysis}
                  onCheckedChange={setAutoAnalysis}
                />
              </div>
            </CardContent>
          </Card>

          {/* Gestion des prompts systeme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Prompts systeme IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Les prompts sont lies a chaque site web. Ouvrez la fenetre de gestion pour choisir un site
                  puis modifier ses prompts.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPromptSiteId(null);
                    setPromptsDialogOpen(true);
                  }}
                >
                  Gerer les prompts par site
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gestion des sites web */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Gérer les sites web
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button
                  onClick={() => setShowAddWebsiteDialog(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un site web
                </Button>
              </div>
              <div className="space-y-3">
                {websites?.map((website) => (
                  <div key={website.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {website.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {website.url}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAnalyzeWebsite(website.id)}
                        disabled={analyzeWebsiteMutation.isPending}
                      >
                        <RefreshCw className={`w-4 h-4 ${analyzeWebsiteMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer le site web</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer "{website.name}" ?
                              Cette action ne peut pas être annulée et supprimera toutes les données SEO associées.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteWebsite(website.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}

                {(!websites || websites.length === 0) && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Aucun site web ajouté pour le moment. Ajoutez votre premier site depuis le tableau de bord.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* À propos */}
          <Card>
            <CardHeader>
              <CardTitle>À propos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Dernière mise à jour</span>
                  <span className="font-medium">Juin 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Build</span>
                  <span className="font-medium">SEO-2025.6.1</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog d'ajout de site web */}
      <AddWebsiteDialog
        open={showAddWebsiteDialog}
        onOpenChange={setShowAddWebsiteDialog}
      />

      <Dialog open={promptsDialogOpen} onOpenChange={setPromptsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prompts par site</DialogTitle>
            <DialogDescription>
              Selectionnez un site puis modifiez les prompts associes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Site web</Label>
              <Select
                value={selectedPromptSiteId ? String(selectedPromptSiteId) : ""}
                onValueChange={(value) => setSelectedPromptSiteId(Number(value))}
                disabled={!websites || websites.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un site" />
                </SelectTrigger>
                <SelectContent>
                  {websites?.map((website) => (
                    <SelectItem key={website.id} value={String(website.id)}>
                      {website.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!websites || websites.length === 0 ? (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Ajoutez un site pour pouvoir gerer les prompts.
              </div>
            ) : !selectedPromptSite ? (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Selectionnez un site pour afficher les prompts.
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{selectedPromptSite.name}</span>
                <span>-</span>
                <span>{totalPromptsCount} prompts</span>
                <span>-</span>
                <span>{customPromptsCount} personnalises</span>
              </div>
            )}

            <div className="space-y-3">
              {!selectedPromptSiteId ? (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  Selectionnez un site pour voir la liste des prompts.
                </div>
              ) : isLoadingPrompts ? (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  Chargement des prompts...
                </div>
              ) : systemPrompts.length === 0 ? (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  Aucun prompt disponible pour ce site.
                </div>
              ) : (
                systemPrompts.map((prompt) => {
                  const isCustom = prompt.isCustom === true;
                  const promptLabel = prompt.name || prompt.platform || "Prompt";

                  return (
                    <div key={`${prompt.platform ?? prompt.id}`} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{promptLabel}</span>
                            {prompt.platform && (
                              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                {prompt.platform}
                              </span>
                            )}
                            <Badge variant={isCustom ? "secondary" : "outline"}>
                              {isCustom ? "Personnalise" : "Global"}
                            </Badge>
                            {prompt.isActive === false && (
                              <span className="text-xs text-muted-foreground">Inactif</span>
                            )}
                          </div>
                          {prompt.description && (
                            <p className="text-xs text-muted-foreground">{prompt.description}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditPrompt(prompt)}>
                            <Edit className="w-4 h-4" />
                            Modifier
                          </Button>
                          {isCustom && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                  Reinitialiser
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reinitialiser le prompt</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Ce prompt personnalise sera supprime et le prompt global sera utilise.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePrompt(prompt, selectedPromptSiteId)}
                                    className="bg-destructive text-destructive-foreground hover:opacity-90"
                                  >
                                    Reinitialiser
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromptsDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition de prompt système */}
      {editingPrompt && (
        <EditPromptDialog
          prompt={editingPrompt}
          open={!!editingPrompt}
          onOpenChange={(open) => {
            if (!open) {
              setEditingPrompt(null);
              setEditingPromptSiteId(null);
            }
          }}
          onSave={(data) => {
            const targetSiteId = editingPromptSiteId ?? selectedPromptSiteId ?? currentSite?.id;
            if (!targetSiteId) {
              toast({
                title: "Site requis",
                description: "Selectionnez un site avant de modifier les prompts.",
                variant: "destructive",
              });
              return;
            }
            updateSystemPromptMutation.mutate({
              id: String(editingPrompt.id),
              data,
              siteId: targetSiteId,
            });
          }}
        />
      )}

      {/* Dialog d'analyse en cours */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Analyse SEO en cours
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Analyse de {analyzingWebsite} en cours...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Cela peut prendre quelques minutes
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
