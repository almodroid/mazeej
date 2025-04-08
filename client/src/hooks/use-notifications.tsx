import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Notification as SelectNotification, 
  InsertNotification 
} from "@shared/schema";

type NotificationsContextType = {
  notifications: SelectNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  markAsReadMutation: UseMutationResult<SelectNotification, Error, number>;
  createNotificationMutation: UseMutationResult<SelectNotification, Error, InsertNotification>;
  deleteNotificationMutation: UseMutationResult<void, Error, number>;
};

export const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { 
    data: notifications = [], 
    error, 
    isLoading 
  } = useQuery<SelectNotification[], Error>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest("GET", "/api/notifications");
      return await res.json();
    },
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/notifications/${id}/read`);
      return await res.json();
    },
    onSuccess: (updatedNotification: SelectNotification) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notification marked as read",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark notification as read",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (notification: InsertNotification) => {
      const res = await apiRequest("POST", "/api/notifications", notification);
      return await res.json();
    },
    onSuccess: (newNotification: SelectNotification) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "New notification",
        description: newNotification.title,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create notification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notification deleted",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete notification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        markAsReadMutation,
        createNotificationMutation,
        deleteNotificationMutation,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}