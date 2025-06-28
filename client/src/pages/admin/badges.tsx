import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Award, Users, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";

interface Badge {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  type: "plan" | "custom";
  planKey?: string;
  isActive: boolean;
  translations?: Record<string, { name: string; description: string }>;
}

interface User {
  id: number;
  fullName: string;
  username: string;
  role: string;
}

export default function AdminBadgesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  
  const [newBadge, setNewBadge] = useState({
    name: "",
    description: "",
    icon: "",
    color: "bg-blue-500 text-white",
    type: "custom" as "plan" | "custom",
    planKey: "",
    translations: {
      en: { name: "", description: "" },
      ar: { name: "", description: "" }
    }
  });

  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);

  // Fetch badges
  const { data: badges = [], isLoading: isLoadingBadges } = useQuery<Badge[]>({
    queryKey: ["/api/admin/badges"],
  });

  // Fetch freelancers for assignment
  const { data: freelancers = [], isLoading: isLoadingFreelancers } = useQuery<User[]>({
    queryKey: ["/api/admin/freelancers"],
  });

  const handleCreateBadge = async () => {
    try {
      await apiRequest("POST", "/api/admin/badges", newBadge);
      
      toast({
        title: t("common.success"),
        description: t("admin.badgeCreated"),
        variant: "default",
      });
      
      setIsCreateDialogOpen(false);
      setNewBadge({
        name: "",
        description: "",
        icon: "",
        color: "bg-blue-500 text-white",
        type: "custom",
        planKey: "",
        translations: {
          en: { name: "", description: "" },
          ar: { name: "", description: "" }
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/badges"] });
    } catch (error) {
      console.error("Error creating badge:", error);
      toast({
        title: t("common.error"),
        description: t("admin.errorCreatingBadge"),
        variant: "destructive",
      });
    }
  };

  const handleEditBadge = async () => {
    if (!editingBadge) return;
    
    try {
      // Only send the fields that should be updated
      const updateData = {
        name: editingBadge.name || "",
        description: editingBadge.description || "",
        icon: editingBadge.icon || "",
        color: editingBadge.color || "bg-blue-500 text-white",
        translations: editingBadge.translations || {}
      };
      
      await apiRequest("PUT", `/api/admin/badges/${editingBadge.id}`, updateData);
      
      toast({
        title: t("common.success"),
        description: t("admin.badgeUpdated"),
        variant: "default",
      });
      
      setIsEditDialogOpen(false);
      setEditingBadge(null);
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/badges"] });
    } catch (error) {
      console.error("Error updating badge:", error);
      toast({
        title: t("common.error"),
        description: t("admin.errorUpdatingBadge"),
        variant: "destructive",
      });
    }
  };

  const handleAssignBadge = async () => {
    if (!selectedBadge || !selectedUser) return;
    
    try {
      await apiRequest("POST", `/api/admin/users/${selectedUser}/badges`, {
        badgeId: selectedBadge.id,
        expiresAt: expiresAt || null
      });
      
      toast({
        title: t("common.success"),
        description: t("admin.badgeAssigned"),
        variant: "default",
      });
      
      setIsAssignDialogOpen(false);
      setSelectedBadge(null);
      setSelectedUser(null);
      setExpiresAt("");
      setUserSearchQuery("");
    } catch (error) {
      console.error("Error assigning badge:", error);
      toast({
        title: t("common.error"),
        description: t("admin.errorAssigningBadge"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteBadge = async (badgeId: number) => {
    if (!window.confirm(t("admin.confirmDeleteBadge"))) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/badges/${badgeId}`);
      
      toast({
        title: t("common.success"),
        description: t("admin.badgeDeleted"),
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/badges"] });
    } catch (error) {
      console.error("Error deleting badge:", error);
      toast({
        title: t("common.error"),
        description: t("admin.errorDeletingBadge"),
        variant: "destructive",
      });
    }
  };

  const colorOptions = [
    { value: "bg-blue-500 text-white", label: "Blue" },
    { value: "bg-green-500 text-white", label: "Green" },
    { value: "bg-yellow-500 text-white", label: "Yellow" },
    { value: "bg-red-500 text-white", label: "Red" },
    { value: "bg-purple-500 text-white", label: "Purple" },
    { value: "bg-pink-500 text-white", label: "Pink" },
    { value: "bg-indigo-500 text-white", label: "Indigo" },
    { value: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white", label: "Gradient" },
  ];

  // Filter freelancers based on search query
  const filteredFreelancers = freelancers.filter((user) => {
    const searchLower = userSearchQuery.toLowerCase();
    const fullName = (user.fullName || "").toLowerCase();
    const username = (user.username || "").toLowerCase();
    
    return fullName.includes(searchLower) || username.includes(searchLower);
  });

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t("admin.badges")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("admin.badgesDescription", { defaultValue: "Manage badges and assign them to freelancers" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Award className="mr-2 h-4 w-4" />
                  {t("admin.assignBadge")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("admin.assignBadge")}</DialogTitle>
                  <DialogDescription>
                    {t("admin.assignBadgeDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t("admin.selectBadge")}</Label>
                    <Select onValueChange={(value) => {
                      const badge = badges.find(b => b.id.toString() === value);
                      setSelectedBadge(badge || null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("admin.selectBadge")} />
                      </SelectTrigger>
                      <SelectContent>
                        {badges.filter(b => b.type === "custom").map((badge) => (
                          <SelectItem key={badge.id} value={badge.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Badge className={badge.color}>
                                {badge.icon} {badge.name}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("admin.selectUser")}</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder={t("admin.searchUsers", { defaultValue: "Search users by name or username..." })}
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                      <Select onValueChange={(value) => setSelectedUser(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("admin.selectUser")} />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredFreelancers.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">
                              {userSearchQuery ? t("admin.noUsersFound", { defaultValue: "No users found" }) : t("admin.loadingUsers", { defaultValue: "Loading users..." })}
                            </div>
                          ) : (
                            filteredFreelancers.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{user.fullName || user.username}</span>
                                  {user.fullName && user.username && (
                                    <span className="text-xs text-gray-500">@{user.username}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>{t("admin.expiresAt")} ({t("admin.optional")})</Label>
                    <Input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAssignBadge} disabled={!selectedBadge || !selectedUser}>
                    {t("admin.assignBadge")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("admin.createBadge")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("admin.createBadge")}</DialogTitle>
                  <DialogDescription>
                    {t("admin.createBadgeDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t("admin.badgeName")}</Label>
                    <Input
                      value={newBadge.name}
                      onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                      placeholder={t("admin.badgeNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <Label>{t("admin.badgeDescription")}</Label>
                    <Textarea
                      value={newBadge.description}
                      onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                      placeholder={t("admin.badgeDescriptionPlaceholder")}
                    />
                  </div>
                  <div>
                    <Label>{t("admin.badgeIcon")}</Label>
                    <Input
                      value={newBadge.icon}
                      onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                      placeholder="🏆"
                    />
                  </div>
                  <div>
                    <Label>{t("admin.badgeColor")}</Label>
                    <Select onValueChange={(value) => setNewBadge({ ...newBadge, color: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded ${color.value}`}></div>
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateBadge}>
                    {t("admin.createBadge")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoadingBadges ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-200 dark:border-gray-700">
                  <TableHead className="font-semibold text-gray-900 dark:text-gray-100">{t("admin.badgeName")}</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-gray-100">{t("admin.badgeType")}</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-gray-100">{t("admin.badgeColor")}</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-right">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {badges.map((badge, index) => (
                  <TableRow 
                    key={badge.id} 
                    className={index % 2 === 0 ? "bg-gray-50 dark:bg-gray-900" : "bg-white dark:bg-gray-800"}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Badge className={badge.color}>
                          {badge.icon} {badge.name}
                        </Badge>
                        {badge.description && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {badge.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.type === "plan" ? "default" : "secondary"}>
                        {badge.type === "plan" ? t("admin.planBased") : t("admin.custom")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded ${badge.color}`}></div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {colorOptions.find(c => c.value === badge.color)?.label || "Custom"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {badge.type === "custom" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingBadge(badge);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBadge(badge);
                                setIsAssignDialogOpen(true);
                              }}
                            >
                              <Award className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteBadge(badge.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {badge.type === "plan" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBadge(badge);
                              setIsAssignDialogOpen(true);
                            }}
                          >
                            <Award className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Badge Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.editBadge")}</DialogTitle>
            <DialogDescription>
              {t("admin.editBadgeDescription", { defaultValue: "Update badge information" })}
            </DialogDescription>
          </DialogHeader>
          {editingBadge && (
            <div className="space-y-4">
              <div>
                <Label>{t("admin.badgeName")}</Label>
                <Input
                  value={editingBadge.name}
                  onChange={(e) => setEditingBadge({ ...editingBadge, name: e.target.value })}
                  placeholder={t("admin.badgeNamePlaceholder")}
                />
              </div>
              <div>
                <Label>{t("admin.badgeDescription")}</Label>
                <Textarea
                  value={editingBadge.description || ""}
                  onChange={(e) => setEditingBadge({ ...editingBadge, description: e.target.value })}
                  placeholder={t("admin.badgeDescriptionPlaceholder")}
                />
              </div>
              <div>
                <Label>{t("admin.badgeIcon")}</Label>
                <Input
                  value={editingBadge.icon || ""}
                  onChange={(e) => setEditingBadge({ ...editingBadge, icon: e.target.value })}
                  placeholder="🏆"
                />
              </div>
              <div>
                <Label>{t("admin.badgeColor")}</Label>
                <Select 
                  value={editingBadge.color} 
                  onValueChange={(value) => setEditingBadge({ ...editingBadge, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.value}`}></div>
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleEditBadge}>
                {t("admin.updateBadge")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 