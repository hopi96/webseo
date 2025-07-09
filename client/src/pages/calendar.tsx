import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
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
  Trash2
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

  // Transformer les données de l'API en format pour le calendrier
  const events: EditorialEvent[] = editorialContent.map(content => ({
    id: content.id,
    title: content.contentText.length > 50 ? content.contentText.substring(0, 50) + '...' : content.contentText,
    description: content.contentText,
    date: new Date(content.dateDePublication),
    type: content.typeContent,
    status: content.statut,
    hasImage: content.hasImage || false,
    siteId: content.idSite
  }));

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

  // Fonction pour obtenir la couleur selon le type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'social': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'newsletter': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'video': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
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
      <MobileHeader />
      
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
                  <div className="space-y-3">
                    {getEventsForDate(selectedDate).map(event => (
                      <div key={event.id} className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </h4>
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
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Contenu en attente
                        </span>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {events.filter(e => e.status === 'en attente').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          À réviser
                        </span>
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          {events.filter(e => e.status === 'à réviser').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          En cours
                        </span>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {events.filter(e => e.status === 'en cours').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Publié
                        </span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {events.filter(e => e.status === 'publié').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Avec images
                        </span>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {events.filter(e => e.hasImage).length}
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

      <BottomNavigation />
    </div>
  );
}