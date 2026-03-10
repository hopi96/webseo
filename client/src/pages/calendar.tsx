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
import { useSite } from "@/lib/site-context";

import { EditArticleDialog } from "@/components/editorial/edit-article-dialog";
import { AddArticleDialog } from "@/components/editorial/add-article-dialog";
import { DeleteArticleDialog } from "@/components/editorial/delete-article-dialog";
import { ArticlePreviewDialog } from "@/components/editorial/article-preview-dialog";
import { ExpressContentDialog } from "@/components/editorial/express-content-dialog";
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
  Eye,
  Mail,
  Music2,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Linkedin,
  FileText,
  Building2,
  Image as ImageIcon,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewingArticle, setPreviewingArticle] = useState<EditorialContent | null>(null);
  const [addDialogDate, setAddDialogDate] = useState<string>("");
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'agenda'>('month');

  // États pour le dialogue Contenu Express
  const [isExpressDialogOpen, setIsExpressDialogOpen] = useState(false);
  const [expressDialogDate, setExpressDialogDate] = useState<string>("");

  // États pour l'édition en lot
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("");

  // États pour les statistiques cliquables
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [statsFilter, setStatsFilter] = useState<{ kind: 'status' | 'type', value: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const { toast } = useToast();

  const { currentSite, selectedSiteId } = useSite();
  const activeSiteId = selectedSiteId ?? currentSite?.id ?? null;

  // Initialiser le chatbot n8n
  useEffect(() => {
    try {
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
    } catch (error) {
      console.error("Chat n8n init failed:", error);
    }
  }, []);

  // Récupérer les contenus éditoriaux depuis l'API
  const { data: editorialContent = [], isLoading } = useQuery<EditorialContent[]>({
    queryKey: ['/api/editorial-content', activeSiteId],
    enabled: !!activeSiteId,
    queryFn: async (): Promise<EditorialContent[]> => {
      if (!activeSiteId) return [];
      const response = await apiRequest("GET", `/api/editorial-content?siteId=${activeSiteId}`);
      return response.json();
    }
  });

  // Récupérer les sites
  const { data: sites = [] } = useQuery<Array<{ id: number, name: string, url: string }>>({
    queryKey: ['/api/sites'],
  });

  // Fonction pour récupérer le nom du site par ID
  const getSiteName = (siteId: number) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : `Site ${siteId}`;
  };

  // Transformer les données de l'API en format pour le calendrier
  const allEvents: EditorialEvent[] = Array.isArray(editorialContent) ? editorialContent.map((content) => {
    const safeText = typeof content.contentText === "string" ? content.contentText : "";
    const rawDate = content.dateDePublication ? new Date(content.dateDePublication) : new Date();
    const safeDate = Number.isNaN(rawDate.getTime()) ? new Date() : rawDate;

    return {
      id: content.id,
      title: safeText.length > 50 ? safeText.substring(0, 50) + '...' : safeText || "Contenu sans titre",
      description: safeText,
      date: safeDate,
      type: content.typeContent || "newsletter",
      status: content.statut || "en attente",
      hasImage: Boolean(content.hasImage),
      siteId: Number(content.idSite) || Number(activeSiteId) || 0
    };
  }) : [];

  // Filtrer les événements par site et plateforme sélectionnés
  const events = allEvents.filter(event => {
    const siteMatch = activeSiteId ? event.siteId === activeSiteId : false;
    const platformMatch = selectedPlatformFilter ? event.type === selectedPlatformFilter : true;
    return siteMatch && platformMatch;
  });

  const getDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  // Regroupement des evenements par date pour accelerer l'affichage du calendrier
  const eventsByDate = useMemo(() => {
    const groupedEvents = new Map<string, EditorialEvent[]>();

    for (const event of events) {
      const dateKey = getDateKey(event.date);
      const existingEvents = groupedEvents.get(dateKey);

      if (existingEvents) {
        existingEvents.push(event);
      } else {
        groupedEvents.set(dateKey, [event]);
      }
    }

    groupedEvents.forEach((dayEvents) => {
      dayEvents.sort((a: EditorialEvent, b: EditorialEvent) => a.date.getTime() - b.date.getTime());
    });

    return groupedEvents;
  }, [events]);

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
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, index) => new Date(year, month, index + 1));
  }, [currentDate]);

  const getEventsForDate = (date: Date) => {
    return eventsByDate.get(getDateKey(date)) || [];
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

  const handleExpressContent = (date?: Date) => {
    const selectedDateString = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    setExpressDialogDate(selectedDateString);
    setIsExpressDialogOpen(true);
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'newsletter': return 'Newsletter';
      case 'tiktok': return 'TikTok';
      case 'instagram': return 'Instagram';
      case 'xtwitter': return 'X (Twitter)';
      case 'youtube': return 'YouTube';
      case 'facebook': return 'Facebook';
      case 'linkedin': return 'LinkedIn';
      case 'blog':
      case 'article': return 'Blog';
      case 'google my business': return 'Google My Business';
      case 'pinterest': return 'Pinterest';
      default: return type;
    }
  };

  const getTypeIcon = (type: string): { Icon: LucideIcon; className: string } => {
    switch (type) {
      case 'newsletter': return { Icon: Mail, className: 'text-blue-600' };
      case 'tiktok': return { Icon: Music2, className: 'text-black dark:text-white' };
      case 'instagram': return { Icon: Instagram, className: 'text-pink-600' };
      case 'xtwitter': return { Icon: Twitter, className: 'text-slate-700 dark:text-slate-200' };
      case 'youtube': return { Icon: Youtube, className: 'text-red-600' };
      case 'facebook': return { Icon: Facebook, className: 'text-blue-700' };
      case 'linkedin': return { Icon: Linkedin, className: 'text-sky-700' };
      case 'blog':
      case 'article': return { Icon: FileText, className: 'text-indigo-700 dark:text-indigo-300' };
      case 'google my business': return { Icon: Building2, className: 'text-green-700 dark:text-green-300' };
      case 'pinterest': return { Icon: ImageIcon, className: 'text-red-600' };
      default: return { Icon: CalendarIcon, className: 'text-gray-500' };
    }
  };

  // Fonction pour obtenir la couleur selon le type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'xtwitter': return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200';
      case 'instagram': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'facebook': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'linkedin': return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';
      case 'pinterest': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'google my business': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'tiktok': return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
      case 'youtube': return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
      case 'blog':
      case 'article': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'newsletter': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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
    <div className="min-h-screen app-shell page-enter">
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
                    Site sélectionné :
                  </label>
                  <Select value={activeSiteId?.toString()}>
                    <SelectTrigger className="w-56" disabled>
                      <SelectValue placeholder="Site sélectionné" />
                    </SelectTrigger>
                    <SelectContent className="smart-scroll-vertical max-h-60">
                      {[...sites].sort((a, b) => b.id - a.id).map((site) => (
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
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="xtwitter">X (Twitter)</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="blog">Article de blog</SelectItem>
                      <SelectItem value="google my business">Google My Business</SelectItem>
                      <SelectItem value="pinterest">Pinterest</SelectItem>
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
                {activeSiteId && ` • Site: ${getSiteName(activeSiteId)}`}
                {selectedPlatformFilter && ` • Plateforme: ${getTypeLabel(selectedPlatformFilter)}`}
              </div>

              {selectedPlatformFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPlatformFilter(null);
                  }}
                  className="text-xs"
                >
                  ✕ Effacer le filtre
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendrier principal */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                      <Button
                        size="sm"
                        variant={calendarView === 'month' ? 'default' : 'ghost'}
                        className="h-8 px-2"
                        onClick={() => setCalendarView('month')}
                      >
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Mois
                      </Button>
                      <Button
                        size="sm"
                        variant={calendarView === 'agenda' ? 'default' : 'ghost'}
                        className="h-8 px-2"
                        onClick={() => setCalendarView('agenda')}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Agenda
                      </Button>
                    </div>
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
                {calendarView === 'month' ? (
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {/* En-têtes des jours */}
                    {dayNames.map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                        {day}
                      </div>
                    ))}

                    {/* Jours du mois */}
                    {days.map((day, index) => {
                      const dayEvents = day ? getEventsForDate(day) : [];

                      return (
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
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddArticle(day);
                                    }}
                                    title="Ajouter du contenu"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExpressContent(day);
                                    }}
                                    title="Contenu Express IA"
                                  >
                                    <Zap className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-1">
                                {dayEvents.slice(0, 2).map(event => {
                                  const { Icon, className: iconClassName } = getTypeIcon(event.type);

                                  return (
                                    <div
                                      key={event.id}
                                      className={`text-xs p-1 rounded truncate flex items-center gap-1 ${getTypeColor(event.type)}`}
                                    >
                                      <Icon className={`h-3 w-3 shrink-0 ${iconClassName}`} />
                                      <span className="truncate">{event.title}</span>
                                    </div>
                                  );
                                })}
                                {dayEvents.length > 2 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    +{dayEvents.length - 2} autres
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-100 dark:border-gray-700 max-h-[620px] overflow-y-auto smart-scroll-vertical">
                    {monthDays.map((day) => {
                      const dayEvents = getEventsForDate(day);
                      const isSelected = selectedDate ? selectedDate.toDateString() === day.toDateString() : false;
                      const isToday = getDateKey(day) === getDateKey(new Date());

                      return (
                        <div
                          key={day.toISOString()}
                          className={`flex flex-col sm:flex-row gap-3 p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                          <div className="sm:w-28 shrink-0">
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                            </p>
                            <button
                              className="mt-1 text-left"
                              onClick={() => setSelectedDate(day)}
                            >
                              <div className={`text-lg font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                {day.getDate()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {day.toLocaleDateString('fr-FR', { month: 'short' })}
                              </div>
                            </button>
                            <div className="flex items-center gap-1 mt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleAddArticle(day)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Ajouter
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                onClick={() => handleExpressContent(day)}
                              >
                                <Zap className="h-3 w-3 mr-1" />
                                Express
                              </Button>
                            </div>
                          </div>

                          <div className="flex-1 space-y-2">
                            {dayEvents.length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                                Aucun contenu prévu
                              </p>
                            ) : (
                              dayEvents.map((event) => {
                                const { Icon, className: iconClassName } = getTypeIcon(event.type);

                                return (
                                  <div
                                    key={event.id}
                                    className="p-2 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                    onClick={() => setSelectedDate(day)}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Icon className={`h-4 w-4 shrink-0 ${iconClassName}`} />
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{event.title}</p>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                      <Badge className={`${getTypeColor(event.type)} text-xs`}>
                                        {getTypeLabel(event.type)}
                                      </Badge>
                                      <Badge className={`${getStatusColor(event.status)} text-xs`}>
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
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-6">
            {/* Événements du jour sélectionné */}
            {selectedDate && (
              <Card className="shadow-sm">
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
                    {getEventsForDate(selectedDate).map(event => {
                      const { Icon, className: iconClassName } = getTypeIcon(event.type);

                      return (
                        <div
                          key={event.id}
                          className={`p-3 border rounded-lg transition-colors ${isSelectionMode && selectedArticles.has(event.id)
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
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${iconClassName}`} />
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {event.title}
                                </h4>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900/20"
                                title="Prévisualiser"
                                onClick={() => {
                                  const content = editorialContent.find(c => c.id === event.id);
                                  if (content) {
                                    setPreviewingArticle(content);
                                    setIsPreviewDialogOpen(true);
                                  }
                                }}
                              >
                                <Eye className="h-3 w-3 text-muted-foreground" />
                              </Button>
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
                              {getTypeLabel(event.type)}
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
                      );
                    })}

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
            <Card className="shadow-sm">
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
                            setStatsFilter({ kind: 'status', value: 'en attente' });
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
                            setStatsFilter({ kind: 'status', value: 'à réviser' });
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
                            setStatsFilter({ kind: 'status', value: 'validé' });
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
                            setStatsFilter({ kind: 'status', value: 'publié' });
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
                            setStatsFilter({ kind: 'type', value: 'hasImage' });
                            setStatsDialogOpen(true);
                          }
                        }}
                        data-testid="stat-avec-images"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Avec images
                        </span>
                        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
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

      {/* Dialog des statistiques cliquables */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] sm:max-h-[85vh] p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {statsFilter?.kind === 'status' && (
                <>Contenu : {
                  statsFilter.value === 'en attente' ? 'En attente' :
                    statsFilter.value === 'à réviser' ? 'À réviser' :
                      statsFilter.value === 'validé' ? 'Validé' :
                        statsFilter.value === 'publié' ? 'Publié' : statsFilter.value
                }</>
              )}
              {statsFilter?.kind === 'type' && statsFilter.value === 'hasImage' && (
                <>Contenu avec images</>
              )}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredList.length} élément{filteredList.length > 1 ? 's' : ''})
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Barre d'actions si mode sélection */}
            {isSelectionMode && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
                  <span className="text-sm text-blue-700 dark:text-blue-300 flex-shrink-0">
                    {selectedArticles.size} article{selectedArticles.size > 1 ? 's' : ''} sélectionné{selectedArticles.size > 1 ? 's' : ''}
                  </span>
                  <div className="flex flex-wrap gap-2 flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm h-8 px-2 sm:px-3 touch-manipulation"
                      onClick={() => {
                        const visibleIds = new Set(filteredList.slice(0, visibleCount).map(event => event.id));
                        setSelectedArticles(visibleIds);
                      }}
                      data-testid="select-all-visible"
                    >
                      Tout sélectionner
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm h-8 px-2 sm:px-3 touch-manipulation"
                      onClick={clearSelection}
                      data-testid="clear-selection"
                    >
                      Effacer
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={bulkStatus} onValueChange={setBulkStatus}>
                    <SelectTrigger className="w-full sm:w-40 h-9" data-testid="bulk-status-select">
                      <SelectValue placeholder="Nouveau statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en attente">En attente</SelectItem>
                      <SelectItem value="à réviser">À réviser</SelectItem>
                      <SelectItem value="validé">Validé</SelectItem>
                      <SelectItem value="publié">Publié</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 flex-1 sm:flex-none">
                    <Button
                      className="flex-1 sm:flex-none h-9 touch-manipulation"
                      onClick={handleBulkUpdate}
                      disabled={selectedArticles.size === 0 || !bulkStatus || bulkUpdateMutation.isPending}
                      data-testid="apply-bulk-update-stats"
                    >
                      {bulkUpdateMutation.isPending ? "Mise à jour..." : "Appliquer"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 sm:flex-none h-9 touch-manipulation"
                      onClick={exitSelectionMode}
                      data-testid="cancel-bulk-update-stats"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions rapides */}
            {!isSelectionMode && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
                  onClick={enterSelectionMode}
                >
                  <CheckSquare className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Mode sélection</span>
                </Button>
              </div>
            )}

            {/* Liste des contenus */}
            <div className="space-y-2 max-h-[55vh] overflow-y-auto smart-scroll-vertical">
              {filteredList.slice(0, visibleCount).map((event) => {
                const content = editorialContent.find(c => c.id === event.id);
                if (!content) return null;
                const { Icon, className: iconClassName } = getTypeIcon(event.type);

                return (
                  <div key={event.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`row-content-${event.id}`}>
                    {isSelectionMode && (
                      <div
                        className="cursor-pointer pt-1 touch-manipulation"
                        onClick={() => toggleArticleSelection(event.id)}
                      >
                        {selectedArticles.has(event.id) ?
                          <CheckSquare className="h-5 w-5 sm:h-4 sm:w-4 text-blue-600" /> :
                          <Square className="h-5 w-5 sm:h-4 sm:w-4 text-gray-400" />
                        }
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className={`h-4 w-4 shrink-0 ${iconClassName}`} />
                            <h4 className="font-medium text-sm sm:text-base leading-tight truncate">{event.title}</h4>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              {getSiteName(event.siteId)}
                            </Badge>
                            <Badge className={`${getTypeColor(event.type)} text-xs px-2 py-1`}>
                              {getTypeLabel(event.type)}
                            </Badge>
                            <Badge className={`${getStatusColor(event.status)} text-xs px-2 py-1`}>
                              {event.status}
                            </Badge>
                            {event.hasImage && (
                              <Badge variant="outline" className="text-xs px-2 py-1">
                                <Tag className="h-3 w-3 mr-1" />
                                Image
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {event.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-start">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 sm:h-9 sm:w-9 p-0 touch-manipulation"
                            onClick={() => handleEditArticle(event)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 sm:h-9 sm:w-9 p-0 touch-manipulation"
                            onClick={() => handleDeleteArticle(event)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bouton "Charger plus" */}
              {filteredList.length > visibleCount && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    className="h-10 px-4 text-sm touch-manipulation"
                    onClick={() => setVisibleCount(prev => prev + 50)}
                  >
                    Charger plus ({filteredList.length - visibleCount} restant{filteredList.length - visibleCount > 1 ? 's' : ''})
                  </Button>
                </div>
              )}

              {filteredList.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun contenu trouvé pour ce filtre</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Dialog de prévisualisation d'article */}
      <ArticlePreviewDialog
        open={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
        article={previewingArticle}
        siteName={previewingArticle ? getSiteName(previewingArticle.idSite) : undefined}
      />

      {/* Dialog Contenu Express */}
      <ExpressContentDialog
        open={isExpressDialogOpen}
        onOpenChange={setIsExpressDialogOpen}
        selectedDate={expressDialogDate}
      />

      {/* Conteneur pour le chatbot n8n */}
      <div id="n8n-chat"></div>
    </div>
  );
}

