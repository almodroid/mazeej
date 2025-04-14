import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Edit,
  Trash,
  Loader2,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import AdminLayout from "@/components/layouts/admin-layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

// Define interface for Project data
interface Project {
  id: string;
  title: string;
  clientId: string;
  budget: number;
  status: string;
  description: string;
  category: number;
  createdAt?: string;
}

// Define schema for project editing
const editProjectSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  budget: z.coerce.number().positive({ message: "Budget must be a positive number" }),
  category: z.coerce.number(),
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

export default function AdminProjectsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === "ar";
  
  // State for managing dialogs
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch projects data
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });
  
  // Fetch categories for the edit form
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/categories");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Filter projects based on search query
  const filteredProjects = searchQuery.trim() === ""
    ? projects
    : (projects as Project[]).filter((project: Project) => 
        project.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Form for editing projects
  const form = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: 0,
      category: 0,
    },
  });

  // Reset form when a project is selected for editing
  const handleEditProject = (project: Project) => {
    form.reset({
      title: project.title,
      description: project.description,
      budget: project.budget,
      category: project.category,
    });
    setProjectToEdit(project);
  };

  // Update project status mutation
  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const response = await apiRequest("PATCH", `/api/projects/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("admin.projectStatusUpdated", { defaultValue: "Project status updated" }),
        description: t("admin.projectStatusUpdatedDesc", { 
          defaultValue: "The project status has been updated successfully." 
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error 
          ? error.message 
          : t("admin.projectStatusUpdateError", { defaultValue: "Failed to update project status." }),
      });
    }
  });

  // Edit project mutation
  const editProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: EditProjectFormValues }) => {
      const response = await apiRequest("PATCH", `/api/projects/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("admin.projectUpdated", { defaultValue: "Project updated" }),
        description: t("admin.projectUpdatedDesc", { 
          defaultValue: "The project has been updated successfully." 
        }),
      });
      setProjectToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error 
          ? error.message 
          : t("admin.projectUpdateError", { defaultValue: "Failed to update project." }),
      });
    }
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await apiRequest("DELETE", `/api/projects/${projectId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: t("admin.projectDeleted", { defaultValue: "Project deleted" }),
        description: t("admin.projectDeletedDesc", { 
          defaultValue: "The project has been deleted successfully." 
        }),
      });
      setProjectToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error 
          ? error.message 
          : t("admin.projectDeleteError", { defaultValue: "Failed to delete project." }),
      });
    }
  });

  // Handler to approve a project
  const handleApproveProject = (id: string) => {
    updateProjectStatusMutation.mutate({ id, status: 'open' });
  };

  // Handler to reject a project
  const handleRejectProject = (id: string) => {
    updateProjectStatusMutation.mutate({ id, status: 'cancelled' });
  };

  // Handler to update project status
  const handleStatusChange = (id: string, status: string) => {
    updateProjectStatusMutation.mutate({ id, status });
  };

  // Handle form submission for editing project
  const onSubmit = (data: EditProjectFormValues) => {
    if (projectToEdit) {
      editProjectMutation.mutate({ id: projectToEdit.id, data });
    }
  };

  // Returns an appropriate badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-500/10 text-yellow-500";
      case 'open':
        return "bg-blue-500/10 text-blue-500";
      case 'in_progress':
        return "bg-purple-500/10 text-purple-500";
      case 'completed':
        return "bg-green-500/10 text-green-500";
      case 'cancelled':
        return "bg-red-500/10 text-red-500";
      default:
        return "outline";
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
              {t("auth.admin.projects")}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.admin.projectsDescription", {defaultValue: "Manage all platform projects"})}
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <div className={cn(
              "flex justify-between items-center",
              
            )}>
              <CardTitle>{t("auth.admin.projects")}</CardTitle>
              <div className={cn(
                "flex items-center gap-2",
                
              )}>
                <div className="relative">
                  <Search className={cn(
                    "absolute top-2.5 text-muted-foreground h-4 w-4",
                    isRTL ? "right-2.5" : "left-2.5" 
                  )} />
                  <Input 
                    placeholder={t("common.search")} 
                    className={isRTL ? "pr-8 w-60" : "pl-8 w-60"} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingProjects ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("projects.projectTitle")}</TableHead>
                        <TableHead>{t("common.client")}</TableHead>
                        <TableHead>{t("projects.budget")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead>{t("projects.posted")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(filteredProjects as Project[]).map((project: Project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>Client #{project.clientId}</TableCell>
                          <TableCell>${project.budget}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(getStatusBadgeVariant(project.status))}>
                              {t(`project.status${project.status.charAt(0).toUpperCase() + project.status.slice(1)}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {project.createdAt 
                              ? new Date(project.createdAt).toLocaleDateString() 
                              : new Date().toLocaleDateString()
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {project.status === 'pending' && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="text-green-500 hover:text-green-700"
                                    onClick={() => handleApproveProject(project.id)}
                                    title={t("admin.approveProject", {defaultValue: "Approve Project"})}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleRejectProject(project.id)}
                                    title={t("admin.rejectProject", {defaultValue: "Reject Project"})}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel className={cn(isRTL && "text-right")}>
                                    {t("common.actions")}
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem 
                                    className={cn(isRTL && "flex-row")}
                                    onClick={() => handleEditProject(project)}
                                  >
                                    <Edit className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                    {t("common.edit")}
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className={cn(isRTL && "flex-row")}>
                                      <ClipboardList className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                      <span>{t("common.status")}</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                      <DropdownMenuSubContent>
                                        <DropdownMenuRadioGroup value={project.status}>
                                          <DropdownMenuRadioItem 
                                            value="pending" 
                                            onClick={() => handleStatusChange(project.id, 'pending')}
                                          >
                                            {t("project.statusPending")}
                                          </DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem 
                                            value="open" 
                                            onClick={() => handleStatusChange(project.id, 'open')}
                                          >
                                            {t("project.statusOpen")}
                                          </DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem 
                                            value="in_progress" 
                                            onClick={() => handleStatusChange(project.id, 'in_progress')}
                                          >
                                            {t("project.statusInProgress")}
                                          </DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem 
                                            value="completed" 
                                            onClick={() => handleStatusChange(project.id, 'completed')}
                                          >
                                            {t("project.statusCompleted")}
                                          </DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem 
                                            value="cancelled" 
                                            onClick={() => handleStatusChange(project.id, 'cancelled')}
                                          >
                                            {t("project.statusCancelled")}
                                          </DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                      </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                  </DropdownMenuSub>
                                  
                                  <DropdownMenuItem 
                                    className={cn("text-destructive", isRTL && "flex-row")}
                                    onClick={() => setProjectToDelete(project.id)}
                                  >
                                    <Trash className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                    {t("common.delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className={cn(
                  "flex items-center justify-end py-4",
                  isRTL ? "space-x-reverse space-x-2" : "space-x-2"
                )}>
                  <Button variant="outline" size="sm">
                    {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm">
                    1
                  </Button>
                  <Button variant="outline" size="sm">
                    {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Delete Project Confirmation Dialog */}
        <Dialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("admin.confirmDelete", { defaultValue: "Confirm Deletion" })}</DialogTitle>
              <DialogDescription>
                {t("admin.deleteProjectConfirm", { defaultValue: "Are you sure you want to delete this project? This action cannot be undone." })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setProjectToDelete(null)}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                variant="destructive"
                disabled={deleteProjectMutation.isPending}
                onClick={() => projectToDelete && deleteProjectMutation.mutate(projectToDelete)}
              >
                {deleteProjectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("common.delete")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Project Dialog */}
        <Dialog open={!!projectToEdit} onOpenChange={(open) => !open && setProjectToEdit(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{t("admin.editProject", { defaultValue: "Edit Project" })}</DialogTitle>
              <DialogDescription>
                {t("admin.editProjectDesc", { defaultValue: "Update project details. Click save when you're done." })}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("projects.title")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("projects.description")}</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-32" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("projects.budget")}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("projects.category")}</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("projects.selectCategory")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category: { id: number, name: string }) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setProjectToEdit(null)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={editProjectMutation.isPending}
                  >
                    {editProjectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("common.save")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 