import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Search, Phone, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useOnClickOutside } from "../../hooks/use-on-click-outside";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import i18next from "i18next";

export default function ChatDropdown() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { contacts, activeContact, setActiveContact, isConnected, isConnecting } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const locale = i18next.language === "ar" ? ar : enUS;
  const totalUnreadCount = contacts.reduce((acc, contact) => acc + (contact.unreadCount || 0), 0);
  
  const filteredContacts = contacts.filter(
    contact => 
      contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.fullName && contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  useOnClickOutside(dropdownRef, () => setIsOpen(false));
  
  // Close the dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) {
      setActiveContact(null);
    }
  }, [isOpen, setActiveContact]);
  
  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="icon"
        className="relative" 
        title={t("common.messages")}
      >
        <MessageSquare className="h-5 w-5" />
        {totalUnreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 p-0 text-xs"
          >
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <div 
          className={cn(
            "absolute left-1/2 -translate-x-1/2 z-50 w-80 md:w-96 mt-2 rounded-md border bg-popover text-popover-foreground shadow-md",
            "md:right-0 md:left-auto md:translate-x-0 rtl:md:left-0 rtl:md:right-auto",
            "max-h-[80vh] flex flex-col"
          )}
        >
          <div className="flex items-center justify-between p-4">
            <h3 className="font-medium text-lg">{t("chat.title")}</h3>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-2 px-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-2" />
              <Input
                placeholder={t("chat.searchContacts")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 rtl:pl-4 rtl:pr-8 h-9"
              />
            </div>
          </div>
          
          <Separator />
          
          {!isConnected && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {isConnecting ? t("chat.connecting") : t("chat.offline")}
            </div>
          )}
          
          {isConnected && filteredContacts.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? `${t("chat.noContacts")} "${searchQuery}"` : t("chat.noContacts")}
            </div>
          )}
          
          {isConnected && filteredContacts.length > 0 && (
            <ScrollArea className="max-h-[400px] p-1">
              <div className="p-2">
                <h4 className="text-sm font-medium text-muted-foreground px-2 py-1">
                  {t("chat.recentConversations")}
                </h4>
                {filteredContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setActiveContact(contact);
                      // Here we would typically navigate to the chat page
                      // For the dropdown, we'll just log for now
                      console.log("Open chat with:", contact.username);
                    }}
                    className={cn(
                      "w-full flex items-center p-2 rounded-md hover:bg-accent",
                      activeContact?.id === contact.id && "bg-accent"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatar} alt={contact.username} />
                        <AvatarFallback>
                          {contact.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {contact.isOnline && (
                        <span className="absolute bottom-0 right-0 rtl:right-auto rtl:left-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                    </div>
                    <div className="ml-3 rtl:ml-0 rtl:mr-3 flex-1 flex flex-col items-start overflow-hidden text-left">
                      <div className="flex w-full justify-between items-center">
                        <span className="font-medium truncate">
                          {contact.fullName || contact.username}
                        </span>
                        {contact.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {format(contact.lastMessage.timestamp, "p", { locale })}
                          </span>
                        )}
                      </div>
                      <div className="w-full flex justify-between items-center">
                        {contact.lastMessage ? (
                          <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                            {contact.lastMessage.content}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {t("chat.startConversation")}
                          </span>
                        )}
                        {(contact.unreadCount && contact.unreadCount > 0) ? (
                          <Badge variant="default" className="ml-2 rtl:ml-0 rtl:mr-2 h-5 min-w-5 px-1.5">
                            {contact.unreadCount}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
          
          <div className="p-4 mt-auto">
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => {
                // Navigate to chat page
                window.location.href = "/chat";
              }}
            >
              {t("chat.title")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}