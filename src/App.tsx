import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SocialIntel from "./pages/SocialIntel";
import OSINTDashboard from "./pages/OSINTDashboard";
import NotFound from "./pages/NotFound";
import { intelligenceHub } from "@/lib/intelligence-hub";
import { AnomalyPanel } from "@/components/intelligence/AnomalyPanel";
import { AIStrategyPanel } from "@/components/intelligence/AIStrategyPanel";
import { DataQualityDashboard } from "@/components/DataQualityDashboard";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    intelligenceHub.start();
    return () => {
      intelligenceHub.stop();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/social-intel" element={<SocialIntel />} />
            <Route path="/osint" element={<OSINTDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AnomalyPanel />
          <AIStrategyPanel />
          <DataQualityDashboard />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
