import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CreditCard, Plus, Download, DollarSign, BanknoteIcon, Trash, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface Transaction {
  id: number;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
  projectTitle: string;
  partyName: string;
}

interface PayoutAccount {
  id: number;
  type: "bank_account" | "paypal";
  name: string;
  isDefault: boolean;
  accountDetails: any;
  createdAt: string;
}

// Schema for bank account form
const bankAccountSchema = z.object({
  bankName: z.string().min(2, { message: "Bank name is required" }),
  accountName: z.string().min(2, { message: "Account name is required" }),
  accountNumber: z.string().min(5, { message: "Valid account number is required" }),
  swiftCode: z.string().optional(),
  routingNumber: z.string().optional(),
  isDefault: z.boolean().default(false)
});

// Schema for PayPal form
const paypalSchema = z.object({
  email: z.string().email({ message: "Valid email is required" }),
  isDefault: z.boolean().default(false)
});

export default function PaymentsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<"bank_account" | "paypal">("bank_account");
  const [deleteAccountId, setDeleteAccountId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Define RTL state based on language
  const isRTL = i18n.language === 'ar';

  // Bank account form
  const bankForm = useForm<z.infer<typeof bankAccountSchema>>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      swiftCode: "",
      routingNumber: "",
      isDefault: false
    }
  });

  // PayPal form
  const paypalForm = useForm<z.infer<typeof paypalSchema>>({
    resolver: zodResolver(paypalSchema),
    defaultValues: {
      email: "",
      isDefault: false
    }
  });

  // Fetch payout accounts from API
  const { 
    data: payoutAccounts = [], 
    isLoading: isLoadingAccounts
  } = useQuery<PayoutAccount[]>({
    queryKey: ['/api/payout-accounts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/payout-accounts');
      if (!response.ok) {
        throw new Error('Failed to fetch payout accounts');
      }
      return response.json();
    }
  });

  // Fetch transactions from API
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions 
  } = useQuery<Transaction[]>({
    queryKey: ['/api/users/transactions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    }
  });

  // Add payout account mutation
  const addAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      let accountDetails;
      let accountName;
      
      if (paymentType === 'bank_account') {
        accountDetails = {
          bankName: data.bankName,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          swiftCode: data.swiftCode,
          routingNumber: data.routingNumber
        };
        accountName = `${data.bankName} - ${data.accountName}`;
      } else { // paypal
        accountDetails = {
          email: data.email
        };
        accountName = `PayPal - ${data.email}`;
      }
      
      const response = await apiRequest('POST', '/api/payout-accounts', {
        type: paymentType,
        name: accountName,
        accountDetails,
        isDefault: data.isDefault
      });
      
      if (!response.ok) {
        throw new Error('Failed to add payout account');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("payments.methodAdded"),
        description: t("payments.methodAddedDesc"),
        variant: "default",
      });
      setIsAddPaymentOpen(false);
      
      // Reset forms
      bankForm.reset();
      paypalForm.reset();
      
      // Refresh accounts data
      queryClient.invalidateQueries({ queryKey: ['/api/payout-accounts'] });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete payout account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/payout-accounts/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to delete payout account');
      }
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: t("payments.methodDeleted"),
        description: t("payments.methodDeletedDesc"),
        variant: "default",
      });
      
      // Refresh accounts data
      queryClient.invalidateQueries({ queryKey: ['/api/payout-accounts'] });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeleteAccountId(null);
      setIsDeleteDialogOpen(false);
    }
  });

  // Handle method deletion with confirmation
  const handleDeleteAccount = (id: number) => {
    setDeleteAccountId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = () => {
    if (deleteAccountId !== null) {
      deleteAccountMutation.mutate(deleteAccountId);
    }
  };

  // Handle form submission
  const onSubmitBankAccount = (data: z.infer<typeof bankAccountSchema>) => {
    addAccountMutation.mutate(data);
  };

  const onSubmitPaypal = (data: z.infer<typeof paypalSchema>) => {
    addAccountMutation.mutate(data);
  };

  // Format date to display in a user-friendly way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{t("payments.pending")}</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t("payments.completed")}</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{t("payments.failed")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-cairo font-bold mb-6">
        {t("payments.title")}
      </h1>

      <Tabs defaultValue="methods" className="w-full" dir={isRTL ? "rtl" : "ltr"}>
        <TabsList>
          <TabsTrigger value="methods">{t("payments.paymentMethods")}</TabsTrigger>
          <TabsTrigger value="transactions">{t("payments.transactions")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="methods" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t("payments.savedMethods")}</h2>
            <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={16} className={cn("", isRTL ? "ml-2" : "mr-2")} />
                  {t("payments.addNew")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] dark:bg-gray-900 dark:text-white" dir={isRTL ? "rtl" : "ltr"}>
                <DialogHeader>
                  <DialogTitle className="text-center">{t("payments.addPaymentMethod")}</DialogTitle>
                  <DialogDescription className="text-center dark:text-gray-300 pt-2">
                    {t("payments.addPaymentMethodDesc")}
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="bank_account" className="w-full mt-4" onValueChange={(value) => setPaymentType(value as "bank_account" | "paypal")} dir={isRTL ? "rtl" : "ltr"}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bank_account">
                      <BanknoteIcon size={16} className={cn("", isRTL ? "ml-2" : "mr-2")} />
                      {t("payments.bankAccount")}
                    </TabsTrigger>
                    <TabsTrigger value="paypal">
                      <CreditCard size={16} className={cn("", isRTL ? "ml-2" : "mr-2")} />
                      PayPal
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="bank_account" className="space-y-4 mt-4">
                    <Form {...bankForm}>
                      <form onSubmit={bankForm.handleSubmit(onSubmitBankAccount)} className="space-y-4">
                        <FormField
                          control={bankForm.control}
                          name="bankName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("payments.bankName")}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={bankForm.control}
                          name="accountName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("payments.accountName")}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={bankForm.control}
                          name="accountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("payments.accountNumber")}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={bankForm.control}
                            name="swiftCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("payments.swiftCode")}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={bankForm.control}
                            name="routingNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("payments.routingNumber")}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={bankForm.control}
                          name="isDefault"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rtl:space-x-reverse">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t("payments.makeDefault")}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button type="submit" disabled={addAccountMutation.isPending}>
                            {addAccountMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                {t("common.saving")}
                              </>
                            ) : t("common.save")}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="paypal" className="space-y-4 mt-4">
                    <Form {...paypalForm}>
                      <form onSubmit={paypalForm.handleSubmit(onSubmitPaypal)} className="space-y-4">
                        <FormField
                          control={paypalForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("payments.paypalEmail")}</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={paypalForm.control}
                          name="isDefault"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rtl:space-x-reverse">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t("payments.makeDefault")}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button type="submit" disabled={addAccountMutation.isPending}>
                            {addAccountMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                {t("common.saving")}
                              </>
                            ) : t("common.save")}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoadingAccounts ? (
              <p className="col-span-2 text-center py-10">{t("common.loading")}</p>
            ) : payoutAccounts.length === 0 ? (
              <div className="col-span-2 bg-neutral-50 dark:bg-gray-800 rounded-lg border border-neutral-200 p-6 text-center">
                <p className="text-neutral-500 mb-4 dark:text-gray-200">{t("payments.noMethods")}</p>
                <Button variant="outline" onClick={() => setIsAddPaymentOpen(true)}>
                  <Plus size={16} className={cn("", isRTL ? "ml-2" : "mr-2")} />
                  {t("payments.addPaymentMethod")}
                </Button>
              </div>
            ) : (
              payoutAccounts.map((account) => (
                <Card key={account.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={cn("bg-primary/10 p-3 rounded-full", isRTL ? "ml-3" : "mr-3")}>
                          {account.type === "bank_account" ? (
                            <BanknoteIcon className="h-5 w-5 text-primary" />
                          ) : (
                            <CreditCard className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{account.name}</h3>
                          {account.isDefault && (
                            <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">
                              {t("payments.default")}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteAccount(account.id)}
                          disabled={deleteAccountMutation.isPending}
                        >
                          {t("common.delete")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t("payments.transactionHistory")}</CardTitle>
                <Button variant="outline">
                  <Download size={16} className={cn("", isRTL ? "ml-2" : "mr-2")} />
                  {t("payments.exportCSV")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="text-center py-10">{t("common.loading")}</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-10 border rounded-md">
                  <DollarSign className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500">{t("payments.noTransactions")}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 bg-neutral-50 p-4 text-sm font-medium text-neutral-500">
                    <div>{t("payments.project")}</div>
                    <div>{user.role === "client" ? t("payments.freelancer") : t("payments.client")}</div>
                    <div>{t("payments.date")}</div>
                    <div className={isRTL ? "text-right" : "text-left"}>{t("payments.amount")}</div>
                    <div className={isRTL ? "text-right" : "text-left"}>{t("payments.status")}</div>
                  </div>
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="grid grid-cols-5 p-4 text-sm border-t">
                      <div className="font-medium">{transaction.projectTitle}</div>
                      <div>{transaction.partyName}</div>
                      <div dir="auto">{formatDate(transaction.date)}</div>
                      <div className={isRTL ? "text-right" : "text-left"}>${transaction.amount}</div>
                      <div className={isRTL ? "text-right" : "text-left"}>{getStatusBadge(transaction.status)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("payments.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("payments.confirmDeleteMethod")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAccountMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("common.deleting")}
                </>
              ) : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}