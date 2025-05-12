import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Auth: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get("redirect");
    const planId = params.get("plan");
    
    // Check for referral from plan subscription (specifically from Wameed free plan)
    if (planId) {
      // User was directed here from attempting to subscribe to a plan while not logged in
      // Store the plan ID for later use after authentication
      localStorage.setItem("pendingPlanId", planId);
      
      // Show a message about registration for the free plan
      toast({
        title: t("auth.registerForPlan"),
        description: t("auth.registerForPlanDesc"),
        variant: "default",
      });
    }
    
    if (redirectPath) {
      setRedirectTo(redirectPath);
    }
  }, [location.search, toast, t]);
  
  // After successful login or registration, redirect to the intended destination
  const handleAuthSuccess = () => {
    // Check if there was a pending plan subscription
    const pendingPlanId = localStorage.getItem("pendingPlanId");
    
    if (pendingPlanId) {
      // Clear the pending plan from storage
      localStorage.removeItem("pendingPlanId");
      
      // If this was from the free plan flow, assign the plan directly before redirecting
      if (pendingPlanId) {
        // Attempt to assign the free plan
        toast({
          title: t("auth.processingPlan"),
          description: t("auth.processingPlanDesc"),
          variant: "default",
        });
        
        // Redirect to tracks page to let the user explicitly select the plan
        // This avoids potential errors if we can't determine which plan was free
        setLocation("/tracks");
        return;
      }
    }
    
    // Normal redirect flow
    if (redirectTo) {
      setLocation(redirectTo);
    } else {
      setLocation("/dashboard");
    }
  };

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default Auth; 