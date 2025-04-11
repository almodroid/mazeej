import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import ChatWidget from "@/components/chat/chat-widget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@shared/schema";

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Fetch user profile data
  const { data: profile } = useQuery<User>({
    queryKey: ["/api/users/profile"],
    enabled: !!user,
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex">
        <DashboardSidebar />
        <main className="flex-grow p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-cairo font-bold mb-6">
              {t("profile.title")}
            </h1>

            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t("profile.personalInfo")}</CardTitle>
                    <CardDescription>{t("profile.personalInfoDesc")}</CardDescription>
                  </div>
                  <Button 
                    variant={isEditing ? "default" : "outline"}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? t("common.save") : t("common.edit")}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="w-32 h-32">
                        <AvatarImage src={profile?.profileImage || undefined} alt={profile?.fullName || user.username} />
                        <AvatarFallback>{user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <Button variant="outline" size="sm">
                          {t("profile.changePhoto")}
                        </Button>
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">{t("profile.fullName")}</Label>
                          <Input 
                            id="fullName" 
                            defaultValue={profile?.fullName || ""} 
                            readOnly={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">{t("profile.username")}</Label>
                          <Input 
                            id="username" 
                            defaultValue={user.username || ""} 
                            readOnly
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{t("profile.email")}</Label>
                          <Input 
                            id="email" 
                            defaultValue={user.email || ""} 
                            readOnly={!isEditing}
                            type="email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">{t("profile.phone")}</Label>
                          <Input 
                            id="phone" 
                            defaultValue={profile?.phone || ""} 
                            readOnly={!isEditing}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">{t("profile.bio")}</Label>
                        <Textarea 
                          id="bio" 
                          defaultValue={profile?.bio || ""} 
                          readOnly={!isEditing}
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {user.role === "freelancer" && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("profile.professionalInfo")}</CardTitle>
                    <CardDescription>{t("profile.professionalInfoDesc")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">{t("profile.professionalTitle")}</Label>
                        
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="skills">{t("profile.skills")}</Label>
                        
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate">{t("profile.hourlyRate")}</Label>
                        <Input 
                          id="hourlyRate" 
                          defaultValue={profile?.hourlyRate?.toString() || ""} 
                          readOnly={!isEditing}
                          type="number"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
      <ChatWidget isOpen={chatOpen} setIsOpen={setChatOpen} />
    </div>
  );
}