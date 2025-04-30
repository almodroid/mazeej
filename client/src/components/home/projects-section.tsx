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
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { limit: 4 }],
  });

  // Fetch proposals counts (this would be implemented differently in a real app)
  const proposalsCounts: Record<number, number> = { 1: 8, 2: 12, 3: 5, 4: 7 }; // Mock data

  return (
    <section className="py-12 bg-white dark:bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row-reverse justify-between items-center mb-8">
          <Link href="/projects" className="border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-2 flex items-center gap-2 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex-row-reverse">
  <span className="material-icons text-sm">{isRTL? <ArrowLeftCircle className="w-4"></ArrowLeftCircle>  :  <ArrowRightCircle className="w-4"></ArrowRightCircle> }</span>
  {t("projects.viewAll") || "مشاهدة المزيد"}
</Link>
          <h2 className="text-3xl font-cairo font-bold text-neutral-900 dark:text-white text-center flex-1">
            {t("projects.title") || "احدث المشاريع"}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                {/* Placeholder image */}
                <div className="h-40 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                  <span className="text-neutral-400 dark:text-neutral-500">صورة المشروع</span>
                </div>
                <div className="flex-1 flex flex-col">
                  <ProjectCard 
                    project={project} 
                    proposals={proposalsCounts[project.id] || 0} 
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              {t("projects.noProjects")}
            </h3>
          </div>
        )}
      </div>
    </section>
  );
}
