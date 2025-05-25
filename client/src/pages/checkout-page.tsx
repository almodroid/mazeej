import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

interface CheckoutParams {
  proposalId: string;
}

interface Proposal {
  id: number;
  projectId: number;
  freelancerId: number;
  description: string;
  price: number;
  deliveryTime: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  budget: number;
  clientId: number;
  status: string;
}

interface Freelancer {
  id: number;
  fullName: string;
  username: string;
  profileImage?: string;
  freelancerType: 'expert' | 'content_creator';
  freelancerLevel: 'beginner' | 'intermediate' | 'advanced';
  isVerified: boolean;
  hourlyRate?: number;
  bio?: string;
}

interface PaymentStatus {
  status: 'processing' | 'success' | 'failed' | 'pending';
  message?: string;
  transactionId?: string;
}

export default function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams<CheckoutParams>();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'pending' });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Get proposal ID from URL params
  const proposalId = params?.proposalId ? parseInt(params.proposalId) : null;
  
  // Fetch proposal details
  const { data: proposal, isLoading: isLoadingProposal } = useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: async () => {
      if (!proposalId) return null;
      // First get the project ID from the proposal
      const response = await apiRequest("GET", `/api/proposals/${proposalId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch proposal");
      }
      const proposal = await response.json();
      return proposal;
    },
    enabled: !!proposalId && !!user,
  });
  
  // Fetch freelancer details
  const { data: freelancer, isLoading: isLoadingFreelancer } = useQuery<Freelancer>({
    queryKey: ["freelancer", proposal?.freelancerId],
    queryFn: async () => {
      if (!proposal?.freelancerId) return null;
      const response = await apiRequest("GET", `/api/users/${proposal.freelancerId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch freelancer");
      }
      return response.json();
    },
    enabled: !!proposal?.freelancerId && !!user,
  });
  
  // Fetch project details
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", proposal?.projectId],
    queryFn: async () => {
      if (!proposal?.projectId) return null;
      const response = await apiRequest("GET", `/api/projects/${proposal.projectId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      return response.json();
    },
    enabled: !!proposal?.projectId && !!user,
  });
  
  // Check if user is authorized to view this page (must be the project owner)
  useEffect(() => {
    if (project && user && project.clientId !== user.id && user.role !== 'admin') {
      toast({
        title: t("common.unauthorized"),
        description: t("checkout.unauthorizedDescription"),
        variant: "destructive",
      });
      navigate("/my-projects");
    }
  }, [project, user, navigate, toast, t]);
  
  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!proposal || !project) throw new Error("Missing proposal or project data");
      
      const response = await apiRequest("POST", "/api/payments/paytabs/checkout", {
        proposalId: proposal.id,
        projectId: project.id,
        amount: proposal.price,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Payment processing failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // If PayTabs returns a redirect URL, redirect the user to it
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        // Handle direct success (unlikely in production)
        setPaymentStatus({
          status: 'success',
          transactionId: data.transactionId || 'N/A',
        });
        toast({
          title: t("checkout.paymentSuccessful"),
          description: t("checkout.paymentSuccessfulDescription"),
        });
      }
    },
    onError: (error: Error) => {
      setPaymentStatus({
        status: 'failed',
        message: error.message,
      });
      toast({
        title: t("checkout.paymentFailed"),
        description: error.message || t("checkout.paymentFailedDescription"),
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });
  
  // Handle payment button click
  const handlePayment = () => {
    setIsProcessing(true);
    setPaymentStatus({ status: 'processing' });
    processPaymentMutation.mutate();
  };
  
  // Calculate fees and total
  const platformFee = proposal ? proposal.price * 0.15 : 0; // 5% platform fee
  const totalAmount = proposal ? proposal.price  : 0;
  
  // Loading state
  if (isLoadingProposal || isLoadingProject || isLoadingFreelancer) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>{t("common.loading")}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Error state - proposal not found
  if (!proposal || !project) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("checkout.notFound")}</CardTitle>
              <CardDescription>{t("checkout.proposalNotFound")}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/my-projects")} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back")}
              </Button>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />
      <div className="flex-1 container max-w-4xl py-16 m-auto">
        

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("checkout.title")}</h1>
          <p className="text-muted-foreground">{t("checkout.subtitle")}</p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          {/* Order Summary */}
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{t("checkout.orderSummary")}</CardTitle>
                <CardDescription>{t("checkout.projectDetails")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg">{project.title}</h3>
                  <p className="text-sm text-muted-foreground">{t("checkout.projectId")}: {project.id}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium text-lg mb-4">{t("checkout.proposalDetails")}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{proposal.description}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">{t("proposals.deliveryTime")}</p>
                      <p className="font-medium">{proposal.deliveryTime} {t("proposals.days")}</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">{t("proposals.proposalId")}</p>
                      <p className="font-medium">#{proposal.id}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Freelancer Information */}
            {freelancer && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("checkout.freelancerInfo")}</CardTitle>
                  <CardDescription>{t("checkout.freelancerDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-primary">
                      {freelancer.profileImage ? (
                        <img 
                          src={freelancer.profileImage} 
                          alt={freelancer.fullName || freelancer.username} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary text-white text-xl font-semibold">
                          {(freelancer.fullName || freelancer.username).charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-lg">{freelancer.fullName || freelancer.username}</h3>
                        {freelancer.isVerified && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {freelancer.freelancerType === 'content_creator' 
                          ? t('profile.contentCreator') 
                          : t('profile.expert')} • {t(`profile.${freelancer.freelancerLevel}`)}
                      </p>
                    </div>
                  </div>

                  {freelancer.bio && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">{t("profile.bio")}</h4>
                        <p className="text-sm text-muted-foreground">{freelancer.bio}</p>
                      </div>
                    </>
                  )}

                  {freelancer.hourlyRate && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">{t("profile.hourlyRate")}</p>
                      <p className="font-medium">{freelancer.hourlyRate} {t("common.riyal")}/{t("common.hr")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Payment Summary - Sticky on mobile */}
          <div className="md:sticky md:top-8">
            <Card>
              <CardHeader>
                <CardTitle>{t("checkout.paymentSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("checkout.proposalAmount")}</span>
                  <span className="font-medium">{proposal.price} {t("common.riyal")}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t("checkout.platformFee")}</span>
                  <span>{platformFee.toFixed(2)} {t("common.riyal")}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>{t("checkout.total")}</span>
                  <span>{totalAmount.toFixed(2)} {t("common.riyal")}</span>
                </div>
              </CardContent>
              <CardFooter>
                {paymentStatus.status === 'pending' && (
                  <Button 
                    className="w-full" 
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("checkout.payNow")}
                  </Button>
                )}
                
                {paymentStatus.status === 'processing' && (
                  <div className="w-full flex items-center justify-center p-2">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>{t("checkout.processing")}</span>
                  </div>
                )}
                
                {paymentStatus.status === 'success' && (
                  <div className="w-full flex items-center justify-center p-2 text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span>{t("checkout.paymentSuccessful")}</span>
                  </div>
                )}
                
                {paymentStatus.status === 'failed' && (
                  <div className="w-full">
                    <div className="flex items-center justify-center p-2 text-red-600 mb-2">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      <span>{t("checkout.paymentFailed")}</span>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handlePayment}
                      variant="outline"
                    >
                      {t("checkout.tryAgain")}
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}