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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l'article</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer cet article ?
            <br />
            <br />
            <strong>Contenu :</strong> {article.contentText}
            <br />
            <strong>Type :</strong> {article.typeContent}
            <br />
            <strong>Statut :</strong> {article.statut}
            <br />
            <br />
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
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