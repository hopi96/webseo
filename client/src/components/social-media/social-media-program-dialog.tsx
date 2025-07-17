import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Instagram, 
  Youtube, 
  Facebook, 
  Twitter, 
  Mail,
  Calendar,
  Eye,
  Edit3,
  Save,
  Loader2,
  FileText,
  Image
} from "lucide-react";

// Schéma de validation pour le formulaire
const socialMediaProgramSchema = z.object({
  newsletter_semaine: z.number().min(0).max(50),
  tiktok_semaine: z.number().min(0).max(50),
  instagram_semaine: z.number().min(0).max(50),
  xtwitter_semaine: z.number().min(0).max(50),
  youtube_semaine: z.number().min(0).max(50),
  facebook_semaine: z.number().min(0).max(50),
  blog_semaine: z.number().min(0).max(50),
  pinterest_semaine: z.number().min(0).max(50),
});

type SocialMediaProgramForm = z.infer<typeof socialMediaProgramSchema>;

interface SocialMediaProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteId: number;
  currentProgram?: string;
}

export function SocialMediaProgramDialog({ 
  open, 
  onOpenChange, 
  websiteId, 
  currentProgram 
}: SocialMediaProgramDialogProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fonction pour parser le programme existant
  const parseExistingProgram = (programText?: string) => {
    if (!programText) return null;
    
    try {
      const parsed = JSON.parse(programText);
      return parsed.frequence_publication?.plateformes || null;
    } catch {
      return null;
    }
  };

  const existingProgram = parseExistingProgram(currentProgram);

  const form = useForm<SocialMediaProgramForm>({
    resolver: zodResolver(socialMediaProgramSchema),
    defaultValues: {
      newsletter_semaine: existingProgram?.newsletter?.par_semaine || 1,
      tiktok_semaine: existingProgram?.tiktok?.par_semaine || 4,
      instagram_semaine: existingProgram?.instagram?.par_semaine || 5,
      xtwitter_semaine: existingProgram?.xtwitter?.par_semaine || 7,
      youtube_semaine: existingProgram?.youtube?.par_semaine || 2,
      facebook_semaine: existingProgram?.facebook?.par_semaine || 3,
      blog_semaine: existingProgram?.blog?.par_semaine || 2,
      pinterest_semaine: existingProgram?.pinterest?.par_semaine || 3,
    },
  });

  // Fonction pour générer le JSON final
  const generateProgramJson = (data: SocialMediaProgramForm) => {
    return {
      frequence_publication: {
        plateformes: {
          newsletter: {
            par_semaine: data.newsletter_semaine,
            par_mois: data.newsletter_semaine * 4
          },
          tiktok: {
            par_semaine: data.tiktok_semaine,
            par_mois: data.tiktok_semaine * 4
          },
          instagram: {
            par_semaine: data.instagram_semaine,
            par_mois: data.instagram_semaine * 4
          },
          xtwitter: {
            par_semaine: data.xtwitter_semaine,
            par_mois: data.xtwitter_semaine * 4
          },
          youtube: {
            par_semaine: data.youtube_semaine,
            par_mois: data.youtube_semaine * 4
          },
          facebook: {
            par_semaine: data.facebook_semaine,
            par_mois: data.facebook_semaine * 4
          },
          blog: {
            par_semaine: data.blog_semaine,
            par_mois: data.blog_semaine * 4
          },
          pinterest: {
            par_semaine: data.pinterest_semaine,
            par_mois: data.pinterest_semaine * 4
          }
        }
      }
    };
  };

  // Mutation pour mettre à jour le programme
  const updateProgramMutation = useMutation({
    mutationFn: async (data: SocialMediaProgramForm) => {
      const programJson = generateProgramJson(data);
      const response = await apiRequest('PUT', `/api/sites-airtable/${websiteId}/social-program`, {
        programme_rs: JSON.stringify(programJson)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sites-airtable'] });
      toast({
        title: "Programme mis à jour",
        description: "Le programme de publications des réseaux sociaux a été sauvegardé avec succès",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le programme",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SocialMediaProgramForm) => {
    updateProgramMutation.mutate(data);
  };

  // Icônes pour chaque plateforme
  const platformIcons = {
    newsletter: <Mail className="w-5 h-5 text-blue-600" />,
    tiktok: <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">T</div>,
    instagram: <Instagram className="w-5 h-5 text-pink-600" />,
    xtwitter: <Twitter className="w-5 h-5 text-blue-400" />,
    youtube: <Youtube className="w-5 h-5 text-red-600" />,
    facebook: <Facebook className="w-5 h-5 text-blue-700" />,
    blog: <FileText className="w-5 h-5 text-green-600" />,
    pinterest: <Image className="w-5 h-5 text-red-500" />,
  };

  const platformNames = {
    newsletter: "Newsletter",
    tiktok: "TikTok",
    instagram: "Instagram",
    xtwitter: "X (Twitter)",
    youtube: "YouTube",
    facebook: "Facebook",
    blog: "Blog",
    pinterest: "Pinterest",
  };

  const currentValues = form.watch();
  const previewData = generateProgramJson(currentValues);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Programme de publications réseaux sociaux
          </DialogTitle>
          <DialogDescription>
            Configurez la fréquence de publication pour chaque plateforme. 
            Le calcul mensuel se fait automatiquement (x4 semaines).
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center mb-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              type="button"
              variant={!isPreviewMode ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsPreviewMode(false)}
              className="flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              Éditer
            </Button>
            <Button
              type="button"
              variant={isPreviewMode ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsPreviewMode(true)}
              className="flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              Aperçu JSON
            </Button>
          </div>
        </div>

        {!isPreviewMode ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(platformNames).map(([key, name]) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name={`${key}_semaine` as keyof SocialMediaProgramForm}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          {platformIcons[key as keyof typeof platformIcons]}
                          {name}
                        </FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                            <span className="text-sm text-gray-500">
                              publications/semaine
                            </span>
                            <Badge variant="outline" className="ml-auto">
                              {(field.value * 4)} /mois
                            </Badge>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={updateProgramMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {updateProgramMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aperçu du JSON généré</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(previewData, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Résumé des publications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(platformNames).map(([key, name]) => {
                    const weeklyValue = currentValues[`${key}_semaine` as keyof SocialMediaProgramForm];
                    const monthlyValue = weeklyValue * 4;
                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          {platformIcons[key as keyof typeof platformIcons]}
                          <span className="font-medium">{name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{weeklyValue}/sem</div>
                          <div className="text-sm text-gray-500">{monthlyValue}/mois</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Fermer
              </Button>
              <Button
                onClick={() => form.handleSubmit(onSubmit)()}
                disabled={updateProgramMutation.isPending}
                className="flex items-center gap-2"
              >
                {updateProgramMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Sauvegarder
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}