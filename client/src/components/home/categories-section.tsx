import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import CategoryCard from "@/components/category-card";
import { useTheme } from "@/components/theme-provider";

export default function CategoriesSection() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  return (
    <section className="py-12 bg-neutral-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-cairo font-bold text-neutral-900 dark:text-white">
            {t("categories.title")}
          </h2>
          <p className="mt-4 text-xl text-neutral-600 dark:text-gray-400">
            {t("categories.subtitle")}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
