import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UnifiedHeader } from "@/components/layout/unified-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, RefreshCw, Bell, Moon, Sun, Plus, Globe, MessageSquare, Edit, Check, X } from "lucide-react";
import { AddWebsiteDialog } from "@/components/website/add-website-dialog";
import { EditPromptDialog } from "@/components/prompts/edit-prompt-dialog";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useSite } from "@/lib/site-context";
import { apiRequest } from "@/lib/queryClient";
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
import type { Website, SystemPrompt } from "@shared/schema";

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

  const { data: websites = [] } = useQuery<any[]>({
    queryKey: ["/api/sites"],
  });

  const { data: promptsData, isLoading: isLoadingPrompts } = useQuery({
    queryKey: ["/api/sites", currentSite?.id, "prompts"],
    queryFn: async () => {
      if (!currentSite?.id) return { prompts: [] };
      const res = await apiRequest("GET", `/api/sites/${currentSite.id}/prompts`);
      return res.json();
    },
    enabled: !!currentSite?.id,
  });

  const systemPrompts: SystemPrompt[] = promptsData?.prompts || [];

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
    mutationFn: async ({ id, data }: { id: string; data: Partial<SystemPrompt> & { siteId?: number } }) => {
      return await apiRequest("PUT", `/api/system-prompts/${id}`, data);
    },
    onSuccess: () => {
      // Invalidation stricte pour forcer le rafraîchissement de la liste des prompts du site
      queryClient.invalidateQueries({
        queryKey: ["/api/sites", currentSite?.id, "prompts"]
      });
      // Invalider aussi les prompts system globaux au cas où
      queryClient.invalidateQueries({
        queryKey: ["/api/system-prompts"]
      });

      setEditingPrompt(null);
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

  const deleteSystemPromptMutation = useMutation({
    mutationFn: async (promptId: string) => {
      // Pour supprimer un prompt custom, on utilise l'endpoint delete site prompt
      // Le promptId ici est l'ID global, mais on a besoin de la plateforme
      // On retrouvera la plateforme via le prompt object dans le handler
      await apiRequest("DELETE", `/api/system-prompts/${promptId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/sites", currentSite?.id, "prompts"]
      });
      toast({
        title: "Succès",
        description: "Prompt système supprimé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le prompt système",
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

  const handleTogglePromptActive = (prompt: SystemPrompt) => {
    updateSystemPromptMutation.mutate({
      id: String(prompt.id),
      data: { isActive: !prompt.isActive }
    });
  };

  const handleDeletePrompt = (prompt: SystemPrompt) => {
    // Si c'est un prompt custom, on le supprime (revient au default)
    // Si c'est un global, on ne peut pas vraiment le supprimer d'ici sans être admin, 
    // mais pour l'instant on garde la logique existante ou on adapte.
    // L'endpoint DELETE /api/sites/:id/prompts/:platform est préférable pour les custom.

    if (prompt.platform && currentSite?.id) {
      // Use the specific delete endpoint to reset to global
      apiRequest("DELETE", `/api/sites/${currentSite.id}/prompts/${prompt.platform}`)
        .then(() => {
          queryClient.invalidateQueries({
            queryKey: ["/api/sites", currentSite.id, "prompts"]
          });
          toast({ title: "Succès", description: "Prompt réinitialisé au défaut" });
        })
        .catch((e) => toast({ title: "Erreur", description: "Erreur suppression", variant: "destructive" }));
    } else {
      deleteSystemPromptMutation.mutate(String(prompt.id));
    }
  };

  const activePrompt = systemPrompts.find(p => p.isActive);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

          {/* Gestion des prompts système */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Prompts système IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activePrompt && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-green-900 dark:text-green-100">
                        Prompt actif : {activePrompt.name || 'Sans nom'}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        {activePrompt.description || 'Aucune description'}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {systemPrompts?.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${prompt.isActive
                      ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {prompt.name || 'Prompt sans nom'}
                        </div>
                        {prompt.isActive && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                            Actif
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {prompt.description || 'Aucune description'}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {prompt.promptSystem?.length || 0} caractères
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!prompt.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePromptActive(prompt)}
                          disabled={updateSystemPromptMutation.isPending}
                          data-testid={`button-activate-prompt-${prompt.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPrompt(prompt)}
                        data-testid={`button-edit-prompt-${prompt.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeletePrompt(prompt)}
                        data-testid={`button-delete-prompt-${prompt.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                    </div>
                  </div>
                ))}

                {(!systemPrompts || systemPrompts.length === 0) && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Aucun prompt système configuré. Les prompts par défaut seront utilisés.
                  </div>
                )}
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

      {/* Dialog d'édition de prompt système */}
      {editingPrompt && (
        <EditPromptDialog
          prompt={editingPrompt}
          open={!!editingPrompt}
          onOpenChange={(open) => !open && setEditingPrompt(null)}
          onSave={(data) => {
            updateSystemPromptMutation.mutate({
              id: String(editingPrompt.id),
              data: { ...data, siteId: currentSite?.id }
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
