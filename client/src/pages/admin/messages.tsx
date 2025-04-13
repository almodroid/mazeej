import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { 
  Flag,
  Search,
  UserCheck,
  MessageSquare,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import AdminLayout from "@/components/layouts/admin-layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define interfaces for the data types
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  fullName?: string;
  profileImage?: string;
}

interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: Date;
  isRead: boolean;
  isFlagged: boolean;
  supervisedBy: number | null;
  supervisorNotes: string | null;
}

interface Conversation {
  id: string; // Unique ID for the conversation (sender_id + receiver_id)
  participants: User[];
  lastMessage?: {
    content: string;
    timestamp: Date;
  };
  unreadCount: number;
  isFlagged: boolean;
  isSupervisedBy?: number;
}

export default function AdminMessagesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageToSupervise, setMessageToSupervise] = useState<ChatMessage | null>(null);
  const [supervisorNotes, setSupervisorNotes] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRTL = i18n.language === "ar";
  const locale = i18n.language === "ar" ? ar : enUS;
  
  // Fetch conversations data
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ["/api/admin/conversations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/conversations");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/admin/conversations", selectedConversation, "messages"],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await apiRequest("GET", `/api/admin/conversations/${selectedConversation}/messages`);
      return response.json();
    },
    enabled: !!selectedConversation && !!user && user.role === "admin"
  });
  
  // Filter conversations based on search query
  const filteredConversations = searchQuery.trim() === ""
    ? conversations
    : (conversations as Conversation[]).filter((conversation: Conversation) => 
        conversation.participants.some(p => 
          p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.fullName && p.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      );
      
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Flag message mutation
  const flagMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("PATCH", `/api/admin/messages/${messageId}/flag`, { isFlagged: true });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("admin.messages.flagSuccess"),
        description: t("admin.messages.flagSuccessDesc")
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/conversations", selectedConversation, "messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Unflag message mutation
  const unflagMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("PATCH", `/api/admin/messages/${messageId}/flag`, { isFlagged: false });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("admin.messages.unflagSuccess"),
        description: t("admin.messages.unflagSuccessDesc")
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/conversations", selectedConversation, "messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Add supervision notes mutation
  const superviseMessageMutation = useMutation({
    mutationFn: async ({messageId, notes}: {messageId: number, notes: string}) => {
      const response = await apiRequest("PATCH", `/api/admin/messages/${messageId}/supervise`, { 
        supervisorNotes: notes,
        supervisedBy: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("admin.messages.superviseSuccess"),
        description: t("admin.messages.superviseSuccessDesc")
      });
      setMessageToSupervise(null);
      setSupervisorNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/conversations", selectedConversation, "messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Format date helper
  const formatDate = (date: Date) => {
    return format(new Date(date), "PPpp", { locale });
  };

  // Handle message flag toggle
  const handleFlagToggle = (message: ChatMessage) => {
    if (message.isFlagged) {
      unflagMessageMutation.mutate(message.id);
    } else {
      flagMessageMutation.mutate(message.id);
    }
  };
  
  // Handle message supervision
  const handleSupervise = () => {
    if (!messageToSupervise) return;
    superviseMessageMutation.mutate({
      messageId: messageToSupervise.id,
      notes: supervisorNotes
    });
  };
  
  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6 p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t("admin.messages.title")}</h1>
            <p className="text-muted-foreground">{t("admin.messages.description")}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="md:col-span-1 overflow-hidden">
            <CardHeader className="px-4 py-3 space-y-2">
              <CardTitle>{t("admin.messages.conversations")}</CardTitle>
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4`} />
                <Input
                  placeholder={t("admin.messages.search")}
                  className={`pl-10 pr-4 h-9 ${isRTL ? 'pl-4 pr-10' : ''}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {t("admin.messages.filter")}
                </Button>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue placeholder={t("admin.messages.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("admin.messages.all")}</SelectItem>
                    <SelectItem value="flagged">{t("admin.messages.flagged")}</SelectItem>
                    <SelectItem value="supervised">{t("admin.messages.supervised")}</SelectItem>
                    <SelectItem value="unsupervised">{t("admin.messages.unsupervised")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                {isLoadingConversations ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {searchQuery.trim() !== ""
                        ? t("admin.messages.noConversationsFound")
                        : t("admin.messages.noConversations")
                      }
                    </p>
                  </div>
                ) : (
                  (filteredConversations as Conversation[]).map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "p-4 border-b cursor-pointer hover:bg-accent/50 transition-colors",
                        selectedConversation === conversation.id && "bg-accent",
                        conversation.isFlagged && "border-l-4 border-l-destructive"
                      )}
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="flex -space-x-2 rtl:space-x-reverse">
                            {conversation.participants.slice(0, 2).map((participant, i) => (
                              <Avatar key={i} className="h-8 w-8 border-2 border-background">
                                <AvatarImage src={participant.profileImage} alt={participant.username} />
                                <AvatarFallback className="text-xs">
                                  {participant.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          {conversation.isFlagged && (
                            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium truncate">
                              {conversation.participants.map(p => p.fullName || p.username).join(", ")}
                            </h4>
                            {conversation.lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(conversation.lastMessage.timestamp), "p", { locale })}
                              </span>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Messages Area */}
          <Card className="md:col-span-2 flex flex-col">
            {!selectedConversation ? (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-20rem)] p-6 text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("admin.messages.selectConversation")}</h3>
                <p className="text-muted-foreground">
                  {t("admin.messages.selectConversationDescription")}
                </p>
              </div>
            ) : (
              <>
                <CardHeader className="px-6 py-4 border-b">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2 rtl:space-x-reverse">
                        {(conversations as Conversation[])
                          .find(c => c.id === selectedConversation)
                          ?.participants.slice(0, 2).map((participant, i) => (
                            <Avatar key={i} className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={participant.profileImage} alt={participant.username} />
                              <AvatarFallback className="text-xs">
                                {participant.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {(conversations as Conversation[])
                            .find(c => c.id === selectedConversation)
                            ?.participants.map(p => p.fullName || p.username).join(", ")}
                        </CardTitle>
                        <CardDescription>
                          {(conversations as Conversation[])
                            .find(c => c.id === selectedConversation)
                            ?.participants.map(p => p.role).join(", ")}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {t("admin.messages.supervised")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  ) : (messages as ChatMessage[]).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center h-full">
                      <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">{t("admin.messages.noMessages")}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(messages as ChatMessage[]).map((message, index) => {
                        const sender = (conversations as Conversation[])
                          .find(c => c.id === selectedConversation)
                          ?.participants.find(p => p.id === message.senderId);
                          
                        return (
                          <div key={message.id} className="group relative">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={sender?.profileImage} />
                                <AvatarFallback>
                                  {sender?.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-sm">
                                    {sender?.fullName || sender?.username}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(message.createdAt)}
                                  </div>
                                  {message.isFlagged && (
                                    <Badge variant="destructive" className="text-xs ml-1">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      {t("admin.messages.flagged")}
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-1 rounded-md bg-muted p-3">
                                  {message.content}
                                </div>
                                {message.supervisorNotes && (
                                  <div className="mt-2 rounded-md bg-yellow-50 dark:bg-yellow-950 p-3 border-l-2 border-yellow-500">
                                    <div className="font-medium text-xs text-yellow-700 dark:text-yellow-300">
                                      {t("admin.messages.supervisorNotes")}:
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {message.supervisorNotes}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => setMessageToSupervise(message)}
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant={message.isFlagged ? "destructive" : "ghost"} 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => handleFlagToggle(message)}
                              >
                                <Flag className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </Card>
        </div>
      </div>
      
      {/* Supervise Message Dialog */}
      <Dialog open={!!messageToSupervise} onOpenChange={(open) => !open && setMessageToSupervise(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("admin.messages.superviseMessage")}</DialogTitle>
            <DialogDescription>
              {t("admin.messages.superviseMessageDescription")}
            </DialogDescription>
          </DialogHeader>
          
          {messageToSupervise && (
            <div className="py-4">
              <div className="mb-4 rounded-md bg-muted p-3">
                <div className="font-medium text-sm mb-1">
                  {t("admin.messages.messageContent")}:
                </div>
                {messageToSupervise.content}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("admin.messages.addSupervisorNotes")}
                  </label>
                  <Textarea
                    placeholder={t("admin.messages.notesSuggestion")}
                    value={supervisorNotes}
                    onChange={(e) => setSupervisorNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageToSupervise(null)}>
              {t("common.cancel")}
            </Button>
            <Button 
              onClick={handleSupervise}
              disabled={!supervisorNotes.trim() || superviseMessageMutation.isPending}
            >
              {superviseMessageMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2"></div>
                  {t("common.saving")}
                </>
              ) : (
                t("admin.messages.saveNotes")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 