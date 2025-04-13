import { useTranslation } from "react-i18next";
import { useState } from "react";
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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import AdminLayout from "@/components/layouts/admin-layout";

// Define interface for Category data
interface Category {
  id: string;
  name: string;
  icon?: string;
}

export default function AdminCategoriesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === "ar";
  
  // New category state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "" });
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

  // Handle adding a new category
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: t("common.error"),
        description: t("admin.categoryNameRequired", { defaultValue: "Category name is required" }),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Make API request to add the category
      const response = await apiRequest("POST", "/api/categories", newCategory);
      const data = await response.json();
      
      // Show success toast
      toast({
        title: t("common.success"),
        description: t("admin.categoryAdded", { defaultValue: "Category added successfully" }),
        variant: "default",
      });
      
      // Reset form and close dialog
      setNewCategory({ name: "", icon: "" });
      setIsDialogOpen(false);
      
      // Refresh categories data
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.categoryAddError", { defaultValue: "Failed to add category" }),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
              {t("auth.admin.categories")}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.admin.categoriesDescription", {defaultValue: "Manage project categories"})}
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <div className={cn(
              "flex justify-between items-center",
       
            )}>
              <CardTitle>{t("auth.admin.categories")}</CardTitle>
              <div className={cn(
                "flex items-center gap-2",
           
              )}>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className={cn("gap-1", isRTL && "flex-row-reverse")}>
                      <Plus className="h-4 w-4" />
                      <span>{t("common.add")}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("admin.addCategory", { defaultValue: "Add New Category" })}</DialogTitle>
                      <DialogDescription>
                        {t("admin.addCategoryDescription", { defaultValue: "Create a new project category" })}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          {t("common.name")}
                        </Label>
                        <Input
                          id="name"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="icon" className="text-right">
                          {t("common.icon")}
                        </Label>
                        <Input
                          id="icon"
                          value={newCategory.icon}
                          onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                          className="col-span-3"
                          placeholder="default-icon"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        onClick={handleAddCategory}
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
            {isLoadingCategories ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Layers className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">{t("admin.noCategories", { defaultValue: "No Categories" })}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mt-2">
                  {t("admin.noCategoriesDescription", { defaultValue: "You haven't added any categories yet. Add your first category to get started." })}
                </p>
                <Button 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("admin.addFirstCategory", { defaultValue: "Add Your First Category" })}
                </Button>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={cn(isRTL && "text-right")}>{t("common.name")}</TableHead>
                      <TableHead className={cn(isRTL && "text-right")}>{t("common.icon")}</TableHead>
                      <TableHead className={cn("text-right", isRTL && "text-right")}>{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(categories as Category[]).map((category: Category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.icon || "default-icon"}</TableCell>
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
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                {t("common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
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
    </AdminLayout>
  );
} 