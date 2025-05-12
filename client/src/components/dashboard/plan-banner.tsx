import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { planApi } from "@/lib/api";
import { Plan } from "@shared/schema-plans";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

interface UserPlan {
  hasPlan: boolean;
  plan?: Plan;
  subscription?: {
    id: number;
    userId: number;
    planId: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    daysRemaining: number;
    isExpired: boolean;
    isExpiringSoon: boolean;
  };
}

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
    "athar": {
      color: "border-purple-400 bg-purple-50 dark:border-purple-600 dark:bg-purple-950/30",
      badge: "bg-purple-500 text-white",
      buttonColor: "bg-purple-500 hover:bg-purple-600 text-white"
    },
    "tamweel": {
      color: "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-950/30",
      badge: "bg-green-500 text-white",
      buttonColor: "bg-green-500 hover:bg-green-600 text-white"
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

// Format date to readable format
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function PlanBanner() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === "ar";
  
  // Check if we're in a React Router context
  let isRouterAvailable = true;
  try {
    // This will throw if we're not in a router context
    useLocation();
  } catch (error) {
    isRouterAvailable = false;
  }

  // Fetch user's current plan
  const { data: userPlan, isLoading, error } = useQuery<UserPlan>({
    queryKey: ["/api/plans/user-current-plan"],
    queryFn: async () => {
      return planApi.getCurrentPlan();
    }
  });

  const handleRenewal = async () => {
    if (!userPlan?.plan) return;
    
    try {
      const { redirectUrl } = await planApi.subscribeToPlan(userPlan.plan.id);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("subscriptions.renewalError"),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-28 animate-pulse bg-muted rounded-xl mb-8" />
    );
  }

  if (error || !userPlan) {
    return null;
  }

  // User has no active plan
  if (!userPlan.hasPlan) {
    return (
      <div className="mb-8 rounded-xl border border-dashed border-gray-300 p-6 bg-muted/30 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-bold mb-1">{t("subscriptions.noPlan")}</h2>
          <p className="text-muted-foreground text-sm">{t("subscriptions.noPlanDesc")}</p>
        </div>
        {isRouterAvailable ? (
          <Link to="/tracks">
            <Button className="whitespace-nowrap">
              {t("subscriptions.browsePlans")}
              {isRTL ? <ArrowRight className="ml-2 h-4 w-4 rotate-180" /> : <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </Link>
        ) : (
          <a href="/tracks">
            <Button className="whitespace-nowrap">
              {t("subscriptions.browsePlans")}
              {isRTL ? <ArrowRight className="ml-2 h-4 w-4 rotate-180" /> : <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </a>
        )}
      </div>
    );
  }

  // Get proper styling based on plan key
  const plan = userPlan.plan;
  const subscription = userPlan.subscription;
  const colorClasses = getColorClasses(plan?.key);
  
  // Status info
  const isExpired = subscription?.isExpired;
  const isExpiringSoon = subscription?.isExpiringSoon;
  const daysRemaining = subscription?.daysRemaining || 0;
  const progressPercent = Math.max(0, Math.min(100, (daysRemaining / 30) * 100));

  return (
    <div className={cn(
      "mb-8 rounded-xl border-2 overflow-hidden relative",
      isExpired ? "border-red-300" : isExpiringSoon ? "border-yellow-300" : colorClasses.color
    )}>
      <div className="p-6 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">{plan?.title}</h2>
              {isExpired ? (
                <Badge variant="destructive" className="ml-2">{t("subscriptions.expired")}</Badge>
              ) : isExpiringSoon ? (
                <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                  {t("subscriptions.expiringSoon")}
                </Badge>
              ) : (
                <Badge variant="default" className={cn("ml-2", colorClasses.badge)}>
                  {t("subscriptions.active")}
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground mt-2 flex flex-col md:flex-row gap-4 md:gap-8 mb-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <span>
                  {t("subscriptions.validUntil")}: {formatDate(subscription?.endDate || "")}
                </span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <span>
                  {isExpired 
                    ? t("subscriptions.expired") 
                    : t("subscriptions.daysRemaining", { count: daysRemaining })}
                </span>
              </div>
            </div>
            
            {/* Progress bar for days remaining */}
            {!isExpired && (
              <div className="w-full mt-2">
                <Progress
                  value={progressPercent}
                  className={cn(
                    "h-2", 
                    isExpiringSoon 
                      ? "bg-yellow-100 [&>div]:bg-yellow-500" 
                      : "bg-primary/20 [&>div]:bg-primary"
                  )}
                />
              </div>
            )}
          </div>
          
          <div className="mt-4 md:mt-0">
            {isExpired ? (
              <Button onClick={handleRenewal} variant="default" className="whitespace-nowrap">
                {t("subscriptions.renewNow")}
              </Button>
            ) : (
              <div className="flex flex-col items-end">
                {isRouterAvailable ? (
                  <Link to="/tracks">
                    <Button variant="outline" size="sm" className="whitespace-nowrap">
                      {t("subscriptions.upgrade")}
                      <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <a href="/tracks">
                    <Button variant="outline" size="sm" className="whitespace-nowrap">
                      {t("subscriptions.upgrade")}
                      <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                )}
                {isExpiringSoon && (
                  <Button 
                    onClick={handleRenewal} 
                    variant="default" 
                    className={cn("mt-2 whitespace-nowrap", colorClasses.buttonColor)}
                  >
                    {t("subscriptions.renewNow")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 