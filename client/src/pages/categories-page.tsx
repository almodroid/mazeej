import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CategoryCard from "@/components/category-card";
import FreelancerCard from "@/components/freelancer-card";
import { Category, User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CategoriesPage() {
  const { t, i18n } = useTranslation();

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch top freelancers for each category
  const { data: freelancers = [] } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/freelancers"],
  });

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-cairo font-bold text-neutral-900 mb-4 dark:text-white">
              {t("categories.title")}
            </h1>
            <p className="text-xl text-neutral-600 dark:text-gray-400">
              {t("categories.subtitle")}
            </p>
          </div>

          {isLoadingCategories ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
                {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>

              <Tabs defaultValue={categories[0]?.id?.toString()} className="w-full dark:bg-gray-800" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-neutral-900 dark:text-white">{t("freelancers.title")}</CardTitle>
                    <CardDescription className="text-neutral-600 dark:text-gray-400">{t("freelancers.topByCategory")}</CardDescription>
                    <TabsList className="mt-2">
                      {categories.slice(0, 5).map((category) => (
                        <TabsTrigger key={category.id} value={category.id.toString()}>
                          {category.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </CardHeader>
                  <CardContent>
                    {categories.slice(0, 5).map((category) => (
                      <TabsContent key={category.id} value={category.id.toString()}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                          {freelancers
                            .filter((f) => f.role === 'freelancer')
                            .slice(0, 3)
                            .map((freelancer) => (
                              <FreelancerCard key={freelancer.id} freelancer={freelancer} />
                            ))}
                        </div>
                      </TabsContent>
                    ))}
                  </CardContent>
                </Card>
              </Tabs>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
