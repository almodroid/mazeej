import { useTranslation } from "react-i18next";
import TestimonialCard, { TestimonialProps } from "@/components/testimonial-card";
import { useTheme } from "@/components/theme-provider";

export default function TestimonialsSection() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Sample testimonials with images from stock photos
  const testimonials: TestimonialProps[] = [
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
