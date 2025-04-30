import { useTranslation } from "react-i18next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import HeroSection from "@/components/home/hero-section";
import AboutSection from "@/components/home/about";
import ProjectsSection from "@/components/home/projects-section";
import CategoriesSection from "@/components/home/categories-section";
import TestimonialsSection from "@/components/home/testimonials-section";
import CtaSection from "@/components/home/cta-section";
import { useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import HowItWorksSection from "@/components/home/how-it-works-section";

export default function HomePage() {
  const { i18n } = useTranslation();
  const { theme } = useTheme();

  // Ensure the document has the correct RTL direction and theme
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  return (
    <div className="min-h-screen flex flex-col dark:bg-background">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <AboutSection />
        <HowItWorksSection />
        <ProjectsSection />
        <CategoriesSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
