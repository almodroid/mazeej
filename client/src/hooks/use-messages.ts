import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";

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
  // Different ways the conversation partner may be represented
  otherUser?: User;
  participant?: User;
  participantId?: number;
  participantName?: string;
  participantAvatar?: string;
  // Message data
  lastMessage?: {
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
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const { socket } = useSocket();

  // Fetch all conversations
  const { data: conversations = [], isLoading, refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/conversations");
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return response.json();
    },
  });

  // Fetch messages for a specific conversation
  const getMessages = async (conversationId: number) => {
    setActiveConversationId(conversationId);
    const response = await apiRequest("GET", `/api/messages/${conversationId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }
    return response.json();
  };

  // Listen for new messages via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      // Refetch conversations to update unread counts
      refetchConversations();
      
      // If the message is for the active conversation, refresh message list
      if (data?.message && activeConversationId) {
        const msg = data.message;
        if (
          (msg.senderId === activeConversationId) || 
          (msg.receiverId === activeConversationId)
        ) {
          // Invalidate and refetch the active conversation messages
          queryClient.invalidateQueries({ 
            queryKey: [`/api/messages/${activeConversationId}`] 
          });
        }
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageRead', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageRead', handleNewMessage);
    };
  }, [socket, refetchConversations, activeConversationId, queryClient]);

  // Calculate total unread messages
  const unreadCount = conversations.reduce((count, conversation) => count + conversation.unreadCount, 0);

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
      const response = await apiRequest("POST", "/api/messages", { receiverId, content });
      if (!response.ok) {
        // Attempt to read error details if possible, otherwise throw generic error
        let errorDetails = "Failed to send message";
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || errorDetails;
        } catch (e) {
          // Response was not JSON (likely HTML error page)
          errorDetails = `Failed to send message (status: ${response.status})`;
        }
        throw new Error(errorDetails);
      }
      // No need to parse JSON on success if no data is expected/needed
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      // Also invalidate specific message queries if applicable
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

      // Use cookie-based session auth instead of token-based auth
      const response = await fetch(`/api/messages/media`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
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
    activeConversationId,
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