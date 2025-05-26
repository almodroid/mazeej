import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Project, Proposal, User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { arSA } from 'date-fns/locale/ar-SA';
import { AlertCircle, Calendar, Clock, Search, Star, Video } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

// Consultation project type
interface ConsultationProject {
  id: number;
  title: string;
  description: string;
  clientId: number;
  budget: number;
  status: 'pending' | 'open' | 'in_progress' | 'completed' | 'cancelled' | null;
  category: number;
  deadline: Date | string | null;
  createdAt: Date | string;
  freelancer?: User;
  client?: User;
  projectType: 'standard' | 'consultation' | 'mentoring';
  hourlyRate: number | null;
  estimatedHours: number | null;
  consultationDate: Date | string | null;
  consultationStartTime: string | null;
  consultationEndTime: string | null;
  timeZone: string | null;
}

// Placeholder type for Review data - adjust as per actual schema/API
interface ReviewInput {
  projectId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  comment: string;
}

export default function MyConsultationsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationProject | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [expertId, setExpertId] = useState<number | null>(null);

  // Fetch beginner freelancer consultations
  const { data: consultations = [], isLoading } = useQuery<ConsultationProject[]>({
    queryKey: ["/api/projects/consultation/beginner"],
    queryFn: async () => {
      const response = await fetch("/api/projects/consultation/beginner");
      if (!response.ok) {
        throw new Error("Failed to fetch consultations");
      }
      return response.json();
    },
    enabled: !!user && user.role === "freelancer" && user.freelancerLevel === "beginner",
  });

  // Format the date based on the current language
  const formatDate = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: i18n.language === 'ar' ? ar : enUS,
    });
  };

  // Format consultation date
  const formatConsultationDate = (dateString?: Date | string | null) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'PPP', { 
        locale: i18n.language === 'ar' ? require('date-fns/locale/ar-SA') : undefined 
      });
    } catch (error) {
      return '';
    }
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

  // Split into upcoming and past consultations
  const now = new Date();
  
  // Filter consultations based on search term
  const filteredConsultations = consultations.filter((consultation) => {
    const searchLower = searchTerm.toLowerCase();
    const title = consultation.title?.toLowerCase() || '';
    const description = consultation.description?.toLowerCase() || '';
    const expertName = consultation.freelancer?.fullName?.toLowerCase() || '';
    
    return (
      title.includes(searchLower) ||
      description.includes(searchLower) ||
      expertName.includes(searchLower)
    );
  });
  
  const upcomingConsultations = filteredConsultations.filter((consultation) => {
    if (!consultation.consultationDate) return false;
    return new Date(consultation.consultationDate) >= now && consultation.status !== 'completed';
  }).sort((a, b) => {
    if (!a.consultationDate || !b.consultationDate) return 0;
    return new Date(a.consultationDate).getTime() - new Date(b.consultationDate).getTime();
  });

  const pastConsultations = filteredConsultations.filter((consultation) => {
    if (!consultation.consultationDate) return false;
    return new Date(consultation.consultationDate) < now || consultation.status === 'completed';
  }).sort((a, b) => {
    if (!a.consultationDate || !b.consultationDate) return 0;
    return new Date(b.consultationDate).getTime() - new Date(a.consultationDate).getTime();
  });

  // --- Mutations ---

  // Mutation to update project status
  const updateStatusMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return await projectApi.updateProjectStatus(projectId, 'completed');
    },
    onSuccess: (data, projectId) => {
      // Invalidate projects query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ["/api/projects/consultation/beginner"] });
      
      // Find the consultation for review
      const consultation = consultations.find(c => c.id === projectId);
      if (consultation) {
        setSelectedConsultation(consultation);
        setExpertId(consultation.freelancer?.id || null);
        setRating(0);
        setComment("");
        setIsDetailsDialogOpen(false);
        setIsReviewDialogOpen(true);
        
        // Show success notification
        toast({
          title: t("consultation.statusUpdated"),
          description: t("consultation.consultationCompleted"),
        });
      }
    },
    onError: (error) => {
      console.error("Error updating consultation status:", error);
      toast({
        title: t("common.error"),
        description: t("consultation.errorUpdatingStatus"),
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
      // Invalidate consultations query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ["/api/projects/consultation/beginner"] });
      
      // Close the review dialog
      setIsReviewDialogOpen(false);
      
      // Show success notification
      toast({
        title: t("consultation.reviewSubmitted"),
        description: t("consultation.reviewSubmittedSuccess"),
      });
    },
    onError: (error) => {
      console.error("Error submitting review:", error);
      toast({
        title: t("common.error"),
        description: t("consultation.errorSubmittingReview"),
        variant: "destructive",
      });
    }
  });

  // Handle review submission
  const handleReviewSubmit = () => {
    if (!selectedConsultation || !expertId || !user) return;

    submitReviewMutation.mutate({
      projectId: selectedConsultation.id,
      reviewerId: user.id,
      revieweeId: expertId,
      rating,
      comment
    });
  };

  // Handle finalize consultation click
  const handleFinalizeClick = (projectId: number) => {
    updateStatusMutation.mutate(projectId);
  };

  // Handle opening consultation details
  const handleViewDetails = (consultation: ConsultationProject) => {
    setSelectedConsultation(consultation);
    setIsDetailsDialogOpen(true);
  };

  // Handle joining a consultation (this would be implemented with video service)
  const handleJoinConsultation = (consultation: ConsultationProject) => {
    toast({
      title: t("consultation.joiningConsultation"),
      description: t("consultation.preparingVideoCall"),
    });

    // Here you would integrate with your video call service (Zoom, Google Meet, etc.)
    // For now, just show a toast
    setTimeout(() => {
      toast({
        title: t("consultation.videoCallReady"),
        description: t("consultation.clickToJoin"),
      });
      window.open(`https://meet.google.com/generated-link-${Math.random().toString(36).substring(2, 8)}`, '_blank');
    }, 2000);
  };

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  const isRTL = i18n.language === "ar";

  if (!user || user.role !== "freelancer" || user.freelancerLevel !== "beginner") {
    return null;
  }

  return (
    <DashboardLayout>
      <div className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between mb-6",
        isRTL && "md:flex-row"
      )}>
        <h1 className="text-3xl font-cairo font-bold mb-4 md:mb-0">
          {t("consultation.myConsultations")}
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
            placeholder={t("consultation.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab} dir={isRTL ? "rtl" : "ltr"}>
        <TabsList className={cn("mb-6", isRTL && "flex-row")}>
          <TabsTrigger value="upcoming">{t("consultation.upcomingConsultations")}</TabsTrigger>
          <TabsTrigger value="past">{t("consultation.pastConsultations")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>{t("consultation.upcomingCount", { count: upcomingConsultations.length })}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>{t("common.loading")}</p>
                </div>
              ) : upcomingConsultations.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 flex flex-col items-center">
                  <AlertCircle className="h-12 w-12 text-neutral-300 mb-4" />
                  <p>{t("consultation.noUpcomingConsultations")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingConsultations.map((consultation) => (
                    <ConsultationCard
                      key={consultation.id}
                      consultation={consultation}
                      onViewDetails={handleViewDetails}
                      onJoin={handleJoinConsultation}
                      currentUser={user}
                      isUpcoming={true}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>{t("consultation.pastCount", { count: pastConsultations.length })}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>{t("common.loading")}</p>
                </div>
              ) : pastConsultations.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 flex flex-col items-center">
                  <AlertCircle className="h-12 w-12 text-neutral-300 mb-4" />
                  <p>{t("consultation.noPastConsultations")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastConsultations.map((consultation) => (
                    <ConsultationCard
                      key={consultation.id}
                      consultation={consultation}
                      onViewDetails={handleViewDetails}
                      currentUser={user}
                      isUpcoming={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Consultation Details Dialog */}
      {selectedConsultation && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("consultation.consultationDetails")}</DialogTitle>
              <DialogDescription>
                {selectedConsultation.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConsultation.freelancer?.profileImage || undefined} />
                  <AvatarFallback>
                    {(selectedConsultation.freelancer?.fullName || 'Expert').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {t("consultation.withExpert", { name: selectedConsultation.freelancer?.fullName || selectedConsultation.freelancer?.username })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConsultation.projectType === 'consultation' 
                      ? t("consultation.oneTimeConsultation") 
                      : t("consultation.mentoring")}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {formatConsultationDate(selectedConsultation.consultationDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedConsultation.consultationStartTime} - {selectedConsultation.consultationEndTime}
                  </span>
                </div>
              </div>
              
              <div className="p-4 border rounded-md bg-muted/20">
                <h4 className="text-sm font-medium mb-2">{t("consultation.consultationDetails")}</h4>
                <p className="text-sm">{selectedConsultation.description}</p>
              </div>
              
              <div className="flex justify-between items-center p-4 border rounded-md bg-muted/20">
                <div>
                  <p className="text-sm font-medium">{t("consultation.hourlyRate")}</p>
                  <p className="text-xl font-bold">${selectedConsultation.hourlyRate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{t("consultation.totalCost")}</p>
                  <p className="text-xl font-bold">
                    ${Number(selectedConsultation.budget)}
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                {t("common.close")}
              </Button>
              
              {/* Conditional buttons based on consultation state */}
              {selectedConsultation.status === 'in_progress' && (
                <Button 
                  onClick={() => handleFinalizeClick(selectedConsultation.id)}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending 
                    ? t("common.processing") 
                    : t("consultation.finalizeConsultation")}
                </Button>
              )}
              
              {new Date(selectedConsultation.consultationDate || '') > new Date() && 
               selectedConsultation.status !== 'completed' && (
                <Button onClick={() => handleJoinConsultation(selectedConsultation)}>
                  <Video className="h-4 w-4 mr-2" />
                  {t("consultation.join")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("consultation.reviewDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("consultation.reviewDialog.description", { consultationTitle: selectedConsultation?.title })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rating" className="text-right">
                {t("consultation.reviewDialog.rating")}
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
                 {t("consultation.reviewDialog.comment")}
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="col-span-3"
                placeholder={t("consultation.reviewDialog.commentPlaceholder")}
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
                    : t("consultation.reviewDialog.submit")
               }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// Consultation card component
function ConsultationCard({ 
  consultation, 
  onViewDetails, 
  onJoin,
  currentUser,
  isUpcoming
}: { 
  consultation: ConsultationProject;
  onViewDetails: (consultation: ConsultationProject) => void;
  onJoin?: (consultation: ConsultationProject) => void;
  currentUser?: User | null;
  isUpcoming: boolean;
}) {
  const { t, i18n } = useTranslation();
  
  // Format consultation date
  const consultationDate = consultation.consultationDate 
    ? format(new Date(consultation.consultationDate), 'PPP', { locale: i18n.language === 'ar' ? arSA : undefined })
    : '';
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={consultation.freelancer?.profileImage || undefined} />
              <AvatarFallback>{(consultation.freelancer?.fullName || 'Expert').charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{consultation.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {t("consultation.withExpert", { name: consultation.freelancer?.fullName || consultation.freelancer?.username })}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="bg-primary/5">
                  {consultation.projectType === 'consultation' 
                    ? t("consultation.oneTimeConsultation") 
                    : t("consultation.mentoring")}
                </Badge>
                {consultation.status && (
                  <Badge variant="outline" className={cn(
                    consultation.status === 'completed' ? "bg-green-50 text-green-600 border-green-200" :
                    consultation.status === 'in_progress' ? "bg-amber-50 text-amber-600 border-amber-200" :
                    "bg-blue-50 text-blue-600 border-blue-200"
                  )}>
                    {t(`project.status${consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}`)}
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{consultationDate}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{consultation.consultationStartTime} - {consultation.consultationEndTime}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onViewDetails(consultation)}>
              {t("common.details")}
            </Button>
            {isUpcoming && onJoin && (
              <Button size="sm" onClick={() => onJoin(consultation)}>
                <Video className="h-3 w-3 mr-1" />
                {t("consultation.join")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 