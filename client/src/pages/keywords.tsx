import { UnifiedHeader } from "@/components/layout/unified-header";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function Keywords() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UnifiedHeader />
      
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mots-clés</h1>
          <p className="text-gray-600 dark:text-gray-400">Analyse détaillée disponible dans le tableau de bord</p>
        </div>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-12 text-center">
            <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">Consultez le tableau de bord</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">L'analyse complète des mots-clés est disponible sur la page principale</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}