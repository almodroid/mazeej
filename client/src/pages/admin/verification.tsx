import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  FileText,
  Clock,
  Shield,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import AdminLayout from "@/components/layouts/admin-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';

// Define the VerificationRequest type
type VerificationRequest = {
  id: number;
  userId: number;
  documentType: string;
  documentUrl: string;
  additionalInfo: string | null;
  status: string;
  reviewerId: number | null;
  reviewNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  user?: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    profileImage: string | null;
  };
};

export default function AdminVerificationPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const isRTL = i18n.language === "ar";
  
  // Fetch verification requests
  const { data: requests = [], isLoading, isError, refetch } = useQuery<VerificationRequest[]>({
    queryKey: ['/api/verification-requests', selectedTab],
    queryFn: async () => {
      const url = `/api/verification-requests${selectedTab !== 'all' ? `?status=${selectedTab}` : ''}`;
      const response = await apiRequest('GET', url);
      if (!response.ok) {
        throw new Error('Failed to fetch verification requests');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mutation for updating verification request status
  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes: string }) => {
      const response = await apiRequest('PATCH', `/api/verification-requests/${id}/status`, {
        status,
        reviewNotes: notes,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update verification request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('verification.statusUpdated'),
        description: t('verification.statusUpdatedDesc'),
      });
      
      // Close dialog and reset state
      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
      setReviewNotes('');
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('verification.updateError'),
        variant: 'destructive',
      });
    }
  });

  // Function to handle request approval
  const handleApprove = () => {
    if (selectedRequest) {
      updateMutation.mutate({
        id: selectedRequest.id,
        status: 'approved',
        notes: reviewNotes,
      });
    }
  };

  // Function to handle request rejection
  const handleReject = () => {
    if (selectedRequest) {
      updateMutation.mutate({
        id: selectedRequest.id,
        status: 'rejected',
        notes: reviewNotes,
      });
    }
  };

  // Function to view request details and open dialog
  const handleViewRequest = (request: VerificationRequest) => {
    setSelectedRequest(request);
    if (request.status === 'pending') {
      setIsReviewDialogOpen(true);
    }
  };

  // Function to format document type for display
  const formatDocumentType = (type: string) => {
    switch (type) {
      case 'id_card':
        return t('verification.idCard');
      case 'passport':
        return t('verification.passport');
      case 'driving_license':
        return t('verification.drivingLicense');
      case 'professional_certificate':
        return t('verification.professionalCertificate');
      case 'other':
        return t('verification.otherDocument');
      default:
        return type;
    }
  };

  // Function to get status badge for a request
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="w-3 h-3 mr-1" /> {t('verification.pending')}</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="w-3 h-3 mr-1" /> {t('verification.approved')}</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300"><XCircle className="w-3 h-3 mr-1" /> {t('verification.rejected')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Filter requests by search query
  const filteredRequests = requests.filter((request) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      request.user?.fullName.toLowerCase().includes(searchLower) ||
      request.user?.username.toLowerCase().includes(searchLower) ||
      request.user?.email.toLowerCase().includes(searchLower) ||
      request.documentType.toLowerCase().includes(searchLower)
    );
  });

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <AdminLayout>
      <div className="flex-1 container mx-auto py-8" >
        <div className="flex flex-col space-y-6 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{t('verification.verificationRequests')}</h1>
              <p className="text-muted-foreground">{t('verification.adminVerificationDesc')}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => refetch()} 
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {t('common.refresh')}
            </Button>
          </div>

          <div className="flex flex-col space-y-4" >
            <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="w-full" dir={isRTL ? "rtl" : "ltr"}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">{t('verification.all')}</TabsTrigger>
                <TabsTrigger value="pending">{t('verification.pending')}</TabsTrigger>
                <TabsTrigger value="approved">{t('verification.approved')}</TabsTrigger>
                <TabsTrigger value="rejected">{t('verification.rejected')}</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex justify-end">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder={t('common.search')} 
                  className="w-full pl-9" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('verification.verificationRequests')}</CardTitle>
                <CardDescription>
                  {selectedTab === 'pending' 
                    ? t('verification.pendingVerificationDesc') 
                    : selectedTab === 'approved' 
                      ? t('verification.approvedVerificationDesc') 
                      : selectedTab === 'rejected' 
                        ? t('verification.rejectedVerificationDesc')
                        : t('verification.allVerificationDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : isError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('common.error')}</AlertTitle>
                    <AlertDescription>{t('verification.errorFetchingRequests')}</AlertDescription>
                  </Alert>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    {searchQuery ? (
                      t('common.noSearchResults')
                    ) : selectedTab === 'pending' ? (
                      t('verification.noPendingRequests')
                    ) : selectedTab === 'approved' ? (
                      t('verification.noApprovedRequests')
                    ) : selectedTab === 'rejected' ? (
                      t('verification.noRejectedRequests')
                    ) : (
                      t('verification.noVerificationRequests')
                    )}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('common.user')}</TableHead>
                          <TableHead>{t('verification.documentType')}</TableHead>
                          <TableHead>{t('verification.submittedAt')}</TableHead>
                          <TableHead>{t('common.status')}</TableHead>
                          <TableHead className="text-right">{t('common.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={request.user?.profileImage || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {request.user?.fullName.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="grid gap-0.5">
                                  <div className="font-medium">{request.user?.fullName}</div>
                                  <div className="text-xs text-muted-foreground">{request.user?.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{formatDocumentType(request.documentType)}</TableCell>
                            <TableCell>{format(new Date(request.submittedAt), 'PP')}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(request.documentUrl, '_blank')}
                                  className="h-8 gap-1"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  {t('verification.viewDocument')}
                                </Button>
                                {request.status === 'pending' ? (
                                  <Button
                                    size="sm"
                                    className="h-8"
                                    onClick={() => handleViewRequest(request)}
                                  >
                                    {t('verification.review')}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewRequest(request)}
                                    className="h-8"
                                  >
                                    {t('common.details')}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('verification.reviewRequest')}</DialogTitle>
            <DialogDescription>
              {t('verification.reviewRequestDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRequest && (
              <>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={selectedRequest.user?.profileImage || undefined} />
                    <AvatarFallback>{selectedRequest.user?.fullName.substring(0, 2) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{selectedRequest.user?.fullName}</h4>
                    <p className="text-sm text-muted-foreground">{selectedRequest.user?.email}</p>
                  </div>
                </div>
                
                <div>
                  <Label>{t('verification.documentType')}</Label>
                  <p className="text-sm">{formatDocumentType(selectedRequest.documentType)}</p>
                </div>
                
                {selectedRequest.additionalInfo && (
                  <div>
                    <Label>{t('verification.additionalInfo')}</Label>
                    <p className="text-sm">{selectedRequest.additionalInfo}</p>
                  </div>
                )}
                
                <div>
                  <Button variant="outline" className="w-full" onClick={() => window.open(selectedRequest.documentUrl, '_blank')}>
                    <FileText className="h-4 w-4 mr-2" />
                    {t('verification.viewDocument')}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor="reviewNotes">{t('verification.reviewNotes')}</Label>
                  <Textarea 
                    id="reviewNotes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={t('verification.reviewNotesPlaceholder')}
                    className="mt-1"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              {t('verification.reject')}
            </Button>
            <Button
              type="button"
              onClick={handleApprove}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              {t('verification.approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 