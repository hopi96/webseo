import { Link, useLocation } from "wouter";
import { Home, Search, FileText, Calendar, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function UnifiedHeader() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/keywords", icon: Search, label: "Mots-clés" },
    { href: "/calendar", icon: Calendar, label: "Calendrier" },
    { href: "/reports", icon: FileText, label: "Rapports" },
    { href: "/settings", icon: Settings, label: "Paramètres" }
  ];

  const currentPage = navItems.find(item => item.href === location);

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 w-full overflow-x-hidden">
      <div className="px-4 lg:px-6 py-3 lg:py-4 w-full max-w-full">
        {/* Version Desktop */}
        <div className="hidden lg:flex items-center justify-between w-full max-w-full">
          <div className="flex items-center space-x-8 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white whitespace-nowrap">SEO Dashboard</h1>
            <nav className="flex space-x-6 min-w-0">
              {navItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                
                return (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                      isActive 
                        ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Version Mobile */}
        <div className="lg:hidden w-full max-w-full">
          <div className="flex items-center justify-between w-full max-w-full">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {currentPage && <currentPage.icon className="h-5 w-5 text-blue-600 flex-shrink-0" />}
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {currentPage?.label || "SEO Analytics"}
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu Mobile Dropdown */}
          {isMobileMenuOpen && (
            <div className="mt-3 py-2 border-t border-gray-200 dark:border-gray-700">
              <nav className="flex flex-col space-y-1">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link 
                      key={item.href}
                      href={item.href} 
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                        isActive 
                          ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
                          : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}