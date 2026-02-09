import { Link, useLocation } from "wouter";
import { Home, Calendar, Settings, Menu, ChevronDown, Plus, Globe, Activity } from "lucide-react";
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
    { href: "/monitoring", icon: Activity, label: "Monitoring" },
    { href: "/settings", icon: Settings, label: "Paramètres" }
  ];

  const currentPage = navItems.find(item => item.href === location);

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="px-4 lg:px-6 py-3 lg:py-4">
          {/* Version Desktop */}
          <div className="hidden lg:flex items-center justify-between">
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
                  {sites.sort((a, b) => b.id - a.id).map((site) => (
                    <DropdownMenuItem
                      key={site.id}
                      onClick={() => setSelectedSiteId(site.id)}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                        site.id === currentSite?.id ? 'bg-muted' : ''
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
                      className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
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
              <div className="mt-3 rounded-lg border bg-background p-2 shadow-md">
                <nav className="flex flex-col space-y-1">
                  {navItems.map((item) => {
                    const isActive = location === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${
                          isActive
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
