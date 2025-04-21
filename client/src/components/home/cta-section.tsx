import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTheme } from "@/components/theme-provider";

export default function CtaSection() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <section className="py-12 bg-primary dark:bg-primary/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-cairo font-bold text-white mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-xl text-white/80 mb-8">
            {t("cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white hover:bg-neutral-100 text-primary dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
              asChild
            >
              <Link href="/auth?register=true&role=client">
                <a>{t("cta.clientButton")}</a>
              </Link>
            </Button>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent-dark text-white"
              asChild
            >
              <Link href="/auth?register=true&role=freelancer">
                <a>{t("cta.freelancerButton")}</a>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
