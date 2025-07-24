import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Facebook, Instagram, Twitter, Youtube, Clock, Loader2, Eye, EyeOff } from "lucide-react";

interface SocialParamsDialogProps {
  siteId: number;
  siteName: string;
  children?: React.ReactNode;
}

interface SocialParams {
  access_tokens: {
    facebook: string;
    instagram: string;
    pinterest: string;
    google_my_business: string;
    xtwitter: string;
    tiktok: string;
    prestashop_blog: string;
    brevo_newsletter: string;
  };
}

const platformConfigs = [
  {
    key: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    placeholder: 'Token d\'accès Facebook'
  },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    placeholder: 'Token d\'accès Instagram'
  },
  {
    key: 'pinterest',
    name: 'Pinterest',
    icon: Settings,
    color: 'text-red-600',
    placeholder: 'Token d\'accès Pinterest'
  },
  {
    key: 'google_my_business',
    name: 'Google My Business',
    icon: Settings,
    color: 'text-blue-500',
    placeholder: 'Clé API Google My Business'
  },
  {
    key: 'xtwitter',
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'text-black',
    placeholder: 'Bearer Token X/Twitter'
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    icon: Clock,
    color: 'text-black',
    placeholder: 'Token d\'accès TikTok'
  },
  {
    key: 'prestashop_blog',
    name: 'Blog Prestashop',
    icon: Settings,
    color: 'text-blue-700',
    placeholder: 'Clé API Prestashop'
  },
  {
    key: 'brevo_newsletter',
    name: 'Newsletter Brevo',
    icon: Settings,
    color: 'text-green-600',
    placeholder: 'Clé API Brevo'
  }
];

export function SocialParamsDialog({ siteId, siteName, children }: SocialParamsDialogProps) {
  const [open, setOpen] = useState(false);
  const [socialParams, setSocialParams] = useState<SocialParams>({
    access_tokens: {
      facebook: "",
      instagram: "",
      pinterest: "",
      google_my_business: "",
      xtwitter: "",
      tiktok: "",
      prestashop_blog: "",
      brevo_newsletter: ""
    }
  });
  const [showTokens, setShowTokens] = useState<{[key: string]: boolean}>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les paramètres existants
  const { data: existingParams, isLoading } = useQuery({
    queryKey: [`/api/sites-airtable/${siteId}/social-params`],
    enabled: open && !!siteId,
  });

  // Charger les paramètres existants quand ils arrivent
  useEffect(() => {
    if (existingParams) {
      setSocialParams(existingParams as SocialParams);
    }
  }, [existingParams]);

  // Mutation pour sauvegarder les paramètres
  const saveMutation = useMutation({
    mutationFn: async (params: SocialParams) => {
      const response = await fetch(`/api/sites-airtable/${siteId}/social-params`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save social parameters');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Paramètres sauvegardés",
        description: "Les tokens des réseaux sociaux ont été mis à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/sites-airtable/${siteId}/social-params`] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    },
  });

  const handleTokenChange = (platform: string, value: string) => {
    setSocialParams(prev => ({
      ...prev,
      access_tokens: {
        ...prev.access_tokens,
        [platform]: value
      }
    }));
  };

  const toggleTokenVisibility = (platform: string) => {
    setShowTokens(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const handleSave = () => {
    saveMutation.mutate(socialParams);
  };

  const getConfiguredCount = () => {
    return Object.values(socialParams.access_tokens).filter(token => token.trim() !== '').length;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres réseaux sociaux
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto smart-scroll-vertical">
        <DialogHeader>
          <DialogTitle>Paramètres des réseaux sociaux</DialogTitle>
          <DialogDescription>
            Configurez les tokens d'accès pour {siteName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement des paramètres...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Résumé de la configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Settings className="h-5 w-5 mr-2" />
                  État de la configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Plateformes configurées
                  </span>
                  <span className="font-semibold">
                    {getConfiguredCount()} / {platformConfigs.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(getConfiguredCount() / platformConfigs.length) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Formulaire des tokens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platformConfigs.map((platform) => {
                const Icon = platform.icon;
                const isConfigured = socialParams.access_tokens[platform.key as keyof typeof socialParams.access_tokens]?.trim() !== '';
                const isVisible = showTokens[platform.key];
                
                return (
                  <Card key={platform.key} className={`border-2 ${isConfigured ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-base">
                        <Icon className={`h-5 w-5 mr-2 ${platform.color}`} />
                        {platform.name}
                        {isConfigured && (
                          <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Configuré
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <Label htmlFor={platform.key} className="text-sm">
                          Token d'accès
                        </Label>
                        <div className="relative">
                          <Input
                            id={platform.key}
                            type={isVisible ? "text" : "password"}
                            placeholder={platform.placeholder}
                            value={socialParams.access_tokens[platform.key as keyof typeof socialParams.access_tokens]}
                            onChange={(e) => handleTokenChange(platform.key, e.target.value)}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => toggleTokenVisibility(platform.key)}
                          >
                            {isVisible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  "Sauvegarder les paramètres"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}