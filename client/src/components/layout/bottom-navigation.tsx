import { Link, useLocation } from "wouter";
import { BarChart3, Calendar, Settings, Activity, FileSpreadsheet } from "lucide-react";

export function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: BarChart3, label: "Tableau de bord", id: "dashboard" },
    { href: "/calendar", icon: Calendar, label: "Calendrier", id: "calendar" },
    { href: "/planning", icon: FileSpreadsheet, label: "Planning", id: "planning" },
    { href: "/monitoring", icon: Activity, label: "Monitoring", id: "monitoring" },
    { href: "/settings", icon: Settings, label: "Paramètres", id: "settings" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.id} href={item.href}>
              <div className={`flex flex-col items-center justify-center h-full px-1 transition-colors ${
                active 
                  ? "text-foreground bg-muted" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
