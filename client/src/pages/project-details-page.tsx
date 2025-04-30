import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, User, Clock, DollarSign, Edit, Trash, Loader2, Paperclip, Download, X, Upload, File as FileIcon, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Project, Proposal } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Import our new components
import {
  ProjectHeader,
  ProjectDetails,
  ProjectFiles,
  ProposalTabs,
  ProposalCard,
  SafeProposal,
  ProjectFile,
} from "@/components/projects";

interface ApiProjectResponse {
  id: number;
  createdAt: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | null;
  clientId: number;
  budget: number;
  category: string;
  deadline: string;
}

interface ApiProposalResponse {
  id: number;
  createdAt: string;
  projectId: number;
  freelancerId: number;
  description: string;
  price: number;
  deliveryTime: number;
  status: 'pending' | 'accepted' | 'rejected' | null;
}

// Type guard functions
function isValidStatus(status: string | null): status is 'pending' | 'accepted' | 'rejected' {
  return status === 'pending' || status === 'accepted' || status === 'rejected';
}

export default function ProjectDetailsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalToEdit, setProposalToEdit] = useState<Proposal | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Add new state variables for project edit/delete
  const [showProjectEditForm, setShowProjectEditForm] = useState(false);
  const [showProjectDeleteDialog, setShowProjectDeleteDialog] = useState(false);
  const [projectEditData, setProjectEditData] = useState<Partial<Project>>({});
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract projectId from URL params
  useEffect(() => {
    const id = params?.id;
    if (id && !isNaN(Number(id))) {
      setProjectId(Number(id));
    } else {
      // Invalid project ID, redirect to projects page
      navigate("/projects");
    }
  }, [params, navigate]);

  // Fetch project details
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await apiRequest("GET", `/api/projects/${projectId}`);
      if (!response) return null;
      const data = await response.json() as ApiProjectResponse;
      return {
        id: data.id,
        createdAt: data.createdAt ? new Date(data.createdAt) : null,
        title: data.title || "",
        description: data.description || "",
        status: data.status as Project["status"] || null,
        clientId: data.clientId,
        budget: data.budget,
        category: parseInt(data.category) || 0,
        deadline: data.deadline ? new Date(data.deadline) : null,
      } as Project;
    },
    enabled: !!projectId,
  });

  // Fetch proposals for this project
  const { data: proposals = [], isLoading: isLoadingProposals } = useQuery({
    queryKey: ["proposals", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      console.log("Fetching proposals for project:", projectId);
      
      // Use different endpoints based on user role
      let endpoint = `/api/projects/${projectId}/proposals`;
      
      // If the user is a freelancer, they might only be able to see their own proposals
      // So let's specifically request all proposals if the user is a freelancer
      if (user?.role === "freelancer") {
        console.log("User is a freelancer, using specific endpoint");
        endpoint = `/api/projects/${projectId}/proposals/all`;
        
        // As a fallback, also fetch their own proposals directly
        try {
          const myProposalsResponse = await apiRequest("GET", "/api/proposals/my");
          if (myProposalsResponse.ok) {
            const myProposals = await myProposalsResponse.json();
            console.log("My proposals:", myProposals);
            // Filter to only get proposals for this project
            const projectProposals = myProposals.filter((p: any) => p.projectId === projectId);
            if (projectProposals.length > 0) {
              return projectProposals.map((proposal: any) => ({
                id: proposal.id,
                createdAt: proposal.createdAt ? new Date(proposal.createdAt) : null,
                projectId: proposal.projectId,
                freelancerId: proposal.freelancerId,
                description: proposal.description || "",
                price: proposal.price,
                deliveryTime: proposal.deliveryTime,
                status: proposal.status as Proposal["status"] || null,
              }));
            }
          }
        } catch (error) {
          console.error("Error fetching my proposals:", error);
        }
      }
      
      const response = await apiRequest("GET", endpoint);
      if (!response.ok) {
        console.error("Failed to fetch proposals:", await response.text());
        return [];
      }
      const data = await response.json() as ApiProposalResponse[];
      console.log("Proposals data:", data);
      if (!Array.isArray(data)) return [];
      return data.map(proposal => ({
        id: proposal.id,
        createdAt: proposal.createdAt ? new Date(proposal.createdAt) : null,
        projectId: proposal.projectId,
        freelancerId: proposal.freelancerId,
        description: proposal.description || "",
        price: proposal.price,
        deliveryTime: proposal.deliveryTime,
        status: proposal.status as Proposal["status"] || null,
      })) as Proposal[];
    },
    enabled: !!projectId,
  });

  // Move these here, after proposals is declared
  // Ensure every user can see proposals
  useEffect(() => {
    if (projectId && user) {
      // Force refetch proposals when the component mounts
      queryClient.invalidateQueries({ queryKey: ["proposals", projectId] });
    }
  }, [projectId, user, queryClient]);

  // Log proposals for debugging
  useEffect(() => {
    if (proposals) {
      console.log(`User ${user?.id} (${user?.role}) can see ${proposals.length} proposals for project ${projectId}`);
    }
  }, [proposals, user, projectId]);

  // Add fetch for project files
  const { data: files = [], isLoading: isLoadingFiles } = useQuery({
    queryKey: ["projectFiles", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await apiRequest("GET", `/api/projects/${projectId}/files`);
      const data = await response.json();
      return data as ProjectFile[];
    },
    enabled: !!projectId
  });

  // Use useEffect to update state when files data changes
  useEffect(() => {
    if (files) {
      setProjectFiles(files);
    }
  }, [files]);

  // Mutation to update proposal status
  const updateProposalStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/proposals/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("proposals.statusUpdated"),
        description: t("proposals.statusUpdatedDescription"),
      });
      
      // Refetch proposals and project (status may have changed)
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      
      setShowConfirmDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("proposals.updateError"),
        variant: "destructive",
      });
    },
  });

  // Edit proposal mutation
  const editProposalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/proposals/${id}`, data);
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to update proposal";
        
        try {
          // Try to parse as JSON if possible
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text or fallback message
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      // Handle empty or invalid JSON responses
      const text = await response.text();
      if (!text) {
        return { success: true }; // Return a valid object if response is empty
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: true }; // Return a valid object if JSON parsing fails
      }
    },
    onSuccess: () => {
      toast({
        title: t("proposals.editSuccess"),
        description: t("proposals.editSuccessDescription"),
      });
      setShowEditForm(false);
      setProposalToEdit(null);
      // Refetch proposals
      queryClient.invalidateQueries({ queryKey: ["proposals", projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("proposals.editError"),
        variant: "destructive",
      });
    }
  });

  // Delete proposal mutation
  const deleteProposalMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/proposals/${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to delete proposal";
        
        try {
          // Try to parse as JSON if possible
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text or fallback message
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      // Handle empty or invalid JSON responses
      const text = await response.text();
      if (!text) {
        return { success: true }; // Return a valid object if response is empty
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: true }; // Return a valid object if JSON parsing fails
      }
    },
    onSuccess: () => {
      toast({
        title: t("proposals.deleteSuccess"),
        description: t("proposals.deleteSuccessDescription"),
      });
      setShowDeleteDialog(false);
      setProposalToEdit(null);
      // Refetch proposals
      queryClient.invalidateQueries({ queryKey: ["proposals", projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("proposals.deleteError"),
        variant: "destructive",
      });
    }
  });

  // Accept proposal handler
  const handleAcceptProposal = async (proposal: SafeProposal) => {
    if (!proposal.id) return;
    setSelectedProposal(proposal);
    updateProposalStatusMutation.mutate({ id: proposal.id, status: 'accepted' });
  };

  // Reject proposal handler
  const handleRejectProposal = async (proposal: SafeProposal) => {
    if (!proposal.id) return;
    setSelectedProposal(proposal);
    updateProposalStatusMutation.mutate({ id: proposal.id, status: 'rejected' });
  };

  // Update navigation to use proper route
  const navigateToChat = (freelancerId: number) => {
    navigate(`/messages?user=${freelancerId}`);
  };

  // Check if the current user has already submitted a proposal
  const hasSubmittedProposal = project && proposals.some(
    (p: Proposal) => user && p.freelancerId === user.id
  );

  // Update user permissions
  const isClient = user?.role === 'client';
  const isFreelancer = user?.role === 'freelancer';
  const isAdmin = user?.role === 'admin' || false;
  const isProjectOwner = project ? user?.id === project.clientId : false;
  // Allow only freelancers who haven't already submitted a proposal
  const canSubmitProposal = isFreelancer && project?.status === 'open' && !hasSubmittedProposal;
  // Show proposals to everyone - clients need to see them to approve
  const canViewProposals = true;

  // Handle edit button click
  const handleEditProposal = (proposal: Proposal) => {
    setProposalToEdit(proposal);
    setShowEditForm(true);
  };

  // Handle delete button click
  const handleDeleteProposal = (proposal: Proposal) => {
    setProposalToEdit(proposal);
    setShowDeleteDialog(true);
  };

  // Handle edit form submission
  const handleEditFormSubmit = (data: any) => {
    if (proposalToEdit) {
      editProposalMutation.mutate({ id: proposalToEdit.id, data });
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (proposalToEdit) {
      deleteProposalMutation.mutate(proposalToEdit.id);
    }
  };

  // Mutation to update project
  const updateProjectMutation = useMutation({
    mutationFn: async (data: Partial<Project>) => {
      if (!projectId) throw new Error("Project ID is required");
      const response = await apiRequest("PATCH", `/api/projects/${projectId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("projects.updateSuccess", { defaultValue: "Project updated" }),
        description: t("projects.updateSuccessDescription", { defaultValue: "Your project has been updated successfully." }),
      });
      // Refetch project details
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setShowProjectEditForm(false);
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
      if (!projectId) throw new Error("Project ID is required");
      const response = await apiRequest("DELETE", `/api/projects/${projectId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("projects.deleteSuccess", { defaultValue: "Project deleted" }),
        description: t("projects.deleteSuccessDescription", { defaultValue: "Your project has been deleted successfully." }),
      });
      // Navigate back to projects page
      navigate("/projects");
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("projects.deleteError", { defaultValue: "Failed to delete project." }),
        variant: "destructive",
      });
    },
  });

  // Handle project edit form submit
  const handleProjectEditSubmit = (data: Partial<Project>) => {
    updateProjectMutation.mutate(data);
  };

  // Handle project delete confirmation
  const handleProjectDeleteConfirm = () => {
    deleteProjectMutation.mutate();
  };

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!projectId || !user) throw new Error("Project ID and user are required");
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('projectId', projectId.toString());
      formData.append('userId', user.id.toString());
      
      const response = await fetch(`/api/files/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type here, it will be set automatically with boundary
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error uploading file");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("projects.fileUploadSuccess", { defaultValue: "Files uploaded" }),
        description: t("projects.fileUploadSuccessDescription", { defaultValue: "Your files have been uploaded successfully." }),
      });
      // Refetch files
      queryClient.invalidateQueries({ queryKey: ["projectFiles", projectId] });
      setFilesToUpload([]);
      setShowFileUploadDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("projects.fileUploadError", { defaultValue: "Failed to upload files." }),
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploadingFile(false);
    }
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest("DELETE", `/api/files/${fileId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("projects.fileDeleteSuccess", { defaultValue: "File deleted" }),
        description: t("projects.fileDeleteSuccessDescription", { defaultValue: "The file has been deleted successfully." }),
      });
      // Refetch files
      queryClient.invalidateQueries({ queryKey: ["projectFiles", projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("projects.fileDeleteError", { defaultValue: "Failed to delete file." }),
        variant: "destructive",
      });
    }
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFilesToUpload(prev => [...prev, ...newFiles]);
    }
  };

  // Handle file upload
  const handleFileUpload = (files: File[]) => {
    if (files.length === 0) return;
    
    setIsUploadingFile(true);
    uploadFileMutation.mutate(files);
  };

  // Handle file delete
  const handleFileDelete = (fileId: number) => {
    deleteFileMutation.mutate(fileId);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Download file
  const downloadFile = async (file: ProjectFile) => {
    try {
      const response = await apiRequest("GET", `/api/files/${file.id}/download`);
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      
      // Append the anchor to body, click it, and remove it
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Release the blob URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: t("common.error"),
        description: t("projects.fileDownloadError", { defaultValue: "Failed to download file." }),
        variant: "destructive",
      });
    }
  };

  // Edit project
  const handleEditProject = () => {
    if (!project) return;
    
    // Check if project has proposals before allowing edit
    if (proposals.length > 0) {
      toast({
        title: t("projects.cannotEdit", { defaultValue: "Cannot edit project" }),
        description: t("projects.cannotEditWithProposals", { defaultValue: "This project already has proposals and cannot be edited." }),
        variant: "destructive"
      });
      return;
    }
    
    setProjectEditData({
      title: project.title,
      description: project.description,
      budget: project.budget,
      category: project.category,
      deadline: project.deadline
    });
    setShowProjectEditForm(true);
  };

  // Delete project
  const handleDeleteProject = () => {
    if (!project) return;
    
    // Check if project has proposals before allowing delete
    if (proposals.length > 0) {
      toast({
        title: t("projects.cannotDelete", { defaultValue: "Cannot delete project" }),
        description: t("projects.cannotDeleteWithProposals", { defaultValue: "This project already has proposals and cannot be deleted." }),
        variant: "destructive"
      });
      return;
    }
    
    setShowProjectDeleteDialog(true);
  };

  // Navigate to submit proposal
  const navigateToSubmitProposal = () => {
    if (!projectId) return;
    navigate(`/projects/${projectId}/proposals/new`);
  };

  if (isLoadingProject || isLoadingProposals || isLoadingFiles) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t("projects.notFound")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t("projects.notFoundDescription")}
          </p>
            <Button onClick={() => navigate("/projects")}>
            {t("projects.backToProjects")}
            </Button>
          </div>
      </div>
    );
  }

  // Format dates
  const deadlineDate = project.deadline ? new Date(project.deadline) : null;
  const formattedDeadline = deadlineDate ? format(deadlineDate, "MMMM d, yyyy") : "";
  const formattedCreatedAt = project.createdAt ? format(new Date(project.createdAt), "MMMM d, yyyy") : "";

  // Project data with strict typing
  const projectTitle = project?.title || "Untitled Project";
  const projectDescription = project?.description || "No description available";
  const projectStatus = project?.status || "Draft";
  const projectBudget = project?.budget || 0;
  const projectDeadline = project?.deadline ? new Date(project.deadline) : new Date();
  const projectCategory = project?.category || "Uncategorized";

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" className="p-2 mr-2" onClick={() => navigate("/projects")}>
              {isRTL ? (
                <ArrowRight className="h-5 w-5" />
              ) : (
                <ArrowLeft className="h-5 w-5" />
              )}
            </Button>
            <h1 className="text-2xl font-bold">{t("projects.details")}</h1>
          </div>
          
          {/* Project Header */}
          <ProjectHeader
            project={project}
            hasSubmittedProposal={hasSubmittedProposal}
            canSubmitProposal={canSubmitProposal}
            canEditProject={isProjectOwner && proposals.length === 0}
            isFreelancer={isFreelancer}
            onNavigateToSubmitProposal={navigateToSubmitProposal}
            onEditProposal={() => {
              const userProposal = proposals.find((p: Proposal) => p.freelancerId === user?.id);
              if (userProposal) handleEditProposal(userProposal);
            }}
            onDeleteProposal={() => {
              const userProposal = proposals.find((p: Proposal) => p.freelancerId === user?.id);
              if (userProposal) handleDeleteProposal(userProposal);
            }}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
          />
          
          <Card className="mb-8">
            {/* Project Details */}
            <ProjectDetails
              project={project}
              isProjectOwner={isProjectOwner}
            />
            
            {/* Project Files */}
            <ProjectFiles
              files={files}
              canUploadFiles={isProjectOwner || isAdmin}
              isLoadingFiles={isLoadingFiles}
              onUploadFiles={handleFileUpload}
              onDownloadFile={downloadFile}
              onDeleteFile={handleFileDelete}
              isUploadingFile={isUploadingFile}
            />
          </Card>
          
          {/* Proposals Tabs */}
          {canViewProposals && (
            <ProposalTabs
              proposals={proposals}
              isLoadingProposals={isLoadingProposals}
              projectStatus={project.status}
              isProjectOwner={isProjectOwner}
              isFreelancer={isFreelancer}
              isAdmin={isAdmin}
              onAcceptProposal={handleAcceptProposal}
              onRejectProposal={handleRejectProposal}
              onNavigateToChat={navigateToChat}
              onEditProposal={handleEditProposal}
              onDeleteProposal={handleDeleteProposal}
            />
          )}
        </div>
      </main>
      <Footer />
      
      {/* Confirm Accept Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("proposals.confirmAccept")}</DialogTitle>
            <DialogDescription>
              {t("proposals.confirmAcceptDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => {}}>
              {updateProposalStatusMutation.isPending ? (
                <span>{t("common.processing")}...</span>
              ) : (
                t("common.confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Proposal Dialog */}
      {proposalToEdit && (
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{t("proposals.edit")}</DialogTitle>
              <DialogDescription>
                {t("proposals.editDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("proposals.description")}</label>
                <Textarea 
                  defaultValue={proposalToEdit.description}
                  id="edit-description"
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("proposals.price")}</label>
                  <Input 
                    type="number" 
                    defaultValue={proposalToEdit.price}
                    id="edit-price"
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("proposals.deliveryTime")}</label>
                  <Input 
                    type="number" 
                    defaultValue={proposalToEdit.deliveryTime}
                    id="edit-delivery-time"
                    min={1}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditForm(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={() => {
                const description = (document.getElementById('edit-description') as HTMLTextAreaElement)?.value;
                const price = Number((document.getElementById('edit-price') as HTMLInputElement)?.value);
                const deliveryTime = Number((document.getElementById('edit-delivery-time') as HTMLInputElement)?.value);
                
                handleEditFormSubmit({ description, price, deliveryTime });
              }} disabled={editProposalMutation.isPending}>
                {editProposalMutation.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Proposal Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("proposals.confirmDelete")}</DialogTitle>
            <DialogDescription>
              {t("proposals.confirmDeleteDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteProposalMutation.isPending}>
              {deleteProposalMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Edit Dialog */}
      <Dialog open={showProjectEditForm} onOpenChange={setShowProjectEditForm}>
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
            <Button variant="outline" onClick={() => setShowProjectEditForm(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => {
              const title = (document.getElementById('edit-title') as HTMLInputElement)?.value;
              const description = (document.getElementById('edit-description') as HTMLTextAreaElement)?.value;
              const budget = Number((document.getElementById('edit-budget') as HTMLInputElement)?.value);
              const deadlineStr = (document.getElementById('edit-deadline') as HTMLInputElement)?.value;
              const deadline = deadlineStr ? new Date(deadlineStr) : null;
              
              handleProjectEditSubmit({ title, description, budget, deadline });
            }} disabled={updateProjectMutation.isPending}>
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
    </div>
  );
}