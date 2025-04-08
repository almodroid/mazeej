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
      <a
        className={cn(
          "flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors",
          active
            ? "bg-primary text-white"
            : "text-neutral-700 hover:bg-neutral-100 hover:text-primary",
          isRTL && "flex-row-reverse"
        )}
      >
        <span className={isRTL ? "ml-2" : "mr-2"}>{icon}</span>
        {!collapsed && <span>{label}</span>}
      </a>
    </Link>
  );
};

interface DashboardSidebarProps {
  className?: string;
}

export default function DashboardSidebar({ className }: DashboardSidebarProps) {
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

  // Role-specific links
  const roleLinks = user?.role === "client"
    ? [
        {
          href: "/projects/my-projects",
          icon: <Briefcase size={18} />,
          label: t("common.myProjects"),
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
          icon: <CreditCard size={18} />,
          label: t("common.payments"),
        },
      ]
    : [
        {
          href: "/proposals",
          icon: <FileText size={18} />,
          label: t("common.proposals"),
        },
        {
          href: "/projects",
          icon: <Briefcase size={18} />,
          label: t("common.findProjects"),
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
      ];

  const allLinks = [...commonLinks, ...roleLinks];

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [isRTL]);
  
  return (
    <aside
      className={cn(
        "bg-white h-full transition-all duration-300 flex flex-col",
        isRTL ? "border-r" : "border-l", 
        "border-neutral-200",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className={cn("p-4 flex items-center justify-between", isRTL && "flex-row-reverse")}>
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
      <div className="flex-1 py-6 px-3 space-y-1">
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
      <div className="p-4 border-t border-neutral-200">
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
