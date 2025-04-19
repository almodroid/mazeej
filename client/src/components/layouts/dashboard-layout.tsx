import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import DashboardFooter from "@/components/dashboard/dashboard-footer";
import FreelancerOnboardingWizard from "@/components/onboarding/freelancer-onboarding-wizard";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Determine if RTL
  const isRTL = i18n.language === 'ar';
  
  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [isRTL, i18n.language]);

  if (!user) return null;

  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-background text-foreground",
      isRTL && "rtl"
    )}>
      <DashboardHeader onMobileMenuOpen={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <div className="flex-grow flex">
        <DashboardSidebar />
        <main className={cn(
          "flex-grow p-6 overflow-x-hidden flex flex-col bg-background",
          isRTL && "rtl"
        )}>
          <div className="max-w-7xl mx-auto w-full flex-grow">
            {children}
          </div>
          <DashboardFooter />
        </main>
      </div>
      
      {/* Show onboarding wizard for freelancers */}
      {user.role === 'freelancer' && <FreelancerOnboardingWizard />}
    </div>
  );
} 