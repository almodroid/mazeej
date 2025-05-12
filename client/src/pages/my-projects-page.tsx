import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Project, Proposal } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { AlertCircle, Edit, Loader2, Plus, Search, Star, Trash } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";

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
  const [, navigate] = useLocation();
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
  
  // Project edit/delete state
  const [showProjectEditDialog, setShowProjectEditDialog] = useState(false);
  const [showProjectDeleteDialog, setShowProjectDeleteDialog] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectEditData, setProjectEditData] = useState<Partial<Project>>({});

  // Fetch client projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !!user && user.role === "client",
  });

  // Filter to only show user's projects
  const clientProjects = projects.filter(project => 
    user && project.clientId === user.id
  );
  
  // Fetch proposals for all projects to determine if they can be edited/deleted
  const { data: projectProposals = {} } = useQuery<Record<number, Proposal[]>>({  
    queryKey: ["/api/projects/proposals"],
    queryFn: async () => {
      // Create an object to store proposals for each project
      const proposalsByProject: Record<number, Proposal[]> = {};
      
      // Fetch proposals for each project
      await Promise.all(clientProjects.map(async (project) => {
        try {
          const response = await fetch(`/api/projects/${project.id}/proposals`);
          if (response.ok) {
            const proposals = await response.json();
            proposalsByProject[project.id] = proposals;
          } else {
            proposalsByProject[project.id] = [];
          }
        } catch (error) {
          console.error(`Error fetching proposals for project ${project.id}:`, error);
          proposalsByProject[project.id] = [];
        }
      }));
      
      return proposalsByProject;
    },
    enabled: clientProjects.length > 0
  });
  
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

  // Mutation to update project
  const updateProjectMutation = useMutation({
    mutationFn: async (data: Partial<Project>) => {
      if (!projectToEdit?.id) throw new Error("Project ID is required");
      const response = await apiRequest("PATCH", `/api/projects/${projectToEdit.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("projects.updateSuccess", { defaultValue: "Project updated" }),
        description: t("projects.updateSuccessDescription", { defaultValue: "Your project has been updated successfully." }),
      });
      // Refetch projects
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowProjectEditDialog(false);
      setProjectToEdit(null);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("projects.updateError", { defaultValue: "Failed to update project." }),
        variant: "destructive",
      });
    },
  });

  // Mutation to delete project
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      if (!projectToEdit?.id) throw new Error("Project ID is required");
      const response = await apiRequest("DELETE", `/api/projects/${projectToEdit.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("projects.deleteSuccess", { defaultValue: "Project deleted" }),
        description: t("projects.deleteSuccessDescription", { defaultValue: "Your project has been deleted successfully." }),
      });
      // Refetch projects
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowProjectDeleteDialog(false);
      setProjectToEdit(null);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("projects.deleteError", { defaultValue: "Failed to delete project." }),
        variant: "destructive",
      });
    },
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

  // Handle edit project click
  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setProjectEditData({
      title: project.title,
      description: project.description,
      budget: project.budget,
      deadline: project.deadline
    });
    setShowProjectEditDialog(true);
  };

  // Handle delete project click
  const handleDeleteProject = (project: Project) => {
    setProjectToEdit(project);
    setShowProjectDeleteDialog(true);
  };

  // Handle project edit form submit
  const handleProjectEditSubmit = () => {
    const title = (document.getElementById('edit-title') as HTMLInputElement)?.value;
    const description = (document.getElementById('edit-description') as HTMLTextAreaElement)?.value;
    const budget = Number((document.getElementById('edit-budget') as HTMLInputElement)?.value);
    const deadlineStr = (document.getElementById('edit-deadline') as HTMLInputElement)?.value;
    const deadline = deadlineStr ? new Date(deadlineStr) : null;
    
    updateProjectMutation.mutate({ title, description, budget, deadline });
  };

  // Handle project delete confirmation
  const handleProjectDeleteConfirm = () => {
    deleteProjectMutation.mutate();
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
              "bg-white dark:bg-gray-900",
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
                          <h3 className="font-medium text-neutral-900 dark:text-white group-hover:text-gray-200">{project.title}</h3>
                          {project.status && getStatusBadge(project.status)}
                        </div>
                        <p className="text-neutral-600 dark:text-gray-300 text-sm line-clamp-2 mb-2 group-hover:text-gray-200">
                          {project.description}
                        </p>
                        <div className={cn(
                          "flex justify-between items-center text-sm text-neutral-500 dark:text-gray-400 mb-3 group-hover:text-gray-200",
                          isRTL && "flex-row"
                        )}>
                          <span>${project.budget}</span>
                          <span>{project.createdAtDisplay}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          {project.status === 'in_progress' && user && user.role === 'client' && (
                              <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
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
                          
                          {/* Edit and Delete buttons - only show if project has no proposals */}
                          {(project.status === 'open' || project.status === 'pending') && (
                            <div className="flex gap-2 ml-auto">
                              {/* Check if project has no proposals before showing edit/delete buttons */}
                              {(!projectProposals[project.id] || projectProposals[project.id].length === 0) ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="px-2"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleEditProject(project);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    {t("common.edit", { defaultValue: "Edit" })}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="px-2 text-red-500 hover:text-red-700"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteProject(project);
                                    }}
                                  >
                                    <Trash className="h-4 w-4 mr-1" />
                                    {t("common.delete", { defaultValue: "Delete" })}
                                  </Button>
                                </>
                              ) : (
                                <span className="text-sm text-gray-500 italic">
                                  {t("myProjects.cannotEditWithProposals", { defaultValue: "Cannot edit (has proposals)" })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );

                    return (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="block hover:bg-neutral-50 dark:hover:bg-gray-800">
                           {projectCardContent}
                        </div>
                      </Link>
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

      {/* Project Edit Dialog */}
      <Dialog open={showProjectEditDialog} onOpenChange={setShowProjectEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("projects.edit", { defaultValue: "Edit Project" })}</DialogTitle>
            <DialogDescription>
              {t("projects.editDescription", { defaultValue: "Update your project details" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("projects.title")}</label>
              <Input 
                defaultValue={projectEditData.title}
                id="edit-title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("projects.description")}</label>
              <Textarea 
                defaultValue={projectEditData.description}
                id="edit-description"
                className="min-h-[150px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("projects.budget")}</label>
                <Input 
                  type="number" 
                  defaultValue={projectEditData.budget}
                  id="edit-budget"
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("projects.deadline")}</label>
                <Input 
                  type="date" 
                  defaultValue={projectEditData.deadline ? new Date(projectEditData.deadline).toISOString().split('T')[0] : undefined}
                  id="edit-deadline"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProjectEditDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleProjectEditSubmit} disabled={updateProjectMutation.isPending}>
              {updateProjectMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("common.saving")}</>
              ) : (
                t("common.save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Delete Confirmation Dialog */}
      <Dialog open={showProjectDeleteDialog} onOpenChange={setShowProjectDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("projects.confirmDelete", { defaultValue: "Delete Project" })}</DialogTitle>
            <DialogDescription>
              {t("projects.confirmDeleteDescription", { defaultValue: "Are you sure you want to delete this project? This action cannot be undone." })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProjectDeleteDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleProjectDeleteConfirm} disabled={deleteProjectMutation.isPending}>
              {deleteProjectMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("common.deleting")}</>
              ) : (
                t("common.delete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}