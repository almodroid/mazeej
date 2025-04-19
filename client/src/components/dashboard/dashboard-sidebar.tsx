import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Briefcase,
  Star,
  Users,
  CreditCard,
  User,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BanknoteIcon,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  isRTL: boolean;
}

const SidebarLink = ({ href, icon, label, active, collapsed, isRTL }: SidebarLinkProps) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer",
          active
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <span className={cn(
          "flex items-center justify-center",
          isRTL ? "mr-2" : "ml-2"
        )}>
          {icon}
        </span>
        {!collapsed && <span className="flex-1">{label}</span>}
      </div>
    </Link>
  );
};

export default function DashboardSidebar() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isRTL = i18n.language === "ar";
  const chevronIcon = isRTL ? (collapsed ? <ChevronLeft /> : <ChevronRight />) : (collapsed ? <ChevronRight /> : <ChevronLeft />);

  // Common links for all users
  const commonLinks = [
    {
      href: "/dashboard",
      icon: <LayoutDashboard size={18} />,
      label: t("common.dashboard"),
    },
    {
      href: "/messages",
      icon: <MessageSquare size={18} />,
      label: t("common.messages"),
    },
    {
      href: "/profile",
      icon: <User size={18} />,
      label: t("common.profile"),
    },
    {
      href: "/settings",
      icon: <Settings size={18} />,
      label: t("common.settings"),
    },
  ];

  // Freelancer-specific links
  const freelancerLinks = [
    {
      href: "/my-proposals",
      icon: <FileText size={18} />,
      label: t("common.myProposals"),
    },
    {
      href: "/projects",
      icon: <Briefcase size={18} />,
      label: t("common.findProjects"),
    },
  ];

  // Add consultations link for experts
  if (user?.role === "freelancer" && user?.freelancerType === "expert") {
    freelancerLinks.push({
      href: "/consultations",
      icon: <Video size={18} />,
      label: t("common.consultations"),
    });
  }
  
  // Add consultations link for beginner freelancers too
  if (user?.role === "freelancer" && user?.freelancerLevel === "beginner") {
    freelancerLinks.push({
      href: "/my-consultations",
      icon: <Video size={18} />,
      label: t("common.myConsultations"),
    });
  }

  // Add remaining freelancer links
  const remainingFreelancerLinks = [
    {
      href: "/portfolio",
      icon: <Briefcase size={18} />,
      label: t("common.portfolio"),
    },
    {
      href: "/verification",
      icon: <ShieldCheck size={18} />,
      label: t("common.verification"),
    },
    {
      href: "/reviews/received",
      icon: <Star size={18} />,
      label: t("common.reviewsReceived"),
    },
    {
      href: "/earnings",
      icon: <CreditCard size={18} />,
      label: t("common.earnings"),
    },
    {
      href: "/payments",
      icon: <BanknoteIcon size={18} />,
      label: t("payments.title"),
    },
  ];

  // Role-specific links
  const roleLinks = user?.role === "client"
    ? [
        {
          href: "/my-projects",
          icon: <Briefcase size={18} />,
          label: t("common.myProjects"),
        },
        {
          href: "/projects/create",
          icon: <FileText size={18} />,
          label: t("common.postProject"),
        },
        {
          href: "/browse-freelancers",
          icon: <Users size={18} />,
          label: t("common.browseFreelancers"),
        },
        {
          href: "/reviews/given",
          icon: <Star size={18} />,
          label: t("common.reviewsGiven"),
        },
        {
          href: "/payments",
          icon: <BanknoteIcon size={18} />,
          label: t("payments.title"),
        },
      ]
    : [...freelancerLinks, ...remainingFreelancerLinks];

  const allLinks = [...commonLinks, ...roleLinks];

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [isRTL]);
  
  return (
    <aside
      className={cn(
        "h-full transition-all duration-300 flex flex-col",
        isRTL ? "border-l" : "border-r", 
        "border-border bg-card text-card-foreground",
        collapsed ? "w-16" : "w-64"
      )}

    >
      <div className={cn("p-4 flex items-center justify-between")}>
        {!collapsed && (
          <h2 className="text-xl font-cairo font-bold text-primary">
            {t("common.appName")}
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={isRTL ? "mr-auto" : "ml-auto"}
          onClick={() => setCollapsed(!collapsed)}
        >
          {chevronIcon}
        </Button>
      </div>
      <div className={cn(
        "flex-1 py-6 px-3 space-y-1",
       
      )}>
        {allLinks.map((link) => (
          <SidebarLink
            key={link.href}
            href={link.href}
            icon={link.icon}
            label={link.label}
            active={location === link.href}
            collapsed={collapsed}
            isRTL={isRTL}
          />
        ))}
      </div>
      <div className={cn(
        "p-4 border-t border-border",
        
      )}>
        <SidebarLink
          href="/help"
          icon={<HelpCircle size={18} />}
          label={t("common.help")}
          active={location === "/help"}
          collapsed={collapsed}
          isRTL={isRTL}
        />
      </div>
    </aside>
  );
}
