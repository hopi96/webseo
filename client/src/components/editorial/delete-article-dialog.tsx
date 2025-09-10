import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EditorialContent } from "@/shared/schema";

interface DeleteArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: EditorialContent;
}

export function DeleteArticleDialog({ open, onOpenChange, article }: DeleteArticleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/editorial-content/${encodeURIComponent(article.airtableId)}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Article supprimé",
        description: "L'article a été supprimé avec succès.",
      });
      
      // Invalider le cache pour actualiser la liste
      queryClient.invalidateQueries({ queryKey: ['/api/editorial-content'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'article. Veuillez réessayer.",
        variant: "destructive",
      });
      console.error('Erreur lors de la suppression:', error);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  // Fonction pour truncater le texte si nécessaire
  const truncateText = (text: string, maxLength: number = 200): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l'article</AlertDialogTitle>
          <div className="space-y-3">
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet article ?
            </AlertDialogDescription>
            
            <div className="bg-gray-50 p-3 rounded border max-h-48 overflow-y-auto">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Type :</strong> {article.typeContent}
                </div>
                <div>
                  <strong>Statut :</strong> {article.statut}
                </div>
                <div>
                  <strong>Contenu :</strong>
                  <div className="mt-1 p-2 bg-white rounded border text-xs max-h-32 overflow-y-auto">
                    {truncateText(article.contentText, 300)}
                  </div>
                </div>
              </div>
            </div>
            
            <AlertDialogDescription className="text-red-600 font-medium">
              Cette action est irréversible.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-shrink-0">
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}