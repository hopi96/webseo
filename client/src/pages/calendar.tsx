import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UnifiedHeader } from "@/components/layout/unified-header";

import { EditArticleDialog } from "@/components/editorial/edit-article-dialog";
import { AddArticleDialog } from "@/components/editorial/add-article-dialog";
import { DeleteArticleDialog } from "@/components/editorial/delete-article-dialog";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Edit3, 
  Clock, 
  Tag,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  Square,
  CheckSquare,
  MoreHorizontal
} from "lucide-react";
import type { EditorialContent } from "@shared/schema";

// Types pour le calendrier éditorial (basé sur le schéma de la base de données)
interface EditorialEvent {
  id: number;
  title: string;
  description: string;
  date: Date;
  type: string; // twitter, instagram, article, newsletter
  status: string; // en attente, à réviser, en cours, publié
  hasImage: boolean;
  siteId: number;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingArticle, setEditingArticle] = useState<EditorialContent | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<EditorialContent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [addDialogDate, setAddDialogDate] = useState<string>("");
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<number | null>(null);
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string | null>(null);

  // États pour l'édition en lot
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("");

  // États pour les statistiques cliquables
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [statsFilter, setStatsFilter] = useState<{kind: 'status' | 'type', value: string} | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const { toast } = useToast();

  // Initialiser le chatbot n8n
  useEffect(() => {
    createChat({
      webhookUrl: 'https://doseit.app.n8n.cloud/webhook/7682526e-bf2c-4be3-8a9c-161ea2c7098a/chat',
      mode: 'window',
      defaultLanguage: 'en',
      initialMessages: [
        'Bonjour ! 👋',
        'Je suis votre assistant IA pour le calendrier éditorial. Comment puis-je vous aider aujourd\'hui ?'
      ],
      i18n: {
        en: {
          title: 'Assistant IA Éditorial',
          subtitle: 'Créez du contenu SEO optimisé avec l\'aide de l\'IA',
          footer: '',
          getStarted: 'Nouvelle conversation',
          inputPlaceholder: 'Tapez votre question...',
          closeButtonTooltip: 'Fermer le chat',
        },
      },
    });
  }, []);

  // Récupérer les contenus éditoriaux depuis l'API
  const { data: editorialContent = [], isLoading } = useQuery({
    queryKey: ['/api/editorial-content'],
    queryFn: async (): Promise<EditorialContent[]> => {
      const response = await fetch('/api/editorial-content');
      if (!response.ok) {
        throw new Error('Failed to fetch editorial content');
      }
      return response.json();
    }
  });

  // Récupérer les sites depuis Airtable
  const { data: sites = [] } = useQuery({
    queryKey: ['/api/sites-airtable'],
    queryFn: async (): Promise<Array<{id: number, name: string, url: string}>> => {
      const response = await fetch('/api/sites-airtable');
      if (!response.ok) {
        throw new Error('Failed to fetch sites');
      }
      return response.json();
    }
  });

  // Fonction pour récupérer le nom du site par ID
  const getSiteName = (siteId: number) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : `Site ${siteId}`;
  };

  // Transformer les données de l'API en format pour le calendrier
  const allEvents: EditorialEvent[] = editorialContent.map(content => ({
    id: content.id,
    title: content.contentText.length > 50 ? content.contentText.substring(0, 50) + '...' : content.contentText,
    description: content.contentText,
    date: new Date(content.dateDePublication),
    type: content.typeContent,
    status: content.statut,
    hasImage: content.hasImage || false,
    siteId: content.idSite
  }));

  // Filtrer les événements par site et plateforme sélectionnés
  const events = allEvents.filter(event => {
    const siteMatch = selectedSiteFilter ? event.siteId === selectedSiteFilter : true;
    const platformMatch = selectedPlatformFilter ? event.type === selectedPlatformFilter : true;
    return siteMatch && platformMatch;
  });

  // Fonction helper pour vérifier si un événement appartient au mois courant
  const isSameMonth = (eventDate: Date, referenceDate: Date) => {
    return eventDate.getFullYear() === referenceDate.getFullYear() && 
           eventDate.getMonth() === referenceDate.getMonth();
  };

  // Événements du mois courant uniquement (optimisé avec useMemo)
  const monthlyEvents = useMemo(() => 
    events.filter(event => isSameMonth(event.date, currentDate)), 
    [events, currentDate]
  );

  // Liste filtrée pour le dialogue de statistiques (optimisé avec useMemo)
  const filteredList = useMemo(() => {
    if (!statsFilter) return [];
    
    return monthlyEvents.filter(event => {
      if (statsFilter.kind === 'status') {
        return event.status === statsFilter.value;
      } else if (statsFilter.kind === 'type') {
        return event.hasImage === (statsFilter.value === 'hasImage');
      }
      return false;
    });
  }, [monthlyEvents, statsFilter]);

  // Fonction pour obtenir les jours du mois
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Ajouter les jours vides du début
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ajouter les jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Fonction pour obtenir les événements d'une date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const handleEditArticle = (event: EditorialEvent) => {
    // Trouver le contenu éditorial correspondant
    const content = editorialContent.find(c => c.id === event.id);
    if (content) {
      setEditingArticle(content);
      setIsEditDialogOpen(true);
    }
  };

  const handleDeleteArticle = (event: EditorialEvent) => {
    // Trouver le contenu éditorial correspondant
    const content = editorialContent.find(c => c.id === event.id);
    if (content) {
      setDeletingArticle(content);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingArticle(null);
  };

  const handleAddArticle = (date?: Date) => {
    const selectedDateString = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    setAddDialogDate(selectedDateString);
    setIsAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false);
    setAddDialogDate("");
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingArticle(null);
  };

  // Fonctions pour la gestion de la sélection en lot
  const toggleArticleSelection = (articleId: number) => {
    const newSelection = new Set(selectedArticles);
    if (newSelection.has(articleId)) {
      newSelection.delete(articleId);
    } else {
      newSelection.add(articleId);
    }
    setSelectedArticles(newSelection);
  };

  const selectAllVisible = () => {
    const visibleArticleIds = new Set(events.map(event => event.id));
    setSelectedArticles(visibleArticleIds);
  };

  const clearSelection = () => {
    setSelectedArticles(new Set());
  };

  const enterSelectionMode = () => {
    setIsSelectionMode(true);
    clearSelection();
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    clearSelection();
    setBulkStatus("");
  };

  // Mutation pour la mise à jour en lot
  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { ids: string[], statut: string }) => {
      const response = await apiRequest("PUT", "/api/editorial-content/bulk-update", data);
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Mise à jour réussie",
        description: `${result.updated} article(s) mis à jour avec le statut "${result.message.split('"')[1]}"`,
      });
      
      // Rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['/api/editorial-content'] });
      
      // Réinitialiser la sélection
      exitSelectionMode();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour les articles.",
        variant: "destructive",
      });
    }
  });

  const handleBulkUpdate = () => {
    if (selectedArticles.size === 0) {
      toast({
        title: "Aucun article sélectionné",
        description: "Veuillez sélectionner au moins un article.",
        variant: "destructive",
      });
      return;
    }

    if (!bulkStatus) {
      toast({
        title: "Statut requis",
        description: "Veuillez choisir un nouveau statut.",
        variant: "destructive",
      });
      return;
    }

    // Convertir les IDs en strings pour l'API
    const selectedIds = Array.from(selectedArticles).map(id => {
      const article = editorialContent.find(content => content.id === id);
      return article?.airtableId || article?.id.toString() || id.toString();
    });

    bulkUpdateMutation.mutate({
      ids: selectedIds,
      statut: bulkStatus
    });
  };

  // Fonction pour obtenir la couleur selon le type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'xtwitter': return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200';
      case 'instagram': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'facebook': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pinterest': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'google my business': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'article': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'newsletter': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Fonction pour obtenir la couleur selon le statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en attente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'à réviser': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'en cours': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'publié': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <UnifiedHeader />
      
      <main className="container mx-auto px-4 pt-20 pb-20 max-w-7xl">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Calendrier Éditorial
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Planifiez et organisez votre contenu SEO
              </p>
            </div>
            <Button 
              onClick={() => handleAddArticle()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau contenu
            </Button>
          </div>
          
          {/* Filtres */}
          <div className="space-y-4 mb-4">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex flex-wrap items-center gap-4">
              {/* Filtre par site */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Site :
                </label>
                <Select
                  value={selectedSiteFilter?.toString() || "all"}
                  onValueChange={(value) => setSelectedSiteFilter(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Tous les sites" />
                  </SelectTrigger>
                  <SelectContent className="smart-scroll-vertical max-h-60">
                    <SelectItem value="all">Tous les sites</SelectItem>
                    {sites.sort((a, b) => b.id - a.id).map((site) => (
                      <SelectItem key={site.id} value={site.id.toString()}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre par plateforme */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Plateforme :
                </label>
                <Select
                  value={selectedPlatformFilter || "all"}
                  onValueChange={(value) => setSelectedPlatformFilter(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Toutes les plateformes" />
                  </SelectTrigger>
                  <SelectContent className="smart-scroll-vertical max-h-60">
                    <SelectItem value="all">Toutes les plateformes</SelectItem>
                    <SelectItem value="xtwitter">X (Twitter)</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="pinterest">Pinterest</SelectItem>
                    <SelectItem value="google my business">Google My Business</SelectItem>
                    <SelectItem value="article">Article de blog</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Bouton Mode Sélection */}
              <div className="flex items-center gap-2">
                {!isSelectionMode ? (
                  <Button
                    variant="outline"
                    onClick={enterSelectionMode}
                    className="text-sm"
                    data-testid="enable-selection-mode"
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Mode sélection
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={exitSelectionMode}
                    className="text-sm"
                    data-testid="disable-selection-mode"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Annuler sélection
                  </Button>
                )}
              </div>
              </div>
            </div>
            
            {/* Barre d'actions pour la sélection en lot */}
            {isSelectionMode && selectedArticles.size > 0 && (
              <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
                <Card className="bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedArticles.size} article(s) sélectionné(s)
                      </span>
                      
                      <Select value={bulkStatus} onValueChange={setBulkStatus}>
                        <SelectTrigger className="w-48" data-testid="bulk-status-select">
                          <SelectValue placeholder="Nouveau statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en attente">En attente</SelectItem>
                          <SelectItem value="à réviser">À réviser</SelectItem>
                          <SelectItem value="validé">Validé</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        onClick={handleBulkUpdate}
                        disabled={!bulkStatus || bulkUpdateMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        data-testid="apply-bulk-update"
                      >
                        {bulkUpdateMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Mise à jour...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Appliquer
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={clearSelection}
                        size="sm"
                        data-testid="clear-selection"
                      >
                        Tout désélectionner
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Compteur de résultats */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                📊 {events.length} contenu(s) affiché(s)
                {selectedSiteFilter && ` • Site: ${getSiteName(selectedSiteFilter)}`}
                {selectedPlatformFilter && ` • Plateforme: ${selectedPlatformFilter === 'xtwitter' ? 'X (Twitter)' : 
                  selectedPlatformFilter === 'google my business' ? 'Google My Business' :
                  selectedPlatformFilter === 'article' ? 'Article de blog' :
                  selectedPlatformFilter.charAt(0).toUpperCase() + selectedPlatformFilter.slice(1)}`}
              </div>
              
              {(selectedSiteFilter || selectedPlatformFilter) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedSiteFilter(null);
                    setSelectedPlatformFilter(null);
                  }}
                  className="text-xs"
                >
                  ✕ Effacer les filtres
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendrier principal */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth(-1)}
                      className="p-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth(1)}
                      className="p-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Grille du calendrier */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {/* En-têtes des jours */}
                  {dayNames.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                  
                  {/* Jours du mois */}
                  {days.map((day, index) => (
                    <div
                      key={index}
                      className={`
                        min-h-[80px] p-1 border border-gray-100 dark:border-gray-700 rounded-lg group
                        ${day ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
                        ${selectedDate && day && selectedDate.toDateString() === day.toDateString() 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' 
                          : ''
                        }
                      `}
                      onClick={() => day && setSelectedDate(day)}
                    >
                      {day && (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {day.getDate()}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddArticle(day);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="space-y-1">
                            {getEventsForDate(day).slice(0, 2).map(event => (
                              <div
                                key={event.id}
                                className="text-xs p-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 truncate"
                              >
                                {event.title}
                              </div>
                            ))}
                            {getEventsForDate(day).length > 2 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                +{getEventsForDate(day).length - 2} autres
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-6">
            {/* Événements du jour sélectionné */}
            {selectedDate && (
              <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedDate.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3 smart-scroll-vertical max-h-80">
                    {getEventsForDate(selectedDate).map(event => (
                      <div 
                        key={event.id} 
                        className={`p-3 border rounded-lg transition-colors ${
                          isSelectionMode && selectedArticles.has(event.id)
                            ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                            : 'border-gray-100 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-3 flex-1">
                            {isSelectionMode && (
                              <div className="pt-1">
                                <input
                                  type="checkbox"
                                  checked={selectedArticles.has(event.id)}
                                  onChange={() => toggleArticleSelection(event.id)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                  data-testid={`checkbox-article-${event.id}`}
                                />
                              </div>
                            )}
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {event.title}
                            </h4>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                              onClick={() => handleEditArticle(event)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20"
                              data-testid={`delete-article-${event.id}`}
                              title="Supprimer cet article"
                              onClick={() => handleDeleteArticle(event)}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {getSiteName(event.siteId)}
                          </Badge>
                          <Badge className={getTypeColor(event.type)}>
                            {event.type}
                          </Badge>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                          {event.hasImage && (
                            <Badge variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              Image
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {getEventsForDate(selectedDate).length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun contenu prévu pour cette date</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={() => handleAddArticle(selectedDate)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter du contenu
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistiques rapides */}
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Statistiques du mois
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Chargement des données...
                    </div>
                  ) : (
                    <>
                      <div 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => {
                          const count = monthlyEvents.filter(e => e.status === 'en attente').length;
                          if (count > 0) {
                            setStatsFilter({kind: 'status', value: 'en attente'});
                            setStatsDialogOpen(true);
                          }
                        }}
                        data-testid="stat-en-attente"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Contenu en attente
                        </span>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {monthlyEvents.filter(e => e.status === 'en attente').length}
                        </Badge>
                      </div>
                      <div 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => {
                          const count = monthlyEvents.filter(e => e.status === 'à réviser').length;
                          if (count > 0) {
                            setStatsFilter({kind: 'status', value: 'à réviser'});
                            setStatsDialogOpen(true);
                          }
                        }}
                        data-testid="stat-a-reviser"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          À réviser
                        </span>
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          {monthlyEvents.filter(e => e.status === 'à réviser').length}
                        </Badge>
                      </div>
                      <div 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => {
                          const count = monthlyEvents.filter(e => e.status === 'validé').length;
                          if (count > 0) {
                            setStatsFilter({kind: 'status', value: 'validé'});
                            setStatsDialogOpen(true);
                          }
                        }}
                        data-testid="stat-valide"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Validé
                        </span>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {monthlyEvents.filter(e => e.status === 'validé').length}
                        </Badge>
                      </div>
                      <div 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => {
                          const count = monthlyEvents.filter(e => e.status === 'publié').length;
                          if (count > 0) {
                            setStatsFilter({kind: 'status', value: 'publié'});
                            setStatsDialogOpen(true);
                          }
                        }}
                        data-testid="stat-publie"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Publié
                        </span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {monthlyEvents.filter(e => e.status === 'publié').length}
                        </Badge>
                      </div>
                      <div 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => {
                          const count = monthlyEvents.filter(e => e.hasImage).length;
                          if (count > 0) {
                            setStatsFilter({kind: 'type', value: 'hasImage'});
                            setStatsDialogOpen(true);
                          }
                        }}
                        data-testid="stat-avec-images"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Avec images
                        </span>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {monthlyEvents.filter(e => e.hasImage).length}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dialog d'édition d'article */}
      {editingArticle && (
        <EditArticleDialog
          open={isEditDialogOpen}
          onOpenChange={handleCloseEditDialog}
          article={editingArticle}
        />
      )}

      {/* Dialog d'ajout d'article */}
      <AddArticleDialog
        open={isAddDialogOpen}
        onOpenChange={handleCloseAddDialog}
        defaultDate={addDialogDate}
      />

      {/* Dialog de suppression d'article */}
      {deletingArticle && (
        <DeleteArticleDialog
          open={isDeleteDialogOpen}
          onOpenChange={handleCloseDeleteDialog}
          article={deletingArticle}
        />
      )}

      {/* Conteneur pour le chatbot n8n */}
      <div id="n8n-chat"></div>
    </div>
  );
}