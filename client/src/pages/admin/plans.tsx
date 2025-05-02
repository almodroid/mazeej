import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Loader2,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/layouts/admin-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plan } from "@shared/schema-plans";

export default function AdminPlansPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({});
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const isRTL = i18n.language === "ar";

  // Fetch plans on component mount
  useEffect(() => {
    fetchPlans();
  }, []);

  // Fetch plans from the API
  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('GET', '/api/admin/plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: t("common.error"),
        description: t("admin.errorFetchingPlans"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Open dialog for creating a new plan
  const handleCreatePlan = () => {
    setCurrentPlan({
      key: "",
      title: "",
      price: "",
      priceNote: "",
      priceValue: 0,
      description: "",
      color: "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30",
      badge: "bg-blue-500 text-white",
      buttonColor: "bg-blue-500 hover:bg-blue-600 text-white",
      bestFor: "",
      maxProjects: 0,
      maxProposals: 0,
      maxWithdrawals: 0,
      isActive: true,
    });
    setFeatures([]);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  // Open dialog for editing an existing plan
  const handleEditPlan = (plan: Plan) => {
    setCurrentPlan(plan);
    setFeatures(plan.features as string[]);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Add a new feature to the features list
  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  // Remove a feature from the features list
  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Handle input change for plan form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentPlan({
      ...currentPlan,
      [name]: name === "priceValue" || name === "maxProjects" || name === "maxProposals" || name === "maxWithdrawals" 
        ? parseInt(value) || 0 
        : value,
    });
  };

  // Handle switch change for isActive
  const handleSwitchChange = (checked: boolean) => {
    setCurrentPlan({
      ...currentPlan,
      isActive: checked,
    });
  };

  // Save plan (create or update)
  const handleSavePlan = async () => {
    try {
      const planData = {
        ...currentPlan,
        features,
      };

      const method = isEditing ? 'PUT' : 'POST';
      const endpoint = isEditing ? `/api/admin/plans/${currentPlan.id}` : '/api/admin/plans';
      
      const response = await apiRequest(method, endpoint, planData);
      const data = await response.json();
      
      toast({
        title: t("common.success"),
        description: isEditing ? t("admin.planUpdated") : t("admin.planCreated"),
        variant: "default",
      });
      
      setIsDialogOpen(false);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: t("common.error"),
        description: t("admin.errorSavingPlan"),
        variant: "destructive",
      });
    }
  };

  // Delete a plan
  const handleDeletePlan = async (id: number) => {
    if (window.confirm(t("admin.confirmDeletePlan"))) {
      try {
        await apiRequest('DELETE', `/api/admin/plans/${id}`);
        
        toast({
          title: t("common.success"),
          description: t("admin.planDeleted"),
          variant: "default",
        });
        
        fetchPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
        toast({
          title: t("common.error"),
          description: t("admin.errorDeletingPlan"),
          variant: "destructive",
        });
      }
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t("auth.admin.subscriptionPlans")}</h1>
          <Button onClick={handleCreatePlan}>
            <Plus className="mr-2 h-4 w-4" />
            {t("auth.admin.createPlan")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.admin.managePlans")}</CardTitle>
            <CardDescription>
              {t("auth.admin.managePlansDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("auth.admin.planTitle")}</TableHead>
                    <TableHead>{t("auth.admin.planPrice")}</TableHead>
                    <TableHead>{t("auth.admin.planLimits")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        {t("auth.admin.noPlansFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className={cn("w-3 h-3 rounded-full mr-2", plan.badge.split(' ')[0])}></div>
                            {plan.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          {plan.price} {plan.priceNote}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{t("admin.projects")}: {plan.maxProjects}</div>
                            <div>{t("admin.proposals")}: {plan.maxProposals}</div>
                            <div>{t("admin.withdrawals")}: {plan.maxWithdrawals}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            plan.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          )}>
                            {plan.isActive ? t("common.active") : t("common.inactive")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t("admin.editPlan") : t("admin.createPlan")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.planFormDescription")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("auth.admin.planTitle")}</Label>
                <Input
                  id="title"
                  name="title"
                  value={currentPlan.title || ''}
                  onChange={handleInputChange}
                  placeholder={t("auth.admin.planTitlePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key">{t("auth.admin.planKey")}</Label>
                <Input
                  id="key"
                  name="key"
                  value={currentPlan.key || ''}
                  onChange={handleInputChange}
                  placeholder={t("auth.admin.planKeyPlaceholder")}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t("auth.admin.planPrice")}</Label>
                <Input
                  id="price"
                  name="price"
                  value={currentPlan.price || ''}
                  onChange={handleInputChange}
                  placeholder={t("auth.admin.planPricePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceNote">{t("auth.admin.planPriceNote")}</Label>
                <Input
                  id="priceNote"
                  name="priceNote"
                  value={currentPlan.priceNote || ''}
                  onChange={handleInputChange}
                  placeholder={t("auth.admin.planPriceNotePlaceholder")}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceValue">{t("auth.admin.planPriceValue")}</Label>
                <Input
                  id="priceValue"
                  name="priceValue"
                  type="number"
                  value={currentPlan.priceValue || 0}
                  onChange={handleInputChange}
                  placeholder={t("auth.admin.planPriceValuePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bestFor">{t("auth.admin.planBestFor")}</Label>
                <Input
                  id="bestFor"
                  name="bestFor"
                  value={currentPlan.bestFor || ''}
                  onChange={handleInputChange}
                  placeholder={t("auth.admin.planBestForPlaceholder")}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">{t("auth.admin.planDescription")}</Label>
              <Textarea
                id="description"
                name="description"
                value={currentPlan.description || ''}
                onChange={handleInputChange}
                placeholder={t("auth.admin.planDescriptionPlaceholder")}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxProjects">{t("auth.admin.maxProjects")}</Label>
                <Input
                  id="maxProjects"
                  name="maxProjects"
                  type="number"
                  value={currentPlan.maxProjects || 0}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxProposals">{t("auth.admin.maxProposals")}</Label>
                <Input
                  id="maxProposals"
                  name="maxProposals"
                  type="number"
                  value={currentPlan.maxProposals || 0}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxWithdrawals">{t("auth.admin.maxWithdrawals")}</Label>
                <Input
                  id="maxWithdrawals"
                  name="maxWithdrawals"
                  type="number"
                  value={currentPlan.maxWithdrawals || 0}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">{t("auth.admin.planColor")}</Label>
                <Input
                  id="color"
                  name="color"
                  value={currentPlan.color || ''}
                  onChange={handleInputChange}
                  placeholder="border-blue-400 bg-blue-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="badge">{t("auth.admin.planBadge")}</Label>
                <Input
                  id="badge"
                  name="badge"
                  value={currentPlan.badge || ''}
                  onChange={handleInputChange}
                  placeholder="bg-blue-500 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buttonColor">{t("auth.admin.planButtonColor")}</Label>
                <Input
                  id="buttonColor"
                  name="buttonColor"
                  value={currentPlan.buttonColor || ''}
                  onChange={handleInputChange}
                  placeholder="bg-blue-500 hover:bg-blue-600 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">{t("auth.admin.planActive")}</Label>
                <Switch
                  id="isActive"
                  checked={currentPlan.isActive}
                  onCheckedChange={handleSwitchChange}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <Label>{t("auth.admin.planFeatures")}</Label>
              
              <div className="flex space-x-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder={t("auth.admin.newFeaturePlaceholder")}
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span>{feature}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveFeature(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {features.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    {t("auth.admin.noFeaturesAdded")}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSavePlan}>
              {isEditing ? t("common.update") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}