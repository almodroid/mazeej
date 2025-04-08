import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageCircle, X, Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

type ChatWidgetProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function ChatWidget({ isOpen, setIsOpen }: ChatWidgetProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { messages, sendMessage, isConnected, isConnecting, selectedUser, selectUser } = useChat();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch users for contacts
  const { data: users = [] } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/users"],
    enabled: isOpen,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedUser) {
      sendMessage(selectedUser.id, newMessage);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter out current user from contacts
  const contacts = users.filter(u => u.id !== user?.id);

  return (
    <>
      {/* Chat button */}
      <Button
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageCircle size={24} />
      </Button>

      {/* Chat widget */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-80 md:w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-white p-3 flex justify-between items-center">
            <h3 className="font-medium">
              {selectedUser ? selectedUser.fullName || selectedUser.username : t("chat.title")}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Chat area */}
          {!selectedUser ? (
            <div className="flex-grow overflow-y-auto p-4">
              <h4 className="font-medium mb-2">{t("chat.contacts")}</h4>
              {contacts.length > 0 ? (
                <ul className="space-y-2">
                  {contacts.map((contact) => (
                    <li key={contact.id}>
                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-start p-2 hover:bg-neutral-100"
                        onClick={() => selectUser(contact)}
                      >
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src={contact.profileImage} />
                          <AvatarFallback>
                            {(contact.fullName || contact.username).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{contact.fullName || contact.username}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-neutral-500">{t("chat.noContacts")}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex-grow overflow-y-auto p-4">
                {isConnecting ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          msg.senderId === user?.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.senderId === user?.id
                              ? "bg-primary text-white rounded-br-none"
                              : "bg-neutral-100 text-neutral-800 rounded-bl-none"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <span className="text-xs opacity-70 block mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString(
                              i18n.language === "ar" ? "ar-EG" : "en-US",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-neutral-500">{t("chat.noMessages")}</p>
                    <p className="text-neutral-400 text-sm mt-2">
                      {t("chat.startConversation")}
                    </p>
                  </div>
                )}
              </div>
              <div className="border-t p-3">
                <div className="flex">
                  <Input
                    placeholder={t("chat.typeMessage")}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-grow"
                    disabled={!isConnected}
                  />
                  <Button
                    className="ml-2"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
