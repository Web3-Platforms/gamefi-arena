import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { useAuthSession } from "@/hooks/use-auth";
import { useEffect } from "react";

// Pages
import Home from "@/pages/home";
import ConnectPage from "@/pages/connect";
import FightersPage from "@/pages/fighters";
import ArenaPage from "@/pages/arena";
import TrainingPage from "@/pages/training";
import WalletPage from "@/pages/wallet";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: session, isLoading, isError } = useAuthSession();

  useEffect(() => {
    // If not loading and no session (or auth error), redirect to connect
    if (!isLoading && (!session || isError)) {
      setLocation("/connect");
    }
  }, [session, isLoading, isError, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <div className="font-display text-primary tracking-widest animate-pulse">ESTABLISHING NEURAL LINK...</div>
      </div>
    );
  }

  if (!session || isError) return null;

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/connect" component={ConnectPage} />
      <Route>
        <ProtectedRoute>
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/fighters" component={FightersPage} />
              <Route path="/arena" component={ArenaPage} />
              <Route path="/training" component={TrainingPage} />
              <Route path="/wallet" component={WalletPage} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
