import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Folder, 
  Layers, 
  BarChart4, 
  CreditCard, 
  Settings, 
  Shield, 
  Check, 
  X,
  Search,
  Plus,
  Edit,
  Trash,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
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
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("users");
  const [isCreatingTestAccounts, setIsCreatingTestAccounts] = useState(false);
  const isRTL = i18n.language === "ar";
  
  // Function to create test accounts
  const createTestAccounts = async () => {
    try {
      setIsCreatingTestAccounts(true);
      
      const response = await apiRequest('POST', '/api/create-test-accounts');
      const data = await response.json();
      
      toast({
        title: t("common.success"),
        description: t("admin.testAccountsCreated"),
        variant: "default",
      });
      
      // Refresh the page or update the user list
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.testAccountsError"),
        variant: "destructive",
      });
    } finally {
      setIsCreatingTestAccounts(false);
    }
  };

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && user?.role !== "admin") {
      toast({
        title: t("common.error"),
        description: t("common.unauthorized"),
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, isLoading, navigate, toast, t]);

  // Mock data for demo
  const mockUsers = [
    { id: 1, username: "admin", email: "admin@example.com", role: "admin", isVerified: true, createdAt: new Date().toLocaleDateString() },
    { id: 2, username: "client1", email: "client1@example.com", role: "client", isVerified: true, createdAt: new Date().toLocaleDateString() },
    { id: 3, username: "freelancer1", email: "freelancer1@example.com", role: "freelancer", isVerified: true, createdAt: new Date().toLocaleDateString() },
  ];

  const mockCategories = [
    { id: 1, name: t("categories.programmingDevelopment"), icon: "laptop", freelancerCount: 120 },
    { id: 2, name: t("categories.designArt"), icon: "brush", freelancerCount: 95 },
    { id: 3, name: t("categories.marketingSales"), icon: "trending-up", freelancerCount: 78 },
    { id: 4, name: t("categories.writingTranslation"), icon: "file-text", freelancerCount: 65 },
    { id: 5, name: t("categories.audioVideo"), icon: "video", freelancerCount: 42 },
    { id: 6, name: t("categories.consultingBusiness"), icon: "briefcase", freelancerCount: 56 }
  ];

  const mockProjects = [
    { id: 1, title: "Website Development", client: "Client Inc.", budget: 2500, status: "open", proposals: 12, createdAt: new Date().toLocaleDateString() },
    { id: 2, title: "Logo Design", client: "Design Co.", budget: 500, status: "in_progress", proposals: 8, createdAt: new Date().toLocaleDateString() },
    { id: 3, title: "Content Writing", client: "Media Ltd.", budget: 750, status: "completed", proposals: 15, createdAt: new Date().toLocaleDateString() }
  ];

  const mockPayments = [
    { id: 1, project: "Website Development", amount: 2500, status: "completed", date: new Date().toLocaleDateString() },
    { id: 2, project: "Logo Design", amount: 500, status: "pending", date: new Date().toLocaleDateString() },
    { id: 3, project: "Content Writing", amount: 750, status: "completed", date: new Date().toLocaleDateString() }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow container mx-auto py-8">
        <div className="flex flex-col space-y-6">
          <div className={cn(
            "flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
            isRTL && "md:flex-row-reverse"
          )}>
            <div>
              <h1 className="text-3xl font-cairo font-bold mb-2 text-foreground">
                {t("auth.admin.title")}
              </h1>
              <p className="text-muted-foreground">
                {t("auth.admin.description")}
              </p>
            </div>
            
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Badge variant="outline" className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full border-primary text-primary", 
                isRTL && "flex-row-reverse"
              )}>
                <Shield className="h-4 w-4" />
                {t("common.admin")}
              </Badge>
              <Select defaultValue={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">{t("dashboard.totalUsers")}</CardTitle>
                <CardDescription>{t("common.allUsers")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{mockUsers.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">{t("dashboard.totalProjects")}</CardTitle>
                <CardDescription>{t("common.allProjects")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{mockProjects.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">{t("dashboard.categories")}</CardTitle>
                <CardDescription>{t("common.allCategories")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{mockCategories.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">{t("dashboard.totalEarnings")}</CardTitle>
                <CardDescription>{t("common.platformFees")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$375</div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full gap-2">
              <TabsTrigger value="users" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">{t("auth.admin.users")}</span>
              </TabsTrigger>
              <TabsTrigger value="projects" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Folder className="h-4 w-4" />
                <span className="hidden md:inline">{t("auth.admin.projects")}</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Layers className="h-4 w-4" />
                <span className="hidden md:inline">{t("auth.admin.categories")}</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <CreditCard className="h-4 w-4" />
                <span className="hidden md:inline">{t("auth.admin.payments")}</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">{t("auth.admin.settings")}</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className={cn(
                    "flex justify-between items-center",
                    isRTL && "flex-row-reverse"
                  )}>
                    <CardTitle>{t("auth.admin.users")}</CardTitle>
                    <div className={cn(
                      "flex items-center gap-2",
                      isRTL && "flex-row-reverse"
                    )}>
                      <div className="relative">
                        <Search className={cn(
                          "absolute top-2.5 text-muted-foreground h-4 w-4",
                          isRTL ? "right-2.5" : "left-2.5" 
                        )} />
                        <Input placeholder={t("common.search")} className={isRTL ? "pr-8 w-60" : "pl-8 w-60"} />
                      </div>
                      <Button size="sm" className={cn("gap-1", isRTL && "flex-row-reverse")}>
                        <Plus className="h-4 w-4" />
                        <span>{t("common.add")}</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("profile.username")}</TableHead>
                        <TableHead>{t("profile.email")}</TableHead>
                        <TableHead>{t("auth.accountType")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead>{t("common.joined")}</TableHead>
                        <TableHead>{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockUsers.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={
                              user.role === "admin" ? "destructive" : 
                              user.role === "freelancer" ? "secondary" : "outline"
                            }>
                              {t(`auth.${user.role}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.isVerified ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600">
                                <Check className="h-3 w-3 mr-1" />
                                {t("common.verified")}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-orange-500 text-orange-500">
                                {t("common.pending")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{user.createdAt}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className={cn(isRTL && "flex-row-reverse")}>
                                  <Edit className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                  {t("common.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem className={cn(isRTL && "flex-row-reverse")}>
                                  <Shield className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                  {t("common.verify")}
                                </DropdownMenuItem>
                                <DropdownMenuItem className={cn("text-destructive", isRTL && "flex-row-reverse")}>
                                  <Trash className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                  {t("common.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className={cn(
                    "flex justify-between items-center",
                    isRTL && "flex-row-reverse"
                  )}>
                    <CardTitle>{t("auth.admin.projects")}</CardTitle>
                    <div className={cn(
                      "flex items-center gap-2",
                      isRTL && "flex-row-reverse"
                    )}>
                      <div className="relative">
                        <Search className={cn(
                          "absolute top-2.5 text-muted-foreground h-4 w-4",
                          isRTL ? "right-2.5" : "left-2.5" 
                        )} />
                        <Input placeholder={t("common.search")} className={isRTL ? "pr-8 w-60" : "pl-8 w-60"} />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("projects.projectTitle")}</TableHead>
                        <TableHead>{t("common.client")}</TableHead>
                        <TableHead>{t("projects.budget")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead>{t("proposals.title")}</TableHead>
                        <TableHead>{t("projects.posted")}</TableHead>
                        <TableHead>{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockProjects.map(project => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>{project.client}</TableCell>
                          <TableCell>${project.budget}</TableCell>
                          <TableCell>
                            <Badge variant={
                              project.status === "open" ? "secondary" : 
                              project.status === "in_progress" ? "outline" : 
                              "outline"
                            } className={
                              project.status === "completed" ? "bg-green-500/10 text-green-500" : ""
                            }>
                              {t(`projects.${project.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>{project.proposals}</TableCell>
                          <TableCell>{project.createdAt}</TableCell>
                          <TableCell>
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
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className={cn(
                    "flex justify-between items-center",
                    isRTL && "flex-row-reverse"
                  )}>
                    <CardTitle>{t("auth.admin.categories")}</CardTitle>
                    <div className={cn(
                      "flex items-center gap-2",
                      isRTL && "flex-row-reverse"
                    )}>
                      <Button size="sm" className={cn("gap-1", isRTL && "flex-row-reverse")}>
                        <Plus className="h-4 w-4" />
                        <span>{t("common.add")}</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.name")}</TableHead>
                        <TableHead>{t("common.icon")}</TableHead>
                        <TableHead>{t("categories.freelancers")}</TableHead>
                        <TableHead>{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockCategories.map(category => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.icon}</TableCell>
                          <TableCell>{category.freelancerCount}</TableCell>
                          <TableCell>
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
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>{t("auth.admin.payments")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.id")}</TableHead>
                        <TableHead>{t("common.project")}</TableHead>
                        <TableHead>{t("common.amount")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead>{t("common.date")}</TableHead>
                        <TableHead>{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockPayments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">#{payment.id}</TableCell>
                          <TableCell>{payment.project}</TableCell>
                          <TableCell>${payment.amount}</TableCell>
                          <TableCell>
                            <Badge variant={payment.status === "completed" ? "outline" : "outline"} className={
                              payment.status === "completed" ? "bg-green-500/10 text-green-500" : "border-orange-500 text-orange-500"
                            }>
                              {payment.status === "completed" ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : null}
                              {t(`payments.${payment.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>{payment.date}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>{t("auth.admin.settings")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid gap-3">
                      <h3 className="text-lg font-medium">{t("common.generalSettings")}</h3>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">{t("common.platformName")}</label>
                        <Input defaultValue="Khobaraa Platform" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">{t("common.platformFee")} (%)</label>
                        <Input type="number" defaultValue="10" />
                      </div>
                    </div>
                    
                    <div className="grid gap-3">
                      <h3 className="text-lg font-medium">{t("common.paymentSettings")}</h3>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">{t("common.paymentMethods")}</label>
                        <div className="flex gap-2">
                          <Badge variant="secondary">Stripe</Badge>
                          <Badge variant="secondary">PayPal</Badge>
                          <Badge variant="outline">PayTabs</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid gap-3">
                      <h3 className="text-lg font-medium">{t("common.developmentTools")}</h3>
                      <div className="grid gap-2">
                        <p className="text-sm text-muted-foreground">
                          {t("admin.createTestAccountsDescription")}
                        </p>
                        <Button 
                          variant="secondary"
                          className="gap-2 mt-2"
                          onClick={createTestAccounts}
                          disabled={isCreatingTestAccounts}
                        >
                          {isCreatingTestAccounts ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                          {t("admin.createTestAccounts")}
                        </Button>
                      </div>
                    </div>
                    
                    <Button className="w-full md:w-auto">
                      {t("common.saveChanges")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}