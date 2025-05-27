import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import ProjectCard from "@/components/project-card";
import { Link } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { ArrowLeftCircle, ArrowRightCircle } from "lucide-react";

export default function ProjectsSection() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  
  // Fetch latest projects limited to 4 (for the grid)
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects", { limit: 4 }],
  });

  // Fetch proposal counts for each project
  const { data: proposalCounts = {}, isLoading: isLoadingProposals } = useQuery<Record<number, number>>({
    queryKey: ["/api/projects/proposals/count", { projectIds: projects.map(p => p.id) }],
    enabled: projects.length > 0, // Only run this query if we have projects
  });

  const isLoading = isLoadingProjects || isLoadingProposals;

  return (
    <section className="py-12 bg-white dark:bg-background animate-fade-in" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row-reverse justify-between items-center mb-8">
          <Link 
            href="/projects" 
            className="absolute border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-2 flex items-center gap-2 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex-row-reverse transform hover:scale-105 duration-300 animate-fade-in-up"
          >
            <span className={`material-icons text-sm ${isRTL ? 'animate-slide-rtl' : 'animate-slide-ltr'}`}>
              {isRTL ? <ArrowLeftCircle className="w-4" /> : <ArrowRightCircle className="w-4" />}
            </span>
            <span className="hidden md:inline">{t("projects.viewAll")}</span>
            <span className="md:hidden">{isRTL ? "المزيد" : "More"}</span>
          </Link>
          <h2 className="text-3xl font-cairo font-bold text-neutral-900 dark:text-white text-center flex-1 animate-fade-in-up">
            {t("projects.title") || "احدث المشاريع"}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20 animate-fade-in">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((project, index) => (
              <div 
                key={project.id} 
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm flex flex-col overflow-hidden transform hover:scale-105 transition-transform duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Placeholder image */}
                <div className="h-40 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center group">
                  <span className="text-neutral-400 dark:text-neutral-500 group-hover:scale-110 transition-transform duration-300">
                    صورة المشروع
                  </span>
                </div>
                <div className="flex-1 flex flex-col">
                  <ProjectCard 
                    project={project} 
                    proposals={proposalCounts[project.id] || 0} 
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in-up">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              {t("projects.noProjects")}
            </h3>
          </div>
        )}
      </div>
    </section>
  );
}
