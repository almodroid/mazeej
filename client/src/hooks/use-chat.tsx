import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage extends Omit<Message, "id"> {
  id?: number;
  status?: "sending" | "sent" | "delivered" | "read" | "error";
}

type Contact = {
  id: number;
  username: string;
  fullName?: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    timestamp: Date;
  };
};

type ChatContextType = {
  messages: ChatMessage[];
  contacts: Contact[];
  activeContact: Contact | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  setActiveContact: (contact: Contact | null) => void;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: (messageIds: number[]) => Promise<void>;
  startCall: (contactId: number, callType: "audio" | "video") => Promise<void>;
  endCall: () => void;
  isInCall: boolean;
  callType: "audio" | "video" | null;
  callStatus: "connecting" | "connected" | "disconnected" | null;
  incomingCall: {
    from: Contact | null;
    type: "audio" | "video" | null;
  };
  acceptCall: () => void;
  rejectCall: () => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);
  const [callStatus, setCallStatus] = useState<"connecting" | "connected" | "disconnected" | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    from: Contact | null;
    type: "audio" | "video" | null;
  }>({ from: null, type: null });

  // Connect to WebSocket
  useEffect(() => {
    if (!user) return;

    setIsConnecting(true);
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      
      // Authenticate user
      newSocket.send(JSON.stringify({
        type: "auth",
        userId: user.id
      }));
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "auth_success") {
        // Load contacts after authentication
        loadContacts();
      }
      
      if (data.type === "message") {
        // Handle incoming message
        const newMessage: ChatMessage = {
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          createdAt: new Date(data.timestamp),
          isRead: false
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Update unread count for the sender if it's not the active contact
        if (activeContact?.id !== data.senderId) {
          setContacts(prev => prev.map(contact => {
            if (contact.id === data.senderId) {
              return {
                ...contact,
                unreadCount: (contact.unreadCount || 0) + 1,
                lastMessage: {
                  content: data.content,
                  timestamp: new Date(data.timestamp)
                }
              };
            }
            return contact;
          }));
        } else {
          // Mark as read immediately if from active contact
          markAsRead([data.id]);
        }
      }
      
      if (data.type === "message_history") {
        setMessages(data.messages.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.timestamp)
        })));
      }
      
      // Handle call events
      if (data.type === "call_request") {
        const caller = contacts.find(c => c.id === data.from);
        if (caller) {
          setIncomingCall({
            from: caller,
            type: data.callType
          });
        }
      }
      
      if (data.type === "call_accepted") {
        setCallStatus("connected");
      }
      
      if (data.type === "call_rejected" || data.type === "call_ended") {
        endCall();
      }
    };

    newSocket.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    newSocket.onerror = (error) => {
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError("Failed to connect to chat server");
      console.error("WebSocket error:", error);
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  // Load contacts
  const loadContacts = async () => {
    try {
      const response = await fetch("/api/contacts");
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error("Failed to load contacts:", error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    }
  };

  // Load messages for active contact
  useEffect(() => {
    if (!socket || !isConnected || !activeContact) return;
    
    // Request message history
    socket.send(JSON.stringify({
      type: "get_messages",
      otherUserId: activeContact.id
    }));
    
    // Mark messages as read
    if (activeContact.unreadCount && activeContact.unreadCount > 0) {
      // Get the message IDs to mark as read
      const messagesToMark = messages.filter(
        msg => msg.senderId === activeContact.id && !msg.isRead
      ).map(msg => msg.id).filter(Boolean) as number[];
      
      if (messagesToMark.length > 0) {
        markAsRead(messagesToMark);
      }
      
      // Update contacts locally
      setContacts(prev => prev.map(contact => {
        if (contact.id === activeContact.id) {
          return { ...contact, unreadCount: 0 };
        }
        return contact;
      }));
    }
  }, [activeContact, isConnected]);

  // Send a message
  const sendMessage = async (content: string): Promise<void> => {
    if (!socket || !isConnected || !activeContact) return;
    
    // Create a temporary message with "sending" status
    const tempMessage: ChatMessage = {
      senderId: user?.id || 0,
      receiverId: activeContact.id,
      content,
      createdAt: new Date(),
      isRead: false,
      status: "sending"
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      // Send the message through WebSocket
      socket.send(JSON.stringify({
        type: "message",
        receiverId: activeContact.id,
        content
      }));
      
      // The actual saved message will be returned by the server and added in the onmessage handler
    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Update the message status to error
      setMessages(prev => prev.map(msg => {
        if (msg === tempMessage) {
          return { ...msg, status: "error" };
        }
        return msg;
      }));
      
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Mark messages as read
  const markAsRead = async (messageIds: number[]): Promise<void> => {
    if (!socket || !isConnected || messageIds.length === 0) return;
    
    try {
      socket.send(JSON.stringify({
        type: "mark_as_read",
        messageIds
      }));
      
      // Update messages locally
      setMessages(prev => prev.map(msg => {
        if (msg.id && messageIds.includes(msg.id)) {
          return { ...msg, isRead: true };
        }
        return msg;
      }));
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  // Start a call
  const startCall = async (contactId: number, callType: "audio" | "video"): Promise<void> => {
    if (!socket || !isConnected) return;
    
    setIsInCall(true);
    setCallType(callType);
    setCallStatus("connecting");
    
    try {
      socket.send(JSON.stringify({
        type: "call_request",
        to: contactId,
        callType
      }));
    } catch (error) {
      console.error("Failed to start call:", error);
      endCall();
      toast({
        title: "Error",
        description: "Failed to start call",
        variant: "destructive",
      });
    }
  };

  // End a call
  const endCall = () => {
    if (socket && isConnected && callStatus === "connected" && incomingCall.from) {
      socket.send(JSON.stringify({
        type: "call_end",
        to: incomingCall.from.id
      }));
    }
    
    setIsInCall(false);
    setCallType(null);
    setCallStatus(null);
    setIncomingCall({ from: null, type: null });
  };

  // Accept an incoming call
  const acceptCall = () => {
    if (!socket || !isConnected || !incomingCall.from) return;
    
    setIsInCall(true);
    setCallType(incomingCall.type);
    setCallStatus("connected");
    
    socket.send(JSON.stringify({
      type: "call_accept",
      to: incomingCall.from.id
    }));
  };

  // Reject an incoming call
  const rejectCall = () => {
    if (!socket || !isConnected || !incomingCall.from) return;
    
    socket.send(JSON.stringify({
      type: "call_reject",
      to: incomingCall.from.id
    }));
    
    setIncomingCall({ from: null, type: null });
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        contacts,
        activeContact,
        isConnected,
        isConnecting,
        connectionError,
        setActiveContact,
        sendMessage,
        markAsRead,
        startCall,
        endCall,
        isInCall,
        callType,
        callStatus,
        incomingCall,
        acceptCall,
        rejectCall
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}