import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, User, Clock, Calendar, DollarSign, Edit, Trash, Loader2, Paperclip, Download, X, Upload, File as FileIcon, MessageSquare } from "lucide-react";
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

interface SafeProposal extends Omit<Proposal, 'createdAt' | 'status'> {
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  description: string;
  price: number;
  deliveryTime: number;
}

// Map status to badge color
const getStatusBadge = (status: string | null) => {
  switch (status ?? 'draft') {
    case 'open':
      return <Badge className="bg-green-500">{status}</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-500">{status}</Badge>;
    case 'completed':
      return <Badge className="bg-purple-500">{status}</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-500">{status}</Badge>;
    default:
      return <Badge>{status ?? 'draft'}</Badge>;
  }
};

// Map proposal status to badge color
const getProposalStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline">{status}</Badge>;
    case 'accepted':
      return <Badge className="bg-green-500">{status}</Badge>;
    case 'rejected':
      return <Badge className="bg-red-500">{status}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

// Type guard functions
function isValidStatus(status: string | null): status is 'pending' | 'accepted' | 'rejected' {
  return status === 'pending' || status === 'accepted' || status === 'rejected';
}

// Add interface for File type
interface ProjectFile {
  id: number;
  projectId: number;
  userId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export default function ProjectDetailsPage() {
  const { t, i18n } = useTranslation();
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
  const isAdmin = user?.role === 'admin';
  const isProjectOwner = project && user?.id === project.clientId;
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
  const handleFileUpload = () => {
    if (filesToUpload.length === 0) return;
    
    setIsUploadingFile(true);
    uploadFileMutation.mutate(filesToUpload);
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

  // Transform proposals to safe proposals before rendering
  const renderProposalCard = (proposal: Proposal) => {
    const safeProposal: SafeProposal = {
      ...proposal,
      createdAt: proposal.createdAt ? new Date(proposal.createdAt) : new Date(),
      status: proposal.status ?? 'pending',
      description: proposal.description || '',
      price: proposal.price,
      deliveryTime: proposal.deliveryTime
    };

    // Determine if current user is the proposal owner
    const isProposalOwner = user?.id === proposal.freelancerId;

    return (
      <ProposalCard 
        key={proposal.id} 
        proposal={safeProposal} 
        projectStatus={project?.status ?? 'draft'}
        onAccept={handleAcceptProposal}
        onReject={handleRejectProposal}
        onNavigateToChat={navigateToChat}
        onEdit={isProposalOwner && proposal.status === 'pending' ? () => handleEditProposal(proposal) : undefined}
        onDelete={isProposalOwner && proposal.status === 'pending' ? () => handleDeleteProposal(proposal) : undefined}
        showActions={(isProjectOwner || isAdmin) && proposal.status === 'pending'}
      />
    );
  };

  // Check if the project has any proposals
  const hasProposals = proposals && proposals.length > 0;
  
  // Check if the client can edit/delete the project (owner + no proposals)
  const canEditProject = isProjectOwner && !hasProposals;

  // Check if the user can upload files (project owner or admin)
  const canUploadFiles = isProjectOwner || isAdmin;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" className="p-2 mr-2" onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{t("projects.details")}</h1>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {getStatusBadge(project.status)} 
                    <span className="mx-2">•</span>
                    {t("projects.postedOn")} {formattedCreatedAt}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {canSubmitProposal ? (
                    <Button onClick={() => navigate(`/projects/${project.id}/proposals/new`)}>
                      {t("proposals.submitProposal")}
                    </Button>
                  ) : isFreelancer && hasSubmittedProposal && (
                    <>
                      <div className="mr-2 flex items-center text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
                        <span className="mr-2">{t("proposals.alreadySubmitted")}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            const userProposal = proposals.find((p: Proposal) => p.freelancerId === user?.id);
                            if (userProposal) handleEditProposal(userProposal);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {t("proposals.edit")}
                    </Button>
                        <Button 
                          variant="outline" 
                          className="text-red-500" 
                          onClick={() => {
                            const userProposal = proposals.find((p: Proposal) => p.freelancerId === user?.id);
                            if (userProposal) handleDeleteProposal(userProposal);
                          }}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          {t("proposals.delete")}
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {/* Add Edit/Delete buttons for project owner if no proposals */}
                  {canEditProject && (
                    <>
                      <Button 
                        variant="outline" 
                        size="icon"
                        title={t("common.edit")}
                        onClick={() => {
                          setProjectEditData({
                            title: project.title,
                            description: project.description,
                            budget: project.budget,
                            category: project.category,
                            deadline: project.deadline
                          });
                          setShowProjectEditForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="text-red-500"
                        title={t("common.delete")}
                        onClick={() => setShowProjectDeleteDialog(true)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-muted-foreground mr-2 rtl:mr-0 rtl:ml-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("projects.budget")}</p>
                    <p className="font-medium">${project.budget}</p>
                  </div>
                </div>
                {project.deadline && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-muted-foreground mr-2 rtl:mr-0 rtl:ml-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("projects.deadline")}</p>
                      <p className="font-medium">
                        {formattedDeadline}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center">
                  <User className="h-5 w-5 text-muted-foreground mr-2 rtl:mr-0 rtl:ml-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("projects.client")}</p>
                    <p className="font-medium">
                      {isProjectOwner ? t("common.you") : `Client #${project.clientId}`}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">{t("projects.description")}</h3>
                <p className="whitespace-pre-wrap">{project.description}</p>
              </div>
              
              {/* Add attachments section */}
              <div className="mt-8 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    <div className="flex items-center">
                      <Paperclip className="h-5 w-5 mr-2" />
                      {t("projects.attachments", { defaultValue: "Attachments" })}
                    </div>
                  </h3>
                  {canUploadFiles && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowFileUploadDialog(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {t("projects.uploadFiles", { defaultValue: "Upload Files" })}
                    </Button>
                  )}
                </div>
                
                {isLoadingFiles ? (
                  <div className="text-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t("common.loading", { defaultValue: "Loading..." })}
                    </p>
                  </div>
                ) : projectFiles.length === 0 ? (
                  <div className="text-center py-6 border rounded-md bg-muted/10">
                    <Paperclip className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t("projects.noAttachments", { defaultValue: "No attachments available" })}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectFiles.map((file) => (
                      <div 
                        key={file.id} 
                        className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/5"
                      >
                        <div className="flex items-center">
                          <FileIcon className="h-5 w-5 text-primary mr-3" />
                          <div>
                            <p className="font-medium text-sm">{file.originalName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} • {file.mimeType} • {format(new Date(file.uploadedAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => downloadFile(file)}
                            title={t("common.download", { defaultValue: "Download" })}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {canUploadFiles && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive"
                              onClick={() => handleFileDelete(file.id)}
                              title={t("common.delete", { defaultValue: "Delete" })}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Proposals Section (Show proposals based on user permissions) */}
          {canViewProposals && (
            <Tabs defaultValue="all" className="mb-8">
              <TabsList className="mb-4">
                <TabsTrigger value="all">{t("proposals.all")}</TabsTrigger>
                {isProjectOwner && (
                  <>
                <TabsTrigger value="pending">{t("proposals.pending")}</TabsTrigger>
                <TabsTrigger value="accepted">{t("proposals.accepted")}</TabsTrigger>
                <TabsTrigger value="rejected">{t("proposals.rejected")}</TabsTrigger>
                  </>
                )}
              </TabsList>
              
              <TabsContent value="all">
                {isLoadingProposals ? (
                  <div className="text-center py-10">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4">{t("common.loading")}</p>
                  </div>
                ) : proposals.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-10">
                      <p>{t("proposals.noProposals")}</p>
                      <p className="mt-4 text-sm text-muted-foreground">
                        {isFreelancer ? 
                          "As a freelancer, you can only see your own proposals for this project. Submit a proposal to see it here." : 
                          "No proposals have been submitted for this project yet."}
                      </p>
                      
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Show freelancer info message if applicable */}
                    {isFreelancer && !isProjectOwner && !isAdmin && proposals.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-md text-blue-700 mb-4">
                        <p className="font-medium">{t("proposals.freelancerVisibilityInfo", { defaultValue: "As a freelancer, you can only see your own proposals for this project." })}</p>
                        <p className="text-sm mt-1">{t("proposals.freelancerProposalAcceptanceInfo", { defaultValue: "You can view other proposals once the client accepts your proposal." })}</p>
                      </div>
                    )}
                    {/* Show all proposals to everyone */}
                    {proposals.map(renderProposalCard)}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="pending">
                {isLoadingProposals ? (
                  <div className="text-center py-10">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4">{t("common.loading")}</p>
                  </div>
                ) : proposals.filter((p: Proposal) => p.status === 'pending').length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-10">
                      <p>{t("proposals.noPendingProposals")}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {proposals.filter((p: Proposal) => p.status === 'pending').map(renderProposalCard)}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="accepted">
                {isLoadingProposals ? (
                  <div className="text-center py-10">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4">{t("common.loading")}</p>
                  </div>
                ) : proposals.filter((p: Proposal) => p.status === 'accepted').length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-10">
                      <p>{t("proposals.noAcceptedProposals")}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {proposals.filter((p: Proposal) => p.status === 'accepted').map(renderProposalCard)}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="rejected">
                {isLoadingProposals ? (
                  <div className="text-center py-10">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4">{t("common.loading")}</p>
                  </div>
                ) : proposals.filter((p: Proposal) => p.status === 'rejected').length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-10">
                      <p>{t("proposals.noRejectedProposals")}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {proposals.filter((p: Proposal) => p.status === 'rejected').map(renderProposalCard)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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

      {/* Add file upload dialog */}
      <Dialog open={showFileUploadDialog} onOpenChange={setShowFileUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("projects.uploadFiles", { defaultValue: "Upload Files" })}</DialogTitle>
            <DialogDescription>
              {t("projects.uploadFilesDescription", { defaultValue: "Add files to your project. Max file size: 5MB." })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div 
              className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">
                {t("projects.dragAndDrop", { defaultValue: "Drag and drop files, or click to select" })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("projects.supportedFormats", { defaultValue: "PDF, Word, Excel, Images, etc." })}
              </p>
            </div>
            
            {filesToUpload.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium">
                  {t("projects.selectedFiles", { defaultValue: "Selected Files" })} ({filesToUpload.length})
                </p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {filesToUpload.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center overflow-hidden">
                        <FileIcon className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                        <p className="text-sm truncate">{file.name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilesToUpload(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFileUploadDialog(false)}>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button 
              onClick={handleFileUpload}
              disabled={filesToUpload.length === 0 || isUploadingFile}
            >
              {isUploadingFile ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("common.uploading", { defaultValue: "Uploading..." })}</>
              ) : (
                t("common.upload", { defaultValue: "Upload" })
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Update ProposalCard component props interface
interface ProposalCardProps {
  proposal: SafeProposal;
  projectStatus: string;
  onAccept: (proposal: SafeProposal) => void;
  onReject: (proposal: SafeProposal) => void;
  onNavigateToChat: (freelancerId: number) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions: boolean;
}

// Proposal Card Component with strict typing
function ProposalCard({ 
  proposal, 
  projectStatus,
  onAccept,
  onReject,
  onNavigateToChat,
  onEdit,
  onDelete,
  showActions
}: ProposalCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const canTakeAction = projectStatus === 'open' && proposal.status === 'pending';
  const formattedDate = format(proposal.createdAt, "PPpp");
  const isProposalOwner = user?.id === proposal.freelancerId;
  const isClient = user?.role === 'client';
  const isAdmin = user?.role === 'admin';

  return (
    <Card className={isProposalOwner ? "border-2 border-primary" : ""}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-4 rtl:mr-0 rtl:ml-4">
              <AvatarFallback>
                {proposal.freelancerId.toString().substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">
                {isProposalOwner ? (
                  <span className="text-primary">{t("proposals.yourProposal")}</span>
                ) : (
                  `${t("proposals.freelancer")} #${proposal.freelancerId}`
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {formattedDate}
              </div>
            </div>
          </div>
          {getProposalStatusBadge(proposal.status)}
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 whitespace-pre-wrap">{proposal.description}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{t("proposals.proposedPrice")}</div>
            <div className="font-medium">${proposal.price}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("proposals.deliveryTime")}</div>
            <div className="font-medium">
              {proposal.deliveryTime} {t("proposals.days")}
            </div>
          </div>
        </div>
      </CardContent>
        <CardFooter className="flex justify-end space-x-2 rtl:space-x-reverse">
        {/* Show edit/delete buttons to proposal owner if proposal is pending */}
        {isProposalOwner && proposal.status === 'pending' && (
          <>
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
              {t("proposals.edit")}
            </Button>
          )}
          {onDelete && (
              <Button variant="outline" className="text-red-500" onClick={onDelete}>
                <Trash className="h-4 w-4 mr-2" />
              {t("proposals.delete")}
            </Button>
          )}
          </>
        )}
        
        {/* Show accept/reject buttons to client/admin if proposal is pending */}
        {showActions && proposal.status === 'pending' && (
          <>
          <Button variant="outline" onClick={() => onReject(proposal)}>
            {t("proposals.reject")}
          </Button>
          <Button onClick={() => onAccept(proposal)}>
            {t("proposals.accept")}
          </Button>
          {(isClient || isAdmin) && !isProposalOwner && (
            <Button variant="outline" onClick={() => onNavigateToChat(proposal.freelancerId)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              {t("proposals.contactFreelancer")}
            </Button>
          )}
          </>
        )}
        
        {/* Show contact button for accepted proposals */}
        {proposal.status === 'accepted' && (
          <Button onClick={() => onNavigateToChat(proposal.freelancerId)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            {t("proposals.contactFreelancer")}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}