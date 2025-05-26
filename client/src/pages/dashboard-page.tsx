import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import StatCard from "@/components/dashboard/stat-card";
import RecentProjects from "@/components/dashboard/recent-projects";
import RecentProposals from "@/components/dashboard/recent-proposals";
import DashboardNotifications from "@/components/dashboard/dashboard-notifications";
import PlanBanner from "@/components/dashboard/plan-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project, Proposal } from "@shared/schema";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [debug, setDebug] = useState<Record<string, any>>({});

  // Fetch all projects
  const { data: allProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      setDebug((prev: Record<string, any>) => ({ ...prev, allProjects: data }));
      return data;
    },
    enabled: !!user,
  });

  // Filter projects by client ID for client users
  const clientProjects = user?.role === 'client' 
    ? allProjects.filter(p => p.clientId === user.id)
    : [];

  // Fetch user's proposals (for freelancers)
  const { data: freelancerProposals = [] } = useQuery<Proposal[]>({
    queryKey: ["/api/proposals/my"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/proposals/my");
      if (!response.ok) {
        throw new Error("Failed to fetch freelancer proposals");
      }
      const data = await response.json();
      setDebug((prev: Record<string, any>) => ({ ...prev, freelancerProposals: data }));
      return data;
    },
    enabled: !!user && user.role === "freelancer",
  });

  // Get projects that the freelancer is engaged in (through accepted proposals)
  const freelancerProjects = user?.role === "freelancer" 
    ? allProjects.filter(project => 
        freelancerProposals.some(
          proposal => proposal.projectId === project.id && proposal.status === "accepted"
        )
      )
    : [];

  // Fetch financial data if user is a freelancer
  const { data: earnings = { total: 0, pending: 0 } } = useQuery({
    queryKey: ["/api/earnings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/earnings");
      if (!response.ok) {
        throw new Error("Failed to fetch earnings");
      }
      return response.json();
    },
    enabled: !!user && user.role === "freelancer",
  });

  // Fetch payment data if user is a client
  const { data: payments = { total: 0, pending: 0 } } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/payments");
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      return response.json();
    },
    enabled: !!user && user.role === "client",
  });

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Define RTL state based on language
  const isRTL = i18n.language === "ar";

  // Get user's projects based on role
  const userProjects = user?.role === "client" ? clientProjects : freelancerProjects;
 
  // Calculate stats based on user's role and their own data
  const activeProjects = userProjects.filter(p => p.status === "in_progress").length;
  const completedProjects = userProjects.filter(p => p.status === "completed").length;
  
  const pendingProposals = freelancerProposals.filter(p => p.status === "pending").length;
  
  const totalEarnings = user?.role === "freelancer" 
    ? earnings.total
    : payments.total;

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-cairo font-bold mb-6">
        {t("dashboard.welcomeBack")} {user.fullName || user.username}
      </h1>

      {/* Show the plan banner only for freelancers */}
      {user.role === "freelancer" && <PlanBanner />}

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
          title={user.role === "freelancer" ? t("dashboard.pendingProposals") : t("dashboard.pendingRequests")} 
          value={user.role === "freelancer" ? pendingProposals.toString() : "0"} 
          icon="file-text" 
          trend={pendingProposals > 0 ? "up" : "down"} 
        />
        <StatCard 
          title={user.role === "freelancer" ? t("dashboard.totalEarnings") : t("dashboard.totalSpending")} 
          value={`${totalEarnings} ${t('common.riyal')}`} 
          icon="saudi-sign" 
          trend="up" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="projects" className="w-full" dir={isRTL ? "rtl" : "ltr"}>
            <TabsList>
              <TabsTrigger value="projects">
                {t("dashboard.myProjects")}
              </TabsTrigger>
              {user.role === "freelancer" && (
                <TabsTrigger value="proposals">{t("dashboard.recentProposals")}</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="projects" className="mt-4">
              <RecentProjects projects={userProjects.slice(0, 5)} />
            </TabsContent>
            {user.role === "freelancer" && (
              <TabsContent value="proposals" className="mt-4">
                <RecentProposals proposals={freelancerProposals.slice(0, 5)} />
              </TabsContent>
            )}
          </Tabs>
        </div>
        <div>
          <DashboardNotifications />
        </div>
      </div>
    </DashboardLayout>
  );
}
