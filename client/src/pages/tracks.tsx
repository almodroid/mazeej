import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { planApi } from "@/lib/api";
import { Plan } from "@shared/schema-plans";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useSearch } from "wouter";
import { Loader2 } from "lucide-react";

// Map color keys to CSS classes
const getColorClasses = (key: string = "") => {
  const colorMap: Record<string, { color: string, badge: string, buttonColor: string }> = {
    "wameed": {
      color: "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30",
      badge: "bg-blue-500 text-white",
      buttonColor: "bg-blue-500 hover:bg-blue-600 text-white"
    },
    "nabd": {
      color: "border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-950/30",
      badge: "bg-yellow-500 text-white",
      buttonColor: "bg-yellow-500 hover:bg-yellow-600 text-white"
    },
    "tamweel": {
      color: "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-950/30",
      badge: "bg-green-500 text-white",
      buttonColor: "bg-green-500 hover:bg-green-600 text-white"
    },
    "orange": {
      color: "border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-950/30",
      badge: "bg-orange-500 text-white",
      buttonColor: "bg-orange-500 hover:bg-orange-600 text-white"
    },
    "yellow": {
      color: "border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-950/30",
      badge: "bg-yellow-500 text-white",
      buttonColor: "bg-yellow-500 hover:bg-yellow-600 text-white"
    },
    "purple": {
      color: "border-purple-400 bg-purple-50 dark:border-purple-600 dark:bg-purple-950/30",
      badge: "bg-purple-500 text-white",
      buttonColor: "bg-purple-500 hover:bg-purple-600 text-white"
    },
    "blue": {
      color: "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30",
      badge: "bg-blue-500 text-white",
      buttonColor: "bg-blue-500 hover:bg-blue-600 text-white"
    },
    "green": {
      color: "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-950/30",
      badge: "bg-green-500 text-white",
      buttonColor: "bg-green-500 hover:bg-green-600 text-white"
    },
    "red": {
      color: "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/30",
      badge: "bg-red-500 text-white",
      buttonColor: "bg-red-500 hover:bg-red-600 text-white"
    },
    "default": {
      color: "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
      badge: "bg-gray-500 text-white",
      buttonColor: "bg-gray-500 hover:bg-gray-600 text-white"
    }
  };

  // Handle null or undefined input
  if (!key) return colorMap["default"];
  
  const key_lower = key.toLowerCase();
  return colorMap[key_lower] || colorMap["default"];
};

export default function TracksPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const search = useSearch();
  const reference = new URLSearchParams(search).get("reference");

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const plansData = await planApi.getPlans();
        setPlans(plansData);
      } catch (error) {
        console.error("Error fetching plans:", error);
        setError(t("tracks.fetchError"));
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [t]);

  // Check payment status if reference is in URL
  useEffect(() => {
    if (reference) {
      const checkPaymentStatus = async () => {
        try {
          const status = await planApi.checkPaymentStatus(reference);
          if (status.success && status.subscribed) {
            toast({
              title: t("tracks.subscriptionSuccess"),
              description: t("tracks.subscriptionSuccessDesc", { plan: status.planTitle }),
              variant: "default",
            });
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
        }
      };

      checkPaymentStatus();
    }
  }, [reference, toast, t]);

  const handleSubscribe = async (planId: number) => {
    // Get the plan details for custom handling
    const plan = plans.find(p => p.id === planId);
    const isWameedPlan = plan?.key?.toLowerCase() === "wameed";
    
    // If it's Wameed plan, handle differently
    if (isWameedPlan) {
      if (!user) {
        // Not logged in - redirect to registration with plan info
        setLocation(`/auth?redirect=/tracks&plan=${planId}`);
        return;
      } else {
        // User is logged in - assign free plan directly
        try {
          setSubscribing(planId);
          const result = await planApi.assignFreePlan(planId);
          
          toast({
            title: t("tracks.freeSubscriptionSuccess"),
            description: t("tracks.freeSubscriptionSuccessDesc", { plan: plan.title }),
            variant: "default",
          });
          
          // Redirect to dashboard after successful assignment
          setLocation("/dashboard");
        } catch (error) {
          console.error("Free subscription error:", error);
          toast({
            title: t("tracks.subscriptionError"),
            description: error instanceof Error ? error.message : t("tracks.subscriptionErrorDesc"),
            variant: "destructive",
          });
        } finally {
          setSubscribing(null);
        }
        return;
      }
    }
    
    // For paid plans or non-Wameed plans
    if (!user) {
      toast({
        title: t("common.loginRequired"),
        description: t("tracks.loginToSubscribe"),
        variant: "destructive",
      });
      setLocation("/auth?redirect=/tracks");
      return;
    }

    try {
      setSubscribing(planId);
      const { redirectUrl } = await planApi.subscribeToPlan(planId);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: t("tracks.subscriptionError"),
        description: error instanceof Error ? error.message : t("tracks.subscriptionErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1">
        <div className="container px-4 py-12 max-w-5xl mx-auto animate-fade-in">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-3xl sm:text-4xl font-cairo font-bold mb-4 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("tracks.title")}
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              {t("tracks.subtitle")}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-xl p-8">
                  <Skeleton className="h-8 w-3/4 mb-4" />
                  <Skeleton className="h-6 w-24 mb-8" />
                  <div className="space-y-3 mb-8">
                    {[...Array(4)].map((_, j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center p-8 border rounded-xl">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                {t("common.tryAgain")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {plans.map((plan) => {
                
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative border rounded-3xl border-2 p-8 hover:shadow-md transition-shadow duration-300 flex flex-col justify-around",
                      plan.color
                    )}
                  >
                    {plan.badge && (
                      <span className={cn("absolute top-6 px-3 py-1 rounded-full text-xs font-bold", isRTL ? "left-6" : "right-6", plan.badge)}>
                        {plan.title}
                      </span>
                    )}
                    <h3 className="text-2xl font-bold mb-6">{plan.title} -  {plan.priceValue !== 0 && plan.priceValue}
                    {plan.priceNote}</h3>
                      <span className="text-gray-500 dark:text-gray-400 ">
                        {plan.description}
                      </span>
                   
                    <ul className="space-y-3 my-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <svg
                            className={cn("h-6 w-6 flex-none fill-sky-100 stroke-sky-500 stroke-2", isRTL ? "mr-2" : "ml-2")}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            
                            <path
                              d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9"
                              fill="none"
                            />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={cn("w-full", plan.buttonColor)}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribing === plan.id}
                    >
                      {subscribing === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("common.processing")}
                        </>
                      ) : (
                        t("common.subscribe")
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}