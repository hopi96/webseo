import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWebsiteSchema } from "@shared/schema";
import type { InsertWebsite } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AddWebsiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWebsiteAdded?: (websiteId: number) => void;
}

export function AddWebsiteDialog({ open, onOpenChange, onWebsiteAdded }: AddWebsiteDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<InsertWebsite>({
    resolver: zodResolver(insertWebsiteSchema),
    defaultValues: {
      url: "",
      name: "",
    },
  });

  const addWebsiteMutation = useMutation({
    mutationFn: async (data: InsertWebsite) => {
      const response = await apiRequest("POST", "/api/websites", data);
      return response.json();
    },
    onSuccess: (newWebsite) => {
      // Invalider les deux caches pour assurer la cohérence
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sites-airtable"] });
      
      form.reset();
      onOpenChange(false);
      
      toast({
        title: "Site web ajouté",
        description: "Le site web a été ajouté avec succès. L'analyse SEO en temps réel est en cours...",
      });
      
      // Appeler le callback avec l'ID du nouveau site après un délai pour permettre aux données de se mettre à jour
      if (onWebsiteAdded && newWebsite?.id) {
        setTimeout(() => {
          onWebsiteAdded(newWebsite.id);
        }, 500);
      }
    },
    onError: (error) => {
      console.error("Error adding website:", error);
      toast({
        title: "Erreur lors de l'ajout du site",
        description: error.message || "Impossible d'ajouter le site web. Vérifiez l'URL et réessayez.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertWebsite) => {
    addWebsiteMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un Nouveau Site Web</DialogTitle>
          <DialogDescription>
            Ajoutez un site web pour commencer à surveiller ses performances SEO avec de vraies données.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du Site Web</FormLabel>
                  <FormControl>
                    <Input placeholder="Mon Site Web" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL du Site Web</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://monsite.com" 
                      type="url"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addWebsiteMutation.isPending}
              >
                {addWebsiteMutation.isPending ? "Adding..." : "Add Website"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
