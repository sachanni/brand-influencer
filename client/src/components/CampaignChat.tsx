import { useState, useEffect, useRef, useCallback } from "react";
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
  Building,
  Maximize2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Message, Conversation } from "@shared/schema";
import { QuickReplies } from "@/components/QuickReplies";

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
  brandId?: string;
  currentUser: { id: string; role: string; firstName: string; lastName: string; };
  campaignTitle: string;
  isActive?: boolean;
  isInline?: boolean;
}

function CampaignChatInner({ campaignId, proposalId, influencerId, brandId, currentUser, campaignTitle, isActive = false, isInline = false }: CampaignChatProps) {
  // Validate required props BEFORE any hooks
  const isValidConfig = !!(campaignId && influencerId && currentUser?.id);
  
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string>("");
  const [chatDimensions, setChatDimensions] = useState({ width: 384, height: 500 });
  const [isResizing, setIsResizing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartDimensions, setResizeStartDimensions] = useState({ width: 0, height: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch or create conversation for this campaign
  const { data: conversationData, isLoading: conversationLoading, error: conversationError } = useQuery({
    queryKey: ['/api/conversations/campaign', campaignId, 'influencer', influencerId],
    queryFn: async () => {
      if (!campaignId || !influencerId) {
        throw new Error('Campaign ID and Influencer ID are required');
      }
      
      const params = new URLSearchParams({ influencerId });
      const response = await fetch(`/api/conversations/campaign/${campaignId}?${params}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No existing conversation found - this is expected
          return { conversation: null };
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch conversation');
      }
      
      return response.json();
    },
    enabled: isValidConfig && !!(campaignId && influencerId),
    select: (data: any) => {
      // Ensure clean serializable conversation data
      if (!data?.conversation) return null;
      const conv = data.conversation;
      return {
        ...conv,
        brand: conv.brand || {},
        influencer: conv.influencer || {},
        campaign: conv.campaign || {},
        unreadCount: conv.unreadCount || 0
      } as ConversationWithDetails;
    },
    retry: (failureCount, error) => {
      // Don't retry on 404s (no conversation exists yet)
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      return failureCount < 2;
    },
    // Add persistent caching to maintain conversation across component remounts
    staleTime: 30000, // Keep data fresh for 30 seconds
    cacheTime: 300000 // Keep in cache for 5 minutes
  });

  // Compute derived state to prevent race conditions
  const effectiveConversationId = conversationId || conversationData?.id;
  const hasConversation = !!(conversationData || conversationId);

  // Fetch messages for the conversation
  const { data: messagesData, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['/api/conversations', effectiveConversationId, 'messages'],
    enabled: isValidConfig && !!effectiveConversationId,
    retry: 3,
    select: (data: any) => {
      // Ensure we return a clean array that can be serialized
      if (!data || !Array.isArray(data.messages)) return [];
      return data.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        createdAt: msg.createdAt,
        sender: {
          id: msg.sender?.id,
          firstName: msg.sender?.firstName,
          lastName: msg.sender?.lastName,
          profileImageUrl: msg.sender?.profileImageUrl
        }
      }));
    }
  });

  // MUTATIONS - Must be defined before any effects that use them
  
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveConversationId || !isMountedRef.current) return null;
      const response = await fetch(`/api/conversations/${effectiveConversationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      const data = await response.json();
      // Return a clean, serializable object
      return { success: data.success || true };
    },
    onSuccess: () => {
      if (!isMountedRef.current) return;
      // Invalidate conversation query to update unread counts
      queryClient.invalidateQueries({ queryKey: ['/api/conversations/campaign', campaignId, 'influencer', influencerId] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!isMountedRef.current) throw new Error('Component unmounted');
      const response = await fetch(`/api/conversations/${effectiveConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, messageType: 'text' }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();
      // Return only the message data we need, clean and serializable
      return {
        id: data.message?.id,
        content: data.message?.content,
        senderId: data.message?.senderId,
        createdAt: data.message?.createdAt
      };
    },
    onSuccess: () => {
      if (!isMountedRef.current) return;
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', effectiveConversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations/campaign', campaignId, 'influencer', influencerId] });
    },
    onError: (error: Error) => {
      if (!isMountedRef.current || error.message === 'Component unmounted') return;
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      // Determine the correct brandId and influencerId
      const conversationBrandId = currentUser.role === 'brand' ? currentUser.id : brandId;
      const conversationInfluencerId = currentUser.role === 'influencer' ? currentUser.id : influencerId;
      
      if (!conversationBrandId || !conversationInfluencerId) {
        throw new Error('Unable to identify conversation participants. Brand ID and Influencer ID are required.');
      }
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: conversationBrandId,
          influencerId: conversationInfluencerId,
          campaignId,
          subject: `Campaign Discussion: ${campaignTitle}`,
          priority: 'normal'
        }),
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to create conversation';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use the default message
        }
        console.error('Conversation creation failed:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      // Return only the conversation data we need, clean and serializable
      return {
        conversation: {
          id: data.conversation?.id,
          brandId: data.conversation?.brandId,
          influencerId: data.conversation?.influencerId,
          campaignId: data.conversation?.campaignId,
          subject: data.conversation?.subject
        }
      };
    },
    onSuccess: (data) => {
      if (!isMountedRef.current) return;
      setConversationId(data.conversation.id);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations/campaign', campaignId, 'influencer', influencerId] });
      
      // If there's a pending message, send it now
      if (newMessage.trim() && isMountedRef.current) {
        setTimeout(() => {
          if (isMountedRef.current) {
            sendMessageMutation.mutate({ content: newMessage.trim() });
          }
        }, 100);
      }
    },
    onError: (error: Error) => {
      if (!isMountedRef.current) return;
      console.error('Conversation creation error:', error);
      toast({
        title: "Failed to start conversation",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // EFFECTS - After all mutations are defined
  
  // Set conversation ID when data is loaded 
  useEffect(() => {
    if (conversationData?.id && isMountedRef.current) {
      setConversationId(conversationData.id);
    }
  }, [conversationData]);

  // Clear conversation state only when component truly unmounts
  useEffect(() => {
    return () => {
      // Only clear when component is actually being destroyed
      if (!isMountedRef.current) {
        setConversationId("");
      }
    };
  }, []);

  
  // Cleanup effect to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesData && messagesData.length > 0 && isMountedRef.current) {
      try {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } catch (error) {
        // Silently catch scroll errors during unmount
        console.warn('Auto-scroll failed:', error);
      }
    }
  }, [messagesData]);

  // Mark as read when chat becomes active (debounced)
  useEffect(() => {
    if (isActive && effectiveConversationId && messagesData && messagesData.length > 0 && isMountedRef.current) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          try {
            markAsReadMutation.mutate();
          } catch (error) {
            // Silently catch errors if component is unmounted
            console.warn('Mark as read failed:', error);
          }
        }
      }, 500); // Debounce to prevent excessive calls
      return () => clearTimeout(timer);
    }
  }, [isActive, effectiveConversationId, messagesData]);

  // Auto-focus input when chat becomes active or conversation is created
  useEffect(() => {
    if (isActive && effectiveConversationId && messageInputRef.current && isMountedRef.current) {
      // Small delay to ensure the chat popup is fully rendered
      const timer = setTimeout(() => {
        if (isMountedRef.current && messageInputRef.current) {
          try {
            messageInputRef.current.focus();
          } catch (error) {
            console.warn('Auto-focus failed:', error);
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, effectiveConversationId]);

  // Resize functionality with smooth transitions
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setIsTransitioning(false); // Disable transitions during active resize
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setResizeStartDimensions({ width: chatDimensions.width, height: chatDimensions.height });
  };

  useEffect(() => {
    let animationFrameId: number;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Throttle resize updates using requestAnimationFrame for smooth performance
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      animationFrameId = requestAnimationFrame(() => {
        const deltaX = e.clientX - resizeStartPos.x;
        const deltaY = e.clientY - resizeStartPos.y;
        
        // Enhanced easing with cubic-bezier curves
        const easedDeltaX = deltaX * 0.95; // Slight resistance for more natural feel
        const easedDeltaY = deltaY * 0.95;
        
        // Ensure values are valid numbers to prevent NaN errors
        const baseWidth = Number(resizeStartDimensions.width) || 384;
        const baseHeight = Number(resizeStartDimensions.height) || 500;
        
        const newWidth = Math.max(300, Math.min(800, baseWidth + easedDeltaX));
        const newHeight = Math.max(400, Math.min(700, baseHeight + easedDeltaY));
        
        // Validate dimensions before setting to prevent NaN errors
        if (!isNaN(newWidth) && !isNaN(newHeight) && isFinite(newWidth) && isFinite(newHeight)) {
          setChatDimensions({ width: newWidth, height: newHeight });
        }
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Cancel any pending animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      // Enable smooth transition with subtle bounce effect after resize is complete
      setIsTransitioning(true);
      // Remove transition after a short delay to prevent interference with next resize
      setTimeout(() => setIsTransitioning(false), 400);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'nw-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      // Cleanup animation frame on unmount or dependency change
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resizeStartPos, resizeStartDimensions]);

  // EVENT HANDLERS

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !isMountedRef.current) return;
    
    if (!conversationId) {
      // Create conversation first, then send message
      createConversationMutation.mutate();
      return;
    }
    
    sendMessageMutation.mutate({ content: newMessage.trim() });
  }, [newMessage, conversationId, createConversationMutation, sendMessageMutation]);

  const handleStartConversation = useCallback(() => {
    if (!conversationId && !createConversationMutation.isPending && isMountedRef.current) {
      createConversationMutation.mutate();
    }
  }, [conversationId, createConversationMutation]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && isMountedRef.current) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleQuickReply = useCallback((reply: string) => {
    if (!isMountedRef.current) return;
    setNewMessage(reply);
    // Auto-focus back to input after selecting quick reply
    const timer = setTimeout(() => {
      if (isMountedRef.current && messageInputRef.current) {
        try {
          messageInputRef.current.focus();
        } catch (error) {
          console.warn('Quick reply focus failed:', error);
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  const getOtherParticipant = () => {
    if (!conversationData) return null;
    return currentUser.role === 'influencer' ? conversationData.brand : conversationData.influencer;
  };

  const otherParticipant = getOtherParticipant();

  // Return invalid config error after all hooks are called
  if (!isValidConfig) {
    return (
      <div className={`${isInline ? 'h-64' : 'h-[500px]'} flex items-center justify-center ${isInline ? '' : 'bg-white rounded-lg border'}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
          <p className="text-red-500">Invalid chat configuration</p>
        </div>
      </div>
    );
  }

  if (conversationLoading) {
    return (
      <div className={`${isInline ? 'h-64' : 'h-[500px]'} flex items-center justify-center ${isInline ? '' : 'bg-white rounded-lg border'}`}>
        <div className="text-center">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={chatRef}
      className={`${isInline ? 'h-full' : ''} flex flex-col ${isInline ? '' : 'bg-white rounded-lg border shadow-lg'} relative ${
        isTransitioning ? 'transition-all duration-300 ease-in-out' : ''
      } ${
        isResizing ? 'shadow-2xl ring-2 ring-blue-300 ring-opacity-50 scale-[1.01]' : ''
      }`}
      style={!isInline ? {
        width: `${chatDimensions.width}px`,
        height: `${chatDimensions.height}px`,
        minWidth: '300px',
        minHeight: '400px',
        maxWidth: '800px',
        maxHeight: '700px',
        transition: isTransitioning ? 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
        transformOrigin: 'bottom right'
      } : {}}
    >
      {!isInline && (
        <>
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Campaign Discussion</h3>
            </div>
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
          <p className="text-sm text-gray-500 px-4 py-2 border-b">{campaignTitle}</p>
        </>
      )}

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto ${isInline ? 'p-3' : 'p-4'} space-y-3 ${isInline ? 'bg-gray-50' : ''}`}>
          {/* Show error states */}
      {(conversationError || messagesError || createConversationMutation.error) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Chat Error</span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            {conversationError?.message || messagesError?.message || createConversationMutation.error?.message || 'An error occurred'}
          </p>
        </div>
      )}
      
      {conversationLoading ? (
        <div className="text-center py-8">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
          <p className="text-gray-500">Loading conversation...</p>
        </div>
      ) : !hasConversation && !conversationError ? (
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
                  onClick={handleStartConversation}
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
      ) : hasConversation ? (
        <>
          {messagesLoading ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
              <p className="text-gray-500">Loading messages...</p>
            </div>
          ) : messagesData && messagesData.length > 0 ? (
            <>
              {messagesData.map((message: any, index: number) => {
                const isOwn = message.senderId === currentUser.id;
                const isLastMessage = index === messagesData.length - 1;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isInline ? 'mb-2' : 'mb-3'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isOwn && (
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          <AvatarImage src={message.sender.profileImageUrl} />
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                            {message.sender?.firstName?.[0] || 'U'}{message.sender?.lastName?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`rounded-lg px-3 py-2 shadow-sm ${isOwn ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'} ${isInline ? 'max-w-xs' : 'max-w-sm'}`}>
                        <p className={`${isInline ? 'text-xs' : 'text-sm'} leading-relaxed`}>{message.content || ''}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isInline ? 'text-[10px]' : 'text-xs'} ${isOwn ? 'text-blue-100 justify-end' : 'text-gray-500'}`}>
                          <span>{message.createdAt ? formatTime(message.createdAt) : ''}</span>
                          {isOwn && (
                            <div className="flex items-center">
                              <CheckCircle className={`${isInline ? 'w-2.5 h-2.5' : 'w-3 h-3'} ml-1`} />
                              {isLastMessage && <span className="ml-1 text-[10px]">Read</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          )}
        </>
      ) : null}
      </div>

      {/* Message Input */}
      {effectiveConversationId && (
        <div className={`border-t bg-white ${isInline ? 'p-3' : 'p-4'}`}>
          {/* Quick Replies */}
          <QuickReplies 
            userRole={currentUser.role as 'brand' | 'influencer'}
            onSelectReply={handleQuickReply}
            isInline={isInline}
          />
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Textarea
                ref={messageInputRef}
                placeholder={isInline ? "Type a message..." : "Type your message..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`resize-none border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 ${isInline ? 'min-h-[32px] max-h-[80px] text-sm' : 'min-h-[40px] max-h-[120px]'}`}
                rows={1}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              className={`bg-blue-600 hover:bg-blue-700 transition-colors ${isInline ? 'px-2 h-8' : 'px-3'}`}
              size={isInline ? "sm" : "default"}
            >
              {sendMessageMutation.isPending ? (
                <Clock className={`${isInline ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
              ) : (
                <Send className={`${isInline ? 'w-3 h-3' : 'w-4 h-4'}`} />
              )}
            </Button>
          </div>
          {!isInline && (
            <p className="text-xs text-gray-500 mt-1">
              Press Enter to send, Shift+Enter for new line
            </p>
          )}
        </div>
      )}

      {/* Enhanced Resize Handle */}
      {!isInline && (
        <div 
          className={`absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize transition-all duration-200 ease-in-out ${
            isResizing 
              ? 'opacity-100 scale-150 shadow-lg' 
              : 'opacity-50 hover:opacity-100 hover:scale-110'
          }`}
          onMouseDown={handleResizeStart}
          style={{
            background: isResizing 
              ? 'linear-gradient(-45deg, transparent 25%, #3b82f6 25%, #3b82f6 35%, transparent 35%, transparent 65%, #3b82f6 65%, #3b82f6 75%, transparent 75%)'
              : 'linear-gradient(-45deg, transparent 30%, #9ca3af 30%, #9ca3af 35%, transparent 35%, transparent 65%, #9ca3af 65%, #9ca3af 70%, transparent 70%)',
            filter: isResizing ? 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.4))' : 'none',
            borderRadius: isResizing ? '2px' : '1px'
          }}
          data-testid="chat-resize-handle"
        />
      )}
    </div>
  );
}

// Error Boundary wrapper to prevent React hooks errors
export function CampaignChat(props: CampaignChatProps) {
  try {
    return <CampaignChatInner {...props} />;
  } catch (error) {
    console.warn('CampaignChat error caught:', error);
    return (
      <div className={`${props.isInline ? 'h-64' : 'h-[500px]'} flex items-center justify-center ${props.isInline ? '' : 'bg-white rounded-lg border'}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
          <p className="text-red-500">Chat temporarily unavailable</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Refresh page
          </button>
        </div>
      </div>
    );
  }
}