import { useState } from "react";

import { Header } from "@/components/header";
import { Dashboard } from "@/pages/Dashboard";
import { History } from "@/pages/History";
import { StockDetail } from "@/pages/StockDetail";

export function App() {
  const [currentView, setCurrentView] = useState<"dashboard" | "stock" | "history">(() => {
    if (typeof window === "undefined") return "dashboard";
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get("view");
    if (viewParam === "history" || path.includes("history")) return "history";
    if (viewParam === "stock" || path.includes("stock") || urlParams.has("symbol")) return "stock";
    return "dashboard";
  });

  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => {
    if (typeof window === "undefined") return "FPT";
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("symbol") || "FPT";
  });

  const handleSelectStock = (symbol: string) => {
    setSelectedSymbol(symbol);
    setCurrentView("stock");
    window.history.pushState({}, "", `?symbol=${symbol}`);
  };

  const handleNavigate = (view: "dashboard" | "stock" | "history") => {
    setCurrentView(view);
    if (view === "dashboard") {
      window.history.pushState({}, "", "/");
    } else if (view === "history") {
      window.history.pushState({}, "", "?view=history");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header currentView={currentView} onNavigate={handleNavigate} />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {currentView === "dashboard" && <Dashboard onSelectStock={handleSelectStock} />}

        {currentView === "stock" && (
          <StockDetail symbol={selectedSymbol} onBack={() => handleNavigate("dashboard")} />
        )}

        {currentView === "history" && <History onSelectStock={handleSelectStock} />}
      </main>

      <footer className="mt-16 border-t border-border bg-background py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center font-mono text-[11px] tracking-tight text-subtle-foreground">
            © {new Date().getFullYear()} AREA44. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
