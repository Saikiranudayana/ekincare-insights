import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FiltersProvider } from "@/components/FiltersProvider";
import Login from "./pages/Login";
import Analytics from "./pages/Analytics";
import Reviews from "./pages/Reviews";
import PlatformAnalytics from "./pages/PlatformAnalytics";
import IssueAnalysis from "./pages/IssueAnalysis";
import SLATracking from "./pages/SLATracking";
import LiveActionCenter from "./pages/LiveActionCenter";
import RawData from "./pages/RawData";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

// Simple session-based auth guard
function RequireAuth({ children }: { children: React.ReactNode }) {
  const authed = sessionStorage.getItem("ek_auth") === "1";
  return authed ? <>{children}</> : <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FiltersProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected */}
            <Route path="/" element={<RequireAuth><Analytics /></RequireAuth>} />
            <Route path="/reviews" element={<RequireAuth><Reviews /></RequireAuth>} />
            <Route path="/platforms" element={<RequireAuth><PlatformAnalytics /></RequireAuth>} />
            <Route path="/issues" element={<RequireAuth><IssueAnalysis /></RequireAuth>} />
            <Route path="/sla" element={<RequireAuth><SLATracking /></RequireAuth>} />
            <Route path="/live" element={<RequireAuth><LiveActionCenter /></RequireAuth>} />
            <Route path="/raw" element={<RequireAuth><RawData /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </FiltersProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
