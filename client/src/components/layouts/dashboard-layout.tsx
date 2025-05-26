import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import DashboardFooter from "@/components/dashboard/dashboard-footer";
import FreelancerOnboardingWizard from "@/components/onboarding/freelancer-onboarding-wizard";
import { cn } from "@/lib/utils";
import EvaluationBubble from "@/components/evaluation/evaluation-bubble";
import EvaluationModal from "@/components/evaluation/evaluation-modal";
import { evaluationService } from "@/lib/evaluation-service";
import { EvaluationQuestion } from "@/lib/evaluation-service";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skill } from "@shared/schema";
import { Toaster } from "@/components/ui/toaster";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const saved = localStorage.getItem('evaluationTimeRemaining');
    return saved ? parseInt(saved) : 0;
  });
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluationQuestions, setEvaluationQuestions] = useState<EvaluationQuestion[]>([]);
  const [evaluationAnswers, setEvaluationAnswers] = useState<number[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [lastPauseTime, setLastPauseTime] = useState<number | null>(null);
  const [cooldownTime, setCooldownTime] = useState(() => {
    if (!user) return 0;
    const savedCooldown = localStorage.getItem(`evaluationCooldown_${user.id}`);
    if (savedCooldown) {
      const cooldownEnd = parseInt(savedCooldown);
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, cooldownEnd - now);
    }
    return 0;
  });

  // Fixed cooldown duration of 14 days in seconds
  const COOLDOWN_DURATION = 14 * 24 * 60 * 60;
  
  // Determine if RTL
  const isRTL = i18n.language === 'ar';
  
  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [isRTL, i18n.language]);

  // Central timer management with faster time when modal is closed
  useEffect(() => {
    if (!isEvaluating) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleEvaluationComplete({ score: 0, level: 'beginner' });
          return 0;
        }
        // Run 2x faster when modal is closed
        const timeToDeduct = showEvaluationModal ? 1 : 2;
        const newTime = Math.max(0, prev - timeToDeduct);
        // Save to localStorage to ensure sync
        if (isEvaluating) {
          localStorage.setItem('evaluationTimeRemaining', newTime.toString());
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isEvaluating, showEvaluationModal]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isEvaluating && !isPaused) {
        setLastPauseTime(Date.now());
        setIsPaused(true);
      } else if (!document.hidden && isEvaluating && isPaused) {
        const timeAway = Date.now() - (lastPauseTime || Date.now());
        // Reduce time by 5x the time spent away (more aggressive)
        const timeToDeduct = Math.floor(timeAway / 200); // 200ms = 5x faster
        setTimeRemaining(prev => Math.max(0, prev - timeToDeduct));
        setLastPauseTime(null);
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isEvaluating, isPaused, lastPauseTime]);

  // Handle cooldown timer
  useEffect(() => {
    if (cooldownTime <= 0 || !user) return;

    const timer = setInterval(() => {
      setCooldownTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem(`evaluationCooldown_${user.id}`);
          return 0;
        }
        const newTime = prev - 1;
        // Save the end time to localStorage with user ID
        const cooldownEnd = Math.floor(Date.now() / 1000) + newTime;
        localStorage.setItem(`evaluationCooldown_${user.id}`, cooldownEnd.toString());
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownTime, user]);

  const handleStartEvaluation = async () => {
    if (!user) return;

    try {
      const userSkillsResponse = await apiRequest('GET', `/api/users/${user.id}/skills`);
      if (!userSkillsResponse.ok) {
        throw new Error('Failed to fetch user skills');
      }
      const skills: Skill[] = await userSkillsResponse.json();

      if (!skills.length) {
        toast({
          title: t("common.error"),
          description: t("evaluation.addSkillsError"),
          variant: "destructive",
        });
        return;
      }

      const categories = Array.from(new Set(skills.map(skill => skill.categoryId)));
      const skillIds = skills.map(skill => skill.id);
      
      const questions = await evaluationService.getQuestions(categories, skillIds);

      if (!questions || questions.length === 0) {
        throw new Error('No questions available for the selected skills');
      }

      setEvaluationQuestions(questions);
      setShowEvaluationModal(true);
      setIsEvaluating(true);
      setTimeRemaining(30 * 60); // 30 minutes
      setIsPaused(false);
      setLastPauseTime(null);
      localStorage.setItem('evaluationInProgress', 'true');
    } catch (error) {
      console.error('Error starting evaluation:', error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("evaluation.errorStarting"),
        variant: "destructive",
      });
    }
  };

  // Determine if any bubble is visible
  const isAnyBubbleVisible = user?.role === 'freelancer' && (isEvaluating || cooldownTime > 0);

  // Custom toast function that considers bubble visibility
  const showToast = ({ title, description, variant }: { title: string; description: string; variant?: "default" | "destructive" }) => {
    toast({
      title,
      description,
      variant,
      className: isAnyBubbleVisible ? "bottom-24" : "bottom-4"
    });
  };

  const handleEvaluationComplete = async (results: { score: number; level: string }) => {
    if (!user) return;
    
    try {
      const response = await evaluationService.submitEvaluation(user.id, {
        categoryId: evaluationQuestions[0].categoryId,
        skillId: evaluationQuestions[0].skillId,
        answers: evaluationQuestions.map((q, index) => ({
          questionId: q.id,
          selectedAnswer: evaluationAnswers[index] || 0
        }))
      });
      
      // Set cooldown when exam is completed
      const cooldownEnd = Math.floor(Date.now() / 1000) + COOLDOWN_DURATION;
      localStorage.setItem(`evaluationCooldown_${user.id}`, cooldownEnd.toString());
      setCooldownTime(COOLDOWN_DURATION);
      
      setIsEvaluating(false);
      setShowEvaluationModal(false);
      setEvaluationProgress(0);
      setTimeRemaining(0);
      setIsPaused(false);
      setLastPauseTime(null);
      localStorage.removeItem('evaluationTimeRemaining');
      localStorage.removeItem('evaluationInProgress');
      
      showToast({
        title: t("evaluation.completed"),
        description: t("evaluation.levelUpdated", { level: response.level })
      });
    } catch (error) {
      console.error('Error completing evaluation:', error);
      showToast({
        title: t("common.error"),
        description: t("evaluation.errorUpdating"),
        variant: "destructive"
      });
    }
  };

  const handlePauseEvaluation = () => {
    setIsPaused(true);
    setLastPauseTime(Date.now());
    setShowEvaluationModal(false);
  };

  const handleContinueEvaluation = () => {
    if (lastPauseTime) {
      const timeAway = Date.now() - lastPauseTime;
      // Reduce time by 5x the time spent away (more aggressive)
      const timeToDeduct = Math.floor(timeAway / 200); // 200ms = 5x faster
      setTimeRemaining(prev => Math.max(0, prev - timeToDeduct));
    }
    setLastPauseTime(null);
    setIsPaused(false);
    // Ensure modal opens with the exact same time
    setShowEvaluationModal(true);
  };

  const handleExitEvaluation = () => {
    if (cooldownTime > 0 || !user) return;
    
    setIsEvaluating(false);
    setShowEvaluationModal(false);
    setEvaluationProgress(0);
    setTimeRemaining(0);
    setIsPaused(false);
    setLastPauseTime(null);
    localStorage.removeItem('evaluationTimeRemaining');
    localStorage.removeItem('evaluationInProgress');
    
    showToast({
      title: t("evaluation.exited"),
      description: t("evaluation.exitedMessage")
    });
  };

  if (!user) return null;

  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-background text-foreground",
      isRTL && "rtl"
    )}>
      <DashboardHeader onMobileMenuOpen={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <div className="flex-grow flex">
        <DashboardSidebar />
        <main className={cn(
          "flex-grow p-6 overflow-x-hidden flex flex-col bg-background",
          isRTL && "rtl"
        )}>
          <div className="max-w-7xl mx-auto w-full flex-grow">
            {children}
          </div>
          <DashboardFooter />
        </main>
      </div>
      
      {/* Floating components container */}
      <div className="fixed bottom-0 right-0 z-50 flex flex-col items-end gap-4 p-4">
        {/* Evaluation components */}
        {user.role === 'freelancer' && (
          <div className="flex items-center gap-4">
            <EvaluationBubble
              isEvaluating={isEvaluating}
              progress={evaluationProgress}
              timeRemaining={timeRemaining}
              onStartEvaluation={handleStartEvaluation}
              onContinueEvaluation={handleContinueEvaluation}
              onExitEvaluation={handleExitEvaluation}
              isPaused={isPaused}
              isModalOpen={showEvaluationModal}
              cooldownTime={cooldownTime}
            />
            
            <EvaluationModal
              isOpen={showEvaluationModal}
              onClose={() => setShowEvaluationModal(false)}
              questions={evaluationQuestions}
              timeLimit={30 * 60}
              onComplete={handleEvaluationComplete}
              onPause={handlePauseEvaluation}
              isPaused={isPaused}
              timeRemaining={timeRemaining}
              isEvaluating={isEvaluating}
            />

            {/* Show onboarding wizard for freelancers */}
            <FreelancerOnboardingWizard />
          </div>
        )}
      </div>

      {/* Toast container */}
      <Toaster />
    </div>
  );
} 