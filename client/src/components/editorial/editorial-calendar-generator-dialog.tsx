import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Zap,
  Clock,
  Target,
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  FileText,
  Globe,
  TrendingUp,
  HelpCircle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EditorialCalendarGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteId: number;
  websiteName: string;
  websiteUrl: string;
  seoAnalysis?: any;
}

export function EditorialCalendarGeneratorDialog({
  open,
  onOpenChange,
  websiteId,
  websiteName,
  websiteUrl,
  seoAnalysis
}: EditorialCalendarGeneratorDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generationResult, setGenerationResult] = useState<any>(null);

  // États pour la sélection de période
  const [isMonthlyPeriod, setIsMonthlyPeriod] = useState(true);

  // Dates par défaut
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [startDate, setStartDate] = useState(today.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(nextMonth.toISOString().split('T')[0]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();



  // Mutation pour générer le calendrier éditorial avec progression en temps réel
  const generateCalendarMutation = useMutation({
    mutationFn: async () => {
      setCurrentStep('Connexion au serveur...');
      setProgress(5);

      const Period = isMonthlyPeriod ? {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]
      } : {
        startDate,
        endDate
      };

      // Utiliser SSE pour la progression en temps réel
      const response = await fetch('/api/workflows/generate-calendar-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: websiteId,
          websiteName,
          websiteUrl,
          seoAnalysis: seoAnalysis || {},
          period: Period,
          platforms: ['instagram', 'facebook', 'newsletter', 'linkedin', 'blog', 'pinterest', 'xtwitter', 'google my business']
        })
      });

      if (!response.body) {
        throw new Error('SSE not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'progress') {
                setProgress(data.percent);
                setCurrentStep(data.step);
              } else if (data.type === 'complete') {
                result = data;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      return result || { success: true, calendarCount: 0 };
    },
    onSuccess: (data) => {
      setGenerationResult(data);
      setIsGenerating(false);
      setProgress(100);

      toast({
        title: "Génération lancée",
        description: data.message || `${data.calendarCount || 0} idées de contenus ont été générées. La rédaction continue en arrière-plan.`,
      });

      // Invalider le cache pour forcer le rechargement des données
      queryClient.invalidateQueries({ queryKey: ['/api/editorial-content'] });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      setProgress(0);
      setCurrentStep('');

      toast({
        title: "Erreur de génération",
        description: error.message || "Impossible de générer le calendrier éditorial",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setCurrentStep('Initialisation...');
    setGenerationResult(null);

    // Lancer la génération avec le webhook n8n
    generateCalendarMutation.mutate();
  };

  const handleClose = () => {
    setIsGenerating(false);
    setProgress(0);
    setCurrentStep('');
    setGenerationResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Génération du calendrier éditorial
            </div>

            {/* Bouton d'aide pour n8n */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Activation du workflow n8n
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-left space-y-3">
                    <p>Le calendrier éditorial est généré automatiquement pendant 1 heure. Pour de meilleurs résultats, activez votre workflow n8n :</p>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">🔧 Mode Production (recommandé)</h4>
                      <ol className="text-sm space-y-1 list-decimal list-inside">
                        <li>Ouvrez votre workflow n8n</li>
                        <li>Cliquez sur <code className="bg-gray-100 px-1 rounded">Activate</code> en haut à droite</li>
                        <li>Le workflow restera actif en permanence</li>
                      </ol>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">🧪 Mode Test</h4>
                      <ol className="text-sm space-y-1 list-decimal list-inside">
                        <li>Cliquez sur <code className="bg-gray-100 px-1 rounded">Execute Workflow</code></li>
                        <li>Lancez la génération immédiatement après</li>
                        <li>Le workflow sera actif temporairement</li>
                      </ol>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      💡 La génération continue même si le workflow n'est pas activé. Les résultats apparaîtront dans votre calendrier.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction>Compris</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogTitle>
          <DialogDescription>
            Générez un calendrier éditorial personnalisé basé sur l'analyse SEO de votre site web
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 smart-scroll-vertical pr-2" style={{ maxHeight: '60vh' }}>
          {/* Informations du site */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Site web à analyser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nom du site</span>
                  <Badge variant="outline">{websiteName}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">URL</span>
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    {websiteUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {seoAnalysis && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Score SEO</span>
                    <Badge variant="default" className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {seoAnalysis.seoScore}/100
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fonctionnalités du calendrier */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-4 w-4" />
                Fonctionnalités incluses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Analyse des mots-clés</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Stratégie de contenu</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Calendrier mensuel</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Optimisation SEO</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Mots-clés géolocalisés</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Contenu saisonnier</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration de la période */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Période de génération
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="monthly-period"
                    checked={isMonthlyPeriod}
                    onCheckedChange={(checked) => setIsMonthlyPeriod(checked === true)}
                  />
                  <Label htmlFor="monthly-period" className="text-sm">
                    Génération mensuelle (recommandé)
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-sm font-medium">
                      Date de début
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full"
                      disabled={isMonthlyPeriod}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-sm font-medium">
                      Date de fin
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full"
                      min={startDate}
                      disabled={isMonthlyPeriod}
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  {isMonthlyPeriod
                    ? "Le calendrier sera généré pour 1 mois complet à partir d'aujourd'hui"
                    : startDate && endDate
                      ? `Le calendrier sera généré du ${new Date(startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} au ${new Date(endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                      : "Veuillez sélectionner une période personnalisée"
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progression */}
          {isGenerating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Génération en cours...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm">{currentStep}</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progression</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Résultat */}
          {generationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Génération terminée
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Calendrier éditorial généré avec succès</span>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Le calendrier éditorial a été généré et peut être consulté dans la section "Calendrier" de l'application.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isGenerating}
            >
              {generationResult ? 'Fermer' : 'Annuler'}
            </Button>

            {!generationResult && (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (!isMonthlyPeriod && (!startDate || !endDate))}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Générer le calendrier
                  </>
                )}
              </Button>
            )}

            {generationResult && (
              <Button
                variant="default"
                onClick={() => {
                  handleClose();
                  // Rediriger vers la page du calendrier éditorial
                  setLocation('/calendar');
                }}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Voir le calendrier
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}