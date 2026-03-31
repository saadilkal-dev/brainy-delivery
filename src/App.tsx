import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import ProjectRedirect from "./pages/ProjectRedirect";
import Dashboard from "./pages/Dashboard";
import Plan from "./pages/Plan";
import Ingestion from "./pages/Ingestion";
import Blockers from "./pages/Blockers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function AppRoutes() {
  const [loggedIn, setLoggedIn] = useState(false);

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<AppShell />}>
        <Route index element={<ProjectRedirect />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="plan" element={<Plan />} />
        <Route path="ingestion" element={<Ingestion />} />
        <Route path="blockers" element={<Blockers />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
