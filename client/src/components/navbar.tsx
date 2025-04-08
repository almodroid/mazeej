import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Sparkles
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { changeLanguage } from "@/lib/i18n";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const isRTL = i18n.language === 'ar';

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

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { href: "/", label: t("common.home"), icon: <User className="h-4 w-4" /> },
    { href: "/browse-freelancers", label: t("common.browseFreelancers"), icon: <Users className="h-4 w-4" /> },
    { href: "/projects", label: t("common.projects"), icon: <BriefcaseBusiness className="h-4 w-4" /> },
    { href: "/categories", label: t("common.categories"), icon: <List className="h-4 w-4" /> },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleLanguage = () => {
    changeLanguage(isRTL ? 'en' : 'ar');
  };

  return (
    <nav 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? "bg-background/90 backdrop-blur-md shadow-md" 
          : "bg-background"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex items-center gap-2 animate-fade-in">
                  <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                    <span className="text-lg font-cairo font-bold text-white">F</span>
                  </div>
                  <span className="text-xl font-cairo font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {t("common.appName")}
                  </span>
                </div>
              </Link>
            </div>
            
            <div className={`hidden lg:flex lg:ml-10 ${isRTL ? 'lg:mr-10 lg:ml-0' : ''}`}>
              <div className="p-1 bg-muted/50 rounded-full flex gap-1">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href}
                  >
                    <div className={cn(
                      "inline-flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                      location === link.href
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}>
                      {link.label}
                    </div>
                  </Link>
                ))}
              </div>
              {/* Main CTA button */}
              <div className="ml-4">
                <Button 
                  className="rounded-full font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary border-none shadow-md hover:shadow-lg transition-shadow"
                  size="sm"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  {t("common.postProject")}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex lg:items-center lg:gap-2">
            <div className="relative mr-2">
              <div className="flex items-center border border-input rounded-full px-3 py-1 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all duration-200 bg-muted/50 hover:bg-muted">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder={t("common.search")} 
                  className={`bg-transparent border-none focus:outline-none text-sm px-2 py-1 w-40 ${isRTL ? 'text-right' : 'text-left'}`}
                />
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="font-medium text-muted-foreground hover:text-foreground"
              onClick={toggleLanguage}
            >
              {isRTL ? 'EN' : 'عربي'}
            </Button>
            
            <div className="mx-1">
              <ThemeSwitcher />
            </div>
            
            {user ? (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-full relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
                </Button>
                
                <Button variant="ghost" size="icon" className="rounded-full relative">
                  <MessageSquare className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative rounded-full h-10 w-10 border-2 hover:border-primary transition-colors duration-200">
                      <Avatar className="h-8 w-8">
                        {user.profileImage && <AvatarImage src={user.profileImage} alt={user.fullName || user.username} />}
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.fullName?.charAt(0) || user.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56 animate-scale">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-bold">{user.fullName || user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <div className="flex items-center w-full">
                          <User className="mr-2 h-4 w-4" />
                          <span>{t("common.dashboard")}</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <div className="flex items-center w-full">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>{t("common.settings")}</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t("common.logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className={`flex ${isRTL ? 'space-x-0 space-x-reverse space-x-3' : 'space-x-3'}`}>
                <Button variant="outline" size="sm" className="font-medium hover-lift" asChild>
                  <Link href="/auth">{t("common.login")}</Link>
                </Button>
                <Button size="sm" className="hover-lift" asChild>
                  <Link href="/auth?register=true">{t("common.register")}</Link>
                </Button>
              </div>
            )}
          </div>
          
          {/* Mobile Menu */}
          <div className="flex items-center lg:hidden">
            {user && (
              <div className="flex">
                <Button variant="ghost" size="icon" className="relative mr-1">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
                </Button>
              </div>
            )}
            
            <Button variant="ghost" size="sm" className="mr-1 text-xs" onClick={toggleLanguage}>
              {isRTL ? 'EN' : 'عربي'}
            </Button>
            
            <div className="mr-1">
              <ThemeSwitcher />
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? 'right' : 'left'} className="w-[300px]">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center mb-6">
                      <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center mr-2">
                        <span className="text-lg font-cairo font-bold text-white">F</span>
                      </div>
                      <span className="text-xl font-cairo font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {t("common.appName")}
                      </span>
                    </div>
                    
                    <div className="relative mb-6">
                      <div className="flex items-center border border-input rounded-md px-3 py-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all duration-200">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <input 
                          type="text" 
                          placeholder={t("common.search")} 
                          className={`bg-transparent border-none focus:outline-none text-sm px-2 py-1 w-full ${isRTL ? 'text-right' : 'text-left'}`}
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 mb-6">
                      {navLinks.map((link) => (
                        <Link 
                          key={link.href} 
                          href={link.href}
                        >
                          <div className={cn(
                            "flex items-center py-2.5 px-3 text-base font-medium rounded-full transition-all duration-200",
                            location === link.href
                              ? "bg-primary/10 text-primary shadow-sm" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                          )}>
                            {link.icon}
                            <span className={`${isRTL ? 'mr-3' : 'ml-3'}`}>{link.label}</span>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Mobile CTA */}
                    <Button 
                      className="w-full rounded-full font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary border-none shadow-md transition-shadow"
                      size="default"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t("common.postProject")}
                    </Button>
                  </div>
                  
                  <div className="border-t border-border pt-4 mt-4">
                    {user ? (
                      <div className="space-y-3">
                        <div className="flex items-center p-2 rounded-md bg-muted/50">
                          <Avatar className="h-10 w-10 border-2 border-primary">
                            {user.profileImage && <AvatarImage src={user.profileImage} alt={user.fullName || user.username} />}
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {user.fullName?.charAt(0) || user.username.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                            <p className="text-sm font-medium">{user.fullName || user.username}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        
                        <Link href="/dashboard">
                          <div className="flex items-center py-2 text-base font-medium text-muted-foreground hover:text-foreground">
                            <User className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                            <span>{t("common.dashboard")}</span>
                          </div>
                        </Link>
                        
                        <Link href="/settings">
                          <div className="flex items-center py-2 text-base font-medium text-muted-foreground hover:text-foreground">
                            <Settings className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                            <span>{t("common.settings")}</span>
                          </div>
                        </Link>
                        
                        <button
                          onClick={handleLogout}
                          className="flex items-center py-2 w-full text-base font-medium text-destructive"
                        >
                          <LogOut className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                          <span>{t("common.logout")}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-3">
                        <Button asChild>
                          <Link href="/auth">{t("common.login")}</Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/auth?register=true">{t("common.register")}</Link>
                        </Button>
                      </div>
                    )}
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
