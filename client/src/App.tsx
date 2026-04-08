import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./hooks/use-theme";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteProvider } from "@/lib/site-context";
import Dashboard from "@/pages/dashboard";
import Keywords from "@/pages/keywords";
import Calendar from "@/pages/calendar";
import Planning from "@/pages/planning";
import Monitoring from "@/pages/monitoring";
import Settings from "@/pages/settings";
import DocumentationPDF from "@/pages/documentation-pdf";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppErrorBoundary } from "@/components/layout/app-error-boundary";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/keywords">
        <ProtectedRoute>
          <Keywords />
        </ProtectedRoute>
      </Route>
      <Route path="/calendar">
        <ProtectedRoute>
          <Calendar />
        </ProtectedRoute>
      </Route>
      <Route path="/planning">
        <ProtectedRoute>
          <Planning />
        </ProtectedRoute>
      </Route>
      <Route path="/monitoring">
        <ProtectedRoute>
          <Monitoring />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/documentation-pdf">
        <ProtectedRoute>
          <DocumentationPDF />
        </ProtectedRoute>
      </Route>
      <Route path="*">
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="seo-dashboard-theme">
        <TooltipProvider>
          <AuthProvider>
            <SiteProvider>
              <Toaster />
              <AppErrorBoundary>
                <Router />
              </AppErrorBoundary>
            </SiteProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

