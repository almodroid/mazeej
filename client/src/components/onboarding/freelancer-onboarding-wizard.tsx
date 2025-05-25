import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  CheckCircle, 
  ArrowRight, 
  X, 
  UserCheck, 
  ChevronLeft,
  Check,
  Phone,
  ArrowLeft,
  CreditCard,
  ChevronRight
} from "lucide-react";
import { PhoneVerification } from "@/components/onboarding/phone-verification";
import { planApi } from "@/lib/api";
import { Plan } from "@shared/schema-plans";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

// Define interfaces for the data structure
interface Skill {
  id: number;
  name: string;
  categoryId: number;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
  skills?: Skill[];
}

// Step indicator component
const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  
  return (
    <div className={`flex items-center justify-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} mb-6`}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-2 rounded-full transition-all duration-300 ${
            index < currentStep ? "bg-primary w-8" : "bg-muted w-4"
          }`}
        />
      ))}
    </div>
  );
};

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

export default function FreelancerOnboardingWizard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    bio: "",
    city: "",
    selectedSkills: [] as number[],
    phoneVerified: false,
    selectedPlanId: null as number | null,
  });

  // Fetch user skills
  const { data: userSkills = [], isLoading: isSkillsLoading } = useQuery<Skill[]>({
    queryKey: [`/api/users/${user?.id}/skills`],
    queryFn: async () => {
      try {
        // Use the user-specific endpoint with ID
        const response = await apiRequest("GET", `/api/users/${user?.id}/skills`);
        if (!response.ok) {
          throw new Error("Failed to fetch user skills");
        }
        const data = await response.json();
        return data;
      } catch (error) {
        return [];
      }
    },
    enabled: !!user?.id // Only fetch if we have a user ID
  });

  // Check if onboarding is completed
  const checkOnboardingStatus = () => {
    // Check if user has completed the necessary fields for onboarding
    const hasCompletedBasicInfo = user?.fullName && user?.bio && user?.city;
    const hasPhoneVerified = user?.phoneVerified;
    
    // Check if user has skills (either from existing skills or newly selected ones)
    const hasSkills = (userSkills && userSkills.length > 0) || (formData.selectedSkills && formData.selectedSkills.length > 0);
    
    // Set completed status based on these checks
    const isOnboardingCompleted = Boolean(hasCompletedBasicInfo && hasPhoneVerified && hasSkills);
    setIsCompleted(isOnboardingCompleted);
    
    // If not completed and not already open, show the floating button
    if (!isOnboardingCompleted && !isOpen) {
      // Determine which step to start with
      let startStep = 0;
      if (hasCompletedBasicInfo) startStep = 1;
      if (hasCompletedBasicInfo && hasSkills) {
        // Skip phone verification step if phone is already verified
        startStep = hasPhoneVerified ? 3 : 2;
      }
      
      setCurrentStep(startStep);
    }
    
    return isOnboardingCompleted;
  };

  // Determine if RTL
  const isRTL = i18n.language === "ar";

  // Animation variants
  const stepVariants = {
    hidden: { opacity: 0, x: isRTL ? -50 : 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: isRTL ? 50 : -50 },
  };

  // Check onboarding status when component mounts
  useEffect(() => {
    const onboardingCompleted = checkOnboardingStatus();
    
    // If user is a new freelancer and hasn't completed onboarding, show the dialog automatically
    // We can check if they're new by seeing if they have no skills and no bio
    const isNewFreelancer = !user?.bio && (!userSkills || userSkills.length === 0);
    
    if (!onboardingCompleted && isNewFreelancer) {
      // Small delay to ensure the component is fully mounted
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    } else if (onboardingCompleted) {
      // If onboarding is completed, close the dialog
      setIsOpen(false);
      // Store completion status in localStorage
      localStorage.setItem("freelancer_onboarding_completed", "true");
    }
  }, [user, userSkills]);

  // Fetch user profile data to check onboarding status
  const { data: userData, isLoading: isUserDataLoading } = useQuery({
    queryKey: ["/api/users/profile"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users/profile");
      if (!response.ok) throw new Error("Failed to fetch user profile");
      return response.json();
    }
  });

  // Handle user data updates when data is available
  useEffect(() => {
    if (userData) {
      // Update form data with existing user data
      setFormData(prev => ({
        ...prev,
        fullName: userData.fullName || "",
        bio: userData.bio || "",
        phone: userData.phone || "",
        hourlyRate: userData.hourlyRate?.toString() || "",
        phoneVerified: userData.phoneVerified || false,
        selectedSkills: userData.selectedSkills?.map((s: any) => s.id) || []
      }));
      
      // Re-check onboarding status with fresh data
      checkOnboardingStatus();
    }
  }, [userData]);

  // Fetch categories and skills
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories-with-skills"],
    queryFn: async () => {
      try {
        // Update to use the same endpoint as the profile page - categories-with-skills
        const response = await apiRequest("GET", "/api/categories-with-skills");
        
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        return [];
      }
    }
  });

  // Fetch available plans
  const { data: plans = [], isLoading: isPlansLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
    queryFn: async () => {
      try {
        const plansData = await planApi.getPlans();
        return plansData;
      } catch (error) {
        console.error("Error fetching plans:", error);
        return [];
      }
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      try {
        const response = await apiRequest("PATCH", "/api/users/profile", profileData);
        
        if (!response.ok) {
          // Try to get the error message from the response
          let errorMessage = "Failed to update profile";
          try {
            const errorData = await response.text();
            
            // Try to parse as JSON if possible
            try {
              const jsonError = JSON.parse(errorData);
              errorMessage = jsonError.message || errorMessage;
            } catch (e) {
              // If it's not valid JSON, just log the error
            }
          } catch (e) {
          }
          
          throw new Error(errorMessage);
        }
        
        const responseData = await response.json();
        return responseData;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Update the form data with the latest values from the server
      if (data) {
        setFormData(prev => ({
          ...prev,
          fullName: data.fullName || prev.fullName,
          phone: data.phone || prev.phone,
          bio: data.bio || prev.bio,
          city: data.city || prev.city,
        }));
      }
      
      toast({
        title: t("profile.profileUpdated"),
        description: t("profile.profileUpdatedDesc"),
      });
      
      if (currentStep < 3) {
        setCurrentStep(prev => prev + 1);
      }
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update selected skills when user skills are loaded
  useEffect(() => {
    try {
      if (userSkills && userSkills.length > 0 && user?.id) {
        const skillIds = userSkills.map((skill: Skill) => skill.id);
        
        // Check if skillIds array is different from current selectedSkills before updating
        const currentSkillIds = [...formData.selectedSkills].sort();
        const newSkillIds = [...skillIds].sort();
        
        // Only update state if the arrays are different
        if (JSON.stringify(currentSkillIds) !== JSON.stringify(newSkillIds)) {
          setFormData(prev => ({
            ...prev,
            selectedSkills: skillIds
          }));
        }
      }
    } catch (error) {
    }
  }, [userSkills, user?.id]);

  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      try {
        // Use the user-specific endpoint with ID
        const response = await apiRequest("POST", `/api/users/${user?.id}/skills`, { skillId });
        
        if (!response.ok) {
          let errorMessage = "Failed to add skill";
          try {
            const errorData = await response.text();
            
            try {
              const jsonError = JSON.parse(errorData);
              errorMessage = jsonError.message || errorMessage;
            } catch (e) {
            }
          } catch (e) {
          }
          
          throw new Error(errorMessage);
        }
        
        const responseData = await response.json();
        return responseData;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (responseData: { skillId: number }) => {
      // Update already handled in onMutate
      queryClient.invalidateQueries({ queryKey: ["/api/users/skills"] });
      toast({
        title: t("profile.skillAdded"),
      });
    },
    onError: (error: Error, variables: number, context: any) => {
      // Revert to previous skills on error
      if (context?.previousSelectedSkills) {
        setFormData(prev => ({
          ...prev,
          selectedSkills: context.previousSelectedSkills
        }));
      }
      
      toast({
        title: t("common.error"),
        description: error.message || "Failed to add skill",
        variant: "destructive",
      });
    },
    onMutate: (skillId: number) => {
      // Optimistically update the UI
      const previousSelectedSkills = [...formData.selectedSkills];
      
      // Update the selected skills immediately
      setFormData(prev => ({
        ...prev,
        selectedSkills: [...prev.selectedSkills, skillId]
      }));
      
      // Return context to use in onError
      return { previousSelectedSkills };
    }
  });

  // Add remove skill mutation
  const removeSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      try {
        // Use the user-specific endpoint with ID
        const response = await apiRequest("DELETE", `/api/users/${user?.id}/skills/${skillId}`);
        
        if (!response.ok) {
          let errorMessage = "Failed to remove skill";
          try {
            const errorData = await response.text();
            
            try {
              const jsonError = JSON.parse(errorData);
              errorMessage = jsonError.message || errorMessage;
            } catch (e) {
            }
          } catch (e) {
          }
          
          throw new Error(errorMessage);
        }
        
        return { skillId };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: ({ skillId }) => {
      // Update already handled in onMutate
      queryClient.invalidateQueries({ queryKey: ["/api/users/skills"] });
      toast({
        title: t("profile.skillRemoved"),
      });
    },
    onError: (error: Error, variables: number, context: any) => {
      // Revert to previous skills on error
      if (context?.previousSelectedSkills) {
        setFormData(prev => ({
          ...prev,
          selectedSkills: context.previousSelectedSkills
        }));
      }
      
      toast({
        title: t("common.error"),
        description: error.message || "Failed to remove skill",
        variant: "destructive",
      });
    },
    onMutate: (skillId: number) => {
      // Optimistically update the UI
      const previousSelectedSkills = [...formData.selectedSkills];
      
      // Remove the skill from UI immediately
      setFormData(prev => ({
        ...prev,
        selectedSkills: prev.selectedSkills.filter(id => id !== skillId)
      }));
      
      // Return context to use in onError
      return { previousSelectedSkills };
    }
  });

  // Handler for removing a skill
  const handleRemoveSkill = (skillId: number) => {
    // Update the UI immediately for better user experience
    setFormData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.filter(id => id !== skillId)
    }));
    
    // If the skill exists in userSkills (already saved to server), remove it via API
    if (userSkills.some(skill => skill.id === skillId)) {
      removeSkillMutation.mutate(skillId);
    }
  };

  // Submit verification mutation
  const submitVerificationMutation = useMutation({
    mutationFn: async (phoneData: { phone: string }) => {
      try {
        const response = await apiRequest("POST", "/api/phone-verification", phoneData);
        
        if (!response.ok) {
          let errorMessage = "Failed to submit phone verification";
          try {
            const errorData = await response.text();
            
            try {
              const jsonError = JSON.parse(errorData);
              errorMessage = jsonError.message || errorMessage;
            } catch (e) {
            }
          } catch (e) {
          }
          
          throw new Error(errorMessage);
        }
        
        const responseData = await response.json();
        return responseData;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Update the profile data in the cache
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Show success message
      toast({
        title: t("verification.phoneVerified"),
        description: t("verification.phoneVerifiedDesc"),
      });
      
      // Move to the next step (plan selection)
      setCurrentStep(3);
    },
    onError: (error: Error) => {
      toast({
        title: t("verification.verificationFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Subscribe to plan mutation
  const subscribePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      try {
        const response = await planApi.subscribeToPlan(planId);
        return response;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      // If we get a redirect URL, we need to redirect the user to complete payment
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      
      // Otherwise, the subscription was successful
      toast({
        title: t("onboarding.planSelected"),
        description: t("onboarding.planSelectedDesc"),
      });
      
      // Move to the completion step
      setCurrentStep(4);
      setIsCompleted(true);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("onboarding.planSelectionError"),
        variant: "destructive",
      });
    },
  });

  // Skip plan selection and assign free plan
  const assignFreePlanMutation = useMutation({
    mutationFn: async () => {
      try {
        // Find the free "wamd" plan
        const wamdPlan = plans.find(plan => plan.key?.toLowerCase() === "wameed");
        
        if (!wamdPlan) {
          throw new Error(t("onboarding.freePlanNotFound"));
        }
        
        // Assign the free plan to the user (use a special endpoint or parameter to indicate it's free)
        const response = await apiRequest("POST", "/api/plans/assign-free", { planId: wamdPlan.id });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: "Unknown error" }));
          throw new Error(error.message || "Failed to assign free plan");
        }
        
        return response.json();
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: t("onboarding.freePlanAssigned"),
        description: t("onboarding.freePlanAssignedDesc"),
      });
      
      // Move to the completion step
      setCurrentStep(4);
      setIsCompleted(true);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("onboarding.freePlanAssignmentError"),
        variant: "destructive",
      });
    },
  });

  // Handler for submitting basic info
  const handleBasicInfoSubmit = () => {
    try {
      updateProfileMutation.mutate({
        fullName: formData.fullName,
        phone: formData.phone,
        bio: formData.bio,
        city: formData.city,
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Handler for selecting a skill
  const handleSkillSelect = (value: string | number) => {
    try {
      // Convert to number if it's a string
      const skillId = typeof value === 'string' ? parseInt(value) : value;
      
      if (!isNaN(skillId) && !formData.selectedSkills.includes(skillId)) {
        // Find the skill in categories to verify it exists
        const foundSkill = categories.flatMap(cat => cat.skills || [])
          .find(skill => skill.id === skillId);
        
        if (foundSkill) {
          // Update the state directly for immediate UI response
          setFormData(prev => ({
            ...prev,
            selectedSkills: [...prev.selectedSkills, skillId]
          }));
          
          // Then trigger the API call in the background
          addSkillMutation.mutate(skillId);
        } else {
          toast({
            title: t("common.error"),
            description: t("profile.skillNotFound"),
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("profile.errorSelectingSkill"),
        variant: "destructive",
      });
    }
  };

  // Handler for submitting skills
  const handleSkillsSubmit = () => {
    if (formData.selectedSkills.length === 0) {
      toast({
        title: t("profile.noSkillsSelected"),
        description: t("profile.pleaseSelectSkills"),
        variant: "destructive",
      });
      return;
    }
    
    // If we have unsaved skill selections, let's save them all at once
    const saveSelections = async () => {
      let hasErrors = false;
      
      // Only proceed to next step if all skills are saved
      for (const skillId of formData.selectedSkills) {
        // Skip if skill is already saved (exists in userSkills)
        if (userSkills.some(skill => skill.id === skillId)) {
          continue;
        }
        
        try {
          await addSkillMutation.mutateAsync(skillId);
        } catch (error) {
          hasErrors = true;
        }
      }
      
      if (!hasErrors) {
        setCurrentStep(prev => prev + 1);
      } else {
        toast({
          title: t("profile.skillsSaveError"),
          description: t("profile.someSkillsNotSaved"),
          variant: "destructive",
        });
      }
    };
    
    saveSelections();
  };

  // Handler for submitting verification
  const handleVerificationSubmit = () => {
    if (!formData.phoneVerified) {
      toast({
        title: t("verification.phoneNotVerified"),
        description: t("verification.pleaseVerifyPhone"),
        variant: "destructive",
      });
      return;
    }

    submitVerificationMutation.mutate({ phone: formData.phone });
  };

  // Handler for selecting a plan
  const handleSelectPlan = (planId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedPlanId: planId
    }));
  };

  // Handler for submitting plan selection
  const handlePlanSubmit = () => {
    if (formData.selectedPlanId) {
      subscribePlanMutation.mutate(formData.selectedPlanId);
    } else {
      toast({
        title: t("onboarding.noPlanSelected"),
        description: t("onboarding.pleaseSelectPlan"),
        variant: "destructive",
      });
    }
  };

  // Handler for skipping plan selection
  const handleSkipPlan = () => {
    assignFreePlanMutation.mutate();
  };

  // Handle phone verification complete
  const handlePhoneVerificationComplete = () => {
    setFormData(prev => ({
      ...prev,
      phoneVerified: true,
    }));
  };

  // Initialize form data from user when it becomes available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || "",
        phone: user.phone || "",
        bio: user.bio || "",
        hourlyRate: user.hourlyRate ? user.hourlyRate.toString() : "",
      }));
    }
  }, [user]);

  // Check if onboarding was completed previously
  useEffect(() => {
    if (user?.role === 'freelancer') {
      const completed = localStorage.getItem("freelancer_onboarding_completed") === "true";
      setIsCompleted(completed);
      
      if (!completed) {
        setIsOpen(true);
      }
    }
  }, [user]);

  if (!user || user.role !== 'freelancer') {
    return null;
  }

  // Render floating action button if wizard was dismissed but not completed
  const renderFloatingButton = () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl"
            size="icon"
          >
            <UserCheck className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {t("onboarding.completeYourProfile")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Render the steps content
  const renderStepContent = () => {
    // Skip phone verification step if phone is already verified
    if (currentStep === 2 && user?.phoneVerified) {
      setCurrentStep(3);
      return null;
    }

    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("profile.fullName")}</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  placeholder={t("profile.fullNamePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("profile.phone")}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder={t("profile.phonePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t("profile.bio")}</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder={t("profile.bioPlaceholder")}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">{t("profile.city")}</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder={t("profile.cityPlaceholder")}
                />
              </div>
            </div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>{t("profile.skills")}</Label>
                  <Badge 
                    variant={formData.selectedSkills.length > 0 ? "default" : "outline"}
                    className="px-2 py-0.5"
                  >
                    {formData.selectedSkills.length} {t("profile.skillsSelected")}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mb-4 min-h-20 bg-muted/30 rounded-md p-3 border">
                  {formData.selectedSkills.length > 0 ? (
                    categories.flatMap((category: Category) => 
                      (category.skills || []).filter((skill: Skill) => 
                        formData.selectedSkills.includes(skill.id)
                      ).map((skill: Skill) => (
                        <Badge key={skill.id} variant="secondary" className="px-3 py-1.5 flex items-center gap-1 animate-fadeIn">
                          {skill.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill.id)}
                            className="hover:text-destructive focus:outline-none"
                            disabled={removeSkillMutation.isPending}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    )
                  ) : (
                    <span className="text-sm text-muted-foreground flex items-center justify-center w-full h-12">
                      {t("profile.noSkillsSelected")}
                    </span>
                  )}
                </div>

                {isCategoriesLoading || isSkillsLoading ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-4 border rounded-md">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">{t("common.loadingSkills")}</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-4">
                    <p className="text-sm text-muted-foreground">{t("profile.noCategoriesFound")}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 rounded-md">
                    {categories.map((category: Category) => {
                      return (
                        <div key={category.id} className="border rounded-md p-3">
                          <h4 className="font-medium mb-2 flex items-center justify-between">
                            <span>{category.name}</span>
                            {category.skills?.some(skill => formData.selectedSkills.includes(skill.id)) && (
                              <Badge variant="secondary" className="ml-2 px-2 py-0 text-xs">
                                {category.skills.filter(skill => formData.selectedSkills.includes(skill.id)).length} {t("common.selected")}
                              </Badge>
                            )}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {category.skills && category.skills.length > 0 ? (
                              category.skills.map((skill: Skill) => {
                                const isSelected = formData.selectedSkills.includes(skill.id);
                                return (
                                  <Badge 
                                    key={skill.id}
                                    variant={isSelected ? "default" : "outline"}
                                    className={`px-3 py-1.5 cursor-pointer transition-all duration-200
                                      ${isSelected 
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/80' 
                                        : 'hover:bg-muted hover:text-foreground'
                                      } ${(addSkillMutation.isPending || removeSkillMutation.isPending) ? 'opacity-70' : ''}`}
                                    onClick={() => {
                                      if (addSkillMutation.isPending || removeSkillMutation.isPending) return;
                                      
                                      if (isSelected) {
                                        handleRemoveSkill(skill.id);
                                      } else {
                                        handleSkillSelect(skill.id);
                                      }
                                    }}
                                  >
                                    {skill.name}
                                    {isSelected && <Check className="h-3 w-3 ml-1" />}
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {t("profile.noSkillsInCategory")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-3">
                  {t("profile.skillsHelp")} {t("profile.clickToSelect")}
                </p>
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            <div className="text-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">{t("verification.verifyPhone")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("verification.verifyPhoneDescription")}
              </p>
            </div>

            <PhoneVerification 
              phone={formData.phone} 
              onVerificationComplete={handlePhoneVerificationComplete}
              onPhoneChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
            />
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="step4"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            <div className="text-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">{t("onboarding.choosePlan")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("onboarding.choosePlanDescription")}
              </p>
            </div>

            {isPlansLoading ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 border rounded-md">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">{t("common.loadingPlans")}</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <p className="text-sm text-muted-foreground">{t("onboarding.noPlansFound")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-h-80 overflow-y-auto pr-2">
                {plans.map((plan: Plan) => {
                  // Extract color classes using the key
                  const colorClasses = getColorClasses(plan.key);
                  
                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative border rounded-xl border-2 p-4 hover:shadow-md transition-shadow duration-300 cursor-pointer",
                        colorClasses.color,
                        formData.selectedPlanId === plan.id ? "ring-2 ring-primary" : ""
                      )}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold">{plan.title}</h3>
                          <div className="flex items-center mt-1">
                            <span className="font-medium">
                              {plan.priceValue !== 0 ? `${plan.priceValue} ${plan.priceNote}` : t("common.free")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                        </div>
                        {formData.selectedPlanId === plan.id && (
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="mt-3 space-y-1">
                        {plan.features.slice(0, 3).map((feature, i) => (
                          <div key={i} className="flex items-start text-sm">
                            <Check className="h-4 w-4 mt-0.5 text-primary mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {plan.features.length > 3 && (
                          <div className="text-sm text-muted-foreground">
                            +{plan.features.length - 3} {t("common.moreFeatures")}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleSkipPlan}
                disabled={assignFreePlanMutation.isPending}
              >
                {assignFreePlanMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.processing")}
                  </>
                ) : (
                  t("onboarding.skipToFreePlan")
                )}
              </Button>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            key="step5"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4 text-center"
          >
            <div className="py-8">
              <div className="rounded-full bg-green-100 p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t("onboarding.success")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("onboarding.successMessage")}
              </p>

              <div className="flex flex-col space-y-2">
                <Button onClick={() => setIsOpen(false)}>
                  {t("onboarding.startExploring")}
                </Button>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Step validation: ensure all required fields are filled before allowing next
  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return (
          formData.fullName.trim() !== "" &&
          formData.phone.trim() !== "" &&
          formData.bio.trim() !== "" &&
          formData.city.trim() !== ""
        );
      case 1:
        return formData.selectedSkills.length > 0;
      case 2:
        // Skip validation if phone is already verified
        return user?.phoneVerified || !!formData.phoneVerified;
      case 3:
        return !!formData.selectedPlanId;
      default:
        return true;
    }
  };

  return (
    <>
      {!isCompleted && !isOpen && renderFloatingButton()}

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        // If closed without completion, show floating button
        if (!open && currentStep < 4) {
          setIsCompleted(false);
        }
      }}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle >
              {currentStep < 4
                ? t("onboarding.completeYourProfile")
                : t("onboarding.congratulations")}
            </DialogTitle>
            <DialogDescription>
              {currentStep < 4
                ? t("onboarding.steps", { current: currentStep + 1, total: 4 })
                : t("onboarding.profileCompleted")}
            </DialogDescription>
          </DialogHeader>

          <StepIndicator currentStep={currentStep} totalSteps={4} />

          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>

          <DialogFooter className="flex justify-between">
            {currentStep > 0 && currentStep < 4 ? (
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className={isRTL ? "ml-auto" : "mr-auto"}
              >
                
                {isRTL ? <ArrowRight className="h-4 w-4 mr-2" /> : <ArrowLeft className="h-4 w-4 mr-2" />}
                {t("common.back")}
              </Button>
            ) : (
              <div />
            )}
            
            {currentStep < 4 && (
              <Button
                onClick={() => {
                  switch (currentStep) {
                    case 0:
                      handleBasicInfoSubmit();
                      break;
                    case 1:
                      handleSkillsSubmit();
                      break;
                    case 2:
                      handleVerificationSubmit();
                      break;
                    case 3:
                      handlePlanSubmit();
                      break;
                    default:
                      break;
                  }
                }}
                disabled={
                  !isStepValid() ||
                  updateProfileMutation.isPending ||
                  addSkillMutation.isPending ||
                  submitVerificationMutation.isPending ||
                  subscribePlanMutation.isPending
                }
              >
                {updateProfileMutation.isPending || 
                  addSkillMutation.isPending || 
                  submitVerificationMutation.isPending ||
                  subscribePlanMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-b-2 rounded-full border-white"></div>
                    {t("common.processing")}
                  </div>
                ) : (
                  <>
                    {currentStep === 3 ? t("common.subscribe") : t("common.next")}
                    {isRTL ? <ArrowLeft className="h-4 w-4 ml-2" /> : <ArrowRight className="h-4 w-4 ml-2" />}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}