import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import RoleSelect from "./pages/RoleSelect";
import ConsultantHome from "./pages/consultant/ConsultantHome";
import { ConsultantShell } from "./components/layout/ConsultantShell";
import CoCreate from "./pages/consultant/CoCreate";
import LiveMap from "./pages/consultant/LiveMap";
import Tracking from "./pages/consultant/Tracking";
import TeamHome from "./pages/team/TeamHome";
import NotFound from "./pages/NotFound";
import { CommandPalette } from "./components/CommandPalette";

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
          <Route index element={<Navigate to="cocreate" replace />} />
          <Route path="cocreate" element={<CoCreate />} />
          <Route path="map" element={<LiveMap />} />
          <Route path="tracking" element={<Tracking />} />
        </Route>

        {/* Delivery Team Portal */}
        <Route path="/team" element={<TeamHome />} />

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
