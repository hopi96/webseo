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
  TrendingUp
} from "lucide-react";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Mutation pour générer le calendrier éditorial
  const generateCalendarMutation = useMutation({
    mutationFn: async () => {
      // Commencer la génération
      setCurrentStep('Génération en cours...');
      setProgress(60);
      
      const response = await apiRequest('POST', '/api/generate-editorial-calendar', {
        websiteId,
        websiteName,
        websiteUrl,
        seoAnalysis: seoAnalysis || {}
      });
      
      // Attendre que le webhook n8n termine complètement
      setCurrentStep('Traitement par l\'IA...');
      setProgress(80);
      
      // Attendre un délai pour s'assurer que le workflow n8n se termine
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentStep('Finalisation...');
      setProgress(95);
      
      // Attendre un peu plus pour s'assurer que tout est terminé
      setTimeout(() => {
        setGenerationResult(data);
        setIsGenerating(false);
        setProgress(100);
        setCurrentStep('Terminé');
        toast({
          title: "Calendrier généré",
          description: "Le calendrier éditorial a été généré avec succès",
        });
      }, 2000);
    },
    onError: (error: any) => {
      setIsGenerating(false);
      setProgress(0);
      setCurrentStep('');
      
      // Gestion spécifique des erreurs de webhook n8n
      let errorMessage = error.message || "Impossible de générer le calendrier éditorial";
      let errorTitle = "Erreur";
      
      if (error.message?.includes('timeout') || error.message?.includes('mode test')) {
        errorTitle = "Webhook n8n non disponible";
        errorMessage = "Le workflow n8n est peut-être en mode test ou non activé. Activez-le en mode production ou cliquez sur 'Execute workflow' pour le mode test.";
      } else if (error.message?.includes('webhook') || error.message?.includes('n8n')) {
        errorTitle = "Erreur de connexion n8n";
        errorMessage = "Erreur de connexion avec n8n. Vérifiez que le webhook est correctement configuré.";
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
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Génération du calendrier éditorial
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
                  {generationResult.data && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Détails de la génération :</h4>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto">
                        {JSON.stringify(generationResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
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
                disabled={isGenerating}
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
                  setLocation('/calendrier');
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