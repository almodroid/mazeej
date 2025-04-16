import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import ProjectCard from "@/components/project-card";
import { Link } from "wouter";

export default function ProjectsSection() {
  const { t } = useTranslation();
  
  // Fetch latest projects limited to 2
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { limit: 2 }],
  });

  // Fetch proposals counts (this would be implemented differently in a real app)
  const proposalsCounts: Record<number, number> = { 1: 8, 2: 12 }; // Mock data

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-cairo font-bold text-neutral-900">
            {t("projects.title")}
          </h2>
          <Link href="/projects">
            <a className="text-primary hover:text-primary-dark font-medium">
              {t("projects.viewAll")}
            </a>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                proposals={proposalsCounts[project.id] || 0} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {t("projects.noProjects")}
            </h3>
          </div>
        )}
      </div>
    </section>
  );
}
