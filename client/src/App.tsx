import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import BrowseFreelancers from "@/pages/browse-freelancers";
import ProjectsPage from "@/pages/projects-page";
import CreateProjectPage from "@/pages/create-project-page";
import ProjectDetailsPage from "@/pages/project-details-page";
import SubmitProposalPage from "@/pages/submit-proposal-page";
import CategoriesPage from "@/pages/categories-page";
import VerificationPage from "@/pages/verification-page";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";
import MessagesPage from "@/pages/messages-page";
import MyProjectsPage from "@/pages/my-projects-page";
import MyProposalsPage from "@/pages/my-proposals-page";
import EarningsPage from "@/pages/earnings-page";
import ReviewsReceivedPage from "@/pages/reviews-received-page";
import ReviewsGivenPage from "@/pages/reviews-given-page";
import PaymentsPage from "@/pages/payments-page";
import HelpPage from "@/pages/help-page";
import ConsultationsPage from "@/pages/consultations-page";
import MyConsultationsPage from "@/pages/my-consultations-page";
import FreelancerPortfolioPage from "@/pages/freelancer-portfolio";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { NotificationsProvider } from "./hooks/use-notifications";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "./contexts/settings-context";
import { Redirect } from "wouter";
import { lazy, Suspense } from "react";
import TracksPage from "@/pages/tracks";
import PortfolioPage from "./pages/portfolio-page";

// Lazy load admin components
const AdminDashboard = lazy(() => import('./pages/admin/dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/users'));
const AdminverfyUsers = lazy(() => import('./pages/admin/verification'));
const AdminSkillsPage = lazy(() => import('./pages/admin/skills'));
const AdminProjects = lazy(() => import('./pages/admin/projects'));
const AdminCategories = lazy(() => import('./pages/admin/categories'));
const AdminSettings = lazy(() => import('./pages/admin/settings'));
const AdminPayments = lazy(() => import('./pages/admin/payments'));
const AdminMessages = lazy(() => import('./pages/admin/messages'));

function Router() {
  return (
    <Switch>
      <Route path="/">
        <HomePage />
      </Route>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/auth/register">
        {/* Register component */}
      </Route>
      <Route path="/browse-freelancers">
        <BrowseFreelancers />
      </Route>
      <Route path="/projects">
        <ProjectsPage />
      </Route>
      <Route path="/my-projects">
        <ProtectedRoute>
          <MyProjectsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/my-proposals">
        <ProtectedRoute>
          <MyProposalsPage />
        </ProtectedRoute>
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
      <Route path="/consultations">
        <ProtectedRoute>
          <ConsultationsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/my-consultations">
        <ProtectedRoute>
          <MyConsultationsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/portfolio">
        <ProtectedRoute>
          <PortfolioPage />
        </ProtectedRoute>
      </Route>
      <Route path="/freelancers/:id">
        <FreelancerPortfolioPage />
      </Route>
      <Route path="/categories">
        <CategoriesPage />
      </Route>
      <Route path="/messages">
        <ProtectedRoute>
          <MessagesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        {(params) => <Redirect to="/admin/dashboard" />}
      </Route>
      <Route path="/admin/dashboard">
        <ProtectedRoute>
          <Suspense fallback={<div>Loading...</div>}>
            <AdminDashboard />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute>
          <Suspense fallback={<div>Loading...</div>}>
            <AdminUsers />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/verification">
        <ProtectedRoute>
          <Suspense fallback={<div>Loading...</div>}>
            <AdminverfyUsers />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/skills">
        <ProtectedRoute>
          <Suspense fallback={<div>Loading...</div>}>
            <AdminSkillsPage />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/projects">
        <ProtectedRoute>
          <Suspense fallback={<div>Loading...</div>}>
            <AdminProjects />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/categories">
        <ProtectedRoute>
          <Suspense fallback={<div>Loading...</div>}>
            <AdminCategories />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute>
          <Suspense fallback={<div>Loading...</div>}>
            <AdminSettings />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/payments">
        <ProtectedRoute>
          <Suspense fallback={<div>Loading...</div>}>
            <AdminPayments />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/messages">
        <ProtectedRoute>
          <Suspense fallback={<div>Loading...</div>}>
            <AdminMessages />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/verification">
        <ProtectedRoute>
          <VerificationPage />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/earnings">
        <ProtectedRoute>
          <EarningsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/reviews/received">
        <ProtectedRoute>
          <ReviewsReceivedPage />
        </ProtectedRoute>
      </Route>
      <Route path="/reviews/given">
        <ProtectedRoute>
          <ReviewsGivenPage />
        </ProtectedRoute>
      </Route>
      <Route path="/payments">
        <ProtectedRoute>
          <PaymentsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/help">
        <ProtectedRoute>
          <HelpPage />
        </ProtectedRoute>
      </Route>
      <Route path="/tracks">
        <TracksPage />
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
          <SettingsProvider>
            <NotificationsProvider>
              <Router />
              <Toaster />
            </NotificationsProvider>
          </SettingsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
