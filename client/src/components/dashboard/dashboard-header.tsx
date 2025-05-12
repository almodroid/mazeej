import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Bell, 
  Menu, 
  Search, 
  User,
  LogOut,
  Moon,
  Sun,
  Laptop,
  Languages,
  Home
} from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { MessagesDropdown } from "@/components/messages/messages-dropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useSocket } from "@/hooks/useSocket";

interface DashboardHeaderProps {
  onMobileMenuOpen?: () => void;
}

export default function DashboardHeader({ onMobileMenuOpen }: DashboardHeaderProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [, navigate] = useLocation();
  const isRTL = i18n.language === "ar";
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = () => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(t('notifications.newMessage'), {
          body: t('notifications.newMessageBody'),
          icon: '/favicon.ico'
        });
      }
    };
    
    socket.on('newMessage', handleNewMessage);
    
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, t]);

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logoutMutation.mutate();
    navigate("/");
  };

  if (!user) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full bg-background border-b border-border transition-all duration-200",
        scrolled ? "shadow-md" : "",
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="h-16 px-4 md:px-6 flex items-center justify-between">
        
        
        {/* Logo for medium screens and above */}
        <div className="hidden md:flex items-center">
          <Link href="/dashboard">
            <h2 className="text-xl font-cairo font-bold text-primary cursor-pointer">
              {t("common.appName")}
            </h2>
          </Link>
        </div>
        
        
        {/* Right side actions */}
        <div className={cn(
          "flex items-center gap-2 ml-auto",
          isRTL && "ml-0 mr-auto"
        )}>
          {/* homepage */}
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9" title={t("common.home")}>
              <Home className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </Link>
          {/* Language Switcher */}
          <DropdownMenu dir={isRTL ? "rtl" : "ltr"}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" title={t("settings.language")}>
                <Languages className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"}>
              <DropdownMenuLabel>{t("settings.language")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={i18n.language} onValueChange={handleLanguageChange}>
                <DropdownMenuRadioItem value="en">{t("settings.english")}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ar">{t("settings.arabic")}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Switcher */}
          <DropdownMenu dir={isRTL ? "rtl" : "ltr"}> 
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" title={t("settings.theme")}>
                {theme === "light" && <Sun className="h-[1.2rem] w-[1.2rem]" />}
                {theme === "dark" && <Moon className="h-[1.2rem] w-[1.2rem]" />}
                {theme === "system" && <Laptop className="h-[1.2rem] w-[1.2rem]" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"}>
              <DropdownMenuLabel>{t("settings.theme")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup 
                value={theme} 
                onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
                
              >
                <DropdownMenuRadioItem value="light">
                  <Sun className={cn("h-4 w-4", isRTL ? "mr-2" : "ml-2")} />
                  <span>{t("settings.light")}</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon className={cn("h-4 w-4", isRTL ? "mr-2" : "ml-2")} />
                  <span>{t("settings.dark")}</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <Laptop className={cn("h-4 w-4", isRTL ? "mr-2" : "ml-2")} />
                  <span>{t("settings.system")}</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <MessagesDropdown />
          <NotificationsDropdown />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="p-1 h-10 overflow-hidden rounded-full relative"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImage || undefined} alt={user.username || ''} />
                  <AvatarFallback>
                    {(user.fullName?.substring(0, 2) || user.username?.substring(0, 2) || "").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align={isRTL ? "start" : "end"} dir={isRTL ? "rtl" : "ltr"}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  className={cn("cursor-pointer", isRTL && "flex-row text-right")}
                  onClick={() => navigate("/profile")}
                >
                  <User className={isRTL ? "ml-2" : "mr-2"} size={16} />
                  <span>{t("common.profile")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={cn("cursor-pointer", isRTL && "flex-row text-right")}
                  onClick={() => navigate("/settings")}
                >
                  <User className={isRTL ? "ml-2" : "mr-2"} size={16} />
                  <span>{t("common.settings")}</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className={cn("cursor-pointer", isRTL && "flex-row text-right")}
                onClick={handleLogout}
              >
                <LogOut className={isRTL ? "ml-2" : "mr-2"} size={16} />
                <span>{t("common.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 