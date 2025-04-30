import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CalendarIcon, Upload, X, Paperclip, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { insertProjectSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layouts/dashboard-layout";

const projectFormSchema = insertProjectSchema.extend({
  deadlineDate: z.date().optional(),
}).omit({ deadline: true });

type ProjectFormValues = z.infer<typeof projectFormSchema>;

// Define Category type
interface Category {
  id: number;
  name: string;
}

export default function CreateProjectPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories for the project
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Form handling
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: 0,
      category: 0,
      deadlineDate: undefined,
    },
    mode: "onSubmit",
  });

  // Update form default values when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && form.getValues().category === 0) {
      form.setValue('category', categories[0].id);
    }
  }, [categories, form]);

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (formData: ProjectFormValues) => {
      setIsLoading(true);
      
      // Convert form data to match API expectations
      const projectData = {
        title: formData.title,
        description: formData.description,
        budget: formData.budget,
        category: Number(formData.category),
        deadline: formData.deadlineDate ? new Date(formData.deadlineDate).toISOString() : undefined,
        consultationDate: formData.deadlineDate ? new Date(formData.deadlineDate).toISOString() : null,
        projectType: 'standard',
        status: 'pending', // Set initial status to pending for admin approval
      };
      
      console.log("Submitting project data:", projectData);
      
      const response = await apiRequest("POST", "/api/projects", projectData);
      const projectResult = await response.json();
      
      // Upload files if there are any
      if (filesToUpload.length > 0 && projectResult.id) {
        await uploadProjectFiles(projectResult.id);
      }
      
      return projectResult;
    },
    onSuccess: (data) => {
      console.log("Project created successfully:", data);
      toast({
        title: t("projects.createdSuccess"),
        description: t("projects.createdSuccessDescription", { defaultValue: "Your project has been created and is pending admin approval." }),
      });
      navigate("/projects");
    },
    onError: (error: Error) => {
      console.error("Error creating project:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("projects.creationError"),
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFilesToUpload(prev => [...prev, ...newFiles]);
    }
  };

  // Remove file from upload list
  const removeFile = (index: number) => {
    setFilesToUpload(files => files.filter((_, i) => i !== index));
  };

  // Upload files to the project
  const uploadProjectFiles = async (projectId: number) => {
    if (filesToUpload.length === 0 || !user) return;
    
    setIsUploadingFiles(true);
    
    try {
      const formData = new FormData();
      filesToUpload.forEach(file => {
        formData.append('files', file);
      });
      formData.append('projectId', projectId.toString());
      formData.append('userId', user.id.toString());
      
      // Use the same endpoint as in project-details-page.tsx
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        // Better error handling - try to get both text and JSON to diagnose
        const text = await response.text();
        console.error("Error response text:", text);
        let errorMessage = "Error uploading files";
        
        try {
          // Try to parse as JSON if possible
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If not JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      toast({
        title: t("projects.fileUploadSuccess", { defaultValue: "Files uploaded" }),
        description: t("projects.fileUploadSuccessDescription", { defaultValue: "Your files have been uploaded successfully." }),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("projects.fileUploadError", { defaultValue: "Failed to upload files." }),
        variant: "destructive",
      });
      console.error("Error uploading files:", error);
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Form submission handler
  const onSubmit = async (data: ProjectFormValues) => {
    console.log("Form submitted with data:", data);
    
    // Validate category is selected
    if (!data.category) {
      toast({
        title: t("common.error"),
        description: t("projects.categoryRequired", { defaultValue: "Please select a category" }),
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Ensure we're not already submitting
      if (isLoading || createProjectMutation.isPending) {
        return;
      }
      
      createProjectMutation.mutate(data);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("projects.creationError"),
        variant: "destructive",
      });
    }
  }

  // Render functions
  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">{t("projects.createNew")}</h1>
        
        <Form {...form}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit)(e);
            }} 
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("projects.titlePlaceholder")} {...field} />
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
                    <Textarea 
                      placeholder={t("projects.descriptionPlaceholder")} 
                      className="min-h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        placeholder="100"
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
                      onValueChange={(value) => {
                        console.log("Category selected:", value);
                        field.onChange(Number(value));
                      }}
                      value={field.value ? field.value.toString() : undefined}
                      defaultValue={categories.length > 0 ? categories[0].id.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("projects.selectCategory")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
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
            
            <FormField
              control={form.control}
              name="deadlineDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t("projects.deadline")}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>{t("projects.pickDate")}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* File upload section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel>{t("projects.attachments", { defaultValue: "Attachments" })}</FormLabel>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t("projects.selectFiles", { defaultValue: "Select Files" })}
                </Button>
              </div>
              
              <div 
                className={cn(
                  "border-2 border-dashed rounded-md text-center transition-colors",
                  filesToUpload.length === 0 ? "p-8" : "p-4"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {filesToUpload.length === 0 ? (
                  <div className="cursor-pointer hover:bg-muted/50">
                    <Paperclip className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">
                      {t("projects.dragAndDrop", { defaultValue: "Drag and drop files, or click to select" })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("projects.supportedFormats", { defaultValue: "PDF, Word, Excel, Images, etc." })}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {t("projects.selectedFiles", { defaultValue: "Selected Files" })} ({filesToUpload.length})
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {filesToUpload.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                          <div className="flex items-center overflow-hidden">
                            <Paperclip className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                            <div className="truncate">
                              <p className="text-sm truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/projects")}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                type="button" 
                disabled={isLoading || createProjectMutation.isPending || isUploadingFiles}
                onClick={() => {
                  console.log("Submit button clicked");
                  const formData = form.getValues();
                  console.log("Form data:", formData);
                  onSubmit(formData);
                }}
              >
                {isLoading || createProjectMutation.isPending || isUploadingFiles ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.creating", { defaultValue: "Creating..." })}
                  </span>
                ) : (
                  t("projects.create", { defaultValue: "Create Project" })
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}