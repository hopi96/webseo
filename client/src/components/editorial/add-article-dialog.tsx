import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, X, Sparkles, Globe, Upload, Image } from "lucide-react";
import { AIGenerationDialog } from "./ai-generation-dialog";

const addArticleSchema = z.object({
  contentText: z.string().min(1, "Le contenu est requis"),
  typeContent: z.enum(["xtwitter", "instagram", "article", "newsletter", "facebook", "pinterest", "google my business"]),
  statut: z.enum(["en attente", "à réviser", "en cours", "publié"]),
  hasImage: z.boolean(),
  imageUrl: z.string().optional(),
  dateDePublication: z.string(),
  siteId: z.number()
});

interface AddArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
}

type AddArticleFormData = z.infer<typeof addArticleSchema>;

export function AddArticleDialog({ open, onOpenChange, defaultDate }: AddArticleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  // Récupération des sites web depuis la table analyse SEO d'Airtable
  const { data: websites = [] } = useQuery({
    queryKey: ['/api/sites-airtable'],
    select: (data: any[]) => data || []
  });

  const form = useForm<AddArticleFormData>({
    resolver: zodResolver(addArticleSchema),
    defaultValues: {
      contentText: "",
      typeContent: "xtwitter",
      statut: "en attente",
      hasImage: false,
      imageUrl: "",
      dateDePublication: defaultDate || new Date().toISOString().split('T')[0],
      siteId: websites.length > 0 ? websites[0].id : 1
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
        prompt: `Créer une image optimisée pour ${typeContent} basée sur ce contenu : "${contentText}"`
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

  const createMutation = useMutation({
    mutationFn: async (data: AddArticleFormData) => {
      const response = await apiRequest(
        "POST",
        "/api/editorial-content",
        {
          ...data,
          dateDePublication: new Date(data.dateDePublication).toISOString()
        }
      );

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contenu créé",
        description: "Le nouveau contenu a été ajouté avec succès.",
      });
      
      // Réinitialiser complètement le formulaire
      form.reset({
        contentText: "",
        typeContent: "xtwitter",
        statut: "en attente",
        hasImage: false,
        imageUrl: "",
        dateDePublication: new Date().toISOString().split('T')[0],
        siteId: websites.length > 0 ? websites[0].id : 1
      });
      
      // Réinitialiser les images
      resetImages();
      
      queryClient.invalidateQueries({ queryKey: ["/api/editorial-content"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le contenu.",
        variant: "destructive",
      });
    }
  });

  const handleAIGeneration = (generatedContent: string) => {
    form.setValue('contentText', generatedContent);
  };

  const onSubmit = (data: AddArticleFormData) => {
    setLoading(true);
    createMutation.mutate(data);
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "xtwitter":
        return "X (Twitter)";
      case "instagram":
        return "Instagram";
      case "facebook":
        return "Facebook";
      case "pinterest":
        return "Pinterest";
      case "google my business":
        return "Google My Business";
      case "article":
        return "Article";
      case "newsletter":
        return "Newsletter";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter un nouveau contenu
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="contentText">Contenu *</Label>
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
              <Textarea
                id="contentText"
                {...form.register("contentText")}
                placeholder="Saisissez votre contenu ici..."
                className="min-h-[120px]"
              />
              {form.formState.errors.contentText && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.contentText.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="typeContent">Type de contenu</Label>
                <Select
                  value={form.watch("typeContent")}
                  onValueChange={(value: any) => form.setValue("typeContent", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
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
              </div>

              <div>
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={form.watch("statut")}
                  onValueChange={(value: any) => form.setValue("statut", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en attente">En attente</SelectItem>
                    <SelectItem value="à réviser">À réviser</SelectItem>
                    <SelectItem value="en cours">En cours</SelectItem>
                    <SelectItem value="publié">Publié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="siteId" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Site web *
              </Label>
              <Select
                value={form.watch("siteId")?.toString()}
                onValueChange={(value) => form.setValue("siteId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un site web" />
                </SelectTrigger>
                <SelectContent>
                  {websites.map((website: any) => (
                    <SelectItem key={website.id} value={website.id.toString()}>
                      {website.name} ({website.url})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.siteId && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.siteId.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="dateDePublication" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date de publication
              </Label>
              <Input
                id="dateDePublication"
                type="date"
                {...form.register("dateDePublication")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="hasImage" className="text-sm font-medium">
                Contient une image
              </Label>
              <Switch
                id="hasImage"
                checked={form.watch("hasImage")}
                onCheckedChange={(checked) => form.setValue("hasImage", checked)}
              />
            </div>

            {/* Section gestion d'images */}
            {form.watch("hasImage") && (
              <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Gestion des images
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetImages}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                    Réinitialiser
                  </Button>
                </div>

                {/* Options d'image - Choix exclusif */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Choisissez l'une des deux options :</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Génération par IA */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Option 1: Génération par IA</Label>
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
                      <Label className="text-sm font-medium">Option 2: Upload d'image</Label>
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
                          id="image-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('image-upload')?.click()}
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

                {generatingImage && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Génération de l'image en cours...</span>
                  </div>
                )}

                {/* Aperçu de l'image générée par IA */}
                {generatedImageUrl && (
                  <div className="space-y-2">
                    <div className="relative">
                      <img
                        src={generatedImageUrl}
                        alt="Image générée par IA"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs">
                        DALL-E 3
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Image générée automatiquement par DALL-E 3
                    </p>
                  </div>
                )}

                {/* Aperçu de l'image uploadée */}
                {uploadedImageUrl && (
                  <div className="space-y-2">
                    <div className="relative">
                      <img
                        src={uploadedImageUrl}
                        alt="Image uploadée"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                        UPLOADÉE
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {uploadedImageFile ? `Fichier: ${uploadedImageFile.name}` : "Image uploadée"}
                    </p>
                  </div>
                )}

                {form.watch("imageUrl") && (
                  <div>
                    <Label htmlFor="imageUrl" className="text-sm font-medium">URL de l'image</Label>
                    <Input
                      id="imageUrl"
                      {...form.register("imageUrl")}
                      placeholder="https://..."
                      className="mt-1"
                      readOnly
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || createMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading || createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le contenu
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
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