import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Proposal } from "@shared/schema";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import ProposalCard, { SafeProposal } from "./ProposalCard";
import { useAuth } from "@/hooks/use-auth";

interface ProposalTabsProps {
  proposals: Proposal[];
  isLoadingProposals: boolean;
  projectStatus: string | null;
  isProjectOwner: boolean;
  isFreelancer: boolean;
  isAdmin: boolean;
  onAcceptProposal: (proposal: SafeProposal) => void;
  onRejectProposal: (proposal: SafeProposal) => void;
  onNavigateToChat: (freelancerId: number) => void;
  onEditProposal: (proposal: Proposal) => void;
  onDeleteProposal: (proposal: Proposal) => void;
}

export default function ProposalTabs({
  proposals,
  isLoadingProposals,
  projectStatus,
  isProjectOwner,
  isFreelancer,
  isAdmin,
  onAcceptProposal,
  onRejectProposal,
  onNavigateToChat,
  onEditProposal,
  onDeleteProposal
}: ProposalTabsProps) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

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
        projectStatus={projectStatus ?? 'draft'}
        onAccept={onAcceptProposal}
        onReject={onRejectProposal}
        onNavigateToChat={onNavigateToChat}
        onEdit={isProposalOwner && proposal.status === 'pending' ? () => onEditProposal(proposal) : undefined}
        onDelete={isProposalOwner && proposal.status === 'pending' ? () => onDeleteProposal(proposal) : undefined}
        showActions={(isProjectOwner || isAdmin) && proposal.status === 'pending'}
      />
    );
  };
  
  if (isLoadingProposals) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4">{t("common.loading")}</p>
      </div>
    );
  }
  
  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-10">
          <p>{t("proposals.noProposals")}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {isFreelancer ? 
              t("proposals.freelancerNoProposalsInfo", { defaultValue: "As a freelancer, you can only see your own proposals for this project. Submit a proposal to see it here." }) : 
              t("proposals.noProposalsDescription", { defaultValue: "No proposals have been submitted for this project yet." })}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="all" className="mb-8">
      <TabsList className="mb-4" dir={isRTL ? "rtl" : "ltr"}>
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
        <div className="space-y-4">
          {/* Show freelancer info message if applicable */}
          {isFreelancer && !isProjectOwner && !isAdmin && proposals.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-md text-blue-700 mb-4">
              <p className="font-medium">
                {t("proposals.freelancerVisibilityInfo", { 
                  defaultValue: "As a freelancer, you can only see your own proposals for this project." 
                })}
              </p>
              <p className="text-sm mt-1">
                {t("proposals.freelancerProposalAcceptanceInfo", { 
                  defaultValue: "You can view other proposals once the client accepts your proposal." 
                })}
              </p>
            </div>
          )}
          {proposals.map(renderProposalCard)}
        </div>
      </TabsContent>
      
      <TabsContent value="pending">
        {proposals.filter((p: Proposal) => p.status === 'pending').length === 0 ? (
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
        {proposals.filter((p: Proposal) => p.status === 'accepted').length === 0 ? (
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
        {proposals.filter((p: Proposal) => p.status === 'rejected').length === 0 ? (
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
  );
} 