import { Link, useLocation } from "wouter";
import { BarChart3, FileText, Calendar, Settings } from "lucide-react";

export function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: BarChart3, label: "Tableau de bord", id: "dashboard" },
    { href: "/calendar", icon: Calendar, label: "Calendrier", id: "calendar" },
    { href: "/reports", icon: FileText, label: "Rapports", id: "reports" },
    { href: "/settings", icon: Settings, label: "Paramètres", id: "settings" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-200 z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.id} href={item.href}>
              <div className={`flex flex-col items-center justify-center h-full px-1 transition-colors ${
                active 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
              }`}>
                <Icon className="h-4 w-4 mb-1" />
                <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}