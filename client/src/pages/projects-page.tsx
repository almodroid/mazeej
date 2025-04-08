import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ProjectCard from "@/components/project-card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Category, Project } from "@shared/schema";
import { Search, Filter, Plus } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function ProjectsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch proposals counts (this would be implemented differently in a real app)
  const proposalsCounts = { 1: 8, 2: 12 }; // Mock data

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Filter projects based on search term and filters
  const filteredProjects = projects.filter(project => {
    // Search by title or description
    const titleMatch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
    const descriptionMatch = project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const searchMatch = searchTerm ? (titleMatch || descriptionMatch) : true;
    
    // Filter by category
    const categoryMatch = categoryFilter ? project.category.toString() === categoryFilter : true;
    
    // Filter by status
    const statusMatch = statusFilter ? project.status === statusFilter : true;
    
    return searchMatch && categoryMatch && statusMatch;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setStatusFilter("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-cairo font-bold">{t("projects.title")}</h1>
            
            {user?.role === 'client' && (
              <Button asChild>
                <Link href="/projects/create">
                  <a className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("projects.createProject")}
                  </a>
                </Link>
              </Button>
            )}
          </div>
          
          <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder={t("common.search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder={t("categories.title")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder={t("common.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">{t("open")}</SelectItem>
                    <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
                    <SelectItem value="completed">{t("completed")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={resetFilters} className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" /> {t("common.reset")}
                </Button>
              </div>
            </div>
          </div>
          
          {isLoadingProjects ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProjects.map((project) => (
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
              {user?.role === 'client' && (
                <Button asChild className="mt-4">
                  <Link href="/projects/create">
                    <a>{t("projects.createProject")}</a>
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
