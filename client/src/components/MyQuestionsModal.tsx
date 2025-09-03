import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, User, Clock, Send, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

interface Conversation {
  id: string;
  subject: string;
  lastMessageAt: string;
  brand: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  influencer: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
}

interface MyQuestionsModalProps {
  campaign: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

export function MyQuestionsModal({ 
  campaign, 
  isOpen, 
  onOpenChange,
  currentUserId 
}: MyQuestionsModalProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();

  // Fetch conversations for this campaign by current influencer
  const { data: conversations = [], isLoading, refetch } = useQuery<Conversation[]>({
    queryKey: ['/api/campaigns', campaign?.id, 'influencer-questions', currentUserId],
    queryFn: async () => {
      if (!campaign?.id || !currentUserId) return [];
      const response = await fetch(`/api/campaigns/${campaign.id}/questions?influencerId=${currentUserId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      return data.conversations || [];
    },
    enabled: !!campaign?.id && !!currentUserId && isOpen,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ['/api/conversations', selectedConversation?.id, 'messages'],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      return data.messages || [];
    },
    enabled: !!selectedConversation,
  });

  const handleSendReply = async () => {
    if (!selectedConversation || !replyText.trim()) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyText,
          messageType: 'text',
        }),
      });

      if (response.ok) {
        toast({
          title: "Reply sent successfully",
          description: "Your response has been sent to the brand.",
        });
        setReplyText('');
        // Refresh messages and conversations
        refetchMessages();
        refetch();
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Failed to send reply",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Auto-select first conversation if only one exists
  useEffect(() => {
    if (conversations.length === 1 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  if (!campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            My Questions - {campaign?.title}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading your questions...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Yet</h3>
            <p className="text-gray-600">You haven't asked any questions about this campaign yet.</p>
            <p className="text-sm text-gray-500 mt-2">Use the "Ask Question" button to start a conversation with the brand.</p>
            <Button 
              onClick={() => onOpenChange(false)}
              variant="outline" 
              className="mt-4"
            >
              Close
            </Button>
          </div>
        ) : conversations.length === 1 ? (
          // Single conversation - show directly
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-shrink-0 border-b p-4 bg-blue-50">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={conversations[0].brand.profileImageUrl} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {conversations[0].brand.firstName[0]}{conversations[0].brand.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-gray-900">
                    Conversation with {conversations[0].brand.firstName} {conversations[0].brand.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{conversations[0].subject}</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-h-0 flex flex-col">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.senderId === currentUserId ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          <AvatarImage src={message.sender.profileImageUrl} />
                          <AvatarFallback className="text-xs">
                            {message.sender.firstName[0]}{message.sender.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.senderId === currentUserId
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderId === currentUserId
                                ? 'text-blue-100'
                                : 'text-gray-500'
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Reply Box */}
              <div className="flex-shrink-0 border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="px-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Multiple conversations - show list + detail view
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Conversations List */}
            <Card className="flex flex-col">
              <div className="flex-shrink-0 p-4 border-b">
                <h3 className="font-medium flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Your Questions ({conversations.length})
                </h3>
              </div>
              <CardContent className="flex-1 min-h-0 p-0">
                <ScrollArea className="h-full">
                  <div className="space-y-2 p-4">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={conversation.brand.profileImageUrl} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {conversation.brand.firstName[0]}{conversation.brand.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {conversation.brand.firstName} {conversation.brand.lastName}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">{conversation.subject}</p>
                            {conversation.lastMessage && (
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {conversation.lastMessage.content}
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {new Date(conversation.lastMessageAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Messages View */}
            <Card className="flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="flex-shrink-0 border-b p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={selectedConversation.brand.profileImageUrl} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {selectedConversation.brand.firstName[0]}{selectedConversation.brand.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {selectedConversation.brand.firstName} {selectedConversation.brand.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{selectedConversation.subject}</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="flex-1 min-h-0 p-0">
                    <div className="flex flex-col h-full">
                      {/* Messages */}
                      <ScrollArea className="flex-1 p-4">
                        {messagesLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex gap-3 ${
                                  message.senderId === currentUserId ? 'flex-row-reverse' : ''
                                }`}
                              >
                                <Avatar className="w-6 h-6 flex-shrink-0">
                                  <AvatarImage src={message.sender.profileImageUrl} />
                                  <AvatarFallback className="text-xs">
                                    {message.sender.firstName[0]}{message.sender.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div
                                  className={`max-w-[80%] p-3 rounded-lg ${
                                    message.senderId === currentUserId
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p
                                    className={`text-xs mt-1 ${
                                      message.senderId === currentUserId
                                        ? 'text-blue-100'
                                        : 'text-gray-500'
                                    }`}
                                  >
                                    {new Date(message.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>

                      {/* Reply Box */}
                      <div className="border-t p-4">
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Type your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="flex-1 min-h-[60px] resize-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply();
                              }
                            }}
                          />
                          <Button
                            onClick={handleSendReply}
                            disabled={!replyText.trim()}
                            className="px-3"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Press Enter to send, Shift+Enter for new line
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Select a conversation to view messages</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}