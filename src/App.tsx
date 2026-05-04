import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FiltersProvider } from "@/components/FiltersProvider";
import Dashboard from "./pages/Dashboard";
import PlatformAnalytics from "./pages/PlatformAnalytics";
import IssueAnalysis from "./pages/IssueAnalysis";
import SLATracking from "./pages/SLATracking";
import LiveActionCenter from "./pages/LiveActionCenter";
import RawData from "./pages/RawData";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FiltersProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/platforms" element={<PlatformAnalytics />} />
            <Route path="/issues" element={<IssueAnalysis />} />
            <Route path="/sla" element={<SLATracking />} />
            <Route path="/live" element={<LiveActionCenter />} />
            <Route path="/raw" element={<RawData />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </FiltersProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
