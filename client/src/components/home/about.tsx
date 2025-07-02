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
import { motion } from "framer-motion";
import React from "react";

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
    <section className="py-8 md:py-12 bg-white dark:bg-background px-12" dir={isRTL ? "rtl" : "ltr"}>
      {/* Animated About Heading */}
      <motion.h2
        className="text-2xl md:text-3xl font-bold text-primary text-center dark:text-primary mb-8 md:mb-12"
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        {t('about.aboutUs')}
      </motion.h2>
      {/* About + Stats + Visuals Row */}
      <motion.div
        className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 mb-12 md:mb-16"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        {/* About Content */}
        <div className="w-full md:w-1/2 mx-auto">
          <motion.p
            className="text-xl md:text-2xl mb-4 md:mb-2 dark:text-gray-100 max-w-xl pb-4 md:pb-8 text-center md:text-left md:rtl:text-right px-4 md:px-0"
            style={{ lineHeight: "2.5" }}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <span>{t('about.subtitle')}</span>
          </motion.p>
          {/* Interactive Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 mt-4 px-4 md:px-0">
            {[
              { value: 500, label: t('hero.freelancers') },
              { value: 150, label: t('hero.clients') },
              { value: 20, label: t('hero.categories') },
              { value: '90%', label: t('hero.satisfaction') },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className="flex flex-col items-center bg-primary/5 dark:bg-primary/10 rounded-xl p-4 shadow hover:scale-105 transition-transform cursor-pointer"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
              >
                <motion.span
                  className="text-primary dark:text-primary text-2xl md:text-2xl font-bold"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: idx * 0.2 }}
                >
                  {stat.value === 500 && <span>+500</span>}
                  {stat.value === 150 && <span>+150</span>}
                  {stat.value === 20 && <span>+20</span>}
                  {stat.value === '90%' && <span>90%</span>}
                </motion.span>
                <span className="text-gray-600 text-xs md:text-sm dark:text-gray-300 mt-1">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
        {/* Visuals (Image + UI Mockup Placeholder) */}
        <motion.div
          className="w-full md:w-1/2 flex flex-row justify-center items-center gap-4 px-4 md:px-0"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          {/* Freelancer Card */}
          <motion.div
            className="card bg-white dark:bg-zinc-800 rounded-xl shadow-2xl relative md:top-10 rtl:md:right-12 md:left-12 w-1/2 md:w-40 p-2 dark:shadow-gray-700/50 hover:scale-105 transition-transform"
            whileHover={{ scale: 1.05, rotate: -2 }}
          >
            <div className="absolute top-[-10px] rtl:right-[-12px] left-[-12px] flex gap-2 z-10">
              <Phone className="bg-white p-1 rounded-md shadow fill-teal-400 w-7 h-7 md:w-10 md:h-10 px-1 md:px-2 dark:bg-gray-700 text-teal-400 animate-bounce-slow"/>
              <MessageCircle className="bg-white p-1 rounded-md shadow fill-purple-400 w-7 h-7 md:w-10 md:h-10 px-1 md:px-2 dark:bg-gray-700 text-purple-400 animate-bounce-slow-delayed"/>
            </div>
            <div className="relative aspect-square w-full group">
              <img src="/saudiFreelancer.jpg" alt="مستقل سعودي" className="h-full w-full object-cover border-2 rounded-lg shadow-xl bg-zinc-100 dark:bg-zinc-800 dark:shadow-gray-700/50 group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="text-center mt-1 md:mt-2 p-1 md:p-4">
              <div className="font-bold dark:text-gray-100 text-xs md:text-base">{t('common.mohammed')}</div>
              <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">{t('common.graphicDesinger')}</div>
            </div>
          </motion.div>
          {/* Mockup Card */}
          <motion.div
            className="rounded-2xl h-[200px] md:h-[300px] shadow-2xl shadow-gray-400/50 bg-gray-50 dark:bg-zinc-800 dark:shadow-gray-400/50 dark:shadow-gray-700/50 p-3 md:p-6 w-1/2 md:w-56 mb-2 text-center items-center hover:scale-105 transition-transform"
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            <Folder className="mb-1 md:mb-2 text-center items-center mx-auto fill-primary dark:fill-primary w-8 h-8 md:w-10 md:h-10 animate-bounce-slow"/>
            <div className="font-bold text-gray-700 dark:text-gray-200 mb-2 md:mb-6 text-xs md:text-base">{t('about.loading')}</div>
            <ul className="space-y-2 md:space-y-6 text-[10px] md:text-xs">
              {/* Animated file progress bars */}
              {[{name: t('about.design'), percent: 50}, {name: t('about.visual'), percent: 32}, {name: t('about.logo'), percent: 100}].map((file, idx) => (
                <motion.li
                  key={file.name}
                  className="flex justify-between items-end"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                >
                <div className="flex items-center w-full">
                <FileIcon className="mr-1 md:mr-2 border rounded-sm border-primary/20 px-1 md:px-2 w-6 h-6 md:w-10 md:h-10 hover:scale-110 transition-transform duration-300" />
                <div className="flex flex-col w-full max-w-[60px] md:max-w-[100px] items-start">
                      <div className="mb-1 md:mb-2">{file.name}.psd</div>
                  <div className="w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <motion.div
                          className="w-full rounded-full bg-primary dark:bg-primary"
                          style={{ width: `${file.percent}%`, height: "3px" }}
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: 1 }}
                          transition={{ duration: 1, delay: 0.7 + idx * 0.2 }}
                        />
                </div>
                </div>
                  </div>
                  <div className="text-right text-[10px] md:text-xs">{file.percent}%</div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </motion.div>
      {/* Why Us Card - Animated */}
      <motion.div
        className="container mx-auto py-8 md:py-16 px-4 md:px-0 flex justify-center"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        <motion.div
          className="w-full max-w-2xl bg-gradient-to-br from-primary/5 to-white dark:from-primary/10 dark:to-zinc-900 rounded-2xl shadow-lg border border-primary/10 dark:border-primary/20 p-6 md:p-10 flex flex-col items-center text-center"
          whileHover={{ scale: 1.02, boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)" }}
        >
          <motion.h1
            className="text-primary font-extrabold text-2xl md:text-3xl mb-4 md:mb-6 drop-shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t('about.why')}
          </motion.h1>
          <motion.p
            className="mb-4 md:mb-6 text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            لأننا نعرف السوق، ونفهمك، ونشتغل معك على نفس الموجة
          </motion.p>
          <motion.ul
            className="list-disc list-inside text-start md:text-center space-y-2 md:space-y-3 text-gray-700 dark:text-gray-200 text-base md:text-lg"
            initial="hidden"
            whileInView="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }}
          >
          {(t('about.whyBullets', { returnObjects: true }) as string[]).map((item, idx) => (
              <motion.li
                key={idx}
                className="pl-2 md:pl-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
              >
                {item}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </motion.div>

      {/* Features Section - Animated */}
      <motion.div
        className="container mx-auto py-8 md:py-16 px-4 md:px-0"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
      >
        <motion.h3
          className="text-xl md:text-2xl font-extrabold text-primary dark:text-primary mb-8 md:mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {t('about.title')}
        </motion.h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Feature Cards */}
          {[
            { icon: <Brain className="mb-3 text-primary dark:text-primary w-8 h-8 md:w-10 md:h-10 animate-bounce-slow" />, title: t('about.feature1.title'), desc: t('about.feature1.description') },
            { icon: <Group className="mb-3 text-primary dark:text-primary w-8 h-8 md:w-10 md:h-10 animate-bounce-slow-delayed" />, title: t('about.feature2.title'), desc: t('about.feature2.description') },
            { icon: <User className="mb-3 text-primary dark:text-primary w-8 h-8 md:w-10 md:h-10 animate-bounce-slow-delayed-2" />, title: t('about.feature3.title'), desc: t('about.feature3.description') },
            { icon: <Briefcase className="mb-3 text-primary dark:text-primary w-8 h-8 md:w-10 md:h-10 animate-bounce-slow-delayed-3" />, title: t('about.feature4.title'), desc: t('about.feature4.description') },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              className="bg-gray-50 rounded-xl p-6 md:p-8 flex flex-col items-center text-center shadow dark:bg-gray-800 dark:text-gray-100 hover:scale-105 transition-transform duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
            >
              {feature.icon}
              <div className="font-bold mb-2 dark:text-gray-100 text-sm md:text-base">{feature.title}</div>
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">{feature.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
