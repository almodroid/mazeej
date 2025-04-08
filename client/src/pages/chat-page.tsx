import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import i18next from "i18next";

import {
  Search,
  Send,
  Phone,
  Video,
  Paperclip,
  MoreVertical,
  Loader2,
  CheckCheck,
  Check,
  AlertCircle,
  ArrowLeftCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Import Zoom VideoCallDialog component
import VideoCallDialog from "@/components/video-call/video-call-dialog";

// Incoming call dialog
const IncomingCallDialog = ({
  open,
  caller,
  callType,
  onAccept,
  onReject,
}: {
  open: boolean;
  caller: any;
  callType: "audio" | "video" | null;
  onAccept: () => void;
  onReject: () => void;
}) => {
  const { t } = useTranslation();

  if (!open || !caller) return null;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("chat.incomingCall")}
          </DialogTitle>
          <DialogDescription>
            {callType === "video" ? t("chat.videoCall") : t("chat.audioCall")} {t("chat.from")} {caller.fullName || caller.username}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-6">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={caller.avatar} alt={caller.username} />
            <AvatarFallback>
              {caller.username?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <DialogFooter className="flex flex-row justify-center gap-4 sm:justify-center">
          <Button variant="destructive" onClick={onReject} className="flex-1">
            {t("chat.rejectCall")}
          </Button>
          <Button variant="default" onClick={onAccept} className="flex-1">
            {t("chat.acceptCall")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ChatMessageStatus = ({ status }: { status?: string }) => {
  if (!status || status === "sent") {
    return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  if (status === "delivered") {
    return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  if (status === "read") {
    return <CheckCheck className="h-3.5 w-3.5 text-primary" />;
  }
  if (status === "sending") {
    return <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />;
  }
  if (status === "error") {
    return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
  }
  return null;
};

// Determines if a message is from the same sender as the previous one
// for UI grouping purposes
const isSameSender = (messages: any[], index: number) => {
  if (index === 0) return false;
  return messages[index].senderId === messages[index - 1].senderId;
};

export default function ChatPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    contacts,
    messages,
    activeContact,
    setActiveContact,
    isConnected,
    isConnecting,
    sendMessage,
    startCall,
    endCall,
    isInCall,
    callType,
    incomingCall,
    acceptCall,
    rejectCall,
  } = useChat();
  
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCallDialog, setShowCallDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const locale = i18next.language === "ar" ? ar : enUS;

  const filteredContacts = contacts.filter(
    contact => 
      contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.fullName && contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show call dialog when a call is initiated
  useEffect(() => {
    if (isInCall) {
      setShowCallDialog(true);
    } else {
      setShowCallDialog(false);
    }
  }, [isInCall]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeContact) return;
    
    sendMessage(messageText.trim());
    setMessageText("");
  };

  const handleStartCall = (type: "audio" | "video") => {
    if (!activeContact) return;
    startCall(activeContact.id, type);
  };

  const handleAcceptCall = () => {
    acceptCall();
    setShowCallDialog(true);
  };

  const handleEndCall = () => {
    endCall();
    setShowCallDialog(false);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="md:hidden"
          >
            <a href="/">
              <ArrowLeftCircle className="h-5 w-5" />
            </a>
          </Button>
          <h1 className="text-xl font-bold">{t("chat.title")}</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Contacts sidebar */}
        <div className="w-80 border-r overflow-hidden hidden md:flex md:flex-col">
          <div className="p-4">
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
            <div className="p-4 text-center text-sm text-muted-foreground flex-1 flex items-center justify-center">
              {isConnecting ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>{t("chat.connecting")}</span>
                </div>
              ) : (
                <span>{t("chat.offline")}</span>
              )}
            </div>
          )}
          
          {isConnected && filteredContacts.length === 0 && (
            <div className="p-4 text-center text-muted-foreground flex-1 flex items-center justify-center">
              {searchQuery ? `${t("chat.noContacts")} "${searchQuery}"` : t("chat.noContacts")}
            </div>
          )}
          
          {isConnected && filteredContacts.length > 0 && (
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => setActiveContact(contact)}
                    className={cn(
                      "w-full flex items-center p-3 rounded-md hover:bg-accent text-left",
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
                    <div className="ml-3 rtl:ml-0 rtl:mr-3 flex-1 flex flex-col items-start overflow-hidden">
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
                          <div className="ml-2 rtl:ml-0 rtl:mr-2 h-5 min-w-5 px-1.5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                            {contact.unreadCount}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!activeContact ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              {t("chat.startConversation")}
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3 rtl:mr-0 rtl:ml-3">
                    <AvatarImage src={activeContact.avatar} alt={activeContact.username} />
                    <AvatarFallback>
                      {activeContact.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {activeContact.fullName || activeContact.username}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {activeContact.isOnline ? t("chat.online") : t("chat.offline")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartCall("audio")}
                    title={t("chat.startAudioCall")}
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartCall("video")}
                    title={t("chat.startVideoCall")}
                  >
                    <Video className="h-5 w-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        {t("common.view")} {t("profile.title")}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        {t("chat.searchContacts")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    {t("chat.noMessages")}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const isMe = message.senderId === user.id;
                      const sameSenderAsPrevious = isSameSender(messages, index);
                      return (
                        <div
                          key={message.id || index}
                          className={cn(
                            "flex",
                            isMe ? "justify-end" : "justify-start",
                            sameSenderAsPrevious ? "mt-1" : "mt-4"
                          )}
                        >
                          {!isMe && !sameSenderAsPrevious && (
                            <Avatar className="h-8 w-8 mr-2 rtl:mr-0 rtl:ml-2">
                              <AvatarImage src={activeContact.avatar} alt={activeContact.username} />
                              <AvatarFallback>
                                {activeContact.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!isMe && sameSenderAsPrevious && <div className="w-8 mr-2 rtl:mr-0 rtl:ml-2" />}
                          <div className={cn(
                            "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                            isMe ? "bg-primary text-primary-foreground" : "bg-muted",
                            !sameSenderAsPrevious && (isMe ? "rounded-tr-none" : "rounded-tl-none")
                          )}>
                            {message.content}
                            <div className={cn(
                              "text-xs mt-1 flex items-center justify-end gap-1",
                              isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {message.createdAt ? format(new Date(message.createdAt), "p", { locale }) : ''}
                              {isMe && <ChatMessageStatus status={message.status} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message input */}
              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    title={t("chat.uploadFile")}
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input
                    placeholder={t("chat.typeMessage")}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9"
                    disabled={!messageText.trim()}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Video call dialog */}
      <VideoCallDialog
        open={showCallDialog}
        onClose={handleEndCall}
        callType={callType}
        contact={activeContact}
      />

      {/* Incoming call dialog */}
      <IncomingCallDialog
        open={Boolean(incomingCall.from)}
        caller={incomingCall.from}
        callType={incomingCall.type}
        onAccept={handleAcceptCall}
        onReject={rejectCall}
      />
    </div>
  );
}