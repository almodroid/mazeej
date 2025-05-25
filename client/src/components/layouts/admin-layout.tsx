import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  Layers, 
  Users, 
  Folder, 
  CreditCard, 
  Settings, 
  LogOut, 
  BarChart4,
  Menu,
  X,
  Shield,
  BellRing,
  Moon,
  Sun,
  User as UserIcon,
  Home,
  ChevronDown,
  ListFilter,
  ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTheme } from "@/components/theme-provider";

// Admin navigation items
const adminNavItems = [
  {
    title: "dashboard",
    href: "/admin/dashboard",
    icon: Home
  },
  {
    title: "users",
    href: "/admin/users",
    icon: Users
  },
  {
    title: "verification",
    href: "/admin/verification",
    icon: Shield
  },
  {
    title: "projects",
    href: "/admin/projects",
    icon: Folder
  },
  {
    title: "classification",
    icon: ListFilter,
    children: [
      {
        title: "categories",
        href: "/admin/categories",
        icon: Layers
      },
      {
        title: "skills",
        href: "/admin/skills",
        icon: BarChart4
      },
      {
        title: "questions",
        href: "/admin/questions",
        icon: ClipboardCheck
      }
    ]
  },
  {
    title: "messages",
    href: "/admin/messages",
    icon: BellRing
  },
  {
    title: "payments",
    href: "/admin/payments",
    icon: CreditCard
  },
  {
    title: "plans",
    href: "/admin/plans",
    icon: Layers
  },
  {
    title: "settings",
    href: "/admin/settings",
    icon: Settings
  }
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { t, i18n } = useTranslation();
  const { user, isLoading, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [path, setPath] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<{[key: string]: boolean}>({});
  
  const isRTL = i18n.language === "ar";
  
  // Set the document direction based on language
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [isRTL]);
  
  // Get current path
  useEffect(() => {
    setPath(window.location.pathname);
    
    // Auto-open groups based on current path
    const newOpenGroups = {...openGroups};
    adminNavItems.forEach(item => {
      if (item.children) {
        const childPath = item.children.find(child => path.startsWith(child.href));
        if (childPath) {
          newOpenGroups[item.title] = true;
        }
      }
    });
    setOpenGroups(newOpenGroups);
  }, []);
  
  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      toast({
        title: t("common.error"),
        description: t("common.unauthorized"),
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast, t]);

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };

  // Handle navigation
  const handleNavigation = (href: string) => {
    // Don't trigger a full reload for internal admin links
    if (href.startsWith("/admin")) {
      // Update the path state
      setPath(href);
      // Use navigate from wouter for client-side navigation
      navigate(href);
    } else {
      // For non-admin links, do a normal navigation
      navigate(href);
    }
    setIsOpen(false);
  };

  // Helper to check if a path is active based on current route
  const isPathActive = (itemPath: string) => {
    // Handle root admin path specially
    if (itemPath === "/admin/dashboard" && (path === "/admin/dashboard" || path === "/admin")) {
      return true;
    }
    // For other paths, check if current path starts with item path
    // but only if the item path is not /admin (to avoid all being active)
    return itemPath !== "/admin/dashboard" && path.startsWith(itemPath);
  };

  // Toggle group open state
  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Check if any child in a group is active
  const isGroupActive = (item: any) => {
    if (!item.children) return false;
    return item.children.some((child: any) => isPathActive(child.href));
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="h-full min-h-screen flex flex-col bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-6">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? "right" : "left"} className="p-0">
                <div className="p-6 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-xl">Admin</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-5rem)] pb-10">
                  <div className="px-6 py-4">
                    <nav className="flex flex-col gap-3">
                      {adminNavItems.map((item) => (
                        item.children ? (
                          <Collapsible 
                            key={item.title}
                            open={openGroups[item.title] || isGroupActive(item)}
                            onOpenChange={() => toggleGroup(item.title)}
                            className="w-full"
                          >
                            <CollapsibleTrigger asChild>
                              <Button
                                variant={isGroupActive(item) ? "secondary" : "ghost"}
                                className={cn(
                                  "justify-between w-full text-base",
                                  isRTL && "flex-row"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <item.icon className="h-5 w-5" />
                                  {t(`auth.admin.${item.title}`)}
                                </div>
                                <ChevronDown className={cn(
                                  "h-4 w-4 transition-transform",
                                  openGroups[item.title] && "transform rotate-180"
                                )} />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pl-10 pr-4 space-y-2 mt-2">
                              {item.children.map((child) => (
                                <Button
                                  key={child.href}
                                  variant={isPathActive(child.href) ? "secondary" : "ghost"}
                                  className={cn(
                                    "justify-start gap-3 text-base w-full",
                                    isRTL && "flex-row"
                                  )}
                                  onClick={() => handleNavigation(child.href)}
                                >
                                  <child.icon className="h-5 w-5" />
                                  {t(`auth.admin.${child.title}`)}
                                </Button>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          <Button
                            key={item.href}
                            variant={isPathActive(item.href as string) ? "secondary" : "ghost"}
                            className={cn(
                              "justify-start gap-3 text-base",
                              isRTL && "flex-row"
                            )}
                            onClick={() => handleNavigation(item.href as string)}
                          >
                            <item.icon className="h-5 w-5" />
                            {t(`auth.admin.${item.title}`)}
                          </Button>
                        )
                      ))}
                    </nav>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <div className="hidden lg:flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-xl">Admin</span>
            </div>
            <nav className="hidden lg:flex gap-2">
              {adminNavItems.map((item) => (
                item.children ? (
                  <DropdownMenu key={item.title}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={isGroupActive(item) ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                          "gap-2",
                          isRTL && "flex-row"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {t(`auth.admin.${item.title}`)}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {item.children.map((child) => (
                        <DropdownMenuItem 
                          key={child.href}
                          onClick={() => handleNavigation(child.href)}
                          className={cn(isPathActive(child.href) && "bg-secondary")}
                        >
                          <child.icon className="h-4 w-4 mr-2" />
                          {t(`auth.admin.${child.title}`)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    key={item.href}
                    variant={isPathActive(item.href as string) ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2",
                      isRTL && "flex-row"
                    )}
                    onClick={() => handleNavigation(item.href as string)}
                  >
                    <item.icon className="h-4 w-4" />
                    {t(`auth.admin.${item.title}`)}
                  </Button>
                )
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>{t("common.light")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>{t("common.dark")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t("common.system")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full w-8 h-8 font-bold">
                  {i18n.language === "ar" ? "ع" : "EN"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => i18n.changeLanguage("en")}>
                  <span className={i18n.language === "en" ? "font-bold" : ""}>English</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => i18n.changeLanguage("ar")}>
                  <span className={i18n.language === "ar" ? "font-bold" : ""}>العربية</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" size="icon" className="rounded-full">
              <BellRing className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-primary/10"
                >
                  <Avatar>
                    <AvatarImage
                      src={user.profileImage || ""}
                      alt={user.username}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.fullName || user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>{t("profile.title")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t("settings.title")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("auth.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t py-6 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">{t("auth.admin.title")}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} Mazeej. {t("common.allRightsReserved")}</p>
              <div className="flex items-center gap-4">
                <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => navigate("/privacy")}>
                  {t("common.privacyPolicy")}
                </Button>
                <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => navigate("/terms")}>
                  {t("common.termsOfService")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}