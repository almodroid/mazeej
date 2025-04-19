import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus,
  Layers,
  Edit,
  Trash,
  Loader2,
  Settings,
  X,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import AdminLayout from "@/components/layouts/admin-layout";

// Define interfaces for data
interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface Skill {
  id: string;
  name: string;
  categoryId: string;
  translations?: Record<string, string>;
}

interface NewSkill {
  name: string;
  categoryId: string;
  translations: {
    en: string;
    ar: string;
  };
}

export default function AdminSkillsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === "ar";
  
  // New skill state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState<NewSkill>({ 
    name: "", 
    categoryId: "", 
    translations: { en: "", ar: "" } 
  });
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch categories data
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/categories");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });
  
  // Fetch skills data
  const { data: skills = [], isLoading: isLoadingSkills } = useQuery({
    queryKey: ["/api/skills"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/skills");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Handle adding a new skill
  const handleAddSkill = async () => {
    // Check if either English or Arabic name is provided
    if (!newSkill.translations.en.trim() && !newSkill.translations.ar.trim()) {
      toast({
        title: t("common.error"),
        description: t("admin.skillNameRequired", { defaultValue: "Skill name is required" }),
        variant: "destructive",
      });
      return;
    }

    if (!newSkill.categoryId) {
      toast({
        title: t("common.error"),
        description: t("admin.categoryRequired", { defaultValue: "Category is required" }),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Set the main name field based on translations
      // Use Arabic if available, otherwise use English
      const skillToSubmit = {
        ...newSkill,
        name: newSkill.translations.ar.trim() || newSkill.translations.en.trim()
      };
      
      // Make API request to add the skill
      const response = await apiRequest("POST", "/api/skills", skillToSubmit);
      const data = await response.json();
      
      // Show success toast
      toast({
        title: t("common.success"),
        description: t("admin.skillAdded", { defaultValue: "Skill added successfully" }),
        variant: "default",
      });
      
      // Reset form and close dialog
      setNewSkill({ 
        name: "", 
        categoryId: "", 
        translations: { en: "", ar: "" } 
      });
      setIsDialogOpen(false);
      
      // Refresh skills data
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.skillAddError", { defaultValue: "Failed to add skill" }),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle editing a skill
  const handleEditSkill = async () => {
    if (!editingSkill) return;
    
    // Check if either English or Arabic name is provided
    if (!editingSkill.translations?.en?.trim() && !editingSkill.translations?.ar?.trim()) {
      toast({
        title: t("common.error"),
        description: t("admin.skillNameRequired", { defaultValue: "Skill name is required" }),
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Set the main name field based on translations
      const skillToUpdate = {
        ...editingSkill,
        name: editingSkill.translations?.ar?.trim() || editingSkill.translations?.en?.trim() || editingSkill.name
      };
      
      // Make API request to update the skill
      const response = await apiRequest("PUT", `/api/skills/${editingSkill.id}`, skillToUpdate);
      const data = await response.json();
      
      // Show success toast
      toast({
        title: t("common.success"),
        description: t("admin.skillUpdated", { defaultValue: "Skill updated successfully" }),
        variant: "default",
      });
      
      // Reset form and close dialog
      setEditingSkill(null);
      setIsEditDialogOpen(false);
      
      // Refresh skills data
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.skillUpdateError", { defaultValue: "Failed to update skill" }),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a skill
  const handleDeleteSkill = async (skillId: string) => {
    try {
      // Make API request to delete the skill
      const response = await apiRequest("DELETE", `/api/skills/${skillId}`);
      
      // Show success toast
      toast({
        title: t("common.success"),
        description: t("admin.skillDeleted", { defaultValue: "Skill deleted successfully" }),
        variant: "default",
      });
      
      // Refresh skills data
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.skillDeleteError", { defaultValue: "Failed to delete skill" }),
        variant: "destructive",
      });
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: Category) => cat.id === categoryId);
    return category ? category.name : '';
  };

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-6">
        <div className={cn(
          "flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
          
        )}>
          <div>
            <h1 className="text-3xl font-cairo font-bold mb-2 text-foreground">
              {t("admin.skills", { defaultValue: "Skills" })}
            </h1>
            <p className="text-muted-foreground">
              {t("admin.skillsDescription", { defaultValue: "Manage skills that users can add to their profiles" })}
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <div className={cn(
              "flex justify-between items-center",
       
            )}>
              <CardTitle>{t("admin.skills", { defaultValue: "Skills" })}</CardTitle>
              <div className={cn(
                "flex items-center gap-2",
           
              )}>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className={cn("gap-1", isRTL && "flex-row")}>
                      <Plus className="h-4 w-4" />
                      <span>{t("common.add")}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>{t("admin.addSkill", { defaultValue: "Add New Skill" })}</DialogTitle>
                      <DialogDescription>
                        {t("admin.addSkillDescription", { defaultValue: "Create a new skill with translations" })}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="en" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="en">English</TabsTrigger>
                        <TabsTrigger value="ar">العربية</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="en">
                        <div className="grid gap-4 py-2">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="skillNameEn" className="text-right">
                              {t("common.name")}
                            </Label>
                            <Input
                              id="skillNameEn"
                              value={newSkill.translations.en}
                              onChange={(e) => setNewSkill({
                                ...newSkill,
                                translations: {
                                  ...newSkill.translations,
                                  en: e.target.value
                                }
                              })}
                              className="col-span-3"
                            />
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="ar">
                        <div className="grid gap-4 py-2">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="skillNameAr" className="text-right">
                              {t("common.name")}
                            </Label>
                            <Input
                              id="skillNameAr"
                              value={newSkill.translations.ar}
                              onChange={(e) => setNewSkill({
                                ...newSkill,
                                translations: {
                                  ...newSkill.translations,
                                  ar: e.target.value
                                }
                              })}
                              className="col-span-3"
                              dir="rtl"
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <div className="grid gap-4 py-2">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                          {t("common.category")}
                        </Label>
                        <Select 
                          value={newSkill.categoryId} 
                          onValueChange={(value) => setNewSkill({ ...newSkill, categoryId: value })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder={t("admin.selectCategory", { defaultValue: "Select a category" })} />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category: Category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        onClick={handleAddSkill}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {t("common.save")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSkills ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : skills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Layers className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">{t("admin.noSkills", { defaultValue: "No Skills" })}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mt-2">
                  {t("admin.noSkillsDescription", { defaultValue: "You haven't added any skills yet. Add your first skill to get started." })}
                </p>
                <Button 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("admin.addFirstSkill", { defaultValue: "Add Your First Skill" })}
                </Button>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={cn(isRTL && "text-right")}>{t("common.name")}</TableHead>
                      <TableHead className={cn(isRTL && "text-right")}>{t("common.category")}</TableHead>
                      <TableHead className={cn("text-right", isRTL && "text-right")}>{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(skills as Skill[]).map((skill: Skill) => (
                      <TableRow key={skill.id}>
                        <TableCell className="font-medium">{skill.name}</TableCell>
                        <TableCell>{getCategoryName(skill.categoryId)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setEditingSkill(skill);
                                setIsEditDialogOpen(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t("common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteSkill(skill.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                {t("common.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Skill Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("admin.editSkill", { defaultValue: "Edit Skill" })}</DialogTitle>
            <DialogDescription>
              {t("admin.editSkillDescription", { defaultValue: "Update skill information and translations" })}
            </DialogDescription>
          </DialogHeader>
          
          {editingSkill && (
            <>
              <Tabs defaultValue="en" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="ar">العربية</TabsTrigger>
                </TabsList>
                
                <TabsContent value="en">
                  <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="editSkillNameEn" className="text-right">
                        {t("common.name")}
                      </Label>
                      <Input
                        id="editSkillNameEn"
                        value={editingSkill.translations?.en || ""}
                        onChange={(e) => setEditingSkill({
                          ...editingSkill,
                          translations: {
                            ...editingSkill.translations,
                            en: e.target.value
                          }
                        })}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="ar">
                  <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="editSkillNameAr" className="text-right">
                        {t("common.name")}
                      </Label>
                      <Input
                        id="editSkillNameAr"
                        value={editingSkill.translations?.ar || ""}
                        onChange={(e) => setEditingSkill({
                          ...editingSkill,
                          translations: {
                            ...editingSkill.translations,
                            ar: e.target.value
                          }
                        })}
                        className="col-span-3"
                        dir="rtl"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editCategory" className="text-right">
                    {t("common.category")}
                  </Label>
                  <Select 
                    value={editingSkill.categoryId} 
                    onValueChange={(value) => setEditingSkill({ ...editingSkill, categoryId: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t("admin.selectCategory", { defaultValue: "Select a category" })} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
          
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleEditSkill}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 