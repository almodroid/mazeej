import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const { t, i18n } = useTranslation();
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const search = useSearch();

  // Parse the query string to check for register=true
  const searchParams = new URLSearchParams(search);
  const register = searchParams.get("register");

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
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h1 className="text-3xl font-cairo font-bold mb-6 text-center">
              {t("auth.welcome")}
            </h1>
            
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
                <TabsTrigger value="register">{t("auth.register")}</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm />
                <div className="mt-4 text-center">
                  <p className="text-sm text-neutral-600">
                    {t("auth.noAccount")}{" "}
                    <button
                      className="text-primary hover:underline font-medium"
                      onClick={() => setActiveTab("register")}
                    >
                      {t("auth.createAccount")}
                    </button>
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm />
                <div className="mt-4 text-center">
                  <p className="text-sm text-neutral-600">
                    {t("auth.haveAccount")}{" "}
                    <button
                      className="text-primary hover:underline font-medium"
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
        <div className="hidden md:block md:w-1/2 bg-primary">
          <div className="h-full flex flex-col justify-center items-center p-10 text-white">
            <h2 className="text-3xl font-cairo font-bold mb-4">
              {t("common.appName")}
            </h2>
            <p className="text-xl mb-8 text-center max-w-md">
              {t("hero.subtitle")}
            </p>
            <ul className="list-disc space-y-3 max-w-md">
              <li>{t("howItWorks.step1Description")}</li>
              <li>{t("howItWorks.step2Description")}</li>
              <li>{t("howItWorks.step3Description")}</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
