import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import AdminDashboardPage from "@/pages/admin-dashboard";
import BrowseFreelancers from "@/pages/browse-freelancers";
import ProjectsPage from "@/pages/projects-page";
import CreateProjectPage from "@/pages/create-project-page";
import ProjectDetailsPage from "@/pages/project-details-page";
import SubmitProposalPage from "@/pages/submit-proposal-page";
import CategoriesPage from "@/pages/categories-page";
import ChatPage from "@/pages/chat-page";
import VerificationPage from "@/pages/verification-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { NotificationsProvider } from "./hooks/use-notifications";
import { ChatProvider } from "./hooks/use-chat";
import { ThemeProvider } from "@/components/theme-provider";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <HomePage />
      </Route>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/browse-freelancers">
        <BrowseFreelancers />
      </Route>
      <Route path="/projects">
        <ProjectsPage />
      </Route>
      <Route path="/projects/create">
        <ProtectedRoute>
          <CreateProjectPage />
        </ProtectedRoute>
      </Route>
      <Route path="/projects/:id">
        <ProjectDetailsPage />
      </Route>
      <Route path="/projects/:id/proposals/new">
        <ProtectedRoute>
          <SubmitProposalPage />
        </ProtectedRoute>
      </Route>
      <Route path="/categories">
        <CategoriesPage />
      </Route>
      <Route path="/chat">
        <ProtectedRoute>
          <ChatPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <AdminDashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/verification">
        <ProtectedRoute>
          <VerificationPage />
        </ProtectedRoute>
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="freelance-platform-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationsProvider>
            <ChatProvider>
              <Router />
              <Toaster />
            </ChatProvider>
          </NotificationsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
