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
import { Category, User } from "@shared/schema";
import { Search, Filter } from "lucide-react";

export default function BrowseFreelancers() {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  // Fetch freelancers
  const { data: freelancers = [], isLoading: isLoadingFreelancers } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/freelancers"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Filter freelancers based on search term and filters
  const filteredFreelancers = freelancers.filter(freelancer => {
    // Search by name or username
    const nameMatch = (freelancer.fullName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const usernameMatch = (freelancer.username || "").toLowerCase().includes(searchTerm.toLowerCase());
    const searchMatch = searchTerm ? (nameMatch || usernameMatch) : true;
    
    // Filter by category (would use userSkills in a real implementation)
    const categoryMatch = categoryFilter ? true : true; // Just for example
    
    // Filter by level
    const levelMatch = levelFilter ? freelancer.freelancerLevel === levelFilter : true;
    
    return searchMatch && categoryMatch && levelMatch;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setLevelFilter("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-cairo font-bold mb-8">{t("common.browseFreelancers")}</h1>
          
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
                <Select value={levelFilter} onValueChange={setLevelFilter}>
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
          </div>
          
          {isLoadingFreelancers ? (
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
