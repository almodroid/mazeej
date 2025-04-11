import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import ChatWidget from "@/components/chat/chat-widget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Download, DollarSign } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
  projectTitle: string;
  freelancerName: string;
}

interface PaymentMethod {
  id: string;
  type: "credit_card" | "paypal";
  last4?: string;
  expiryDate?: string;
  isDefault: boolean;
  name: string;
}

export default function PaymentsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Mock payment methods data (would come from API in real implementation)
  const paymentMethods: PaymentMethod[] = [
    {
      id: "1",
      type: "credit_card",
      last4: "4242",
      expiryDate: "12/25",
      isDefault: true,
      name: "Visa ending in 4242"
    },
    {
      id: "2",
      type: "paypal",
      isDefault: false,
      name: "PayPal - user@example.com"
    }
  ];

  // Mock transactions data (would come from API in real implementation)
  const transactions: Transaction[] = [
    {
      id: "1",
      amount: 750,
      date: "2023-06-15",
      status: "completed",
      projectTitle: "E-commerce Website Development",
      freelancerName: "Mohammed Ali"
    },
    {
      id: "2",
      amount: 500,
      date: "2023-06-01",
      status: "completed",
      projectTitle: "Mobile App UI Design",
      freelancerName: "Fatima Hassan"
    },
    {
      id: "3",
      amount: 1200,
      date: "2023-05-15",
      status: "completed",
      projectTitle: "CRM System Integration",
      freelancerName: "Khalid Ibrahim"
    },
    {
      id: "4",
      amount: 350,
      date: "2023-07-01",
      status: "pending",
      projectTitle: "Content Writing for Blog",
      freelancerName: "Sara Ahmed"
    },
  ];

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

  if (!user || user.role !== "client") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex">
        <DashboardSidebar />
        <main className="flex-grow p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-cairo font-bold mb-6">
              {t("payments.title")}
            </h1>

            <Tabs defaultValue="methods" className="w-full">
              <TabsList>
                <TabsTrigger value="methods">{t("payments.paymentMethods")}</TabsTrigger>
                <TabsTrigger value="transactions">{t("payments.transactions")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="methods" className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{t("payments.savedMethods")}</h2>
                  <Button>
                    <Plus size={16} className="mr-2" />
                    {t("payments.addNew")}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <Card key={method.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="bg-primary/10 p-3 rounded-full mr-3">
                              <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{method.name}</h3>
                              {method.isDefault && (
                                <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">
                                  {t("payments.default")}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <Button variant="outline" size="sm">
                              {t("common.edit")}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="transactions" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{t("payments.transactionHistory")}</CardTitle>
                      <Button variant="outline">
                        <Download size={16} className="mr-2" />
                        {t("payments.exportCSV")}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <div className="grid grid-cols-5 bg-neutral-50 p-4 text-sm font-medium text-neutral-500">
                        <div>{t("payments.project")}</div>
                        <div>{t("payments.freelancer")}</div>
                        <div>{t("payments.date")}</div>
                        <div>{t("payments.amount")}</div>
                        <div>{t("payments.status")}</div>
                      </div>
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="grid grid-cols-5 p-4 text-sm border-t">
                          <div className="font-medium">{transaction.projectTitle}</div>
                          <div>{transaction.freelancerName}</div>
                          <div>{formatDate(transaction.date)}</div>
                          <div>${transaction.amount}</div>
                          <div>{getStatusBadge(transaction.status)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <Footer />
      <ChatWidget isOpen={chatOpen} setIsOpen={setChatOpen} />
    </div>
  );
}