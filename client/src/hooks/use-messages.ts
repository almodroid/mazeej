import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface User {
  id: number;
  username: string;
  fullName: string | null;
  profileImage: string | null;
}

interface Message {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  receiverId: number;
  isRead: boolean;
  isFlagged: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'video';
}

interface Conversation {
  id: number;
  otherUser: User;
  lastMessage: {
    id: number;
    content: string;
    createdAt: string;
    isRead: boolean;
    mediaUrl?: string;
    mediaType?: 'image' | 'document' | 'video';
  } | null;
  unreadCount: number;
}

export function useMessages() {
  const queryClient = useQueryClient();
  const [zoomCallActive, setZoomCallActive] = useState(false);
  const [currentCallPartnerId, setCurrentCallPartnerId] = useState<number | null>(null);

  // Fetch all conversations
  const { data: conversations = [], isLoading, refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/messages/conversations");
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return response.json();
    },
  });

  // Calculate total unread messages
  const unreadCount = conversations.reduce((count, conversation) => count + conversation.unreadCount, 0);

  // Fetch messages for a specific conversation
  const getMessages = async (conversationId: number) => {
    const response = await apiRequest("GET", `/api/messages/conversations/${conversationId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }
    return response.json();
  };

  // Mark conversation as read
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await apiRequest("POST", `/api/messages/conversations/${conversationId}/read`);
      if (!response.ok) {
        throw new Error("Failed to mark as read");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Send a text message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: number; content: string }) => {
      const response = await apiRequest("POST", "/api/messages/send", { receiverId, content });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Upload and send media
  const sendMediaMutation = useMutation({
    mutationFn: async ({ 
      receiverId, 
      file, 
      caption 
    }: { 
      receiverId: number; 
      file: File; 
      caption?: string 
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('receiverId', receiverId.toString());
      if (caption) formData.append('caption', caption);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/media`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to upload media");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Start a Zoom call
  const startZoomCallMutation = useMutation({
    mutationFn: async (receiverId: number) => {
      const response = await apiRequest("POST", "/api/zoom/start", { receiverId });
      if (!response.ok) {
        throw new Error("Failed to start Zoom call");
      }
      setZoomCallActive(true);
      setCurrentCallPartnerId(receiverId);
      return response.json();
    }
  });

  // End a Zoom call
  const endZoomCall = () => {
    setZoomCallActive(false);
    setCurrentCallPartnerId(null);
  };

  return {
    conversations,
    unreadCount,
    isLoading,
    markAsReadMutation,
    sendMessageMutation,
    sendMediaMutation,
    refetchConversations,
    getMessages,
    zoomCallActive,
    currentCallPartnerId,
    startZoomCallMutation,
    endZoomCall
  };
} 