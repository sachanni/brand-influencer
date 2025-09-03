import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, User, Clock, Send, Loader2, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface CampaignQuestion {
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

interface CampaignQuestionsViewProps {
  campaignId: string;
}

export function CampaignQuestionsView({ campaignId }: CampaignQuestionsViewProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<CampaignQuestion | null>(null);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();

  // Fetch campaign questions
  const { data: questions = [], isLoading, refetch } = useQuery<CampaignQuestion[]>({
    queryKey: ['/api/campaigns', campaignId, 'questions'],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/questions`);
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error('Failed to fetch campaign questions');
      }
      const data = await response.json();
      return data.conversations || [];
    },
  });

  // Fetch messages for selected question
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/conversations', selectedQuestion?.id, 'messages'],
    queryFn: async () => {
      if (!selectedQuestion) return [];
      const response = await fetch(`/api/conversations/${selectedQuestion.id}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      return data.messages || [];
    },
    enabled: !!selectedQuestion,
  });

  const handleSendReply = async () => {
    if (!selectedQuestion || !replyText.trim()) return;

    try {
      const response = await fetch(`/api/conversations/${selectedQuestion.id}/messages`, {
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
          description: "Your response has been sent to the influencer.",
        });
        setReplyText('');
        // Refresh messages and questions
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading campaign questions...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Yet</h3>
        <p className="text-gray-600">No pre-approval questions from influencers for this campaign.</p>
        <p className="text-sm text-gray-500 mt-2">Questions will appear here when influencers ask about your campaign before applying.</p>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          className="mt-4"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[600px]">
      {/* Questions List */}
      <Card className="flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Questions ({questions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {questions.map((question) => (
                <div
                  key={question.id}
                  onClick={() => setSelectedQuestion(question)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedQuestion?.id === question.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={question.influencer.profileImageUrl} />
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {question.influencer.firstName[0]}{question.influencer.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {question.influencer.firstName} {question.influencer.lastName}
                        </p>
                        {question.unreadCount > 0 && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            {question.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{question.subject}</p>
                      {question.lastMessage && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {question.lastMessage.content}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(question.lastMessageAt).toLocaleDateString()}
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
        {selectedQuestion ? (
          <>
            <CardHeader className="flex-shrink-0 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedQuestion.influencer.profileImageUrl} />
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    {selectedQuestion.influencer.firstName[0]}{selectedQuestion.influencer.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {selectedQuestion.influencer.firstName} {selectedQuestion.influencer.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedQuestion.subject}</p>
                </div>
              </div>
            </CardHeader>
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
                            message.senderId === selectedQuestion.brand.id ? 'flex-row-reverse' : ''
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
                              message.senderId === selectedQuestion.brand.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.senderId === selectedQuestion.brand.id
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
              <p>Select a question to view the conversation</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}