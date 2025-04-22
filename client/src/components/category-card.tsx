import { useTranslation } from "react-i18next";
import { Category } from "@shared/schema";
import { Link } from "wouter";
import { Code, Paintbrush, Speaker, Pen, Video, ChartLine } from "lucide-react";

// Mapping of category icon names to lucide-react icon components
const iconMapping: Record<string, React.ElementType> = {
  'laptop-code': Code,
  'paint-brush': Paintbrush,
  'bullhorn': Speaker,
  'pen': Pen,
  'video': Video,
  'chart-line': ChartLine
};

type CategoryCardProps = {
  category: Category;
};

export default function CategoryCard({ category }: CategoryCardProps) {
  const { t } = useTranslation();

  return (
    <Link href={`/categories/${category.id}`}>
      <a className="flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 hover:bg-primary/5 dark:hover:bg-primary/10">
        <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4">
          {(() => {
            const Icon = iconMapping[category.icon];
            return Icon ? <Icon size={24} /> : null;
          })()}
        </div>
        <h3 className="text-lg font-cairo font-medium text-neutral-900 dark:text-white mb-1 text-center">{category.name}</h3>
        <p className="text-neutral-500 dark:text-gray-400 text-sm text-center">
          +{category.freelancerCount} {t('categories.freelancers')}
        </p>
      </a>
    </Link>
  );
}
