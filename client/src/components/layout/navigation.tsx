import { Link, useLocation } from "wouter";
import { Home, Search, FileText, Settings } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/keywords", icon: Search, label: "Mots-clés" },
    { href: "/reports", icon: FileText, label: "Rapports" },
    { href: "/settings", icon: Settings, label: "Paramètres" }
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">SEO Dashboard</h1>
          <div className="flex space-x-6">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                    isActive 
                      ? "text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}