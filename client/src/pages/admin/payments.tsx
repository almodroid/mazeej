import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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
  Plus,
  Edit,
  Trash,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Settings,
  CreditCard,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Calendar,
  User,
  Check,
  CheckCircle,
  X,
  Info,
  SaudiRiyal
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
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import AdminLayout from "@/components/layouts/admin-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FormDescription,
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

// Define interfaces
interface Payment {
  id: number;
  userId: number;
  username?: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  type: 'deposit' | 'withdrawal' | 'project_payment';
  projectId?: number;
  projectTitle?: string;
  createdAt: string;
  description?: string;
}

interface Transaction {
  id: number;
  paymentId: number;
  userId: number;
  username?: string;
  amount: number;
  type: 'fee' | 'payment' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

interface WithdrawalRequest {
  id: number;
  userId: number;
  username?: string;
  amount: number;
  paymentMethod: string;
  accountDetails: any;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  adminId?: number;
  adminUsername?: string;
  paymentId?: number;
  requestedAt: string;
  processedAt?: string;
}

// Define form schema for adding a payment
const paymentSchema = z.object({
  userId: z.string({
    required_error: "User ID is required",
  }),
  amount: z.coerce.number().positive({
    message: "Amount must be a positive number",
  }),
  type: z.enum(['deposit', 'withdrawal', 'project_payment'], {
    required_error: "Payment type is required",
  }),
  projectId: z.string().optional(),
  status: z.enum(['completed', 'pending', 'failed'], {
    required_error: "Status is required",
  }),
  description: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function AdminPaymentsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("payments");
  const [searchQuery, setSearchQuery] = useState("");
  const isRTL = i18n.language === "ar";
  
  // Dialog states
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  
  // Payment deletion state
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  // Fetch payments data
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/payments");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Fetch transactions data
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/transactions");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Fetch withdrawal requests data
  const { data: withdrawalRequests = [], isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ["/api/withdrawal-requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/withdrawal-requests");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Fetch users data for the dropdown
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Fetch projects data for the dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Filter payments based on search query
  const filteredPayments = searchQuery.trim() === ""
    ? payments
    : (payments as Payment[]).filter((payment: Payment) => 
        payment.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Filter transactions based on search query
  const filteredTransactions = searchQuery.trim() === ""
    ? transactions
    : (transactions as Transaction[]).filter((transaction: Transaction) => 
        transaction.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Filter withdrawal requests based on search query
  const filteredWithdrawals = searchQuery.trim() === ""
    ? withdrawalRequests
    : (withdrawalRequests as WithdrawalRequest[]).filter((withdrawal: WithdrawalRequest) => 
        withdrawal.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        withdrawal.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        withdrawal.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Calculate total platform earnings (5% of all completed payments)
  const totalEarnings = (payments as Payment[])
    .filter(payment => payment.status === 'completed')
    .reduce((total: number, payment: Payment) => {
      return total + (payment.amount * 0.05);
    }, 0);
  
  // Form setup with zod validation
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      status: 'completed',
      type: 'deposit',
    },
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: PaymentFormValues) => {
      const response = await apiRequest("POST", "/api/payments", paymentData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || "Failed to create payment");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t("admin.paymentAdded", { defaultValue: "Payment added successfully" }),
        description: t("admin.paymentAddedDesc", { 
          defaultValue: "The new payment has been recorded." 
        }),
      });
      setIsAddPaymentOpen(false);
      form.reset();
      
      // Create transaction record if payment is completed
      if (data.status === 'completed') {
        createTransactionMutation.mutate({
          paymentId: data.id,
          userId: parseInt(data.userId),
          amount: data.amount,
          type: data.type === 'withdrawal' ? 'withdrawal' : 'payment',
          status: 'completed'
        });
      }
      
      // Refetch payments and transactions list
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/transactions"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error 
          ? error.message 
          : t("admin.paymentAddError", { defaultValue: "Failed to add payment. Please try again." }),
      });
    }
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      const response = await apiRequest("POST", "/api/transactions", transactionData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || "Failed to create transaction");
      }
      return response.json();
    },
    onError: (error) => {
      console.error('Error creating transaction:', error);
      // Don't show error to user as this is a background operation
    }
  });

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await apiRequest("DELETE", `/api/payments/${paymentId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || "Failed to delete payment");
      }
      return response;
    },
    onSuccess: () => {
      toast({
        title: t("admin.paymentDeleted", { defaultValue: "Payment deleted successfully" }),
        description: t("admin.paymentDeletedDesc", { 
          defaultValue: "The payment has been removed from the system." 
        }),
      });
      setPaymentToDelete(null);
      // Refetch payments and transactions list
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/transactions"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error 
          ? error.message 
          : t("admin.paymentDeleteError", { defaultValue: "Failed to delete payment. Please try again." }),
      });
    }
  });

  // Update withdrawal request status mutation
  const updateWithdrawalStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number | string, status: string, notes?: string }) => {
      const response = await apiRequest("PATCH", `/api/withdrawal-requests/${id}/status`, {
        status,
        notes
      });
      if (!response.ok) {
        throw new Error("Failed to update withdrawal request status");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("earnings.withdraw.statusUpdated", { defaultValue: "Status updated" }),
        description: t("earnings.withdraw.statusUpdatedDescription", { 
          defaultValue: "The withdrawal request status has been updated successfully." 
        }),
      });
      // Refetch withdrawal requests, payments, and transactions
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error 
          ? error.message 
          : t("earnings.withdraw.error", { defaultValue: "Failed to update withdrawal status. Please try again." }),
      });
    }
  });

  // Form submission handler
  const onSubmit = (data: PaymentFormValues) => {
    createPaymentMutation.mutate(data);
  };

  // Returns an appropriate badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return "bg-green-500/10 text-green-500";
      case 'pending':
        return "bg-yellow-500/10 text-yellow-500";
      case 'failed':
        return "bg-red-500/10 text-red-500";
      default:
        return "outline";
    }
  };

  // Returns an appropriate badge variant based on transaction type
  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'payment':
        return "bg-blue-500/10 text-blue-500";
      case 'withdrawal':
        return "bg-orange-500/10 text-orange-500";
      case 'project_payment':
        return "bg-violet-500/10 text-violet-500";
      case 'fee':
        return "bg-emerald-500/10 text-emerald-500";
      case 'refund':
        return "bg-red-500/10 text-red-500";
      default:
        return "outline";
    }
  };

  // Format date string to local date format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-6">
        <div className={cn(
          "flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
        )}>
          <div>
            <h1 className="text-3xl font-cairo font-bold mb-2 text-foreground">
              {t("auth.admin.payments")}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.admin.paymentsDescription", {defaultValue: "Manage platform payments and transactions"})}
            </p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-100 dark:border-blue-900/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">{t("payments.totalProcessed")}</CardTitle>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground  flex align-middle items-center">
                {(payments as Payment[])
                  .filter(payment => payment.status === 'completed')
                  .reduce((total, payment) => total + payment.amount, 0)
                  .toFixed(2)} <SaudiRiyal className="h-6 w-6" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {(payments as Payment[]).filter(payment => payment.status === 'completed').length} {t("common.transactions")}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-100 dark:border-emerald-900/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">{t("dashboard.totalEarnings")}</CardTitle>
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                <SaudiRiyal className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground  flex align-middle items-center">
                {totalEarnings.toFixed(2)} <SaudiRiyal className="h-6 w-6" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                5% {t("payments.platformFee")}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-100 dark:border-amber-900/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">{t("payments.pendingPayments")}</CardTitle>
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground flex align-middle items-center">
                {(payments as Payment[])
                  .filter(payment => payment.status === 'pending')
                  .reduce((total, payment) => total + payment.amount, 0)
                  .toFixed(2)} <SaudiRiyal className="h-6 w-6" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {(payments as Payment[]).filter(payment => payment.status === 'pending').length} {t("common.transactions")}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs for Payments and Transactions */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir={isRTL ? "rtl" : "ltr"}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="payments">{t("payments.payments")}</TabsTrigger>
              <TabsTrigger value="transactions">{t("payments.transactions")}</TabsTrigger>
              <TabsTrigger value="withdrawals">{t("earnings.withdraw.title")}</TabsTrigger>
            </TabsList>
            
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
                onClick={() => setIsAddPaymentOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span>{t("payments.addPayment")}</span>
              </Button>
            </div>
          </div>
          
          {/* Payments Tab Content */}
          <TabsContent value="payments" className="pt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t("payments.paymentHistory")}</CardTitle>
                <CardDescription>{t("payments.paymentHistoryDesc", {defaultValue: "View and manage all payment records"})}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPayments ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <CreditCard className="h-6 w-6 text-muted-foreground" />
                    </div>
                    {searchQuery.trim() !== "" ? (
                      <>
                        <h3 className="text-lg font-medium">{t("payments.noPaymentsFound", { defaultValue: "No Payments Found" })}</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-2">
                          {t("payments.noPaymentsFoundForSearch", { defaultValue: "No payments match your search criteria. Try a different search term." })}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium">{t("payments.noPayments", { defaultValue: "No Payments" })}</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-2">
                          {t("payments.noPaymentsDescription", { defaultValue: "There are no payment records in the system yet." })}
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
                            <TableHead>{t("payments.paymentId")}</TableHead>
                            <TableHead>{t("common.user")}</TableHead>
                            <TableHead>{t("payments.amount")}</TableHead>
                            <TableHead>{t("payments.type")}</TableHead>
                            <TableHead>{t("payments.project")}</TableHead>
                            <TableHead>{t("common.status")}</TableHead>
                            <TableHead>{t("common.date")}</TableHead>
                            <TableHead className="text-right">{t("common.actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(filteredPayments as Payment[]).map((payment: Payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-medium">{String(payment.id).substring(0, 8)}</TableCell>
                              <TableCell>{payment.username || String(payment.userId).substring(0, 8)}</TableCell>
                              <TableCell>{payment.amount.toFixed(2)} <SaudiRiyal className="h-6 w-6 text-primary" /></TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn(getTypeBadgeVariant(payment.type))}>
                                  {t(`payments.type.${payment.type}`, { defaultValue: payment.type })}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {payment.projectTitle || (payment.projectId ? String(payment.projectId).substring(0, 8) : '-')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn(getStatusBadgeVariant(payment.status))}>
                                  {t(`payments.status.${payment.status}`)}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(payment.createdAt)}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel className={cn(isRTL && "text-right")}>{t("common.actions")}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className={cn(isRTL && "flex-row")}>
                                      <Edit className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                      {t("common.edit")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className={cn("text-destructive", isRTL && "flex-row")}
                                      onClick={() => setPaymentToDelete(payment.id.toString())}
                                    >
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
          </TabsContent>
          
          {/* Transactions Tab Content */}
          <TabsContent value="transactions" className="pt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t("payments.transactionHistory")}</CardTitle>
                <CardDescription>{t("payments.transactionHistoryDesc", {defaultValue: "View all financial transactions"})}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTransactions ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <ArrowUpFromLine className="h-6 w-6 text-muted-foreground" />
                    </div>
                    {searchQuery.trim() !== "" ? (
                      <>
                        <h3 className="text-lg font-medium">{t("payments.noTransactionsFound", { defaultValue: "No Transactions Found" })}</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-2">
                          {t("payments.noTransactionsFoundForSearch", { defaultValue: "No transactions match your search criteria. Try a different search term." })}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium">{t("payments.noTransactions", { defaultValue: "No Transactions" })}</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-2">
                          {t("payments.noTransactionsDescription", { defaultValue: "There are no transaction records in the system yet." })}
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
                            <TableHead>{t("payments.transactionId")}</TableHead>
                            <TableHead>{t("payments.paymentId")}</TableHead>
                            <TableHead>{t("common.user")}</TableHead>
                            <TableHead>{t("payments.amount")}</TableHead>
                            <TableHead>{t("payments.type")}</TableHead>
                            <TableHead>{t("common.status")}</TableHead>
                            <TableHead>{t("common.date")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(filteredTransactions as Transaction[]).map((transaction: Transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">{String(transaction.id).substring(0, 8)}</TableCell>
                              <TableCell>{String(transaction.paymentId).substring(0, 8)}</TableCell>
                              <TableCell>{transaction.username || String(transaction.userId).substring(0, 8)}</TableCell>
                              <TableCell>{transaction.amount.toFixed(2)} <SaudiRiyal className="h-6 w-6" /></TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn(getTypeBadgeVariant(transaction.type))}>
                                  {t(`payments.type.${transaction.type}`, { defaultValue: transaction.type })}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn(getStatusBadgeVariant(transaction.status))}>
                                  {t(`payments.status.${transaction.status}`)}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(transaction.createdAt)}</TableCell>
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
          </TabsContent>
          
          {/* Withdrawal Requests Tab Content */}
          <TabsContent value="withdrawals" className="pt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t("earnings.withdraw.title", {defaultValue: "Withdrawal Requests"})}</CardTitle>
                <CardDescription>{t("earnings.withdraw.description", {defaultValue: "Manage withdrawal requests from freelancers"})}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingWithdrawals ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : filteredWithdrawals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <CreditCard className="h-6 w-6 text-muted-foreground" />
                    </div>
                    {searchQuery.trim() !== "" ? (
                      <>
                        <h3 className="text-lg font-medium">{t("earnings.withdraw.noRequestsFound", { defaultValue: "No Withdrawal Requests Found" })}</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-2">
                          {t("earnings.withdraw.noRequestsFoundForSearch", { defaultValue: "No withdrawal requests match your search criteria. Try a different search term." })}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium">{t("earnings.withdraw.noRequests", { defaultValue: "No Withdrawal Requests" })}</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-2">
                          {t("earnings.withdraw.noRequestsDescription", { defaultValue: "There are no withdrawal requests in the system yet." })}
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
                            <TableHead>{t("common.id")}</TableHead>
                            <TableHead>{t("common.user")}</TableHead>
                            <TableHead>{t("payments.amount")}</TableHead>
                            <TableHead>{t("payments.paymentMethod")}</TableHead>
                            <TableHead>{t("common.status")}</TableHead>
                            <TableHead>{t("common.date")}</TableHead>
                            <TableHead className="text-right">{t("common.actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(filteredWithdrawals as WithdrawalRequest[]).map((withdrawal: WithdrawalRequest) => (
                            <TableRow key={withdrawal.id}>
                              <TableCell className="font-medium">{String(withdrawal.id).substring(0, 8)}</TableCell>
                              <TableCell>{withdrawal.username || String(withdrawal.userId).substring(0, 8)}</TableCell>
                              <TableCell>{withdrawal.amount.toFixed(2)} <SaudiRiyal className="h-6 w-6" /></TableCell>
                              <TableCell>{withdrawal.paymentMethod}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn(
                                  withdrawal.status === 'pending' ? "bg-yellow-500/10 text-yellow-500" :
                                  withdrawal.status === 'approved' ? "bg-blue-500/10 text-blue-500" :
                                  withdrawal.status === 'completed' ? "bg-green-500/10 text-green-500" :
                                  "bg-red-500/10 text-red-500"
                                )}>
                                  {t(`earnings.withdraw.status.${withdrawal.status}`, { defaultValue: withdrawal.status })}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(withdrawal.requestedAt)}</TableCell>
                              <TableCell className="text-right">
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
                                      onClick={() => {
                                        updateWithdrawalStatusMutation.mutate({
                                          id: withdrawal.id.toString(),
                                          status: "approved",
                                          notes: "Approved by admin"
                                        });
                                      }}
                                      disabled={withdrawal.status !== 'pending' || updateWithdrawalStatusMutation.isPending}
                                    >
                                      <Check className={cn("h-4 w-4 text-green-600", isRTL ? "ml-2" : "mr-2")} />
                                      {t("earnings.withdraw.approve", { defaultValue: "Approve" })}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className={cn(isRTL && "flex-row")}
                                      onClick={() => {
                                        updateWithdrawalStatusMutation.mutate({
                                          id: withdrawal.id.toString(),
                                          status: "completed",
                                          notes: "Marked as completed by admin"
                                        });
                                      }}
                                      disabled={withdrawal.status !== 'approved' || updateWithdrawalStatusMutation.isPending}
                                    >
                                      <CheckCircle className={cn("h-4 w-4 text-blue-600", isRTL ? "ml-2" : "mr-2")} />
                                      {t("earnings.withdraw.complete", { defaultValue: "Mark as Completed" })}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className={cn("text-destructive", isRTL && "flex-row")}
                                      onClick={() => {
                                        updateWithdrawalStatusMutation.mutate({
                                          id: withdrawal.id.toString(),
                                          status: "rejected",
                                          notes: "Rejected by admin"
                                        });
                                      }}
                                      disabled={withdrawal.status !== 'pending' || updateWithdrawalStatusMutation.isPending}
                                    >
                                      <X className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                      {t("earnings.withdraw.reject", { defaultValue: "Reject" })}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className={cn(isRTL && "flex-row")}>
                                      <Info className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                      {t("common.details", { defaultValue: "View Details" })}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
          </TabsContent>
        </Tabs>
        
        {/* Add Payment Modal */}
        <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("payments.addPayment", { defaultValue: "Add New Payment" })}</DialogTitle>
              <DialogDescription>
                {t("payments.addPaymentDesc", { defaultValue: "Create a new payment record in the system." })}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.user")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("payments.selectUser", { defaultValue: "Select a user" })} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(users || []).map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.username} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("payments.amount")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <SaudiRiyal className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="number" step="0.01" className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("payments.type.label")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("payments.selectType", { defaultValue: "Select type" })} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="deposit">{t("payments.type.deposit")}</SelectItem>
                            <SelectItem value="withdrawal">{t("payments.type.withdrawal")}</SelectItem>
                            <SelectItem value="project_payment">{t("payments.type.project_payment")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.status")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("payments.selectStatus", { defaultValue: "Select status" })} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="completed">{t("payments.status.completed")}</SelectItem>
                            <SelectItem value="pending">{t("payments.status.pending")}</SelectItem>
                            <SelectItem value="failed">{t("payments.status.failed")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {form.watch("type") === "project_payment" && (
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("payments.project")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("payments.selectProject", { defaultValue: "Select a project" })} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(projects || []).map((project: any) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("payments.projectRequired", { defaultValue: "Required for project payments" })}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.description")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("payments.descriptionPlaceholder", { defaultValue: "Payment description" })} {...field} />
                      </FormControl>
                      <FormDescription>
                        {t("payments.descriptionHelp", { defaultValue: "Optional note about this payment" })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddPaymentOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createPaymentMutation.isPending}
                  >
                    {createPaymentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("payments.addPayment")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Payment Confirmation Dialog */}
        <Dialog open={!!paymentToDelete} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("payments.confirmDelete", { defaultValue: "Confirm Deletion" })}</DialogTitle>
              <DialogDescription>
                {t("payments.deletePaymentConfirm", { defaultValue: "Are you sure you want to delete this payment record? This action cannot be undone." })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setPaymentToDelete(null)}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                variant="destructive"
                disabled={deletePaymentMutation.isPending}
                onClick={() => paymentToDelete && deletePaymentMutation.mutate(paymentToDelete)}
              >
                {deletePaymentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("common.delete")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}