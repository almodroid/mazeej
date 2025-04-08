import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";

interface ChatMessage {
  type?: string;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: Date;
  isRead?: boolean;
}

// Custom hook for WebSocket chat functionality
export function useChat() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<Omit<User, 'password'> | null>(null);

  // Setup WebSocket connection
  useEffect(() => {
    if (!user) return;

    setIsConnecting(true);
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log("WebSocket connected");
      // Authenticate with the server
      newSocket.send(JSON.stringify({
        type: "auth",
        userId: user.id,
      }));
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "auth_success") {
        setIsConnected(true);
        setIsConnecting(false);
      } else if (data.type === "message") {
        setMessages((prevMessages) => [...prevMessages, data]);
      } else if (data.type === "message_history") {
        setMessages(data.messages);
      }
    };

    newSocket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setIsConnecting(false);
    };

    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnecting(false);
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  // Select a user to chat with and load message history
  const selectUser = useCallback((chatUser: Omit<User, 'password'>) => {
    setSelectedUser(chatUser);
    if (socket && isConnected && user) {
      socket.send(JSON.stringify({
        type: "get_messages",
        otherUserId: chatUser.id,
      }));
    }
  }, [socket, isConnected, user]);

  // Send a message
  const sendMessage = useCallback((receiverId: number, content: string) => {
    if (socket && isConnected && user) {
      const message = {
        type: "message",
        receiverId,
        content,
      };
      socket.send(JSON.stringify(message));
    }
  }, [socket, isConnected, user]);

  return {
    isConnected,
    isConnecting,
    messages,
    sendMessage,
    selectedUser,
    selectUser,
  };
}
