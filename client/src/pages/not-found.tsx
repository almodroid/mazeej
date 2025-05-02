import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center bg-gradient-to-b from-background to-muted/20 dark:from-background dark:to-muted/10 p-16">
        <Card className="w-full max-w-md mx-4 border-muted/20 backdrop-blur-sm bg-background/95">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-red-500/20 rounded-full blur"></div>
                <AlertCircle className="relative h-16 w-16 text-red-500" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                404
              </h1>
              <h2 className="text-xl font-semibold text-foreground">
                {t("common.not-found")}
              </h2>
              <p className="mt-2 text-muted-foreground text-center max-w-sm">
                {t("common.not-found-desc")}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pb-8">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => window.history.back()}
            > 
              {isRTL ? <ArrowRight className="ml-2 h-4 w-4" /> 
              :  
              <ArrowLeft className="mr-2 h-4 w-4" />
              }
              {t("common.back")}
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => window.location.href = "/"}
            >
              <Home className="mr-2 h-4 w-4" />
              {t("common.back-home")}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
