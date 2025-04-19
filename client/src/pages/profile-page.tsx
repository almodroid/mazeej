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
import { Camera, Check, File, Loader2, Upload, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type FreelancerLevel = typeof freelancerLevelEnum.enumValues[number];

type FormData = {
  fullName: string;
  bio: string;
  phone: string;
  hourlyRate: string;
  freelancerLevel: FreelancerLevel;
  selectedSkills: number[];
};

type CategoryWithSkills = Category & {
  skills: Skill[];
};

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Fetch user profile data
  const { data: profile, isLoading: isProfileLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: !!user,
  });

  // Fetch categories and skills
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<CategoryWithSkills[]>({
    queryKey: ["/api/categories-with-skills"],
  });

  const { data: userSkills = [], isLoading: isSkillsLoading } = useQuery<Skill[]>({
    queryKey: [`/api/users/${user?.id}/skills`],
    enabled: !!user,
  });

  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    bio: "",
    phone: "",
    hourlyRate: "",
    freelancerLevel: "intermediate",
    selectedSkills: [],
  });

  // Memoize the current selected skills to use in dependency array without causing loops
  const currentSelectedSkillsStr = JSON.stringify([...formData.selectedSkills].sort());

  // Update base profile data
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.fullName || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        hourlyRate: profile.hourlyRate?.toString() || "",
        freelancerLevel: (profile.freelancerLevel as FreelancerLevel) || "intermediate",
      }));
    }
  }, [profile]);

  // Update skills separately
  useEffect(() => {
    if (userSkills && userSkills.length > 0 && !isSkillsLoading) {
      // Create a string representation for comparison to avoid infinite loops
      const newSkillIds = userSkills.map(skill => skill.id);
      const newSkillsStr = JSON.stringify(newSkillIds.sort());
      
      if (newSkillsStr !== currentSelectedSkillsStr) {
        setFormData(prev => ({
          ...prev,
          selectedSkills: newSkillIds,
        }));
      }
    }
  }, [userSkills, isSkillsLoading, currentSelectedSkillsStr]);

  // Handle avatar file change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: t("error"),
          description: t("profile.invalidImageType"),
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t("error"),
          description: t("profile.imageTooLarge"),
          variant: "destructive",
        });
        return;
      }
      
      setAvatarFile(file);
      setIsAvatarDialogOpen(true);
    }
  };

  // Upload avatar
  const uploadAvatar = async () => {
    if (!avatarFile || !user) return;
    
    setUploadingAvatar(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', avatarFile);
      
      // Upload the file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(t("profile.avatarUploadFailed"));
      }
      
      const fileData = await response.json();
      
      // Update user profile with the new image URL
      const updateResponse = await apiRequest("PATCH", "/api/users/profile", {
        profileImage: `/uploads/${fileData.filename}`
      });
      
      if (!updateResponse.ok) {
        throw new Error(t("profile.profileUpdateFailed"));
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: t("profile.avatarSuccess"),
        description: t("profile.avatarSuccessDesc"),
        variant: "default",
      });
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("profile.avatarUploadFailed"),
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      setIsAvatarDialogOpen(false);
      setAvatarFile(null);
    }
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      if (!user) throw new Error("User not authenticated");
      setIsSubmitting(true);
      try {
        const response = await apiRequest("PATCH", "/api/users/profile", data);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Failed to update profile" }));
          throw new Error(errorData.message || "Failed to update profile");
        }
        return response.json();
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
      toast({
        title: t("profile.updateSuccess"),
        description: t("profile.updateSuccessDesc"),
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("profile.updateFailed"),
        description: error.message || t("profile.updateFailedDesc"),
        variant: "destructive",
      });
    }
  });

  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      if (!user?.id) throw new Error("User not authenticated");
      const response = await apiRequest("POST", `/api/users/${user.id}/skills`, { skillId });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to add skill" }));
        throw new Error(errorData.message || "Failed to add skill");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/skills`] });
      toast({
        title: t("profile.skillAdded"),
        description: t("profile.skillAddedDesc"),
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("profile.skillAddFailed"),
        description: error.message || t("profile.skillAddFailedDesc"),
        variant: "destructive",
      });
    }
  });

  // Remove skill mutation
  const removeSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      if (!user?.id) throw new Error("User not authenticated");
      const response = await apiRequest("DELETE", `/api/users/${user.id}/skills/${skillId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to remove skill" }));
        throw new Error(errorData.message || "Failed to remove skill");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/skills`] });
      toast({
        title: t("profile.skillRemoved"),
        description: t("profile.skillRemovedDesc"),
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("profile.skillRemoveFailed"),
        description: error.message || t("profile.skillRemoveFailedDesc"),
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validate required fields
    if (!formData.fullName.trim()) {
      toast({
        title: t("error"),
        description: t("profile.fullNameRequired"),
        variant: "destructive",
      });
      return;
    }
    
    const profileData: Partial<User> = {
      fullName: formData.fullName,
      bio: formData.bio,
      phone: formData.phone,
    };
    
    // Add freelancer specific fields if the user is a freelancer
    if (user.role === "freelancer") {
      profileData.hourlyRate = formData.hourlyRate ? parseInt(formData.hourlyRate) : undefined;
      profileData.freelancerLevel = formData.freelancerLevel;
    }
    
    updateProfileMutation.mutate(profileData);
  };

  const handleSkillSelect = (skillId: number) => {
    if (!user) return;
    // Check if skill is already added
    if (formData.selectedSkills.includes(skillId)) {
      toast({
        title: t("profile.skillExists"),
        description: t("profile.skillExistsDesc"),
        variant: "destructive",
      });
      return;
    }
    addSkillMutation.mutate(skillId);
  };

  const handleRemoveSkill = (skillId: number) => {
    if (!user) return;
    removeSkillMutation.mutate(skillId);
  };

  // Handle cancel button
  const handleCancel = () => {
    // Reset form data to current profile data
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        hourlyRate: profile.hourlyRate?.toString() || "",
        freelancerLevel: (profile.freelancerLevel as FreelancerLevel) || "intermediate",
        selectedSkills: userSkills.map(skill => skill.id),
      });
    }
    setIsEditing(false);
  };

  if (isAuthLoading || isProfileLoading || isSkillsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-cairo font-bold mb-6">
        {t("profile.title")}
      </h1>

      {/* Hidden file input for avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleAvatarChange}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("profile.personalInfo")}</CardTitle>
                <CardDescription>{t("profile.personalInfoDesc")}</CardDescription>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline"
                      onClick={handleCancel}
                      type="button"
                      disabled={isSubmitting}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button 
                      variant="default"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      {t("common.save")}
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    type="button"
                  >
                    {t("common.edit")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={profile?.profileImage || undefined} alt={profile?.fullName || user.username} />
                    <AvatarFallback>{user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {t("profile.changePhoto")}
                    </Button>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">{t("profile.fullName")} *</Label>
                      <Input 
                        id="fullName" 
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        readOnly={!isEditing}
                        required
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
                        readOnly
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
                      {userSkills.length === 0 && (
                        <span className="text-muted-foreground text-sm">{t("profile.noSkills")}</span>
                      )}
                    </div>
                    {isEditing && (isCategoriesLoading ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {t("common.loading")}
                      </div>
                    ) : categories.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{t("profile.selectCategory")}</p>
                        <Select
                          onValueChange={(value) => {
                            try {
                              const skillId = parseInt(value);
                              if (isNaN(skillId)) {
                                return;
                              }
                              handleSkillSelect(skillId);
                            } catch (err) {
                              // Silent error handling
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("profile.addSkill")} />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => {
                              return (
                                <div key={category.id}>
                                  <div className="px-2 py-1.5 text-sm font-semibold">
                                    {category.name}
                                  </div>
                                  {category.skills && category.skills.length > 0 ? (
                                    category.skills.map((skill) => {
                                      return (
                                        <SelectItem key={skill.id} value={skill.id.toString()}>
                                          {skill.name}
                                        </SelectItem>
                                      );
                                    })
                                  ) : (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                      {t("profile.noSkillsInCategory")}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {t("profile.noCategoriesFound")}
                      </div>
                    ))}
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

      {/* Avatar Upload Dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("profile.uploadPhoto")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            {avatarFile && (
              <div className="flex items-center justify-center w-32 h-32 overflow-hidden rounded-full border-2 border-primary">
                <img
                  src={URL.createObjectURL(avatarFile)}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {avatarFile?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {avatarFile ? `${(avatarFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAvatarDialogOpen(false);
                setAvatarFile(null);
              }}
              disabled={uploadingAvatar}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={uploadAvatar}
              disabled={!avatarFile || uploadingAvatar}
            >
              {uploadingAvatar ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("common.uploading")}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t("common.upload")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}