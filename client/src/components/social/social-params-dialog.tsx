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
import { Settings, Facebook, Instagram, Twitter, Youtube, Clock, Loader2, Eye, EyeOff, ExternalLink, HelpCircle, CheckCircle, AlertCircle, Info, Star, PlayCircle } from "lucide-react";

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

// Groupement des plateformes par catégorie pour une meilleure organisation
const platformGroups = {
  social: {
    title: "Réseaux sociaux principaux",
    description: "Plateformes de publication sociale",
    priority: "high",
    platforms: ['facebook', 'instagram', 'xtwitter']
  },
  content: {
    title: "Création de contenu",
    description: "Plateformes de contenu et blog",
    priority: "medium", 
    platforms: ['tiktok', 'pinterest', 'prestashop_blog']
  },
  marketing: {
    title: "Marketing et newsletter",
    description: "Outils de marketing et communication",
    priority: "medium",
    platforms: ['brevo_newsletter', 'google_my_business']
  }
};

const platformConfigs = [
  {
    key: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    difficulty: 'Facile',
    description: 'Publiez automatiquement sur votre page Facebook professionnelle',
    fields: [
      { name: 'page_id', label: 'Page ID', placeholder: 'ID de la page Facebook', description: 'Identifiant unique de votre page Facebook' },
      { name: 'access_token', label: 'Token d\'accès', placeholder: 'Token d\'accès Facebook', description: 'Clé pour publier sur votre page' }
    ],
    helpLinks: [
      { label: 'Générer un token d\'accès', url: 'https://developers.facebook.com/docs/facebook-login/guides/access-tokens/' },
      { label: 'Trouver le Page ID', url: 'https://www.facebook.com/help/1503421039731588/' }
    ],
    videoTutorials: [
      { label: '🎥 Guide Graph API Explorer', url: 'https://developers.facebook.com/tools/explorer/', description: 'Tester et générer des tokens en temps réel' },
      { label: '📺 Tutorial accès Facebook API', url: 'https://elfsight.com/blog/how-to-get-facebook-access-token/', description: 'Guide complet avec captures d\'écran' }
    ]
  },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    difficulty: 'Moyen',
    description: 'Partagez vos contenus visuels sur Instagram automatiquement',
    fields: [
      { name: 'user_id', label: 'User ID', placeholder: 'ID utilisateur Instagram', description: 'Identifiant de votre compte Instagram' },
      { name: 'access_token', label: 'Token d\'accès', placeholder: 'Token d\'accès Instagram', description: 'Autorisation pour publier sur Instagram' }
    ],
    helpLinks: [
      { label: 'Gérer les tokens Instagram', url: 'https://developers.facebook.com/docs/instagram-platform/reference/access_token/' }
    ],
    videoTutorials: [
      { label: '🎥 Setup Instagram Graph API', url: 'https://developers.facebook.com/docs/instagram-platform/', description: 'Documentation officielle Meta avec exemples' },
      { label: '📺 Guide complet Instagram API', url: 'https://www.getphyllo.com/post/how-to-use-instagram-basic-display-api', description: 'Tutorial étape par étape avec code' }
    ]
  },
  {
    key: 'pinterest',
    name: 'Pinterest',
    icon: Settings,
    color: 'text-red-600',
    difficulty: 'Difficile',
    description: 'Partagez vos épingles sur Pinterest pour augmenter votre visibilité',
    fields: [
      { name: 'board_id', label: 'Board ID', placeholder: 'ID du tableau Pinterest', description: 'Identifiant de votre tableau Pinterest' },
      { name: 'access_token', label: 'Token d\'accès', placeholder: 'Token d\'accès Pinterest', description: 'Clé d\'API pour publier sur Pinterest' }
    ],
    helpLinks: [
      { label: 'Configuration OAuth Pinterest', url: 'https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/' }
    ],
    videoTutorials: [
      { label: '🎥 Pinterest API Quickstart', url: 'https://github.com/pinterest/api-quickstart', description: 'Dépôt GitHub officiel avec exemples de code' },
      { label: '📺 Guide développeur Pinterest', url: 'https://developers.pinterest.com/', description: 'Documentation complète avec tutoriels intéractifs' }
    ]
  },
  {
    key: 'google_my_business',
    name: 'Google My Business',
    icon: Settings,
    color: 'text-blue-500',
    difficulty: 'Difficile',
    description: 'Gérez vos publications sur votre fiche Google My Business',
    fields: [
      { name: 'account_id', label: 'Account ID', placeholder: 'ID du compte GMB', description: 'Identifiant de votre compte Google My Business' },
      { name: 'location_id', label: 'Location ID', placeholder: 'ID du lieu GMB', description: 'Identifiant de votre établissement' },
      { name: 'access_token', label: 'Token d\'accès', placeholder: 'Token d\'accès GMB', description: 'Clé d\'API Google My Business' }
    ],
    helpLinks: [
      { label: 'Implémenter OAuth GMB', url: 'https://developers.google.com/my-business/content/implement-oauth' }
    ],
    videoTutorials: [
      { label: '🎥 Setup Google Business Profile API', url: 'https://developers.google.com/my-business/content/basic-setup', description: 'Guide officiel Google avec prérequis' },
      { label: '📺 Exemples de code GMB', url: 'https://github.com/google/google-my-business-samples', description: 'Dépôt GitHub avec examples pratiques' }
    ]
  },
  {
    key: 'xtwitter',
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'text-black',
    difficulty: 'Facile',
    description: 'Publiez vos tweets automatiquement pour engager votre audience',
    fields: [
      { name: 'access_token', label: 'Bearer Token', placeholder: 'Bearer Token X/Twitter', description: 'Token d\'autorisation pour Twitter/X' }
    ],
    helpLinks: [
      { label: 'Générer un Bearer Token', url: 'https://developer.x.com/ja/docs/basics/authentication/guides/bearer-tokens' }
    ],
    videoTutorials: [
      { label: '🎥 Tutorial X API Bearer Token', url: 'https://developer.x.com/en/docs/tutorials/step-by-step-guide-to-making-your-first-request-to-the-twitter-api-v2', description: 'Guide officiel étape par étape' },
      { label: '📺 Twitter API 2024 Guide', url: 'https://www.tweetlio.com/blog/master-the-twitter-api-your-ultimate-guide-for-2024', description: 'Guide complet avec examples pratiques' }
    ]
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    icon: Clock,
    color: 'text-black',
    difficulty: 'Difficile',
    description: 'Créez du contenu vidéo engageant sur TikTok',
    fields: [
      { name: 'access_token', label: 'Token d\'accès', placeholder: 'Token d\'accès TikTok', description: 'Autorisation pour publier sur TikTok' }
    ],
    helpLinks: [
      { label: 'Gestion des tokens TikTok', url: 'https://developers.tiktok.com/doc/oauth-user-access-token-management' }
    ],
    videoTutorials: [
      { label: '🎥 TikTok Developer Setup', url: 'https://developers.tiktok.com/doc/overview', description: 'Documentation officielle avec guide de démarrage' },
      { label: '📺 Guide TikTok API 2024', url: 'https://www.getphyllo.com/post/introduction-to-tiktok-api', description: 'Tutorial complet pour développeurs' }
    ]
  },
  {
    key: 'prestashop_blog',
    name: 'Blog Prestashop',
    icon: Settings,
    color: 'text-blue-700',
    difficulty: 'Moyen',
    description: 'Publiez vos articles de blog directement sur votre site Prestashop',
    fields: [
      { name: 'base_url', label: 'URL de base', placeholder: 'URL de base Prestashop', description: 'Adresse de votre site Prestashop' },
      { name: 'api_key', label: 'Clé API', placeholder: 'Clé API Prestashop', description: 'Clé webservice Prestashop' }
    ],
    helpLinks: [
      { label: 'Créer une clé Webservice', url: 'https://devdocs.prestashop-project.org/9/webservice/tutorials/creating-access/' }
    ],
    videoTutorials: [
      { label: '🎥 Prestashop Webservice API', url: 'https://devdocs.prestashop-project.org/9/webservice/', description: 'Documentation officielle avec exemples' },
      { label: '📺 Tutorial API Prestashop', url: 'https://devdocs.prestashop-project.org/9/webservice/tutorials/', description: 'Tutoriels officiels étape par étape' }
    ]
  },
  {
    key: 'brevo_newsletter',
    name: 'Newsletter Brevo',
    icon: Settings,
    color: 'text-green-600',
    difficulty: 'Facile',
    description: 'Envoyez vos newsletters automatiquement via Brevo',
    fields: [
      { name: 'api_key', label: 'Clé API', placeholder: 'Clé API Brevo', description: 'Clé d\'API pour envoyer des emails via Brevo' }
    ],
    helpLinks: [
      { label: 'Générer une API Key Brevo', url: 'https://developers.brevo.com/docs/getting-started' }
    ],
    videoTutorials: [
      { label: '🎥 Tutorial Brevo 2024', url: 'https://www.classcentral.com/course/youtube-complete-brevo-tutorial-2024-email-marketing-for-beginners-336730', description: 'Guide complet Brevo pour débutants (58 min)' },
      { label: '📺 Brevo API Node.js', url: 'https://www.suprsend.com/post/how-to-send-transactional-emails-with-brevo-api-in-node-js', description: 'Tutorial API avec exemples de code' }
    ]
  }
];

export function SocialParamsDialog({ siteId, siteName, children }: SocialParamsDialogProps) {
  const [open, setOpen] = useState(false);
  const [socialParams, setSocialParams] = useState<SocialParams>({});
  const [showTokens, setShowTokens] = useState<{[key: string]: boolean}>({});
  const [selectedGroup, setSelectedGroup] = useState<string>('social');
  
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

  const getGroupConfiguredCount = (groupKey: string) => {
    const group = platformGroups[groupKey as keyof typeof platformGroups];
    return group.platforms.filter(platformKey => {
      const config = socialParams[platformKey as keyof SocialParams];
      if (!config) return false;
      return Object.values(config).some(value => value && value.toString().trim() !== '');
    }).length;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'Facile': return 'text-green-600 bg-green-100';
      case 'Moyen': return 'text-yellow-600 bg-yellow-100';
      case 'Difficile': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
          <div className="space-y-6">
            {/* En-tête avec introduction */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Configuration des accès aux réseaux sociaux
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Ces paramètres permettent à votre système de publier automatiquement du contenu sur vos réseaux sociaux. 
                    Commencez par les plateformes essentielles, puis ajoutez progressivement les autres selon vos besoins.
                  </p>
                </div>
              </div>
            </div>

            {/* Résumé de la configuration avec groupes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Settings className="h-5 w-5 mr-2" />
                  État de la configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {Object.entries(platformGroups).map(([groupKey, group]) => {
                    const configuredCount = getGroupConfiguredCount(groupKey);
                    const totalCount = group.platforms.length;
                    const percentage = totalCount > 0 ? (configuredCount / totalCount) * 100 : 0;
                    
                    return (
                      <div key={groupKey} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {configuredCount}/{totalCount}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{group.title}</div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              group.priority === 'high' ? 'bg-green-500' : 
                              group.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Total : {getConfiguredCount()} / {platformConfigs.length} plateformes configurées
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Navigation par catégories */}
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.entries(platformGroups).map(([groupKey, group]) => {
                const isSelected = selectedGroup === groupKey;
                const configuredCount = getGroupConfiguredCount(groupKey);
                
                return (
                  <Button
                    key={groupKey}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedGroup(groupKey)}
                    className="flex items-center gap-2"
                  >
                    {group.priority === 'high' && <Star className="h-4 w-4" />}
                    {group.title}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      configuredCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {configuredCount}/{group.platforms.length}
                    </span>
                  </Button>
                );
              })}
            </div>

            {/* Affichage des plateformes du groupe sélectionné */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {platformGroups[selectedGroup as keyof typeof platformGroups]?.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {platformGroups[selectedGroup as keyof typeof platformGroups]?.description}
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {platformConfigs
                  .filter(platform => platformGroups[selectedGroup as keyof typeof platformGroups]?.platforms.includes(platform.key))
                  .map((platform) => {
                    const Icon = platform.icon;
                    const platformData = socialParams[platform.key as keyof SocialParams];
                    const isConfigured = platformData && Object.values(platformData).some(value => value && value.toString().trim() !== '');
                    
                    return (
                      <Card key={platform.key} className={`border-2 transition-all duration-200 hover:shadow-md ${
                        isConfigured ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center">
                              <Icon className={`h-5 w-5 mr-2 ${platform.color}`} />
                              {platform.name}
                            </div>
                            <div className="flex items-center gap-2">
                              {platform.difficulty && (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  getDifficultyColor(platform.difficulty)
                                }`}>
                                  {platform.difficulty}
                                </span>
                              )}
                              {isConfigured && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                          </CardTitle>
                          {platform.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {platform.description}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {platform.fields.map((field) => {
                              const fieldKey = `${platform.key}_${field.name}`;
                              const isVisible = showTokens[fieldKey];
                              const currentValue = platformData?.[field.name as keyof typeof platformData] || '';
                              
                              return (
                                <div key={field.name} className="space-y-2">
                                  <Label htmlFor={fieldKey} className="text-sm font-medium">
                                    {field.label}
                                    {field.description && (
                                      <span className="block text-xs text-gray-500 font-normal mt-1">
                                        {field.description}
                                      </span>
                                    )}
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      id={fieldKey}
                                      type={field.name.includes('token') || field.name.includes('key') ? (isVisible ? "text" : "password") : "text"}
                                      placeholder={field.placeholder}
                                      value={currentValue}
                                      onChange={(e) => handleFieldChange(platform.key, field.name, e.target.value)}
                                      className={`${field.name.includes('token') || field.name.includes('key') ? "pr-10" : ""} ${
                                        currentValue ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : ''
                                      }`}
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
                              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-2">
                                  <HelpCircle className="h-4 w-4 text-blue-500" />
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Aide à la configuration</span>
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

                            {/* Section tutoriels vidéo */}
                            {platform.videoTutorials && platform.videoTutorials.length > 0 && (
                              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-2">
                                  <PlayCircle className="h-4 w-4 text-purple-500" />
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tutoriels vidéo et guides</span>
                                </div>
                                <div className="space-y-2">
                                  {platform.videoTutorials.map((tutorial, index) => (
                                    <a
                                      key={index}
                                      href={tutorial.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block p-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-md border border-purple-100 dark:border-purple-800 hover:border-purple-200 dark:hover:border-purple-700 transition-colors group"
                                      data-testid={`video-tutorial-${platform.key}-${index}`}
                                    >
                                      <div className="flex items-start gap-2">
                                        <PlayCircle className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors" />
                                        <div className="min-w-0 flex-1">
                                          <div className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-1 line-clamp-1">
                                            {tutorial.label}
                                          </div>
                                          <div className="text-xs text-purple-600 dark:text-purple-400 line-clamp-2">
                                            {tutorial.description}
                                          </div>
                                        </div>
                                        <ExternalLink className="h-3 w-3 text-purple-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
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