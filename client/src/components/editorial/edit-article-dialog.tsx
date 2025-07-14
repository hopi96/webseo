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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EditorialContent } from "@shared/schema";
import { Sparkles, Globe, Upload, X, RotateCcw } from "lucide-react";
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
  imageUrl: z.string().optional(),
  dateDePublication: z.string().min(1, "La date de publication est obligatoire"),
  idSite: z.number()
});

type EditArticleFormData = z.infer<typeof editArticleSchema>;

export function EditArticleDialog({ open, onOpenChange, article }: EditArticleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  
  // Récupération des sites web depuis la table analyse SEO d'Airtable
  const { data: websites = [] } = useQuery({
    queryKey: ['/api/sites-airtable'],
    select: (data: any[]) => data || []
  });
  
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
      imageUrl: article.imageUrl || "",
      dateDePublication: new Date(article.dateDePublication).toISOString().split('T')[0],
      idSite: article.idSite || 1
    }
  });

  // Fonction pour générer une image avec l'IA
  const generateImageWithAI = async (contentText: string, typeContent: string) => {
    if (!contentText || !contentText.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord saisir un contenu pour générer une image.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingImage(true);
    try {
      const response = await apiRequest("POST", "/api/generate-image", {
        contentText,
        typeContent,
      });

      const result = await response.json();
      
      if (result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
        setUploadedImageUrl(""); // Reset upload
        form.setValue("imageUrl", result.imageUrl);
        form.setValue("hasImage", true);
        
        toast({
          title: "Image générée",
          description: "L'image a été générée avec succès par l'IA.",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la génération d'image:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer l'image. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  // Fonction pour gérer l'upload d'images
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier image valide.",
        variant: "destructive",
      });
      return;
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne peut pas dépasser 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Utiliser fetch directement pour l'upload de fichier
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.imageUrl) {
        setUploadedImageFile(file);
        setUploadedImageUrl(result.imageUrl);
        setGeneratedImageUrl(""); // Reset AI generation
        form.setValue("imageUrl", result.imageUrl);
        form.setValue("hasImage", true);

        toast({
          title: "Image uploadée",
          description: "L'image a été uploadée avec succès.",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'upload d'image:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'uploader l'image. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  // Fonction pour réinitialiser les images
  const resetImages = () => {
    setGeneratedImageUrl("");
    setUploadedImageFile(null);
    setUploadedImageUrl("");
    form.setValue("imageUrl", "");
    form.setValue("hasImage", false);
  };

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
      
      // Réinitialiser le formulaire après modification réussie
      form.reset({
        contentText: "",
        statut: "en attente",
        typeContent: "xtwitter",
        hasImage: false,
        imageUrl: "",
        dateDePublication: new Date().toISOString().split('T')[0],
        idSite: websites.length > 0 ? websites[0].id : 1
      });
      
      // Réinitialiser les images
      resetImages();
      
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
      case 'facebook': return 'Facebook';
      case 'pinterest': return 'Pinterest';
      case 'google my business': return 'Google My Business';
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
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="pinterest">Pinterest</SelectItem>
                        <SelectItem value="google my business">Google My Business</SelectItem>
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

            <FormField
              control={form.control}
              name="idSite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Site web
                  </FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un site web" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {websites.map((website: any) => (
                        <SelectItem key={website.id} value={website.id.toString()}>
                          {website.name} ({website.url})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Section de gestion des images */}
            {form.watch("hasImage") && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">Gestion des images</h4>
                
                {/* Aperçu des images existantes */}
                {(generatedImageUrl || uploadedImageUrl || form.watch("imageUrl")) && (
                  <div className="mb-4">
                    <div className="grid grid-cols-1 gap-2">
                      {generatedImageUrl && (
                        <div className="relative">
                          <img
                            src={generatedImageUrl}
                            alt="Image générée par IA"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <span className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded text-xs">
                            IA
                          </span>
                        </div>
                      )}
                      {uploadedImageUrl && (
                        <div className="relative">
                          <img
                            src={uploadedImageUrl}
                            alt="Image uploadée"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <span className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                            Upload
                          </span>
                        </div>
                      )}
                      {form.watch("imageUrl") && !generatedImageUrl && !uploadedImageUrl && (
                        <div className="relative">
                          <img
                            src={form.watch("imageUrl")}
                            alt="Image existante"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                            Existante
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetImages}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Réinitialiser
                      </Button>
                    </div>
                  </div>
                )}

                {/* Options d'image - Choix exclusif */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Choisissez l'une des deux options :</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Génération par IA */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Option 1: Génération par IA</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateImageWithAI(form.watch("contentText"), form.watch("typeContent"))}
                        disabled={generatingImage || uploadedImageUrl !== ""}
                        className="w-full flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 disabled:opacity-50"
                      >
                        <Sparkles className="h-4 w-4" />
                        {generatingImage ? "Génération..." : "Générer avec DALL-E 3"}
                      </Button>
                      {!form.watch("contentText")?.trim() && (
                        <p className="text-xs text-gray-500">Saisissez d'abord du contenu</p>
                      )}
                      {uploadedImageUrl && (
                        <p className="text-xs text-orange-500">Image uploadée active</p>
                      )}
                    </div>

                    {/* Upload d'image */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Option 2: Upload d'image</label>
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file);
                            }
                          }}
                          className="hidden"
                          id="image-upload-edit"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('image-upload-edit')?.click()}
                          disabled={generatedImageUrl !== ""}
                          className="w-full flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 disabled:opacity-50"
                        >
                          <Upload className="h-4 w-4" />
                          Choisir une image
                        </Button>
                      </div>
                      {generatedImageUrl && (
                        <p className="text-xs text-orange-500">Image IA active</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

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