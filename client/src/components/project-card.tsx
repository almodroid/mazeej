import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeftCircle,ArrowRightCircle, MessageSquare ,SaudiRiyal} from "lucide-react";
import { Project } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";



type ProjectCardProps = {
  project: Project;
  proposals?: number;
};

export default function ProjectCard({ project, proposals = 0 }: ProjectCardProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === "ar";
  
  // Format the date based on the current language
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      
      locale: i18n.language === 'ar' ? ar : enUS,
    });
  };
  
  // Mock skills (would come from project_skills table in a real implementation)
  const skills = ["تصميم مواقع", "UI/UX", "واجهة أمامية"];

  return (
    <div className="bg-neutral-50 dark:bg-gray-800  p-6 shadow-sm hover:shadow-md transition-shadow duration-200" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex justify-between">
        <h3 className="text-lg font-cairo font-[300] text-neutral-900 dark:text-white">{project.title}</h3>
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
        {skills.map((skill, index) => (
          <span key={index} className="bg-primary/10 dark:bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-neutral-500 dark:text-gray-400 flex items-center">
          <MessageSquare className="h-4 w-4 mr-1" />
          {proposals} {t('projects.proposals')}
        </span>
      </div>
      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-gray-700 flex justify-between align-end items-center">
      <span className="mr-2 text-sm text-neutral-500 dark:text-gray-400">
            {project.createdAt && formatDate(project.createdAt)}
          </span>
        {user?.role === 'freelancer' ? (
          <Button className="w-full bg-primary hover:bg-primary-dark" asChild>
            <Link href={`/projects/${project.id}/proposals/new`}>
              {t('projects.submitProposal')}
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
