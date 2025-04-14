import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Project } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { AlertCircle, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layouts/dashboard-layout";

export default function MyProjectsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch client projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !!user && user.role === "client",
  });

  // Filter to only show user's projects
  const clientProjects = projects.filter(project => 
    user && project.clientId === user.id
  );

  // Format the date based on the current language
  const formatDate = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: i18n.language === 'ar' ? ar : enUS,
    });
  };

  // Map status to badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">{t("project.statusOpen")}</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">{t("project.statusInProgress")}</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">{t("project.statusCompleted")}</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">{t("project.statusCancelled")}</Badge>;
      default:
        return null;
    }
  };

  // Filter projects based on search term and active tab
  const filteredProjects = clientProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && project.status === activeTab;
  });

  // Map projects for display, handling potential null createdAt
  const displayProjects = filteredProjects.map(project => {
    const createdAtDisplay = project.createdAt 
      ? formatDate(new Date(project.createdAt as unknown as string)) 
      : "";
    
    return {
      ...project,
      createdAtDisplay
    };
  });

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  const isRTL = i18n.language === "ar";

  if (!user || user.role !== "client") {
    return null;
  }

  return (
    <DashboardLayout>
      <div className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between mb-6",
        isRTL && "md:flex-row"
      )}>
        <h1 className="text-3xl font-cairo font-bold mb-4 md:mb-0">
          {t("myProjects.title")}
        </h1>
        <Link href="/projects/create">
          <Button className={cn(
            "flex items-center",
            isRTL && "flex-row"
          )}>
            <Plus className={isRTL ? "ml-2" : "mr-2"} size={16} />
            {t("myProjects.createNew")}
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className={cn(
            "absolute top-1/2 transform -translate-y-1/2 text-neutral-400",
            isRTL ? "right-3" : "left-3"
          )} size={18} />
          <Input 
            className={cn(
              "bg-white",
              isRTL ? "pr-10" : "pl-10"
            )}
            placeholder={t("myProjects.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab} dir={isRTL ? "rtl" : "ltr"}>
        <TabsList className={cn("mb-6", isRTL && "flex-row")}>
          <TabsTrigger value="all">{t("myProjects.all")}</TabsTrigger>
          <TabsTrigger value="open">{t("myProjects.open")}</TabsTrigger>
          <TabsTrigger value="in_progress">{t("myProjects.inProgress")}</TabsTrigger>
          <TabsTrigger value="completed">{t("myProjects.completed")}</TabsTrigger>
          <TabsTrigger value="cancelled">{t("myProjects.cancelled")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>{t("myProjects.projectsCount", { count: filteredProjects.length })}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>{t("common.loading")}</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 flex flex-col items-center">
                  <AlertCircle className="h-12 w-12 text-neutral-300 mb-4" />
                  <p>{t("myProjects.noProjects")}</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {displayProjects.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="block p-4 hover:bg-neutral-50 transition-colors">
                        <div className={cn(
                          "flex justify-between items-start mb-2",
                          isRTL && "flex-row"
                        )}>
                          <h3 className="font-medium text-neutral-900">{project.title}</h3>
                          {project.status && getStatusBadge(project.status)}
                        </div>
                        <p className="text-neutral-600 text-sm line-clamp-2 mb-2">
                          {project.description}
                        </p>
                        <div className={cn(
                          "flex justify-between items-center text-sm text-neutral-500",
                          isRTL && "flex-row"
                        )}>
                          <span>${project.budget}</span>
                          <span>{project.createdAtDisplay}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
} 