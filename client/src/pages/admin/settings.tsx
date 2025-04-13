import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  UserPlus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import AdminLayout from "@/components/layouts/admin-layout";

export default function AdminSettingsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreatingTestAccounts, setIsCreatingTestAccounts] = useState(false);
  const isRTL = i18n.language === "ar";
  
  // Function to create test accounts
  const createTestAccounts = async () => {
    try {
      setIsCreatingTestAccounts(true);
      
      const response = await apiRequest('POST', '/api/create-test-accounts');
      const data = await response.json();
      
      toast({
        title: t("common.success"),
        description: t("admin.testAccountsCreated"),
        variant: "default",
      });
      
      // Refresh the page
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.testAccountsError"),
        variant: "destructive",
      });
    } finally {
      setIsCreatingTestAccounts(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-6">
        <div className={cn(
          "flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
          
        )}>
          <div>
            <h1 className="text-3xl font-cairo font-bold mb-2 text-foreground">
              {t("auth.admin.settings")}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.admin.settingsDescription", {defaultValue: "Configure platform settings"})}
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("auth.admin.settings")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <h3 className="text-lg font-medium">{t("common.generalSettings")}</h3>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">{t("common.platformName")}</label>
                  <Input defaultValue="Mazeej Platform" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">{t("common.platformFee")} (%)</label>
                  <Input type="number" defaultValue="5" />
                </div>
              </div>
              
              <div className="grid gap-3">
                <h3 className="text-lg font-medium">{t("common.developmentTools")}</h3>
                <div className="grid gap-2">
                  <p className="text-sm text-muted-foreground">
                    {t("admin.createTestAccountsDescription", {defaultValue: "Create test accounts for development and testing purposes"})}
                  </p>
                  <Button 
                    variant="secondary"
                    className="gap-2 mt-2"
                    onClick={createTestAccounts}
                    disabled={isCreatingTestAccounts}
                  >
                    {isCreatingTestAccounts ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {t("admin.createTestAccounts")}
                  </Button>
                </div>
              </div>
              
              <Button className="w-full md:w-auto">
                {t("common.saveChanges")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 