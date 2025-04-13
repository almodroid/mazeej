import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/contexts/settings-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { settings, isLoading, updateTheme, updateTimezone, updateNotificationPreference } = useSettings();

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  // Define RTL state based on language
  const isRTL = i18n.language === "ar";

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-cairo font-bold mb-6">
        {t("settings.title")}
      </h1>

      <Tabs defaultValue="account" className="w-full" dir={isRTL ? "rtl" : "ltr"}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account">{t("settings.account")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("settings.notifications")}</TabsTrigger>
          <TabsTrigger value="appearance">{t("settings.appearance")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.accountSettings")}</CardTitle>
              <CardDescription>{t("settings.accountSettingsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("settings.language")}</Label>
                <Select defaultValue={i18n.language} onValueChange={changeLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("settings.selectLanguage")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("settings.english")}</SelectItem>
                    <SelectItem value="ar">{t("settings.arabic")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t("settings.timezone")}</Label>
                <Select 
                  defaultValue={settings.timezone} 
                  onValueChange={updateTimezone}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("settings.selectTimezone")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="GMT+3">GMT+3 (Riyadh)</SelectItem>
                    <SelectItem value="GMT+4">GMT+4 (Dubai)</SelectItem>
                    <SelectItem value="GMT+5">GMT+5 (Karachi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-4">
                <Button variant="destructive">
                  {t("settings.deleteAccount")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.notificationSettings")}</CardTitle>
              <CardDescription>{t("settings.notificationSettingsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">{t("settings.emailNotifications")}</Label>
                <Switch 
                  id="email-notifications" 
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) => updateNotificationPreference("emailNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="project-updates">{t("settings.projectUpdates")}</Label>
                <Switch 
                  id="project-updates" 
                  checked={settings.notifications.projectUpdates}
                  onCheckedChange={(checked) => updateNotificationPreference("projectUpdates", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="new-messages">{t("settings.newMessages")}</Label>
                <Switch 
                  id="new-messages" 
                  checked={settings.notifications.newMessages}
                  onCheckedChange={(checked) => updateNotificationPreference("newMessages", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="marketing">{t("settings.marketingEmails")}</Label>
                <Switch 
                  id="marketing" 
                  checked={settings.notifications.marketingEmails}
                  onCheckedChange={(checked) => updateNotificationPreference("marketingEmails", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.appearanceSettings")}</CardTitle>
              <CardDescription>{t("settings.appearanceSettingsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("settings.theme")}</Label>
                <RadioGroup 
                  value={settings.theme} 
                  onValueChange={(value) => updateTheme(value as "light" | "dark" | "system")}
                >
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">{t("settings.light")}</Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark">{t("settings.dark")}</Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system">{t("settings.system")}</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}