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
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const queryClient = useQueryClient(); // Initialize queryClient

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<PortfolioProject | null>(null);
  const [formData, setFormData] = useState<typeof initialFormData>(initialFormData);

  // Fetch portfolio projects
  const { data: projects = [], isLoading, refetch } = useQuery<PortfolioProject[]>({ // Typed the query data
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
    } else if (isEditDialogOpen && editingProject) {
      setFormData({
        title: editingProject.title,
        description: editingProject.description,
        link: editingProject.link || '',
        date: editingProject.date ? new Date(editingProject.date).toISOString().split('T')[0] : '', // Format date for input
        image: editingProject.image || null, // Keep existing image URL or null
      });
    }
  }, [isAddDialogOpen, isEditDialogOpen, editingProject]);

  // Add portfolio project mutation
  const addProjectMutation = useMutation({
    mutationFn: async (projectData: typeof initialFormData) => {
      const apiFormData = new FormData();
      Object.entries(projectData).forEach(([key, value]) => {
        // Only append if value is not null or empty string (except for description which can be empty)
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
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] }); // Invalidate cache
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update portfolio project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (projectData: { id: number; data: typeof initialFormData }) => {
      const apiFormData = new FormData();
      Object.entries(projectData.data).forEach(([key, value]) => {
        // Don't send null image if not changed, handle File object for new image
        if (key === 'image' && value instanceof File) {
          apiFormData.append(key, value);
        } else if (key !== 'image' && value !== null && (value !== '' || key === 'description')) {
          apiFormData.append(key, value as string);
        }
      });

      // If image is a string (existing URL) and wasn't replaced by a File, don't send it
      // The backend should handle not clearing the image if 'image' field is absent

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
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] }); // Invalidate cache
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
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
      // No JSON body expected on successful DELETE
    },
    onSuccess: () => {
      toast({
        title: t("portfolio.projectDeleted"),
        description: t("portfolio.projectDeletedSuccess"),
      });
      setIsConfirmDeleteDialogOpen(false);
      setProjectToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] }); // Invalidate cache
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
      setIsConfirmDeleteDialogOpen(false); // Close dialog even on error
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
    const { name, value, files } = e.target as HTMLInputElement; // Type assertion for files
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
        <h1 className="text-3xl font-cairo font-bold mb-4 md:mb-0">
          {t("portfolio.title")}
        </h1>
        <Button onClick={() => setIsAddDialogOpen(true)}> {/* Changed setIsDialogOpen to setIsAddDialogOpen */}
          <Plus className="mr-2" size={16} />
          {t("portfolio.addProject")}
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-neutral-500">{t("portfolio.noProjects")}</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("portfolio.image")}</TableHead> {/* Added Image column */}
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
                <TableCell> {/* Added Image cell */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={project.image || '/placeholder.png'} alt={project.title} />
                    <AvatarFallback>{project.title.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>{project.title}</TableCell>
                <TableCell>{project.description}</TableCell>
                <TableCell>
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer">
                      {t("portfolio.view")}
                    </a>
                  )}
                </TableCell>
                <TableCell>{project.date}</TableCell>
                <TableCell>
                  <div className="flex space-x-1 md:space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(project)}> {/* Added onClick */}
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(project)}> {/* Added onClick and styling */}
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add Project Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("portfolio.addProject")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">{t("portfolio.title")}</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">{t("portfolio.description")}</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
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
              />
            </div>
            <div>
              <Label htmlFor="date">{t("portfolio.date")}</Label>
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={addProjectMutation.isPending}>
                {addProjectMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("common.saving")}</>
                ) : (
                  t("common.save")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("portfolio.editProject")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">{t("portfolio.title")}</Label>
              <Input
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">{t("portfolio.description")}</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
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
              <Label htmlFor="edit-date">{t("portfolio.date")}</Label>
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
              {formData.image && typeof formData.image === 'string' && (
                <div className="mb-2 flex items-center space-x-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={formData.image} alt="Current image" />
                    <AvatarFallback>{formData.title.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{t('portfolio.currentImage')}</span>
                </div>
              )}
              <Input
                id="edit-image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground mt-1">{t('portfolio.leaveEmptyToKeep')}</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={updateProjectMutation.isPending}>
                {updateProjectMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("common.saving")}</>
                ) : (
                  t("common.saveChanges")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("portfolio.confirmDeleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("portfolio.confirmDeleteDesc", { title: projectToDelete?.title || '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteDialogOpen(false)} disabled={deleteProjectMutation.isPending}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteProjectMutation.isPending}>
              {deleteProjectMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("common.deleting")}</>
              ) : (
                t("common.delete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}