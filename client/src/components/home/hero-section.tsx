import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Search, Briefcase, Star, Users, Globe, ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function HeroSection() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="bg-gradient-to-b from-background to-muted dark:from-background dark:to-background/80 relative overflow-hidden">
    <div className="relative w-full flex items-center justify-center">
      {/* Left image stack */}
      <div className="hidden lg:flex flex-row gap-2 absolute left-0 top-1/2 -translate-y-1/2 z-10">
        <div className="flex flex-col gap-4">
          <a href="#" className="group">
            <img src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80" alt="Freelancer working" className="rounded-xl shadow-lg w-24 h-24 object-cover bg-white  animate-float-card group-hover:scale-105 transition-transform duration-300 cursor-pointer" />
          </a>
          <a href="#" className="group mt-6">
            <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80" alt="Microphone podcast" className="rounded-xl shadow-lg w-20 h-20 object-cover bg-white  animate-float-card-delay group-hover:scale-110 transition-transform duration-300 cursor-pointer" />
          </a>
          <a href="#" className="group -mb-4">
            <img src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80" alt="Design sketches" className="rounded-xl shadow-lg w-28 h-28 object-cover bg-white  animate-float-card group-hover:scale-105 transition-transform duration-300 cursor-pointer" />
          </a>
        </div>
        {/* Column 2: 2 images */}
        <div className="flex flex-col gap-4 mt-12">
          <a href="#" className="group">
            <img src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80" alt="Laptop workspace" className="rounded-xl shadow-lg w-24 h-28 object-cover bg-white  animate-float-card-delay group-hover:scale-110 transition-transform duration-300 cursor-pointer" />
          </a>
          <a href="#" className="group mt-8">
            <img src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80" alt="Laptop workspace" className="rounded-xl shadow-lg w-24 h-28 object-cover bg-white  animate-float-card-delay group-hover:scale-110 transition-transform duration-300 cursor-pointer" />
          </a>
        </div>
      </div>
      <div className="w-full flex flex-col items-center justify-center py-20 px-4 text-center">
        <h1 className="text-3xl md:text-3xl lg:text-3xl font-extrabold font-cairo mb-4 text-primary">
          {t('hero.title')}
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary dark:text-gray-200">
          {t('hero.description')}
        </h2>
        <p className="text-lg md:text-xl text-primary max-w-2xl mb-10">
          {t('hero.subtitle')}
        </p>
        <div className="w-full max-w-2xl mx-auto mb-4">
          <div className="flex items-center shadow-2xl rounded-md border border-input bg-white/80 dark:bg-card/90 overflow-hidden">
            <input
              type="text"
              placeholder={t('hero.searchPlaceholder')}
              className="py-3 px-4 flex-1 bg-transparent border-0 focus:outline-none text-primary placeholder:text-primary text-right"
            />
            <button className="py-2 px-8 mx-1 flex-shrink-0 bg-primary text-white rounded-md hover:bg-secondary hover:text-white transition-colors text-md shadow-lg">
              {t('hero.searchButton')}
            </button>
          </div>  
        </div>
        {/* Popular searches row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto m-4">
          <button className="flex-1 py-3 px-6 rounded-md bg-primary text-white hover:bg-secondary hover:shadow-lg hover:transition-shadow transition-colors text-md shadow-lg"
          >
            {t("hero.clientButton")}
          </button>
          
          <button className="flex-1 py-3 px-3 rounded-md border-2 bg-secondary text-white  hover:border-primary hover:bg-primary hover:text-white hover:shadow-lg hover:transition-shadow transition-colors text-md shadow-lg"
          >
            {t("hero.freelancerButton")}
          </button>
        
        </div>
      </div>
      {/* Right image stack */}
      <div className="hidden lg:flex flex-row gap-2 absolute right-0 top-1/2 -translate-y-1/2 z-10">
        <div className="flex flex-col gap-4">
          <a href="#" className="group mt-2">
            <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80" alt="Camera content" className="rounded-xl shadow-lg w-24 h-28 object-cover bg-white  animate-float-card-delay group-hover:scale-110 transition-transform duration-300 cursor-pointer" />
          </a>
          <a href="#" className="group">
      <img src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80" alt="Laptop workspace" className="rounded-xl shadow-lg w-20 h-20 object-cover bg-white  animate-float-card group-hover:scale-105 transition-transform duration-300 cursor-pointer" />
    </a>
    <a href="#" className="group mt-8">
      <img src="https://images.unsplash.com/photo-1465101178521-c1a9136a3b41?auto=format&fit=crop&w=400&q=80" alt="Writing notes" className="rounded-xl shadow-lg w-24 h-24 object-cover bg-white  animate-float-card-delay group-hover:scale-110 transition-transform duration-300 cursor-pointer" />
    </a>
  </div>
  <div className="flex flex-col gap-4 mt-16">
    <a href="#" className="group">
      <img src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80" alt="Design sketches" className="rounded-xl shadow-lg w-28 h-20 object-cover bg-white  animate-float-card group-hover:scale-105 transition-transform duration-300 cursor-pointer" />
    </a>
    <a href="#" className="group mt-10">
      <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80" alt="Microphone podcast" className="rounded-xl shadow-lg w-24 h-28 object-cover bg-white  animate-float-card-delay group-hover:scale-110 transition-transform duration-300 cursor-pointer" />
        </a>
      </div>
    </div>
    </div>
  </div>
  );
}
