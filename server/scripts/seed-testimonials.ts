import { db } from '../db';
import { testimonials } from '@shared/schema';

async function seedTestimonials() {
  try {
    console.log('Seeding testimonials...');

    const sampleTestimonials = [
      {
        content: "I found a professional designer on the platform who delivered our visual identity design wonderfully, exceeding our expectations. The speed of response and professionalism in dealing made the experience excellent.",
        contentAr: "وجدت على المنصة مصمماً احترافياً أنجز تصميم هويتنا البصرية بشكل رائع تجاوز توقعاتنا. سرعة الاستجابة والاحترافية في التعامل جعلت التجربة ممتازة.",
        authorName: "Layla Al-Ahmad",
        authorNameAr: "ليلى الأحمد",
        authorTitle: "CEO - Green Technology Company",
        authorTitleAr: "المديرة التنفيذية - شركة التقنية الخضراء",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        rating: 5,
        order: 0,
        isActive: true,
      },
      {
        content: "As a freelancer, the platform provided me with the opportunity to reach distinguished clients and diverse projects. The ease of communication and secure payment system make dealing comfortable for both parties.",
        contentAr: "كمستقل، وفرت لي المنصة فرصة الوصول لعملاء مميزين ومشاريع متنوعة. سهولة التواصل ونظام الدفع الآمن يجعلان التعامل مريحاً للطرفين.",
        authorName: "Omar Al-Harthi",
        authorNameAr: "عمر الحارثي",
        authorTitle: "App Developer - Freelancer",
        authorTitleAr: "مطور تطبيقات - مستقل",
        authorAvatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        rating: 4,
        order: 1,
        isActive: true,
      },
      {
        content: "We implemented several projects through the platform, and the results were amazing every time. The freelancers are professional and the platform provides all the tools for effective communication and smooth project management.",
        contentAr: "نفذنا عدة مشاريع عبر المنصة، وكانت النتائج مبهرة في كل مرة. المستقلون محترفون والمنصة توفر كل الأدوات للتواصل الفعال وإدارة المشاريع بسلاسة.",
        authorName: "Mohammed Al-Salem",
        authorNameAr: "محمد السالم",
        authorTitle: "Marketing Manager - Elite Group",
        authorTitleAr: "مدير التسويق - مجموعة النخبة",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        rating: 5,
        order: 2,
        isActive: true,
      },
      {
        content: "The platform helped me find talented content creators who delivered high-quality work. The project management tools and secure payment system make everything smooth and professional.",
        contentAr: "ساعدتني المنصة في العثور على صناع محتوى موهوبين قدموا عملاً عالي الجودة. أدوات إدارة المشاريع ونظام الدفع الآمن يجعلان كل شيء سلساً واحترافياً.",
        authorName: "Sarah Al-Rashid",
        authorNameAr: "سارة الرشيد",
        authorTitle: "Content Director - Digital Media",
        authorTitleAr: "مديرة المحتوى - الإعلام الرقمي",
        authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        rating: 5,
        order: 3,
        isActive: true,
      },
      {
        content: "Working as a freelancer on this platform has been a game-changer for my career. The quality of clients and the support system are exceptional.",
        contentAr: "العمل كمستقل على هذه المنصة كان نقطة تحول في مسيرتي المهنية. جودة العملاء ونظام الدعم استثنائيان.",
        authorName: "Ahmed Al-Zahrani",
        authorNameAr: "أحمد الزهراني",
        authorTitle: "UI/UX Designer - Freelancer",
        authorTitleAr: "مصمم واجهات المستخدم - مستقل",
        authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        rating: 4,
        order: 4,
        isActive: true,
      },
      {
        content: "The platform's verification system and quality control ensure that we work with reliable professionals. Highly recommended for any business looking for quality services.",
        contentAr: "نظام التحقق من المنصة ومراقبة الجودة يضمنان أننا نعمل مع محترفين موثوقين. موصى به بشدة لأي شركة تبحث عن خدمات عالية الجودة.",
        authorName: "Fatima Al-Qahtani",
        authorNameAr: "فاطمة القحطاني",
        authorTitle: "Operations Manager - Tech Solutions",
        authorTitleAr: "مديرة العمليات - حلول التقنية",
        authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        rating: 5,
        order: 5,
        isActive: true,
      }
    ];

    // Insert sample testimonials
    for (const testimonial of sampleTestimonials) {
      await db.insert(testimonials).values({
        ...testimonial,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log('Testimonials seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding testimonials:', error);
    process.exit(1);
  }
}

seedTestimonials(); 