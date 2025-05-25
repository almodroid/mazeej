import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface PaymentResult {
  success: boolean;
  error?: string;
  type?: 'project' | 'plan';
  planTitle?: string;
}

export default function PaymentResultPage() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const reference = searchParams.get("reference");
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaymentResult | null>(null);

  useEffect(() => {
    if (!reference) {
      setResult({
        success: false,
        error: t("payment.missingReference")
      });
      setLoading(false);
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        setLoading(true);
        
        // Determine payment type from reference
        const isPlanPayment = reference.startsWith('PLAN-');
        const endpoint = isPlanPayment ? '/api/plans/payment-status' : '/api/payments/paytabs/status';
        
        const response = await apiRequest("GET", `${endpoint}?reference=${reference}`);
        if (!response.ok) {
          throw new Error(await response.text());
        }
        
        const data = await response.json();
        setResult({
          success: isPlanPayment ? data.subscribed : data.status === 'accepted',
          error: isPlanPayment ? undefined : (data.status === 'accepted' ? undefined : t("payment.failedMessage")),
          type: isPlanPayment ? 'plan' : 'project',
          planTitle: data.planTitle
        });
      } catch (error) {
        console.error("Error checking payment status:", error);
        setResult({
          success: false,
          error: error instanceof Error ? error.message : t("payment.checkError")
        });
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [reference, t]);

  const getSuccessMessage = () => {
    if (!result) return '';
    if (result.type === 'plan') {
      return t("payment.planSuccessMessage", { plan: result.planTitle });
    }
    return t("payment.successMessage");
  };

  const getSuccessRedirect = () => {
    if (!result) return '/';
    return result.type === 'plan' ? '/tracks' : '/my-projects';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{t("payment.result")}</CardTitle>
            <CardDescription>
              {t("payment.resultDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {loading ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p>{t("common.loading")}</p>
              </div>
            ) : result?.success ? (
              <div className="flex flex-col items-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">{t("payment.success")}</h3>
                <p className="text-center mb-6">
                  {getSuccessMessage()}
                </p>
                <div className="flex gap-4">
                  <Button onClick={() => setLocation(getSuccessRedirect())}>
                    {result.type === 'plan' ? t("payment.viewPlans") : t("payment.myProjects")}
                  </Button>
                  <Button variant="outline" onClick={() => setLocation("/")}>
                    {t("payment.homePage")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8">
                <XCircle className="h-16 w-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">{t("payment.failed")}</h3>
                <p className="text-center mb-6">
                  {result?.error || t("payment.failedMessage")}
                </p>
                <div className="flex gap-4">
                  <Button onClick={() => setLocation(result?.type === 'plan' ? '/tracks' : '/my-projects')}>
                    {t("payment.tryAgain")}
                  </Button>
                  <Button variant="outline" onClick={() => setLocation("/")}>
                    {t("payment.homePage")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
} 