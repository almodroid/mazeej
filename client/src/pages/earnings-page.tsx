import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Proposal } from "@shared/schema";
import { Download, DollarSign, TrendingUp, Calendar, SaudiRiyal, BanknoteIcon, CreditCard, Loader2, Plus } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Transaction {
  id: number;
  paymentId: number;
  userId: number;
  username?: string;
  amount: number;
  type: 'fee' | 'payment' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  projectId?: number;
  projectTitle?: string;
}

interface PayoutAccount {
  id: number;
  type: "bank_account" | "paypal";
  name: string;
  isDefault: boolean;
  accountDetails: any;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  paymentMethod: string;
  reference?: string;
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

// Define form schema for withdrawal request
const withdrawalSchema = z.object({
  amount: z.coerce.number()
    .positive({ message: "Amount must be a positive number" })
    .min(100, { message: "Minimum withdrawal amount is 100 SAR" }),
  payoutAccount: z.string({
    required_error: "Please select a payout account",
  }),
  notes: z.string().optional(),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

export default function EarningsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === "ar";
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'withdrawals'>('history');

  // Fetch earnings data
  const { data: earnings = { total: 0, pending: 0, thisMonth: 0, available: 0 } } = useQuery({
    queryKey: ["/api/earnings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/earnings");
      if (!response.ok) {
        throw new Error("Failed to fetch earnings");
      }
      return response.json();
    },
    enabled: !!user && user.role === "freelancer",
  });

  // Fetch transactions data
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["/api/transactions/my"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/transactions/my");
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return response.json();
    },
    enabled: !!user && user.role === "freelancer",
  });

  // Fetch payout accounts
  const { data: payoutAccounts = [], isLoading: isLoadingAccounts } = useQuery<PayoutAccount[]>({
    queryKey: ["/api/payout-accounts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/payout-accounts");
      if (!response.ok) {
        throw new Error("Failed to fetch payout accounts");
      }
      return response.json();
    },
    enabled: !!user && user.role === "freelancer",
  });

  // Fetch withdrawal requests
  const { data: withdrawalRequests = [], isLoading: isLoadingWithdrawals, refetch: refetchWithdrawals } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/withdrawal-requests/my"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/withdrawal-requests/my");
      if (!response.ok) {
        throw new Error("Failed to fetch withdrawal requests");
      }
      return response.json();
    },
    enabled: !!user && user.role === "freelancer",
  });

  // Use backend-provided available balance
  const availableBalance = earnings.available ?? 0;

  // Withdrawal request mutation
  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalFormValues) => {
      const selectedAccount = payoutAccounts.find(a => a.id.toString() === data.payoutAccount);
      if (!selectedAccount) {
        throw new Error("Selected payout account not found");
      }

      const response = await apiRequest("POST", "/api/withdrawal-requests", {
        amount: data.amount,
        paymentMethod: selectedAccount.type === 'paypal' ? 'PayPal' : 'Bank Transfer',
        accountDetails: selectedAccount.accountDetails,
        notes: data.notes
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || "Failed to submit withdrawal request");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("earnings.withdraw.success"),
        description: t("payments.payoutSuccess"),
      });
      setIsWithdrawDialogOpen(false);
      form.reset();
      refetchWithdrawals();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("earnings.withdraw.error"),
        description: error.message,
      });
    }
  });

  // Setup form with zod validation
  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      notes: "",
    },
  });

  useEffect(() => {
    // Pre-select the default payout account if one exists
    const defaultAccount = payoutAccounts.find(account => account.isDefault);
    if (defaultAccount) {
      form.setValue('payoutAccount', defaultAccount.id.toString());
    }
  }, [payoutAccounts, form]);

  // Format date to display in a user-friendly way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{t("earnings.pending")}</Badge>;
      case "paid":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t("earnings.paid")}</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{t("earnings.withdraw.status.approved", { defaultValue: "Approved" })}</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{t("earnings.withdraw.status.rejected", { defaultValue: "Rejected" })}</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t("earnings.withdraw.status.completed", { defaultValue: "Completed" })}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Form submission handler
  const onSubmit = (data: WithdrawalFormValues) => {
    withdrawalMutation.mutate(data);
  };

  // Debug function to generate test earnings (only in development)
  const generateTestEarnings = async () => {
    try {
      const response = await apiRequest('POST', '/api/debug/generate-earnings', { amount: 1000 });
      if (!response.ok) {
        throw new Error('Failed to generate test earnings');
      }
      
      const data = await response.json();
      toast({
        title: "Test earnings generated",
        description: "Refresh the page to see your updated balance",
        variant: "default",
      });
      
      // Refresh earnings data
      queryClient.invalidateQueries({ queryKey: ['/api/earnings'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Redirect to Payments page to add an account
  const redirectToPaymentsPage = () => {
    window.location.href = '/payments';
  };

  if (!user || user.role !== "freelancer") {
    return null;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-cairo font-bold mb-6">
        {t("earnings.title")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between ">
              <div>
                <p className="text-sm text-neutral-500">{t("earnings.totalEarnings")}</p>
                <h3 className="text-2xl font-bold mt-1  flex align-middle items-center">{earnings.total} <SaudiRiyal className="h-6 w-6" /></h3>
              </div>
              <div className="bg-primary/10 p-3 rounded-full ">
                <SaudiRiyal className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">{t("earnings.pendingPayments")}</p>
                <h3 className="text-2xl font-bold mt-1  flex align-middle items-center">{earnings.pending} <SaudiRiyal className="h-6 w-6" /></h3>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">{t("earnings.thisMonth")}</p>
                <h3 className="text-2xl font-bold mt-1  flex align-middle items-center">{earnings.thisMonth} <SaudiRiyal className="h-6 w-6" /></h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t("earnings.earningsHistory")}</CardTitle>
              <CardDescription>{t("earnings.earningsHistoryDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'history' | 'withdrawals')} dir={isRTL ? "rtl" : "ltr"}>
                <TabsList className="grid grid-cols-2 w-[250px] mb-4">
                  <TabsTrigger value="history">{t("earnings.history")}</TabsTrigger>
                  <TabsTrigger value="withdrawals">{t("earnings.withdrawals")}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="history">
                  <div className="rounded-md border">
                    <div className={`grid grid-cols-5 dark:bg-gray-800 bg-neutral-50 p-4 text-sm font-medium text-neutral-500 ${isRTL ? "rtl" : ""}`}>
                      <div>{t("earnings.project")}</div>
                      <div>{t("earnings.type")}</div>
                      <div>{t("earnings.date")}</div>
                      <div>{t("earnings.amount")}</div>
                      <div>{t("earnings.status")}</div>
                    </div>
                    {transactions.map((transaction: Transaction) => (
                      <div key={transaction.id} className={`grid grid-cols-5 p-4 text-sm border-t ${isRTL ? "rtl" : ""}`}>
                        <div className="font-medium">{transaction.projectTitle || t("earnings.generalTransaction")}</div>
                        <div>{t(`earnings.transactionType.${transaction.type}`)}</div>
                        <div>{formatDate(transaction.createdAt)}</div>
                        <div>{transaction.amount} <SaudiRiyal className="h-6 w-6" /></div>
                        <div>{getStatusBadge(transaction.status)}</div>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <div className="p-4 text-center text-sm text-neutral-500">
                        {t("earnings.noTransactionsRecorded")}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="withdrawals">
                  <div className="rounded-md border">
                    <div className={`grid grid-cols-5 bg-neutral-50 dark:bg-gray-800 p-4 text-sm font-medium text-neutral-500 ${isRTL ? "rtl" : ""}`}>
                      <div>{t("earnings.date")}</div>
                      <div>{t("earnings.amount")}</div>
                      <div>{t("earnings.status")}</div>
                      <div>{t("earnings.method")}</div>
                      <div>{t("earnings.reference")}</div>
                    </div>
                    
                    {withdrawalRequests.length > 0 ? (
                      withdrawalRequests.map((request) => (
                        <div key={request.id} className="grid grid-cols-5 p-4 border-t">
                          <div>{formatDate(request.requestedAt)}</div>
                          <div>{request.amount} <SaudiRiyal className="h-4 w-4 inline" /></div>
                          <div>
                            <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                              {request.status}
                            </Badge>
                          </div>
                          <div>{request.paymentMethod}</div>
                          <div className="text-xs text-neutral-500">{request.reference}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-neutral-500">
                        {t("earnings.noWithdrawals")}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t("payments.payout")}</CardTitle>
              <CardDescription>{t("earnings.withdraw.description", { defaultValue: "Request withdrawals to your payout accounts" })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-gray-800 rounded-md border border-blue-200 dark:border-gray-700 text-blue-700 dark:text-blue-400">
                  <h4 className="font-medium mb-1">{t("earnings.availableBalance", { defaultValue: "Available Balance" })}</h4>
                  <p className="text-2xl font-bold flex align-middle items-center">{availableBalance} <SaudiRiyal className="h-6 w-6" /></p>
                  {availableBalance < 100 && (
                    <p className="text-xs mt-2 text-amber-600 dark:text-amber-400">
                      {t("payments.minAmount", { amount: "100" })}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                    <p>{t("earnings.totalBalance", { defaultValue: "Total Earnings" })}: {earnings.total} <SaudiRiyal className="h-4 w-4 inline" /></p>
                    <p>{t("earnings.pendingWithdrawals", { defaultValue: "Pending Withdrawals" })}: {earnings.total - availableBalance} <SaudiRiyal className="h-4 w-4 inline" /></p>
                  </div>
                </div>

                <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full"
                      disabled={availableBalance < 100 || payoutAccounts.length === 0}
                      variant={availableBalance < 100 ? "outline" : "default"}
                    >
                      {availableBalance < 100 
                        ? t("earnings.insufficientFunds", { defaultValue: "Insufficient Funds" })
                        : t("earnings.withdrawFunds")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("earnings.withdraw.title", { defaultValue: "Withdraw Funds" })}</DialogTitle>
                      <DialogDescription>
                        {t("earnings.withdraw.description", { defaultValue: "Request a withdrawal to your chosen payout account" })}
                      </DialogDescription>
                    </DialogHeader>
                    {payoutAccounts.length === 0 ? (
                      <div className="py-4 text-center">
                        <div className="rounded-full bg-amber-100 p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                          <BanknoteIcon className="h-6 w-6 text-amber-600" />
                        </div>
                        <h3 className="font-medium text-lg mb-2">{t("payments.noMethods")}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t("earnings.withdraw.addPayoutAccount", { defaultValue: "You need to add a payout account before you can withdraw funds." })}
                        </p>
                        <Button onClick={redirectToPaymentsPage}>
                          {t("payments.addPayoutAccount")}
                        </Button>
                      </div>
                    ) : (
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("earnings.withdraw.amount", { defaultValue: "Amount to Withdraw" })}</FormLabel>
                                <FormControl>
                                  <div className="relative flex align-middle items-center">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                                      <SaudiRiyal className="h-6 w-6" />
                                    </span>
                                    <Input type="number" className="pl-12" {...field} />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  <div className="space-y-1">
                                    <p>{t("payments.minAmount", { amount: "100" })}</p>
                                    <p className="font-medium text-blue-600 dark:text-blue-400">
                                      {t("earnings.availableToWithdraw", { defaultValue: "Available to withdraw" })}: {availableBalance} <SaudiRiyal className="h-4 w-4 inline" />
                                    </p>
                                    {field.value > availableBalance && (
                                      <p className="text-red-500">
                                        {t("earnings.withdraw.exceedsAvailable", { defaultValue: "Amount exceeds available balance" })}
                                      </p>
                                    )}
                                  </div>
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="payoutAccount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("payments.payoutMethod")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t("payments.payoutMethod")} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {payoutAccounts.map((account) => (
                                      <SelectItem key={account.id} value={account.id.toString()}>
                                        <div className="flex items-center">
                                          {account.type === "bank_account" ? (
                                            <BanknoteIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                          ) : (
                                            <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                                          )}
                                          {account.name}
                                          {account.isDefault && (
                                            <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200 dark:bg-gray-800 dark:text-blue-400 dark:border-gray-700">
                                              {t("payments.default")}
                                            </Badge>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  <div className="flex justify-between items-center">
                                    <span>{t("earnings.withdraw.selectPayoutAccount", { defaultValue: "Choose which account to receive your funds" })}</span>
                                    <Button variant="link" className="p-0 h-auto" onClick={redirectToPaymentsPage}>
                                      {t("payments.addNew")}
                                    </Button>
                                  </div>
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("common.notes", { defaultValue: "Notes" })}</FormLabel>
                                <FormControl>
                                  <Textarea placeholder={t("earnings.withdraw.notesPlaceholder", { defaultValue: "Any additional information..." })} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <DialogFooter className="pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsWithdrawDialogOpen(false)}
                            >
                              {t("common.cancel")}
                            </Button>
                            <Button
                              type="submit"
                              disabled={
                                withdrawalMutation.isPending || 
                                !form.formState.isValid ||
                                form.getValues("amount") > availableBalance ||
                                availableBalance < 100
                              }
                            >
                              {withdrawalMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  {t("earnings.withdraw.processing", { defaultValue: "Processing..." })}
                                </>
                              ) : (
                                t("earnings.withdraw.confirm", { defaultValue: "Confirm Withdrawal" })
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}