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
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -right-40 -top-40 w-80 h-80 rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl"></div>
        <div className="absolute left-0 top-1/2 w-full h-1/2 bg-gradient-to-t from-primary/5 dark:from-primary/10 to-transparent"></div>
        <div className="absolute left-1/3 top-1/3 w-48 h-48 rounded-full bg-accent/10 dark:bg-accent/5 blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* Hero content */}
          <div className={`text-center ${isRTL ? 'lg:text-right' : 'lg:text-left'} animate-fade-in`}>
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary text-sm font-medium mb-6">
              <span className="animate-pulse mr-2">●</span> 
              {t("hero.badge")}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-cairo font-bold mb-6 leading-tight tracking-tight bg-gradient-to-r from-foreground to-foreground/60 dark:from-foreground dark:to-foreground/80 bg-clip-text">
              {t("hero.title")}
            </h1>
            <p className="text-xl text-muted-foreground dark:text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              {t("hero.subtitle")}
            </p>
            
            <div className="relative mb-10 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center shadow-lg rounded-full border border-input bg-card dark:bg-card/90 overflow-hidden">
                <Search className={`h-5 w-5 text-muted-foreground ${isRTL ? 'ml-4' : 'ml-4'}`} />
                <input 
                  type="text" 
                  placeholder={t("hero.searchPlaceholder")}
                  className={`py-3 px-4 flex-1 bg-transparent border-0 focus:outline-none text-foreground placeholder:text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`} 
                />
                <Button className="m-1 rounded-full">
                  {t("hero.searchButton")}
                </Button>
              </div>
              <div className={`flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground justify-center lg:justify-start ${isRTL ? 'lg:justify-end' : ''}`}>
                <span>{t("hero.popularSearches")}:</span>
                <a href="#" className="hover:text-primary hover:underline transition-colors">UI/UX {t("hero.design")}</a>
                <a href="#" className="hover:text-primary hover:underline transition-colors">{t("hero.webDevelopment")}</a>
                <a href="#" className="hover:text-primary hover:underline transition-colors">{t("hero.contentCreation")}</a>
              </div>
            </div>
            
            <div className={`flex flex-col sm:flex-row justify-center lg:justify-start ${isRTL ? 'lg:justify-start' : ''} gap-4`}>
            <Button 
              size="lg" 
              className="hover-lift rounded-full group gap-2 px-6" 
              asChild
            >
              <Link href="/auth?register=true&role=client">
                {t("hero.clientButton")}
                {isRTL ? (
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                ) : (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                )}
              </Link>
            </Button>
              <Button
                size="lg"
                variant="outline"
                className="hover-lift rounded-full gap-2 px-6"
                asChild
              >
                <Link href="/auth?register=true&role=freelancer">
                  <a>{t("hero.freelancerButton")}</a>
                </Link>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <p className="text-2xl md:text-3xl font-cairo font-bold text-primary">120K+</p>
                <p className="text-sm text-muted-foreground">{t("hero.freelancers")}</p>
              </div>
              <div className="text-center p-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <p className="text-2xl md:text-3xl font-cairo font-bold text-accent">10K+</p>
                <p className="text-sm text-muted-foreground">{t("hero.clients")}</p>
              </div>
              <div className="text-center p-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <p className="text-2xl md:text-3xl font-cairo font-bold text-primary">98%</p>
                <p className="text-sm text-muted-foreground">{t("hero.satisfaction")}</p>
              </div>
              <div className="text-center p-3 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <p className="text-2xl md:text-3xl font-cairo font-bold text-accent">50+</p>
                <p className="text-sm text-muted-foreground">{t("hero.categories")}</p>
              </div>
            </div>
          </div>
          
          {/* Hero image section */}
          <div className="hidden lg:flex justify-center items-center relative animate-fade-in">
            <div className="absolute -inset-10 bg-gradient-to-r from-primary/20 to-accent/20 dark:from-primary/10 dark:to-accent/10 rounded-full blur-3xl opacity-30"></div>
            <div className="relative bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl dark:shadow-lg rotate-1 hover:rotate-0 transition-transform duration-500 max-w-lg">
              <img
                src="https://h.top4top.io/p_339165u5j1.jpg"
                className="rounded-lg w-full"
                alt={t("hero.title")}
              />
              
              {/* Floating cards */}
              <div className="absolute -bottom-8 -left-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-3 w-48 border border-border dark:border-gray-700 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground dark:text-gray-400">{t("hero.projects")}</p>
                    <p className="text-sm font-bold">25,400+</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-10 -right-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-3 w-52 border border-border dark:border-gray-700 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-accent/20 dark:bg-accent/30 flex items-center justify-center">
                    <Star className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} fill="currentColor" className="h-3 w-3 text-accent" />
                      ))}
                    </div>
                    <p className="text-sm font-medium">{t("hero.topRated")}</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-1/3 -right-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-3 w-44 border border-border dark:border-gray-700 animate-slide-up" style={{ animationDelay: '0.7s' }}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground dark:text-gray-400">{t("hero.worldwide")}</p>
                    <p className="text-sm font-bold">{t("hero.global")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trusted by companies */}
      <div className="border-t border-border dark:border-gray-800 w-full py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground mb-6">{t("hero.trustedBy")}</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-70">
            {/* Replace with actual company logos */}
            <div className="h-8 w-24 bg-muted dark:bg-gray-700 rounded-md"></div>
            <div className="h-8 w-24 bg-muted dark:bg-gray-700 rounded-md"></div>
            <div className="h-8 w-24 bg-muted dark:bg-gray-700 rounded-md"></div>
            <div className="h-8 w-24 bg-muted dark:bg-gray-700 rounded-md"></div>
            <div className="h-8 w-24 bg-muted dark:bg-gray-700 rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
