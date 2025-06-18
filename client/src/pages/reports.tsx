import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Reports() {
  return (
    <div className="min-h-screen soft-background">
      <MobileHeader />
      
      <div className="p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Rapports</h1>
          <p className="soft-text">Rapports détaillés disponibles dans le tableau de bord</p>
        </div>

        <Card className="soft-card">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-slate-400" />
            <p className="text-lg font-medium text-slate-600 mb-2">Consultez le tableau de bord</p>
            <p className="text-sm soft-text">L'analyse complète et les graphiques sont disponibles sur la page principale</p>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}