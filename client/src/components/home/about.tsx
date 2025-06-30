import { useTranslation } from "react-i18next";
import { 
  Edit, 
  Handshake, 
  CheckCircle,
  Phone,
  MessageSquare,
  Brain,
  Group,
  User,
  Briefcase,
  Folder,
  FileIcon,
  MessageCircle,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function AboutSection() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isRTL = i18n.language === 'ar';

  const steps = [
    {
      icon: <Edit className="h-8 w-8" />,
      title: t("howItWorks.step1Title"),
      description: t("howItWorks.step1Description"),
    },
    {
      icon: <Handshake className="h-8 w-8" />,
      title: t("howItWorks.step2Title"),
      description: t("howItWorks.step2Description"),
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: t("howItWorks.step3Title"),
      description: t("howItWorks.step3Description"),
    },
  ];

  const providerSteps = t('common.journeyProviderSteps', { returnObjects: true });
  const providerStepsArray = Array.isArray(providerSteps) ? providerSteps : [];
  const clientSteps = t('common.journeyClientSteps', { returnObjects: true });
  const clientStepsArray = Array.isArray(clientSteps) ? clientSteps : [];

  return (
    <section className="py-8 md:py-12 bg-white dark:bg-background px-4 md:px-0 animate-fade-in" dir={isRTL ? "rtl" : "ltr"}>
      {/* Chunk 1: About Section */}
      <h2 className="text-2xl md:text-3xl font-bold text-primary text-center dark:text-primary mb-8 md:mb-12 animate-fade-in-up">{t('about.aboutUs')}</h2>
      <div className="container mx-auto flex flex-col lg:flex-row items-center gap-8 md:gap-12 mb-12 md:mb-16">
        {/* About Content */}
        <div className="flex-1 w-full">
          <p className="text-xl md:text-2xl mb-4 md:mb-2 dark:text-gray-100 max-w-xl pb-4 md:pb-8 text-center md:text-left md:rtl:text-right px-4 md:px-0 animate-fade-in-up" style={{ lineHeight: "2.5" }}>
            <span className="animate-fade-in-up-delayed-2">{t('about.subtitle')}</span>
          </p>
          {/* Stats */}
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-16 md:gap-16 mt-4 px-4 md:px-0">
            <div className="flex flex-col items-center animate-fade-in-up-delayed">
              <span className="text-primary dark:text-primary text-2xl md:text-2xl font-bold animate-count-up">+500</span>
              <span className="text-gray-600 text-xs md:text-sm dark:text-gray-300 animate-fade-in-up-delayed-2">{t('hero.freelancers')}</span>
            </div>
            <div className="flex flex-col items-center animate-fade-in-up-delayed-2">
              <span className="text-primary dark:text-primary text-2xl md:text-2xl font-bold animate-count-up">+150</span>
              <span className="text-gray-600 text-xs md:text-sm dark:text-gray-300 animate-fade-in-up-delayed-3">{t('hero.clients')}</span>
            </div>
            <div className="flex flex-col items-center animate-fade-in-up-delayed-3">
              <span className="text-primary dark:text-primary text-2xl md:text-2xl font-bold animate-count-up">+20</span>
              <span className="text-gray-600 text-xs md:text-sm dark:text-gray-300 animate-fade-in-up-delayed-4">{t('hero.categories')}</span>
            </div>
            <div className="flex flex-col items-center animate-fade-in-up-delayed-4">
              <span className="text-primary dark:text-primary text-2xl md:text-2xl font-bold animate-count-up">90%</span>
              <span className="text-gray-600 text-xs md:text-sm dark:text-gray-300 animate-fade-in-up-delayed-5">{t('hero.satisfaction')}</span>
            </div>
          </div>
        </div>
        {/* Visuals (Image + UI Mockup Placeholder) */}
        <div className="flex-shrink-0 flex flex-row items-center gap-4 w-full md:w-auto px-4 md:px-0 animate-fade-in">
          <div className="card bg-white dark:bg-zinc-800 rounded-xl shadow-2xl relative md:top-10 rtl:md:right-12 md:left-12 w-1/2 md:w-40 p-2 dark:shadow-gray-700/50 hover:scale-105 transition-transform duration-300">
            <div className="absolute top-[-10px] rtl:right-[-12px] left-[-12px] flex gap-2 z-10">
              <Phone className="bg-white p-1 rounded-md shadow fill-teal-400 w-7 h-7 md:w-10 md:h-10 px-1 md:px-2 dark:bg-gray-700 text-teal-400 hover:scale-110 transition-transform  animate-bounce-slow"/>
              <MessageCircle className="bg-white p-1 rounded-md shadow fill-purple-400 w-7 h-7 md:w-10 md:h-10 px-1 md:px-2 dark:bg-gray-700 text-purple-400 hover:scale-110 transition-transform  animate-bounce-slow-delayed"/>
            </div>
            <div className="relative aspect-square w-full group">
              <img src="/saudiFreelancer.jpg" alt="مستقل سعودي" className="h-full w-full object-cover border-2 rounded-lg shadow-xl bg-zinc-100 dark:bg-zinc-800 dark:shadow-gray-700/50 group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="text-center mt-1 md:mt-2 p-1 md:p-4">
              <div className="font-bold dark:text-gray-100 text-xs md:text-base animate-fade-in-up">{t('common.mohammed')}</div>
              <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 animate-fade-in-up-delayed">{t('common.graphicDesinger')}</div>
            </div>
          </div>
          <div className="rounded-2xl h-[200px] md:h-[300px] shadow-2xl shadow-gray-400/50 bg-gray-50 dark:bg-zinc-800 dark:shadow-gray-400/50 dark:shadow-gray-700/50 p-3 md:p-6 w-1/2 md:w-56 mb-2 text-center items-center hover:scale-105 transition-transform duration-300">
            <Folder className="mb-1 md:mb-2 text-center items-center mx-auto fill-primary dark:fill-primary w-8 h-8 md:w-10 md:h-10 animate-bounce-slow"/>
            <div className="font-bold text-gray-700 dark:text-gray-200 mb-2 md:mb-6 text-xs md:text-base animate-fade-in-up">{t('about.loading')}</div>
            <ul className="space-y-2 md:space-y-6 text-[10px] md:text-xs">
              <li className="flex justify-between items-end animate-slide-in-right">
                <div className="flex items-center w-full">
                <FileIcon className="mr-1 md:mr-2 border rounded-sm border-primary/20 px-1 md:px-2 w-6 h-6 md:w-10 md:h-10 hover:scale-110 transition-transform duration-300" />
                <div className="flex flex-col w-full max-w-[60px] md:max-w-[100px] items-start">
                  <div className="mb-1 md:mb-2">{t('about.design')}.psd</div>
                  <div className="w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="w-full rounded-full bg-primary dark:bg-primary animate-progress" style={{ width: "50%", height: "3px" }} />
                  </div>
                </div>
                </div>
                <div className="text-right text-[10px] md:text-xs">50%</div>
              </li>
              <li className="flex justify-between items-end animate-slide-in-right-delayed">
                <div className="flex items-center w-full">
                <FileIcon className="mr-1 md:mr-2 border rounded-sm border-primary/20 px-1 md:px-2 w-6 h-6 md:w-10 md:h-10 hover:scale-110 transition-transform duration-300" />
                <div className="flex flex-col w-full max-w-[60px] md:max-w-[100px] items-start">
                  <div className="mb-1 md:mb-2">{t('about.visual')}.docx</div>
                  <div className="w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="w-full rounded-full bg-primary dark:bg-primary animate-progress-delayed" style={{ width: "32%", height: "3px" }} />
                  </div>
                </div>
                </div>
                <div className="text-right text-[10px] md:text-xs">32%</div>
              </li>
              <li className="flex justify-between items-end animate-slide-in-right-delayed-2">
                <div className="flex items-center w-full">
                <FileIcon className="mr-1 md:mr-2 border rounded-sm border-primary/20 px-1 md:px-2 w-6 h-6 md:w-10 md:h-10 hover:scale-110 transition-transform duration-300" />
                <div className="flex flex-col w-full max-w-[60px] md:max-w-[100px] items-start">
                  <div className="text-start mb-1 md:mb-2">{t('about.logo')}.docx</div>
                  <div className="w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="w-full rounded-full bg-primary dark:bg-primary animate-progress-delayed-2" style={{ width: "100%", height: "3px" }} />
                  </div>
                </div>
                </div>
                <div className="text-right text-[10px] md:text-xs">100%</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="container mx-auto py-8 md:py-16 px-4 md:px-0">
        <h1 className=" text-primary font-extrabold text-2xl mb-3">{t('about.why')}</h1>
        <p className="mb-3">لأننا نعرف السوق، ونفهمك، ونشتغل معك على نفس الموجة</p>
        <ul className="list-disc ps-6 md:ps-8">
          {(t('about.whyBullets', { returnObjects: true }) as string[]).map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
      {/* Journey Section - Animated Experience Bubbles as Grid with Numbers */}
      <div className="container mx-auto py-8 md:py-16 px-4 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Provider Experience Bubbles as Grid */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg md:text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <User className="inline-block w-6 h-6 md:w-7 md:h-7 text-primary" />
              {t('common.journeyProviderTitle')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-md">
              {providerStepsArray.map((exp, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center animate-bubble-float${idx % 3} group transition-transform duration-300`}
                >
                  <div className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/20 shadow-lg border-2 border-primary text-primary text-2xl md:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {/* Number */}
                    <span className="absolute top-1 left-1 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-base font-bold shadow-md border-2 border-white">{idx + 1}</span>
                    {/* Icon */}
                    {idx === 0 ? <Edit className="w-8 h-8" /> : idx === 1 ? <Folder className="w-8 h-8" /> : idx === 2 ? <User className="w-8 h-8" /> : idx === 3 ? <Handshake className="w-8 h-8" /> : idx === 4 ? <CheckCircle className="w-8 h-8" /> : <User className="w-8 h-8" />}
                  </div>
                  <span className="text-center text-xs md:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white/80 dark:bg-zinc-900/80 rounded-lg px-3 py-2 shadow-md max-w-[140px] md:max-w-[180px]">
                    {exp}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Client Experience Bubbles as Grid */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg md:text-xl font-bold text-secondary mb-6 flex items-center gap-2">
              <Briefcase className="inline-block w-6 h-6 md:w-7 md:h-7 text-secondary" />
              {t('common.journeyClientTitle')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-md">
              {clientStepsArray.map((exp, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center animate-bubble-float${(idx + 2) % 3} group transition-transform duration-300`}
                >
                  <div className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-secondary/20 shadow-lg border-2 border-secondary text-secondary text-2xl md:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {/* Number */}
                    <span className="absolute top-1 left-1 bg-secondary text-white rounded-full w-6 h-6 flex items-center justify-center text-base font-bold shadow-md border-2 border-white">{idx + 1}</span>
                    {/* Icon */}
                    {idx === 0 ? <MessageSquare className="w-8 h-8" /> : idx === 1 ? <Handshake className="w-8 h-8" /> : idx === 2 ? <Folder className="w-8 h-8" /> : idx === 3 ? <CheckCircle className="w-8 h-8" /> : <Briefcase className="w-8 h-8" />}
                  </div>
                  <span className="text-center text-xs md:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white/80 dark:bg-zinc-900/80 rounded-lg px-3 py-2 shadow-md max-w-[140px] md:max-w-[180px]">
                    {exp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Chunk 2: Features Section */}
      <div className="container mx-auto py-8 md:py-16 px-4 md:px-0">
        <h3 className="text-xl md:text-2xl font-extrabold text-primary dark:text-primary mb-8 md:mb-16 text-center animate-fade-in-up">{t('about.title')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Feature 1 */}
          <div className="bg-gray-50 rounded-xl p-6 md:p-8 flex flex-col items-center text-center shadow dark:bg-gray-800 dark:text-gray-100 hover:scale-105 transition-transform duration-300 animate-fade-in-up">
            <Brain className="mb-3 text-primary dark:text-primary w-8 h-8 md:w-10 md:h-10 animate-bounce-slow"/>
            <div className="font-bold mb-2 dark:text-gray-100 text-sm md:text-base animate-fade-in-up-delayed">{t('about.feature1.title')}</div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 animate-fade-in-up-delayed-2">{t('about.feature1.description')}</div>
          </div>
          {/* Feature 2 */}
          <div className="bg-gray-50 rounded-xl p-6 md:p-8 flex flex-col items-center text-center shadow dark:bg-gray-800 dark:text-gray-100 hover:scale-105 transition-transform duration-300 animate-fade-in-up-delayed">
            <Group className="mb-3 text-primary dark:text-primary w-8 h-8 md:w-10 md:h-10 animate-bounce-slow-delayed"/>
            <div className="font-bold mb-2 dark:text-gray-100 text-sm md:text-base animate-fade-in-up-delayed-2">{t('about.feature2.title')}</div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 animate-fade-in-up-delayed-3">{t('about.feature2.description')}</div>
          </div>
          {/* Feature 3 */}
          <div className="bg-gray-50 rounded-xl p-6 md:p-8 flex flex-col items-center text-center shadow dark:bg-gray-800 dark:text-gray-100 hover:scale-105 transition-transform duration-300 animate-fade-in-up-delayed-2">
            <User className="mb-3 text-primary dark:text-primary w-8 h-8 md:w-10 md:h-10 animate-bounce-slow-delayed-2"/>
            <div className="font-bold mb-2 dark:text-gray-100 text-sm md:text-base animate-fade-in-up-delayed-3">{t('about.feature3.title')}</div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 animate-fade-in-up-delayed-4">{t('about.feature3.description')}</div>
          </div>
          {/* Feature 4 */}
          <div className="bg-gray-50 rounded-xl p-6 md:p-8 flex flex-col items-center text-center shadow dark:bg-gray-800 dark:text-gray-100 hover:scale-105 transition-transform duration-300 animate-fade-in-up-delayed-3">
            <Briefcase className="mb-3 text-primary dark:text-primary w-8 h-8 md:w-10 md:h-10 animate-bounce-slow-delayed-3"/>
            <div className="font-bold mb-2 dark:text-gray-100 text-sm md:text-base animate-fade-in-up-delayed-4">{t('about.feature4.title')}</div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 animate-fade-in-up-delayed-5">{t('about.feature4.description')}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
