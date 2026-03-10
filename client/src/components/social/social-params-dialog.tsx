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
import { Settings, Facebook, Instagram, Twitter, Youtube, Clock, Loader2, Eye, EyeOff, ExternalLink, HelpCircle, CheckCircle, AlertCircle, Info, Star, PlayCircle, Linkedin } from "lucide-react";

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
  linkedin?: {
    author_urn: string;
    access_token: string;
    visibility?: string;
  };
  wordpress_blog?: {
    base_url: string;
    username: string;
    application_password: string;
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
    platforms: ['facebook', 'instagram', 'linkedin', 'xtwitter']
  },
  content: {
    title: "Création de contenu",
    description: "Plateformes de contenu et blog",
    priority: "medium",
    platforms: ['tiktok', 'pinterest', 'wordpress_blog']
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
      { label: '📹 Trouver l\'ID de ta page Facebook', url: 'https://www.youtube.com/watch?v=EuUKTonN-4c', description: 'Tutoriel en français pour localiser l\'identifiant de votre page' },
      { label: '📹 Générer un token via Graph API', url: 'https://www.youtube.com/watch?v=gAdSKvRwhqA', description: 'Guide pas-à-pas pour créer et publier via l\'API Facebook' }
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
      { label: '📹 Trouver ton Instagram User ID', url: 'https://www.youtube.com/watch?v=YhGTNJzdFaU', description: 'Guide complet pour localiser votre identifiant utilisateur Instagram' },
      { label: '📹 Générer un long-lived access token', url: 'https://www.youtube.com/watch?v=9btrKUO9Jo0', description: 'Indispensable pour l\'automatisation Instagram' }
    ]
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-sky-700',
    difficulty: 'Moyen',
    description: 'Publiez automatiquement sur votre profil ou page LinkedIn',
    fields: [
      { name: 'author_urn', label: 'Author URN', placeholder: 'urn:li:person:xxxx', description: "URN du profil ou de l'organisation" },
      { name: 'access_token', label: 'Token d\'accès', placeholder: 'Token d\'accès LinkedIn', description: 'Token OAuth (scope w_member_social ou w_organization_social)' },
      { name: 'visibility', label: 'Visibilité', placeholder: 'PUBLIC', description: 'PUBLIC ou CONNECTIONS (optionnel)' }
    ],
    helpLinks: [
      { label: 'Documentation LinkedIn UGC Posts', url: 'https://learn.microsoft.com/linkedin/consumer/integrations/self-serve/share-on-linkedin' }
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
      { label: '📹 Trouver le Board ID', url: 'https://www.youtube.com/watch?v=VWrWf9ZDuAQ', description: 'Méthode rapide pour localiser l\'identifiant de votre board Pinterest' },
      { label: '📹 Pinterest API – Getting Access', url: 'https://www.youtube.com/watch?v=4MSGXHtcpsM', description: 'Création d\'app et authentification complète sur Pinterest' },
      { label: '📹 URL de redirection OAuth Pinterest', url: 'https://www.youtube.com/watch?v=DHF4LQYqNY4', description: 'Guide pour comprendre et configurer les redirections OAuth' }
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
      { label: '📹 Trouver Business Profile ID et Place ID', url: 'https://www.youtube.com/watch?v=SEHhapS91_c', description: 'Indispensables pour Account/Location ID - Guide pratique' },
      { label: '📹 Récupérer Place ID / CID', url: 'https://www.youtube.com/watch?v=-7E3WmGczWc', description: 'Autres méthodes pour localiser les identifiants GMB' },
      { label: '📹 Token OAuth 2.0 Google APIs', url: 'https://www.youtube.com/watch?v=e-hOP3P-cW8', description: 'Démonstration complète avec Postman' },
      { label: '📹 Flux OAuth 2.0 Google pas-à-pas', url: 'https://www.youtube.com/watch?v=1XUu7-yIoUY', description: 'Implémentation OAuth spécifique Google' }
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
      { label: '📹 Obtenir les clés API et Bearer Token', url: 'https://www.youtube.com/watch?v=Op70wCjIiuk', description: 'Mise à jour 2024 - Méthode recommandée pour X/Twitter' },
      { label: '📹 Démarrer sur l\'API v2', url: 'https://www.youtube.com/watch?v=kH4CmHCNbIg', description: 'Vue d\'ensemble complète + récupération du Bearer Token' }
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
      { label: '📹 Créer une app TikTok Business', url: 'https://www.youtube.com/watch?v=N8lMo9HVmfA', description: 'Obtenir les access tokens pour TikTok Business API' },
      { label: '📹 Login TikTok et access tokens', url: 'https://www.youtube.com/watch?v=XLWU1uiPhLA', description: 'Implémenter l\'authentification et gérer les tokens' },
      { label: '📹 TikTok Ads API – Getting access', url: 'https://www.youtube.com/watch?v=NdpdLaHX-sk', description: 'Vue d\'ensemble de l\'accès développeur TikTok' }
    ]
  },
  {
    key: 'wordpress_blog',
    name: 'Blog WordPress',
    icon: Settings,
    color: 'text-blue-700',
    difficulty: 'Facile',
    description: 'Publiez vos articles de blog directement sur votre site WordPress',
    fields: [
      { name: 'base_url', label: 'URL du site', placeholder: 'https://monsite.com', description: 'Adresse de votre site WordPress (sans /wp-admin)' },
      { name: 'username', label: 'Nom d\'utilisateur', placeholder: 'admin', description: 'Utilisateur WordPress avec droits de publication' },
      { name: 'application_password', label: 'Mot de passe d\'application', placeholder: 'xxxx xxxx xxxx xxxx', description: 'Généré dans Profil → Mots de passe d\'application' }
    ],
    helpLinks: [
      { label: 'Créer un mot de passe d\'application', url: 'https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/' },
      { label: 'Documentation API REST WordPress', url: 'https://developer.wordpress.org/rest-api/reference/posts/' }
    ],
    videoTutorials: [
      { label: '📹 WordPress REST API - Premiers pas', url: 'https://www.youtube.com/watch?v=fFNXWinbgro', description: 'Introduction complète à l\'API REST WordPress' },
      { label: '📹 Application Passwords WordPress', url: 'https://www.youtube.com/watch?v=qqN7NVfyQNg', description: 'Créer et gérer les mots de passe d\'application' }
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
      { label: '📹 Créer/obtenir votre clé API Brevo', url: 'https://www.youtube.com/watch?v=K_5y6-7K1VQ', description: 'Guide rapide 2024 - Configuration complète' },
      { label: '📹 Get Brevo API Key (2025)', url: 'https://www.youtube.com/watch?v=z6yCsHCcH_Q', description: 'Méthode mise à jour pour 2025' },
      { label: '📹 Tutoriel Brevo complet débutants', url: 'https://www.youtube.com/watch?v=0qMZRlSj2HY', description: 'Configuration, listes, campagnes - étape par étape' },
      { label: '📹 Intégrer formulaire Brevo sur site', url: 'https://www.youtube.com/watch?v=dmFCVliq1pk', description: 'Capture d\'emails - intégration pratique' },
      { label: '📹 Connecter Brevo avec WordPress', url: 'https://www.youtube.com/watch?v=iAePirGnxyA', description: 'Intégration WordPress complète' }
    ]
  }
];

export function SocialParamsDialog({ siteId, siteName, children }: SocialParamsDialogProps) {
  const [open, setOpen] = useState(false);
  const [socialParams, setSocialParams] = useState<SocialParams>({});
  const [showTokens, setShowTokens] = useState<{ [key: string]: boolean }>({});
  const [selectedGroup, setSelectedGroup] = useState<string>('social');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les paramètres existants
  const { data: existingParams, isLoading } = useQuery({
    queryKey: [`/api/sites/${siteId}/social-params`],
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
      const response = await fetch(`/api/sites/${siteId}/social-params`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/social-params`] });
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
    switch (difficulty) {
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
                            className={`h-2 rounded-full transition-all duration-300 ${group.priority === 'high' ? 'bg-green-500' :
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
                    <span className={`text-xs px-2 py-0.5 rounded-full ${configuredCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
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
                      <Card key={platform.key} className={`border-2 transition-all duration-200 hover:shadow-md ${isConfigured ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center">
                              <Icon className={`h-5 w-5 mr-2 ${platform.color}`} />
                              {platform.name}
                            </div>
                            <div className="flex items-center gap-2">
                              {platform.difficulty && (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(platform.difficulty)
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
                                      className={`${field.name.includes('token') || field.name.includes('key') ? "pr-10" : ""} ${currentValue ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : ''
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
                                  <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tutoriels vidéo YouTube</span>
                                </div>
                                <div className="space-y-2">
                                  {platform.videoTutorials.map((tutorial, index) => (
                                    <a
                                      key={index}
                                      href={tutorial.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block p-2 rounded-md border bg-background hover:bg-muted transition-colors group"
                                      data-testid={`video-tutorial-${platform.key}-${index}`}
                                    >
                                      <div className="flex items-start gap-2">
                                        <PlayCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-foreground transition-colors" />
                                        <div className="min-w-0 flex-1">
                                          <div className="text-xs font-medium text-foreground mb-1 line-clamp-1">
                                            {tutorial.label}
                                          </div>
                                          <div className="text-xs text-muted-foreground line-clamp-2">
                                            {tutorial.description}
                                          </div>
                                        </div>
                                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
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
