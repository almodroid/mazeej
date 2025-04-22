import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFirebasePhoneAuth } from "@/hooks/use-firebase-phone-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  PhoneCall, 
  Send, 
  CheckCircle2, 
  Loader2,
  RefreshCw
} from "lucide-react";

interface PhoneVerificationProps {
  phone: string;
  onVerificationComplete: () => void;
  onPhoneChange: (phone: string) => void;
}

export function PhoneVerification({ 
  phone, 
  onVerificationComplete,
  onPhoneChange
}: PhoneVerificationProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    isVerifying,
    isCodeSent,
    isVerified,
    error,
    sendVerificationCode,
    verifyCode,
    resetState,
    formatPhoneNumber
  } = useFirebasePhoneAuth();

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 10 characters
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    onPhoneChange(value);
  };

  // Handle sending verification code
  const handleSendCode = async () => {
    if (!phone || phone.length < 9) {
      return;
    }
    
    setIsSubmitting(true);
    await sendVerificationCode(phone, "recaptcha-container");
    setIsSubmitting(false);
  };

  // Handle verifying code
  const handleVerifyCode = async () => {
    if (!code || code.length < 6) {
      return;
    }
    
    setIsSubmitting(true);
    const success = await verifyCode(code);
    setIsSubmitting(false);
    
    if (success) {
      onVerificationComplete();
    }
  };

  // Reset verification if phone number changes
  useEffect(() => {
    if (isCodeSent && phone) {
      resetState();
    }
  }, [phone]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="phone">{t("verification.phoneNumber")}</Label>
          {isVerified && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {t("verification.verified")}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <div className="flex-shrink-0 flex items-center px-3 bg-muted rounded-l-md border-y border-l">
            +966
          </div>
          <Input
            id="phone"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="5XXXXXXXX"
            className="rounded-l-none"
            disabled={isCodeSent || isVerified}
            maxLength={10}
          />
          {!isCodeSent && !isVerified && (
            <Button 
              onClick={handleSendCode} 
              disabled={isSubmitting || isVerifying || !phone || phone.length < 9}
              className="flex-shrink-0"
            >
              {isSubmitting || isVerifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {t("verification.sendCode")}
            </Button>
          )}
          
          {isCodeSent && !isVerified && (
            <Button 
              variant="outline" 
              onClick={resetState}
              className="flex-shrink-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("verification.change")}
            </Button>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          {t("verification.phoneHelp")}
        </p>
      </div>

      {/* Recaptcha container */}
      {!isCodeSent && !isVerified && (
        <div id="recaptcha-container" className="flex justify-center my-4"></div>
      )}
      
      {isCodeSent && !isVerified && (
        <>
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <Label htmlFor="code">{t("verification.verificationCode")}</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                maxLength={6}
              />
              <Button 
                onClick={handleVerifyCode} 
                disabled={isSubmitting || isVerifying || !code || code.length < 6}
                className="flex-shrink-0"
              >
                {isSubmitting || isVerifying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                {t("verification.verify")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("verification.codeHelp")}
            </p>
          </div>
        </>
      )}
      
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
