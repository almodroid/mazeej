import { format } from "date-fns";
import { Edit, Trash, MessageSquare, Star, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Proposal } from "@shared/schema";
import { SaudiRiyal } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Separator } from "@/components/ui/separator";

// Safe proposal type to ensure all required fields
export interface SafeProposal extends Omit<Proposal, 'createdAt' | 'status'> {
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  description: string;
  price: number;
  deliveryTime: number;
}

export interface ProposalCardProps {
  proposal: SafeProposal;
  projectStatus: string;
  onAccept: (proposal: SafeProposal) => void;
  onReject: (proposal: SafeProposal) => void;
  onNavigateToChat: (freelancerId: number) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCheckout?: (proposal: SafeProposal) => void;
  showActions: boolean;
}

// Map proposal status to badge color
export const getProposalStatusBadge = (status: string) => {
  const { t } = useTranslation();

  switch (status) {
    case 'pending':
      return <Badge variant="outline">{t('proposal.statusPending')}</Badge>;
    case 'accepted':
      return <Badge className="bg-green-500">{t('proposal.statusAccepted')}</Badge>;
    case 'rejected':
      return <Badge className="bg-red-500">{t('proposal.statusRejected')}</Badge>;
    default:
      return <Badge>{t(`proposalStatus.${status}`, { defaultValue: status })}</Badge>;
  }
};

export default function ProposalCard({ 
  proposal, 
  projectStatus,
  onAccept,
  onReject,
  onNavigateToChat,
  onEdit,
  onDelete,
  onCheckout,
  showActions
}: ProposalCardProps) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  // Fetch freelancer information
  const { data: freelancer } = useQuery({
    queryKey: ["/api/users", proposal.freelancerId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${proposal.freelancerId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!proposal.freelancerId,
  });

  // Fetch freelancer rating
  const { data: rating } = useQuery({
    queryKey: ["/api/ratings", proposal.freelancerId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/ratings/${proposal.freelancerId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!proposal.freelancerId,
  });
  
  // Fetch freelancer skills
  const { data: skills } = useQuery({
    queryKey: ["/api/freelancers", proposal.freelancerId, "skills"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/freelancers/${proposal.freelancerId}/skills`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!proposal.freelancerId,
  });
  
  const canTakeAction = projectStatus === 'open' && proposal.status === 'pending';
  const formattedDate = format(proposal.createdAt, "PPpp");
  const isProposalOwner = user?.id === proposal.freelancerId;
  const isClient = user?.role === 'client';
  const isAdmin = user?.role === 'admin';

  // Function to render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  // Function to format experience
  const formatExperience = (years: number) => {
    if (years === 0) return t("freelancer.lessThanYear");
    if (years === 1) return t("freelancer.oneYear");
    return t("freelancer.years", { years });
  };

  return (
    <Card className={isProposalOwner ? "border-2 border-primary" : ""} dir={isRTL ? "rtl" : "ltr"}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Avatar className={"h-10 w-10 mr-4"}>
              {freelancer?.profileImage ? (
                <AvatarImage src={freelancer.profileImage} alt={freelancer.fullName || freelancer.username} />
              ) : (
                <AvatarFallback>
                  {freelancer ? (
                    (freelancer.fullName || freelancer.username).substring(0, 2).toUpperCase()
                  ) : (
                    proposal.freelancerId.toString().substring(0, 2)
                  )}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="font-semibold">
                {isProposalOwner ? (
                  <span className="text-primary">{t("proposals.yourProposal")}</span>
                ) : (
                  isClient ? (
                    freelancer ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{freelancer.fullName || freelancer.username}</span>
                          {freelancer.isVerified && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-2">
                            {renderStars(rating?.averageRating || 0)}
                            <span className="text-sm text-muted-foreground">
                              {rating ? (
                                `${rating.averageRating.toFixed(1)}/5.0 (${rating.totalRatings} ${t("ratings.reviews")})`
                              ) : (
                                `0.0/5.0 (0 ${t("ratings.reviews")})`
                              )}
                            </span>
                          </div>
                          {freelancer.experience && (
                            <div className="text-sm text-muted-foreground">
                              {t("freelancer.experience")}: {formatExperience(freelancer.experience)}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {freelancer.freelancerType === 'content_creator' 
                            ? t('profile.contentCreator') 
                            : t('profile.expert')} • {t(`profile.${freelancer.freelancerLevel}`)}
                        </div>
                      </div>
                    ) : (
                      `${t("proposals.freelancer")} #${proposal.freelancerId}`
                    )
                  ) : (
                    `${t("proposals.freelancer")} #${proposal.freelancerId}`
                  )
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
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{t("proposals.proposedPrice")}</div>
            <div className={"font-medium flex items-center"}>{proposal.price}{isRTL ? <SaudiRiyal  className="h-5 w-5 text-muted-foreground mx-1" /> : "SAR"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("proposals.deliveryTime")}</div>
            <div className="font-medium">
              {proposal.deliveryTime} {t("proposals.days")}
            </div>
          </div>
        </div>

        {/* Skills Section */}
        {skills && skills.length > 0 && (
          <>
            <Separator className="my-4" />
            <div>
              <h4 className="text-sm font-medium mb-2">{t("profile.skills")}</h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
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
        
        {/* Show checkout and contact buttons for accepted proposals */}
        {proposal.status === 'accepted' && (
          <>
            {onCheckout && (isClient || isAdmin) && (
              <Button variant="default" onClick={() => onCheckout(proposal)}>
                {isRTL ? <SaudiRiyal className="h-4 w-4 mr-2" /> : "SAR"}
                {t("proposals.proceedToPayment")}
              </Button>
            )}
            <Button onClick={() => onNavigateToChat(proposal.freelancerId)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              {isProposalOwner ? t("proposals.contactClient") : t("proposals.contactFreelancer")}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}