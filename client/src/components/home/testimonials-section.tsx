import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import TestimonialCard, { TestimonialProps } from "@/components/testimonial-card";
import { useTheme } from "@/components/theme-provider";
import { apiRequest } from "@/lib/queryClient";

interface Testimonial {
  id: number;
  content: string;
  contentAr?: string;
  authorName: string;
  authorNameAr?: string;
  authorTitle: string;
  authorTitleAr?: string;
  authorAvatar?: string;
  rating: number;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function TestimonialsSection() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isRTL = i18n.language === 'ar';

  // Fetch testimonials from API
  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  // Transform API data to match TestimonialProps interface
  const transformedTestimonials: TestimonialProps[] = testimonials.map((testimonial) => ({
    content: isRTL && testimonial.contentAr ? testimonial.contentAr : testimonial.content,
    author: {
      name: isRTL && testimonial.authorNameAr ? testimonial.authorNameAr : testimonial.authorName,
      title: isRTL && testimonial.authorTitleAr ? testimonial.authorTitleAr : testimonial.authorTitle,
      avatar: testimonial.authorAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    rating: testimonial.rating,
  }));

  // Fallback testimonials if no data is available
  const fallbackTestimonials: TestimonialProps[] = [
    {
      content: "وجدت على المنصة مصمماً احترافياً أنجز تصميم هويتنا البصرية بشكل رائع تجاوز توقعاتنا. سرعة الاستجابة والاحترافية في التعامل جعلت التجربة ممتازة.",
      author: {
        name: "ليلى الأحمد",
        title: "المديرة التنفيذية - شركة التقنية الخضراء",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
      rating: 5,
    },
    {
      content: "كمستقل، وفرت لي المنصة فرصة الوصول لعملاء مميزين ومشاريع متنوعة. سهولة التواصل ونظام الدفع الآمن يجعلان التعامل مريحاً للطرفين.",
      author: {
        name: "عمر الحارثي",
        title: "مطور تطبيقات - مستقل",
        avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
      rating: 4.5,
    },
    {
      content: "نفذنا عدة مشاريع عبر المنصة، وكانت النتائج مبهرة في كل مرة. المستقلون محترفون والمنصة توفر كل الأدوات للتواصل الفعال وإدارة المشاريع بسلاسة.",
      author: {
        name: "محمد السالم",
        title: "مدير التسويق - مجموعة النخبة",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
      rating: 5,
    },
  ];

  // Use transformed testimonials if available, otherwise use fallback
  const displayTestimonials = transformedTestimonials.length > 0 ? transformedTestimonials : fallbackTestimonials;

  return (
    <section className="py-12 bg-white dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-cairo font-bold text-neutral-900 dark:text-white">
            {t("testimonials.title")}
          </h2>
          <p className="mt-4 text-xl text-neutral-600 dark:text-gray-400">
            {t("testimonials.subtitle")}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-neutral-50 dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
                <div className="flex text-accent mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
                <div className="flex items-center mt-6">
                  <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 mr-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTestimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
