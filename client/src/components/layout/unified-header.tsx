import { Link, useLocation } from "wouter";
import { Home, Calendar, Settings, Menu, ChevronDown, Plus, Globe, Activity, LogOut, User as UserIcon, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSite } from "@/lib/site-context";
import { useAuth } from "@/hooks/use-auth";
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
  const { user, role, signOut } = useAuth();

  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/calendar", icon: Calendar, label: "Calendrier" },
    { href: "/planning", icon: FileSpreadsheet, label: "Planning" },
    { href: "/monitoring", icon: Activity, label: "Monitoring" },
    { href: "/settings", icon: Settings, label: "Paramètres" }
  ];

  const currentPage = navItems.find(item => item.href === location);

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="px-4 lg:px-6 py-3 lg:py-4">
          {/* Version Desktop */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Logo/Title */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-foreground">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-lg font-display leading-tight">SEO Dashboard</h1>
                  <p className="text-xs text-muted-foreground">{currentPage?.label || "Pilotage SEO"}</p>
                </div>
              </div>

              {/* Site Selector - Workspace Style */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex min-w-[220px] items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground truncate max-w-[150px]">
                        {isLoading ? "Chargement..." : (currentSite?.name || "Sélectionner un site")}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[280px]">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Mes sites web
                  </div>
                  {[...sites].sort((a, b) => b.id - a.id).map((site) => (
                    <DropdownMenuItem
                      key={site.id}
                      onClick={() => setSelectedSiteId(site.id)}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${site.id === currentSite?.id ? 'bg-muted' : ''
                        }`}
                    >
                      <Globe className={`h-4 w-4 ${site.id === currentSite?.id ? 'text-foreground' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${site.id === currentSite?.id ? 'text-foreground' : 'text-foreground'}`}>
                          {site.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {site.url}
                        </div>
                      </div>
                      {site.id === currentSite?.id && (
                        <div className="w-2 h-2 rounded-full bg-foreground" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowAddDialog(true)}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter un site</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Navigation */}
              <nav className="flex items-center space-x-2">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User Profile Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3 h-10">
                  <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium leading-none mb-1 text-foreground truncate max-w-[120px]">
                      {user?.email?.split('@')[0] || "Utilisateur"}
                    </span>
                    <span className="text-xs text-muted-foreground leading-none capitalize">
                      {role || "user"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <div className="px-2 py-1.5 text-xs text-muted-foreground mb-1 break-all">
                  {user?.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Version Mobile */}
          <div className="md:hidden">
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
                      <Globe className="h-4 w-4 text-muted-foreground" />
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
                        <Globe className={`h-4 w-4 ${site.id === currentSite?.id ? 'text-foreground' : 'text-muted-foreground'}`} />
                        <span className={site.id === currentSite?.id ? 'font-medium text-foreground' : ''}>{site.name}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowAddDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un site
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center space-x-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 mr-1">
                      <UserIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <div className="px-2 py-1.5 text-xs font-medium text-foreground">
                      {user?.email?.split('@')[0] || "Utilisateur"}
                    </div>
                    <div className="px-2 pb-1.5 text-xs text-muted-foreground capitalize break-all">
                      {role || "user"}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400">
                      <LogOut className="h-4 w-4 mr-2" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Menu Mobile Dropdown */}
            {isMobileMenuOpen && (
              <div className="mt-3 rounded-lg border bg-background p-2 shadow-md">
                <nav className="flex flex-col space-y-1">
                  <div className="px-3 py-2 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 mb-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{user?.email?.split('@')[0] || "Utilisateur"}</div>
                      <div className="text-xs text-muted-foreground capitalize">{role || "user"}</div>
                    </div>
                  </div>
                  {navItems.map((item) => {
                    const isActive = location === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  <div className="border-t border-gray-100 dark:border-gray-800 my-1 pt-1"></div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut();
                    }}
                    className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Déconnexion</span>
                  </button>
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
