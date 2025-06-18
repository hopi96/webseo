import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function Keywords() {
  return (
    <div className="min-h-screen soft-background">
      <MobileHeader />
      
      <div className="p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Mots-clés</h1>
          <p className="soft-text">Analyse détaillée disponible dans le tableau de bord</p>
        </div>

        <Card className="soft-card">
          <CardContent className="p-12 text-center">
            <Search className="h-16 w-16 mx-auto mb-4 text-slate-400" />
            <p className="text-lg font-medium text-slate-600 mb-2">Consultez le tableau de bord</p>
            <p className="text-sm soft-text">L'analyse complète des 16 mots-clés est disponible sur la page principale</p>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}