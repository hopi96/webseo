import React from "react";
import { Button } from "@/components/ui/button";

type AppErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string | null;
};

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message ?? "Erreur inconnue",
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App runtime error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-lg w-full border rounded-lg bg-card p-6 space-y-4">
            <h1 className="text-xl font-semibold">Une erreur a bloque l'affichage</h1>
            <p className="text-sm text-muted-foreground">
              L'application a capture une erreur runtime pour eviter un ecran blanc.
            </p>
            {this.state.errorMessage && (
              <p className="text-xs text-destructive break-words">
                Details: {this.state.errorMessage}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button onClick={this.handleReload}>Recharger la page</Button>
              <Button variant="outline" onClick={() => (window.location.href = "/")}>
                Retour dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
