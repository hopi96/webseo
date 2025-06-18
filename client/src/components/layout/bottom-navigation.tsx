import { Link, useLocation } from "wouter";
import { BarChart3, Search, FileText, Settings } from "lucide-react";

export function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: BarChart3, label: "Tableau de bord", id: "dashboard" },
    { href: "/keywords", icon: Search, label: "Mots-clés", id: "keywords" },
    { href: "/reports", icon: FileText, label: "Rapports", id: "reports" },
    { href: "/settings", icon: Settings, label: "Paramètres", id: "settings" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-200 z-50">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.id} href={item.href}>
              <div className={`flex flex-col items-center justify-center h-full px-2 transition-colors ${
                active 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
              }`}>
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}