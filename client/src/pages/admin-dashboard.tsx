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
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ShoppingCart,
  Clock
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
  
  // Fetch users data
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });
  
  // Fetch projects data
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });
  
  // Fetch categories data
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/categories");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });
  
  // Fetch payments data
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/payments");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Calculate total earnings (5% of all payments)
  const totalEarnings = (payments as Payment[]).reduce((total: number, payment: Payment) => {
    return total + (payment.amount * 0.05);
  }, 0);

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-8 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-6">
          <div className={cn(
            "flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
            isRTL && "md:flex-row"
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
                {isLoadingUsers ? (
                  <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded"></span>
                ) : (
                  <div className="flex items-center">
                    {users.length}
                    <span className="text-sm ml-2 text-green-500 flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      12%
                    </span>
            </div>
                )}
          </div>
              <p className="text-xs text-muted-foreground mt-2">
                +24 {t("common.thisMonth")}
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
                {isLoadingProjects ? (
                  <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded"></span>
                ) : (
                  <div className="flex items-center">
                    {projects.length}
                    <span className="text-sm ml-2 text-green-500 flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      8%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                +12 {t("common.thisMonth")}
              </p>
              </CardContent>
            </Card>
            
          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-100 dark:border-emerald-900/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">{t("dashboard.totalEarnings")}</CardTitle>
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              </CardHeader>
              <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {isLoadingPayments ? (
                  <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded"></span>
                ) : (
                  <div className="flex items-center">
                    ${totalEarnings.toFixed(2)}
                    <span className="text-sm ml-2 text-green-500 flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      18%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                +$840 {t("common.thisMonth")}
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
                {isLoadingCategories ? (
                  <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded"></span>
                ) : (
                  <div className="flex items-center">
                    {categories.length}
                    <span className="text-sm ml-2 text-green-500 flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      3%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                +2 {t("common.thisMonth")}
              </p>
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
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t("dashboard.projectStatus")}</CardTitle>
              <CardDescription>{t("dashboard.projectStatusDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              </CardContent>
            </Card>
            
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("dashboard.newUsers")}</CardTitle>
              <CardDescription>{t("dashboard.newUsersDescription")}</CardDescription>
              </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userRegistrationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
        {/* Recent Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("dashboard.recentUsers")}</CardTitle>
                <Button variant="ghost" size="sm" className="gap-1">
                  <span>{t("common.viewAll")}</span>
                      </Button>
                  </div>
                </CardHeader>
                <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(users as User[]).slice(0, 5).map((user: User) => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {user.username?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">{user.username}</p>
                          <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                  </div>
                      </div>
                      <Badge variant={user.role === "admin" ? "destructive" : "secondary"} className="capitalize">
                        {t(`auth.${user.role}`)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("dashboard.recentProjects")}</CardTitle>
                <Button variant="ghost" size="sm" className="gap-1">
                  <span>{t("common.viewAll")}</span>
                </Button>
                  </div>
                </CardHeader>
                <CardContent>
              {isLoadingProjects ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(projects as Project[]).slice(0, 5).map((project: Project) => (
                    <div key={project.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <p className="text-sm font-medium">{project.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground ml-4 mt-1">${project.budget}</p>
                      </div>
                            <Badge variant={
                              project.status === "open" ? "secondary" : 
                              project.status === "in_progress" ? "outline" : 
                              "outline"
                            } className={
                              project.status === "completed" ? "bg-green-500/10 text-green-500" : ""
                            }>
                              {t(`projects.${project.status}`)}
                            </Badge>
                    </div>
                  ))}
                    </div>
              )}
                </CardContent>
              </Card>
        </div>
    </div>
    </AdminLayout>
  );
}