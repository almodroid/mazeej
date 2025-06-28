import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import FreelancerCard from "@/components/freelancer-card";
import FreelancerFilters from "@/components/ui/freelancer-filters";
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
import { Badge } from "@/components/ui/badge";
import { Category, User, Skill } from "@shared/schema";
import { Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrowseFreelancers() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: "all",
    experienceLevel: "all",
    hourlyRateRange: [0, 200] as [number, number],
    skills: [] as string[],
    rating: 0,
    availability: "all",
    verifiedOnly: false
  });

  // Fetch freelancers
  const { data: freelancers = [], isLoading: isLoadingFreelancers } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/freelancers"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Fetch skills
  const { data: skills = [] } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  // For development/demo purposes, let's create a mock relationship between freelancers and skills
  // In a real app, this would come from the backend
  const [freelancerSkills, setFreelancerSkills] = useState<Record<number, number[]>>({});
  
  // Initialize freelancer skills with random skills for demo purposes
  useEffect(() => {
    if (freelancers.length > 0 && skills.length > 0 && Object.keys(freelancerSkills).length === 0) {
      const mockSkillsMap: Record<number, number[]> = {};
      
      // Assign 2-5 random skills to each freelancer
      freelancers.forEach(freelancer => {
        const numSkills = Math.floor(Math.random() * 4) + 2; // 2-5 skills
        const freelancerSkillIds: number[] = [];
        
        // Get random skills
        for (let i = 0; i < numSkills; i++) {
          const randomSkillIndex = Math.floor(Math.random() * skills.length);
          const skillId = skills[randomSkillIndex].id;
          if (!freelancerSkillIds.includes(skillId)) {
            freelancerSkillIds.push(skillId);
          }
        }
        
        mockSkillsMap[freelancer.id] = freelancerSkillIds;
      });
      
      setFreelancerSkills(mockSkillsMap);
      console.log('Generated mock freelancer skills:', mockSkillsMap);
    }
  }, [freelancers, skills, freelancerSkills]);

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [i18n.language]);

  // Get unique cities from freelancers
  const cities = Array.from(new Set(freelancers.map(f => f.city).filter(Boolean))) as string[];

  // Filter freelancers based on search term and filters
  const filteredFreelancers = freelancers.filter(freelancer => {
    // Search by name or username
    const nameMatch = (freelancer.fullName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const usernameMatch = (freelancer.username || "").toLowerCase().includes(searchTerm.toLowerCase());
    const bioMatch = (freelancer.bio || "").toLowerCase().includes(searchTerm.toLowerCase());
    const searchMatch = searchTerm ? (nameMatch || usernameMatch || bioMatch) : true;
    
    // Filter by city
    const cityMatch = filters.city && filters.city !== "all" ? freelancer.city === filters.city : true;
    
    // Filter by experience level
    const levelMatch = filters.experienceLevel && filters.experienceLevel !== "all" ? freelancer.freelancerLevel === filters.experienceLevel : true;
    
    // Filter by hourly rate
    const rateMatch = freelancer.hourlyRate ? 
      freelancer.hourlyRate >= filters.hourlyRateRange[0] && freelancer.hourlyRate <= filters.hourlyRateRange[1] : true;
    
    // Filter by skills
    const userSkillIds = freelancerSkills[freelancer.id] || [];
    const skillsMatch = filters.skills.length === 0 ? true : 
      filters.skills.some(skillId => userSkillIds.includes(parseInt(skillId)));
    
    // Filter by rating (mock - in real app this would come from reviews)
    const ratingMatch = filters.rating === 0 ? true : true; // TODO: Implement rating filtering
    
    // Filter by availability (use real online status from database)
    const availabilityMatch = filters.availability && filters.availability !== "all" ? 
      (filters.availability === "online" ? freelancer.isOnline : !freelancer.isOnline) : true;
    
    // Filter by verified status
    const verifiedMatch = filters.verifiedOnly ? freelancer.isVerified : true;
    
    return searchMatch && cityMatch && levelMatch && rateMatch && skillsMatch && ratingMatch && availabilityMatch && verifiedMatch;
  });

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.city && filters.city !== "all") count++;
    if (filters.experienceLevel && filters.experienceLevel !== "all") count++;
    if (filters.availability && filters.availability !== "all") count++;
    if (filters.verifiedOnly) count++;
    if (filters.skills.length > 0) count++;
    if (filters.hourlyRateRange[0] > 0 || filters.hourlyRateRange[1] < 200) count++;
    if (filters.rating > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Debug logging to verify default behavior
  useEffect(() => {
    console.log('Freelancers Debug Info:', {
      totalFreelancers: freelancers.length,
      filteredFreelancers: filteredFreelancers.length,
      searchTerm,
      filters,
      activeFiltersCount,
      showFilters
    });
  }, [freelancers.length, filteredFreelancers.length, searchTerm, filters, activeFiltersCount, showFilters]);

  const resetFilters = () => {
    setFilters({
      city: "all",
      experienceLevel: "all",
      hourlyRateRange: [0, 200],
      skills: [],
      rating: 0,
      availability: "all",
      verifiedOnly: false
    });
  };

  // Filter content component
  const FilterContent = () => (
    <FreelancerFilters
      categories={categories}
      skills={skills}
      cities={cities}
      filters={filters}
      onFilterChange={setFilters}
      onReset={resetFilters}
      isRTL={isRTL}
    />
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-cairo font-bold">{t("freelancers.title", "Browse Freelancers")}</h1>
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
            
            {/* Freelancers Grid */}
            <div className="flex-1">
              {/* Results Count */}
              <div className="mb-6 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {isLoadingFreelancers ? (
                    t("common.loading", "Loading...")
                  ) : (
                    t("freelancers.resultsCount", "Showing {{count}} freelancers", { 
                      count: filteredFreelancers.length 
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

              {isLoadingFreelancers ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : filteredFreelancers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredFreelancers.map((freelancer) => (
                    <FreelancerCard key={freelancer.id} freelancer={freelancer} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    {searchTerm || activeFiltersCount > 0 
                      ? t("freelancers.noResults", "No freelancers found matching your criteria")
                      : t("freelancers.noFreelancers", "No freelancers available")
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
