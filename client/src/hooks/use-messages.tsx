import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Conversation {
  id: number;
  otherUser: {
    id: number;
    username: string;
    fullName: string | null;
    profileImage: string | null;
  };
  lastMessage: {
    id: number;
    content: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
}

export function useMessages() {
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading, refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await apiRequest.get("/messages/conversations");
      return response.data;
    },
  });

  const unreadCount = conversations.reduce((count, conversation) => count + conversation.unreadCount, 0);

  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      await apiRequest.post(`/messages/conversations/${conversationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    conversations,
    unreadCount,
    isLoading,
    markAsReadMutation,
    refetchConversations,
  };
} 