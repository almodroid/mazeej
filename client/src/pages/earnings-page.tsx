import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import ChatWidget from "@/components/chat/chat-widget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Proposal } from "@shared/schema";
import { Download, DollarSign, TrendingUp, Calendar } from "lucide-react";

interface EarningPeriod {
  id: string;
  amount: number;
  date: string;
  status: "pending" | "paid";
  projectTitle: string;
  clientName: string;
}

export default function EarningsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Fetch freelancer proposals for earnings calculation
  const { data: proposals = [] } = useQuery<Proposal[]>({
    queryKey: ["/api/proposals/freelancer"],
    enabled: !!user && user.role === "freelancer",
  });

  // Mock earnings periods data (would come from API in real implementation)
  const earningPeriods: EarningPeriod[] = [
    {
      id: "1",
      amount: 750,
      date: "2023-06-15",
      status: "paid",
      projectTitle: "E-commerce Website Development",
      clientName: "Ahmed Corporation"
    },
    {
      id: "2",
      amount: 500,
      date: "2023-06-01",
      status: "paid",
      projectTitle: "Mobile App UI Design",
      clientName: "Sara Designs"
    },
    {
      id: "3",
      amount: 1200,
      date: "2023-05-15",
      status: "paid",
      projectTitle: "CRM System Integration",
      clientName: "Global Solutions"
    },
    {
      id: "4",
      amount: 350,
      date: "2023-07-01",
      status: "pending",
      projectTitle: "Content Writing for Blog",
      clientName: "Media Group"
    },
  ];

  // Calculate total earnings
  const totalEarnings = earningPeriods.reduce((sum, period) => sum + period.amount, 0);
  const pendingEarnings = earningPeriods
    .filter(period => period.status === "pending")
    .reduce((sum, period) => sum + period.amount, 0);

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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user || user.role !== "freelancer") {
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
              {t("earnings.title")}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">{t("earnings.totalEarnings")}</p>
                      <h3 className="text-2xl font-bold mt-1">${totalEarnings}</h3>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-full">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">{t("earnings.pendingPayments")}</p>
                      <h3 className="text-2xl font-bold mt-1">${pendingEarnings}</h3>
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
                      <h3 className="text-2xl font-bold mt-1">$1,250</h3>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t("earnings.earningsHistory")}</CardTitle>
                <CardDescription>{t("earnings.earningsHistoryDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 bg-neutral-50 p-4 text-sm font-medium text-neutral-500">
                    <div>{t("earnings.project")}</div>
                    <div>{t("earnings.client")}</div>
                    <div>{t("earnings.date")}</div>
                    <div>{t("earnings.amount")}</div>
                    <div>{t("earnings.status")}</div>
                  </div>
                  {earningPeriods.map((period) => (
                    <div key={period.id} className="grid grid-cols-5 p-4 text-sm border-t">
                      <div className="font-medium">{period.projectTitle}</div>
                      <div>{period.clientName}</div>
                      <div>{formatDate(period.date)}</div>
                      <div>${period.amount}</div>
                      <div>{getStatusBadge(period.status)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button variant="outline" className="mr-2">
                <Download size={16} className="mr-2" />
                {t("earnings.downloadCSV")}
              </Button>
              <Button>
                {t("earnings.withdrawFunds")}
              </Button>
            </div>
          </div>
        </main>
      </div>
      <Footer />
      <ChatWidget isOpen={chatOpen} setIsOpen={setChatOpen} />
    </div>
  );
}