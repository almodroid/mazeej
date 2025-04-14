import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Plus,
  Edit,
  Trash,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Settings,
  User,
  AlertCircle,
  Ban,
  Check,
  X
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
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import AdminLayout from "@/components/layouts/admin-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { freelancerLevelEnum, freelancerTypeEnum } from "@shared/schema";

interface CategoryWithSkills {
  id: number;
  name: string;
  skills: {
    id: number;
    name: string;
  }[];
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  fullName: string;
  role: string;
  freelancerLevel?: 'beginner' | 'intermediate' | 'advanced';
  freelancerType?: 'content_creator' | 'expert';
  hourlyRate?: number;
  skills?: number[];
  createdAt: string;
  isBlocked: boolean;
  profileImage?: string;
}

// Define form schema
const userSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  role: z.enum(["admin", "client", "freelancer"], {
    required_error: "Please select a role.",
  }),
  freelancerLevel: z.enum(freelancerLevelEnum.enumValues).optional(),
  freelancerType: z.enum(freelancerTypeEnum.enumValues).optional(),
  hourlyRate: z.number().min(0).optional(),
  skills: z.array(z.number()).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Edit user schema (without password requirement)
const editUserSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  role: z.enum(["admin", "client", "freelancer"], {
    required_error: "Please select a role.",
  }),
  freelancerLevel: z.enum(freelancerLevelEnum.enumValues).optional(),
  freelancerType: z.enum(freelancerTypeEnum.enumValues).optional(),
  hourlyRate: z.number().min(0).optional(),
  skills: z.array(z.number()).optional(),
});

type UserFormValues = z.infer<typeof userSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const isRTL = i18n.language === "ar";
  
  // Debug state for API issues
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // Fetch users data
  const { data: users = [], isLoading: isLoadingUsers, error } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/users");
        
        // Check if response is valid before parsing
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          // Get the actual response text to debug
          const text = await response.text();
          console.error("Invalid response format:", text.substring(0, 150) + "...");
          setDebugInfo(`API returned non-JSON response: ${response.status} ${response.statusText}. Content type: ${contentType}`);
          throw new Error("API response is not JSON. Check server configuration.");
        }
        
        const data = await response.json();
        
        // Debug: Log the data for troubleshooting
        console.log("Users API response:", data);
        
        if (!data || !Array.isArray(data)) {
          setDebugInfo(`API returned invalid data format: ${JSON.stringify(data)}`);
          return [];
        }
        
        return data;
      } catch (error) {
        console.error("Error fetching users:", error);
        setDebugInfo(`API error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    },
    enabled: !!user && user.role === "admin"
  });

  // Filter users based on search query
  const filteredUsers = searchQuery.trim() === ""
    ? users
    : (users as User[]).filter((user: User) => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  
  // Setup form with zod validation
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: "client",
      freelancerLevel: "intermediate",
      freelancerType: "content_creator",
      hourlyRate: 0,
      skills: [],
    },
  });
  
  // Setup edit form
  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      role: "client",
      freelancerLevel: "intermediate",
      freelancerType: "content_creator",
      hourlyRate: 0,
      skills: [],
    },
  });
  
  // Reset edit form when a user is selected for editing
  useEffect(() => {
    if (userToEdit) {
      editForm.reset({
        username: userToEdit.username,
        email: userToEdit.email,
        fullName: userToEdit.fullName,
        role: userToEdit.role as "admin" | "client" | "freelancer",
        freelancerLevel: userToEdit.freelancerLevel,
        freelancerType: userToEdit.freelancerType,
        hourlyRate: userToEdit.hourlyRate,
        skills: userToEdit.skills || [],
      });
    }
  }, [userToEdit, editForm]);
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormValues) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("admin.userAdded", { defaultValue: "User added successfully" }),
        description: t("admin.userAddedDesc", { 
          defaultValue: "The new user has been added to the platform." 
        }),
      });
      setIsAddUserOpen(false);
      form.reset();
      // Refetch users list
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error 
          ? error.message 
          : t("admin.userAddError", { defaultValue: "Failed to add user. Please try again." }),
      });
    }
  });
  
  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string, userData: EditUserFormValues }) => {
      const response = await apiRequest("PATCH", `/api/users/${userId}`, userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("admin.userUpdated", { defaultValue: "User updated successfully" }),
        description: t("admin.userUpdatedDesc", { 
          defaultValue: "The user information has been updated." 
        }),
      });
      setUserToEdit(null);
      // Refetch users list
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error 
          ? error.message 
          : t("admin.userUpdateError", { defaultValue: "Failed to update user. Please try again." }),
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (data: UserFormValues) => {
    createUserMutation.mutate(data);
  };
  
  // Edit form submission handler
  const onEditSubmit = (data: EditUserFormValues) => {
    if (userToEdit) {
      editUserMutation.mutate({ userId: userToEdit.id.toString(), userData: data });
    }
  };

  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToBlock, setUserToBlock] = useState<User | null>(null);
  
  // Create delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: t("admin.userDeleted", { defaultValue: "User deleted successfully" }),
        description: t("admin.userDeletedDesc", { 
          defaultValue: "The user has been removed from the platform." 
        }),
      });
      setUserToDelete(null);
      // Refetch users list
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error 
          ? error.message 
          : t("admin.userDeleteError", { defaultValue: "Failed to delete user. Please try again." }),
      });
    }
  });
  
  // Create block user mutation
  const toggleBlockUserMutation = useMutation({
    mutationFn: async ({ userId, blocked }: { userId: string, blocked: boolean }) => {
      const response = await apiRequest("PATCH", `/api/users/${userId}/status`, { blocked });
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.blocked 
          ? t("admin.userBlocked", { defaultValue: "User blocked successfully" })
          : t("admin.userUnblocked", { defaultValue: "User unblocked successfully" }),
        description: variables.blocked
          ? t("admin.userBlockedDesc", { defaultValue: "The user has been blocked from the platform." })
          : t("admin.userUnblockedDesc", { defaultValue: "The user has been unblocked and can access the platform again." }),
      });
      setUserToBlock(null);
      // Refetch users list
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error 
          ? error.message 
          : t("admin.userStatusError", { defaultValue: "Failed to update user status. Please try again." }),
      });
    }
  });

  // Add categories query
  const { data: categories = [] } = useQuery<CategoryWithSkills[]>({
    queryKey: ["/api/categories"],
  });

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-6">
        <div className={cn(
          "flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
          
        )}>
          <div>
            <h1 className="text-3xl font-cairo font-bold mb-2 text-foreground">
              {t("auth.admin.users")}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.admin.usersDescription", {defaultValue: "Manage platform users"})}
            </p>
          </div>
        </div>
        
        {debugInfo && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Debug Information</AlertTitle>
            <AlertDescription>
              {debugInfo}
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader className="pb-2">
            <div className={cn(
              "flex justify-between items-center",
              
            )}>
              <CardTitle>{t("auth.admin.users")}</CardTitle>
              <div className={cn(
                "flex items-center gap-2",
                isRTL && "flex-row"
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
                <Button 
                  size="sm" 
                  className={cn("gap-1", isRTL && "flex-row")}
                  onClick={() => setIsAddUserOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span>{t("common.add")}</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <div className="rounded-full bg-red-100 p-3 mb-4 mx-auto w-fit">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-red-600">{t("common.error")}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                  {error instanceof Error ? error.message : String(error)}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/users"] })}
                >
                  {t("common.tryAgain")}
                </Button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                {searchQuery.trim() !== "" ? (
                  <>
                    <h3 className="text-lg font-medium">{t("admin.noUsersFound", { defaultValue: "No Users Found" })}</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mt-2">
                      {t("admin.noUsersFoundForSearch", { defaultValue: "No users match your search criteria. Try a different search term." })}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium">{t("admin.noUsers", { defaultValue: "No Users" })}</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mt-2">
                      {t("admin.noUsersDescription", { defaultValue: "There are no users registered on the platform yet." })}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("profile.username")}</TableHead>
                        <TableHead>{t("profile.email")}</TableHead>
                        <TableHead>{t("auth.accountType")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead>{t("common.joined")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(filteredUsers as User[]).map((userData: User) => (
                        <TableRow key={userData.id}>
                          <TableCell className="font-medium">{userData.username}</TableCell>
                          <TableCell>{userData.email}</TableCell>
                          <TableCell>
                            <Badge variant={(
                              userData.role === "admin" ? "destructive" : 
                              userData.role === "freelancer" ? "default" : "outline"
                            )}>
                              {userData.role === "admin" 
                                ? t("common.admin") 
                                : t(`auth.${userData.role}`, { defaultValue: userData.role })}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              userData.isBlocked 
                                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600"
                                : "bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600"
                            )}>
                              {userData.isBlocked ? t("admin.blocked", { defaultValue: "Blocked" }) : t("common.active")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {userData.createdAt 
                              ? new Date(userData.createdAt).toLocaleDateString() 
                              : new Date().toLocaleDateString()
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {userData.role !== "admin" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel className={cn(isRTL && "text-right")}>{t("common.actions")}</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className={cn(isRTL && "flex-row")}
                                    onClick={() => setUserToEdit(userData)}
                                  >
                                    <Edit className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                    {t("common.edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className={cn(isRTL && "flex-row")}
                                    onClick={() => setUserToBlock(userData)}
                                  >
                                    {userData.isBlocked ? (
                                      <>
                                        <Check className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                        {t("admin.unblock", { defaultValue: "Unblock User" })}
                                      </>
                                    ) : (
                                      <>
                                        <Ban className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                        {t("admin.block", { defaultValue: "Block User" })}
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className={cn("text-destructive", isRTL && "flex-row")}
                                    onClick={() => setUserToDelete(userData.id.toString())}
                                  >
                                    <Trash className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                    {t("common.delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
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
        
        {/* Add User Modal */}
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("admin.addUser")}</DialogTitle>
              <DialogDescription>
                {t("admin.addUserDesc")}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.username")}</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.email")}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.fullName")}</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.password")}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.confirmPassword")}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.accountType")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("auth.selectAccountType")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="client">{t("auth.client")}</SelectItem>
                          <SelectItem value="freelancer">{t("auth.freelancer")}</SelectItem>
                          <SelectItem value="admin">{t("common.admin")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("role") === "freelancer" && (
                  <>
                    <FormField
                      control={form.control}
                      name="freelancerLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.level")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("profile.selectLevel")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">{t("profile.beginner")}</SelectItem>
                              <SelectItem value="intermediate">{t("profile.intermediate")}</SelectItem>
                              <SelectItem value="advanced">{t("profile.advanced")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="freelancerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.type")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("profile.selectType")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="content_creator">{t("profile.contentCreator")}</SelectItem>
                              <SelectItem value="expert">{t("profile.expert")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hourlyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.hourlyRate")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="skills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.skills")}</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              const skillId = parseInt(value);
                              const currentSkills = field.value || [];
                              if (!currentSkills.includes(skillId)) {
                                field.onChange([...currentSkills, skillId]);
                              }
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("profile.addSkill")} />
                              </SelectTrigger>
                            </FormControl>
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
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(field.value || []).map((skillId) => {
                              const skill = categories
                                .flatMap(c => c.skills || [])
                                .find(s => s.id === skillId);
                              return skill ? (
                                <Badge key={skillId} variant="outline" className="flex items-center gap-1">
                                  {skill.name}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      field.onChange(field.value?.filter(id => id !== skillId));
                                    }}
                                    className="hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddUserOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("common.create")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Edit User Modal */}
        <Dialog open={!!userToEdit} onOpenChange={(open) => !open && setUserToEdit(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("admin.editUser")}</DialogTitle>
              <DialogDescription>
                {t("admin.editUserDesc")}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.username")}</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.email")}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.fullName")}</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.accountType")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("auth.selectAccountType")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="client">{t("auth.client")}</SelectItem>
                          <SelectItem value="freelancer">{t("auth.freelancer")}</SelectItem>
                          <SelectItem value="admin">{t("common.admin")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {editForm.watch("role") === "freelancer" && (
                  <>
                    <FormField
                      control={editForm.control}
                      name="freelancerLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.level")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("profile.selectLevel")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">{t("profile.beginner")}</SelectItem>
                              <SelectItem value="intermediate">{t("profile.intermediate")}</SelectItem>
                              <SelectItem value="advanced">{t("profile.advanced")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="freelancerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.type")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("profile.selectType")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="content_creator">{t("profile.contentCreator")}</SelectItem>
                              <SelectItem value="expert">{t("profile.expert")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="hourlyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.hourlyRate")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="skills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.skills")}</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              const skillId = parseInt(value);
                              const currentSkills = field.value || [];
                              if (!currentSkills.includes(skillId)) {
                                field.onChange([...currentSkills, skillId]);
                              }
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("profile.addSkill")} />
                              </SelectTrigger>
                            </FormControl>
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
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(field.value || []).map((skillId) => {
                              const skill = categories
                                .flatMap(c => c.skills || [])
                                .find(s => s.id === skillId);
                              return skill ? (
                                <Badge key={skillId} variant="outline" className="flex items-center gap-1">
                                  {skill.name}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      field.onChange(field.value?.filter(id => id !== skillId));
                                    }}
                                    className="hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUserToEdit(null)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={editUserMutation.isPending}
                  >
                    {editUserMutation.isPending ? (
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
        
        {/* Delete User Confirmation Dialog */}
        <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("admin.confirmDelete", { defaultValue: "Confirm Deletion" })}</DialogTitle>
              <DialogDescription>
                {t("admin.deleteUserConfirm", { defaultValue: "Are you sure you want to delete this user? This action cannot be undone." })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setUserToDelete(null)}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                variant="destructive"
                disabled={deleteUserMutation.isPending}
                onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete)}
              >
                {deleteUserMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("common.delete")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Block/Unblock User Confirmation Dialog */}
        <Dialog open={!!userToBlock} onOpenChange={(open) => !open && setUserToBlock(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {userToBlock?.isBlocked 
                  ? t("admin.confirmUnblock", { defaultValue: "Confirm Unblock" })
                  : t("admin.confirmBlock", { defaultValue: "Confirm Block" })
                }
              </DialogTitle>
              <DialogDescription>
                {userToBlock?.isBlocked
                  ? t("admin.unblockUserConfirm", { defaultValue: "Are you sure you want to unblock this user? They will regain access to the platform." })
                  : t("admin.blockUserConfirm", { defaultValue: "Are you sure you want to block this user? They will lose access to the platform." })
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setUserToBlock(null)}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                variant={userToBlock?.isBlocked ? "default" : "destructive"}
                disabled={toggleBlockUserMutation.isPending}
                onClick={() => userToBlock && toggleBlockUserMutation.mutate({ 
                  userId: userToBlock.id.toString(), 
                  blocked: !userToBlock.isBlocked 
                })}
              >
                {toggleBlockUserMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : userToBlock?.isBlocked ? (
                  t("admin.unblock", { defaultValue: "Unblock User" })
                ) : (
                  t("admin.block", { defaultValue: "Block User" })
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 