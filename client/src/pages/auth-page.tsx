import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, UserCheck, ShieldCheck, Users, Monitor, Award, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const { t, i18n } = useTranslation();
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const search = useSearch();
  const isRTL = i18n.language === "ar";

  // Parse the query string to check for register=true
  const searchParams = new URLSearchParams(search);
  const register = searchParams.get("register");
  const role = searchParams.get("role") || "client";

  // Set the active tab based on the URL parameter
  useEffect(() => {
    if (register === "true") {
      setActiveTab("register");
    }
  }, [register]);

  // Redirect to home if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [isRTL]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const benefits = [
    { 
      icon: <Briefcase className="h-6 w-6" />, 
      title: t("auth.benefits.freelance.title"),
      description: t("auth.benefits.freelance.description")
    },
    { 
      icon: <UserCheck className="h-6 w-6" />, 
      title: t("auth.benefits.verified.title"),
      description: t("auth.benefits.verified.description")
    },
    { 
      icon: <ShieldCheck className="h-6 w-6" />, 
      title: t("auth.benefits.secure.title"),
      description: t("auth.benefits.secure.description")
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow py-10 lg:py-0">
        <div className="container mx-auto h-full">
          <div className="flex flex-col lg:flex-row h-full rounded-3xl overflow-hidden shadow-2xl border border-border">
            {/* Left Panel (Form) */}
            <div className="w-full lg:w-1/2 p-6 lg:p-12 flex flex-col justify-center relative animate-fade-in">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/5 to-transparent"></div>
              <div className="max-w-md mx-auto w-full">
                <div className="mb-8 text-center">
                  <h1 className="text-3xl font-cairo font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {activeTab === "login" ? t("auth.welcomeBack") : t("auth.joinCommunity")}
                  </h1>
                  <p className="text-muted-foreground">
                    {activeTab === "login" ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
                  </p>
                </div>
                
                <Tabs 
                  defaultValue={activeTab} 
                  value={activeTab} 
                  onValueChange={setActiveTab} 
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-8 rounded-full h-12">
                    <TabsTrigger 
                      value="login" 
                      className="rounded-full data-[state=active]:shadow-md transition-all"
                    >
                      {t("auth.login")}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register" 
                      className="rounded-full data-[state=active]:shadow-md transition-all"
                    >
                      {t("auth.register")}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="animate-fade-in">
                    <LoginForm />
                    <div className="mt-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        {t("auth.noAccount")}{" "}
                        <button
                          className="text-primary hover:underline font-medium transition-colors"
                          onClick={() => setActiveTab("register")}
                        >
                          {t("auth.createAccount")}
                        </button>
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="register" className="animate-fade-in">
                    <RegisterForm initialRole={role as "client" | "freelancer"} />
                    <div className="mt-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        {t("auth.haveAccount")}{" "}
                        <button
                          className="text-primary hover:underline font-medium transition-colors"
                          onClick={() => setActiveTab("login")}
                        >
                          {t("auth.login")}
                        </button>
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t("auth.orContinueWith")}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <Button variant="outline" className="w-full">
                      <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.0003 2C6.47731 2 2.00031 6.477 2.00031 12C2.00031 16.991 5.65731 21.128 10.4383 21.879V14.89H7.89831V12H10.4383V9.797C10.4383 7.291 11.9313 5.907 14.2153 5.907C15.3093 5.907 16.4543 6.102 16.4543 6.102V8.562H15.1913C13.9513 8.562 13.5623 9.333 13.5623 10.124V12H16.3363L15.8923 14.89H13.5623V21.879C18.3433 21.129 22.0003 16.99 22.0003 12C22.0003 6.477 17.5233 2 12.0003 2Z" />
                      </svg>
                    </Button>
                    <Button variant="outline" className="w-full">
                      <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.477 2 12C2 16.991 5.657 21.128 10.438 21.879V14.89H7.898V12H10.438V9.797C10.438 7.291 11.93 5.907 14.215 5.907C15.309 5.907 16.453 6.102 16.453 6.102V8.562H15.193C13.95 8.562 13.563 9.333 13.563 10.124V12H16.334L15.891 14.89H13.563V21.879C18.343 21.129 22 16.99 22 12C22 6.477 17.523 2 12 2Z" />
                      </svg>
                    </Button>
                    <Button variant="outline" className="w-full">
                      <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.0003 2C6.47731 2 2.00031 6.477 2.00031 12C2.00031 16.991 5.65731 21.128 10.4383 21.879V14.89H7.89831V12H10.4383V9.797C10.4383 7.291 11.9313 5.907 14.2153 5.907C15.3093 5.907 16.4543 6.102 16.4543 6.102V8.562H15.1913C13.9513 8.562 13.5623 9.333 13.5623 10.124V12H16.3363L15.8923 14.89H13.5623V21.879C18.3433 21.129 22.0003 16.99 22.0003 12C22.0003 6.477 17.5233 2 12.0003 2Z" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Panel (Features) */}
            <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-primary to-accent relative overflow-hidden">
              {/* Background decorations */}
              <div className="absolute inset-0 bg-grid-white/10 bg-grid-white/10"></div>
              <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full opacity-10 blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full opacity-10 blur-3xl"></div>
              
              <div className="h-full flex flex-col justify-center p-12 text-white relative z-10">
                <div className="mb-8 animate-fade-in">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm mb-4">
                    <div className="h-8 w-8 rounded-md bg-white flex items-center justify-center">
                      <span className="text-lg font-cairo font-bold text-primary">F</span>
                    </div>
                  </div>
                  <h2 className="text-4xl font-cairo font-bold mb-4">
                    {t("auth.platformFeatures")}
                  </h2>
                  <p className="text-xl opacity-90 max-w-lg">
                    {t("auth.platformDescription")}
                  </p>
                </div>
                
                <div className="space-y-6 mb-8">
                  {benefits.map((benefit, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl animate-slide-in-right" 
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        {benefit.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-cairo font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-sm opacity-80">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-300" />
                    <p className="font-medium">{t("auth.trustedPlatform")}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-white/60" />
                      <span className="text-sm">120K+ {t("auth.users")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-white/60" />
                      <span className="text-sm">25K+ {t("auth.projects")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-white/60" />
                      <span className="text-sm">98% {t("auth.satisfaction")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <div className="mt-10 lg:mt-0">
        <Footer />
      </div>
    </div>
  );
}
