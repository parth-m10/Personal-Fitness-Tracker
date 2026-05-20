import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Workout from "@/pages/workout";
import CalendarPage from "@/pages/calendar";
import Plan from "@/pages/plan";
import Progress from "@/pages/progress";
import Metrics from "@/pages/metrics";
import HistoryPage from "@/pages/history";
import Settings from "@/pages/settings";
import Layout from "@/components/layout/layout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/workout" component={Workout} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/plan" component={Plan} />
        <Route path="/progress" component={Progress} />
        <Route path="/metrics" component={Metrics} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

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
