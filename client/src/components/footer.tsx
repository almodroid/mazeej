import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { 
  FacebookIcon, 
  TwitterIcon, 
  InstagramIcon, 
  LinkedinIcon, 
  MoveUpRight, 
  Mail, 
  MessageCircle, 
  Phone, 
  MapPin,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export default function Footer() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isRTL = i18n.language === 'ar';

  return (
    <footer className="bg-gradient-to-b from-background to-muted dark:from-background dark:to-gray-900 pt-20 pb-12 border-t border-border dark:border-gray-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -bottom-40 w-80 h-80 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl"></div>
        <div className="absolute right-0 bottom-0 w-72 h-72 rounded-full bg-accent/5 dark:bg-accent/10 blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
          {/* Logo and about section */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
                <span className="text-lg font-cairo font-bold text-white">F</span>
              </div>
              <span className="text-xl font-cairo font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ml-2">
                {t("common.appName")}
              </span>
            </div>
            <p className="text-muted-foreground dark:text-gray-400 mb-6 max-w-md">
              {t("footer.about")}
            </p>
            
            <div className="mb-6">
              <h4 className="font-cairo font-semibold mb-3 text-sm dark:text-gray-300">{t("footer.getInTouch")}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground dark:text-gray-400">
                  <Mail className="h-4 w-4 mr-2 text-primary" />
                  <a href="mailto:support@example.com" className="hover:text-primary transition-colors">support@example.com</a>
                </div>
                <div className="flex items-center text-muted-foreground dark:text-gray-400">
                  <Phone className="h-4 w-4 mr-2 text-primary" />
                  <a href="tel:+1234567890" className="hover:text-primary transition-colors">+123 456 7890</a>
                </div>
                <div className="flex items-center text-muted-foreground dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  <span>123 Street, City, Country</span>
                </div>
              </div>
            </div>
            
            <div className={`flex ${isRTL ? 'space-x-0 space-x-reverse space-x-4' : 'space-x-4'}`}>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors duration-200"
                aria-label="Twitter"
              >
                <TwitterIcon className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors duration-200"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors duration-200"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Freelancers section */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-cairo font-semibold mb-5 text-foreground dark:text-white">
              {t("footer.forFreelancers")}
            </h3>
            <ul className="space-y-3">
              {[
                'howToStart', 'browseProjects', 'earningMethods', 
                'ratingsReviews', 'premiumAccounts'
              ].map((item) => (
                <li key={item}>
                  <a 
                    href="#" 
                    className="text-muted-foreground dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200 flex items-center group"
                  >
                    <ChevronRight className={`h-3 w-3 ${isRTL ? 'order-2 ml-1' : 'mr-1'} transition-transform group-hover:translate-x-1`} />
                    <span>{t(`footer.${item}`)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Clients section */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-cairo font-semibold mb-5 text-foreground dark:text-white">
              {t("footer.forClients")}
            </h3>
            <ul className="space-y-3">
              {[
                'postProject', 'findFreelancers', 'projectManagement', 
                'paymentMethods', 'qualityAssurance'
              ].map((item) => (
                <li key={item}>
                  <a 
                    href="#" 
                    className="text-muted-foreground dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200 flex items-center group"
                  >
                    <ChevronRight className={`h-3 w-3 ${isRTL ? 'order-2 ml-1' : 'mr-1'} transition-transform group-hover:translate-x-1`} />
                    <span>{t(`footer.${item}`)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* About Platform section */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-cairo font-semibold mb-5 text-foreground dark:text-white">
              {t("footer.aboutPlatform")}
            </h3>
            <ul className="space-y-3">
              {[
                'aboutUs', 'termsOfUse', 'privacyPolicy', 
                'support', 'contactUs'
              ].map((item) => (
                <li key={item}>
                  <a 
                    href="#" 
                    className="text-muted-foreground dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200 flex items-center group"
                  >
                    <ChevronRight className={`h-3 w-3 ${isRTL ? 'order-2 ml-1' : 'mr-1'} transition-transform group-hover:translate-x-1`} />
                    <span>{t(`footer.${item}`)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter section */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-cairo font-semibold mb-5 text-foreground dark:text-white">
              {t("footer.newsletter")}
            </h3>
            <p className="text-sm text-muted-foreground dark:text-gray-400 mb-4">{t("footer.newsletterDesc")}</p>
            <div className="space-y-3">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder={t("footer.emailPlaceholder")}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <Button className="w-full">
                {t("footer.subscribe")}
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright and payment methods */}
        <div className="border-t border-border dark:border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground dark:text-gray-400 text-sm mb-4 md:mb-0">{t("footer.copyright")}</p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <div className="p-2 bg-background dark:bg-gray-800 rounded-md border border-border dark:border-gray-700 hover:shadow-sm transition-shadow">
              <img src="https://cdn.worldvectorlogo.com/logos/visa-2.svg" alt="Visa" className="h-6" />
            </div>
            <div className="p-2 bg-background dark:bg-gray-800 rounded-md border border-border dark:border-gray-700 hover:shadow-sm transition-shadow">
              <img src="https://cdn.worldvectorlogo.com/logos/mastercard-2.svg" alt="MasterCard" className="h-6" />
            </div>
            <div className="p-2 bg-background dark:bg-gray-800 rounded-md border border-border dark:border-gray-700 hover:shadow-sm transition-shadow">
              <img src="https://is1-ssl.mzstatic.com/image/thumb/Purple122/v4/24/23/b2/2423b2a5-a59c-912f-a5f9-6dec0ab693ef/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/246x0w.webp" alt="Apple Pay" className="h-6" />
            </div>
            <div className="p-2 bg-background dark:bg-gray-800 rounded-md border border-border dark:border-gray-700 hover:shadow-sm transition-shadow">
              <img src="https://www.aramex.com/themes/aramex/images/svg/payment-methods/mada.svg" alt="Mada" className="h-6" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
