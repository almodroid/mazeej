import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { Project } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

type ProjectCardProps = {
  project: Project;
  proposals?: number;
};

export default function ProjectCard({ project, proposals = 0 }: ProjectCardProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  
  // Format the date based on the current language
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: i18n.language === 'ar' ? ar : enUS,
    });
  };
  
  // Mock skills (would come from project_skills table in a real implementation)
  const skills = ["تصميم مواقع", "UI/UX", "واجهة أمامية"];

  return (
    <div className="bg-neutral-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between">
        <h3 className="text-xl font-cairo font-semibold text-neutral-900">{project.title}</h3>
        <span className="bg-accent/10 text-accent text-sm px-3 py-1 rounded-full">
          {t('projects.budget')}: ${project.budget}
        </span>
      </div>
      <p className="mt-2 text-neutral-600 line-clamp-3">{project.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span key={index} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-neutral-300"></div>
          <span className="mr-2 text-sm text-neutral-500">
            {project.createdAt && formatDate(project.createdAt)}
          </span>
        </div>
        <span className="text-sm text-neutral-500 flex items-center">
          <MessageSquare className="h-4 w-4 mr-1" />
          {proposals} {t('projects.proposals')}
        </span>
      </div>
      <div className="mt-4 pt-4 border-t border-neutral-200">
        {user?.role === 'freelancer' ? (
          <Button className="w-full bg-primary hover:bg-primary-dark" asChild>
            <Link href={`/projects/${project.id}/proposals/new`}>
              <a>{t('projects.submitProposal')}</a>
            </Link>
          </Button>
        ) : (
          <Button className="w-full bg-primary hover:bg-primary-dark" asChild>
            <Link href={`/projects/${project.id}`}>
              <a>{t('common.view')}</a>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
