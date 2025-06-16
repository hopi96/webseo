import { ChartLine, Search, FileText, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";

export function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: ChartLine, label: "Dashboard" },
    { path: "/keywords", icon: Search, label: "Keywords" },
    { path: "/reports", icon: FileText, label: "Reports" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-gray-700 z-40">
      <div className="grid grid-cols-4 h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path}>
              <button
                className={`flex flex-col items-center justify-center transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-gray-400 dark:text-gray-500 hover:text-primary"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
