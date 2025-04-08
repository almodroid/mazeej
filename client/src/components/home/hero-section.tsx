import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <div className="bg-primary-dark text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 text-center md:text-right">
          <h1 className="text-4xl md:text-5xl font-cairo font-bold mb-4">
            {t("hero.title")}
          </h1>
          <p className="text-lg mb-8">{t("hero.subtitle")}</p>
          <div className="flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent-dark"
              asChild
            >
              <Link href="/auth?register=true">
                <a>{t("hero.clientButton")}</a>
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              asChild
            >
              <Link href="/auth?register=true">
                <a>{t("hero.freelancerButton")}</a>
              </Link>
            </Button>
          </div>
        </div>
        <div className="md:w-1/2 mt-10 md:mt-0">
          <img
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
            className="rounded-lg shadow-xl w-full"
            alt={t("hero.title")}
          />
        </div>
      </div>
    </div>
  );
}
