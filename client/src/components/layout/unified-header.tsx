import { Link, useLocation } from "wouter";
import { Home, Calendar, Settings, Menu, ChevronDown, Plus, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSite } from "@/lib/site-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddWebsiteDialog } from "@/components/website/add-website-dialog";

export function UnifiedHeader() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { currentSite, sites, setSelectedSiteId, isLoading } = useSite();

  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/calendar", icon: Calendar, label: "Calendrier" },
    { href: "/settings", icon: Settings, label: "Paramètres" }
  ];

  const currentPage = navItems.find(item => item.href === location);

  return (
    <>
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 lg:px-6 py-3 lg:py-4">
          {/* Version Desktop */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Logo/Title */}
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">SEO Dashboard</h1>

              {/* Site Selector - Workspace Style */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 min-w-[200px] justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                        {isLoading ? "Chargement..." : (currentSite?.name || "Sélectionner un site")}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[280px]">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mes sites web
                  </div>
                  {sites.sort((a, b) => b.id - a.id).map((site) => (
                    <DropdownMenuItem
                      key={site.id}
                      onClick={() => setSelectedSiteId(site.id)}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${site.id === currentSite?.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                    >
                      <Globe className={`h-4 w-4 ${site.id === currentSite?.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${site.id === currentSite?.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                          {site.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {site.url}
                        </div>
                      </div>
                      {site.id === currentSite?.id && (
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowAddDialog(true)}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter un site</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Navigation */}
              <nav className="flex space-x-4">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${isActive
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
          <div className="lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Mobile Site Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 px-2"
                    >
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium truncate max-w-[120px]">
                        {currentSite?.name || "Site"}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[250px]">
                    {sites.map((site) => (
                      <DropdownMenuItem
                        key={site.id}
                        onClick={() => setSelectedSiteId(site.id)}
                        className="flex items-center gap-2"
                      >
                        <Globe className={`h-4 w-4 ${site.id === currentSite?.id ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={site.id === currentSite?.id ? 'font-medium text-blue-600' : ''}>{site.name}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowAddDialog(true)} className="text-blue-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un site
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
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
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${isActive
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

      {/* Add Website Dialog */}
      <AddWebsiteDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onWebsiteAdded={(websiteId) => {
          setSelectedSiteId(websiteId);
        }}
      />
    </>
  );
}
