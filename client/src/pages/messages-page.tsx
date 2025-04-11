import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import ChatWidget from "@/components/chat/chat-widget";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export default function MessagesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for conversations
  const conversations = [
    {
      id: "1",
      participantName: "Ahmed Ali",
      participantAvatar: "",
      lastMessage: "Thanks for your proposal. I'd like to discuss further.",
      timestamp: new Date(2023, 5, 15, 14, 30),
      unreadCount: 2,
    },
    {
      id: "2",
      participantName: "Sara Mohammed",
      participantAvatar: "",
      lastMessage: "When can you start the project?",
      timestamp: new Date(2023, 5, 14, 9, 45),
      unreadCount: 0,
    },
    {
      id: "3",
      participantName: "Khalid Ibrahim",
      participantAvatar: "",
      lastMessage: "I've reviewed your portfolio and I'm impressed.",
      timestamp: new Date(2023, 5, 12, 16, 20),
      unreadCount: 0,
    },
  ];

  // Mock data for messages in the selected conversation
  const messages: Record<string, Message[]> = {
    "1": [
      {
        id: "m1",
        senderId: "other",
        senderName: "Ahmed Ali",
        content: "Hello, I saw your profile and I'm interested in your services.",
        timestamp: new Date(2023, 5, 15, 14, 0),
        isRead: true,
      },
      {
        id: "m2",
        senderId: (user?.id?.toString() || "self"),
        senderName: user?.fullName || user?.username || "",
        content: "Thank you for reaching out! I'd be happy to discuss your project.",
        timestamp: new Date(2023, 5, 15, 14, 15),
        isRead: true,
      },
      {
        id: "m3",
        senderId: "other",
        senderName: "Ahmed Ali",
        content: "Thanks for your proposal. I'd like to discuss further.",
        timestamp: new Date(2023, 5, 15, 14, 30),
        isRead: false,
      },
    ],
    "2": [
      {
        id: "m4",
        senderId: "other",
        senderName: "Sara Mohammed",
        content: "Hi, I need help with a web development project.",
        timestamp: new Date(2023, 5, 14, 9, 30),
        isRead: true,
      },
      {
        id: "m5",
        senderId: (user?.id?.toString() || "self"),
        senderName: user?.fullName || user?.username || "",
        content: "I'd be glad to help. Could you provide more details?",
        timestamp: new Date(2023, 5, 14, 9, 40),
        isRead: true,
      },
      {
        id: "m6",
        senderId: "other",
        senderName: "Sara Mohammed",
        content: "When can you start the project?",
        timestamp: new Date(2023, 5, 14, 9, 45),
        isRead: true,
      },
    ],
    "3": [
      {
        id: "m7",
        senderId: "other",
        senderName: "Khalid Ibrahim",
        content: "I've reviewed your portfolio and I'm impressed.",
        timestamp: new Date(2023, 5, 12, 16, 20),
        isRead: true,
      },
    ],
  };

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Format date to display in a user-friendly way
  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t("messages.yesterday");
    } else {
      return date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => 
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex">
        <DashboardSidebar />
        <main className="flex-grow flex overflow-hidden">
          <div className="w-full max-w-screen-xl mx-auto flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-neutral-200 flex flex-col">
              <div className="p-4 border-b border-neutral-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" size={18} />
                  <Input 
                    placeholder={t("messages.searchConversations")} 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conv) => (
                    <div 
                      key={conv.id}
                      className={`p-4 border-b border-neutral-200 cursor-pointer hover:bg-neutral-50 ${selectedConversation === conv.id ? 'bg-neutral-100' : ''}`}
                      onClick={() => setSelectedConversation(conv.id)}
                    >
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={conv.participantAvatar} alt={conv.participantName} />
                          <AvatarFallback>{conv.participantName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium truncate">{conv.participantName}</h3>
                            <span className="text-xs text-neutral-500">{formatDate(conv.timestamp)}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-neutral-600 truncate">{conv.lastMessage}</p>
                            {conv.unreadCount > 0 && (
                              <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-neutral-500">
                    {t("messages.noConversationsFound")}
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="w-2/3 flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b border-neutral-200 flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage 
                        src={conversations.find(c => c.id === selectedConversation)?.participantAvatar} 
                        alt={conversations.find(c => c.id === selectedConversation)?.participantName} 
                      />
                      <AvatarFallback>
                        {conversations.find(c => c.id === selectedConversation)?.participantName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-sm font-medium">
                        {conversations.find(c => c.id === selectedConversation)?.participantName}
                      </h2>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages[selectedConversation]?.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.senderId === user.id?.toString() || message.senderId === 'self' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[70%] p-3 rounded-lg ${message.senderId === user.id?.toString() || message.senderId === 'self'
                            ? 'bg-primary text-white rounded-br-none' 
                            : 'bg-neutral-100 text-neutral-800 rounded-bl-none'}`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="text-xs mt-1 text-right">
                            {formatDate(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-neutral-200">
                    <div className="flex">
                      <Input 
                        placeholder={t("messages.typeMessage")} 
                        className="flex-1 mr-2"
                      />
                      <Button>{t("messages.send")}</Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-neutral-500">
                    <p>{t("messages.selectConversation")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
      <ChatWidget isOpen={chatOpen} setIsOpen={setChatOpen} />
    </div>
  );
}