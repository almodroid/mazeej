import { MessageSquare, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
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
import { useMessages } from "@/hooks/use-messages";
import { useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";

export function MessagesDropdown() {
  const { 
    conversations,
    unreadCount,
    isLoading,
    markAsReadMutation,
    refetchConversations
  } = useMessages();
  const [, navigate] = useLocation();
  const { socket } = useSocket();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    const handleNewMessage = () => {
      refetchConversations();
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageRead', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageRead', handleNewMessage);
    };
  }, [socket, refetchConversations]);

  const handleMarkAsRead = (conversationId: number) => {
    markAsReadMutation.mutate(conversationId);
  };

  const handleConversationClick = (conversationId: number) => {
    // Mark as read first
    handleMarkAsRead(conversationId);
    // Navigate to messages with conversation
    navigate(`/messages?conversationId=${conversationId}`);
  };

  return (
    <DropdownMenu dir={isRTL ? "rtl" : "ltr"}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full" title={t("messages.title")}>
          <MessageSquare className="h-5 w-5" />
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
        <DropdownMenuLabel>{t("messages.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-4 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {t("messages.empty")}
          </div>
        ) : (
          <DropdownMenuGroup className="max-h-80 overflow-y-auto">
            {conversations.map((conversation) => (
              <DropdownMenuItem 
                key={conversation.id} 
                className="flex flex-col items-start p-3 cursor-pointer"
                onClick={() => handleConversationClick(conversation.id)}
              >
                <div className="flex justify-between w-full">
                  <div className="font-medium">
                    {conversation.otherUser 
                      ? (conversation.otherUser.fullName || conversation.otherUser.username) 
                      : conversation.participant 
                        ? (conversation.participant.fullName || conversation.participant.username)
                        : conversation.participantName 
                          ? conversation.participantName
                          : t('messages.unknownUser', 'Unknown User')}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <Badge variant="secondary">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {conversation.lastMessage?.content}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {conversation.lastMessage?.createdAt
                    ? format(new Date(conversation.lastMessage.createdAt), "PPp")
                    : ""}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate("/messages")}
        >
          {t("messages.viewAll")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 