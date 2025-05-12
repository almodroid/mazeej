import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { planApi } from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function PaymentResultPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference");
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    planId?: number;
    subscribed?: boolean;
    planTitle?: string;
    error?: string;
  } | null>(null);

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
        const status = await planApi.checkPaymentStatus(reference);
        setResult(status);
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
                  {t("payment.successMessage", { plan: result.planTitle })}
                </p>
                <div className="flex gap-4">
                  <Button asChild>
                    <Link to="/dashboard">{t("payment.dashboard")}</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/">{t("payment.homePage")}</Link>
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
                  <Button asChild>
                    <Link to="/tracks">{t("payment.tryAgain")}</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/">{t("payment.homePage")}</Link>
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