import { useState, useEffect } from "react";
import { 
  PhoneAuthProvider, 
  RecaptchaVerifier, 
  signInWithCredential, 
  signInWithPhoneNumber 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export type PhoneAuthState = {
  phoneNumber: string;
  verificationId: string;
  verificationCode: string;
  recaptchaVerifier: RecaptchaVerifier | null;
  isVerifying: boolean;
  isCodeSent: boolean;
  isVerified: boolean;
  error: string | null;
};

export function useFirebasePhoneAuth() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [state, setState] = useState<PhoneAuthState>({
    phoneNumber: "",
    verificationId: "",
    verificationCode: "",
    recaptchaVerifier: null,
    isVerifying: false,
    isCodeSent: false,
    isVerified: false,
    error: null,
  });

  // Format phone number to international format for Saudi Arabia
  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, "");
    
    // If it starts with 0, remove the 0 and add +966
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    
    // If it doesn't start with +966, add it
    if (!cleaned.startsWith("966")) {
      cleaned = "966" + cleaned;
    }
    
    // Ensure it has the + prefix
    return "+" + cleaned;
  };

  // Initialize recaptcha verifier
  const initRecaptcha = (elementId: string) => {
    try {
      if (!state.recaptchaVerifier) {
        const verifier = new RecaptchaVerifier(auth, elementId, {
          size: "normal",
          callback: () => {
            // reCAPTCHA solved, allow sending verification code
          },
          "expired-callback": () => {
            // Reset the reCAPTCHA
            toast({
              title: t("verification.recaptchaExpired"),
              description: t("verification.pleaseRefresh"),
              variant: "destructive",
            });
          },
        });
        
        setState(prev => ({ ...prev, recaptchaVerifier: verifier }));
        return verifier;
      }
      return state.recaptchaVerifier;
    } catch (error) {
      console.error("Error initializing recaptcha:", error);
      setState(prev => ({ 
        ...prev, 
        error: "Failed to initialize verification. Please refresh and try again." 
      }));
      return null;
    }
  };

  // Send verification code
  const sendVerificationCode = async (phoneNumber: string, recaptchaContainerId: string) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isVerifying: true, 
        phoneNumber,
        error: null 
      }));

      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      
      // Initialize recaptcha if not already initialized
      const verifier = initRecaptcha(recaptchaContainerId);
      if (!verifier) {
        throw new Error("Failed to initialize verification");
      }

      // Send verification code
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, verifier);
      
      setState(prev => ({ 
        ...prev, 
        isVerifying: false, 
        isCodeSent: true,
        verificationId: confirmationResult.verificationId
      }));

      toast({
        title: t("verification.codeSent"),
        description: t("verification.enterCodeBelow"),
      });

      return true;
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      setState(prev => ({ 
        ...prev, 
        isVerifying: false, 
        error: error.message || "Failed to send verification code" 
      }));

      toast({
        title: t("verification.sendCodeFailed"),
        description: error.message || t("verification.tryAgainLater"),
        variant: "destructive",
      });

      return false;
    }
  };

  // Verify code
  const verifyCode = async (code: string) => {
    try {
      if (!state.verificationId) {
        throw new Error("Verification ID not found");
      }

      setState(prev => ({ 
        ...prev, 
        isVerifying: true, 
        verificationCode: code,
        error: null 
      }));

      // Create credential
      const credential = PhoneAuthProvider.credential(
        state.verificationId,
        code
      );

      // Sign in with credential
      await signInWithCredential(auth, credential);

      setState(prev => ({ 
        ...prev, 
        isVerifying: false, 
        isVerified: true 
      }));

      toast({
        title: t("verification.verificationSuccessful"),
        description: t("verification.phoneVerified"),
      });

      return true;
    } catch (error: any) {
      console.error("Error verifying code:", error);
      setState(prev => ({ 
        ...prev, 
        isVerifying: false, 
        error: error.message || "Failed to verify code" 
      }));

      toast({
        title: t("verification.verificationFailed"),
        description: error.message || t("verification.invalidCode"),
        variant: "destructive",
      });

      return false;
    }
  };

  // Reset state
  const resetState = () => {
    setState({
      phoneNumber: "",
      verificationId: "",
      verificationCode: "",
      recaptchaVerifier: null,
      isVerifying: false,
      isCodeSent: false,
      isVerified: false,
      error: null,
    });
  };

  // Clean up recaptcha on unmount
  useEffect(() => {
    return () => {
      if (state.recaptchaVerifier) {
        state.recaptchaVerifier.clear();
      }
    };
  }, [state.recaptchaVerifier]);

  return {
    ...state,
    sendVerificationCode,
    verifyCode,
    resetState,
    formatPhoneNumber
  };
}
