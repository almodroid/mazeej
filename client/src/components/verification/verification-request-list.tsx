import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, FileText, Clock, Loader2, ExternalLink } from 'lucide-react';
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

export function VerificationRequestList({ isAdmin = false }: { isAdmin?: boolean }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  // Query for verification requests
  const { data: requests, isLoading, isError } = useQuery<VerificationRequest[]>({
    queryKey: [isAdmin ? '/api/verification-requests' : '/api/my-verification-requests', selectedTab],
    queryFn: async () => {
      const url = isAdmin
        ? `/api/verification-requests${selectedTab !== 'all' ? `?status=${selectedTab}` : ''}`
        : '/api/my-verification-requests';
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
      queryClient.invalidateQueries({ queryKey: ['/api/my-verification-requests'] });
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
    if (isAdmin && request.status === 'pending') {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">{t('verification.errorFetchingRequests')}</p>
        <Button 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries({ queryKey: [isAdmin ? '/api/verification-requests' : '/api/my-verification-requests'] })}
          className="mt-4"
        >
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const filteredRequests = isAdmin && selectedTab !== 'all'
    ? requests?.filter(request => request.status === selectedTab) || []
    : requests || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? t('verification.verificationRequests') : t('verification.yourVerificationRequests')}</CardTitle>
          <CardDescription>
            {isAdmin 
              ? t('verification.adminVerificationDesc') 
              : t('verification.userVerificationDesc')}
          </CardDescription>
          <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="pending">{t('verification.pending')}</TabsTrigger>
              <TabsTrigger value="approved">{t('verification.approved')}</TabsTrigger>
              <TabsTrigger value="rejected">{t('verification.rejected')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              {selectedTab === 'pending' 
                ? t('verification.noPendingRequests') 
                : selectedTab === 'approved' 
                  ? t('verification.noApprovedRequests') 
                  : t('verification.noRejectedRequests')}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-4">
                        {isAdmin && request.user && (
                          <Avatar>
                            <AvatarImage src={request.user.profileImage || undefined} />
                            <AvatarFallback>{request.user.fullName.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          {isAdmin && request.user && (
                            <h4 className="font-medium">{request.user.fullName}</h4>
                          )}
                          <p className="text-sm text-gray-500">
                            {t('verification.documentType')}: {formatDocumentType(request.documentType)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {t('verification.submittedAt')}: {format(new Date(request.submittedAt), 'PPP')}
                          </p>
                        </div>
                      </div>
                      <div>{getStatusBadge(request.status)}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {request.additionalInfo && (
                      <p className="text-sm mt-2">{request.additionalInfo}</p>
                    )}
                    {request.status !== 'pending' && request.reviewNotes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
                        <p className="font-medium">{t('verification.reviewNotes')}:</p>
                        <p>{request.reviewNotes}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4 pb-4">
                    <Button variant="outline" onClick={() => window.open(request.documentUrl, '_blank')}>
                      <FileText className="h-4 w-4 mr-2" />
                      {t('verification.viewDocument')}
                    </Button>
                    {isAdmin && request.status === 'pending' && (
                      <div className="space-x-2">
                        <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50" onClick={() => handleViewRequest(request)}>
                          <XCircle className="h-4 w-4 mr-2" />
                          {t('verification.reject')}
                        </Button>
                        <Button variant="outline" className="border-green-500 text-green-500 hover:bg-green-50" onClick={() => handleViewRequest(request)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('verification.approve')}
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {isAdmin && (
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
                      <p className="text-sm text-gray-500">{selectedRequest.user?.email}</p>
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
      )}
    </>
  );
}