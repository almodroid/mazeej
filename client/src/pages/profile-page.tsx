import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Skill, Category, freelancerLevelEnum } from "@shared/schema";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/api";

type FreelancerLevel = typeof freelancerLevelEnum.enumValues[number];

type FormData = {
  fullName: string;
  bio: string;
  phone: string;
  hourlyRate: string;
  freelancerLevel: FreelancerLevel;
  selectedSkills: Skill[];
};

type CategoryWithSkills = Category & {
  skills: Skill[];
};

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Fetch user profile data
  const { data: profile } = useQuery<User>({
    queryKey: ["/api/users/profile"],
    enabled: !!user,
  });

  // Fetch categories and skills
  const { data: categories = [] } = useQuery<CategoryWithSkills[]>({
    queryKey: ["/api/categories"],
  });

  const { data: userSkills = [] } = useQuery<Skill[]>({
    queryKey: [`/api/users/${user?.id}/skills`],
    enabled: !!user,
  });

  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: profile?.fullName || "",
    bio: profile?.bio || "",
    phone: profile?.phone || "",
    hourlyRate: profile?.hourlyRate?.toString() || "",
    freelancerLevel: (profile?.freelancerLevel as FreelancerLevel) || "intermediate",
    selectedSkills: userSkills,
  });

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        hourlyRate: profile.hourlyRate?.toString() || "",
        freelancerLevel: (profile.freelancerLevel as FreelancerLevel) || "intermediate",
        selectedSkills: userSkills,
      });
    }
  }, [profile, userSkills]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await apiRequest("PATCH", "/api/users/profile", data);
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      setIsEditing(false);
    },
  });

  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      const response = await apiRequest("POST", `/api/users/${user?.id}/skills`, { skillId });
      if (!response.ok) {
        throw new Error("Failed to add skill");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/skills`] });
    },
  });

  // Remove skill mutation
  const removeSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      const response = await apiRequest("DELETE", `/api/users/${user?.id}/skills/${skillId}`);
      if (!response.ok) {
        throw new Error("Failed to remove skill");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/skills`] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      fullName: formData.fullName,
      bio: formData.bio,
      phone: formData.phone,
      hourlyRate: parseInt(formData.hourlyRate),
      freelancerLevel: formData.freelancerLevel,
    });
  };

  const handleSkillSelect = (skillId: number) => {
    addSkillMutation.mutate(skillId);
  };

  const handleRemoveSkill = (skillId: number) => {
    removeSkillMutation.mutate(skillId);
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-cairo font-bold mb-6">
        {t("profile.title")}
      </h1>

      <form onSubmit={handleSubmit}>
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
                type={isEditing ? "submit" : "button"}
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
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">{t("profile.username")}</Label>
                      <Input 
                        id="username" 
                        value={user.username || ""} 
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("profile.email")}</Label>
                      <Input 
                        id="email" 
                        value={user.email || ""} 
                        readOnly={!isEditing}
                        type="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("profile.phone")}</Label>
                      <Input 
                        id="phone" 
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">{t("profile.bio")}</Label>
                    <Textarea 
                      id="bio" 
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
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
                    <Label htmlFor="freelancerLevel">{t("profile.level")}</Label>
                    <Select
                      value={formData.freelancerLevel}
                      onValueChange={(value) => setFormData({ ...formData, freelancerLevel: value as FreelancerLevel })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("profile.selectLevel")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">{t("profile.beginner")}</SelectItem>
                        <SelectItem value="intermediate">{t("profile.intermediate")}</SelectItem>
                        <SelectItem value="advanced">{t("profile.advanced")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">{t("profile.skills")}</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {userSkills.map((skill) => (
                        <Badge key={skill.id} variant="outline" className="flex items-center gap-1">
                          {skill.name}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill.id)}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <Select
                        onValueChange={(value) => handleSkillSelect(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("profile.addSkill")} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <div key={category.id}>
                              <div className="px-2 py-1.5 text-sm font-semibold">
                                {category.name}
                              </div>
                              {category.skills?.map((skill) => (
                                <SelectItem key={skill.id} value={skill.id.toString()}>
                                  {skill.name}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">{t("profile.hourlyRate")}</Label>
                    <Input 
                      id="hourlyRate" 
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      readOnly={!isEditing}
                      type="number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </form>
    </DashboardLayout>
  );
}