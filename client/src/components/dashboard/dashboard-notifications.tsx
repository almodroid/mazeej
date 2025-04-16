import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { MessageSquare, Bell, ShieldCheck, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface Notification {
  id: number;
  userId: number;
  type: 'message' | 'proposal' | 'project' | 'payment' | 'verification';
  title: string;
  content: string;
  isRead: boolean;
  relatedId: number;
  createdAt: string;
}

export default function DashboardNotifications() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? ar : enUS;

  // Fetch user notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications", { limit: 5 }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/notifications?limit=5");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    },
  });

  // Format date relative to now
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale
      });
    } catch (error) {
      return dateString;
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'proposal':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'project':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'verification':
        return <ShieldCheck className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-neutral-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("dashboard.notifications")}</CardTitle>
        <Link href="/notifications">
          <Button variant="ghost" size="sm">
            {t("common.viewAll")}
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <p>{t("dashboard.noNotifications")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                <div className="mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.content}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 