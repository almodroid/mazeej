import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2, Paperclip, Video, Image, File, Send, X } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMessages } from "@/hooks/use-messages";
import { format } from "date-fns";
import ZoomVideoComponent from "@/components/video-call/zoom-video-component";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  isFlagged?: boolean;
  supervisedBy?: number;
  supervisorNotes?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'video';
}

interface Conversation {
  id: string;
  participantId: number;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  participant?: any;
}

export default function MessagesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRTL = i18n.language === "ar";
  
  // Media upload state
  const [mediaUploadOpen, setMediaUploadOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [mediaCaption, setMediaCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Zoom call state
  const [zoomCallActive, setZoomCallActive] = useState(false);
  const [callPartnerId, setCallPartnerId] = useState<number | null>(null);
  const [callPartnerName, setCallPartnerName] = useState("");

  // Get messages hook functions
  const { 
    sendMessageMutation, 
    sendMediaMutation, 
    startZoomCallMutation 
  } = useMessages();

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await apiRequest("GET", "/api/conversations");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch conversations");
      }
      
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: t("common.error"),
        description: t("messages.fetchConversationsError", { defaultValue: "Failed to load your conversations" }),
        variant: "destructive",
      });
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (partnerId: number) => {
    try {
      setIsLoadingMessages(true);
      const response = await apiRequest("GET", `/api/messages/${partnerId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch messages");
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: t("common.error"),
        description: t("messages.fetchMessagesError", { defaultValue: "Failed to load messages" }),
        variant: "destructive",
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPartnerId) return;
    
    try {
      setIsSendingMessage(true);
      
      await sendMessageMutation.mutateAsync({
        receiverId: selectedPartnerId,
        content: newMessage.trim()
      });
      
      // Fetch updated messages
      await fetchMessages(selectedPartnerId);
      
      // Clear the input
      setNewMessage("");
      
      // Scroll to bottom
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: t("common.error"),
        description: t("messages.sendMessageError", { defaultValue: "Failed to send message" }),
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle file selection for upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingFile(file);
      setMediaUploadOpen(true);
    }
  };

  // Upload media
  const uploadMedia = async () => {
    if (!uploadingFile || !selectedPartnerId) return;
    
    try {
      // Create a simulated progress interval
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 300);
      
      await sendMediaMutation.mutateAsync({
        receiverId: selectedPartnerId,
        file: uploadingFile,
        caption: mediaCaption.trim() || undefined
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Fetch updated messages
      await fetchMessages(selectedPartnerId);
      
      // Reset media upload state
      setTimeout(() => {
        setMediaUploadOpen(false);
        setUploadingFile(null);
        setMediaCaption("");
        setUploadProgress(0);
      }, 500);
      
      // Scroll to bottom
      scrollToBottom();
    } catch (error) {
      console.error("Error uploading media:", error);
      toast({
        title: t("common.error"),
        description: t("messages.uploadMediaError", { defaultValue: "Failed to upload media" }),
        variant: "destructive",
      });
      setUploadProgress(0);
    }
  };

  // Start a Zoom call
  const startZoomCall = async () => {
    if (!selectedPartnerId) return;
    
    try {
      const participant = conversations.find(c => c.participantId === selectedPartnerId)?.participant;
      const partnerName = participant?.fullName || participant?.username || `User #${selectedPartnerId}`;
      
      setCallPartnerId(selectedPartnerId);
      setCallPartnerName(partnerName);
      
      await startZoomCallMutation.mutateAsync(selectedPartnerId);
      
      setZoomCallActive(true);
    } catch (error) {
      console.error("Error starting Zoom call:", error);
      toast({
        title: t("common.error"),
        description: t("messages.zoomCallError", { defaultValue: "Failed to start video call" }),
        variant: "destructive",
      });
    }
  };

  // End a Zoom call
  const endZoomCall = () => {
    setZoomCallActive(false);
    setCallPartnerId(null);
    setCallPartnerName("");
  };

  // Create or find conversation with user from URL parameter
  const createOrFindConversation = async (userId: string) => {
    const partnerId = parseInt(userId);
    if (isNaN(partnerId)) return;
    
    try {
      // First check if conversation already exists
      const existingConv = conversations.find(c => c.participantId === partnerId);
      
      if (existingConv) {
        selectConversation(existingConv.id, partnerId);
        return;
      }
      
      // If not, get user details
      const response = await apiRequest("GET", `/api/users/${partnerId}`);
      if (!response.ok) {
        throw new Error("User not found");
      }
      
      const userData = await response.json();
      
      // Create a new conversation object
      const newConversation: Conversation = {
        id: `conv-${user?.id}-${partnerId}`,
        participantId: partnerId,
        participantName: userData.fullName || userData.username || `User #${partnerId}`,
        participantAvatar: userData.profileImage || "",
        lastMessage: "",
        timestamp: new Date().toISOString(),
        unreadCount: 0,
        participant: userData
      };
      
      // Add to conversations and select it
      setConversations(prev => [newConversation, ...prev]);
      selectConversation(newConversation.id, partnerId);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: t("common.error"),
        description: t("messages.userNotFound", { defaultValue: "User not found" }),
        variant: "destructive",
      });
    }
  };

  // Sort conversations by timestamp
  const sortConversations = () => {
    setConversations(prev => 
      [...prev].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    );
  };

  // Select a conversation and load its messages
  const selectConversation = (convId: string, partnerId: number) => {
    setSelectedConversation(convId);
    setSelectedPartnerId(partnerId);
    fetchMessages(partnerId);
  };

  // Scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load conversations on component mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Check URL for user parameter after loading conversations
  useEffect(() => {
    if (!isLoadingConversations && conversations.length >= 0) {
      const params = new URLSearchParams(window.location.search);
      const userId = params.get('user');
      
      if (userId) {
        createOrFindConversation(userId);
      }
    }
  }, [isLoadingConversations, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Format date to display in a user-friendly way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  // Render supervision status if message is supervised
  const renderSupervisionStatus = (message: Message) => {
    if (!message.supervisedBy && !message.supervisorNotes) return null;

    return (
      <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
        {message.supervisedBy && (
          <div className="flex items-center gap-1">
            <span>👁️</span>
            <span>{t("messages.supervisedByAdmin")}</span>
          </div>
        )}
        {message.supervisorNotes && (
          <div className="mt-1 italic">
            {message.supervisorNotes}
          </div>
        )}
      </div>
    );
  };

  // Render media attachments
  const renderMedia = (message: Message) => {
    if (!message.mediaUrl || !message.mediaType) return null;

    if (message.mediaType === 'image') {
      return (
        <div className="mt-2 rounded-md overflow-hidden">
          <img 
            src={message.mediaUrl} 
            alt="Shared image" 
            className="max-w-full max-h-96 object-contain"
            onClick={() => window.open(message.mediaUrl, '_blank')}
          />
        </div>
      );
    }
    
    if (message.mediaType === 'video') {
      return (
        <div className="mt-2 rounded-md overflow-hidden">
          <video 
            src={message.mediaUrl} 
            controls 
            className="max-w-full max-h-96"
          />
        </div>
      );
    }
    
    if (message.mediaType === 'document') {
      return (
        <div className="mt-2">
          <a 
            href={message.mediaUrl} 
            target="_blank" 
            className="flex items-center gap-2 p-3 rounded-md bg-background border"
          >
            <File className="h-6 w-6 text-blue-500" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Document</span>
              <span className="text-xs text-muted-foreground">
                {message.mediaUrl.split('/').pop()}
              </span>
            </div>
          </a>
        </div>
      );
    }
    
    return null;
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => 
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      {zoomCallActive && callPartnerId ? (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-medium">
              {t("messages.videoCallWith", { name: callPartnerName })}
            </h2>
            <Button variant="destructive" size="sm" onClick={endZoomCall}>
              {t("messages.endCall")}
            </Button>
          </div>
          <div className="flex-1">
            <ZoomVideoComponent 
              receiverId={callPartnerId} 
              onCallEnd={endZoomCall}
              userName={user.username || user.fullName || "User"}
            />
          </div>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-12rem)] overflow-hidden">
          {/* Conversations List */}
          <div className={`w-1/3 border-r border-neutral-200 flex flex-col ${isRTL ? "border-r-0 border-l" : ""}`}>
            <div className="p-4 border-b border-neutral-200">
              <div className="relative">
                <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 text-neutral-500`} size={18} />
                <Input 
                  placeholder={t("messages.searchConversations")} 
                  className={isRTL ? "pr-10" : "pl-10"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>
            
            {isLoadingConversations ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t("common.loading", { defaultValue: "Loading..." })}</p>
                </div>
              </div>
            ) : (
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => (
                  <div 
                    key={conv.id}
                    className={`p-4 border-b border-neutral-200 cursor-pointer hover:bg-neutral-50 ${selectedConversation === conv.id ? 'bg-neutral-100' : ''}`}
                      onClick={() => selectConversation(conv.id, conv.participantId)}
                  >
                    <div className="flex items-center">
                      <Avatar className={`h-10 w-10 ${isRTL ? "ml-3" : "mr-3"}`}>
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
            )}
          </div>

          {/* Messages Area */}
          <div className="w-2/3 flex flex-col">
            {selectedConversation && selectedPartnerId ? (
              <>
                <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className={`h-10 w-10 ${isRTL ? "ml-3" : "mr-3"}`}>
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
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={startZoomCall}
                    className="flex items-center gap-1"
                  >
                    <Video className="h-4 w-4" />
                    {t("messages.videoCall")}
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{t("common.loading", { defaultValue: "Loading..." })}</p>
                      </div>
                    </div>
                  ) : messages.length > 0 ? (
                    <>
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={cn(
                              "max-w-[70%] p-3 rounded-lg",
                              message.senderId === user.id
                                ? 'bg-primary text-white rounded-br-none' 
                                : 'bg-neutral-100 text-neutral-800 rounded-bl-none',
                              isRTL && message.senderId === user.id
                                ? 'rounded-br-lg rounded-bl-none' 
                                : isRTL ? 'rounded-bl-lg rounded-br-none' : '',
                              message.isFlagged && 'border-2 border-red-500'
                            )}
                          >
                            <p className="text-sm" dir="auto">{message.content}</p>
                            {renderMedia(message)}
                            <div className="text-xs mt-1 text-right">
                              {formatDate(message.createdAt)}
                            </div>
                            {renderSupervisionStatus(message)}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-neutral-500">
                        <p>{t("messages.startConversation", { defaultValue: "Start the conversation by sending a message" })}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t border-neutral-200">
                  <div className="flex">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full mr-2">
                          <Paperclip className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.accept = "image/*";
                              fileInputRef.current.click();
                            }
                          }}>
                            <Image className="h-4 w-4 mr-2" />
                            <span>{t("messages.sendImage")}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt";
                              fileInputRef.current.click();
                            }
                          }}>
                            <File className="h-4 w-4 mr-2" />
                            <span>{t("messages.sendDocument")}</span>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Input 
                      placeholder={t("messages.typeMessage")} 
                      className="flex-1 mr-2"
                      dir={isRTL ? "rtl" : "ltr"}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      disabled={isSendingMessage}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={isSendingMessage || !newMessage.trim()}
                    >
                      {isSendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {t("messages.send")}
                    </Button>
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
      )}
      
      {/* Media Upload Dialog */}
      <Dialog open={mediaUploadOpen} onOpenChange={setMediaUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("messages.uploadMedia")}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {uploadingFile && (
              <div className="flex items-center justify-between border rounded p-3">
                <div className="flex items-center space-x-3">
                  {uploadingFile.type.startsWith('image/') ? (
                    <Image className="h-5 w-5 text-blue-500" />
                  ) : (
                    <File className="h-5 w-5 text-blue-500" />
                  )}
                  <div className="text-sm">
                    <p className="font-medium truncate" style={{ maxWidth: '200px' }}>
                      {uploadingFile.name}
                    </p>
                    <p className="text-muted-foreground">
                      {(uploadingFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setUploadingFile(null);
                    setMediaUploadOpen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {uploadProgress > 0 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-xs text-right text-muted-foreground">
                  {uploadProgress}%
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("messages.addCaption")}
              </label>
              <Input
                placeholder={t("messages.captionPlaceholder")}
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadingFile(null);
                setMediaUploadOpen(false);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button 
              onClick={uploadMedia}
              disabled={!uploadingFile || uploadProgress > 0}
            >
              {uploadProgress > 0 ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {t("messages.send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}