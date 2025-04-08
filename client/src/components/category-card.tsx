import { useTranslation } from "react-i18next";
import { Category } from "@shared/schema";
import { Link } from "wouter";

// Mapping of database icon names to actual font awesome class names
const iconMapping: Record<string, string> = {
  'laptop-code': 'fas fa-laptop-code',
  'paint-brush': 'fas fa-paint-brush',
  'bullhorn': 'fas fa-bullhorn',
  'pen': 'fas fa-pen',
  'video': 'fas fa-video',
  'chart-line': 'fas fa-chart-line'
};

type CategoryCardProps = {
  category: Category;
};

export default function CategoryCard({ category }: CategoryCardProps) {
  const { t } = useTranslation();

  return (
    <Link href={`/categories/${category.id}`}>
      <a className="flex flex-col items-center bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 hover:bg-primary/5">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <i className={`${iconMapping[category.icon] || 'fas fa-circle'} text-2xl`}></i>
        </div>
        <h3 className="text-lg font-cairo font-medium text-neutral-900 mb-1 text-center">{category.name}</h3>
        <p className="text-neutral-500 text-sm text-center">
          +{category.freelancerCount} {t('categories.freelancers')}
        </p>
      </a>
    </Link>
  );
}
