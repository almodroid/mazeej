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
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import LogoPng from "@/assets/images/logo.png";

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
            <img src={LogoPng} alt="Mazeej Logo" className="h-10 w-auto" />
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

          {/* About Platform section */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-cairo font-semibold mb-5 text-foreground dark:text-white">
              {t("footer.aboutPlatform")}
            </h3>
            <ul className="space-y-3">
              {[
                'aboutUs', 'termsOfUse', 'privacyPolicy'
              ].map((item) => (
                <li key={item}>
                  <a 
                    href="#" 
                    className="text-muted-foreground dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200 flex items-center group"
                  >
                    {isRTL? 
                    <ChevronLeft className={`h-3 w-3 order-2 ml-1 mr-1' transition-transform group-hover:translate-x-[-3px]`} />
                    :
                    <ChevronRight className={`h-3 w-3 order-2 ml-1 mr-1 transition-transform group-hover:translate-x-1`} />
                    }
                    <span>{t(`footer.${item}`)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Freelancers section */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-cairo font-semibold mb-5 text-foreground dark:text-white">
              {t("footer.startNow")}
            </h3>
            <ul className="space-y-3">
              {[
                'postProject', 'howToStart',  'earningMethods'
              ].map((item) => (
                <li key={item}>
                  <a 
                    href="#" 
                    className="text-muted-foreground dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200 flex items-center group"
                  >
                    {isRTL? 
                    <ChevronLeft className={`h-3 w-3 order-2 ml-1 mr-1' transition-transform group-hover:translate-x-[-3px]`} />
                    :
                    <ChevronRight className={`h-3 w-3 order-2 ml-1 mr-1 transition-transform group-hover:translate-x-1`} />
                    }
                    <span>{t(`footer.${item}`)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Clients section */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-cairo font-semibold mb-5 text-foreground dark:text-white">
              {t("footer.support")}
            </h3>
            <ul className="space-y-3">
              {[
                'helpCenter', 'faq','contactUs'
              ].map((item) => (
                <li key={item}>
                  <a 
                    href="#" 
                    className="text-muted-foreground dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200 flex items-center group"
                  >
                   {isRTL? 
                    <ChevronLeft className={`h-3 w-3 order-2 ml-1 mr-1' transition-transform group-hover:translate-x-[-3px]`} />
                    :
                    <ChevronRight className={`h-3 w-3 order-2 ml-1 mr-1 transition-transform group-hover:translate-x-1`} />
                    }
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
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/250px-Mastercard_2019_logo.svg.png" alt="MasterCard" className="h-6" />
            </div>
            <div className="p-2 bg-background dark:bg-gray-800 rounded-md border border-border dark:border-gray-700 hover:shadow-sm transition-shadow">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Apple_Pay_logo.svg/120px-Apple_Pay_logo.svg.png" alt="Apple Pay" className="h-6" />
            </div>
            <div className="p-2 bg-background dark:bg-gray-800 rounded-md border border-border dark:border-gray-700 hover:shadow-sm transition-shadow">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Mada_Logo.svg/1200px-Mada_Logo.svg.png" alt="Mada" className="h-6" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
