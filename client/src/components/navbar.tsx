import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LogoPng from "@/assets/images/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Menu,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Search,
  BriefcaseBusiness,
  Users,
  List,
  Sparkles,
  Languages,
  UserPlus,
} from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { changeLanguage } from "@/lib/i18n";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useTheme();
  const isRTL = i18n.language === "ar";
  const isHomePage = location === "/";

  // Monitor scroll position to add effects on scroll
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navLinks = [
    { href: "/", label: t("common.home"), icon: <User className="h-4 w-4" /> },
    {
      href: "/browse-freelancers",
      label: t("common.browseFreelancers"),
      icon: <Users className="h-4 w-4" />,
    },
    {
      href: "/projects",
      label: t("common.projects"),
      icon: <BriefcaseBusiness className="h-4 w-4" />,
    },
    {
      href: "/categories",
      label: t("common.categories"),
      icon: <List className="h-4 w-4" />,
    },
    {
      href: "/tracks",
      label: t("common.tracks", { defaultValue: isRTL ? "المسارات" : "Tracks" }),
      icon: <Sparkles className="h-4 w-4" />,
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleLanguage = () => {
    changeLanguage(isRTL ? "en" : "ar");
  };

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md"
          : "bg-background dark:bg-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex items-center gap-2 animate-fade-in">
                <img src={LogoPng} alt="Mazeej Logo" className="h-8 w-auto" />
                  
                </div>
              </Link>
            </div>

            <div
              className={`hidden lg:flex lg:ml-10 ${isRTL ? "lg:mr-10 lg:ml-0" : ""}`}
            >
              <div className="p-1 bg-muted/50 dark:bg-gray-800/50 rounded-full flex gap-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div
                      className={cn(
                        "inline-flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                        location === link.href
                          ? "bg-background dark:bg-gray-800 text-foreground dark:text-white shadow-sm"
                          : "text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-background/50 dark:hover:bg-gray-800/50",
                      )}
                    >
                      {link.label}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden lg:flex lg:items-center lg:gap-2">
            {!isHomePage && (
              <div className="relative mr-2">
                <div className="flex items-center border border-input dark:border-gray-700 rounded-full px-3 py-1 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all duration-200 bg-muted/50 dark:bg-gray-800/50 hover:bg-muted dark:hover:bg-gray-800">
                  <Search className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("common.search")}
                    className={`bg-transparent border-none focus:outline-none text-sm px-2 py-1 w-40 ${isRTL ? "text-right" : "text-left"} dark:text-gray-300 dark:placeholder:text-gray-500`}
                  />
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="font-medium text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white"
              onClick={toggleLanguage}
            >
              <Languages className="h-[1.2rem] w-[1.2rem]" /> {isRTL ? "EN" : "ع"}
            </Button>

            <div className="mx-1">
              <ThemeSwitcher />
            </div>

            {user ? (
              <div className="flex items-center gap-1">
                <NotificationsDropdown />

                

                <DropdownMenu dir={isRTL ? "rtl" : "ltr"}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative rounded-full h-10 w-10 border-2 hover:border-primary transition-colors duration-200"
                    >
                      <Avatar className="h-8 w-8">
                        {user.profileImage && (
                          <AvatarImage
                            src={user.profileImage}
                            alt={user.fullName || user.username}
                          />
                        )}
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.fullName?.charAt(0) || user.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align={isRTL ? "start" : "end"}
                    className="w-56 animate-scale"
                  >
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-bold">
                          {user.fullName || user.username}
                        </span>
                        <span className="text-xs text-muted-foreground dark:text-gray-400">
                          {user.email}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <div className="flex items-center w-full cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>{t("common.dashboard")}</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <div className="flex items-center w-full cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>{t("common.settings")}</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t("common.logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground dark:text-white"
                  asChild
                >
                  <Link href="/auth">{t("common.login")}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth?register=true">
                    {t("common.register")}
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Menu"
                  className="lg:hidden"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? "right" : "left"} className="w-72">
                <div className="mt-6 flow-root">
                  <div className="space-y-2">
                    {navLinks.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={
                            location === item.href ? "default" : "ghost"
                          }
                          className={`w-full justify-start text-base ${
                            isRTL ? "text-right" : "text-left"
                          }`}
                        >
                          <span className="w-8">{item.icon}</span>
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                    
                    {/* Login/Register buttons for mobile menu */}
                    <div className="pt-4 border-t border-border">
                      {user ? (
                        <>
                          <Link href="/dashboard">
                            <Button
                              variant="ghost"
                              className={`w-full justify-start text-base ${
                                isRTL ? "text-right" : "text-left"
                              }`}
                            >
                              <span className="w-8"><User className="h-4 w-4" /></span>
                              {t("common.dashboard")}
                            </Button>
                          </Link>
                          <Link href="/settings">
                            <Button
                              variant="ghost"
                              className={`w-full justify-start text-base ${
                                isRTL ? "text-right" : "text-left"
                              }`}
                            >
                              <span className="w-8"><Settings className="h-4 w-4" /></span>
                              {t("common.settings")}
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            className={`w-full justify-start text-base ${
                              isRTL ? "text-right" : "text-left"
                            }`}
                            onClick={handleLogout}
                          >
                            <span className="w-8"><LogOut className="h-4 w-4" /></span>
                            {t("common.logout")}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link href="/auth">
                            <Button
                              variant="ghost"
                              className={`w-full justify-start text-base ${
                                isRTL ? "text-right" : "text-left"
                              }`}
                            >
                              <span className="w-8"><User className="h-4 w-4" /></span>
                              {t("common.login")}
                            </Button>
                          </Link>
                          <Link href="/auth?register=true">
                            <Button
                              variant="default"
                              className={`w-full justify-start text-base ${
                                isRTL ? "text-right" : "text-left"
                              }`}
                            >
                              <span className="w-8"><UserPlus className="h-4 w-4" /></span>
                              {t("common.register")}
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
