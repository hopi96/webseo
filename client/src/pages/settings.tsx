import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, RefreshCw, Bell, Moon, Sun, Plus, Globe } from "lucide-react";
import { AddWebsiteDialog } from "@/components/website/add-website-dialog";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
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
import type { Website } from "@shared/schema";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  const [showAddWebsiteDialog, setShowAddWebsiteDialog] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingWebsite, setAnalyzingWebsite] = useState<string>("");

  const { data: websites } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
  });

  const deleteWebsiteMutation = useMutation({
    mutationFn: async (websiteId: number) => {
      await apiRequest("DELETE", `/api/websites/${websiteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
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
      const response = await apiRequest("POST", `/api/websites/${websiteId}/analyze`);
      return response.json();
    },
    onSuccess: () => {
      setIsAnalyzing(false);
      setAnalyzingWebsite("");
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/websites", "seo-analysis"] });
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

  const handleDeleteWebsite = (websiteId: number) => {
    deleteWebsiteMutation.mutate(websiteId);
  };

  const handleAnalyzeWebsite = (websiteId: number) => {
    analyzeWebsiteMutation.mutate(websiteId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="px-6 py-6">
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
