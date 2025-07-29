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

  // Fonction de simulation de barre de progression sur 1 heure avec polling intelligent
  const simulateProgressAndPoll = async (startTime: Date): Promise<any> => {
    const maxPollingTime = 60 * 60 * 1000; // 1 heure maximum
    const pollInterval = 10000; // Vérifier toutes les 10 secondes
    const startPollingTime = Date.now();
    const progressDuration = 60 * 60 * 1000; // 1 heure pour la barre de progression
    
    // Commencer la simulation de progression
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startPollingTime;
      const progressPercent = Math.min((elapsed / progressDuration) * 100, 95); // Max 95% pendant l'attente
      setProgress(progressPercent);
      
      const elapsedMinutes = Math.floor(elapsed / (1000 * 60));
      const totalMinutes = Math.floor(progressDuration / (1000 * 60));
      setCurrentStep(`Génération IA en cours... (${elapsedMinutes}/${totalMinutes} min)`);
    }, 1000); // Mise à jour chaque seconde
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          // Vérifier si on a dépassé le timeout maximum
          if (Date.now() - startPollingTime > maxPollingTime) {
            clearInterval(progressInterval);
            reject(new Error('Timeout: La génération a pris plus d\'1 heure'));
            return;
          }
          
          // Vérifier le statut de génération
          const response = await fetch(`/api/check-generation-status/${websiteId}?since=${startTime.toISOString()}`);
          const status = await response.json();
          
          console.log('📊 Polling status:', status);
          
          if (status.hasNewContent && status.newContentCount > 0) {
            console.log(`✅ Génération terminée ! ${status.newContentCount} nouveaux contenus détectés`);
            clearInterval(progressInterval);
            setCurrentStep(`Terminé ! ${status.newContentCount} contenus générés`);
            setProgress(100);
            resolve(status);
          } else {
            // Continuer le polling
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          console.error('Erreur lors du polling:', error);
          clearInterval(progressInterval);
          reject(error);
        }
      };
      
      // Commencer le polling après un délai initial
      setTimeout(poll, 5000); // Attendre 5s avant le premier check
    });
  };

  // Mutation pour générer le calendrier éditorial
  const generateCalendarMutation = useMutation({
    mutationFn: async () => {
      const generationStartTime = new Date();
      
      // Commencer la génération
      setCurrentStep('Lancement de la génération...');
      setProgress(20);
      
      const response = await apiRequest('POST', '/api/generate-editorial-calendar', {
        websiteId,
        websiteName,
        websiteUrl,
        seoAnalysis: seoAnalysis || {},
        period: isMonthlyPeriod ? 'monthly' : {
          startDate,
          endDate
        }
      });
      
      // Webhook lancé, commencer le polling intelligent
      setCurrentStep('Traitement par l\'IA en cours...');
      setProgress(40);
      
      // Utiliser la simulation de progression avec polling intelligent
      const result = await simulateProgressAndPoll(generationStartTime);
      
      return { ...response, pollResult: result };
    },
    onSuccess: (data) => {
      setGenerationResult(data);
      setIsGenerating(false);
      
      const contentCount = data.pollResult?.newContentCount || 0;
      toast({
        title: "Calendrier généré avec succès",
        description: `${contentCount} contenus éditoriaux ont été générés automatiquement`,
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
        errorTitle = "Timeout de génération";
        errorMessage = "La génération a pris plus d'1 heure. Le processus peut encore être en cours dans n8n. Vérifiez votre table Airtable dans quelques minutes.";
      } else if (error.message?.includes('timeout') || error.message?.includes('mode test') || error.message?.includes('non disponible')) {
        errorTitle = "Webhook n8n non disponible";
        errorMessage = "⚠️ Le workflow n8n doit être activé :\n\n1. Ouvrez votre workflow n8n\n2. Cliquez sur le bouton 'Activate' (en haut à droite)\n3. OU cliquez sur 'Execute Workflow' si vous voulez tester\n4. Réessayez la génération\n\nLe workflow reçoit bien les données mais n'est pas en mode actif.";
      } else if (error.message?.includes('webhook') || error.message?.includes('n8n')) {
        errorTitle = "Problème de connexion n8n";
        errorMessage = "Le workflow n8n n'est pas accessible. Vérifiez qu'il est bien activé dans votre interface n8n et réessayez.";
      } else if (error.message?.includes('polling')) {
        errorTitle = "Erreur de vérification";
        errorMessage = "Erreur lors de la vérification du statut. La génération peut avoir réussi malgré cette erreur.";
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
                    <p>Pour générer votre calendrier éditorial, le workflow n8n doit être activé :</p>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">🔧 Mode Production (recommandé)</h4>
                      <ol className="text-sm space-y-1 list-decimal list-inside">
                        <li>Ouvrez votre workflow n8n</li>
                        <li>Cliquez sur <code className="bg-gray-100 px-1 rounded">Activate</code> en haut à droite</li>
                        <li>Le workflow sera actif en permanence</li>
                      </ol>
                    </div>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">🧪 Mode Test</h4>
                      <ol className="text-sm space-y-1 list-decimal list-inside">
                        <li>Cliquez sur <code className="bg-gray-100 px-1 rounded">Execute Workflow</code></li>
                        <li>Le workflow n'est actif que temporairement</li>
                        <li>Lancez la génération immédiatement après</li>
                      </ol>
                    </div>
                    
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      💡 L'application envoie bien les données mais le workflow doit être actif pour les traiter.
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