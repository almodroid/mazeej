import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Proposal, Project } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { AlertCircle, Search, Edit, Trash, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MyProposalsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [editFormData, setEditFormData] = useState({
    description: "",
    price: 0,
    deliveryTime: 0
  });

  // Fetch freelancer proposals with related projects
  const { data: allProposals = [], isLoading } = useQuery<Proposal[]>({
    queryKey: ["/api/proposals/my"],
    queryFn: async () => {
      if (!user || user.role !== "freelancer") return [];
      try {
        const response = await apiRequest("GET", "/api/proposals/my");
        if (!response.ok) throw new Error("Failed to fetch proposals");
        const data = await response.json();
        console.log("Fetched proposals:", data); // Logging for debugging
        return data;
      } catch (error) {
        console.error("Error fetching proposals:", error);
        return [];
      }
    },
    enabled: !!user && user.role === "freelancer",
  });

  // No need to filter, we already get only the user's proposals from the API
  const proposals = allProposals;

  // Fetch projects to get titles
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      return response.json();
    },
    enabled: !!user && proposals.length > 0,
  });

  // Edit proposal mutation
  const editProposalMutation = useMutation({
    mutationFn: async (data: { id: number, proposal: any }) => {
      const response = await apiRequest("PUT", `/api/proposals/${data.id}`, data.proposal);
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
        title: t("common.success"),
        description: t("proposals.editSuccess", { defaultValue: "Proposal updated successfully" }),
      });
      setShowEditDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/proposals/my"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("proposals.editError", { defaultValue: "Failed to update proposal" }),
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
        title: t("common.success"),
        description: t("proposals.deleteSuccess", { defaultValue: "Proposal deleted successfully" }),
      });
      setShowDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/proposals/my"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("proposals.deleteError", { defaultValue: "Failed to delete proposal" }),
        variant: "destructive",
      });
    }
  });

  // Format the date based on the current language
  const formatDate = (date: string | Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: i18n.language === 'ar' ? ar : enUS,
    });
  };

  // Get project title by ID
  const getProjectTitle = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : `Project #${projectId}`;
  };

  // Map status to badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">{t("proposal.statusPending")}</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">{t("proposal.statusAccepted")}</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">{t("proposal.statusRejected")}</Badge>;
      default:
        return null;
    }
  };

  // Filter proposals based on search term and active tab
  const filteredProposals = proposals.filter(proposal => {
    const project = projects.find(p => p.id === proposal.projectId);
    const projectTitle = project ? project.title : "";
    
    const matchesSearch = proposal.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          projectTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && proposal.status === activeTab;
  });

  // Map proposals for display, handling potential null createdAt
  const displayProposals = filteredProposals.map(proposal => {
    const createdAtDisplay = proposal.createdAt 
      ? formatDate(new Date(proposal.createdAt as unknown as string)) 
      : "";
    
    return {
      ...proposal,
      createdAtDisplay
    };
  });

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  const isRTL = i18n.language === "ar";

  // Handle edit button click
  const handleEditClick = (proposal: Proposal, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link from navigating
    e.stopPropagation(); // Prevent event bubbling
    setSelectedProposal(proposal);
    setEditFormData({
      description: proposal.description || "",
      price: proposal.price || 0,
      deliveryTime: proposal.deliveryTime || 0
    });
    setShowEditDialog(true);
  };

  // Handle delete button click
  const handleDeleteClick = (proposal: Proposal, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link from navigating
    e.stopPropagation(); // Prevent event bubbling
    setSelectedProposal(proposal);
    setShowDeleteDialog(true);
  };

  // Handle edit form submission
  const handleEditSubmit = () => {
    if (!selectedProposal) return;
    
    editProposalMutation.mutate({
      id: selectedProposal.id,
      proposal: editFormData
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!selectedProposal) return;
    deleteProposalMutation.mutate(selectedProposal.id);
  };

  // Check if proposal can be edited (only pending proposals)
  const canEditProposal = (proposal: Proposal) => {
    return proposal.status === "pending";
  };

  if (!user || user.role !== "freelancer") {
    return null;
  }

  return (
    <DashboardLayout>
      <div className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between mb-6",
      )}>
        <h1 className="text-3xl font-cairo font-bold mb-4 md:mb-0">
          {t("myProposals.title")}
        </h1>
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
            placeholder={t("myProposals.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab} dir={isRTL ? "rtl" : "ltr"}>
        <TabsList className={cn("mb-6")}>
          <TabsTrigger value="all">{t("myProposals.all")}</TabsTrigger>
          <TabsTrigger value="pending">{t("myProposals.pending")}</TabsTrigger>
          <TabsTrigger value="accepted">{t("myProposals.accepted")}</TabsTrigger>
          <TabsTrigger value="rejected">{t("myProposals.rejected")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>{t("myProposals.proposalsCount", { count: filteredProposals.length })}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>{t("common.loading")}</p>
                </div>
              ) : filteredProposals.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 flex flex-col items-center">
                  <AlertCircle className="h-12 w-12 text-neutral-300 mb-4" />
                  <p>{t("myProposals.noProposals")}</p>
                  <Link href="/projects">
                    <div className={cn(
                      "text-primary hover:underline mt-2",
                      isRTL && "text-right w-full"
                    )}>
                      {t("myProposals.findProjects")}
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {displayProposals.map((proposal) => (
                    <Link key={proposal.id} href={`/projects/${proposal.projectId}`}>
                      <div className="block p-4 hover:bg-neutral-50 dark:hover:bg-gray-900 transition-colors relative">
                        <div className={cn(
                          "flex justify-between items-start mb-6",
                        )}>
                          <h2 className="font-cairo font-bold text-neutral-900 dark:text-gray-300">
                            {getProjectTitle(proposal.projectId)}
                          </h2>
                          <div className="flex items-center gap-2">
                            {proposal.status && getStatusBadge(proposal.status)}
                            {canEditProposal(proposal) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => handleEditClick(proposal, e as unknown as React.MouseEvent)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    {t("proposals.edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-500" 
                                    onClick={(e) => handleDeleteClick(proposal, e as unknown as React.MouseEvent)}
                                  >
                                    <Trash className="h-4 w-4 mr-2" />
                                    {t("proposals.delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                        <p className="text-neutral-600 text-sm line-clamp-2 mb-6 dark:text-gray-200">
                          {proposal.description}
                        </p>
                        <div className={cn(
                          "flex justify-between items-center text-sm text-neutral-500 dark:text-gray-200",
                          isRTL && "flex-row"
                        )}>
                          <span>${proposal.price} • {proposal.deliveryTime} {t("common.days")}</span>
                          <span>{proposal.createdAtDisplay}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Proposal Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("proposals.edit")}</DialogTitle>
            <DialogDescription>
              {t("proposals.editDescription", { defaultValue: "Update your proposal details" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("proposals.description")}</label>
              <Textarea 
                value={editFormData.description}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("proposals.price")}</label>
                <Input 
                  type="number" 
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({...editFormData, price: Number(e.target.value)})}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("proposals.deliveryTime")}</label>
                <Input 
                  type="number" 
                  value={editFormData.deliveryTime}
                  onChange={(e) => setEditFormData({...editFormData, deliveryTime: Number(e.target.value)})}
                  min={1}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleEditSubmit} disabled={editProposalMutation.isPending}>
              {editProposalMutation.isPending ? t("common.saving", { defaultValue: "Saving..." }) : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Proposal Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("proposals.confirmDelete", { defaultValue: "Confirm Delete" })}</DialogTitle>
            <DialogDescription>
              {t("proposals.confirmDeleteDescription", { defaultValue: "Are you sure you want to delete this proposal? This action cannot be undone." })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteProposalMutation.isPending}>
              {deleteProposalMutation.isPending ? t("common.deleting", { defaultValue: "Deleting..." }) : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 