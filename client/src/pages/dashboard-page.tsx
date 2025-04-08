import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/hooks/use-onboarding";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import StatCard from "@/components/dashboard/stat-card";
import RecentProjects from "@/components/dashboard/recent-projects";
import RecentProposals from "@/components/dashboard/recent-proposals";
import ChatWidget from "@/components/chat/chat-widget";
import OnboardingTour from "@/components/onboarding/onboarding-tour";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project, Proposal } from "@shared/schema";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { showOnboarding, markOnboardingComplete } = useOnboarding();
  const [chatOpen, setChatOpen] = useState(false);

  // Fetch data based on user role
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const { data: clientProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !!user && user.role === "client",
  });

  const { data: freelancerProposals = [] } = useQuery<Proposal[]>({
    queryKey: ["/api/proposals/freelancer"],
    enabled: !!user && user.role === "freelancer",
  });

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Calculate stats
  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  const pendingProposals = freelancerProposals.filter(p => p.status === "pending").length;
  const totalEarnings = freelancerProposals
    .filter(p => p.status === "accepted")
    .reduce((sum, proposal) => sum + proposal.price, 0);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex">
        <DashboardSidebar className="dashboard-sidebar" />
        <main className="flex-grow p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-cairo font-bold mb-6 dashboard-welcome">
              {t("dashboard.welcomeBack")} {user.fullName || user.username}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 dashboard-stats">
              <StatCard 
                title={t("dashboard.activeProjects")} 
                value={activeProjects.toString()} 
                icon="briefcase" 
                trend="up" 
              />
              <StatCard 
                title={t("dashboard.completedProjects")} 
                value={completedProjects.toString()} 
                icon="check-circle" 
                trend="neutral" 
              />
              <StatCard 
                title={t("dashboard.pendingProposals")} 
                value={pendingProposals.toString()} 
                icon="file-text" 
                trend="down" 
              />
              <StatCard 
                title={t("dashboard.totalEarnings")} 
                value={`$${totalEarnings}`} 
                icon="dollar-sign" 
                trend="up" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Tabs defaultValue="projects" className="w-full">
                  <TabsList>
                    <TabsTrigger value="projects" className="projects-tab">{t("dashboard.recentProjects")}</TabsTrigger>
                    <TabsTrigger value="proposals" className="proposals-tab">{t("dashboard.recentProposals")}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="projects" className="mt-4">
                    <RecentProjects projects={clientProjects.slice(0, 5)} />
                  </TabsContent>
                  <TabsContent value="proposals" className="mt-4">
                    <RecentProposals proposals={freelancerProposals.slice(0, 5)} />
                  </TabsContent>
                </Tabs>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="notifications-dropdown">{t("dashboard.notifications")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* This would show notifications in a real implementation */}
                    <div className="text-center py-8 text-neutral-500">
                      <p>{t("dashboard.noNotifications")}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
      <ChatWidget isOpen={chatOpen} setIsOpen={setChatOpen} className="chat-widget-trigger" />
      
      {/* Onboarding tour */}
      <OnboardingTour 
        isOpen={showOnboarding} 
        onClose={markOnboardingComplete} 
      />
    </div>
  );
}
