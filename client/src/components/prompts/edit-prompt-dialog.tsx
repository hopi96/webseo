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
import type { SystemPrompt } from "@shared/schema";

const editPromptSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  promptSystem: z.string().min(10, "Le prompt système doit contenir au moins 10 caractères"),
  outputStructure: z.string().optional(),
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
      name: prompt.name || "",
      description: prompt.description || "",
      promptSystem: prompt.promptSystem || "",
      outputStructure: prompt.outputStructure || "",
    },
  });

  // Réinitialiser le formulaire quand le prompt change
  useEffect(() => {
    if (prompt) {
      form.reset({
        name: prompt.name || "",
        description: prompt.description || "",
        promptSystem: prompt.promptSystem || "",
        outputStructure: prompt.outputStructure || "",
      });
    }
  }, [prompt, form]);

  const onSubmit = async (data: EditPromptFormData) => {
    setIsSubmitting(true);
    try {
      // Validate JSON if present
      if (data.outputStructure && data.outputStructure.trim()) {
        try {
          JSON.parse(data.outputStructure);
        } catch (e) {
          form.setError("outputStructure", {
            type: "manual",
            message: "Format JSON invalide"
          });
          setIsSubmitting(false);
          return;
        }
      }

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le prompt système</DialogTitle>
          <DialogDescription>
            Configurez le comportement de l'IA pour ce type de contenu.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <FormField
              control={form.control}
              name="promptSystem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt système</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tu es un expert en création de contenu..."
                      className="min-h-[200px] font-mono text-sm leading-relaxed"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Définissez le rôle, le ton et les règles strictes que l'IA doit suivre.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="outputStructure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Structure de sortie JSON (Optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"title": "...", "content": "..."}'
                      className="min-h-[100px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Forcez l'IA à répondre avec une structure JSON spécifique.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
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