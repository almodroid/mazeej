import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { VerificationRequestForm } from '@/components/verification/verification-request-form';
import { VerificationRequestList } from '@/components/verification/verification-request-list';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/layouts/dashboard-layout';

export default function VerificationPage() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // The protected route should handle redirection to login
    return null;
  }

  const renderContent = () => {
    if (user.role === 'client' || user.role === 'admin') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{t('verification.notAvailable')}</CardTitle>
            <CardDescription>
              {user.role === 'client' 
                ? t('verification.notAvailableForClient') 
                : t('verification.adminVerificationTab')}
            </CardDescription>
          </CardHeader>
          {user.role === 'admin' && (
            <CardContent>
              <VerificationRequestList isAdmin={true} />
            </CardContent>
          )}
        </Card>
      );
    }

    // For freelancers
    return (
      <>
        <h1 className="text-3xl font-bold mb-6">{t('verification.verificationTitle')}</h1>
        <p className="text-gray-600 mb-8">{t('verification.verificationDescription')}</p>

        {user.isVerified ? (
          <Alert className="mb-8 bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle>{t('verification.verified')}</AlertTitle>
            <AlertDescription>{t('verification.verifiedDesc')}</AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="request" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="request">{t('verification.newRequest')}</TabsTrigger>
              <TabsTrigger value="history">{t('verification.requestHistory')}</TabsTrigger>
            </TabsList>
            <TabsContent value="request">
              <VerificationRequestForm />
            </TabsContent>
            <TabsContent value="history">
              <VerificationRequestList />
            </TabsContent>
          </Tabs>
        )}
      </>
    );
  };

  return (
    <DashboardLayout>
      {renderContent()}
    </DashboardLayout>
  );
}