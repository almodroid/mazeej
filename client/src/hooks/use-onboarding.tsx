import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

type OnboardingContextType = {
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  hasCompletedOnboarding: boolean;
  markOnboardingComplete: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const STORAGE_KEY = "onboarding_completed";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  
  // Check if the user has completed onboarding
  useEffect(() => {
    if (!user) return;
    
    const userCompletedOnboarding = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
    
    if (!userCompletedOnboarding) {
      setHasCompletedOnboarding(false);
      // Only auto-show onboarding for new users
      setShowOnboarding(true);
    } else {
      setHasCompletedOnboarding(true);
    }
  }, [user]);
  
  const markOnboardingComplete = () => {
    if (!user) return;
    
    localStorage.setItem(`${STORAGE_KEY}_${user.id}`, "true");
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  };
  
  return (
    <OnboardingContext.Provider
      value={{
        showOnboarding,
        setShowOnboarding,
        hasCompletedOnboarding,
        markOnboardingComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  
  return context;
}