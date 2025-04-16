import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Proposal } from "@shared/schema";
import { Download, DollarSign, TrendingUp, Calendar, SaudiRiyal } from "lucide-react";
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

interface EarningPeriod {
  id: string;
  amount: number;
  date: string;
  status: "pending" | "paid";
  projectTitle: string;
  clientName: string;
}

interface PaymentMethod {
  id: number;
  type: string;
  name: string;
  isDefault: boolean;
  accountDetails: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

// Define form schema for withdrawal request
const withdrawalSchema = z.object({
  amount: z.coerce.number().positive({
    message: "Amount must be a positive number",
  }),
  paymentMethod: z.string({
    required_error: "Please select a payment method",
  }),
  notes: z.string().optional(),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

export default function EarningsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isRTL = i18n.language === "ar";
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);

  // Fetch earnings data
  const { data: earnings = { total: 0, pending: 0, thisMonth: 0, periods: [] } } = useQuery({
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

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/users/payment-methods"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users/payment-methods");
      if (!response.ok) {
        throw new Error("Failed to fetch payment methods");
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

  // Calculate available balance
  const pendingWithdrawalsTotal = withdrawalRequests
    .filter(wr => wr.status === 'pending' || wr.status === 'approved')
    .reduce((sum, wr) => sum + wr.amount, 0);
  
  const availableBalance = earnings.total - pendingWithdrawalsTotal;

  // Withdrawal request mutation
  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalFormValues) => {
      const selectedMethod = paymentMethods.find(m => m.id.toString() === data.paymentMethod);
      if (!selectedMethod) {
        throw new Error("Selected payment method not found");
      }

      const response = await apiRequest("POST", "/api/withdrawal-requests", {
        amount: data.amount,
        paymentMethod: selectedMethod.name,
        accountDetails: JSON.parse(selectedMethod.accountDetails),
        notes: data.notes
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit withdrawal request");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("earnings.withdraw.success"),
        description: t("earnings.withdraw.successDescription"),
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
              <div className="rounded-md border">
                <div className={`grid grid-cols-5 bg-neutral-50 p-4 text-sm font-medium text-neutral-500 ${isRTL ? "rtl" : ""}`}>
                  <div>{t("earnings.project")}</div>
                  <div>{t("earnings.client")}</div>
                  <div>{t("earnings.date")}</div>
                  <div>{t("earnings.amount")}</div>
                  <div>{t("earnings.status")}</div>
                </div>
                {earnings.periods && earnings.periods.map((period: EarningPeriod) => (
                  <div key={period.id} className={`grid grid-cols-5 p-4 text-sm border-t ${isRTL ? "rtl" : ""}`}>
                    <div className="font-medium">{period.projectTitle}</div>
                    <div>{period.clientName}</div>
                    <div>{formatDate(period.date)}</div>
                    <div>{period.amount} <SaudiRiyal className="h-6 w-6" /></div>
                    <div>{getStatusBadge(period.status)}</div>
                  </div>
                ))}
                {(!earnings.periods || earnings.periods.length === 0) && (
                  <div className="p-4 text-center text-sm text-neutral-500">
                    {t("earnings.noEarningsRecorded")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t("earnings.withdraw.title", { defaultValue: "Withdrawals" })}</CardTitle>
              <CardDescription>{t("earnings.withdraw.description", { defaultValue: "Request withdrawals to your payment methods" })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-md border border-blue-200 text-blue-700">
                  <h4 className="font-medium mb-1">{t("earnings.availableBalance", { defaultValue: "Available Balance" })}</h4>
                  <p className="text-2xl font-bold  flex align-middle items-center">{availableBalance} <SaudiRiyal className="h-6 w-6" /></p>
                </div>

                <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full"
                      disabled={availableBalance <= 0 || paymentMethods.length === 0}
                    >
                      {t("earnings.withdrawFunds")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("earnings.withdraw.title", { defaultValue: "Withdraw Funds" })}</DialogTitle>
                      <DialogDescription>
                        {t("earnings.withdraw.withdrawDescription", { defaultValue: "Request a withdrawal to your chosen payment method" })}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("earnings.withdraw.amount", { defaultValue: "Amount to Withdraw" })}</FormLabel>
                              <FormControl>
                                <div className="relative  flex align-middle items-center">
                                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                                    <SaudiRiyal className="h-6 w-6" />
                                  </span>
                                  <Input type="number" className="pl-12" {...field} />
                                </div>
                              </FormControl>
                              <FormDescription>
                                {t("earnings.withdraw.minWithdrawal", { amount: "100", defaultValue: "Minimum withdrawal amount is 100 ريال" })}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("earnings.withdraw.paymentMethod", { defaultValue: "Payment Method" })}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("payments.selectMethod", { defaultValue: "Select a payment method" })} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {paymentMethods.map((method) => (
                                    <SelectItem key={method.id} value={method.id.toString()}>
                                      {method.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                {paymentMethods.length === 0 ? (
                                  <span className="text-red-500">
                                    {t("payments.noMethods", { defaultValue: "No payment methods available. Please add one first." })}
                                  </span>
                                ) : (
                                  t("earnings.withdraw.selectPaymentMethodDescription", { defaultValue: "Choose how you want to receive your funds" })
                                )}
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
                              form.getValues("amount") <= 0 || 
                              form.getValues("amount") > availableBalance || 
                              !form.getValues("paymentMethod")
                            }
                          >
                            {withdrawalMutation.isPending ? 
                              t("earnings.withdraw.processing", { defaultValue: "Processing..." }) : 
                              t("earnings.withdraw.confirm", { defaultValue: "Confirm Withdrawal" })
                            }
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">{t("earnings.withdraw.recentRequests", { defaultValue: "Recent Withdrawal Requests" })}</h4>
                  <div className="space-y-3">
                    {withdrawalRequests.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-3 text-center border rounded-md">
                        {t("earnings.withdraw.noRequests", { defaultValue: "No withdrawal requests yet" })}
                      </div>
                    ) : (
                      withdrawalRequests.slice(0, 5).map((request) => (
                        <div key={request.id} className="p-3 border rounded-md flex justify-between items-center">
                          <div>
                            <p className="font-medium  flex align-middle items-center  flex align-middle items-center">{request.amount} <SaudiRiyal className="h-6 w-6" /></p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(request.requestedAt)}
                            </p>
                          </div>
                          <div>
                            {getStatusBadge(request.status)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className={`flex justify-end ${isRTL ? "rtl" : ""}`}>
        <Button variant="outline" className={isRTL ? "ml-2" : "mr-2"}>
          <Download size={16} className={isRTL ? "ml-2" : "mr-2"} />
          {t("earnings.downloadCSV")}
        </Button>
      </div>
    </DashboardLayout>
  );
}