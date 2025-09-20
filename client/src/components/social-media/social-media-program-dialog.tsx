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
  Image,
  CheckCircle,
  HelpCircle
} from "lucide-react";

// Schéma de validation pour le formulaire
const socialMediaProgramSchema = z.object({
  newsletter_semaine: z.number().min(0).max(50),
  newsletter_mois: z.number().min(0).max(50),
  tiktok_semaine: z.number().min(0).max(50),
  tiktok_mois: z.number().min(0).max(50),
  instagram_semaine: z.number().min(0).max(50),
  instagram_mois: z.number().min(0).max(50),
  xtwitter_semaine: z.number().min(0).max(50),
  xtwitter_mois: z.number().min(0).max(50),
  youtube_semaine: z.number().min(0).max(50),
  youtube_mois: z.number().min(0).max(50),
  facebook_semaine: z.number().min(0).max(50),
  facebook_mois: z.number().min(0).max(50),
  blog_semaine: z.number().min(0).max(50),
  blog_mois: z.number().min(0).max(50),
  pinterest_semaine: z.number().min(0).max(50),
  pinterest_mois: z.number().min(0).max(50),
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
      newsletter_mois: existingProgram?.newsletter?.par_mois || 4,
      tiktok_semaine: existingProgram?.tiktok?.par_semaine || 4,
      tiktok_mois: existingProgram?.tiktok?.par_mois || 16,
      instagram_semaine: existingProgram?.instagram?.par_semaine || 5,
      instagram_mois: existingProgram?.instagram?.par_mois || 20,
      xtwitter_semaine: existingProgram?.xtwitter?.par_semaine || 7,
      xtwitter_mois: existingProgram?.xtwitter?.par_mois || 28,
      youtube_semaine: existingProgram?.youtube?.par_semaine || 2,
      youtube_mois: existingProgram?.youtube?.par_mois || 8,
      facebook_semaine: existingProgram?.facebook?.par_semaine || 3,
      facebook_mois: existingProgram?.facebook?.par_mois || 12,
      blog_semaine: existingProgram?.blog?.par_semaine || 2,
      blog_mois: existingProgram?.blog?.par_mois || 8,
      pinterest_semaine: existingProgram?.pinterest?.par_semaine || 3,
      pinterest_mois: existingProgram?.pinterest?.par_mois || 12,
    },
  });

  // Fonction pour calculer la fréquence optimale
  const calculateFrequency = (semaine: number, mois: number) => {
    // Si publications mensuelles < 4, on peut utiliser la valeur mensuelle directement
    if (mois < 4) {
      return {
        par_semaine: 0,
        par_mois: mois
      };
    }
    // Sinon, on utilise le calcul hebdomadaire
    return {
      par_semaine: semaine,
      par_mois: semaine * 4
    };
  };

  // Fonction pour générer le JSON final
  const generateProgramJson = (data: SocialMediaProgramForm) => {
    return {
      frequence_publication: {
        plateformes: {
          newsletter: calculateFrequency(data.newsletter_semaine, data.newsletter_mois),
          tiktok: calculateFrequency(data.tiktok_semaine, data.tiktok_mois),
          instagram: calculateFrequency(data.instagram_semaine, data.instagram_mois),
          xtwitter: calculateFrequency(data.xtwitter_semaine, data.xtwitter_mois),
          youtube: calculateFrequency(data.youtube_semaine, data.youtube_mois),
          facebook: calculateFrequency(data.facebook_semaine, data.facebook_mois),
          blog: calculateFrequency(data.blog_semaine, data.blog_mois),
          pinterest: calculateFrequency(data.pinterest_semaine, data.pinterest_mois)
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
            Pour moins de 4 publications/mois, utilisez le mode mensuel.
          </DialogDescription>
        </DialogHeader>

        {/* Message informatif si aucun programme n'est configuré */}
        {!currentProgram && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <HelpCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Aucun programme configuré
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Ce site n'a pas encore de programme de réseaux sociaux. Configurez les fréquences de publication ci-dessous pour commencer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message informatif si un programme existe */}
        {currentProgram && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Programme existant détecté
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Voici le programme de publications actuellement configuré pour ce site. Vous pouvez le modifier ci-dessous.
                </p>
              </div>
            </div>
          </div>
        )}

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
              <div className="grid grid-cols-1 gap-6">
                {Object.entries(platformNames).map(([key, name]) => (
                  <Card key={key} className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      {platformIcons[key as keyof typeof platformIcons]}
                      <h3 className="font-medium text-lg">{name}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`${key}_semaine` as keyof SocialMediaProgramForm}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Publications par semaine</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="50"
                                  {...field}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    field.onChange(value);
                                    // Auto-calcul du mensuel si >= 4 semaines
                                    if (value > 0) {
                                      form.setValue(`${key}_mois` as keyof SocialMediaProgramForm, value * 4);
                                    }
                                  }}
                                  className="w-20"
                                />
                                <span className="text-sm text-gray-500">publications/semaine</span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`${key}_mois` as keyof SocialMediaProgramForm}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Publications par mois</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="50"
                                  {...field}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    field.onChange(value);
                                    // Si moins de 4, on met les semaines à 0
                                    if (value < 4) {
                                      form.setValue(`${key}_semaine` as keyof SocialMediaProgramForm, 0);
                                    }
                                  }}
                                  className="w-20"
                                />
                                <span className="text-sm text-gray-500">publications/mois</span>
                                {field.value < 4 && field.value > 0 && (
                                  <Badge variant="secondary" className="text-xs">Mode mensuel</Badge>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                      {(() => {
                        const semaine = form.watch(`${key}_semaine` as keyof SocialMediaProgramForm);
                        const mois = form.watch(`${key}_mois` as keyof SocialMediaProgramForm);
                        
                        if (mois < 4 && mois > 0) {
                          return (
                            <span className="text-blue-600 dark:text-blue-400">
                              📅 Mode mensuel : {mois} publication{mois > 1 ? 's' : ''} par mois
                            </span>
                          );
                        } else if (semaine > 0) {
                          return (
                            <span className="text-green-600 dark:text-green-400">
                              📊 Mode hebdomadaire : {semaine} publication{semaine > 1 ? 's' : ''}/semaine = {semaine * 4} publications/mois
                            </span>
                          );
                        } else {
                          return (
                            <span className="text-gray-500">
                              💤 Aucune publication programmée
                            </span>
                          );
                        }
                      })()}
                    </div>
                  </Card>
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
                    const monthlyValue = currentValues[`${key}_mois` as keyof SocialMediaProgramForm];
                    const finalFreq = calculateFrequency(weeklyValue, monthlyValue);
                    
                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          {platformIcons[key as keyof typeof platformIcons]}
                          <span className="font-medium">{name}</span>
                        </div>
                        <div className="text-right">
                          {finalFreq.par_semaine > 0 ? (
                            <>
                              <div className="text-lg font-bold">{finalFreq.par_semaine}/sem</div>
                              <div className="text-sm text-gray-500">{finalFreq.par_mois}/mois</div>
                            </>
                          ) : (
                            <>
                              <div className="text-lg font-bold text-blue-600">{finalFreq.par_mois}/mois</div>
                              <div className="text-xs text-blue-500">Mode mensuel</div>
                            </>
                          )}
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