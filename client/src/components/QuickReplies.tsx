import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Star, 
  Calendar, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Send,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface QuickRepliesProps {
  userRole: 'brand' | 'influencer';
  onSelectReply: (message: string) => void;
  isInline?: boolean;
}

interface QuickReplyCategory {
  id: string;
  name: string;
  icon: any;
  color: string;
  replies: string[];
}

export function QuickReplies({ userRole, onSelectReply, isInline = false }: QuickRepliesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Define different quick replies based on user role
  const brandReplies: QuickReplyCategory[] = [
    {
      id: 'approval',
      name: 'Approval',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800 border-green-200',
      replies: [
        "Looks great! Approved to proceed.",
        "Perfect! Go ahead with this approach.",
        "Approved! Looking forward to seeing the results.",
        "This works perfectly. Please proceed.",
        "Great work! You have my approval."
      ]
    },
    {
      id: 'feedback',
      name: 'Feedback',
      icon: MessageSquare,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      replies: [
        "Could you make a small adjustment to...",
        "This is good, but please consider...",
        "I like the direction, but can we...",
        "Please revise the following part...",
        "Almost there! Just need to modify..."
      ]
    },
    {
      id: 'timeline',
      name: 'Timeline',
      icon: Calendar,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      replies: [
        "When can you deliver this?",
        "Please send the first draft by...",
        "What's the expected completion date?",
        "Can we move the deadline to...?",
        "Please provide an updated timeline."
      ]
    },
    {
      id: 'questions',
      name: 'Questions',
      icon: AlertCircle,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      replies: [
        "Can you provide more details about...?",
        "What's the current status on...?",
        "Do you need any additional resources?",
        "Any challenges we should be aware of?",
        "How can I help move this forward?"
      ]
    }
  ];

  const influencerReplies: QuickReplyCategory[] = [
    {
      id: 'updates',
      name: 'Progress',
      icon: Clock,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      replies: [
        "Just started working on this!",
        "50% complete, on track for deadline.",
        "Almost finished, sending for review soon.",
        "Completed! Please review when ready.",
        "Working on final touches, will send today."
      ]
    },
    {
      id: 'delivery',
      name: 'Delivery',
      icon: Send,
      color: 'bg-green-100 text-green-800 border-green-200',
      replies: [
        "Content is ready for your review!",
        "First draft attached, please feedback.",
        "Final version delivered as requested.",
        "Here's the completed deliverable.",
        "Please find the finished content attached."
      ]
    },
    {
      id: 'questions',
      name: 'Questions',
      icon: AlertCircle,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      replies: [
        "Could you clarify the requirements for...?",
        "Do you have a preference for...?",
        "When do you need this delivered by?",
        "Should I include... in the content?",
        "Any specific guidelines I should follow?"
      ]
    },
    {
      id: 'acknowledgment',
      name: 'Confirm',
      icon: ThumbsUp,
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      replies: [
        "Got it! Will work on this right away.",
        "Understood, making the changes now.",
        "Thanks for the feedback, implementing it.",
        "Perfect! I'll update accordingly.",
        "Received and noted, will adjust."
      ]
    }
  ];

  const currentReplies = userRole === 'brand' ? brandReplies : influencerReplies;

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const handleReplyClick = (reply: string) => {
    onSelectReply(reply);
    setSelectedCategory(null);
    setIsExpanded(false);
  };

  if (isInline && !isExpanded) {
    return (
      <div className="mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="text-xs h-6 px-2 text-gray-600 border-gray-200"
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          Quick Replies
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`${isInline ? 'mb-2' : 'mb-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className={`${isInline ? 'w-3 h-3' : 'w-4 h-4'} text-gray-600`} />
          <span className={`${isInline ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>
            Quick Replies
          </span>
        </div>
        {isInline && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-4 w-4 p-0 text-gray-400"
          >
            <ChevronUp className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className={`flex flex-wrap gap-1 ${isInline ? 'mb-2' : 'mb-3'}`}>
        {currentReplies.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant="outline"
              size={isInline ? "sm" : "default"}
              onClick={() => handleCategoryClick(category.id)}
              className={`${isInline ? 'h-6 px-2 text-xs' : 'h-8 px-3 text-sm'} ${
                isSelected 
                  ? category.color 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              } transition-all duration-200`}
            >
              <IconComponent className={`${isInline ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} mr-1`} />
              {category.name}
            </Button>
          );
        })}
      </div>

      {/* Quick Reply Options */}
      {selectedCategory && (
        <div className={`${isInline ? 'space-y-1' : 'space-y-2'} bg-gray-50 p-2 rounded-lg border`}>
          {currentReplies
            .find(cat => cat.id === selectedCategory)
            ?.replies.map((reply, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => handleReplyClick(reply)}
                className={`w-full justify-start ${isInline ? 'h-6 px-2 text-xs' : 'h-8 px-3 text-sm'} text-gray-700 hover:bg-white hover:shadow-sm transition-all duration-200`}
              >
                <Send className={`${isInline ? 'w-2.5 h-2.5' : 'w-3 h-3'} mr-2 text-gray-400`} />
                {reply}
              </Button>
            ))
          }
        </div>
      )}

      {/* Role indicator */}
      <div className="flex items-center justify-between mt-2">
        <Badge variant="outline" className={`${isInline ? 'text-xs px-1 h-4' : 'text-xs'} text-gray-500`}>
          {userRole === 'brand' ? 'Brand' : 'Influencer'} Suggestions
        </Badge>
        
        {!isInline && (
          <div className="text-xs text-gray-400">
            Click category • Select reply • Send
          </div>
        )}
      </div>
    </div>
  );
}