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

  return (
    <section className="py-12 bg-white dark:bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* Chunk 1: About Section */}
      <h2 className="text-3xl font-bold text-primary text-center dark:text-primary mb-12">{t('about.aboutUs')}</h2>
      <div className="container mx-auto flex flex-col lg:flex-row items-center gap-12 mb-16">
        {/* About Content */}
        <div className="flex-1">
          <p className="text-2xl mb-2 dark:text-gray-100 max-w-xl pb-8" style={{ lineHeight: "3" }}><span className="text-primary dark:text-primary font-bold">{t('common.appName')}</span>{t('about.subtitle')}</p>
          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-4">
            <div className="flex flex-col items-center">
              <span className="text-primary dark:text-primary text-xl font-bold">+500</span>
              <span className="text-gray-600 text-sm dark:text-gray-300">{t('hero.freelancers')}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-primary dark:text-primary text-xl font-bold">+150</span>
              <span className="text-gray-600 text-sm dark:text-gray-300">{t('hero.clients')}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-primary dark:text-primary text-xl font-bold">+20</span>
              <span className="text-gray-600 text-sm dark:text-gray-300">{t('hero.categories')}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-primary dark:text-primary text-xl font-bold ">90%</span>
              <span className="text-gray-600 text-sm dark:text-gray-300">{t('hero.satisfaction')}</span>
            </div>
          </div>
        </div>
        {/* Visuals (Image + UI Mockup Placeholder) */}
        <div className="flex-shrink-0 flex flex-row-reverse items-center gap-4">
          <div className="rounded-2xl h-[300px] shadow-2xl shadow-gray-400/50 bg-gray-50 dark:bg-zinc-800 dark:shadow-gray-400/50 dark:shadow-gray-700/50 p-6 w-56 mb-2 text-center items-center">
            <Folder className="mb-2 text-center items-center mx-auto fill-primary dark:fill-primary"/>
            <div className="font-bold text-gray-700 dark:text-gray-200 mb-6">{t('about.loading')}</div>
            <ul className="space-y-6 text-xs ">
              <li className="flex justify-between items-end">
                <div className="flex items-center w-full">
                <FileIcon className="mr-2 border rounded-sm  border-primary/20 px-2 w-8 h-8" />
                <div className="flex flex-col w-full max-w-[100px] items-start">
                  <div className="mb-2">{t('about.design')}.psd</div>
                  <div className="w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="w-full rounded-full bg-primary dark:bg-primary" style={{ width: "50%", height: "5px" }} />
                  </div>
                </div>
                </div>
                <div className="text-right">50%</div>
              </li>
              <li className="flex justify-between items-end">
                <div className="flex items-center w-full">
                <FileIcon className="mr-2 border rounded-sm  border-primary/20 px-2 w-8 h-8" />
                <div className="flex flex-col w-full max-w-[100px] items-start">
                  <div className="mb-2">{t('about.visual')}.docx</div>
                  <div className="w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="w-full rounded-full bg-primary dark:bg-primary" style={{ width: "32%", height: "5px" }} />
                  </div>
                </div>
                </div>
                <div className="text-right">32%</div>
              </li>
              <li className="flex justify-between items-end">
                <div className="flex items-center w-full">
                <FileIcon className="mr-2 border rounded-sm  border-primary/20 px-2 w-8 h-8" />
                <div className="flex flex-col w-full max-w-[100px] items-start">
                  <div className="text-start mb-2">{t('about.logo')}.docx</div>
                  <div className="w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="w-full rounded-full bg-primary dark:bg-primary" style={{ width: "100%", height: "5px" }} />
                  </div>
                </div>
                </div>
                <div className="text-right">100%</div>
              </li>
            </ul>
          </div>
          <div className="card bg-white dark:bg-zinc-800 rounded-xl shadow-2xl relative top-10 rtl:right-12 left-12 w-40 p-2 dark:shadow-gray-700/50 dark:shadow-gray-700/50">
            <div className="absolute top-[-10px] rtl:right-[-12px] left-[-12px] flex gap-2 z-10">
              <Phone className="bg-white p-1 rounded-md shadow fill-teal-400 w-8 h-8 px-2 dark:bg-gray-700 text-teal-400"/>
              <MessageCircle className="bg-white p-1 rounded-md shadow fill-purple-400 w-8 h-8 px-2 dark:bg-gray-700 text-purple-400"/>
            </div>
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=256&q=80&facepad=2" alt="مستقل سعودي" className="h-[150px] w-full object-cover border-2 rounded-lg shadow-xl bg-zinc-100 dark:bg-zinc-800 dark:shadow-gray-700/50" />
            </div>
            <div className="text-center mt-2 p-4">
              <div className="font-bold dark:text-gray-100">{t('common.mohammed')}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('common.graphicDesinger')}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Chunk 2: Features Section */}
      <div className="container mx-auto py-16">
        <h3 className="text-2xl font-extrabold text-primary dark:text-primary mb-16 text-center">{t('about.title')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-gray-50 rounded-xl p-8 flex flex-col items-center text-center shadow dark:bg-gray-800 dark:text-gray-100">
            <Brain className="mb-3 text-primary dark:text-primary w-10 h-10"/>
            <div className="font-bold mb-2 dark:text-gray-100">{t('about.feature1.title')}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{t('about.feature1.description')}</div>
          </div>
          {/* Feature 2 */}
          <div className="bg-gray-50 rounded-xl p-8 flex flex-col items-center text-center shadow dark:bg-gray-800 dark:text-gray-100">
            <Group className="mb-3 text-primary dark:text-primary w-10 h-10"/>
            <div className="font-bold mb-2 dark:text-gray-100">{t('about.feature2.title')}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{t('about.feature2.description')}</div>
          </div>
          {/* Feature 3 */}
          <div className="bg-gray-50 rounded-xl p-8 flex flex-col items-center text-center shadow dark:bg-gray-800 dark:text-gray-100">
            <User className="mb-3 text-primary dark:text-primary w-10 h-10 "/>
            <div className="font-bold mb-2 dark:text-gray-100">{t('about.feature3.title')}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{t('about.feature3.description')}</div>
          </div>
          {/* Feature 4 */}
          <div className="bg-gray-50 rounded-xl p-8 flex flex-col items-center text-center shadow dark:bg-gray-800 dark:text-gray-100">
            <Briefcase className="mb-3 text-primary dark:text-primary w-10 h-10"/>
            <div className="font-bold mb-2 dark:text-gray-100">{t('about.feature4.title')}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{t('about.feature4.description')}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
