import React from "react";
import { useTranslation } from "react-i18next";
import { Edit, Handshake, CheckCircle, User, Briefcase, Folder, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const HowItWorksSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const providerStepsArray = t('common.journeyProviderSteps', { returnObjects: true }) as string[];
  const clientStepsArray = t('common.journeyClientSteps', { returnObjects: true }) as string[];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900 animate-fade-in" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto px-4">
        {/* Provider Journey Stepper */}
        <h3 className="text-lg md:text-xl font-bold text-primary mb-8 flex items-center gap-2 justify-center">
          <User className="inline-block w-6 h-6 md:w-7 md:h-7 text-primary" />
          {t('common.journeyProviderTitle')}
        </h3>
        <div className="relative flex flex-wrap items-center justify-center w-full gap-y-8 py-4">
          {providerStepsArray.map((exp, idx) => (
            <React.Fragment key={idx}>
              <motion.div
                className="relative z-10 flex flex-col items-center basis-1/4 sm:min-w-[100px] md:min-w-[160px] min-h-[100px] sm:min-h-[120px] md:min-h-[180px] group px-1 sm:px-2"
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Step Circle */}
                <motion.div
                  className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-20 md:h-20 rounded-full border-4 ${
                    idx === 0
                      ? 'border-primary bg-primary/90 dark:bg-primary/80 text-white shadow-lg'
                      : 'border-primary/40 bg-white dark:bg-zinc-900 text-primary dark:text-primary shadow'
                  } group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 relative`}
                  whileHover={{ scale: 1.1 }}
                >
                  <span className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-base font-bold bg-white dark:bg-zinc-900 border-2 border-primary/30 shadow-md pointer-events-none select-none rounded-full group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                    {idx + 1}
                  </span>
                  {idx === 0 ? <Edit className="w-6 h-6 md:w-8 md:h-8" /> : idx === 1 ? <Folder className="w-6 h-6 md:w-8 md:h-8" /> : idx === 2 ? <User className="w-6 h-6 md:w-8 md:h-8" /> : idx === 3 ? <Handshake className="w-6 h-6 md:w-8 md:h-8" /> : idx === 4 ? <CheckCircle className="w-6 h-6 md:w-8 md:h-8" /> : <User className="w-6 h-6 md:w-8 md:h-8" />}
                </motion.div>
                {/* Step Label */}
                <span className="mt-2 sm:mt-4 text-[10px] sm:text-xs md:text-sm font-medium text-gray-800 dark:text-gray-100 text-center max-w-[80px] sm:max-w-[120px] md:max-w-[160px]">
                  {exp}
                </span>
              </motion.div>
            </React.Fragment>
          ))}
        </div>
        {/* Client Journey Stepper */}
        <h3 className="text-lg md:text-xl font-bold text-secondary mb-8 flex items-center gap-2 justify-center mt-16">
          <Briefcase className="inline-block w-6 h-6 md:w-7 md:h-7 text-secondary" />
          {t('common.journeyClientTitle')}
        </h3>
        <div className="relative flex flex-wrap items-center justify-center w-full gap-y-8 py-4">
          {clientStepsArray.map((exp, idx) => (
            <React.Fragment key={idx}>
              <motion.div
                className="relative z-10 flex flex-col items-center basis-1/4 sm:min-w-[100px] md:min-w-[160px] min-h-[100px] sm:min-h-[120px] md:min-h-[180px] group px-1 sm:px-2"
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Step Circle */}
                <motion.div
                  className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-20 md:h-20 rounded-full border-4 ${
                    idx === 0
                      ? 'border-secondary bg-secondary/90 dark:bg-secondary/80 text-white shadow-lg'
                      : 'border-secondary/40 bg-white dark:bg-zinc-900 text-secondary dark:text-secondary shadow'
                  } group-hover:border-secondary group-hover:bg-secondary group-hover:text-white transition-colors duration-300 relative`}
                  whileHover={{ scale: 1.1 }}
                >
                  <span className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-base font-bold bg-white dark:bg-zinc-900 border-2 border-secondary/30 shadow-md pointer-events-none select-none rounded-full group-hover:bg-secondary group-hover:text-white transition-colors duration-200">
                    {idx + 1}
                  </span>
                  {idx === 0 ? <MessageSquare className="w-6 h-6 md:w-8 md:h-8" /> : idx === 1 ? <Handshake className="w-6 h-6 md:w-8 md:h-8" /> : idx === 2 ? <Folder className="w-6 h-6 md:w-8 md:h-8" /> : idx === 3 ? <CheckCircle className="w-6 h-6 md:w-8 md:h-8" /> : <Briefcase className="w-6 h-6 md:w-8 md:h-8" />}
                </motion.div>
                {/* Step Label */}
                <span className="mt-2 sm:mt-4 text-[10px] sm:text-xs md:text-sm font-medium text-gray-800 dark:text-gray-100 text-center max-w-[80px] sm:max-w-[120px] md:max-w-[160px]">
                  {exp}
                </span>
              </motion.div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
