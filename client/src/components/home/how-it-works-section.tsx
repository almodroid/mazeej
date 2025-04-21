import { useTranslation } from "react-i18next";
import { 
  Edit, 
  Handshake, 
  CheckCircle
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function HowItWorksSection() {
  const { t } = useTranslation();
  const { theme } = useTheme();

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
    <section className="py-12 bg-white dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-cairo font-bold text-neutral-900 dark:text-white">
            {t("howItWorks.title")}
          </h2>
          <p className="mt-4 text-xl text-neutral-600 dark:text-gray-400">
            {t("howItWorks.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-neutral-50 dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                {step.icon}
              </div>
              <h3 className="text-xl font-cairo font-semibold mb-2 dark:text-white">
                {step.title}
              </h3>
              <p className="text-neutral-600 dark:text-gray-300">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
