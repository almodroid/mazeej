import React from "react";
import { useTranslation } from "react-i18next";

const HowItWorksSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const steps = [
    {
      icon: (
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 transform hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="currentColor" className="fill-gray-200 dark:fill-gray-700" />
          <rect x="7" y="9" width="10" height="7" rx="2" fill="#a3a3a3" className="dark:fill-gray-500" />
          <rect x="7" y="6" width="10" height="2" rx="1" fill="#a3a3a3" className="dark:fill-gray-500" />
          <rect x="9" y="12" width="2" height="2" rx="1" fill="#fff" />
          <rect x="13" y="12" width="2" height="2" rx="1" fill="#fff" />
        </svg>
      ),
      title: t('howItWorks.step1Title'),
      subtitle: "",
    },
    {
      icon: (
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 transform hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="currentColor" className="fill-gray-200 dark:fill-gray-700" />
          <rect x="6" y="8" width="12" height="8" rx="2" fill="#a3a3a3" className="dark:fill-gray-500" />
          <path d="M6 8l6 5 6-5" stroke="#fff" strokeWidth="1.5" />
        </svg>
      ),
      title: t('howItWorks.step2Title'),
      subtitle: "",
    },
    {
      icon: (
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 transform hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="currentColor" className="fill-gray-200 dark:fill-gray-700" />
          <circle cx="12" cy="11" r="3" fill="#a3a3a3" className="dark:fill-gray-500" />
          <ellipse cx="12" cy="17" rx="5" ry="2" fill="#a3a3a3" className="dark:fill-gray-500" />
        </svg>
      ),
      title: t('howItWorks.step3Title'),
      subtitle: "",
    },
    {
      icon: (
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 transform hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="currentColor" className="fill-gray-200 dark:fill-gray-700" />
          <path d="M8 12l3 3 5-5" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-gray-500" />
        </svg>
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
