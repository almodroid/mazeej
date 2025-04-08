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
import { Bell, Menu, MessageSquare, User, Settings, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { changeLanguage } from "@/lib/i18n";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navLinks = [
    { href: "/", label: t("common.home") },
    { href: "/browse-freelancers", label: t("common.browseFreelancers") },
    { href: "/projects", label: t("common.projects") },
    { href: "/categories", label: t("common.categories") },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleLanguage = () => {
    changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-cairo font-bold text-primary mr-2">
                  {t("common.appName")}
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location === link.href
                      ? "border-primary text-neutral-900"
                      : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={toggleLanguage}
            >
              {i18n.language === 'ar' ? 'EN' : 'عربي'}
            </Button>
            
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="mr-4">
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        {user.profileImage && <AvatarImage src={user.profileImage} alt={user.fullName || user.username} />}
                        <AvatarFallback>
                          {user.fullName?.charAt(0) || user.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user.fullName || user.username}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>{t("common.dashboard")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t("common.settings")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t("common.logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex space-x-4">
                <Button variant="outline" asChild>
                  <Link href="/auth">{t("common.login")}</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth?register=true">{t("common.register")}</Link>
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <Button variant="ghost" size="icon" className="mr-2" onClick={toggleLanguage}>
              {i18n.language === 'ar' ? 'EN' : 'عربي'}
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side={i18n.language === 'ar' ? 'right' : 'left'}>
                <div className="flex flex-col space-y-4 mt-6">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className={`text-base font-medium ${
                        location === link.href
                          ? "text-primary"
                          : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="pt-4 border-t border-neutral-200">
                    {user ? (
                      <>
                        <Link 
                          href="/dashboard"
                          className="flex items-center py-2 text-base font-medium text-neutral-500 hover:text-neutral-700"
                        >
                          <User className="mr-2 h-5 w-5" />
                          <span>{t("common.dashboard")}</span>
                        </Link>
                        <Link 
                          href="/settings"
                          className="flex items-center py-2 text-base font-medium text-neutral-500 hover:text-neutral-700"
                        >
                          <Settings className="mr-2 h-5 w-5" />
                          <span>{t("common.settings")}</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center py-2 text-base font-medium text-neutral-500 hover:text-neutral-700"
                        >
                          <LogOut className="mr-2 h-5 w-5" />
                          <span>{t("common.logout")}</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col space-y-4 pt-4">
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
