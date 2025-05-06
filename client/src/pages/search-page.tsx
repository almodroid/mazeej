import { useTranslation } from "react-i18next";
import { useSearch } from "wouter";
import { useEffect , useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import SearchBar from "@/components/search/search-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import FreelancerCard from "@/components/freelancer-card";
import { User } from "@shared/schema";

interface SearchResults {
  freelancers: Omit<User, 'password'>[];
  categories: Array<{
    id: number;
    name: string;
    description: string;
  }>;
  skills: Array<{
    id: number;
    name: string;
  }>;
}

export default function SearchPage() {
  const { t, i18n } = useTranslation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const query = searchParams.get("q") || "";
  const isRTL = i18n.language === "ar";
  const [activeTab, setActiveTab] = useState("freelancers");

  // Search query
  const { data: searchResults, isLoading } = useQuery<SearchResults>({
    queryKey: ["/api/search", query],
    queryFn: async () => {
      if (!query.trim()) return { freelancers: [], categories: [], skills: [] };
      const response = await apiRequest("GET", `/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: query.trim().length > 0,
  });

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [isRTL]);

  return (
    <div className="min-h-screen flex flex-col dark:bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto my-16">
          <div className="mb-24">
            <h1 className="text-3xl font-bold my-16">{t("search.results", { defaultValue: isRTL ? "نتائج البحث" : "Search Results" })}</h1>
            <SearchBar />
          </div>

          {/* Search Results Section */}
          {query && (
            <div className="space-y-12">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Categories Section */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                      {t("search.categories", { defaultValue: isRTL ? "الفئات" : "Categories" })}
                      <span className="text-sm font-normal text-muted-foreground">({searchResults?.categories.length || 0})</span>
                    </h2>
                    {searchResults?.categories.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResults.categories.map((category) => (
                          <Card key={category.id}>
                            <CardContent className="p-6">
                              <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                              <p className="text-muted-foreground">{category.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                        {t("search.noCategories", { defaultValue: isRTL ? "لا يوجد فئات" : "No categories found" })}
                      </div>
                    )}
                  </section>

                  {/* Skills Section */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                      {t("search.skills", { defaultValue: isRTL ? "المهارات" : "Skills" })}
                      <span className="text-sm font-normal text-muted-foreground">({searchResults?.skills.length || 0})</span>
                    </h2>
                    {searchResults?.skills.length ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {searchResults.skills.map((skill) => (
                          <Card key={skill.id}>
                            <CardContent className="p-4">
                              <h3 className="text-base font-medium">{skill.name}</h3>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                        {t("search.noSkills", { defaultValue: isRTL ? "لا يوجد مهارات" : "No skills found" })}
                      </div>
                    )}
                  </section>

                  {/* Freelancers Section */}
                  <section>
                    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                      {t("search.freelancers", { defaultValue: isRTL ? "المستقلين" : "Freelancers" })}
                      <span className="text-sm font-normal text-muted-foreground">({searchResults?.freelancers.length || 0})</span>
                    </h2>
                    {searchResults?.freelancers.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResults.freelancers.map((freelancer) => (
                          <FreelancerCard key={freelancer.id} freelancer={freelancer} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                        {t("search.noFreelancers", { defaultValue: isRTL ? "لا يوجد مستقلين" : "No freelancers found" })}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}