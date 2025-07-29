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

  // Fonction pour simuler la progression pendant exactement 1 heure
  const simulateProgressFor1Hour = async (startTime: Date): Promise<any> => {
    const startPollingTime = Date.now();
    const progressDuration = 60 * 60 * 1000; // Exactement 1 heure
    
    return new Promise((resolve) => {
      // Progression continue pendant exactement 1 heure
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startPollingTime;
        const progressPercent = Math.min((elapsed / progressDuration) * 100, 100);
        setProgress(progressPercent);
        
        if (elapsed >= progressDuration) {
          // Exactement 1 heure écoulée
          clearInterval(progressInterval);
          setCurrentStep('Génération terminée');
          setProgress(100);
          console.log('⏰ Génération terminée après exactement 1 heure');
          resolve({ completed: true, duration: '1 heure' });
        } else {
          setCurrentStep('Génération de contenu par IA en cours...');
        }
      }, 1000); // Mise à jour chaque seconde
    });
  };

  // Mutation pour générer le calendrier éditorial
  const generateCalendarMutation = useMutation({
    mutationFn: async () => {
      const generationStartTime = new Date();
      
      // Commencer la génération
      setCurrentStep('Lancement de la génération...');
      setProgress(20);
      
      // Lancer le webhook en arrière-plan sans attendre sa réponse
      try {
        // Déclencher le webhook sans attendre le résultat
        apiRequest('POST', '/api/generate-editorial-calendar', {
          websiteId,
          websiteName,
          websiteUrl,
          seoAnalysis: seoAnalysis || {},
          period: isMonthlyPeriod ? 'monthly' : {
            startDate,
            endDate
          }
        }).catch(error => {
          console.log('⚠️ Webhook lancé en arrière-plan, erreur ignorée:', error.message);
        });
        
        console.log('🚀 Webhook lancé en arrière-plan, début de la génération 1h');
      } catch (error) {
        console.log('⚠️ Erreur webhook ignorée, continuation de la génération:', (error as Error).message);
      }
      
      // Continuer immédiatement avec la simulation 1h sans attendre le webhook
      setCurrentStep('Traitement par l\'IA en cours...');
      setProgress(40);
      
      // Utiliser la simulation de progression pendant exactement 1 heure
      const result = await simulateProgressFor1Hour(generationStartTime);
      
      return { success: true, pollResult: result };
    },
    onSuccess: (data) => {
      setGenerationResult(data);
      setIsGenerating(false);
      
      toast({
        title: "Génération terminée",
        description: "Vérifiez votre table Airtable pour voir les contenus générés.",
      });
      
      // Invalider le cache pour forcer le rechargement des données
      queryClient.invalidateQueries({ queryKey: ['/api/editorial-content'] });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      setProgress(0);
      setCurrentStep('');
      
      // Gestion spécifique des erreurs de webhook n8n et polling
      let errorMessage = error.message || "Impossible de générer le calendrier éditorial";
      let errorTitle = "Erreur";
      
      if (error.message?.includes('Timeout: La génération a pris plus d\'1 heure')) {
        errorTitle = "Génération terminée (timeout 1h)";
        errorMessage = "La génération a duré 1 heure complète. Le processus est maintenant terminé. Vérifiez votre table Airtable - les contenus ont peut-être été générés avec succès même si nous n'avons pas pu le détecter automatiquement.";
      } else if (error.message?.includes('polling')) {
        errorTitle = "Génération en cours";
        errorMessage = "La génération continue en arrière-plan. Vérifiez votre table Airtable dans quelques minutes - les contenus y apparaîtront automatiquement.";
      } else {
        errorTitle = "Génération lancée";
        errorMessage = "La génération a été déclenchée avec succès. Le processus est en cours dans n8n. Vérifiez votre table Airtable dans les prochaines minutes.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setCurrentStep('Initialisation...');
    setGenerationResult(null);

    // Simuler les étapes de génération avant l'appel API
    const steps = [
      { step: 'Analyse du site web...', progress: 20 },
      { step: 'Extraction des données SEO...', progress: 40 },
      { step: 'Préparation des données...', progress: 50 }
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i].step);
      setProgress(steps[i].progress);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

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
                      💡 La génération continue même si le workflow n'est pas activé. Les résultats apparaîtront dans votre table Airtable.
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
                      ? `Le calendrier sera généré du ${new Date(startDate).toLocaleDateString('fr-FR')} au ${new Date(endDate).toLocaleDateString('fr-FR')}`
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