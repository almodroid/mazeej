import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Project, User } from "@shared/schema";
import { format } from "date-fns";
import { Calendar, Clock, User as UserIcon, Video, VideoOff, Check, X, Bell } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Extended Project interface for consultations
interface ConsultationProject {
  id: number;
  title: string;
  description: string;
  clientId: number;
  budget: number;
  status: 'pending' | 'open' | 'in_progress' | 'completed' | 'cancelled' | null;
  category: number;
  deadline: Date | null;
  createdAt: Date;
  freelancer?: User;
  client?: User;
  projectType: 'standard' | 'consultation' | 'mentoring';
  hourlyRate: number | null;
  estimatedHours: number | null;
  consultationDate: string | null;
  consultationStartTime: string | null;
  consultationEndTime: string | null;
  timeZone: string | null;
}

export default function ConsultationsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationProject | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isRequestsCount, setRequestsCount] = useState(0);

  // Fetch all projects with consultation type
  const { data: consultations = [], isLoading } = useQuery<ConsultationProject[]>({
    queryKey: ["/api/projects", "consultation"],
    queryFn: async () => {
      // For freelancers, get their sessions as mentor
      if (user?.role === 'freelancer') {
        const response = await apiRequest("GET", "/api/projects/consultation/mentor");
        if (!response.ok) {
          throw new Error("Failed to fetch mentor consultations");
        }
        return response.json();
      } 
      // For clients (or in this case, beginner freelancers looking for consultations)
      else {
        const response = await apiRequest("GET", "/api/projects/consultation/client");
        if (!response.ok) {
          throw new Error("Failed to fetch client consultations");
        }
        return response.json();
      }
    },
    enabled: !!user,
  });

  // Fetch consultation requests that need expert acceptance
  const { data: pendingRequests = [], isLoading: isLoadingRequests } = useQuery<ConsultationProject[]>({
    queryKey: ["/api/projects/consultation/requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects/consultation/requests");
      if (!response.ok) {
        throw new Error("Failed to fetch consultation requests");
      }
      return response.json();
    },
    enabled: !!user && user.role === 'freelancer' && user.freelancerType === 'expert',
    onSuccess: (data) => {
      setRequestsCount(data.length);
    }
  });

  // Accept consultation request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return await apiRequest("PATCH", `/api/projects/${projectId}/accept`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "consultation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/consultation/requests"] });
      
      toast({
        title: t("consultation.requestAccepted"),
        description: t("consultation.requestAcceptedDesc"),
      });
    },
    onError: (error) => {
      console.error("Error accepting consultation:", error);
      toast({
        title: t("common.error"),
        description: t("consultation.errorAcceptingRequest"),
        variant: "destructive",
      });
    }
  });

  // Reject consultation request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return await apiRequest("PATCH", `/api/projects/${projectId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "consultation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/consultation/requests"] });
      
      toast({
        title: t("consultation.requestRejected"),
        description: t("consultation.requestRejectedDesc"),
      });
    },
    onError: (error) => {
      console.error("Error rejecting consultation:", error);
      toast({
        title: t("common.error"),
        description: t("consultation.errorRejectingRequest"),
        variant: "destructive",
      });
    }
  });

  // Filter consultations based on search term
  const filteredConsultations = consultations.filter((consultation) => {
    const searchLower = searchTerm.toLowerCase();
    const title = consultation.title?.toLowerCase() || '';
    const description = consultation.description?.toLowerCase() || '';
    const freelancerName = consultation.freelancer?.fullName?.toLowerCase() || '';
    const clientName = consultation.client?.fullName?.toLowerCase() || '';
    
    return (
      title.includes(searchLower) ||
      description.includes(searchLower) ||
      freelancerName.includes(searchLower) ||
      clientName.includes(searchLower)
    );
  });

  // Split into upcoming and past consultations
  const now = new Date();
  const upcomingConsultations = filteredConsultations.filter((consultation) => {
    if (!consultation.consultationDate) return false;
    return new Date(consultation.consultationDate) >= now;
  }).sort((a, b) => {
    if (!a.consultationDate || !b.consultationDate) return 0;
    return new Date(a.consultationDate).getTime() - new Date(b.consultationDate).getTime();
  });

  const pastConsultations = filteredConsultations.filter((consultation) => {
    if (!consultation.consultationDate) return false;
    return new Date(consultation.consultationDate) < now;
  }).sort((a, b) => {
    if (!a.consultationDate || !b.consultationDate) return 0;
    return new Date(b.consultationDate).getTime() - new Date(a.consultationDate).getTime();
  });

  // Handle opening consultation details
  const handleViewDetails = (consultation: ConsultationProject) => {
    setSelectedConsultation(consultation);
    setIsDetailsDialogOpen(true);
  };

  // Handle accepting a consultation request
  const handleAcceptRequest = (projectId: number) => {
    acceptRequestMutation.mutate(projectId);
  };

  // Handle rejecting a consultation request
  const handleRejectRequest = (projectId: number) => {
    rejectRequestMutation.mutate(projectId);
  };

  // Format date in local format
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'PPP', { locale: i18n.language === 'ar' ? require('date-fns/locale/ar-SA') : undefined });
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

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-cairo font-bold">
          {t("consultation.consultationsHistory")}
        </h1>
        <div className="flex gap-2">
          <Input
            className="w-[250px]"
            placeholder={t("common.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isRequestsCount > 0 && (
            <Button variant="outline" className="relative">
              <Bell className="h-4 w-4 mr-2" />
              {t("consultation.requests")}
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">{isRequestsCount}</Badge>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">
            {t("consultation.upcomingConsultations")}
          </TabsTrigger>
          <TabsTrigger value="past">
            {t("consultation.pastConsultations")}
          </TabsTrigger>
          {pendingRequests.length > 0 && (
            <TabsTrigger value="requests" className="relative">
              {t("consultation.consultationRequests")}
              {isRequestsCount > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{isRequestsCount}</Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : upcomingConsultations.length > 0 ? (
            upcomingConsultations.map((consultation) => (
              <ConsultationCard
                key={consultation.id}
                consultation={consultation}
                onViewDetails={handleViewDetails}
                onJoin={handleJoinConsultation}
                isUpcoming={true}
                currentUser={user}
              />
            ))
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t("consultation.noUpcomingConsultations")}
              </h3>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : pastConsultations.length > 0 ? (
            pastConsultations.map((consultation) => (
              <ConsultationCard
                key={consultation.id}
                consultation={consultation}
                onViewDetails={handleViewDetails}
                isUpcoming={false}
                currentUser={user}
              />
            ))
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t("consultation.noPastConsultations")}
              </h3>
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {isLoadingRequests ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.client?.profileImage} />
                        <AvatarFallback>{(request.client?.fullName || 'Client').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-medium">{request.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {t("consultation.requestFrom", { name: request.client?.fullName || request.client?.username })}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="bg-primary/5">
                            {request.projectType === 'consultation' 
                              ? t("consultation.oneTimeConsultation") 
                              : t("consultation.mentoring")}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(request.consultationDate)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{request.consultationStartTime} - {request.consultationEndTime}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <UserIcon className="h-3 w-3" />
                            <span>{request.client?.freelancerLevel === 'beginner' ? t("consultation.beginnerFreelancer") : t("consultation.client")}</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-sm font-semibold">{t("consultation.budget")}: ${request.budget}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 items-start">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewDetails(request)}
                      >
                        {t("common.details")}
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={acceptRequestMutation.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {t("consultation.accept")}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={rejectRequestMutation.isPending}
                      >
                        <X className="h-3 w-3 mr-1" />
                        {t("consultation.reject")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t("consultation.noConsultationRequests")}
              </h3>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
                  <AvatarImage src={user?.role === 'freelancer' ? selectedConsultation.client?.profileImage : selectedConsultation.freelancer?.profileImage} />
                  <AvatarFallback>
                    {((user?.role === 'freelancer' ? selectedConsultation.client?.fullName : selectedConsultation.freelancer?.fullName) || 'User').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {user?.role === 'freelancer' 
                      ? t("consultation.withClient", { name: selectedConsultation.client?.fullName || selectedConsultation.client?.username }) 
                      : t("consultation.withExpert", { name: selectedConsultation.freelancer?.fullName || selectedConsultation.freelancer?.username })}
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
                    {formatDate(selectedConsultation.consultationDate)}
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
                    ${(selectedConsultation.hourlyRate || 0) * (selectedConsultation.estimatedHours || 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                {t("common.close")}
              </Button>
              {activeTab === "requests" && (
                <>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleAcceptRequest(selectedConsultation.id);
                      setIsDetailsDialogOpen(false);
                    }}
                    disabled={acceptRequestMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {t("consultation.accept")}
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      handleRejectRequest(selectedConsultation.id);
                      setIsDetailsDialogOpen(false);
                    }}
                    disabled={rejectRequestMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t("consultation.reject")}
                  </Button>
                </>
              )}
              {new Date(selectedConsultation.consultationDate || '') > new Date() && 
               activeTab !== "requests" && selectedConsultation.status !== 'pending' && (
                <Button onClick={() => handleJoinConsultation(selectedConsultation)}>
                  <Video className="h-4 w-4 mr-2" />
                  {t("consultation.join")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}

// Consultation card component
function ConsultationCard({ 
  consultation, 
  onViewDetails, 
  onJoin,
  isUpcoming,
  currentUser
}: { 
  consultation: ConsultationProject;
  onViewDetails: (consultation: ConsultationProject) => void;
  onJoin?: (consultation: ConsultationProject) => void;
  isUpcoming: boolean;
  currentUser?: User | null;
}) {
  const { t, i18n } = useTranslation();
  
  // Determine the other party (if current user is client, show freelancer and vice versa)
  const otherParty = currentUser?.role === 'freelancer' ? consultation.client : consultation.freelancer;
  
  // Format consultation date
  const consultationDate = consultation.consultationDate 
    ? format(new Date(consultation.consultationDate), 'PPP', { locale: i18n.language === 'ar' ? require('date-fns/locale/ar-SA') : undefined })
    : '';
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={otherParty?.profileImage} />
              <AvatarFallback>{(otherParty?.fullName || 'User').charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{consultation.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {currentUser?.role === 'freelancer' 
                  ? t("consultation.withClient", { name: otherParty?.fullName || otherParty?.username }) 
                  : t("consultation.withExpert", { name: otherParty?.fullName || otherParty?.username })}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="bg-primary/5">
                  {consultation.projectType === 'consultation' 
                    ? t("consultation.oneTimeConsultation") 
                    : t("consultation.mentoring")}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{consultationDate}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{consultation.consultationStartTime} - {consultation.consultationEndTime}</span>
                </div>
                {consultation.client?.freelancerLevel === 'beginner' && currentUser?.role === 'freelancer' && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                    {t("consultation.beginnerFreelancer")}
                  </Badge>
                )}
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