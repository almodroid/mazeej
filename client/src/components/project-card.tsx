import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeftCircle,ArrowRightCircle, MessageSquare ,SaudiRiyal} from "lucide-react";
import { Project } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

type ProjectCardProps = {
  project: Project;
  proposals?: number;
};

// Define the skill interface
interface Skill {
  id: number;
  name: string;
}

export default function ProjectCard({ project, proposals = 0 }: ProjectCardProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === "ar";
  
  // Check if the current freelancer has already submitted a proposal
  const { data: userProposals = [] } = useQuery({
    queryKey: ["/api/proposals/my"],
    queryFn: async () => {
      if (!user || user.role !== "freelancer") return [];
      const response = await apiRequest("GET", "/api/proposals/my");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user && user.role === "freelancer",
  });

  // Fetch client information
  const { data: client } = useQuery({
    queryKey: ["/api/users", project.clientId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${project.clientId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!project.clientId,
  });

  const hasSubmittedProposal = userProposals.some((p: any) => p.projectId === project.id);
  
  // Format the date based on the current language
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      locale: i18n.language === 'ar' ? ar : enUS,
    });
  };
  
  // Get project type and category
  const projectCategory = project.category ? t(`projects.categories.${project.category}`) : null;

  // Fetch project skills
  const { data: projectSkills = [] } = useQuery<Skill[]>({
    queryKey: ["/api/projects", project.id, "skills"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/projects/${project.id}/skills`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!project.id,
  });

  return (
    <div className="bg-neutral-50 dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-cairo font-[300] text-neutral-900 dark:text-white">{project.title}</h3>
          {user?.role === 'freelancer' && client && (
            <p className="text-sm text-neutral-600 dark:text-gray-400 mt-1">
              <b>{t('projects.postedBy')}</b> {client.fullName || client.username}
            </p>
          )}
        </div>
        <span className="bg-accent/10 text-accent flex items-center gap-3 dark:bg-accent/20 text-sm px-2 py-2 h-8 rounded-full">
          <span className="font-cairo  text-foreground flex items-center gap-1 dark:text-white">
            <span className="flex items-center gap-1 flex-row-reverse">
              {isRTL? 
              <SaudiRiyal className="h-4 w-4" />
              :
              <span>SAR</span>
              }
              {project.budget}
            </span>
          </span>
        </span>
      </div>
      <p className="mt-2 text-neutral-600 font-[300] dark:text-gray-300 line-clamp-3">{project.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {projectCategory && (
          <span className="bg-primary/10 dark:bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
            {projectCategory}
          </span>
        )}
        
        {/* Display project skills */}
        {projectSkills.map((skill) => (
          <span key={skill.id} className="bg-accent/10 dark:bg-accent/20 text-accent text-xs px-2 py-1 rounded-full">
            {skill.name}
          </span>
        ))}
      </div>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-neutral-500 dark:text-gray-400 flex items-center mb-3">
          <MessageSquare className="h-4 w-4 mr-1" />
          {proposals} {t('projects.proposals')}
        </span>
      </div>
      <div className="mt-auto pt-3 border-t border-neutral-200 dark:border-gray-700 flex justify-between align-end items-center">
      <span className="mr-2 text-sm text-neutral-500 dark:text-gray-400">
            {project.createdAt && formatDate(project.createdAt)}
          </span>
        {user?.role === 'freelancer' ? (
          <Button className="w-full max-w-32 bg-primary hover:bg-primary-dark" asChild>
            <Link href={hasSubmittedProposal ? `/projects/${project.id}` : `/projects/${project.id}/proposals/new`}>
              {hasSubmittedProposal ? t('common.view') : t('projects.submitProposal')}
            </Link>
          </Button>
        ) : (
          <Button className={cn(
              "text-sm  bg-transparent text-primary hover:bg-primary/10 hover:text-primary-dark dark:hover:bg-primary/20 dark:text-primary dark:hover:text-primary-dark",
              "flex-row-reverse"
            )} asChild>
            <Link href={`/projects/${project.id}`}>
              {isRTL? 
              <ArrowLeftCircle></ArrowLeftCircle>
              :
              <ArrowRightCircle></ArrowRightCircle>
              }
              {t('common.view')}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
