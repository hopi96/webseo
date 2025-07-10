import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EditorialContent } from "@shared/schema";
import { Sparkles } from "lucide-react";
import { AIGenerationDialog } from "./ai-generation-dialog";

interface EditArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: EditorialContent;
}

const editArticleSchema = z.object({
  contentText: z.string().min(1, "Le contenu est obligatoire"),
  statut: z.enum(["en attente", "à réviser", "en cours", "publié"]),
  typeContent: z.enum(["xtwitter", "instagram", "article", "newsletter"]),
  hasImage: z.boolean(),
  dateDePublication: z.string().min(1, "La date de publication est obligatoire")
});

type EditArticleFormData = z.infer<typeof editArticleSchema>;

export function EditArticleDialog({ open, onOpenChange, article }: EditArticleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAIDialog, setShowAIDialog] = useState(false);
  
  // Normaliser les valeurs pour s'assurer qu'elles correspondent aux options du Select
  const normalizeStatut = (statut: string): "en attente" | "à réviser" | "en cours" | "publié" => {
    const validStatuts = ["en attente", "à réviser", "en cours", "publié"];
    return validStatuts.includes(statut) ? statut as any : "en attente";
  };
  
  const normalizeTypeContent = (type: string): "xtwitter" | "instagram" | "article" | "newsletter" => {
    const validTypes = ["xtwitter", "instagram", "article", "newsletter"];
    return validTypes.includes(type) ? type as any : "xtwitter";
  };
  
  const form = useForm<EditArticleFormData>({
    resolver: zodResolver(editArticleSchema),
    defaultValues: {
      contentText: article.contentText || "",
      statut: normalizeStatut(article.statut),
      typeContent: normalizeTypeContent(article.typeContent),
      hasImage: article.hasImage || false,
      dateDePublication: new Date(article.dateDePublication).toISOString().split('T')[0]
    }
  });

  const updateArticleMutation = useMutation({
    mutationFn: async (data: EditArticleFormData) => {
      const response = await apiRequest(
        'PUT',
        `/api/editorial-content/${encodeURIComponent(article.id)}`,
        {
          ...data,
          dateDePublication: new Date(data.dateDePublication)
        }
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Article mis à jour",
        description: "L'article a été modifié avec succès dans Airtable",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/editorial-content'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'article",
        variant: "destructive"
      });
    }
  });

  const handleAIGeneration = (generatedContent: string) => {
    form.setValue('contentText', generatedContent);
  };

  const onSubmit = (data: EditArticleFormData) => {
    updateArticleMutation.mutate(data);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'xtwitter': return 'X (Twitter)';
      case 'instagram': return 'Instagram';
      case 'article': return 'Article';
      case 'newsletter': return 'Newsletter';
      default: return type;
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'en attente': return 'En attente';
      case 'à réviser': return 'À réviser';
      case 'en cours': return 'En cours';
      case 'publié': return 'Publié';
      default: return statut;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Éditer l'article</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="contentText"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Contenu</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAIDialog(true)}
                      className="flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      Générer avec GPT-4o
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Saisissez le contenu de l'article..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="typeContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de contenu</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="xtwitter">X (Twitter)</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir le statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en attente">En attente</SelectItem>
                        <SelectItem value="à réviser">À réviser</SelectItem>
                        <SelectItem value="en cours">En cours</SelectItem>
                        <SelectItem value="publié">Publié</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateDePublication"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de publication</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasImage"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Contient une image
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={updateArticleMutation.isPending}
              >
                {updateArticleMutation.isPending ? "Mise à jour..." : "Sauvegarder"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      
      <AIGenerationDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        contentType={form.watch('typeContent')}
        existingContent={form.watch('contentText')}
        onGenerated={handleAIGeneration}
      />
    </Dialog>
  );
}