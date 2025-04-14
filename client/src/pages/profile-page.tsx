import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef } from "react";
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
import { X, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type FreelancerLevel = typeof freelancerLevelEnum.enumValues[number];

type FormData = {
  fullName: string;
  bio: string;
  phone: string;
  hourlyRate: string;
  freelancerLevel: FreelancerLevel;
  selectedSkills: Skill[];
  profileImage?: string;
};

type CategoryWithSkills = Category & {
  skills: Skill[];
};

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  const { data: profile, isLoading: isLoadingProfile } = useQuery<User>({
    queryKey: [`/api/users/${user?.id}`],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      const response = await apiRequest("GET", `/api/users/${user.id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch profile");
      }
      return response.json();
    },
    enabled: !!user?.id,
    retry: false,
  });

  const { data: categories = [] } = useQuery<CategoryWithSkills[]>({
    queryKey: ["/api/categories"],
  });

  const { data: userSkills = [], isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: [`/api/users/${user?.id}/skills`],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      const response = await apiRequest("GET", `/api/users/${user.id}/skills`);
      if (!response.ok) {
        console.error("Failed to fetch skills");
        return [];
      }
      return response.json();
    },
    enabled: !!user?.id && user.role === 'freelancer',
    placeholderData: [],
  });

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    bio: "",
    phone: "",
    hourlyRate: "",
    freelancerLevel: "intermediate",
    selectedSkills: [],
    profileImage: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        hourlyRate: profile.hourlyRate?.toString() || "",
        freelancerLevel: (profile.freelancerLevel as FreelancerLevel) || "intermediate",
        selectedSkills: userSkills,
        profileImage: profile.profileImage || "",
      });
    }
  }, [profile, userSkills]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      const response = await apiRequest("PATCH", `/api/users/profile`, data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl(null);
      toast({ title: t("profile.updateSuccess") });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: t("common.error"), description: error.message });
    }
  });

  const addSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      const response = await apiRequest("POST", `/api/users/${user.id}/skills`, { skillId });
      if (!response.ok) {
        throw new Error("Failed to add skill");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/skills`] });
      toast({ title: t("profile.skillAdded") });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: t("common.error"), description: error.message });
    }
  });

  const removeSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      const response = await apiRequest("DELETE", `/api/users/${user.id}/skills/${skillId}`);
      if (!response.ok) {
        throw new Error("Failed to remove skill");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/skills`] });
      toast({ title: t("profile.skillRemoved") });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: t("common.error"), description: error.message });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: "destructive", title: t("profile.avatarTypeError"), description: t("profile.avatarTypeErrorDesc") });
        setSelectedAvatarFile(null);
        setAvatarPreviewUrl(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
         toast({ variant: "destructive", title: t("profile.avatarSizeError"), description: t("profile.avatarSizeErrorDesc", { size: '5MB' }) });
         setSelectedAvatarFile(null);
         setAvatarPreviewUrl(null);
         if(fileInputRef.current) fileInputRef.current.value = "";
         return;
      }

      setSelectedAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      setAvatarPreviewUrl(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let uploadedAvatarPath: string | undefined = formData.profileImage;

    // Check if user is actually authenticated - add a clear message if not
    if (!user || !user.id) {
      toast({ 
        variant: "destructive", 
        title: "Authentication Error", 
        description: "You must be logged in to upload a profile photo." 
      });
      return;
    }

    if (selectedAvatarFile) {
      setIsUploadingAvatar(true);
      const avatarFormData = new FormData();
      avatarFormData.append("avatar", selectedAvatarFile);

      try {
        // Check if user is authenticated before upload
        console.log("Authentication status:", !!user, "User ID:", user?.id);
        console.log("Uploading avatar file:", selectedAvatarFile.name, selectedAvatarFile.type, selectedAvatarFile.size);
        
        // Try using a manual fetch that includes the credentials
        console.log("Sending file upload request to /api/upload/avatar");
        const uploadResponse = await fetch("/api/upload/avatar", {
          method: "POST",
          body: avatarFormData,
          credentials: "include"
        });
        
        console.log("Response status:", uploadResponse.status, uploadResponse.statusText);
        console.log("Response headers:", Object.fromEntries(uploadResponse.headers.entries()));
        
        // Get the response as text first for inspection
        const responseText = await uploadResponse.text();
        console.log("Raw response body:", responseText);
        
        if (!uploadResponse.ok) {
          console.error("Avatar upload failed with status:", uploadResponse.status);
          
          let errorMessage = "Failed to upload avatar";
          try {
            // Try to parse as JSON, but it might be HTML
            if (responseText.trim()) {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorMessage;
            }
          } catch (e) {
            // If response has HTML, extract potential error message
            if (responseText.includes("<body")) {
              errorMessage = `Server error (${uploadResponse.status}): HTML response received`;
              console.error("Server returned HTML instead of JSON. Check server logs.");
            } else {
              errorMessage = `Server error (${uploadResponse.status})`;
            }
          }
          
          throw new Error(errorMessage);
        }
        
        let uploadResult;
        try {
          if (!responseText.trim()) {
            throw new Error("Empty response from server");
          }
          uploadResult = JSON.parse(responseText);
          console.log("Parsed response:", uploadResult);
        } catch (e) {
          console.error("Failed to parse response as JSON:", e);
          if (responseText.startsWith("<!DOCTYPE") || responseText.startsWith("<html")) {
            throw new Error("Server error: HTML response received instead of JSON");
          } else {
            throw new Error(`Invalid server response format: ${responseText.substring(0, 50)}...`);
          }
        }
        
        if (!uploadResult.filePath) {
          throw new Error("Server response missing filePath");
        }
        
        uploadedAvatarPath = uploadResult.filePath;
        console.log("Avatar uploaded successfully, path:", uploadedAvatarPath);

      } catch (error: any) {
        console.error("Avatar upload error:", error);
        toast({ variant: "destructive", title: t("profile.avatarUploadError"), description: error.message });
        setIsUploadingAvatar(false);
        return;
      } finally {
        setIsUploadingAvatar(false);
      }
    }

    const updateData: Partial<User> = {
      fullName: formData.fullName,
      bio: formData.bio,
      phone: formData.phone,
      profileImage: uploadedAvatarPath,
    };

    if (user?.role === 'freelancer') {
      updateData.hourlyRate = formData.hourlyRate ? parseInt(formData.hourlyRate) : undefined;
      updateData.freelancerLevel = formData.freelancerLevel;
    }
    
    try {
      console.log("Updating profile with data:", updateData);
      updateProfileMutation.mutate(updateData);
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({ variant: "destructive", title: t("common.error"), description: error.message });
    }
  };

  const handleSkillSelect = (skillId: number) => {
    if (!userSkills.some(s => s.id === skillId)) {
      addSkillMutation.mutate(skillId);
    }
  };

  const handleRemoveSkill = (skillId: number) => {
    removeSkillMutation.mutate(skillId);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (isLoadingProfile) {
    return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;
  }

  if (!profile && !isLoadingProfile) {
     return (
       <DashboardLayout>
         <div className="text-center text-red-600">{t("profile.fetchError")}</div>
       </DashboardLayout>
     );
  }

  if (!user || !profile) {
    return null;
  }

  const currentAvatarSrc = avatarPreviewUrl || formData.profileImage || profile?.profileImage || undefined;

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
              {isEditing ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { 
                    setIsEditing(false); 
                    setSelectedAvatarFile(null);
                    setAvatarPreviewUrl(null);
                    if (profile) {
                       setFormData({
                         fullName: profile.fullName || "",
                         bio: profile.bio || "",
                         phone: profile.phone || "",
                         hourlyRate: profile.hourlyRate?.toString() || "",
                         freelancerLevel: (profile.freelancerLevel as FreelancerLevel) || "intermediate",
                         selectedSkills: userSkills,
                         profileImage: profile.profileImage || "",
                       });
                    }
                  }} type="button">
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateProfileMutation.isPending || isUploadingAvatar}
                  >
                    {(updateProfileMutation.isPending || isUploadingAvatar) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("common.save")}
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  type="button"
                >
                  {t("common.edit")}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage key={currentAvatarSrc} src={currentAvatarSrc} alt={profile?.fullName || user.username} />
                    <AvatarFallback>{user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={triggerFileInput}
                        type="button"
                        disabled={isUploadingAvatar}
                      >
                         {isUploadingAvatar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                         {t("profile.changePhoto")}
                      </Button>
                    </>
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
                     {isLoadingSkills ? (
                       <div className="flex items-center justify-center py-4">
                         <Loader2 className="h-5 w-5 animate-spin" />
                       </div>
                     ) : (
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
                        {userSkills.map((skill) => (
                          <Badge key={skill.id} variant="secondary" className="flex items-center gap-1">
                            {skill.name}
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(skill.id)}
                                className="hover:text-destructive disabled:opacity-50"
                                disabled={removeSkillMutation.isPending || addSkillMutation.isPending}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                        {isEditing && (
                          <Select
                            onValueChange={(value) => {
                              handleSkillSelect(parseInt(value));
                            }}
                            disabled={addSkillMutation.isPending || removeSkillMutation.isPending}
                          >
                            <SelectTrigger className="w-[180px] border-0 focus:ring-0 focus:ring-offset-0 h-auto py-1 px-2 text-sm">
                              <SelectValue placeholder={t("profile.addSkill")} />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <div key={category.id}>
                                  <div className="px-2 py-1.5 text-sm font-semibold">
                                    {category.name}
                                  </div>
                                  {category.skills?.map((skill) => (
                                    <SelectItem 
                                      key={skill.id} 
                                      value={skill.id.toString()}
                                      disabled={userSkills.some(s => s.id === skill.id)}
                                    >
                                      {skill.name}
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                     )}
                     {isEditing && <p className="text-sm text-muted-foreground">{t("profile.skillsHelp")}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">{t("profile.hourlyRate")}</Label>
                    <Input 
                      id="hourlyRate" 
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      readOnly={!isEditing}
                      type="number"
                      min="0"
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