import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ProjectCard from "@/components/project-card";
import ProjectFilters from "@/components/ui/project-filters";
import MobileFilterDrawer from "@/components/ui/mobile-filter-drawer";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Category, Project, Skill } from "@shared/schema";
import { Search, Filter, Plus, X } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === "ar";
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    budgetRange: [0, 10000] as [number, number],
    category: "all",
    status: "all",
    postedDate: "all",
    skills: [] as string[],
    projectType: "all",
    city: "all"
  });

  // Fetch projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch skills
  const { data: skills = [] } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  // Fetch proposal counts for each project
  const { data: proposalCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/projects/proposal-counts"],
    queryFn: async () => {
      const counts: Record<number, number> = {};
      await Promise.all(projects.map(async (project) => {
        try {
          const response = await apiRequest("GET", `/api/projects/${project.id}/proposals`);
          if (response.ok) {
            const proposals = await response.json();
            counts[project.id] = proposals.length;
          } else {
            counts[project.id] = 0;
          }
        } catch (error) {
          console.error(`Error fetching proposals for project ${project.id}:`, error);
          counts[project.id] = 0;
        }
      }));
      return counts;
    },
    enabled: projects.length > 0,
  });

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [i18n.language]);

  // Set freelancer's city as default filter when they are logged in
  useEffect(() => {
    if (user?.role === 'freelancer' && user?.city && filters.city === "all") {
      setFilters(prev => ({
        ...prev,
        city: user.city || "all"
      }));
    }
  }, [user, filters.city]);

  // Get unique cities from projects
  const cities = Array.from(new Set(projects.map(p => p.city).filter(Boolean))) as string[];

  // Filter projects based on search term and filters
  const filteredProjects = projects.filter(project => {
    // Hide pending projects from freelancers
    if (user?.role === 'freelancer' && project.status === 'pending') {
      return false;
    }
    
    // Search by title or description
    const titleMatch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
    const descriptionMatch = project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const searchMatch = searchTerm ? (titleMatch || descriptionMatch) : true;
    
    // Filter by budget range
    const budgetMatch = project.budget >= filters.budgetRange[0] && project.budget <= filters.budgetRange[1];
    
    // Filter by category
    const categoryMatch = filters.category && filters.category !== "all" ? project.category.toString() === filters.category : true;
    
    // Filter by status
    const statusMatch = filters.status && filters.status !== "all" ? project.status === filters.status : true;
    
    // Filter by posted date
    let dateMatch = true;
    if (filters.postedDate && filters.postedDate !== "all") {
      const projectDate = project.createdAt ? new Date(project.createdAt) : new Date();
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - projectDate.getTime()) / (1000 * 60 * 60 * 24));
      const filterDays = parseInt(filters.postedDate);
      dateMatch = daysDiff <= filterDays;
    }
    
    // Filter by project type
    const typeMatch = filters.projectType && filters.projectType !== "all" ? project.projectType === filters.projectType : true;
    
    // Filter by city
    const cityMatch = filters.city && filters.city !== "all" ? project.city === filters.city : true;
    
    // Filter by skills (if project has skills, check if any match selected skills)
    const skillsMatch = filters.skills.length === 0 ? true : true; // TODO: Implement project skills filtering
    
    return searchMatch && budgetMatch && categoryMatch && statusMatch && dateMatch && typeMatch && cityMatch && skillsMatch;
  });

  const resetFilters = () => {
    setFilters({
      budgetRange: [0, 10000],
      category: "all",
      status: "all",
      postedDate: "all",
      skills: [],
      projectType: "all",
      city: "all"
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category && filters.category !== "all") count++;
    if (filters.status && filters.status !== "all") count++;
    if (filters.postedDate && filters.postedDate !== "all") count++;
    if (filters.projectType && filters.projectType !== "all") count++;
    if (filters.skills.length > 0) count++;
    if (filters.budgetRange[0] > 0 || filters.budgetRange[1] < 10000) count++;
    if (showCityFilter && filters.city && filters.city !== "all") count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Determine if any selected skill is location-based
  const selectedLocationBased = filters.skills
    .map(id => skills.find(s => s.id.toString() === id))
    .some(skill => skill?.locationBased);

  // For freelancers, check if any of their skills are location-based
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  useEffect(() => {
    if (user?.role === 'freelancer' && user?.id) {
      apiRequest('GET', `/api/users/${user.id}/skills`).then(res => res.json()).then(setUserSkills);
    }
  }, [user]);
  const userHasLocationBased = userSkills.some(skill => skill.locationBased);

  // Show city filter if any selected skill is location-based, or if freelancer has any location-based skill
  const showCityFilter = selectedLocationBased || (user?.role === 'freelancer' && userHasLocationBased);

  // Filter content component
  const FilterContent = () => (
    <ProjectFilters
      categories={categories}
      skills={skills}
      cities={cities}
      filters={filters}
      onFilterChange={setFilters}
      onReset={resetFilters}
      isRTL={isRTL}
      showCityFilter={showCityFilter}
    />
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
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
          
          {/* Search and Filter Bar */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
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
              
              {/* Desktop Filter Toggle Button */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="hidden lg:flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {t("filters.title")}
                {activeFiltersCount > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {activeFiltersCount}
                  </span>
                )}
                </Button>

              {/* Mobile Filter Drawer */}
              <MobileFilterDrawer
                activeFiltersCount={activeFiltersCount}
                isRTL={isRTL}
              >
                <FilterContent />
              </MobileFilterDrawer>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Filters Sidebar */}
            {showFilters && (
              <div className="hidden lg:block lg:w-80 flex-shrink-0">
                <FilterContent />
              </div>
            )}
            
            {/* Projects Grid */}
            <div className="flex-1">
              {/* Results Count */}
              <div className="mb-6 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {isLoadingProjects ? (
                    t("common.loading", "Loading...")
                  ) : (
                    t("projects.resultsCount", "Showing {{count}} projects", { 
                      count: filteredProjects.length 
                    })
                  )}
                </p>
                {activeFiltersCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("filters.activeFilters", "{{count}} active filters", { 
                      count: activeFiltersCount 
                    })}
                  </p>
                )}
          </div>
          
          {isLoadingProjects ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  proposals={proposalCounts[project.id] || 0} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    {searchTerm || activeFiltersCount > 0 
                      ? t("projects.noResults", "No projects found matching your criteria")
                      : t("projects.noProjects", "No projects available")
                    }
              </h3>
                  {(searchTerm || activeFiltersCount > 0) && (
                    <Button 
                      variant="outline" 
                      onClick={resetFilters}
                      className="mt-4"
                    >
                      {t("filters.clearAll", "Clear all filters")}
                    </Button>
                  )}
                  {user?.role === 'client' && !searchTerm && activeFiltersCount === 0 && (
                <Button asChild className="mt-4">
                  <Link href="/projects/create">
                    <a>{t("projects.createProject")}</a>
                  </Link>
                </Button>
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
