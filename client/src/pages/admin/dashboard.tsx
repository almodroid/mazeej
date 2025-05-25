import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Users, 
  Folder, 
  Layers, 
  BarChart4,
  TrendingUp,
  ArrowUpRight,
  ShoppingCart,
  Clock,
  SaudiRiyal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import AdminLayout from "@/components/layouts/admin-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Define interfaces for the data types
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt?: string;
  fullName?: string;
  profileImage?: string;
}

interface Project {
  id: string;
  title: string;
  clientId: string;
  budget: number;
  status: string;
  createdAt?: string;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface Payment {
  id: string;
  amount: number;
  createdAt?: string;
}

interface ProjectStatus {
  status: string;
  count: number;
  color?: string;
}

interface DashboardStats {
  users: {
    total: number;
    newThisMonth: number;
    growth: string;
  };
  projects: {
    total: number;
    newThisMonth: number;
    growth: string;
  };
  categories: {
    total: number;
  };
  earnings: {
    currentMonth: number;
    lastMonth: number;
    growth: string;
  };
}

// Sample data for charts
const monthlyRevenueData = [
  { name: 'Jan', revenue: 500 },
  { name: 'Feb', revenue: 800 },
  { name: 'Mar', revenue: 1200 },
  { name: 'Apr', revenue: 1000 },
  { name: 'May', revenue: 1500 },
  { name: 'Jun', revenue: 2000 },
  { name: 'Jul', revenue: 1800 },
  { name: 'Aug', revenue: 2400 },
  { name: 'Sep', revenue: 2200 },
  { name: 'Oct', revenue: 2600 },
  { name: 'Nov', revenue: 2800 },
  { name: 'Dec', revenue: 3200 },
];

const projectStatusData = [
  { name: 'Open', value: 30, color: '#8884d8' },
  { name: 'In Progress', value: 45, color: '#82ca9d' },
  { name: 'Completed', value: 25, color: '#ffc658' },
];

const userRegistrationData = [
  { name: 'Week 1', users: 12 },
  { name: 'Week 2', users: 19 },
  { name: 'Week 3', users: 15 },
  { name: 'Week 4', users: 27 },
  { name: 'Week 5', users: 32 },
  { name: 'Week 6', users: 24 },
  { name: 'Week 7', users: 38 },
  { name: 'Week 8', users: 41 },
];

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const isRTL = i18n.language === "ar";
  
  // Fetch dashboard statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/dashboard/stats");
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Fetch monthly revenue data
  const { data: revenueData = [], isLoading: isLoadingRevenue } = useQuery({
    queryKey: ["/api/admin/dashboard/revenue"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/dashboard/revenue");
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Fetch project status data
  const { data: projectStatusData = [], isLoading: isLoadingProjectStatus } = useQuery({
    queryKey: ["/api/admin/dashboard/project-status"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/dashboard/project-status");
      if (!response.ok) throw new Error('Failed to fetch project status');
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Fetch user registration data
  const { data: userRegistrationData = [], isLoading: isLoadingUserRegistration } = useQuery({
    queryKey: ["/api/admin/dashboard/user-registration"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/dashboard/user-registration");
      if (!response.ok) throw new Error('Failed to fetch user registration data');
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-8 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-6">
        <div className={cn(
          "flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
        )}>
          <div>
            <h1 className="text-3xl font-cairo font-bold mb-2 text-foreground">
              {t("auth.admin.dashboard")}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.admin.dashboardDescription")}
            </p>
          </div>
        </div>
            
        {/* Stats Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-purple-100 dark:border-purple-900/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">{t("dashboard.totalUsers")}</CardTitle>
              <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/20 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {isLoadingStats ? (
                  <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded"></span>
                ) : (
                  <div className="flex items-center">
                    {stats?.users?.total || 0}
                    <span className={cn(
                      "text-sm ml-2 flex items-center",
                      Number(stats?.users?.growth || 0) >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {stats?.users?.growth || 0}%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                +{stats?.users?.newThisMonth || 0} {t("common.thisMonth")}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-100 dark:border-blue-900/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">{t("dashboard.totalProjects")}</CardTitle>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {isLoadingStats ? (
                  <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded"></span>
                ) : (
                  <div className="flex items-center">
                    {stats?.projects?.total || 0}
                    <span className={cn(
                      "text-sm ml-2 flex items-center",
                      Number(stats?.projects?.growth || 0) >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {stats?.projects?.growth || 0}%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                +{stats?.projects?.newThisMonth || 0} {t("common.thisMonth")}
              </p>
            </CardContent>
          </Card>
            
          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-100 dark:border-emerald-900/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">{t("dashboard.totalEarnings")}</CardTitle>
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                {isRTL ? <SaudiRiyal className="h-10 w-10 text-neutral-300 mx-auto mb-3" /> : "SAR"}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {isLoadingStats ? (
                  <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded"></span>
                ) : (
                  <div className="flex items-center">
                    ${Number(stats?.earnings?.currentMonth || 0).toFixed(2)}
                    <span className={cn(
                      "text-sm ml-2 flex items-center",
                      Number(stats?.earnings?.growth || 0) >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {stats?.earnings?.growth || 0}%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                +${Number((stats?.earnings?.currentMonth || 0) - (stats?.earnings?.lastMonth || 0)).toFixed(2)} {t("common.thisMonth")}
              </p>
            </CardContent>
          </Card>
            
          <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-100 dark:border-amber-900/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">{t("dashboard.categories")}</CardTitle>
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                <Layers className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {isLoadingStats ? (
                  <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded"></span>
                ) : (
                  <div className="flex items-center">
                    {stats?.categories?.total || 0}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t("dashboard.monthlyRevenue")}</CardTitle>
              <CardDescription>{t("dashboard.monthlyRevenueDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {isLoadingRevenue ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t("dashboard.projectStatus")}</CardTitle>
              <CardDescription>{t("dashboard.projectStatusDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                {isLoadingProjectStatus ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="status"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {projectStatusData.map((entry: ProjectStatus, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* User Registration Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.userRegistration")}</CardTitle>
            <CardDescription>{t("dashboard.userRegistrationDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoadingUserRegistration ? (
                <div className="h-full flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userRegistrationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 