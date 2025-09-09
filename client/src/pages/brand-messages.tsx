import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Search,
  Phone,
  Video,
  MoreHorizontal,
  Send,
  Paperclip,
  Smile,
  MessageCircle,
  Clock,
  Users,
  Plus,
  Filter,
  Star,
  Archive,
  AlertCircle,
  CheckCircle,
  Circle,
  Zap
} from "lucide-react";
import { Navigation } from "@/components/layout/navigation";
import { BrandNav } from "@/components/BrandNav";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation, Message, MessageTemplate } from "@shared/schema";

interface ConversationWithDetails extends Conversation {
  brand: { id: string; firstName: string; lastName: string; profileImageUrl?: string; };
  influencer: { id: string; firstName: string; lastName: string; profileImageUrl?: string; };
  campaign?: { id: string; title: string; };
  lastMessage?: Message;
  unreadCount: number;
}

interface MessageWithSender extends Message {
  sender: { id: string; firstName: string; lastName: string; profileImageUrl?: string; };
}

export default function BrandMessages() {
  const [selectedConversation, setSelectedConversation] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationData, setNewConversationData] = useState({
    influencerId: "",
    campaignId: "",
    subject: "",
    priority: "normal" as const,
  });

  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    select: (data: any) => data.conversations as ConversationWithDetails[]
  });

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', selectedConversation, 'messages'],
    enabled: !!selectedConversation,
    select: (data: any) => data.messages as MessageWithSender[]
  });

  // Fetch message templates
  const { data: templatesData } = useQuery({
    queryKey: ['/api/message-templates'],
    select: (data: any) => data.templates as MessageTemplate[]
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; messageType?: string; attachments?: string[] }) => {
      const response = await fetch(`/api/conversations/${selectedConversation}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setNewMessage("");
    }
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (conversationData: any) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversationData),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setShowNewConversation(false);
      setNewConversationData({
        influencerId: "",
        campaignId: "",
        subject: "",
        priority: "normal",
      });
    }
  });

  // Mark conversation as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    }
  });

  const conversations = conversationsData || [];
  const messages = messagesData || [];
  const templates = templatesData || [];

  // Filter conversations based on search, status, and priority
  const filteredConversations = conversations
    .filter(conversation => {
    const matchesSearch = 
      conversation.influencer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.influencer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || conversation.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || conversation.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      content: newMessage,
      messageType: 'text'
    });
  };

  const handleCreateConversation = () => {
    if (!newConversationData.influencerId || !newConversationData.subject) return;
    
    createConversationMutation.mutate(newConversationData);
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    
    // Mark as read when conversation is opened
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation && conversation.unreadCount > 0) {
      markAsReadMutation.mutate(conversationId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'archived': return 'bg-yellow-500';
      case 'resolved': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Zap className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'normal': return <Circle className="w-4 h-4 text-blue-500" />;
      case 'low': return <Circle className="w-4 h-4 text-gray-400" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Statistics calculations
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  const activeConversations = conversations.filter(conv => conv.status === 'active').length;
  const urgentConversations = conversations.filter(conv => conv.priority === 'urgent' || conv.priority === 'high').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BrandNav />
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Enhanced Communication Portal</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Professional messaging with influencers and collaboration management</p>
          </div>
          <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700" data-testid="button-new-conversation">
                <Plus className="w-4 h-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="influencer">Influencer</Label>
                  <Input
                    id="influencer"
                    placeholder="Enter influencer ID"
                    value={newConversationData.influencerId}
                    onChange={(e) => setNewConversationData(prev => ({ ...prev, influencerId: e.target.value }))}
                    data-testid="input-influencer-id"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Message subject"
                    value={newConversationData.subject}
                    onChange={(e) => setNewConversationData(prev => ({ ...prev, subject: e.target.value }))}
                    data-testid="input-conversation-subject"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newConversationData.priority} onValueChange={(value) => setNewConversationData(prev => ({ ...prev, priority: value as any }))}>
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleCreateConversation}
                  disabled={!newConversationData.influencerId || !newConversationData.subject || createConversationMutation.isPending}
                  className="w-full"
                  data-testid="button-create-conversation"
                >
                  {createConversationMutation.isPending ? "Creating..." : "Start Conversation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with Conversations and Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-teal-600">{totalUnread}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Unread Messages</p>
                    </div>
                    <MessageCircle className="h-6 w-6 text-teal-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{activeConversations}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Active Conversations</p>
                    </div>
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{urgentConversations}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">High Priority</p>
                    </div>
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conversations List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Conversations</span>
                  <Button variant="ghost" size="sm">
                    <Filter className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-conversations"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="text-xs" data-testid="select-status-filter">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="text-xs" data-testid="select-priority-filter">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {conversationsLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading conversations...</div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No conversations found</div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation.id)}
                        className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          selectedConversation === conversation.id ? 'bg-teal-50 dark:bg-teal-900/30 border-l-4 border-l-teal-600' : ''
                        }`}
                        data-testid={`conversation-${conversation.id}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                              {conversation.influencer.firstName[0]}{conversation.influencer.lastName[0]}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(conversation.status)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                {conversation.influencer.firstName} {conversation.influencer.lastName}
                              </h4>
                              <div className="flex items-center space-x-1">
                                {getPriorityIcon(conversation.priority)}
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {conversation.subject && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1 font-medium">{conversation.subject}</p>
                            )}
                            {conversation.lastMessage && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                {conversation.lastMessage.content}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <Badge className={`text-xs ${getPriorityColor(conversation.priority)}`}>
                                {conversation.priority.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {conversation.lastMessage?.createdAt ? formatMessageTime(conversation.lastMessage.createdAt.toString()) : formatMessageTime((conversation.createdAt || new Date()).toString())}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              {selectedConversationData ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {selectedConversationData.influencer.firstName[0]}{selectedConversationData.influencer.lastName[0]}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(selectedConversationData.status)}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {selectedConversationData.influencer.firstName} {selectedConversationData.influencer.lastName}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {selectedConversationData.subject && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedConversationData.subject}</p>
                            )}
                            {selectedConversationData.campaign && (
                              <Badge variant="outline" className="text-xs">
                                {selectedConversationData.campaign.title}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(selectedConversationData.priority)}
                          <Badge className={`text-xs ${getPriorityColor(selectedConversationData.priority)}`}>
                            {selectedConversationData.priority.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" data-testid="button-voice-call">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" data-testid="button-video-call">
                          <Video className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="p-0">
                    <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
                      {messagesLoading ? (
                        <div className="text-center text-gray-500 py-8">Loading messages...</div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderId === selectedConversationData.brandId ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="flex items-start space-x-2 max-w-xs">
                              {message.senderId !== selectedConversationData.brandId && (
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                  {message.sender.firstName[0]}
                                </div>
                              )}
                              <div
                                className={`px-4 py-2 rounded-lg ${
                                  message.senderId === selectedConversationData.brandId
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <p className={`text-xs ${
                                    message.senderId === selectedConversationData.brandId ? 'text-teal-100' : 'text-gray-500'
                                  }`}>
                                    {formatTime((message.createdAt || new Date()).toString())}
                                  </p>
                                  {message.senderId === selectedConversationData.brandId && (
                                    <div className="flex items-center space-x-1">
                                      {message.deliveryStatus === 'read' ? (
                                        <CheckCircle className="w-3 h-3 text-teal-100" />
                                      ) : message.deliveryStatus === 'delivered' ? (
                                        <CheckCircle className="w-3 h-3 text-teal-200" />
                                      ) : (
                                        <Circle className="w-3 h-3 text-teal-200" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Message Templates Bar */}
                    {templates.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                        <div className="flex flex-wrap gap-1">
                          {templates.slice(0, 3).map((template) => (
                            <Button
                              key={template.id}
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => setNewMessage(template.content)}
                              data-testid={`button-template-${template.id}`}
                            >
                              {template.title}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message Input */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <div className="flex-1">
                          <Textarea
                            placeholder="Type your message..."
                            rows={2}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            className="resize-none min-h-[60px]"
                            data-testid="textarea-message-input"
                          />
                        </div>
                        <Button variant="ghost" size="sm">
                          <Smile className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sendMessageMutation.isPending}
                          className="bg-teal-600 hover:bg-teal-700"
                          data-testid="button-send-message"
                        >
                          {sendMessageMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Professional Brand Communication</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Select a conversation to start messaging with influencers</p>
                    <Button 
                      onClick={() => setShowNewConversation(true)}
                      className="bg-teal-600 hover:bg-teal-700"
                      data-testid="button-start-new-conversation"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Start New Conversation
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}