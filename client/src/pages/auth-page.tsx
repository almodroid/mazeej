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
import LogoPng from "@/assets/images/logo.png";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { t, i18n } = useTranslation();
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const search = useSearch();
  const isRTL = i18n.language === "ar";
  const { toast } = useToast();

  // Parse the query string to check for parameters
  const searchParams = new URLSearchParams(search);
  const register = searchParams.get("register");
  const role = searchParams.get("role") || "client";
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const planId = searchParams.get("plan");

  // Set the active tab based on the URL parameter
  useEffect(() => {
    if (register === "true") {
      setActiveTab("register");
    }
  }, [register]);

  // Handle plan subscription parameter
  useEffect(() => {
    if (planId) {
      // Store plan ID for post-auth handling
      localStorage.setItem("pendingPlanId", planId);
      
      // Show a message that they need to register/login for the free plan
      toast({
        title: t("auth.registerForPlan"),
        description: t("auth.registerForPlanDesc"),
      });
      
      // Switch to register tab for new users
      setActiveTab("register");
    }
  }, [planId, toast, t]);

  // Handler for successful authentication (login or register)
  const onAuthSuccess = () => {
    // Check if there was a pending plan subscription
    const pendingPlanId = localStorage.getItem("pendingPlanId");
    
    if (pendingPlanId) {
      // Clear the stored plan ID
      localStorage.removeItem("pendingPlanId");
      
      // Show a message about processing the plan
      toast({
        title: t("auth.processingPlan"),
        description: t("auth.processingPlanDesc"),
      });
      
      // Redirect to tracks page to complete the plan selection
      navigate("/tracks");
      return;
    }
    
    // Standard redirect if no pending plan
    navigate(redirectTo);
  };

  // Redirect to home if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      // If already logged in, check for pending plan
      const pendingPlanId = localStorage.getItem("pendingPlanId");
      if (pendingPlanId) {
        localStorage.removeItem("pendingPlanId");
        navigate("/tracks"); // Redirect to tracks to complete plan selection
      } else {
        navigate("/dashboard");
      }
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
      
      <main className="flex-grow py-12 lg:py-16">
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
                  <p className="text-muted-foreground pt-3">
                    {activeTab === "login" ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
                  </p>
                </div>
                
                <Tabs 
                  defaultValue={activeTab} 
                  value={activeTab} 
                  onValueChange={setActiveTab} 
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-8 rounded-full h-12 px-3">
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
                    <LoginForm onAuthSuccess={onAuthSuccess} />
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
                    <RegisterForm initialRole={role as "client" | "freelancer"} onAuthSuccess={onAuthSuccess} />
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
