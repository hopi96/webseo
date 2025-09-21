import { useState, useEffect } from "react";
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
import { 
  prepareImageDataForSubmission, 
  initializeImageFormState, 
  resetImageState, 
  getDisplayImageUrl, 
  getImageSourceLabel,
  type FormImageState 
} from "@/lib/image-utils";

interface EditArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: EditorialContent;
}

const editArticleSchema = z.object({
  contentText: z.string().min(1, "Le contenu est obligatoire"),
  statut: z.enum(["en attente", "à réviser", "validé", "publié"]),
  typeContent: z.enum(["xtwitter", "instagram", "article", "newsletter", "facebook", "pinterest", "google my business"]),
  hasImage: z.boolean(),
  imageUrl: z.string().optional(),
  imageSource: z.enum(["upload", "ai"]).optional(),
  dateDePublication: z.string().min(1, "La date de publication est obligatoire"),
  idSite: z.number()
});

type EditArticleFormData = z.infer<typeof editArticleSchema>;

export function EditArticleDialog({ open, onOpenChange, article }: EditArticleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // État des images utilisant la nouvelle logique
  const [imageState, setImageState] = useState<FormImageState>(() => 
    initializeImageFormState({
      hasImage: article.hasImage ?? false,
      imageUrl: article.imageUrl ?? null,
      imageSource: article.imageSource ?? null
    })
  );
  
  // Récupération des sites web depuis la table analyse SEO d'Airtable
  const { data: websites = [] } = useQuery({
    queryKey: ['/api/sites-airtable'],
    select: (data: any[]) => data || []
  });
  
  // Normaliser les valeurs pour s'assurer qu'elles correspondent aux options du Select
  const normalizeStatut = (statut: string): "en attente" | "à réviser" | "validé" | "publié" => {
    const validStatuts = ["en attente", "à réviser", "validé", "publié"];
    return validStatuts.includes(statut) ? statut as any : "en attente";
  };
  
  const normalizeTypeContent = (type: string): "xtwitter" | "instagram" | "article" | "newsletter" | "facebook" | "pinterest" | "google my business" => {
    const validTypes = ["xtwitter", "instagram", "article", "newsletter", "facebook", "pinterest", "google my business"];
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

  // Réinitialiser le formulaire quand l'article change (après invalidation du cache)
  useEffect(() => {
    if (article) {
      const newValues = {
        contentText: article.contentText || "",
        statut: normalizeStatut(article.statut),
        typeContent: normalizeTypeContent(article.typeContent),
        hasImage: article.hasImage || false,
        imageUrl: article.imageUrl || "",
        dateDePublication: new Date(article.dateDePublication).toISOString().split('T')[0],
        idSite: article.idSite || 1
      };
      
      form.reset(newValues);
      
      // Réinitialiser l'état des images avec les nouvelles valeurs de l'article
      setImageState(initializeImageFormState({
        hasImage: article.hasImage ?? false,
        imageUrl: article.imageUrl ?? null,
        imageSource: article.imageSource ?? null
      }));
    }
  }, [article.id, article.contentText, article.statut, article.typeContent, article.hasImage, article.imageUrl, article.dateDePublication, article.idSite, article.imageSource]);


  // Fonction pour générer une image avec l'IA
  const generateImageWithAI = async (contentText: string, typeContent: string, customPrompt?: string) => {
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
      const finalPrompt = customPrompt?.trim() 
        ? customPrompt 
        : `Créer une image optimisée pour ${typeContent} basée sur ce contenu : "${contentText}"`;
        
      const response = await apiRequest("POST", "/api/generate-image", {
        contentText,
        typeContent,
        prompt: finalPrompt
      });

      const result = await response.json();
      
      if (result.imageUrl) {
        setImageState(prev => ({
          ...prev,
          generatedImageUrl: result.imageUrl,
          uploadedImageUrl: "",
          formImageUrl: result.imageUrl,
          formHasImage: true
        }));
        setImageLoadError(false);
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
        setImageState(prev => ({
          ...prev,
          uploadedImageUrl: result.imageUrl,
          generatedImageUrl: "",
          formImageUrl: result.imageUrl,
          formHasImage: true
        }));
        setImageLoadError(false);
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
    setImageState(resetImageState());
    setCustomPrompt("");
    form.setValue("imageUrl", "");
    form.setValue("hasImage", false);
  };

  const updateArticleMutation = useMutation({
    mutationFn: async (data: EditArticleFormData) => {
      // Préparer les données d'image avec la nouvelle logique
      const imageData = prepareImageDataForSubmission(imageState);
      
      const response = await apiRequest(
        'PUT',
        `/api/editorial-content/${encodeURIComponent(article.id)}`,
        {
          ...data,
          ...imageData,
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] smart-scroll-vertical">
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
                      <SelectContent className="smart-scroll-vertical max-h-60">
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
                      <SelectContent className="smart-scroll-vertical max-h-60">
                        <SelectItem value="en attente">En attente</SelectItem>
                        <SelectItem value="à réviser">À réviser</SelectItem>
                        <SelectItem value="validé">Validé</SelectItem>
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
                    <SelectContent className="smart-scroll-vertical max-h-60">
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
                {getDisplayImageUrl(imageState) && (
                  <div className="mb-4">
                    {!imageLoadError ? (
                      <div className="relative">
                        <img
                          src={getDisplayImageUrl(imageState)!}
                          alt="Image de l'article"
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            console.error("Erreur lors du chargement de l'image:", getDisplayImageUrl(imageState));
                            setImageLoadError(true);
                            // Décocher automatiquement "Contient une image" si l'image expire
                            form.setValue("hasImage", false);
                          }}
                          onLoad={() => setImageLoadError(false)}
                        />
                        {(() => {
                          const imageUrl = getDisplayImageUrl(imageState)!;
                          const { label, color } = getImageSourceLabel(imageUrl);
                          const colorClass = color === 'purple' ? 'bg-purple-500' : 
                                            color === 'blue' ? 'bg-blue-500' : 'bg-green-500';
                          return (
                            <span className={`absolute top-2 left-2 ${colorClass} text-white px-2 py-1 rounded text-xs`}>
                              {label}
                            </span>
                          );
                        })()}
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                          {(() => {
                            const url = getDisplayImageUrl(imageState) || "";
                            return url.length > 30 ? `${url.substring(0, 30)}...` : url;
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <X className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Image expirée ou non disponible</p>
                            <p className="text-xs text-gray-500 mt-1">L'image précédente ne peut plus être chargée</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => generateImageWithAI(form.watch("contentText"), form.watch("typeContent"), customPrompt)}
                              disabled={generatingImage}
                              className="flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                            >
                              <Sparkles className="h-4 w-4" />
                              Régénérer avec DALL-E 3
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('image-upload-edit')?.click()}
                              className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Upload className="h-4 w-4" />
                              Uploader une image
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-2 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImageState(resetImageState());
                          setImageLoadError(false);
                          form.setValue("hasImage", false);
                          form.setValue("imageUrl", "");
                        }}
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
                      <Textarea
                        placeholder="Prompt personnalisé pour DALL-E 3 (optionnel)"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="min-h-[60px] text-sm"
                        disabled={generatingImage || imageState.uploadedImageUrl !== ""}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateImageWithAI(form.watch("contentText"), form.watch("typeContent"), customPrompt)}
                        disabled={generatingImage || imageState.uploadedImageUrl !== ""}
                        className="w-full flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 disabled:opacity-50"
                      >
                        <Sparkles className="h-4 w-4" />
                        {generatingImage ? "Génération..." : "Générer avec DALL-E 3"}
                      </Button>
                      {!form.watch("contentText")?.trim() && (
                        <p className="text-xs text-gray-500">Saisissez d'abord du contenu</p>
                      )}
                      {imageState.uploadedImageUrl && (
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
                          disabled={imageState.generatedImageUrl !== ""}
                          className="w-full flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 disabled:opacity-50"
                        >
                          <Upload className="h-4 w-4" />
                          Choisir une image
                        </Button>
                      </div>
                      {imageState.generatedImageUrl && (
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