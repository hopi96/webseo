import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Users, Search, Zap, Target, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { WebsiteSelector } from "@/components/website/website-selector";
import { Navigation } from "@/components/layout/navigation";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

export default function Reports() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number>(1);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  // Types pour les données
  type WebsiteType = {
    id: number;
    url: string;
    name: string;
    createdAt: string;
  };

  type SeoAnalysisType = {
    id: number;
    websiteId: number;
    overallScore: number;
    organicTraffic: number;
    keywordsRanking: number;
    backlinks: number;
    pageSpeed: number;
    technicalSeo: any;
    recommendations: any[];
    keywords: any[];
    trafficData: any[];
    rawWebhookData?: string;
    analyzedAt: string;
  };

  // Récupération des sites web
  const { data: websites = [] } = useQuery<WebsiteType[]>({
    queryKey: ['/api/websites'],
  });

  // Récupération de l'analyse SEO
  const { data: seoAnalysis, isLoading } = useQuery<SeoAnalysisType>({
    queryKey: [`/api/websites/${selectedWebsiteId}/seo-analysis`],
    enabled: !!selectedWebsiteId,
  });

  const selectedWebsite = (websites as WebsiteType[]).find((w: WebsiteType) => w.id === selectedWebsiteId);

  // Fonction pour générer le PDF structuré comme le dashboard
  const generatePDF = async () => {
    if (!seoAnalysis || !selectedWebsite) {
      toast({
        title: "Erreur",
        description: "Aucune donnée d'analyse disponible pour générer le rapport",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // En-tête du rapport - style dashboard
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RAPPORT SEO DASHBOARD', 20, yPosition);
      yPosition += 20;

      // Ligne de séparation
      pdf.setLineWidth(0.5);
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 15;

      // Informations du site
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedWebsite.name, 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(selectedWebsite.url, 20, yPosition);
      yPosition += 8;

      pdf.text(`Dernière analyse: ${new Date(seoAnalysis.analyzedAt).toLocaleDateString('fr-FR')}`, 20, yPosition);
      yPosition += 8;

      pdf.text(`Rapport généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition);
      yPosition += 25;

      // Section Score SEO Global - mise en forme comme dashboard
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SCORE SEO GLOBAL', 20, yPosition);
      yPosition += 15;

      // Cadre pour le score
      pdf.setLineWidth(0.3);
      pdf.rect(20, yPosition - 5, 80, 30);

      pdf.setFontSize(36);
      const scoreColor = seoAnalysis.overallScore >= 70 ? [34, 197, 94] : 
                        seoAnalysis.overallScore >= 40 ? [251, 191, 36] : [239, 68, 68];
      pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      pdf.text(`${seoAnalysis.overallScore}/100`, 25, yPosition + 20);
      pdf.setTextColor(0, 0, 0);

      // Évaluation textuelle
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const scoreText = seoAnalysis.overallScore >= 70 ? 'Excellent' : 
                       seoAnalysis.overallScore >= 40 ? 'Moyen' : 'À améliorer';
      pdf.text(`Évaluation: ${scoreText}`, 110, yPosition + 15);
      yPosition += 45;

      // Section Métriques Principales - format tableau
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MÉTRIQUES PRINCIPALES', 20, yPosition);
      yPosition += 15;

      const metricsData = [
        { icon: '👥', label: 'Trafic Organique', value: seoAnalysis.organicTraffic, desc: 'Visiteurs depuis moteurs de recherche' },
        { icon: '🔍', label: 'Mots-clés Positionnés', value: seoAnalysis.keywordsRanking, desc: 'Mots-clés dans les résultats' },
        { icon: '⚡', label: 'Score PageSpeed', value: seoAnalysis.pageSpeed, desc: 'Vitesse de chargement (Core Web Vitals)' },
        { icon: '🎯', label: 'Backlinks', value: seoAnalysis.backlinks, desc: 'Liens externes vers le site' }
      ];

      metricsData.forEach((metric, index) => {
        const yPos = yPosition + (index * 20);
        
        // Cadre pour chaque métrique
        pdf.setLineWidth(0.2);
        pdf.rect(20, yPos - 3, pageWidth - 40, 18);
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${metric.value}`, 25, yPos + 8);
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(metric.label, 60, yPos + 8);
        
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(metric.desc, 60, yPos + 13);
        pdf.setTextColor(0, 0, 0);
      });
      yPosition += 95;

      // Nouvelle page si nécessaire
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 20;
      }

      // Section Audit Technique SEO
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AUDIT TECHNIQUE SEO', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Vérifications techniques essentielles pour le référencement', 20, yPosition);
      yPosition += 20;

      const technicalChecks = [
        { name: 'Mobile-Friendly', status: seoAnalysis.technicalSeo?.mobileFriendly, desc: 'Site optimisé pour mobile' },
        { name: 'HTTPS Secure', status: seoAnalysis.technicalSeo?.httpsSecure, desc: 'Connexion sécurisée SSL' },
        { name: 'XML Sitemap', status: seoAnalysis.technicalSeo?.xmlSitemap, desc: 'Plan du site pour moteurs de recherche' },
        { name: 'Robots.txt', status: seoAnalysis.technicalSeo?.robotsTxt, desc: 'Instructions pour robots d\'indexation' }
      ];

      technicalChecks.forEach((check, index) => {
        const yPos = yPosition + (index * 15);
        
        // Indicateur de statut coloré
        if (check.status) {
          pdf.setFillColor(34, 197, 94);
          pdf.circle(25, yPos + 5, 2, 'F');
          pdf.text('✓ Conforme', 32, yPos + 7);
        } else {
          pdf.setFillColor(239, 68, 68);
          pdf.circle(25, yPos + 5, 2, 'F');
          pdf.text('✗ À corriger', 32, yPos + 7);
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(check.name, 80, yPos + 7);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(check.desc, 80, yPos + 12);
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
      });
      yPosition += 75;

      // Section Top 5 Mots-clés
      if (seoAnalysis.keywords && seoAnalysis.keywords.length > 0) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TOP 5 MOTS-CLÉS', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Classement des mots-clés les mieux positionnés', 20, yPosition);
        yPosition += 20;

        // En-têtes du tableau
        pdf.setFont('helvetica', 'bold');
        pdf.text('Position', 25, yPosition);
        pdf.text('Mot-clé', 60, yPosition);
        pdf.text('Volume', 130, yPosition);
        pdf.text('Tendance', 160, yPosition);
        yPosition += 8;

        // Ligne de séparation
        pdf.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 8;

        pdf.setFont('helvetica', 'normal');
        seoAnalysis.keywords.slice(0, 5).forEach((keyword: any, index: number) => {
          const yPos = yPosition + (index * 12);
          
          pdf.text(`#${keyword.position}`, 25, yPos);
          pdf.text(keyword.keyword, 60, yPos);
          pdf.text(`${keyword.volume || 'N/A'}`, 130, yPos);
          
          // Tendance avec couleur
          if (keyword.trend === 'up') {
            pdf.setTextColor(34, 197, 94);
            pdf.text('↗ Hausse', 160, yPos);
          } else if (keyword.trend === 'down') {
            pdf.setTextColor(239, 68, 68);
            pdf.text('↘ Baisse', 160, yPos);
          } else {
            pdf.setTextColor(100, 100, 100);
            pdf.text('→ Stable', 160, yPos);
          }
          pdf.setTextColor(0, 0, 0);
        });
        yPosition += 80;
      }

      // Section Recommandations Prioritaires
      if (seoAnalysis.recommendations && seoAnalysis.recommendations.length > 0) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('RECOMMANDATIONS PRIORITAIRES', 20, yPosition);
        yPosition += 15;

        seoAnalysis.recommendations.slice(0, 5).forEach((rec: any, index: number) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }

          // Indicateur de priorité
          const priorityColor = rec.priority === 'high' ? [239, 68, 68] : 
                               rec.priority === 'medium' ? [251, 191, 36] : [100, 100, 100];
          pdf.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
          pdf.rect(20, yPosition - 2, 4, 12, 'F');

          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${rec.title}`, 28, yPosition + 5);
          yPosition += 10;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const description = rec.description || '';
          const lines = pdf.splitTextToSize(description, pageWidth - 50);
          pdf.text(lines, 28, yPosition);
          yPosition += lines.length * 4 + 5;

          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Priorité: ${rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'}`, 28, yPosition);
          pdf.setTextColor(0, 0, 0);
          yPosition += 15;
        });
      }

      // Pied de page avec style
      const totalPages = pdf.internal.pages.length - 1; // -1 car le premier élément est toujours vide
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Rapport généré par SEO Dashboard', 20, pageHeight - 10);
        pdf.text(`Page ${i} sur ${totalPages}`, pageWidth - 40, pageHeight - 10);
        pdf.text(new Date().toLocaleDateString('fr-FR'), pageWidth - 40, pageHeight - 5);
      }

      // Télécharger le PDF
      const fileName = `rapport-seo-${selectedWebsite.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Rapport généré",
        description: "Le rapport PDF a été téléchargé avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du rapport PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <div className="p-6 space-y-6">
        {/* En-tête */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rapports SEO</h1>
              <p className="text-gray-600 dark:text-gray-400">Générez des rapports PDF détaillés de vos analyses SEO</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sélectionner un site web
            </label>
            <WebsiteSelector
              selectedWebsiteId={selectedWebsiteId}
              onWebsiteChange={setSelectedWebsiteId}
            />
          </div>

          {selectedWebsite && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{selectedWebsite.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedWebsite.url}</p>
              </div>
              <Button 
                onClick={generatePDF}
                disabled={isGeneratingPDF || !seoAnalysis}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Générer PDF
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Aperçu du rapport */}
        {seoAnalysis && selectedWebsite && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Aperçu du rapport</h2>
            
            {/* Score global */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Score SEO Global</h3>
              <div className="flex items-center space-x-4">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">{seoAnalysis.overallScore}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">/100</div>
                <Badge 
                  variant="outline"
                  className={
                    seoAnalysis.overallScore >= 70 ? 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-300' :
                    seoAnalysis.overallScore >= 40 ? 'border-yellow-200 text-yellow-700 dark:border-yellow-800 dark:text-yellow-300' :
                    'border-red-200 text-red-700 dark:border-red-800 dark:text-red-300'
                  }
                >
                  {seoAnalysis.overallScore >= 70 ? 'Excellent' : seoAnalysis.overallScore >= 40 ? 'Moyen' : 'À améliorer'}
                </Badge>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Métriques principales */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Métriques Principales</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{seoAnalysis.organicTraffic}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Trafic organique</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Search className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{seoAnalysis.keywordsRanking}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Mots-clés</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{seoAnalysis.pageSpeed}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">PageSpeed</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{seoAnalysis.backlinks}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Backlinks</div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Audit technique */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Audit Technique</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Compatible Mobile', status: seoAnalysis.technicalSeo?.mobileFriendly },
                  { name: 'HTTPS Sécurisé', status: seoAnalysis.technicalSeo?.httpsSecure },
                  { name: 'XML Sitemap', status: seoAnalysis.technicalSeo?.xmlSitemap },
                  { name: 'Robots.txt', status: seoAnalysis.technicalSeo?.robotsTxt }
                ].map((check, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    {check.status ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-gray-900 dark:text-white">{check.name}</span>
                    <span className={`text-sm ${check.status ? 'text-green-600' : 'text-red-600'}`}>
                      {check.status ? 'Conforme' : 'À corriger'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Top mots-clés */}
            {seoAnalysis.keywords && seoAnalysis.keywords.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top 5 Mots-clés</h3>
                <div className="space-y-2">
                  {seoAnalysis.keywords.slice(0, 5).map((keyword: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="font-medium text-gray-900 dark:text-white">{keyword.keyword}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Position: {keyword.position}</span>
                        {keyword.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {keyword.trend === 'down' && <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommandations */}
            {seoAnalysis.recommendations && seoAnalysis.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recommandations Prioritaires</h3>
                <div className="space-y-4">
                  {seoAnalysis.recommendations.slice(0, 3).map((rec: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{rec.title}</h4>
                        <Badge 
                          variant="outline"
                          className={`ml-2 text-xs ${
                            rec.priority === 'high' 
                              ? 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' 
                              : rec.priority === 'medium' 
                              ? 'border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300' 
                              : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}