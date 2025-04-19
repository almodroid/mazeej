import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Project, Proposal } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { AlertCircle, Plus, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { projectApi, reviewApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Placeholder type for Review data - adjust as per actual schema/API
interface ReviewInput {
  projectId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  comment: string;
}

export default function MyProjectsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [projectToReview, setProjectToReview] = useState<Project | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [freelancerId, setFreelancerId] = useState<number | null>(null);
  const [isPortfolioDialogOpen, setIsPortfolioDialogOpen] = useState(false);
  const [portfolioProjects, setPortfolioProjects] = useState([]);
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    description: '',
    link: '',
    date: '',
    image: null
  });

  // Fetch client projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !!user && user.role === "client",
  });

  // Filter to only show user's projects
  const clientProjects = projects.filter(project => 
    user && project.clientId === user.id
  );
  
  // Fetch accepted proposal to get freelancer ID when a project is selected for review
  useQuery<Proposal[]>({
    queryKey: ["/api/projects", projectToReview?.id, "proposals"],
    enabled: !!projectToReview,
    queryFn: async () => {
      if (!projectToReview) return [];
      // Fetch accepted proposals for this project
      const response = await fetch(`/api/projects/${projectToReview.id}/proposals?status=accepted`);
      if (!response.ok) throw new Error("Failed to fetch proposals");
      const proposals = await response.json();
      // Set the freelancer ID from the accepted proposal
      if (proposals.length > 0) {
        setFreelancerId(proposals[0].freelancerId);
      }
      return proposals;
    }
  });

  // Format the date based on the current language
  const formatDate = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: i18n.language === 'ar' ? ar : enUS,
    });
  };

  // Map status to badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">{t("project.statusOpen")}</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">{t("project.statusInProgress")}</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">{t("project.statusCompleted")}</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">{t("project.statusCancelled")}</Badge>;
      default:
        return null;
    }
  };

  // Filter projects based on search term and active tab
  const filteredProjects = clientProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && project.status === activeTab;
  });

  // Map projects for display, handling potential null createdAt
  const displayProjects = filteredProjects.map(project => {
    const createdAtDisplay = project.createdAt 
      ? formatDate(new Date(project.createdAt as unknown as string)) 
      : "";
    
    return {
      ...project,
      createdAtDisplay
    };
  });

  // --- Mutations ---

  // Mutation to update project status
  const updateStatusMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return await projectApi.updateProjectStatus(projectId, 'completed');
    },
    onSuccess: (data, projectId) => {
      // Invalidate projects query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      // Find the project for review
      const project = clientProjects.find(p => p.id === projectId);
      if (project) {
        setProjectToReview(project);
        setRating(0);
        setComment("");
        setIsReviewDialogOpen(true);
        
        // Show success notification
        toast({
          title: t("myProjects.statusUpdated"),
          description: t("myProjects.projectCompleted"),
        });
      }
    },
    onError: (error) => {
      console.error("Error updating project status:", error);
      toast({
        title: t("common.error"),
        description: t("myProjects.errorUpdatingStatus"),
        variant: "destructive",
      });
    }
  });

  // Mutation to submit a review
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: ReviewInput) => {
      return await reviewApi.submitReview(reviewData);
    },
    onSuccess: () => {
      // Invalidate projects query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      // Close the review dialog
      setIsReviewDialogOpen(false);
      
      // Show success notification
      toast({
        title: t("myProjects.reviewSubmitted"),
        description: t("myProjects.reviewSubmittedSuccess"),
      });
    },
    onError: (error) => {
      console.error("Error submitting review:", error);
      toast({
        title: t("common.error"),
        description: t("myProjects.errorSubmittingReview"),
        variant: "destructive",
      });
    }
  });

  // Handle review submission
  const handleReviewSubmit = () => {
    if (!projectToReview || !freelancerId || !user) return;

    submitReviewMutation.mutate({
      projectId: projectToReview.id,
      reviewerId: user.id,
      revieweeId: freelancerId,
      rating,
      comment
    });
  };

  // Handle finalize project click
  const handleFinalizeClick = (projectId: number) => {
    updateStatusMutation.mutate(projectId);
  };

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  const isRTL = i18n.language === "ar";

  if (!user || user.role !== "client") {
    return null;
  }

  return (
    <DashboardLayout>
      <div className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between mb-6",
        isRTL && "md:flex-row"
      )}>
        <h1 className="text-3xl font-cairo font-bold mb-4 md:mb-0">
          {t("myProjects.title")}
        </h1>
        <Link href="/projects/create">
          <Button className={cn(
            "flex items-center",
            isRTL && "flex-row"
          )}>
            <Plus className={isRTL ? "ml-2" : "mr-2"} size={16} />
            {t("myProjects.createNew")}
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className={cn(
            "absolute top-1/2 transform -translate-y-1/2 text-neutral-400",
            isRTL ? "right-3" : "left-3"
          )} size={18} />
          <Input 
            className={cn(
              "bg-white",
              isRTL ? "pr-10" : "pl-10"
            )}
            placeholder={t("myProjects.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab} dir={isRTL ? "rtl" : "ltr"}>
        <TabsList className={cn("mb-6", isRTL && "flex-row")}>
          <TabsTrigger value="all">{t("myProjects.all")}</TabsTrigger>
          <TabsTrigger value="open">{t("myProjects.open")}</TabsTrigger>
          <TabsTrigger value="in_progress">{t("myProjects.inProgress")}</TabsTrigger>
          <TabsTrigger value="completed">{t("myProjects.completed")}</TabsTrigger>
          <TabsTrigger value="cancelled">{t("myProjects.cancelled")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>{t("myProjects.projectsCount", { count: filteredProjects.length })}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>{t("common.loading")}</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 flex flex-col items-center">
                  <AlertCircle className="h-12 w-12 text-neutral-300 mb-4" />
                  <p>{t("myProjects.noProjects")}</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {displayProjects.map((project) => {
                    const projectCardContent = (
                      <div className="p-4 transition-colors group">
                        <div className={cn(
                          "flex justify-between items-start mb-2",
                          isRTL && "flex-row"
                        )}>
                          <h3 className="font-medium text-neutral-900 group-hover:text-blue-600">{project.title}</h3>
                          {project.status && getStatusBadge(project.status)}
                        </div>
                        <p className="text-neutral-600 text-sm line-clamp-2 mb-2">
                          {project.description}
                        </p>
                        <div className={cn(
                          "flex justify-between items-center text-sm text-neutral-500 mb-3",
                          isRTL && "flex-row"
                        )}>
                          <span>${project.budget}</span>
                          <span>{project.createdAtDisplay}</span>
                        </div>
                        {project.status === 'in_progress' && user && user.role === 'client' && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleFinalizeClick(project.id);
                                }}
                                disabled={updateStatusMutation.isPending}
                            >
                                {updateStatusMutation.isPending && updateStatusMutation.variables === project.id
                                    ? t("common.loading")
                                    : t("myProjects.finalizeProject")
                                }
                            </Button>
                        )}
                      </div>
                    );

                    return project.status !== 'in_progress' ? (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="block hover:bg-neutral-50">
                           {projectCardContent}
                        </div>
                      </Link>
                    ) : (
                      <div key={project.id} className="block border-b border-neutral-200 last:border-b-0">
                         {projectCardContent}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("myProjects.reviewDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("myProjects.reviewDialog.description", { projectTitle: projectToReview?.title })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rating" className="text-right">
                {t("myProjects.reviewDialog.rating")}
              </Label>
              <div className="col-span-3 flex space-x-1">
                 {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-6 w-6 cursor-pointer",
                        rating >= star ? "text-yellow-400 fill-yellow-400" : "text-neutral-300"
                      )}
                      onClick={() => setRating(star)}
                    />
                 ))}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comment" className="text-right">
                 {t("myProjects.reviewDialog.comment")}
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="col-span-3"
                placeholder={t("myProjects.reviewDialog.commentPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
                onClick={handleReviewSubmit}
                disabled={submitReviewMutation.isPending || rating === 0}
            >
               {submitReviewMutation.isPending
                    ? t("common.submitting")
                    : t("myProjects.reviewDialog.submit")
               }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}