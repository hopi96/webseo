import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { SystemPrompt } from "@shared/schema";

const editPromptSchema = z.object({
  nom: z.string().min(1, "Le nom est obligatoire"),
  description: z.string().optional(),
  promptSystem: z.string().min(10, "Le prompt système doit contenir au moins 10 caractères"),
  structureSortie: z.string().optional(),
  actif: z.boolean(),
});

type EditPromptFormData = z.infer<typeof editPromptSchema>;

interface EditPromptDialogProps {
  prompt: SystemPrompt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<SystemPrompt>) => void;
}

export function EditPromptDialog({ prompt, open, onOpenChange, onSave }: EditPromptDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditPromptFormData>({
    resolver: zodResolver(editPromptSchema),
    defaultValues: {
      nom: prompt.nom || "",
      description: prompt.description || "",
      promptSystem: prompt.promptSystem || "",
      structureSortie: prompt.structureSortie || "",
      actif: prompt.actif || false,
    },
  });

  // Réinitialiser le formulaire quand le prompt change
  useEffect(() => {
    if (prompt) {
      form.reset({
        nom: prompt.nom || "",
        description: prompt.description || "",
        promptSystem: prompt.promptSystem || "",
        structureSortie: prompt.structureSortie || "",
        actif: prompt.actif || false,
      });
    }
  }, [prompt, form]);

  const onSubmit = async (data: EditPromptFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le prompt système</DialogTitle>
          <DialogDescription>
            Modifiez les paramètres du prompt système. Le prompt actif sera utilisé par l'IA pour générer du contenu.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du prompt</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Prompt principal pour génération de contenu"
                      {...field}
                      data-testid="input-prompt-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Description courte du prompt et de son utilisation"
                      {...field}
                      data-testid="input-prompt-description"
                    />
                  </FormControl>
                  <FormDescription>
                    Décrivez brièvement l'objectif et l'utilisation de ce prompt
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="promptSystem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt système</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tu es un expert en création de contenu éditorial et SEO..."
                      className="min-h-32 resize-vertical"
                      {...field}
                      data-testid="textarea-prompt-system"
                    />
                  </FormControl>
                  <FormDescription>
                    Le prompt système qui définit le rôle et les instructions pour l'IA
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="structureSortie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Structure de sortie (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='{"title": "Titre", "content": "Contenu", "suggestions": ["suggestion1"]}'
                      className="min-h-20 resize-vertical font-mono text-sm"
                      {...field}
                      data-testid="textarea-output-structure"
                    />
                  </FormControl>
                  <FormDescription>
                    Format JSON attendu pour la réponse de l'IA (optionnel)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actif"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Prompt actif</FormLabel>
                    <FormDescription>
                      Ce prompt sera utilisé par défaut pour toutes les générations IA
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-prompt-active"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="button-save-prompt"
              >
                {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}