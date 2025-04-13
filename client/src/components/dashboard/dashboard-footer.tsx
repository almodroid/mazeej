import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function DashboardFooter() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const currentYear = new Date().getFullYear();

  // Essential links for dashboard footer
  const footerLinks = [
    { key: 'help', href: '/help', label: t('common.help') },
    { key: 'terms', href: '/terms', label: t('footer.termsOfUse') },
    { key: 'privacy', href: '/privacy', label: t('footer.privacyPolicy') },
    { key: 'contact', href: '/contact', label: t('footer.contactUs') },
  ];

  return (
    <footer className="border-t border-border mt-auto px-2 bg-background">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className={cn(
          "flex flex-col sm:flex-row justify-between items-center gap-2",
          isRTL && "sm:flex-row-reverse"
        )}>
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} {t("common.appName")}
          </p>
          
          <nav aria-label="Footer Navigation">
            <ul className={cn(
              "flex flex-wrap items-center gap-x-4 gap-y-1 text-sm",
              isRTL && "flex-row-reverse"
            )}>
              {footerLinks.map((link) => (
                <li key={link.key}>
                  <Link 
                    href={link.href} 
                    className="text-muted-foreground hover:text-primary transition-colors"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
} 