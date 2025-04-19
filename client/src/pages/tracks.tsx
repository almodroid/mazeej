import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { cn } from "@/lib/utils";

const plans = [
  {
    key: "wameed",
    color: "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30",
    badge: "bg-blue-500 text-white",
    title: "Wameed",
    price: "Free",
    priceNote: "",
    description: "Every success starts with a spark. This plan is your first step to self-discovery.",
    features: [
      "Create a personal profile that appears in search results",
      "A basic test to help you identify your closest skill",
      "Upload one sample work to your professional portfolio",
      "Access to selected recorded workshops",
      "Smart feedback from the system on your profile",
      "Invitation to a monthly group coaching and inspiration session"
    ],
    bestFor: "Beginners exploring their passion or trying out Mazeej before upgrading.",
    priceValue: 0,
    buttonColor: "bg-blue-500 hover:bg-blue-600 text-white"
  },
  {
    key: "nabd",
    color: "border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-950/30",
    badge: "bg-yellow-500 text-white",
    title: "Nabd",
    price: "49 SAR",
    priceNote: "/ month",
    description: "When you start feeling your skill's pulse, this plan helps you build a clear identity.",
    features: [
      "Everything in \"Wameed\"",
      "Access to all live training workshops",
      "One private monthly consultation with a field expert",
      "Upload up to 5 works to your profile",
      "Smart analysis of your skills and interests to suggest growth paths",
      "Active Member badge on your profile",
      "Priority in getting your content featured on the platform"
    ],
    bestFor: "Users already on their journey who need expert direction and skill refinement.",
    priceValue: 49,
    buttonColor: "bg-yellow-500 hover:bg-yellow-600 text-white"
  },
  {
    key: "athar",
    color: "border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-950/30",
    badge: "bg-orange-500 text-white",
    title: "Athar",
    price: "129 SAR",
    priceNote: "/ month",
    description: "You're not just discovering anymore — you're creating real impact. This plan opens doors to the market.",
    features: [
      "Everything in \"Nabd\"",
      "Two expert consultations per month with different specialists",
      "Professional review and feedback on your work",
      "Enhanced profile visibility and higher ranking",
      "Real project participation with Mazeej teams",
      "Monthly performance reports showing your progress and portfolio growth",
      "Help with pricing and writing your service offers"
    ],
    bestFor: "Users ready to enter the market confidently and serve real clients.",
    priceValue: 129,
    buttonColor: "bg-orange-500 hover:bg-orange-600 text-white"
  },
  {
    key: "tawajoh",
    color: "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/30",
    badge: "bg-red-600 text-white",
    title: "Tawajoh",
    price: "249 SAR",
    priceNote: "/ month",
    description: "For those whose names are already recognized and want to expand their impact and leave a mark.",
    features: [
      "Everything in \"Athar\"",
      "Unlimited consultations (based on scheduling availability)",
      "Special promotion of your work via official Mazeej social accounts",
      "Personalized project and partnership recommendations based on your profile",
      "Monthly personal brand strategy development session",
      "Advanced dashboard for performance and audience analytics",
      "Featured in promotional campaigns as a \"Mazeej Impact Maker\"",
      "Distinguished Creator badge and internal profile verification"
    ],
    bestFor: "Professionals looking to expand their influence and build stronger partnerships.",
    priceValue: 249,
    buttonColor: "bg-red-600 hover:bg-red-700 text-white"
  }
];

export default function TracksPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div className={cn("min-h-screen flex flex-col bg-background", isRTL ? "rtl" : "ltr")}>  
      <Navbar />
      <main className="flex-grow py-10 px-2 sm:px-0">
        <div className="max-w-5xl mx-auto animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-cairo font-bold mb-4 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {isRTL ? "اختر مسارك وابدأ رحلتك" : "Choose Your Track and Start Your Journey"}
          </h1>
          <p className="text-lg text-muted-foreground mb-10 text-center max-w-2xl mx-auto">
            {isRTL
              ? "انطلق في أولى خطواتك نحو النمو الشخصي والمهني. اختر الخطة التي تناسب مرحلتك الحالية وابدأ رحلتك مع مزِيج."
              : "Take your first step towards personal and professional growth. Choose the plan that fits your current stage and start your journey with Mazeej."}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={cn(
                  "rounded-3xl border-2 shadow-lg p-8 flex flex-col justify-between relative overflow-hidden transition-transform hover:scale-[1.02]",
                  plan.color
                )}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <span className={cn("absolute top-6 px-3 py-1 rounded-full text-xs font-bold",isRTL ? "left-6" : "right-6", plan.badge)}>
                  {isRTL
                    ? plan.key === "wameed"
                      ? "وميض"
                      : plan.key === "nabd"
                      ? "نبض"
                      : plan.key === "athar"
                      ? "أثر"
                      : "توجّه"
                    : plan.title}
                </span>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold mb-2 text-foreground">
                    {isRTL
                      ? plan.key === "wameed"
                        ? "وميض – مجاني"
                        : plan.key === "nabd"
                        ? "نبض – ٤٩ ريال/شهر"
                        : plan.key === "athar"
                        ? "أثر – ١٢٩ ريال/شهر"
                        : "توجّه – ٢٤٩ ريال/شهر"
                      : `${plan.title} ${plan.priceValue > 0 ? `– ${plan.price}${plan.priceNote}` : "– Free"}`}
                  </h2>
                  <p className="text-muted-foreground mb-3">
                    {isRTL
                      ? plan.key === "wameed"
                        ? "كل نجاح يبدأ بشرارة. هذه الخطة هي خطوتك الأولى لاكتشاف ذاتك."
                        : plan.key === "nabd"
                        ? "عندما تبدأ بالشعور بنبض مهارتك، تساعدك هذه الخطة على بناء هوية واضحة."
                        : plan.key === "athar"
                        ? "لم تعد تكتشف فقط — بل تصنع أثراً حقيقياً. هذه الخطة تفتح لك أبواب السوق."
                        : "لمن أصبح اسمه معروفاً ويريد توسيع أثره وترك بصمة."
                      : plan.description}
                  </p>
                  <ul className="mb-3 space-y-2 text-sm">
                    {(isRTL
                      ? plan.key === "wameed"
                        ? [
                            "إنشاء ملف شخصي يظهر في نتائج البحث",
                            "اختبار أساسي يساعدك على تحديد أقرب مهارة لديك",
                            "رفع عمل واحد فقط في معرض أعمالك",
                            "الوصول إلى ورش عمل مسجلة مختارة",
                            "تغذية راجعة ذكية من النظام على ملفك",
                            "دعوة لجلسة إلهام وتوجيه جماعي شهرية"
                          ]
                        : plan.key === "nabd"
                        ? [
                            "كل ما في \"وميض\"",
                            "الوصول إلى جميع ورش العمل التدريبية المباشرة",
                            "استشارة خاصة شهرية مع خبير في المجال",
                            "رفع حتى 5 أعمال في ملفك الشخصي",
                            "تحليل ذكي لمهاراتك واهتماماتك واقتراح مسارات نمو",
                            "شارة \"عضو نشط\" في ملفك الشخصي",
                            "أولوية في إبراز محتواك على المنصة"
                          ]
                        : plan.key === "athar"
                        ? [
                            "كل ما في \"نبض\"",
                            "استشارتان شهرياً مع خبراء مختلفين",
                            "مراجعة احترافية وتغذية راجعة على أعمالك",
                            "ظهور ملفك بشكل أوضح وترتيب أعلى",
                            "المشاركة في مشاريع حقيقية مع فرق مزِيج",
                            "تقارير أداء شهرية توضح تقدمك ونمو معرض أعمالك",
                            "مساعدة في تسعير وكتابة عروض خدماتك"
                          ]
                        : [
                            "كل ما في \"أثر\"",
                            "استشارات غير محدودة (حسب توفر المواعيد)",
                            "ترويج خاص لأعمالك عبر حسابات مزِيج الرسمية",
                            "توصيات مشاريع وشراكات مخصصة بناءً على ملفك",
                            "جلسة شهرية لتطوير استراتيجية علامتك الشخصية",
                            "لوحة تحكم متقدمة لتحليل الأداء والجمهور",
                            "الظهور في حملات ترويجية كـ \"صانع أثر مزِيج\"",
                            "شارة \"مبدع مميز\" وتوثيق داخلي للملف الشخصي"
                          ]
                      : plan.features).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 text-primary">•</span>
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                  </ul>
                  <div className="mb-2 text-xs text-accent-foreground">
                    <strong>{isRTL ? "الأفضل لـ:" : "Best for:"}</strong> {isRTL
                      ? (plan.key === "wameed"
                        ? "المبتدئين المستكشفين لشغفهم أو من يجرب مزِيج لأول مرة."
                        : plan.key === "nabd"
                        ? "من بدأ رحلته ويحتاج لتوجيه خبير وصقل مهاراته."
                        : plan.key === "athar"
                        ? "من يستعد لدخول السوق بثقة وخدمة عملاء حقيقيين."
                        : "المحترفين الراغبين في توسيع تأثيرهم وبناء شراكات أقوى.")
                      : plan.bestFor}
                  </div>
                </div>
                <div className="mt-auto">
                  <Button className={cn("w-full rounded-full font-bold text-lg py-2 mt-2 transition-all", plan.buttonColor)}>
                    {isRTL ? "اشترك الآن" : "Subscribe Now"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}