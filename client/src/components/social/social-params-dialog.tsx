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
import { Settings, Facebook, Instagram, Twitter, Youtube, Clock, Loader2, Eye, EyeOff, ExternalLink, HelpCircle } from "lucide-react";

interface SocialParamsDialogProps {
  siteId: number;
  siteName: string;
  children?: React.ReactNode;
}

interface SocialParams {
  facebook?: {
    page_id: string;
    access_token: string;
  };
  instagram?: {
    user_id: string;
    access_token: string;
  };
  pinterest?: {
    board_id: string;
    access_token: string;
  };
  google_my_business?: {
    account_id: string;
    location_id: string;
    access_token: string;
  };
  xtwitter?: {
    access_token: string;
  };
  tiktok?: {
    access_token: string;
  };
  prestashop_blog?: {
    base_url: string;
    api_key: string;
  };
  brevo_newsletter?: {
    api_key: string;
  };
}

const platformConfigs = [
  {
    key: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    fields: [
      { name: 'page_id', label: 'Page ID', placeholder: 'ID de la page Facebook' },
      { name: 'access_token', label: 'Token d\'accès', placeholder: 'Token d\'accès Facebook' }
    ],
    helpLinks: [
      { label: 'Générer un token d\'accès', url: 'https://developers.facebook.com/docs/facebook-login/guides/access-tokens/' },
      { label: 'Trouver le Page ID', url: 'https://www.facebook.com/help/1503421039731588/' }
    ]
  },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    fields: [
      { name: 'user_id', label: 'User ID', placeholder: 'ID utilisateur Instagram' },
      { name: 'access_token', label: 'Token d\'accès', placeholder: 'Token d\'accès Instagram' }
    ],
    helpLinks: [
      { label: 'Gérer les tokens Instagram', url: 'https://developers.facebook.com/docs/instagram-platform/reference/access_token/' }
    ]
  },
  {
    key: 'pinterest',
    name: 'Pinterest',
    icon: Settings,
    color: 'text-red-600',
    fields: [
      { name: 'board_id', label: 'Board ID', placeholder: 'ID du tableau Pinterest' },
      { name: 'access_token', label: 'Token d\'accès', placeholder: 'Token d\'accès Pinterest' }
    ],
    helpLinks: [
      { label: 'Configuration OAuth Pinterest', url: 'https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/' }
    ]
  },
  {
    key: 'google_my_business',
    name: 'Google My Business',
    icon: Settings,
    color: 'text-blue-500',
    fields: [
      { name: 'account_id', label: 'Account ID', placeholder: 'ID du compte GMB' },
      { name: 'location_id', label: 'Location ID', placeholder: 'ID du lieu GMB' },
      { name: 'access_token', label: 'Token d\'accès', placeholder: 'Token d\'accès GMB' }
    ],
    helpLinks: [
      { label: 'Implémenter OAuth GMB', url: 'https://developers.google.com/my-business/content/implement-oauth' }
    ]
  },
  {
    key: 'xtwitter',
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'text-black',
    fields: [
      { name: 'access_token', label: 'Bearer Token', placeholder: 'Bearer Token X/Twitter' }
    ],
    helpLinks: [
      { label: 'Générer un Bearer Token', url: 'https://developer.x.com/ja/docs/basics/authentication/guides/bearer-tokens' }
    ]
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    icon: Clock,
    color: 'text-black',
    fields: [
      { name: 'access_token', label: 'Token d\'accès', placeholder: 'Token d\'accès TikTok' }
    ],
    helpLinks: [
      { label: 'Gestion des tokens TikTok', url: 'https://developers.tiktok.com/doc/oauth-user-access-token-management' }
    ]
  },
  {
    key: 'prestashop_blog',
    name: 'Blog Prestashop',
    icon: Settings,
    color: 'text-blue-700',
    fields: [
      { name: 'base_url', label: 'URL de base', placeholder: 'URL de base Prestashop' },
      { name: 'api_key', label: 'Clé API', placeholder: 'Clé API Prestashop' }
    ],
    helpLinks: [
      { label: 'Créer une clé Webservice', url: 'https://devdocs.prestashop-project.org/9/webservice/tutorials/creating-access/' }
    ]
  },
  {
    key: 'brevo_newsletter',
    name: 'Newsletter Brevo',
    icon: Settings,
    color: 'text-green-600',
    fields: [
      { name: 'api_key', label: 'Clé API', placeholder: 'Clé API Brevo' }
    ],
    helpLinks: [
      { label: 'Générer une API Key Brevo', url: 'https://developers.brevo.com/docs/getting-started' }
    ]
  }
];

export function SocialParamsDialog({ siteId, siteName, children }: SocialParamsDialogProps) {
  const [open, setOpen] = useState(false);
  const [socialParams, setSocialParams] = useState<SocialParams>({});
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

  const handleFieldChange = (platform: string, fieldName: string, value: string) => {
    setSocialParams(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform as keyof SocialParams],
        [fieldName]: value
      }
    }));
  };

  const toggleTokenVisibility = (key: string) => {
    setShowTokens(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    saveMutation.mutate(socialParams);
  };

  const getConfiguredCount = () => {
    return Object.keys(socialParams).filter(platform => {
      const config = socialParams[platform as keyof SocialParams];
      if (!config) return false;
      return Object.values(config).some(value => value && value.toString().trim() !== '');
    }).length;
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
                const platformData = socialParams[platform.key as keyof SocialParams];
                const isConfigured = platformData && Object.values(platformData).some(value => value && value.toString().trim() !== '');
                
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
                      <div className="space-y-3">
                        {platform.fields.map((field) => {
                          const fieldKey = `${platform.key}_${field.name}`;
                          const isVisible = showTokens[fieldKey];
                          const currentValue = platformData?.[field.name as keyof typeof platformData] || '';
                          
                          return (
                            <div key={field.name} className="space-y-2">
                              <Label htmlFor={fieldKey} className="text-sm">
                                {field.label}
                              </Label>
                              <div className="relative">
                                <Input
                                  id={fieldKey}
                                  type={field.name.includes('token') || field.name.includes('key') ? (isVisible ? "text" : "password") : "text"}
                                  placeholder={field.placeholder}
                                  value={currentValue}
                                  onChange={(e) => handleFieldChange(platform.key, field.name, e.target.value)}
                                  className={field.name.includes('token') || field.name.includes('key') ? "pr-10" : ""}
                                />
                                {(field.name.includes('token') || field.name.includes('key')) && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                    onClick={() => toggleTokenVisibility(fieldKey)}
                                  >
                                    {isVisible ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Section d'aide avec liens de documentation */}
                        {platform.helpLinks && platform.helpLinks.length > 0 && (
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <HelpCircle className="h-4 w-4 text-blue-500" />
                              <span className="text-xs font-medium text-gray-600">Documentation officielle</span>
                            </div>
                            <div className="space-y-1">
                              {platform.helpLinks.map((link, index) => (
                                <a
                                  key={index}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {link.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
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