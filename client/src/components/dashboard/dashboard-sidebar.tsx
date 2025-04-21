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
          "flex items-center py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
          active
            ? "bg-primary/10 text-primary shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          "my-2" ,
          collapsed ? "px-1" : "px-4"
        )}
      >
        <span className={cn(
          "flex items-center justify-center",
          isRTL ? (collapsed ? "mx-auto" : "ml-0 mr-3") : (collapsed ? "mx-auto" : "mr-3 ml-0"),
        )}>
          {icon}
        </span>
        {!collapsed && <span className="flex-1 truncate">{label}</span>}
      </div>
    </Link>
  );
};

export default function DashboardSidebar() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    // Load collapse state from localStorage or default to false
    const savedState = localStorage.getItem("sidebarCollapsed");
    return savedState ? JSON.parse(savedState) : false;
  });

  const isRTL = i18n.language === "ar";
  const chevronIcon = isRTL ? (collapsed ? <ChevronLeft /> : <ChevronRight />) : (collapsed ? <ChevronRight /> : <ChevronLeft />);

  // Save collapse state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

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
        "border-border bg-card text-card-foreground shadow-sm",
        collapsed ? "w-16" : "w-50"
      )}
    >
      <div className={cn(" flex items-center ", collapsed ? "justify-center" : "justify-end")}>
        <Button
          variant="ghost"
          size="sm"
          className={cn("hover:bg-muted transition-all duration-200 m-2")}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          
        >
          {chevronIcon}
          
        </Button>
      </div>
      <div className={cn(
        "flex-1 py-0 px-3 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
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
        "px-3 border-t border-border",
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
