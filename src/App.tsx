import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SocialIntel from "./pages/SocialIntel";
import OSINTDashboard from "./pages/OSINTDashboard";
import DistrictPage from "./pages/DistrictPage";
import NotFound from "./pages/NotFound";
import { intelligenceHub } from "@/lib/intelligence-hub";
import { AnomalyPanel } from "@/components/intelligence/AnomalyPanel";
import { AIStrategyPanel } from "@/components/intelligence/AIStrategyPanel";
import { DataQualityDashboard } from "@/components/DataQualityDashboard";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/components/auth/AuthPage";
import { I18nProvider } from "@/hooks/useTranslation";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, isLoading, isGuest, enterAsGuest } = useAuth();

  useEffect(() => {
    intelligenceHub.start();
    // Register service worker for PWA + push notifications (M3, M4)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => {
      intelligenceHub.stop();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-primary font-mono font-bold">M</span>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <AuthPage onAuth={enterAsGuest} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/social-intel" element={<SocialIntel />} />
        <Route path="/osint" element={<OSINTDashboard />} />
        <Route path="/ilce/:slug" element={<DistrictPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AnomalyPanel />
      <AIStrategyPanel />
      <DataQualityDashboard />
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <I18nProvider>
            <AppContent />
          </I18nProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
