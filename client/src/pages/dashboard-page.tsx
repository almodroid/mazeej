import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import StatCard from "@/components/dashboard/stat-card";
import RecentProjects from "@/components/dashboard/recent-projects";
import RecentProposals from "@/components/dashboard/recent-proposals";
import DashboardNotifications from "@/components/dashboard/dashboard-notifications";
import PlanBanner from "@/components/dashboard/plan-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project, Proposal, Skill } from "@shared/schema";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {SaudiRiyal } from "lucide-react";
import EvaluationBubble from "@/components/evaluation/evaluation-bubble";
import EvaluationModal from "@/components/evaluation/evaluation-modal";
import { evaluationService } from "@/lib/evaluation-service";
import { EvaluationQuestion } from "@/lib/evaluation-service";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [debug, setDebug] = useState<Record<string, any>>({});
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
    const savedCooldown = localStorage.getItem('evaluationCooldown');
    if (savedCooldown) {
      const cooldownEnd = parseInt(savedCooldown);
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, cooldownEnd - now);
    }
    return 0;
  });
  const COOLDOWN_DURATION = 24 * 60 * 60; // 24 hours in seconds

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

  // Load saved time when component mounts
  useEffect(() => {
    if (isEvaluating) {
      const savedTime = localStorage.getItem('evaluationTimeRemaining');
      if (savedTime) {
        setTimeRemaining(parseInt(savedTime));
      }
    }
  }, [isEvaluating]);

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
    if (cooldownTime <= 0) return;

    const timer = setInterval(() => {
      setCooldownTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem('evaluationCooldown');
          return 0;
        }
        const newTime = prev - 1;
        // Save the end time to localStorage
        const cooldownEnd = Math.floor(Date.now() / 1000) + newTime;
        localStorage.setItem('evaluationCooldown', cooldownEnd.toString());
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownTime]);

  // Fetch all projects
  const { data: allProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      setDebug((prev: Record<string, any>) => ({ ...prev, allProjects: data }));
      return data;
    },
    enabled: !!user,
  });

  // Filter projects by client ID for client users
  const clientProjects = user?.role === 'client' 
    ? allProjects.filter(p => p.clientId === user.id)
    : [];

  // Fetch user's proposals (for freelancers)
  const { data: freelancerProposals = [] } = useQuery<Proposal[]>({
    queryKey: ["/api/proposals/my"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/proposals/my");
      if (!response.ok) {
        throw new Error("Failed to fetch freelancer proposals");
      }
      const data = await response.json();
      setDebug((prev: Record<string, any>) => ({ ...prev, freelancerProposals: data }));
      return data;
    },
    enabled: !!user && user.role === "freelancer",
  });

  // Get projects that the freelancer is engaged in (through accepted proposals)
  const freelancerProjects = user?.role === "freelancer" 
    ? allProjects.filter(project => 
        freelancerProposals.some(
          proposal => proposal.projectId === project.id && proposal.status === "accepted"
        )
      )
    : [];

  // Fetch financial data if user is a freelancer
  const { data: earnings = { total: 0, pending: 0 } } = useQuery({
    queryKey: ["/api/earnings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/earnings");
      if (!response.ok) {
        throw new Error("Failed to fetch earnings");
      }
      return response.json();
    },
    enabled: !!user && user.role === "freelancer",
  });

  // Fetch payment data if user is a client
  const { data: payments = { total: 0, pending: 0 } } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/payments");
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      return response.json();
    },
    enabled: !!user && user.role === "client",
  });

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Define RTL state based on language
  const isRTL = i18n.language === "ar";

  // Get user's projects based on role
  const userProjects = user?.role === "client" ? clientProjects : freelancerProjects;
 
  // Calculate stats based on user's role and their own data
  const activeProjects = userProjects.filter(p => p.status === "in_progress").length;
  const completedProjects = userProjects.filter(p => p.status === "completed").length;
  
  const pendingProposals = freelancerProposals.filter(p => p.status === "pending").length;
  
  const totalEarnings = user?.role === "freelancer" 
    ? earnings.total
    : payments.total;

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
          description: t("You must add at least one skill to start the evaluation."),
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
      
      setIsEvaluating(false);
      setShowEvaluationModal(false);
      setEvaluationProgress(0);
      setTimeRemaining(0);
      setIsPaused(false);
      setLastPauseTime(null);
      localStorage.removeItem('evaluationTimeRemaining');
      localStorage.removeItem('evaluationInProgress');
      
      toast({
        title: t("evaluation.completed"),
        description: t("evaluation.levelUpdated", { level: response.level }),
      });
    } catch (error) {
      console.error('Error completing evaluation:', error);
      toast({
        title: t("common.error"),
        description: t("evaluation.errorUpdating"),
        variant: "destructive",
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
    if (cooldownTime > 0) return;

    const cooldownEnd = Math.floor(Date.now() / 1000) + COOLDOWN_DURATION;
    localStorage.setItem('evaluationCooldown', cooldownEnd.toString());
    setCooldownTime(COOLDOWN_DURATION);
    
    setIsEvaluating(false);
    setShowEvaluationModal(false);
    setEvaluationProgress(0);
    setTimeRemaining(0);
    setIsPaused(false);
    setLastPauseTime(null);
    localStorage.removeItem('evaluationTimeRemaining');
    localStorage.removeItem('evaluationInProgress');
    
    toast({
      title: t("evaluation.exited"),
      description: t("evaluation.cooldownMessage", { hours: 24 }),
    });
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-cairo font-bold mb-6">
        {t("dashboard.welcomeBack")} {user.fullName || user.username}
      </h1>

      {/* Show the plan banner only for freelancers */}
      {user.role === "freelancer" && <PlanBanner />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title={t("dashboard.activeProjects")} 
          value={activeProjects.toString()} 
          icon="briefcase" 
          trend="up" 
        />
        <StatCard 
          title={t("dashboard.completedProjects")} 
          value={completedProjects.toString()} 
          icon="check-circle" 
          trend="neutral" 
        />
        <StatCard 
          title={user.role === "freelancer" ? t("dashboard.pendingProposals") : t("dashboard.pendingRequests")} 
          value={user.role === "freelancer" ? pendingProposals.toString() : "0"} 
          icon="file-text" 
          trend={pendingProposals > 0 ? "up" : "down"} 
        />
        <StatCard 
          title={user.role === "freelancer" ? t("dashboard.totalEarnings") : t("dashboard.totalSpending")} 
          value={`${totalEarnings} ${t('common.riyal')}`} 
          icon="saudi-sign" 
          trend="up" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="projects" className="w-full" dir={isRTL ? "rtl" : "ltr"}>
            <TabsList>
              <TabsTrigger value="projects">
                {t("dashboard.myProjects")}
              </TabsTrigger>
              {user.role === "freelancer" && (
                <TabsTrigger value="proposals">{t("dashboard.recentProposals")}</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="projects" className="mt-4">
              <RecentProjects projects={userProjects.slice(0, 5)} />
            </TabsContent>
            {user.role === "freelancer" && (
              <TabsContent value="proposals" className="mt-4">
                <RecentProposals proposals={freelancerProposals.slice(0, 5)} />
              </TabsContent>
            )}
          </Tabs>
        </div>
        <div>
          <DashboardNotifications />
        </div>
      </div>
      
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
    </DashboardLayout>
  );
}
