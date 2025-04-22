import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import FreelancerCard from "@/components/freelancer-card";
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

export default function BrowseFreelancers() {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [activeFilters, setActiveFilters] = useState<{type: string, value: string, label: string}[]>([]);

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
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Filter freelancers based on search term and filters
  const filteredFreelancers = freelancers.filter(freelancer => {
    // Search by name or username
    const nameMatch = (freelancer.fullName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const usernameMatch = (freelancer.username || "").toLowerCase().includes(searchTerm.toLowerCase());
    const bioMatch = (freelancer.bio || "").toLowerCase().includes(searchTerm.toLowerCase());
    const searchMatch = searchTerm ? (nameMatch || usernameMatch || bioMatch) : true;
    
    // Filter by category
    let categoryMatch = true;
    if (categoryFilter) {
      const userSkillIds = freelancerSkills[freelancer.id] || [];
      
      // Check if any of the freelancer's skills belong to the selected category
      const skillsInCategory = skills.filter(skill => 
        userSkillIds.includes(skill.id) && 
        skill.categoryId === parseInt(categoryFilter)
      );
      
      categoryMatch = skillsInCategory.length > 0;
    }
    
    // Filter by skill
    const userSkillIds = freelancerSkills[freelancer.id] || [];
    const skillMatch = skillFilter ? 
      userSkillIds.includes(parseInt(skillFilter)) : true;
    
    // Filter by level
    const levelMatch = levelFilter ? freelancer.freelancerLevel === levelFilter : true;
    
    return searchMatch && categoryMatch && skillMatch && levelMatch;
  });

  // Add a filter to the active filters list
  const addFilter = (type: string, value: string, label: string) => {
    // Remove any existing filter of the same type
    const updatedFilters = activeFilters.filter(filter => filter.type !== type);
    
    // Add the new filter if it has a value
    if (value) {
      setActiveFilters([...updatedFilters, { type, value, label }]);
    } else {
      setActiveFilters(updatedFilters);
    }
  };

  // Remove a specific filter
  const removeFilter = (type: string) => {
    setActiveFilters(activeFilters.filter(filter => filter.type !== type));
    
    // Reset the corresponding state
    switch (type) {
      case 'category':
        setCategoryFilter("");
        break;
      case 'skill':
        setSkillFilter("");
        break;
      case 'level':
        setLevelFilter("");
        break;
      case 'search':
        setSearchTerm("");
        break;
    }
  };

  // Handle category filter change
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setSkillFilter(""); // Reset skill filter when category changes
    
    if (value) {
      const category = categories.find(c => c.id.toString() === value);
      if (category) {
        addFilter('category', value, category.name);
      }
    } else {
      removeFilter('category');
    }
  };

  // Handle skill filter change
  const handleSkillChange = (value: string) => {
    setSkillFilter(value);
    
    if (value) {
      const skill = skills.find(s => s.id.toString() === value);
      if (skill) {
        addFilter('skill', value, skill.name);
      }
    } else {
      removeFilter('skill');
    }
  };

  // Handle level filter change
  const handleLevelChange = (value: string) => {
    setLevelFilter(value);
    
    if (value) {
      addFilter('level', value, t(`profile.${value}`));
    } else {
      removeFilter('level');
    }
  };

  // Handle search term change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value) {
      addFilter('search', value, value);
    } else {
      removeFilter('search');
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setLevelFilter("");
    setSkillFilter("");
    setActiveFilters([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-cairo font-bold mb-8">{t("common.browseFreelancers")}</h1>
          
          <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow dark:bg-gray-800 rounded-lg border border-border dark:border-gray-700">
                <Input
                  type="text"
                  placeholder={t("common.search")}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={categoryFilter} onValueChange={handleCategoryChange}>
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
                
                {categoryFilter && (
                  <Select value={skillFilter} onValueChange={handleSkillChange}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder={t("skills.title")} />
                    </SelectTrigger>
                    <SelectContent>
                      {skills
                        .filter(skill => skill.categoryId === parseInt(categoryFilter))
                        .map((skill) => (
                          <SelectItem key={skill.id} value={skill.id.toString()}>
                            {skill.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
                
                <Select value={levelFilter} onValueChange={handleLevelChange}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder={t("profile.level")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{t("profile.beginner")}</SelectItem>
                    <SelectItem value="intermediate">{t("profile.intermediate")}</SelectItem>
                    <SelectItem value="advanced">{t("profile.advanced")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={resetFilters} className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" /> {t("common.reset")}
                </Button>
              </div>
            </div>
            
            {/* Active filters */}
            {activeFilters.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <Badge 
                    key={filter.type} 
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    <span>{filter.type === 'search' ? t('common.search') + ': ' : ''}{filter.label}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter(filter.type)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {isLoadingFreelancers || Object.keys(freelancerSkills).length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredFreelancers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFreelancers.map((freelancer) => (
                <FreelancerCard key={freelancer.id} freelancer={freelancer} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {t("freelancers.noFreelancers")}
              </h3>
              <p className="text-neutral-600">
                {t("freelancers.tryDifferentSearch")}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
