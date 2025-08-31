import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Send,
  Paperclip,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Building
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Message, Conversation } from "@shared/schema";

interface MessageWithSender extends Message {
  sender: { id: string; firstName: string; lastName: string; profileImageUrl?: string; };
}

interface ConversationWithDetails extends Conversation {
  brand: { id: string; firstName: string; lastName: string; profileImageUrl?: string; };
  influencer: { id: string; firstName: string; lastName: string; profileImageUrl?: string; };
  campaign?: { id: string; title: string; };
  lastMessage?: Message;
  unreadCount: number;
}

interface CampaignChatProps {
  campaignId: string;
  proposalId: string;
  influencerId: string;
  currentUser: { id: string; role: string; firstName: string; lastName: string; };
  campaignTitle: string;
  isActive?: boolean;
}

export function CampaignChat({ campaignId, proposalId, influencerId, currentUser, campaignTitle, isActive = false }: CampaignChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch or create conversation for this campaign
  const { data: conversationData, isLoading: conversationLoading } = useQuery({
    queryKey: ['/api/conversations/campaign', campaignId],
    select: (data: any) => data.conversation as ConversationWithDetails
  });

  // Fetch messages for the conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    enabled: !!conversationId,
    select: (data: any) => data.messages as MessageWithSender[]
  });

  // Set conversation ID when data is loaded or auto-create if approved proposal has no conversation
  useEffect(() => {
    if (conversationData?.id) {
      setConversationId(conversationData.id);
      // Mark conversation as read when opening the chat
      if (isActive) {
        markAsReadMutation.mutate();
      }
    } else if (!conversationLoading && !conversationData && currentUser.role === 'brand') {
      // For brand users, auto-create conversation for approved proposals to streamline communication
      createConversationMutation.mutate();
    }
  }, [conversationData, conversationLoading, isActive]);

  // Auto-scroll to bottom when new messages arrive and mark as read
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // Mark as read when new messages are received and chat is active
    if (messagesData && messagesData.length > 0 && conversationId && isActive) {
      markAsReadMutation.mutate();
    }
  }, [messagesData, isActive]);

  // Mark as read immediately when chat becomes active
  useEffect(() => {
    if (isActive && conversationId) {
      markAsReadMutation.mutate();
    }
  }, [isActive, conversationId]);

  // Mark conversation as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!conversationId) return;
      const response = await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate conversation query to update unread counts
      queryClient.invalidateQueries({ queryKey: ['/api/conversations/campaign', campaignId] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, messageType: 'text' }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations/campaign', campaignId] });
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Create conversation if it doesn't exist
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      // Determine brandId and influencerId based on current user role
      const brandId = currentUser.role === 'brand' ? currentUser.id : undefined;
      const participantInfluencerId = currentUser.role === 'influencer' ? currentUser.id : influencerId;

      if (!brandId || !participantInfluencerId) {
        throw new Error('Unable to identify conversation participants');
      }

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          influencerId: participantInfluencerId,
          campaignId,
          subject: `Campaign Discussion: ${campaignTitle}`,
          priority: 'normal'
        }),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      return response.json();
    },
    onSuccess: (data) => {
      setConversationId(data.conversation.id);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations/campaign', campaignId] });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    if (!conversationId) {
      createConversationMutation.mutate();
      return;
    }
    
    sendMessageMutation.mutate({ content: newMessage.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOtherParticipant = () => {
    if (!conversationData) return null;
    return currentUser.role === 'influencer' ? conversationData.brand : conversationData.influencer;
  };

  const otherParticipant = getOtherParticipant();

  if (conversationLoading) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Campaign Discussion
          </CardTitle>
          {otherParticipant && (
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={otherParticipant.profileImageUrl} />
                <AvatarFallback className="text-xs">
                  {otherParticipant.firstName[0]}{otherParticipant.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600">
                {otherParticipant.firstName} {otherParticipant.lastName}
              </span>
              <Badge variant="outline" className="text-xs">
                {currentUser.role === 'influencer' ? (
                  <><Building className="w-3 h-3 mr-1" />Brand</>
                ) : (
                  <><Users className="w-3 h-3 mr-1" />Influencer</>
                )}
              </Badge>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500">{campaignTitle}</p>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!conversationId && !conversationData ? (
            <div className="text-center py-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                <MessageCircle className="w-16 h-16 mx-auto mb-3 text-blue-500" />
                <h3 className="font-semibold text-blue-900 mb-2">Campaign Chat Ready!</h3>
                <p className="text-sm text-blue-700 mb-4">
                  {createConversationMutation.isPending ? (
                    "Setting up your conversation..."
                  ) : (
                    "Click below to start discussing campaign details, timelines, and deliverables with your collaborator."
                  )}
                </p>
                <Button 
                  onClick={() => createConversationMutation.mutate()}
                  disabled={createConversationMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2"
                  size="lg"
                >
                  {createConversationMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Starting Chat...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Start Campaign Discussion
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : messagesLoading ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
              <p className="text-gray-500">Loading messages...</p>
            </div>
          ) : !messagesData || messagesData.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              {messagesData.map((message) => {
                const isOwn = message.senderId === currentUser.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${
                        isOwn ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {formatTime(message.createdAt)}
                        </span>
                        {isOwn && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        {conversationId && (
          <>
            <Separator />
            <div className="p-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="resize-none min-h-[40px] max-h-[120px]"
                    rows={1}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}