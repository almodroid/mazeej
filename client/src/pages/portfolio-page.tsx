import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit, Loader2, Briefcase, ExternalLink, Calendar, Image as ImageIcon } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Define the structure of a portfolio project
interface PortfolioProject {
  id: number;
  title: string;
  description: string;
  link?: string;
  date: string;
  image?: string; // Assuming image is a URL path
}

const initialFormData = {
  title: '',
  description: '',
  link: '',
  date: '',
  image: null as File | null | string, // Allow File, null, or string (for existing image URL)
};

export default function PortfolioPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === "ar";

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<PortfolioProject | null>(null);
  const [formData, setFormData] = useState<typeof initialFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch portfolio projects
  const { data: projects = [], isLoading, refetch } = useQuery<PortfolioProject[]>({
    queryKey: ["/api/portfolio"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/portfolio");
      if (!response.ok) throw new Error(t('portfolio.errorFetchingProjects'));
      return response.json();
    },
    enabled: !!user && user.role === "freelancer",
  });

  // Reset form when dialogs close or editing project changes
  useEffect(() => {
    if (!isAddDialogOpen && !isEditDialogOpen) {
      setFormData(initialFormData);
      setEditingProject(null);
      setIsSubmitting(false);
    } else if (isEditDialogOpen && editingProject) {
      setFormData({
        title: editingProject.title,
        description: editingProject.description,
        link: editingProject.link || '',
        date: editingProject.date ? new Date(editingProject.date).toISOString().split('T')[0] : '',
        image: editingProject.image || null,
      });
    }
  }, [isAddDialogOpen, isEditDialogOpen, editingProject]);

  // Add portfolio project mutation
  const addProjectMutation = useMutation({
    mutationFn: async (projectData: typeof initialFormData) => {
      setIsSubmitting(true);
      const apiFormData = new FormData();
      Object.entries(projectData).forEach(([key, value]) => {
        if (value !== null && (value !== '' || key === 'description')) {
          apiFormData.append(key, value as string | Blob);
        }
      });

      const response = await apiRequest("POST", "/api/portfolio", apiFormData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t("portfolio.errorAddingProject"));
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("portfolio.projectAdded"),
        description: t("portfolio.projectAddedSuccess"),
      });
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Update portfolio project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (projectData: { id: number; data: typeof initialFormData }) => {
      setIsSubmitting(true);
      const apiFormData = new FormData();
      Object.entries(projectData.data).forEach(([key, value]) => {
        if (key === 'image' && value instanceof File) {
          apiFormData.append(key, value);
        } else if (key !== 'image' && value !== null && (value !== '' || key === 'description')) {
          apiFormData.append(key, value as string);
        }
      });

      const response = await apiRequest("PATCH", `/api/portfolio/${projectData.id}`, apiFormData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t("portfolio.errorUpdatingProject"));
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("portfolio.projectUpdated"),
        description: t("portfolio.projectUpdatedSuccess"),
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Delete portfolio project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await apiRequest("DELETE", `/api/portfolio/${projectId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t("portfolio.errorDeletingProject"));
      }
    },
    onSuccess: () => {
      toast({
        title: t("portfolio.projectDeleted"),
        description: t("portfolio.projectDeletedSuccess"),
      });
      setIsConfirmDeleteDialogOpen(false);
      setProjectToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
      setIsConfirmDeleteDialogOpen(false);
    }
  });

  // Handle form submission (Add or Edit)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data: formData });
    } else {
      addProjectMutation.mutate(formData);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  // Handle opening edit dialog
  const handleEditClick = (project: PortfolioProject) => {
    setEditingProject(project);
    setIsEditDialogOpen(true);
  };

  // Handle opening delete confirmation dialog
  const handleDeleteClick = (project: PortfolioProject) => {
    setProjectToDelete(project);
    setIsConfirmDeleteDialogOpen(true);
  };

  // Handle confirmed deletion
  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US');
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== 'freelancer') {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("common.unauthorized")}</h1>
          <p className="mb-6">{t("portfolio.freelancerOnly")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-cairo font-bold mb-2">
            {t("portfolio.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("portfolio.description", { defaultValue: "Showcase your best work to attract clients" })}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4 md:mt-0">
          <Plus className="mr-2" size={16} />
          {t("portfolio.addProject")}
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("portfolio.noProjects")}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t("portfolio.noProjectsDescription", { defaultValue: "Start building your portfolio by adding your best projects. Show potential clients what you can do!" })}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2" size={16} />
              {t("portfolio.addFirstProject")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("portfolio.totalProjects")}</p>
                    <p className="text-2xl font-bold">{projects.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("portfolio.withLinks")}</p>
                    <p className="text-2xl font-bold">{projects.filter(p => p.link).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("portfolio.withImages")}</p>
                    <p className="text-2xl font-bold">{projects.filter(p => p.image).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t("portfolio.projects")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("portfolio.image")}</TableHead>
                      <TableHead>{t("portfolio.title")}</TableHead>
                      <TableHead>{t("portfolio.description")}</TableHead>
                      <TableHead>{t("portfolio.link")}</TableHead>
                      <TableHead>{t("portfolio.date")}</TableHead>
                      <TableHead>{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={project.image || '/placeholder.png'} alt={project.title} />
                            <AvatarFallback>
                              {project.image ? project.title.charAt(0) : <ImageIcon className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{project.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                            {project.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          {project.link ? (
                            <a 
                              href={project.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              {t("portfolio.view")}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatDate(project.date)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(project)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(project)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Project Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("portfolio.addProject")}</DialogTitle>
            <DialogDescription>
              {t("portfolio.addProjectDescription", { defaultValue: "Add a new project to showcase your skills" })}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">{t("portfolio.title")} *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder={t("portfolio.titlePlaceholder", { defaultValue: "Enter project title" })}
              />
            </div>
            <div>
              <Label htmlFor="description">{t("portfolio.description")} *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder={t("portfolio.descriptionPlaceholder", { defaultValue: "Describe your project" })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="link">{t("portfolio.link")}</Label>
              <Input
                id="link"
                name="link"
                type="url"
                value={formData.link}
                onChange={handleChange}
                placeholder={t("portfolio.linkPlaceholder", { defaultValue: "https://example.com" })}
              />
            </div>
            <div>
              <Label htmlFor="date">{t("portfolio.date")} *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="image">{t("portfolio.image")}</Label>
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("portfolio.imageHelp", { defaultValue: "Upload an image to showcase your project" })}
              </p>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("portfolio.editProject")}</DialogTitle>
            <DialogDescription>
              {t("portfolio.editProjectDescription", { defaultValue: "Update your project information" })}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">{t("portfolio.title")} *</Label>
              <Input
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">{t("portfolio.description")} *</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-link">{t("portfolio.link")}</Label>
              <Input
                id="edit-link"
                name="link"
                type="url"
                value={formData.link}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="edit-date">{t("portfolio.date")} *</Label>
              <Input
                id="edit-date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-image">{t("portfolio.image")}</Label>
              <Input
                id="edit-image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleChange}
              />
              {formData.image && typeof formData.image === 'string' && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">{t("portfolio.currentImage")}</p>
                  <img src={formData.image} alt="Current" className="h-16 w-16 object-cover rounded" />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("portfolio.deleteProject")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("portfolio.deleteProjectDescription", { 
                defaultValue: "Are you sure you want to delete this project? This action cannot be undone." 
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}