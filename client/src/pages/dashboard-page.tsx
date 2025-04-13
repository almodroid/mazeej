import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import StatCard from "@/components/dashboard/stat-card";
import RecentProjects from "@/components/dashboard/recent-projects";
import RecentProposals from "@/components/dashboard/recent-proposals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project, Proposal } from "@shared/schema";
import DashboardLayout from "@/components/layouts/dashboard-layout";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

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

  // Define RTL state based on language
  const isRTL = i18n.language === "ar";

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
    <DashboardLayout>
      <h1 className="text-3xl font-cairo font-bold mb-6">
        {t("dashboard.welcomeBack")} {user.fullName || user.username}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          <Tabs defaultValue="projects" className="w-full" dir={isRTL ? "rtl" : "ltr"}>
            <TabsList>
              <TabsTrigger value="projects">{t("dashboard.recentProjects")}</TabsTrigger>
              <TabsTrigger value="proposals">{t("dashboard.recentProposals")}</TabsTrigger>
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
              <CardTitle>{t("dashboard.notifications")}</CardTitle>
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
    </DashboardLayout>
  );
}
