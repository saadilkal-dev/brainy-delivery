import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect, lazy, Suspense } from "react";
import RoleSelect from "./pages/RoleSelect";
import ConsultantHome from "./pages/consultant/ConsultantHome";
import { ConsultantShell } from "./components/layout/ConsultantShell";
import CoCreate from "./pages/consultant/CoCreate";
import LiveMap from "./pages/consultant/LiveMap";
import Tracking from "./pages/consultant/Tracking";
import MissionControl from "./pages/team/MissionControl";
import NotFound from "./pages/NotFound";
import { CommandPalette } from "./components/CommandPalette";
import { TeamShell } from "./components/layout/TeamShell";

// Lazy-load interview page
const AIInterview = lazy(() => import("./pages/consultant/AIInterview"));

// Lazy-load heavy 3D pages (three.js bundle)
const ImmersiveMap = lazy(() => import("./pages/consultant/ImmersiveMap"));
const TeamJourney = lazy(() => import("./pages/team/TeamJourney"));
const ModuleWorkstation = lazy(() => import("./pages/team/ModuleWorkstation"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function AppRoutes() {
  const [role, setRole] = useState<'consultant' | 'team' | null>(() => {
    const saved = sessionStorage.getItem('delivery-brain-role');
    return saved === 'consultant' || saved === 'team' ? saved : null;
  });

  useEffect(() => {
    if (role) sessionStorage.setItem('delivery-brain-role', role);
  }, [role]);

  if (!role) {
    return <RoleSelect onSelect={setRole} />;
  }

  return (
    <>
      <CommandPalette />
      <Routes>
        {/* Consultant Portal */}
        <Route path="/" element={<Navigate to={role === 'consultant' ? '/consultant' : '/team'} replace />} />
        <Route path="/consultant" element={<ConsultantHome />} />
        <Route path="/consultant/:id" element={<ConsultantShell />}>
          <Route index element={<Navigate to="interview" replace />} />
          <Route path="interview" element={<Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#f4f3f0]"><div className="text-gray-400 text-sm font-mono">Loading...</div></div>}><AIInterview /></Suspense>} />
          <Route path="cocreate" element={<CoCreate />} />
          <Route path="map" element={<LiveMap />} />
          <Route path="journey" element={<Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#f4f3f0]"><div className="text-gray-400 text-sm font-mono">Loading 3D scene...</div></div>}><ImmersiveMap /></Suspense>} />
          <Route path="tracking" element={<Tracking />} />
        </Route>

        {/* Delivery Team Portal */}
        <Route path="/team" element={<MissionControl />} />
        <Route path="/team/:projectId" element={<TeamShell />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<MissionControl />} />
          <Route path="journey" element={<Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#f4f3f0]"><div className="text-gray-400 text-sm font-mono">Loading 3D scene...</div></div>}><TeamJourney /></Suspense>} />
          <Route path="module/:moduleId" element={<Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#f4f3f0]"><div className="text-gray-400 text-sm font-mono">Loading...</div></div>}><ModuleWorkstation /></Suspense>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
