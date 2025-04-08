import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, User, Clock, Calendar, DollarSign } from "lucide-react";
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

// Map status to badge color
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'open':
      return <Badge className="bg-green-500">{status}</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-500">{status}</Badge>;
    case 'completed':
      return <Badge className="bg-purple-500">{status}</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-500">{status}</Badge>;
    default:
      return <Badge>{status}</Badge>;
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

export default function ProjectDetailsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Extract projectId from URL
  useEffect(() => {
    const id = window.location.pathname.split('/').pop();
    if (id && !isNaN(Number(id))) {
      setProjectId(Number(id));
    } else {
      // Invalid project ID, redirect to projects page
      navigate("/projects");
    }
  }, [navigate]);

  // Fetch project details
  const { data: project, isLoading: projectLoading, error: projectError } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("Project ID is required");
      const response = await apiRequest("GET", `/api/projects/${projectId}`);
      return response.json();
    },
    enabled: !!projectId,
  });

  // Fetch proposals for this project (only if user is the client)
  const { data: proposals = [], isLoading: proposalsLoading } = useQuery<Proposal[]>({
    queryKey: ["/api/projects", projectId, "proposals"],
    queryFn: async () => {
      if (!projectId) throw new Error("Project ID is required");
      const response = await apiRequest("GET", `/api/projects/${projectId}/proposals`);
      return response.json();
    },
    enabled: !!projectId && !!user && (user.role === 'client' || user.role === 'admin'),
  });

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

  // Accept proposal handler
  const handleAcceptProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowConfirmDialog(true);
  };

  // Confirm accept proposal
  const confirmAcceptProposal = () => {
    if (selectedProposal) {
      updateProposalStatusMutation.mutate({
        id: selectedProposal.id,
        status: "accepted",
      });
    }
  };

  // Reject proposal handler
  const handleRejectProposal = (proposal: Proposal) => {
    updateProposalStatusMutation.mutate({
      id: proposal.id,
      status: "rejected",
    });
  };

  if (projectLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 py-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4">{t("common.loading")}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 py-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-2xl font-bold mb-4">{t("common.error")}</h1>
            <p className="mb-6">{t("projects.notFound")}</p>
            <Button onClick={() => navigate("/projects")}>
              {t("common.back")}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isClient = user?.role === 'client';
  const isFreelancer = user?.role === 'freelancer';
  const isAdmin = user?.role === 'admin';
  const isProjectOwner = user?.id === project.clientId;
  const canSubmitProposal = isFreelancer && project.status === 'open';
  const canViewProposals = isProjectOwner || isAdmin;

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
                    {t("projects.postedOn")} {format(new Date(project.createdAt), "PP", {
                      locale: i18n.language === 'ar' ? require('date-fns/locale/ar-SA') : require('date-fns/locale/en-US')
                    })}
                  </CardDescription>
                </div>
                {canSubmitProposal && (
                  <Button onClick={() => navigate(`/projects/${project.id}/proposals/new`)}>
                    {t("proposals.submitProposal")}
                  </Button>
                )}
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
                        {format(new Date(project.deadline), "PP", {
                          locale: i18n.language === 'ar' ? require('date-fns/locale/ar-SA') : require('date-fns/locale/en-US')
                        })}
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
            </CardContent>
          </Card>
          
          {/* Proposals Section (Only visible to project owner or admin) */}
          {canViewProposals && (
            <Tabs defaultValue="all" className="mb-8">
              <TabsList className="mb-4">
                <TabsTrigger value="all">{t("proposals.all")}</TabsTrigger>
                <TabsTrigger value="pending">{t("proposals.pending")}</TabsTrigger>
                <TabsTrigger value="accepted">{t("proposals.accepted")}</TabsTrigger>
                <TabsTrigger value="rejected">{t("proposals.rejected")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {proposalsLoading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4">{t("common.loading")}</p>
                  </div>
                ) : proposals.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-10">
                      <p>{t("proposals.noProposals")}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {proposals.map((proposal) => (
                      <ProposalCard 
                        key={proposal.id} 
                        proposal={proposal} 
                        projectStatus={project.status}
                        onAccept={handleAcceptProposal}
                        onReject={handleRejectProposal}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="pending">
                {proposalsLoading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4">{t("common.loading")}</p>
                  </div>
                ) : proposals.filter(p => p.status === 'pending').length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-10">
                      <p>{t("proposals.noPendingProposals")}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {proposals.filter(p => p.status === 'pending').map((proposal) => (
                      <ProposalCard 
                        key={proposal.id} 
                        proposal={proposal} 
                        projectStatus={project.status}
                        onAccept={handleAcceptProposal}
                        onReject={handleRejectProposal}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="accepted">
                {proposalsLoading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4">{t("common.loading")}</p>
                  </div>
                ) : proposals.filter(p => p.status === 'accepted').length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-10">
                      <p>{t("proposals.noAcceptedProposals")}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {proposals.filter(p => p.status === 'accepted').map((proposal) => (
                      <ProposalCard 
                        key={proposal.id} 
                        proposal={proposal} 
                        projectStatus={project.status}
                        onAccept={handleAcceptProposal}
                        onReject={handleRejectProposal}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="rejected">
                {proposalsLoading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4">{t("common.loading")}</p>
                  </div>
                ) : proposals.filter(p => p.status === 'rejected').length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-10">
                      <p>{t("proposals.noRejectedProposals")}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {proposals.filter(p => p.status === 'rejected').map((proposal) => (
                      <ProposalCard 
                        key={proposal.id} 
                        proposal={proposal} 
                        projectStatus={project.status}
                        onAccept={handleAcceptProposal}
                        onReject={handleRejectProposal}
                      />
                    ))}
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
            <Button onClick={confirmAcceptProposal}>
              {updateProposalStatusMutation.isPending ? (
                <span>{t("common.processing")}...</span>
              ) : (
                t("common.confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Proposal Card Component
function ProposalCard({ 
  proposal, 
  projectStatus,
  onAccept,
  onReject 
}: { 
  proposal: Proposal; 
  projectStatus: string;
  onAccept: (proposal: Proposal) => void;
  onReject: (proposal: Proposal) => void;
}) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  
  const canTakeAction = projectStatus === 'open' && proposal.status === 'pending';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-4 rtl:mr-0 rtl:ml-4">
              <AvatarFallback>
                {proposal.freelancerId.toString().substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{t("proposals.freelancer")} #{proposal.freelancerId}</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(proposal.createdAt), "PPpp")}
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
      {canTakeAction && (
        <CardFooter className="flex justify-end space-x-2 rtl:space-x-reverse">
          <Button variant="outline" onClick={() => onReject(proposal)}>
            {t("proposals.reject")}
          </Button>
          <Button onClick={() => onAccept(proposal)}>
            {t("proposals.accept")}
          </Button>
        </CardFooter>
      )}
      {proposal.status === 'accepted' && (
        <CardFooter className="flex justify-end">
          <Button onClick={() => navigate(`/chat?user=${proposal.freelancerId}`)}>
            {t("proposals.contactFreelancer")}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}