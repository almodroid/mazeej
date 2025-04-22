import { Bell, Check, Trash2, MessageCircle, FileCheck, FileX } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export function NotificationsDropdown() {
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    markAsReadMutation,
    deleteNotificationMutation
  } = useNotifications();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, navigate] = useLocation();

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: number) => {
    deleteNotificationMutation.mutate(id);
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read first
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Handle different notification types
    switch (notification.type) {
      case 'project':
        // Navigate to project page
        navigate(`/projects/${notification.relatedId}`);
        break;
      case 'proposal':
        // Navigate to project with proposal
        navigate(`/projects/${notification.relatedId}`);
        break;
      case 'message':
        // Navigate to messages with user
        navigate(`/messages?userId=${notification.relatedId}`);
        break;
      case 'review':
        // Navigate to reviews
        navigate(`/users/${notification.relatedId}`);
        break;
      default:
        break;
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-4 w-4 mr-2 text-blue-500" />;
      case 'proposal':
        return <FileCheck className="h-4 w-4 mr-2 text-green-500" />;
      case 'project':
        return <FileX className="h-4 w-4 mr-2 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <DropdownMenu dir={isRTL ? "rtl" : "ltr"}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full" title={t("notification.title")}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>{t("notification.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-4 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {t("notification.empty")}
          </div>
        ) : (
          <DropdownMenuGroup className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className="flex flex-col items-start p-3 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-between w-full">
                  <div className="font-medium flex items-center">
                    {getNotificationIcon(notification.type)}
                    {notification.title}
                  </div>
                  <div className="flex gap-1">
                    {!notification.isRead && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {notification.content}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {notification.createdAt
                    ? format(new Date(notification.createdAt), "PPp")
                    : ""}
                </div>
                {!notification.isRead && (
                  <Badge variant="outline" className="mt-2">
                    {t("notification.unread")}
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}