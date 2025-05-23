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
  ArrowLeft
} from "lucide-react";
import { PhoneVerification } from "@/components/onboarding/phone-verification";

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
  });

  // Check if onboarding is completed
  const checkOnboardingStatus = () => {
    // Check if user has completed the necessary fields for onboarding
    const hasCompletedBasicInfo = user?.fullName && user?.bio && user?.city;
    const hasPhoneVerified = user?.phoneVerified;
    
    // If user has skills, they've likely completed that step
    const hasSkills = formData.selectedSkills && formData.selectedSkills.length > 0;
    
    // Set completed status based on these checks
    const isOnboardingCompleted = Boolean(hasCompletedBasicInfo && hasPhoneVerified && hasSkills);
    setIsCompleted(isOnboardingCompleted);
    
    // If not completed and not already open, show the floating button
    if (!isOnboardingCompleted && !isOpen) {
      // Determine which step to start with
      let startStep = 0;
      if (hasCompletedBasicInfo) startStep = 1;
      if (hasCompletedBasicInfo && hasSkills) startStep = 2;
      
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
    const isNewFreelancer = !user?.bio && (!formData.selectedSkills || formData.selectedSkills.length === 0);
    
    if (!onboardingCompleted && isNewFreelancer) {
      // Small delay to ensure the component is fully mounted
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

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
      
      if (currentStep < 2) {
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
      
      // Move to the next step
      setCurrentStep(3);
      setIsCompleted(true);
    },
    onError: (error: Error) => {
      toast({
        title: t("verification.verificationFailed"),
        description: error.message,
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
        return !!formData.phoneVerified;
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
        if (!open && currentStep < 3) {
          setIsCompleted(false);
        }
      }}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {currentStep < 3
                ? t("onboarding.completeYourProfile")
                : t("onboarding.congratulations")}
            </DialogTitle>
            <DialogDescription>
              {currentStep < 3
                ? t("onboarding.steps", { current: currentStep + 1, total: 3 })
                : t("onboarding.profileCompleted")}
            </DialogDescription>
          </DialogHeader>

          <StepIndicator currentStep={currentStep} totalSteps={3} />

          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>

          <DialogFooter className="flex justify-between">
            {currentStep > 0 && currentStep < 3 ? (
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className={isRTL ? "ml-auto" : "mr-auto"}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t("common.back")}
              </Button>
            ) : (
              <div />
            )}
            
            {currentStep < 3 && (
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
                    default:
                      break;
                  }
                }}
                disabled={
                  !isStepValid() ||
                  updateProfileMutation.isPending ||
                  addSkillMutation.isPending ||
                  submitVerificationMutation.isPending
                }
              >
                {updateProfileMutation.isPending || addSkillMutation.isPending || submitVerificationMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-b-2 rounded-full border-white"></div>
                    {t("common.processing")}
                  </div>
                ) : (
                  <>
                    {currentStep === 2 ? t("common.submit") : t("common.next")}
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