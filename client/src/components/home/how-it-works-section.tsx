import { CircleCheck, ListTodo, Mail, NotebookPen, Speech } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

const HowItWorksSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const steps = [
    {
      icon: (
        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <ListTodo className="text-primary"/>
          </svg>
        </div>
      ),
      title: t('howItWorks.step1Title'),
      subtitle: "",
    },
    {
      icon: (
        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <Mail className="text-primary"/>
          </svg>
        </div>
      ),
      title: t('howItWorks.step2Title'),
      subtitle: "",
    },
    {
      icon: (
        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <Speech className="text-primary"/>
          </svg>
        </div>
      ),
      title: t('howItWorks.step3Title'),
      subtitle: "",
    },
    {
      icon: (
        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <CircleCheck className="text-primary" /> 
          </svg>
        </div>
      ),
      title: t('howItWorks.step4Title'),
      subtitle: "",
    },
  ];
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900 animate-fade-in">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-center text-2xl md:text-3xl font-bold text-primary dark:text-primary mb-20 animate-fade-in-up">{t('howItWorks.title')}</h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 z-10">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center flex-1 relative group">
              <div className="mb-4 animate-fade-in-up" style={{ animationDelay: `${idx * 0.2}s` }}>
                {step.icon}
              </div>
              <div className="text-center transform group-hover:scale-105 transition-transform duration-300">
                <div className="text-primary dark:text-primary font-extrabold text-lg mb-2 animate-fade-in-up" style={{ animationDelay: `${idx * 0.2 + 0.1}s` }}>
                  {step.title}
                </div>
                {step.subtitle && (
                  <div className="text-primary dark:text-primary text-sm animate-fade-in-up" style={{ animationDelay: `${idx * 0.2 + 0.2}s` }}>
                    {step.subtitle}
                  </div>
                )}
              </div>
              {idx < steps.length - 1 && (
                <span 
                  className="hidden md:block absolute top-8 rtl:right-40 left-40 w-full max-w-[175px] h-0.5 border-dashed border-t-2 border-primary animate-progress" 
                  style={{
                    left: isRTL ? '100%' : '100%',
                    animationDelay: `${idx * 0.2 + 0.3}s`
                  }}
                ></span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
