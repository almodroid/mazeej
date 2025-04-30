import React from "react";

const steps = [
  {
    icon: (
      // Calendar icon
      <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="12" fill="currentColor" className="fill-gray-200 dark:fill-gray-700" />
  <rect x="7" y="9" width="10" height="7" rx="2" fill="#a3a3a3" className="dark:fill-gray-500" />
  <rect x="7" y="6" width="10" height="2" rx="1" fill="#a3a3a3" className="dark:fill-gray-500" />
  <rect x="9" y="12" width="2" height="2" rx="1" fill="#fff" />
  <rect x="13" y="12" width="2" height="2" rx="1" fill="#fff" />
</svg>
    ),
    title: "اختر مجالك",
    subtitle: "",
  },
  {
    icon: (
      // Envelope icon
      <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="12" fill="currentColor" className="fill-gray-200 dark:fill-gray-700" />
  <rect x="6" y="8" width="12" height="8" rx="2" fill="#a3a3a3" className="dark:fill-gray-500" />
  <path d="M6 8l6 5 6-5" stroke="#fff" strokeWidth="1.5" />
</svg>
    ),
    title: "أنشئ مشروعك أو ملفك",
    subtitle: "",
  },
  {
    icon: (
      // Users icon
      <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="12" fill="currentColor" className="fill-gray-200 dark:fill-gray-700" />
  <circle cx="12" cy="11" r="3" fill="#a3a3a3" className="dark:fill-gray-500" />
  <ellipse cx="12" cy="17" rx="5" ry="2" fill="#a3a3a3" className="dark:fill-gray-500" />
</svg>
    ),
    title: "تواصل وابدأ التعاون",
    subtitle: "",
  },
  {
    icon: (
      // Checkmark icon
      <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="12" fill="currentColor" className="fill-gray-200 dark:fill-gray-700" />
  <path d="M8 12l3 3 5-5" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-gray-500" />
</svg>
    ),
    title: "استلم العمل وشارك النجاح",
    subtitle: "",
  },
];

const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-center text-2xl md:text-3xl font-bold text-primary dark:text-primary mb-20">كيف تعمل منصة مزيج</h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 z-10">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center flex-1 relative">
              <div className="mb-4">{step.icon}</div>
              <div className="text-center">
                <div className="text-primary dark:text-primary font-extrabold text-lg mb-2">{step.title}</div>
                {step.subtitle && (
                  <div className="text-primary dark:text-primary text-sm">{step.subtitle}</div>
                )}
              </div>
              {idx < steps.length - 1 && (
                <span className="hidden md:block absolute top-8 right-40 w-full max-w-[175px] h-0.5 border-dashed border-t-2 border-primary" style={{left: '100%'}} ></span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
