import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Navigation } from "@/components/layout/navigation";
import { InfluencerNav } from "@/components/InfluencerNav";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useMilestones } from "@/hooks/useMilestones";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";
import { MilestoneProgress } from "@/components/MilestoneProgress";
import { ProductionMilestoneManager } from "@/components/ProductionMilestoneManager";
import { CampaignChat } from "@/components/CampaignChat";
import { CampaignBriefModal as EnhancedCampaignModal } from "@/components/CampaignBriefModal";
import { MyQuestionsModal } from "@/components/MyQuestionsModal";
import { toast } from "@/hooks/use-toast";
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2,
  Instagram,
  Youtube,
  Music,
  ExternalLink,
  BarChart3,
  Eye,
  Target,
  FileText,
  Clock,
  CheckCircle,
  Upload,
  Video,
  Send,
  X,
  Paperclip,
  Play,
  Plus,
  Zap,
  Loader2,
  Award,
  Sparkles,
  MapPin,
  User,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { SiInstagram, SiYoutube, SiTiktok } from "react-icons/si";
import { formatCurrency } from "@/lib/currency";
import { CampaignFilters, FilterType, SortType, SortOrder } from '@/components/CampaignFilters';
import { EnhancedCampaignCard } from '@/components/EnhancedCampaignCard';
import { CampaignCalendar, CompactCalendar } from '@/components/CampaignCalendar';
import { CampaignArchive, ArchiveSummaryWidget } from '@/components/CampaignArchive';

// Custom hook for tracking unread messages across campaigns
export function useUnreadMessages(campaignId: string, currentUserId: string, isActive = true) {
  const { data: conversationData, isLoading: conversationLoading } = useQuery({
    queryKey: ['/api/conversations/campaign', campaignId],
    enabled: !!campaignId && isActive,
    refetchInterval: isActive ? 5000 : false, // Poll every 5 seconds when active
    select: (data: any) => {
      // Ensure clean serializable data
      if (!data?.conversation) return null;
      const conv = data.conversation;
      return {
        id: conv.id,
        brandId: conv.brandId,
        influencerId: conv.influencerId,
        campaignId: conv.campaignId,
        status: conv.status,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        influencerLastReadAt: conv.influencerLastReadAt,
        brandLastReadAt: conv.brandLastReadAt
      };
    }
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', conversationData?.id, 'messages'],
    enabled: !!conversationData?.id && isActive,
    refetchInterval: isActive ? 5000 : false, // Poll every 5 seconds when active
    select: (data: any) => {
      // Ensure clean serializable message data
      if (!data?.messages || !Array.isArray(data.messages)) return [];
      return data.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        conversationId: msg.conversationId,
        createdAt: msg.createdAt,
        messageType: msg.messageType || 'text'
      }));
    }
  });

  const unreadCount = useMemo(() => {
    if (!messagesData || !conversationData || !currentUserId) return 0;
    
    // Determine user role and get appropriate last read timestamp
    const lastReadAt = conversationData.influencerLastReadAt; // For influencers
    
    if (!lastReadAt) {
      // If user has never read messages, count all messages from other users
      return messagesData.filter((msg: any) => msg.senderId !== currentUserId).length;
    }
    
    // Count messages sent after user's last read time by other users
    const lastReadTime = new Date(lastReadAt).getTime();
    return messagesData.filter((msg: any) => 
      msg.senderId !== currentUserId && 
      new Date(msg.createdAt).getTime() > lastReadTime
    ).length;
  }, [messagesData, conversationData, currentUserId]);

  return {
    unreadCount,
    conversationData,
    messagesData,
    isLoading: conversationLoading || messagesLoading
  };
}

interface CampaignResult {
  id: string;
  name: string;
  brand: string;
  impressions: string;
  engagement: string;
  reach: string;
  status: string;
}

interface BrandEvent {
  id: string;
  name: string;
  brand: string;
  date: string;
  description: string;
  status: string;
  platforms?: string[];
  endDate?: string;
  budgetRange?: string;
  fullCampaign?: any;
}

// WorkspaceButton component with notification badge
function WorkspaceButton({ proposal, onOpenWorkspace, user, buttonText, testId, className = "bg-blue-600 hover:bg-blue-700" }: any) {
  const { unreadCount } = useUnreadMessages(proposal?.campaign?.id || '', user?.id || '', false);

  return (
    <Button 
      size="sm" 
      className={`relative ${className}`}
      data-testid={testId}
      onClick={onOpenWorkspace}
    >
      {buttonText}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse shadow-lg border border-white" data-testid="workspace-notification-badge">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </Button>
  );
}

interface ProposalFormData {
  proposalText: string;
  proposedDeliverables: string[];
  proposedTimeline: string;
  proposedCompensation: string;
  portfolioLinks: string[];
  additionalNotes: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  campaignType: string;
  budget: string;
  generalStartDate: string;
  generalEndDate: string;
  platforms: string[];
  targetAudience: string;
  minimumInfluencers: number;
  budgetRange: string;
  requirements: string;
  deliverables: string[];
  applicationStatus?: string | null;
  hasApplied?: boolean;
  appliedAt?: string | null;
}

const pitchTemplates = [
  {
    id: "engaging",
    title: "🎯 Engaging Content Creator",
    template: "Hi! I'm excited about this collaboration opportunity. With [X] followers and an average engagement rate of [X]%, I create authentic content that resonates with my audience. My previous brand partnerships have consistently delivered [specific results]. I'd love to bring your brand's story to life through my unique storytelling approach and high-quality visuals that drive real engagement and conversions."
  },
  {
    id: "lifestyle",
    title: "✨ Lifestyle Influencer", 
    template: "Hello! As a lifestyle content creator, I specialize in seamlessly integrating brands into my daily content in an authentic way. My audience trusts my recommendations because I only partner with brands I genuinely use and love. I've successfully collaborated with [similar brands] and consistently achieve [specific metrics]. I'm confident I can showcase your product naturally while driving meaningful results for your campaign."
  },
  {
    id: "niche",
    title: "🎨 Niche Expert",
    template: "Hi there! I'm a specialized content creator in [your niche] with a highly engaged community of [audience description]. My expertise in this space allows me to create educational and entertaining content that converts. I've helped brands like [examples] achieve [specific results] through my detailed reviews, tutorials, and authentic recommendations. I'd love to create compelling content that showcases your product's unique value to my targeted audience."
  },
  {
    id: "storyteller",
    title: "📖 Brand Storyteller",
    template: "Hello! I'm passionate about creating compelling brand stories that connect emotionally with audiences. My content focuses on [your style/approach] and I excel at transforming product features into relatable narratives. With proven success in [specific achievements], I can help your brand build authentic connections and drive measurable engagement through creative storytelling and strategic content placement."
  },
  {
    id: "custom",
    title: "✍️ Write Custom Pitch",
    template: ""
  }
];

const platformPrefixes = {
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/@",
  youtube: "https://www.youtube.com/",
  twitter: "https://twitter.com/",
  facebook: "https://www.facebook.com/",
  linkedin: "https://www.linkedin.com/in/",
  website: "https://www."
};

// Campaign Brief Modal Component
function CampaignBriefModal({ proposal, isOpen, onOpenChange }: any) {
  const campaign = proposal?.campaign;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Campaign Brief: {campaign?.title}
          </DialogTitle>
          <DialogDescription>
            Complete campaign details and requirements for approved influencers
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Campaign Overview */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Campaign Overview</h3>
            <p className="text-blue-800">{campaign?.description}</p>
          </div>
          
          {/* Campaign Basics - Full Details for Approved Influencers */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">📅 Campaign Basics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium">Full Campaign Timeline</h4>
                </div>
                <p><strong>Start Date:</strong> {new Date(campaign?.startDate || campaign?.generalStartDate).toLocaleDateString()}</p>
                <p><strong>End Date:</strong> {new Date(campaign?.endDate).toLocaleDateString()}</p>
                <p><strong>Content Deadline:</strong> {new Date(new Date(campaign?.endDate).getTime() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <h4 className="font-medium">Campaign Duration</h4>
                </div>
                <p><strong>Total Duration:</strong> {Math.ceil((new Date(campaign?.endDate).getTime() - new Date(campaign?.startDate || campaign?.generalStartDate).getTime()) / (1000 * 60 * 60 * 24))} days</p>
                <p><strong>Content Phase:</strong> {Math.max(1, Math.ceil((new Date(campaign?.endDate).getTime() - new Date(campaign?.startDate || campaign?.generalStartDate).getTime()) / (1000 * 60 * 60 * 24)) - 2)} days</p>
              </div>
            </div>
          </div>

          {/* Compensation and Terms - Full Details */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-3">💰 Compensation and Terms</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-green-600" />
                  <h4 className="font-medium">Payment Details</h4>
                </div>
                <p className="text-lg font-semibold text-green-600 mb-1">{formatCurrency(proposal?.proposedCompensation || 0, proposal?.campaign?.currency || 'INR')}</p>
                <p><strong>Budget Range:</strong> {formatCurrency(Math.floor((proposal?.proposedCompensation || 0) * 0.8), proposal?.campaign?.currency || 'INR')} - {formatCurrency(Math.ceil((proposal?.proposedCompensation || 0) * 1.2), proposal?.campaign?.currency || 'INR')}</p>
                <p><strong>Payment Terms:</strong> {
                  (() => {
                    const paymentStructure = proposal?.campaign?.paymentStructure;
                    if (paymentStructure && typeof paymentStructure === 'object') {
                      const upfront = paymentStructure.upfront || 0;
                      const completion = paymentStructure.completion || 0; 
                      const bonus = paymentStructure.bonus || 0;
                      
                      let terms = [];
                      if (upfront > 0) terms.push(`${upfront}% Upfront`);
                      if (completion > 0) terms.push(`${completion}% on Completion`);
                      if (bonus > 0) terms.push(`${bonus}% Performance Bonus`);
                      
                      return terms.length > 0 ? terms.join(', ') : 'Custom Payment Plan';
                    }
                    return 'Custom Payment Plan'; // Configurable fallback
                  })()
                }</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium">Agreement Terms</h4>
                </div>
                <p><strong>Upfront Payment:</strong> {
                  (() => {
                    const paymentStructure = proposal?.campaign?.paymentStructure;
                    const upfrontPercentage = (paymentStructure && typeof paymentStructure === 'object') 
                      ? (paymentStructure.upfront || 50) / 100 
                      : 0.5; // Will be made configurable
                    return formatCurrency(Math.floor((proposal?.proposedCompensation || 0) * upfrontPercentage), proposal?.campaign?.currency || 'INR');
                  })()
                }</p>
                <p><strong>Completion Payment:</strong> {
                  (() => {
                    const paymentStructure = proposal?.campaign?.paymentStructure;
                    const completionPercentage = (paymentStructure && typeof paymentStructure === 'object') 
                      ? (paymentStructure.completion || 50) / 100 
                      : 0.5; // Will be made configurable
                    return formatCurrency(Math.ceil((proposal?.proposedCompensation || 0) * completionPercentage), proposal?.campaign?.currency || 'INR');
                  })()
                }</p>
                {(() => {
                  const paymentStructure = proposal?.campaign?.paymentStructure;
                  const bonusPercentage = (paymentStructure && typeof paymentStructure === 'object') 
                    ? paymentStructure.bonus || 0 
                    : 0;
                  return bonusPercentage > 0 ? (
                    <p><strong>Performance Bonus:</strong> {formatCurrency(Math.ceil((proposal?.proposedCompensation || 0) * (bonusPercentage / 100)), proposal?.campaign?.currency || 'INR')} ({bonusPercentage}%)</p>
                  ) : null;
                })()}
                <p><strong>Payment Method:</strong> Bank Transfer</p>
              </div>
            </div>
          </div>

          {/* Analytics and Goals - KPIs and Benchmarks */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">📊 Analytics and Goals</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium">Key Performance Indicators (KPIs)</h4>
                </div>
                <ul className="space-y-1 text-sm">
                  <li><strong>Target Reach:</strong> {(campaign?.expectedReach || 50000).toLocaleString()} users</li>
                  <li><strong>Engagement Rate:</strong> ≥{campaign?.targetEngagementRate || 3.5}%</li>
                  <li><strong>Conversions:</strong> {campaign?.targetConversions || 500}+ clicks/actions</li>
                  <li><strong>Brand Mentions:</strong> Minimum 2 per post</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  <h4 className="font-medium">Competitor Benchmark</h4>
                </div>
                <ul className="space-y-1 text-sm">
                  <li><strong>Industry Average:</strong> 2.1% engagement</li>
                  <li><strong>Top Competitor:</strong> 4.2% engagement</li>
                  <li><strong>Similar Campaigns:</strong> {(campaign?.expectedReach * 0.035 || 1750).toLocaleString()} avg. engagement</li>
                  <li><strong>Performance Goal:</strong> Top 20% in category</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Deliverables */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Required Deliverables
            </h3>
            <div className="bg-green-50 p-4 rounded-lg">
              <ul className="space-y-2">
                <li>• {proposal?.deliverables || "Social media posts as outlined in proposal"}</li>
                <li>• High-quality content following brand guidelines</li>
                <li>• Performance tracking and reporting</li>
              </ul>
            </div>
          </div>

          {/* Brand Feedback */}
          {proposal?.brandFeedback && (
            <div className="space-y-3">
              <h3 className="font-semibold">Brand Notes</h3>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-yellow-800">"{proposal.brandFeedback}"</p>
              </div>
            </div>
          )}

          {/* Action Items */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">Action Items</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Proposal approved ✓</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Create content by deadline</span>
              </div>
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Submit for brand approval</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Professional Contact Brand Modal Component
interface ContactBrandModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: any;
}

function ContactBrandModal({ isOpen, onOpenChange, campaign }: ContactBrandModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messageType, setMessageType] = useState('question');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [priority, setPriority] = useState('normal');
  const [isLoading, setIsLoading] = useState(false);

  const messageTemplates = {
    question: 'Hi, I have a question about the campaign requirements...',
    timeline: 'Hi, I wanted to discuss the timeline for this campaign...',
    creative: 'Hi, I have some creative ideas I\'d like to run by you...',
    technical: 'Hi, I\'m having some technical issues and need assistance...',
    custom: ''
  };

  const handleSendMessage = async () => {
    if (!campaign || !message.trim()) return;
    
    setIsLoading(true);
    try {
      if (!user || !campaign?.brandId) {
        toast({
          title: "❌ Error",
          description: "Missing user or campaign information. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // First create or find existing conversation
      const conversationData = {
        brandId: campaign.brandId,
        influencerId: (user as any).id,
        campaignId: campaign.id,
        subject: `${messageType === 'question' ? 'Question' : messageType === 'timeline' ? 'Timeline Discussion' : messageType === 'creative' ? 'Creative Ideas' : 'Technical Issue'} - ${campaign.title}`,
        priority: priority
      };
      
      const conversationResponse = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversationData),
      });
      
      if (!conversationResponse.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const { conversation } = await conversationResponse.json();
      
      // Then send the message
      const messageData = {
        content: message,
        messageType: messageType,
        attachments: [] // TODO: Handle file uploads
      };
      
      const messageResponse = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
      
      if (!messageResponse.ok) {
        throw new Error('Failed to send message');
      }
      
      // Invalidate queries to refresh conversations
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      // Success feedback
      toast({
        title: "✅ Message Sent Successfully!",
        description: "Your message has been delivered to the brand. They'll respond within 24 hours.",
        duration: 5000
      });
      
      // Reset form and close
      setMessage('');
      setFiles([]);
      setMessageType('question');
      setPriority('normal');
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "❌ Message Failed",
        description: "Unable to send your message. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Contact Brand
          </DialogTitle>
          <DialogDescription>
            Send a message to {campaign?.brand || 'Brand'} about "{campaign?.title || 'Campaign'}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Message Type Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Message Type</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  setMessageType('question');
                  setMessage(messageTemplates.question);
                }}
                className={`justify-start transition-all ${
                  messageType === 'question'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                }`}
              >
                ❓ Question
              </Button>
              <Button
                onClick={() => {
                  setMessageType('timeline');
                  setMessage(messageTemplates.timeline);
                }}
                className={`justify-start transition-all ${
                  messageType === 'timeline'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                }`}
              >
                ⏰ Timeline
              </Button>
              <Button
                onClick={() => {
                  setMessageType('creative');
                  setMessage(messageTemplates.creative);
                }}
                className={`justify-start transition-all ${
                  messageType === 'creative'
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300'
                }`}
              >
                💡 Creative Ideas
              </Button>
              <Button
                onClick={() => {
                  setMessageType('technical');
                  setMessage(messageTemplates.technical);
                }}
                className={`justify-start transition-all ${
                  messageType === 'technical'
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'bg-teal-100 text-teal-700 hover:bg-teal-200 border border-teal-300'
                }`}
              >
                🔧 Technical Issue
              </Button>
            </div>
          </div>

          {/* Priority Level */}
          <div>
            <label className="text-sm font-medium mb-3 block">Priority</label>
            <div className="flex gap-3">
              <Button
                size="sm"
                onClick={() => setPriority('low')}
                className={`transition-all ${
                  priority === 'low'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                }`}
              >
                🟢 Low
              </Button>
              <Button
                size="sm"
                onClick={() => setPriority('normal')}
                className={`transition-all ${
                  priority === 'normal'
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300'
                }`}
              >
                🟡 Normal
              </Button>
              <Button
                size="sm"
                onClick={() => setPriority('high')}
                className={`transition-all ${
                  priority === 'high'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                }`}
              >
                🔴 High
              </Button>
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="text-sm font-medium mb-3 block">Your Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* File Attachments */}
          <div>
            <label className="text-sm font-medium mb-3 block">Attachments (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="contact-file-upload"
              />
              <div className="text-center">
                <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('contact-file-upload')?.click()}
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Attach Files
                </Button>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSendMessage}
              className="bg-blue-600 hover:bg-blue-700 flex-1"
              disabled={isLoading || !message.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Campaign Workspace Modal Component
function CampaignWorkspaceModal({ proposal, isOpen, onOpenChange, user }: any) {
  const campaign = proposal?.campaign;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const queryClient = useQueryClient();

  // Request notification permission when workspace opens
  useEffect(() => {
    if (isOpen && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      } else {
        setNotificationPermission(Notification.permission);
      }
    }
  }, [isOpen]);

  // Use the custom hook with enhanced notifications when workspace is open
  const { unreadCount } = useUnreadMessages(campaign?.id || '', user?.id || '', isOpen);
  
  // Browser notification for new messages in workspace
  const prevUnreadCountRef = useRef<number>(0);
  
  // Subtle notification sound function
  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a pleasant notification tone (C-E-G chord arpeggio)
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      
      // Gentle volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
      
      oscillator.type = 'sine';
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
    } catch (error) {
      // Fallback to system beep or silence if Web Audio API is not available
      console.log('Audio notification not available');
    }
  };

  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current && unreadCount > 0) {
      const newMessageCount = unreadCount - prevUnreadCountRef.current;
      
      // Play subtle notification sound for new messages
      if (isOpen && activeTab !== "chat") {
        playNotificationSound();
      }
      
      // Show browser notification if permission granted and workspace is open
      if (notificationPermission === "granted" && isOpen && activeTab !== "chat") {
        const notification = new Notification("New Campaign Message", {
          body: `You have ${newMessageCount} new message${newMessageCount > 1 ? 's' : ''} from the brand`,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: `campaign-${campaign?.id}`,
          requireInteraction: false,
        });

        // Auto-close notification after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Optional: Add notification click handler to switch to chat tab
        notification.onclick = () => {
          setActiveTab("chat");
          notification.close();
        };
      }

      // Show in-app toast notification
      if (newMessageCount > 0 && isOpen && activeTab !== "chat") {
        toast({
          title: "💬 New Campaign Message",
          description: `You have ${newMessageCount} new message${newMessageCount > 1 ? 's' : ''} from the brand`,
          duration: 4000,
          className: "bg-blue-50 border-blue-200 text-blue-800",
        });
      }
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, notificationPermission, isOpen, activeTab, campaign?.id]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!proposal || selectedFiles.length === 0) return;
    
    try {
      setUploadProgress(10);
      
      // Simulate upload progress for UI feedback
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 20;
        });
      }, 200);
      
      // Complete upload after simulation
      setTimeout(() => {
        setUploadProgress(100);
        toast({
          title: "Files Ready for Submission! 📁",
          description: `${selectedFiles.length} file(s) uploaded and ready to submit`,
          className: "bg-blue-50 border-blue-200 text-blue-800",
        });
      }, 1000);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload content",
        variant: "destructive",
      });
      setUploadProgress(0);
    }
  };

  const handleSubmitCampaign = async () => {
    if (!proposal || selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please upload files before submitting",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Upload each file to backend
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        
        // Append file and metadata
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('description', `Content submission for ${proposal.campaign?.title}`);
        formData.append('contentType', file.type.startsWith('video/') ? 'video' : 
                                     file.type.startsWith('image/') ? 'image' : 'document');
        formData.append('platform', 'website'); // Default platform
        
        const response = await fetch(`/api/proposals/${proposal.id}/content`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          let errorMessage = `Failed to submit ${file.name}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            console.error('Error parsing error response:', parseError);
          }
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('Content submitted successfully:', result);
      }
      
      toast({
        title: "✅ Campaign Submitted Successfully!",
        description: "Your content has been sent to the brand for review. They'll get back to you within 24 hours with feedback and approval.",
        duration: 6000,
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Clear files and close modal
      setSelectedFiles([]);
      onOpenChange(false);
      setUploadProgress(0);
      
      // Refresh campaigns data
      await queryClient.invalidateQueries({ queryKey: ['/api/influencer/campaigns'] });
      
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit content",
        variant: "destructive",
      });
    }
  };

  
  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-green-600" />
            Campaign Workspace: {campaign?.title}
          </DialogTitle>
          <DialogDescription>
            Content creation and upload workspace for your approved campaign
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(proposal?.proposedCompensation || 0, proposal?.campaign?.currency || 'INR')}</div>
              <div className="text-sm text-green-700">Total Compensation</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.max(0, Math.ceil((new Date(campaign?.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
              </div>
              <div className="text-sm text-blue-700">Days Remaining</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {selectedFiles.length > 0 ? Math.min(100, selectedFiles.length * 25) : 0}%
              </div>
              <div className="text-sm text-orange-700">Content Progress</div>
            </div>
          </div>

          {/* Tabbed Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Content
              </TabsTrigger>
              <TabsTrigger value="milestones" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Milestones
              </TabsTrigger>
              <TabsTrigger value="guidelines" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Guidelines & Timeline
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2 relative">
                <MessageCircle className="w-4 h-4" />
                Chat
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse shadow-lg border border-white" data-testid="chat-tab-notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Upload Content Tab */}
            <TabsContent value="upload" className="space-y-4 mt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Content Creation Workspace</h3>
                
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Content</h4>
                  <p className="text-gray-600 mb-4">Drag and drop your videos, images, or content files here</p>
                  
                  {/* File Requirements */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
                    <h5 className="font-medium text-blue-900 mb-2">📋 Upload Requirements</h5>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p><strong>File Size:</strong> Maximum 200MB per file</p>
                      <p><strong>Video Formats:</strong> MP4, WebM, MOV, QuickTime</p>
                      <p><strong>Image Formats:</strong> JPEG, PNG, GIF, WebP</p>
                      <p><strong>Document Formats:</strong> PDF</p>
                      <p className="text-blue-600 mt-2">💡 Tip: For best quality, use MP4 format for videos</p>
                    </div>
                  </div>
                  
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*,video/*,.pdf,.doc,.docx" 
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    ref={(input) => {
                      if (input) {
                        (window as any).fileInput = input;
                      }
                    }}
                  />
                  <Button 
                    className="bg-green-600 hover:bg-green-700" 
                    data-testid="choose-files-button"
                    onClick={() => {
                      const input = document.getElementById('file-upload') as HTMLInputElement;
                      input?.click();
                    }}
                  >
                    Choose Files
                  </Button>
                </div>

                {/* Selected Files Display */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleUpload} 
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                      disabled={uploadProgress > 0 && uploadProgress < 100}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                    </Button>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSubmitCampaign}
                    className="bg-blue-600 hover:bg-blue-700 w-full"
                    disabled={selectedFiles.length === 0}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Campaign for Review
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Production Milestones Tab */}
            <TabsContent value="milestones" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Campaign Progress Tracker</h3>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Production Ready
                  </Badge>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 rounded-full p-2 flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Automated Workflow</h4>
                      <p className="text-sm text-blue-800 mb-2">
                        Complete each milestone to progress through your campaign. Publishing milestone automatically triggers bonus payment.
                      </p>
                      <div className="text-xs text-blue-700 bg-blue-100 rounded px-2 py-1 inline-block">
                        💡 Publishing milestone requires Instagram/TikTok/YouTube URL
                      </div>
                    </div>
                  </div>
                </div>

                {/* Production Milestone Manager */}
                {proposal?.id && (
                  <ProductionMilestoneManager 
                    proposalId={proposal.id}
                    contentId={proposal.contentId}
                    className="bg-white rounded-lg border shadow-sm p-4"
                  />
                )}

                {!proposal?.id && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No active campaign proposal found</p>
                    <p className="text-sm text-gray-500 mt-1">Apply to a campaign to start tracking milestones</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Guidelines & Timeline Tab */}
            <TabsContent value="guidelines" className="space-y-6 mt-6">
              {/* Content Guidelines */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Content Guidelines
                </h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Follow brand colors and aesthetic guidelines</li>
                  <li>• Include brand mentions as specified</li>
                  <li>• Maintain authentic voice while promoting product</li>
                  <li>• Submit content 48 hours before posting deadline</li>
                </ul>
              </div>

              {/* Campaign Timeline */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Campaign Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium">Proposal Approved</div>
                      <div className="text-sm text-gray-600">Campaign is ready to begin</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Content Creation Phase</div>
                      <div className="text-sm text-gray-600">Create and upload content for review</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Upload className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium">Content Submission</div>
                      <div className="text-sm text-gray-600">Submit final content by {new Date(campaign?.endDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Close Workspace
                </Button>
              </div>
            </TabsContent>

            {/* Chat Tab Content */}
            <TabsContent value="chat" className="mt-4">
              <div className="h-[400px] border rounded-lg overflow-hidden bg-white">
                <CampaignChat 
                  campaignId={campaign?.id || ''}
                  proposalId={proposal?.id || ''}
                  influencerId={user?.id || ''}
                  brandId={campaign?.brandId || ''}
                  currentUser={{ 
                    id: user?.id || '',
                    role: 'influencer', 
                    firstName: user?.firstName || '', 
                    lastName: user?.lastName || '' 
                  }}
                  campaignTitle={campaign?.title || ''}
                  isActive={activeTab === 'chat'}
                  isInline={true}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* Contact Brand Modal */}
      <ContactBrandModal
        isOpen={showContactModal}
        onOpenChange={setShowContactModal}
        campaign={campaign}
      />
      
    </Dialog>
    </>
  );
}

// Component to handle approved content publishing - Production Ready
function ApprovedContentActions({ proposalId }: { proposalId: string }) {
  const { user } = useAuth();
  const [publishingContentId, setPublishingContentId] = useState<string | null>(null);
  const [publishingContent, setPublishingContent] = useState<any | null>(null);
  const [livePostUrl, setLivePostUrl] = useState('');
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [hasValidated, setHasValidated] = useState(false);
  const queryClient = useQueryClient();

  // Fetch approved content for this proposal
  const { data: approvedContent } = useQuery({
    queryKey: ['/api/influencer/content', proposalId],
    queryFn: async () => {
      const response = await fetch(`/api/influencer/content?proposalId=${proposalId}`);
      if (!response.ok) throw new Error('Failed to fetch content');
      return response.json();
    },
    enabled: !!proposalId
  });

  const publishContentMutation = useMutation({
    mutationFn: async ({ contentId, livePostUrl }: { contentId: string; livePostUrl: string }) => {
      const response = await fetch(`/api/influencer/content/${contentId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ livePostUrl }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Enhanced error handling with specific error codes
        const errorMessage = data.message || 'Failed to publish content';
        const errorCode = data.code || 'UNKNOWN_ERROR';
        
        switch (errorCode) {
          case 'ALREADY_PUBLISHED':
            throw new Error(`This content was already published on ${new Date(data.data?.publishedAt).toLocaleDateString()}`);
          case 'INVALID_URL':
            throw new Error(`Invalid URL for ${data.data?.expectedPlatform}: ${data.message}`);
          case 'RATE_LIMIT_EXCEEDED':
            throw new Error(`Too many publish requests. Please wait ${data.retryAfter || 60} seconds before trying again.`);
          case 'INVALID_STATUS':
            throw new Error(`Content status changed to "${data.data?.currentStatus}". Please refresh the page.`);
          default:
            throw new Error(errorMessage);
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      const publishedAt = new Date(data.data.publishedAt).toLocaleString();
      toast({
        title: "✅ Content Published Successfully!",
        description: `Your ${data.data.contentType} for ${data.data.platform} is now live (${publishedAt})`,
        duration: 5000,
      });
      
      // Invalidate multiple cache entries
      queryClient.invalidateQueries({ queryKey: ['/api/influencer/content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/influencer/campaigns'] });
      
      resetForm();
    },
    onError: (error: Error) => {
      console.error('Publish error:', error);
      toast({
        title: "❌ Publishing Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 8000,
      });
    }
  });

  // Validation functions
  const validateUrl = (url: string, platform: string, contentType: string): string => {
    if (!url.trim()) return ''; // URL is optional
    
    const trimmed = url.trim();
    
    // Basic URL validation
    try {
      new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    } catch {
      return 'Please enter a valid URL';
    }
    
    // Platform-specific validation
    const platformPatterns: Record<string, RegExp> = {
      instagram: /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|tv|reel)\//,
      tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.]+\/video\//,
      youtube: /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)\w+/,
      facebook: /^https?:\/\/(www\.)?facebook\.com\/.*\/(posts|videos)\//,
      twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\//
    };
    
    const pattern = platformPatterns[platform.toLowerCase()];
    if (pattern && !pattern.test(trimmed)) {
      return `Please enter a valid ${platform.charAt(0).toUpperCase() + platform.slice(1)} post URL`;
    }
    
    return '';
  };
  
  const resetForm = () => {
    setShowPublishForm(false);
    setLivePostUrl('');
    setPublishingContentId(null);
    setPublishingContent(null);
    setUrlError('');
    setHasValidated(false);
  };
  
  const handlePublishContent = (content: any) => {
    setPublishingContentId(content.id);
    setPublishingContent(content);
    setShowPublishForm(true);
    setLivePostUrl('');
    setUrlError('');
    setHasValidated(false);
  };
  
  const handleUrlChange = (value: string) => {
    setLivePostUrl(value);
    if (hasValidated && publishingContent) {
      const error = validateUrl(value, publishingContent.platform, publishingContent.contentType);
      setUrlError(error);
    }
  };

  const handleConfirmPublish = () => {
    if (!publishingContentId || !publishingContent) return;
    
    setHasValidated(true);
    const error = validateUrl(livePostUrl, publishingContent.platform, publishingContent.contentType);
    setUrlError(error);
    
    if (error) return; // Don't submit if there's a validation error
    
    publishContentMutation.mutate({ 
      contentId: publishingContentId, 
      livePostUrl: livePostUrl.trim() 
    });
  };
  
  const getPlatformExample = (platform: string): string => {
    const examples: Record<string, string> = {
      instagram: 'https://instagram.com/p/ABC123xyz',
      tiktok: 'https://tiktok.com/@username/video/1234567890',
      youtube: 'https://youtube.com/watch?v=ABC123xyz',
      facebook: 'https://facebook.com/username/posts/1234567890',
      twitter: 'https://twitter.com/username/status/1234567890'
    };
    return examples[platform.toLowerCase()] || 'https://platform.com/post/123';
  };

  // Filter for approved content that hasn't been published yet
  const approvedNotLive = approvedContent?.filter((content: any) => 
    content.status === 'approved'
  ) || [];

  if (approvedNotLive.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
        <h4 className="font-medium text-green-900 mb-2">🎉 Content Approved - Ready to Publish!</h4>
        <p className="text-sm text-green-800 mb-3">
          Your content has been approved by the brand. Publish it on your social media and provide the live post URL below.
        </p>
        {approvedNotLive.map((content: any) => (
          <div key={content.id} className="flex items-center justify-between p-2 bg-white rounded border mb-2 last:mb-0">
            <div>
              <p className="font-medium text-sm">{content.title}</p>
              <p className="text-xs text-gray-600">{content.platform} • {content.contentType}</p>
            </div>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handlePublishContent(content)}
              data-testid={`publish-content-${content.id}`}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Publish Live
            </Button>
          </div>
        ))}
      </div>

      {/* Enhanced Publish Form Dialog */}
      <Dialog open={showPublishForm} onOpenChange={resetForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-green-600" />
              Publish Content Live
            </DialogTitle>
            <p className="text-sm text-gray-600">
              {publishingContent && (
                `Publishing "${publishingContent.title}" to ${publishingContent.platform.charAt(0).toUpperCase() + publishingContent.platform.slice(1)}`
              )}
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {publishingContent && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {publishingContent.contentType === 'video' ? (
                      <Play className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-blue-900">{publishingContent.title}</p>
                    <p className="text-xs text-blue-700 mt-1">
                      {publishingContent.platform.charAt(0).toUpperCase() + publishingContent.platform.slice(1)} • {publishingContent.contentType}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="live-post-url" className="text-sm font-medium">
                Live Post URL 
                <span className="text-gray-500 font-normal">(Optional)</span>
              </Label>
              <Input
                id="live-post-url"
                value={livePostUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={publishingContent ? getPlatformExample(publishingContent.platform) : "https://platform.com/post/123"}
                className={`mt-2 ${urlError ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                disabled={publishContentMutation.isPending}
              />
              {urlError && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {urlError}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {publishingContent && (
                  `Example: ${getPlatformExample(publishingContent.platform)}`
                )}
              </p>
            </div>
            
            {publishContentMutation.isPending && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="animate-spin">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="text-sm text-yellow-800">Publishing content...</p>
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleConfirmPublish}
                disabled={publishContentMutation.isPending || !!urlError}
                className="bg-green-600 hover:bg-green-700 flex-1"
                data-testid="confirm-publish-button"
              >
                {publishContentMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Published
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={resetForm}
                disabled={publishContentMutation.isPending}
                data-testid="cancel-publish-button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook to detect mobile device
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return isMobile;
}

// Campaign Card Component (reusable for both mobile and desktop)
function CampaignCard({ campaign, onApplyToCampaign, isMobile = false }: any) {
  const platformIcons = {
    instagram: SiInstagram,
    tiktok: SiTiktok,
    youtube: SiYoutube,
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm group hover:scale-[1.02] ${isMobile ? 'mb-4' : ''}`}>
      <CardHeader className={isMobile ? 'pb-3' : 'pb-4'}>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className={`font-bold line-clamp-2 text-slate-800 dark:text-slate-200 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            {campaign.title}
          </CardTitle>
          <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 dark:from-blue-900 dark:to-purple-900 dark:text-blue-200 whitespace-nowrap">
            {campaign.campaignType.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={`text-slate-600 dark:text-slate-400 line-clamp-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
          {campaign.description}
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <CreditCard className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-emerald-500`} />
            <span className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
              {campaign.budgetRange || 'Budget negotiable'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Calendar className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-500`} />
            <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>
              {campaign.generalStartDate || 'Start date TBD'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Users className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-purple-500`} />
            <span className={`${isMobile ? 'text-sm' : 'text-base'}`}>
              {campaign.minimumInfluencers} influencer{campaign.minimumInfluencers > 1 ? 's' : ''} needed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {campaign.platforms?.map((platform: string) => {
            const Icon = platformIcons[platform as keyof typeof platformIcons];
            return Icon ? (
              <div key={platform} className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                <Icon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                <span className="text-xs capitalize font-medium">{platform}</span>
              </div>
            ) : (
              <Badge key={platform} variant="outline" className="text-xs capitalize">
                {platform}
              </Badge>
            );
          })}
        </div>

        {campaign.hasApplied ? (
          <div className="w-full space-y-2">
            <Button variant="secondary" className="w-full" disabled>
              {campaign.applicationStatus === 'pending' && '⏳ Application Submitted'}
              {campaign.applicationStatus === 'approved' && '✅ Approved'}
              {campaign.applicationStatus === 'rejected' && '❌ Not Selected'}
              {campaign.applicationStatus === 'paid' && '💰 Payment Processing'}
            </Button>
            <div className="text-xs text-slate-500 text-center">
              Applied {campaign.appliedAt && new Date(campaign.appliedAt).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <Button 
            className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 ${isMobile ? 'h-12 text-base' : 'h-11'}`}
            onClick={() => onApplyToCampaign(campaign)}
          >
            <Sparkles className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2 animate-pulse`} />
            Apply Now
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Enhanced Responsive All Campaigns Modal Component
function AllCampaignsModal({ isOpen, onOpenChange, campaigns, onApplyToCampaign }: any) {
  const isMobile = useIsMobile();
  
  const content = (
    <div className={`${isMobile ? 'h-full' : ''}`}>
      {campaigns && campaigns.length > 0 ? (
        <div className={isMobile ? 'space-y-4 pb-safe' : 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'}>
          {campaigns.map((campaign: Campaign, index: number) => (
            <div
              key={campaign.id}
              className={`transform transition-all duration-300 ${
                isMobile ? 'animate-in slide-in-from-bottom-4' : 'animate-in fade-in-0 zoom-in-95'
              }`}
              style={{
                animationDelay: `${index * (isMobile ? 100 : 50)}ms`,
                animationFillMode: 'both'
              }}
            >
              <CampaignCard 
                campaign={campaign} 
                onApplyToCampaign={onApplyToCampaign}
                isMobile={isMobile}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={`text-center ${isMobile ? 'py-16' : 'py-12'}`}>
          <div className={`${isMobile ? 'bg-slate-50 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800'} rounded-lg p-8 animate-in fade-in-50 zoom-in-95`}>
            <Target className={`mx-auto ${isMobile ? 'h-16 w-16' : 'h-12 w-12'} text-slate-400 mb-4 animate-pulse`} />
            <h3 className={`${isMobile ? 'text-xl' : 'text-lg'} font-medium text-slate-900 dark:text-slate-100 mb-2`}>
              No Active Campaigns
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              There are currently no active campaigns available. Check back soon for new opportunities!
            </p>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[90vh] p-0 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 border-0 rounded-t-3xl shadow-2xl"
        >
          <SheetHeader className="px-6 py-6 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4 animate-pulse" />
            <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Target className="h-6 w-6 text-blue-500" />
              Available Campaigns
            </SheetTitle>
            <SheetDescription className="text-slate-600 dark:text-slate-400 text-center">
              Swipe up to discover brand campaigns that match your style
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-contain">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 border-0 shadow-2xl p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-500" />
            All Available Campaigns
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400 mt-2">
            Discover and apply to brand campaigns that match your content style and audience
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-500">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Enhanced Proposal Submission Modal Component  
function ProposalSubmissionModal({ isOpen, onOpenChange, campaign, onSubmitProposal }: any) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('pitch');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [proposalForm, setProposalForm] = useState<ProposalFormData>({
    proposalText: "",
    proposedDeliverables: [""],
    proposedTimeline: "",
    proposedCompensation: "",
    portfolioLinks: [""],
    additionalNotes: "",
  });

  const [selectedDeliverables, setSelectedDeliverables] = useState<Array<{
    id: string;
    platform: string;
    type: string;
    quantity: number;
    description: string;
    icon: string;
  }>>([]);

  const [selectedTimeline, setSelectedTimeline] = useState<string>('');

  // Preset timeline options
  const timelineOptions = [
    {
      id: 'rush',
      title: '24-48 Hours',
      description: 'Express delivery',
      detail: 'Perfect for urgent campaigns',
      icon: '⚡',
      color: 'from-red-500 to-orange-500',
      bgColor: 'from-red-50 to-orange-50'
    },
    {
      id: 'quick',
      title: '3-5 Days',
      description: 'Quick turnaround',
      detail: 'Good balance of speed and quality',
      icon: '🚀',
      color: 'from-orange-500 to-yellow-500',
      bgColor: 'from-orange-50 to-yellow-50'
    },
    {
      id: 'standard',
      title: '1 Week',
      description: 'Standard timeline',
      detail: 'Recommended for quality content',
      icon: '📅',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'from-blue-50 to-indigo-50'
    },
    {
      id: 'extended',
      title: '2-3 Weeks',
      description: 'Extended timeline',
      detail: 'Premium quality and planning',
      icon: '🎯',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50'
    },
    {
      id: 'custom',
      title: 'Custom Timeline',
      description: 'Set your own schedule',
      detail: 'Flexible delivery dates',
      icon: '⏰',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50'
    }
  ];

  // Preset deliverable templates
  const deliverableTemplates = [
    {
      id: 'ig-reel',
      platform: 'Instagram',
      type: 'Reel',
      baseDescription: 'Instagram Reel',
      icon: '🎬',
      color: 'from-pink-500 to-rose-500'
    },
    {
      id: 'ig-post',
      platform: 'Instagram',
      type: 'Post',
      baseDescription: 'Instagram Post',
      icon: '📸',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'ig-story',
      platform: 'Instagram',
      type: 'Story',
      baseDescription: 'Instagram Story',
      icon: '📱',
      color: 'from-orange-500 to-pink-500'
    },
    {
      id: 'yt-video',
      platform: 'YouTube',
      type: 'Video',
      baseDescription: 'YouTube Video',
      icon: '🎥',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'yt-short',
      platform: 'YouTube',
      type: 'Short',
      baseDescription: 'YouTube Short',
      icon: '📹',
      color: 'from-red-400 to-orange-500'
    },
    {
      id: 'tt-video',
      platform: 'TikTok',
      type: 'Video',
      baseDescription: 'TikTok Video',
      icon: '🎵',
      color: 'from-gray-800 to-gray-900'
    },
    {
      id: 'brand-mention',
      platform: 'Cross-platform',
      type: 'Brand Mention',
      baseDescription: 'Brand mention in bio/description',
      icon: '🏷️',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'product-placement',
      platform: 'Cross-platform',
      type: 'Product Placement',
      baseDescription: 'Product placement in content',
      icon: '📦',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const steps = [
    { id: 'pitch', title: 'Your Pitch', icon: '🎯' },
    { id: 'deliverables', title: 'Deliverables', icon: '📋' },
    { id: 'timeline', title: 'Timeline', icon: '⏰' },
    { id: 'compensation', title: 'Compensation', icon: '💰' },
    { id: 'portfolio', title: 'Portfolio', icon: '📁' },
    { id: 'review', title: 'Review', icon: '👀' }
  ];

  const selectPitchTemplate = (template: string) => {
    setProposalForm(prev => ({ ...prev, proposalText: template }));
  };

  // Timeline selection handlers
  const selectTimelineOption = (option: typeof timelineOptions[0]) => {
    setSelectedTimeline(option.title);
    setProposalForm(prev => ({
      ...prev,
      proposedTimeline: option.title
    }));
  };

  const setCustomTimeline = (timeline: string) => {
    setSelectedTimeline(timeline);
    setProposalForm(prev => ({
      ...prev,
      proposedTimeline: timeline
    }));
  };

  // Step validation functions
  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Pitch
        return proposalForm.proposalText.trim().length > 0;
      case 1: // Deliverables
        return selectedDeliverables.length > 0 || proposalForm.proposedDeliverables.some(d => d.trim().length > 0);
      case 2: // Timeline
        return selectedTimeline.length > 0 || proposalForm.proposedTimeline.length > 0;
      case 3: // Compensation
        return proposalForm.proposedCompensation.trim().length > 0;
      case 4: // Portfolio
        return proposalForm.portfolioLinks.some(l => l.trim().length > 0);
      default:
        return true;
    }
  };

  const isStepAccessible = (stepIndex: number): boolean => {
    if (stepIndex === 0) return true;
    // Check if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!completedSteps.has(i)) return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        setActiveTab(steps[currentStep + 1].id);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setActiveTab(steps[currentStep - 1].id);
    }
  };

  const handleTabChange = (tabId: string) => {
    const stepIndex = steps.findIndex(step => step.id === tabId);
    if (stepIndex !== -1 && isStepAccessible(stepIndex)) {
      setCurrentStep(stepIndex);
      setActiveTab(tabId);
    }
  };

  const isFormComplete = () => {
    return steps.slice(0, 5).every((_, index) => validateStep(index));
  };

  // Update proposalForm when selectedDeliverables changes for real-time validation
  const updateProposalFormDeliverables = () => {
    const formattedDeliverables = formatDeliverables();
    if (formattedDeliverables.length > 0) {
      setProposalForm(prev => ({
        ...prev,
        proposedDeliverables: formattedDeliverables
      }));
    }
  };

  const addPresetDeliverable = (template: typeof deliverableTemplates[0]) => {
    const newDeliverable = {
      id: `${template.id}-${Date.now()}`,
      platform: template.platform,
      type: template.type,
      quantity: 1,
      description: template.baseDescription,
      icon: template.icon
    };
    setSelectedDeliverables(prev => [...prev, newDeliverable]);
  };

  const addCustomDeliverable = () => {
    const newDeliverable = {
      id: `custom-${Date.now()}`,
      platform: 'Custom',
      type: 'Custom',
      quantity: 1,
      description: '',
      icon: '✏️'
    };
    setSelectedDeliverables(prev => [...prev, newDeliverable]);
  };

  const removeSelectedDeliverable = (id: string) => {
    setSelectedDeliverables(prev => prev.filter(d => d.id !== id));
  };

  const updateDeliverableQuantity = (id: string, quantity: number) => {
    setSelectedDeliverables(prev => 
      prev.map(d => d.id === id ? { ...d, quantity: Math.max(1, quantity) } : d)
    );
  };

  const updateDeliverableDescription = (id: string, description: string) => {
    setSelectedDeliverables(prev => 
      prev.map(d => d.id === id ? { ...d, description } : d)
    );
  };

  // Update proposalForm when selectedDeliverables changes
  const formatDeliverables = () => {
    return selectedDeliverables.map(d => 
      d.quantity > 1 
        ? `${d.quantity}x ${d.description}` 
        : d.description
    ).filter(d => d.trim());
  };

  // Legacy functions for compatibility
  const addDeliverable = () => {
    addCustomDeliverable();
  };

  const removeDeliverable = (index: number) => {
    // Convert to new system if needed
    if (selectedDeliverables.length === 0) {
      setProposalForm(prev => ({
        ...prev,
        proposedDeliverables: prev.proposedDeliverables.filter((_, i) => i !== index)
      }));
    }
  };

  const updateDeliverable = (index: number, value: string) => {
    // Convert to new system if needed
    if (selectedDeliverables.length === 0) {
      setProposalForm(prev => ({
        ...prev,
        proposedDeliverables: prev.proposedDeliverables.map((d, i) => i === index ? value : d)
      }));
    }
  };

  const addPortfolioLinkWithPrefix = (platform: string) => {
    const prefix = platformPrefixes[platform as keyof typeof platformPrefixes] || 'https://www.';
    setProposalForm(prev => ({
      ...prev,
      portfolioLinks: [...prev.portfolioLinks, prefix]
    }));
  };

  const removePortfolioLink = (index: number) => {
    setProposalForm(prev => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.filter((_, i) => i !== index)
    }));
  };

  const updatePortfolioLink = (index: number, value: string) => {
    let processedValue = value.trim();
    if (processedValue && !processedValue.startsWith('http://') && !processedValue.startsWith('https://')) {
      processedValue = 'https://' + processedValue;
    }
    
    setProposalForm(prev => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.map((l, i) => i === index ? processedValue : l)
    }));
  };

  const getPlatformIcon = (url: string) => {
    if (url.includes('instagram.com') || url.includes('instagr.am')) return <SiInstagram className="h-4 w-4 text-pink-500" />;
    if (url.includes('tiktok.com')) return <SiTiktok className="h-4 w-4 text-black" />;
    if (url.includes('youtube.com') || url.includes('youtu.be')) return <SiYoutube className="h-4 w-4 text-red-500" />;
    return <ExternalLink className="h-4 w-4 text-gray-500" />;
  };

  const getPricingIndicator = (compensation: string) => {
    const numericValue = parseFloat(compensation.replace(/[^0-9.]/g, ''));
    if (isNaN(numericValue)) return null;
    
    // Check if value is in thousands (K) or lakhs (L)
    if (compensation.toLowerCase().includes('l') || numericValue >= 100000) {
      return { color: 'text-red-500', bg: 'bg-red-50', label: 'Premium Rate', icon: '🔴' };
    } else if (compensation.toLowerCase().includes('k') && numericValue >= 50) {
      return { color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Market Rate', icon: '🟡' };
    } else if (numericValue > 0) {
      return { color: 'text-green-500', bg: 'bg-green-50', label: 'Competitive', icon: '🟢' };
    }
    return null;
  };

  const handleSubmit = () => {
    // Merge traditional and new deliverables
    const allDeliverables = [
      ...formatDeliverables(),
      ...proposalForm.proposedDeliverables.filter(d => d.trim())
    ];
    
    const cleanedProposal = {
      ...proposalForm,
      proposedDeliverables: allDeliverables,
      portfolioLinks: proposalForm.portfolioLinks.filter(l => l.trim()),
    };
    onSubmitProposal(campaign.id, cleanedProposal);
    
    // Reset form
    setProposalForm({
      proposalText: "",
      proposedDeliverables: [""],
      proposedTimeline: "",
      proposedCompensation: "",
      portfolioLinks: [""],
      additionalNotes: "",
    });
  };

  const formContent = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
      <div className="mb-6">
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isActive = currentStep === index;
            const isAccessible = isStepAccessible(index);
            
            return (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 text-white'
                        : isAccessible
                          ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={() => isAccessible && handleTabChange(step.id)}
                >
                  {isCompleted ? '✓' : step.icon}
                </div>
                <div className={`ml-2 text-xs font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Tab Navigation */}
        <TabsList className="grid w-full grid-cols-6 bg-gray-100 border-2 border-gray-300 rounded-xl p-1">
          {steps.map((step, index) => {
            const isAccessible = isStepAccessible(index);
            const colors = [
              'data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:border-orange-400 hover:bg-orange-100 hover:border-orange-300',
              'data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:border-green-400 hover:bg-green-100 hover:border-green-300',
              'data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:border-blue-400 hover:bg-blue-100 hover:border-blue-300',
              'data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:border-emerald-400 hover:bg-emerald-100 hover:border-emerald-300',
              'data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:border-purple-400 hover:bg-purple-100 hover:border-purple-300',
              'data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:border-indigo-400 hover:bg-indigo-100 hover:border-indigo-300'
            ];
            
            return (
              <TabsTrigger 
                key={step.id}
                value={step.id} 
                disabled={!isAccessible}
                className={`data-[state=active]:bg-gradient-to-r data-[state=active]:text-white data-[state=active]:border-2 transition-all duration-200 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${colors[index]}`}
                onClick={() => handleTabChange(step.id)}
              >
                {step.title}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <TabsContent value="pitch" className="space-y-4 p-6 border-2 border-orange-400 bg-gradient-to-br from-orange-50/80 to-white shadow-lg hover:shadow-xl hover:border-orange-500 transition-all duration-200 rounded-xl">
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
              <Zap className="h-5 w-5 text-orange-500" />
              Your Pitch
              <span className="text-red-500">*</span>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                💡 Choose a template or write custom
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {pitchTemplates.map((template) => (
                  <Button
                    key={template.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => selectPitchTemplate(template.template)}
                    className={`text-left h-auto p-3 justify-start ${
                      proposalForm.proposalText === template.template
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'bg-white/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-sm font-medium">{template.title}</div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Textarea
                placeholder="🎯 Craft your compelling pitch here..."
                value={proposalForm.proposalText}
                onChange={(e) => setProposalForm(prev => ({ ...prev, proposalText: e.target.value }))}
                rows={5}
                className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 rounded-xl"
                required
              />
              <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                {proposalForm.proposalText.length}/500
              </div>
            </div>
        </div>
      </TabsContent>

      <TabsContent value="deliverables" className="space-y-4 p-6 border-2 border-green-400 bg-gradient-to-br from-green-50/80 to-white shadow-lg hover:shadow-xl hover:border-green-500 transition-all duration-200 rounded-xl">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
            <Target className="h-5 w-5 text-green-500" />
            Proposed Deliverables
          </div>
          
          {/* Preset Deliverable Templates */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span>🎯</span> Choose from popular deliverables
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {deliverableTemplates.map((template) => (
                <Button
                  key={template.id}
                  type="button"
                  variant="outline"
                  onClick={() => addPresetDeliverable(template)}
                  className={`h-auto p-3 flex flex-col items-center gap-2 bg-gradient-to-r ${template.color.replace('500', '50').replace('600', '100').replace('800', '100').replace('900', '100')} hover:scale-105 transition-all duration-200 border-2`}
                >
                  <span className="text-2xl">{template.icon}</span>
                  <div className="text-center">
                    <div className="font-medium text-xs">{template.type}</div>
                    <div className="text-xs text-gray-600">{template.platform}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Selected Deliverables */}
          {selectedDeliverables.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span>📋</span> Selected Deliverables
              </h4>
              <div className="space-y-3">
                {selectedDeliverables.map((deliverable) => (
                  <div key={deliverable.id} className="p-4 bg-white/80 border-2 border-green-200 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{deliverable.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{deliverable.platform} {deliverable.type}</div>
                          <div className="text-xs text-gray-600">Quantity: {deliverable.quantity}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-lg">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateDeliverableQuantity(deliverable.id, deliverable.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            -
                          </Button>
                          <span className="px-2 text-sm font-medium min-w-8 text-center">{deliverable.quantity}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateDeliverableQuantity(deliverable.id, deliverable.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSelectedDeliverable(deliverable.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Input
                      placeholder="Add specific details about this deliverable..."
                      value={deliverable.description}
                      onChange={(e) => updateDeliverableDescription(deliverable.id, e.target.value)}
                      className="text-sm bg-white border-green-200 focus:border-green-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Deliverable Option */}
          <div className="space-y-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={addCustomDeliverable}
              className="w-full bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-dashed border-green-300 hover:border-green-400 text-green-700 hover:text-green-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Deliverable
            </Button>
          </div>
          
          {/* Legacy support for text-based deliverables */}
          {proposalForm.proposedDeliverables.some(d => d.trim()) && selectedDeliverables.length === 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Text-based deliverables:</h4>
              {proposalForm.proposedDeliverables.map((deliverable, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="e.g., 1 Instagram Reel + 3 Stories + Brand mention in bio"
                      value={deliverable}
                      onChange={(e) => updateDeliverable(index, e.target.value)}
                      className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>
                  {proposalForm.proposedDeliverables.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDeliverable(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="timeline" className="space-y-4 p-6 border-2 border-blue-400 bg-gradient-to-br from-blue-50/80 to-white shadow-lg hover:shadow-xl hover:border-blue-500 transition-all duration-200 rounded-xl">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
            <Clock className="h-5 w-5 text-blue-500" />
            Timeline
          </div>
          
          {/* Timeline Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span>⏱️</span> Choose your delivery timeline
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {timelineOptions.slice(0, 4).map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant="outline"
                  onClick={() => selectTimelineOption(option)}
                  className={`h-auto p-4 text-left bg-gradient-to-r ${option.bgColor} hover:scale-105 transition-all duration-200 border-2 ${
                    selectedTimeline === option.title 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">{option.title}</div>
                      <div className="text-sm text-slate-600 font-medium">{option.description}</div>
                      <div className="text-xs text-slate-500 mt-1">{option.detail}</div>
                    </div>
                    {selectedTimeline === option.title && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
            
            {/* Custom Timeline Option */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => selectTimelineOption(timelineOptions[4])}
                className={`w-full h-auto p-4 text-left bg-gradient-to-r ${timelineOptions[4].bgColor} hover:scale-105 transition-all duration-200 border-2 ${
                  selectedTimeline === timelineOptions[4].title || (proposalForm.proposedTimeline && !timelineOptions.slice(0, 4).some(opt => opt.title === selectedTimeline))
                    ? 'border-purple-500 ring-2 ring-purple-200'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{timelineOptions[4].icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">{timelineOptions[4].title}</div>
                    <div className="text-sm text-slate-600 font-medium">{timelineOptions[4].description}</div>
                    <div className="text-xs text-slate-500 mt-1">{timelineOptions[4].detail}</div>
                  </div>
                  {(selectedTimeline === timelineOptions[4].title || (proposalForm.proposedTimeline && !timelineOptions.slice(0, 4).some(opt => opt.title === selectedTimeline))) && (
                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </Button>
              
              {/* Custom Timeline Input */}
              {(selectedTimeline === timelineOptions[4].title || (proposalForm.proposedTimeline && !timelineOptions.slice(0, 4).some(opt => opt.title === selectedTimeline))) && (
                <div className="ml-11">
                  <Input
                    placeholder="e.g., 10 days, By March 15th, After product launch..."
                    value={proposalForm.proposedTimeline === timelineOptions[4].title ? '' : proposalForm.proposedTimeline}
                    onChange={(e) => setCustomTimeline(e.target.value)}
                    className="bg-white border-purple-200 focus:border-purple-400"
                  />
                </div>
              )}
            </div>
            
            <div className="text-sm text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              💡 Choose a realistic timeline that allows for quality content creation
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="compensation" className="space-y-4 p-6 border-2 border-emerald-400 bg-gradient-to-br from-emerald-50/80 to-white shadow-lg hover:shadow-xl hover:border-emerald-500 transition-all duration-200 rounded-xl">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
            <CreditCard className="h-5 w-5 text-emerald-500" />
            Compensation
          </div>
          
          {/* Campaign Budget Information */}
          {campaign?.budget && (
            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-300 dark:border-emerald-700 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                <span>💰</span>
                <span>Campaign Budget Range: {campaign.budget}</span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                💡 Your compensation proposal should align with this budget range
              </p>
            </div>
          )}
          
          <div className="relative">
            <Input
              placeholder={campaign?.budget ? `Within ${campaign.budget} range, e.g., ₹1.5L, Product + ₹80K, or Negotiable` : "e.g., ₹40K, Product + ₹15K, or Negotiable"}
              value={proposalForm.proposedCompensation}
              onChange={(e) => setProposalForm(prev => ({ ...prev, proposedCompensation: e.target.value }))}
              className="bg-white/80 dark:bg-slate-800/80 pr-20"
            />
            {(() => {
              const indicator = getPricingIndicator(proposalForm.proposedCompensation);
              return indicator ? (
                <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 rounded-full text-xs font-medium ${indicator.bg} ${indicator.color} flex items-center gap-1`}>
                  <span>{indicator.icon}</span>
                  <span>{indicator.label}</span>
                </div>
              ) : null;
            })()}
          </div>
          <div className="text-xs text-slate-500 grid grid-cols-1 gap-2 mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <div className="flex items-center gap-2"><span>🟢</span> Under ₹50K - Competitive</div>
            <div className="flex items-center gap-2"><span>🟡</span> ₹50K-₹2L - Market Rate</div>
            <div className="flex items-center gap-2"><span>🔴</span> ₹2L+ - Premium Rate</div>
            {campaign?.budget && (
              <div className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-300">
                <span>✨</span> Target Range: {campaign.budget}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="portfolio" className="space-y-4 p-6 border-2 border-purple-400 bg-gradient-to-br from-purple-50/80 to-white shadow-lg hover:shadow-xl hover:border-purple-500 transition-all duration-200 rounded-xl">
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
              <ExternalLink className="h-5 w-5 text-purple-500" />
              Portfolio Links
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addPortfolioLinkWithPrefix('instagram')}
                className="bg-gradient-to-r from-pink-50 to-rose-50 flex items-center gap-2"
              >
                <SiInstagram className="h-4 w-4" />
                Instagram
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addPortfolioLinkWithPrefix('youtube')}
                className="bg-gradient-to-r from-red-50 to-orange-50 flex items-center gap-2"
              >
                <SiYoutube className="h-4 w-4" />
                YouTube
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addPortfolioLinkWithPrefix('tiktok')}
                className="bg-gradient-to-r from-gray-50 to-slate-50 flex items-center gap-2"
              >
                <SiTiktok className="h-4 w-4" />
                TikTok
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addPortfolioLinkWithPrefix('website')}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Website
              </Button>
            </div>

            <div className="space-y-3">
              {proposalForm.portfolioLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                      {link ? getPlatformIcon(link) : <ExternalLink className="h-4 w-4 text-gray-400" />}
                    </div>
                    <Input
                      placeholder="Add your content URL here..."
                      value={link}
                      onChange={(e) => updatePortfolioLink(index, e.target.value)}
                      className="bg-white/80 dark:bg-slate-800/80 pl-12 pr-4"
                    />
                  </div>
                  {proposalForm.portfolioLinks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePortfolioLink(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          
          {/* Additional Notes */}
          <div className="space-y-3 mt-6 pt-4 border-t border-purple-200 dark:border-purple-700">
            <Label className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Additional Notes
            </Label>
            <Textarea
              placeholder="💡 Any special ideas, previous brand collaborations, or unique value you bring..."
              value={proposalForm.additionalNotes}
              onChange={(e) => setProposalForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
              rows={3}
              className="bg-white/80 dark:bg-slate-800/80"
            />
          </div>
        </div>
      </TabsContent>

      {/* Review Tab */}
      <TabsContent value="review" className="space-y-4 p-6 border-2 border-indigo-400 bg-gradient-to-br from-indigo-50/80 to-white shadow-lg hover:shadow-xl hover:border-indigo-500 transition-all duration-200 rounded-xl">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
            <span className="text-2xl">👀</span>
            Review Your Proposal
          </div>
          
          <div className="grid gap-4">
            {/* Pitch Review */}
            <div className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
              <h4 className="font-semibold text-orange-800 mb-2">🎯 Your Pitch</h4>
              <p className="text-sm text-orange-700">{proposalForm.proposalText || 'No pitch provided'}</p>
            </div>
            
            {/* Deliverables Review */}
            <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
              <h4 className="font-semibold text-green-800 mb-2">📋 Deliverables</h4>
              <div className="space-y-2">
                {selectedDeliverables.length > 0 ? (
                  selectedDeliverables.map((deliverable, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                      <span>{deliverable.icon}</span>
                      <span>{deliverable.quantity > 1 ? `${deliverable.quantity}x ` : ''}</span>
                      <span>{deliverable.description || `${deliverable.platform} ${deliverable.type}`}</span>
                    </div>
                  ))
                ) : (
                  <ul className="text-sm text-green-700">
                    {formatDeliverables().map((deliverable, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span>•</span> {deliverable}
                      </li>
                    ))}
                  </ul>
                )}
                {selectedDeliverables.length === 0 && formatDeliverables().length === 0 && (
                  <p className="text-sm text-green-600 italic">No deliverables specified</p>
                )}
              </div>
            </div>
            
            {/* Timeline & Compensation Review */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  ⏰ Timeline
                </h4>
                <div className="text-sm text-blue-700">
                  {selectedTimeline && (
                    <div className="flex items-center gap-2">
                      {timelineOptions.find(opt => opt.title === selectedTimeline)?.icon && (
                        <span>{timelineOptions.find(opt => opt.title === selectedTimeline)?.icon}</span>
                      )}
                      <span className="font-medium">{selectedTimeline}</span>
                    </div>
                  )}
                  {proposalForm.proposedTimeline && proposalForm.proposedTimeline !== selectedTimeline && (
                    <div className="mt-1 text-xs">{proposalForm.proposedTimeline}</div>
                  )}
                  {!selectedTimeline && !proposalForm.proposedTimeline && (
                    <span className="italic text-blue-600">No timeline specified</span>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-lg">
                <h4 className="font-semibold text-emerald-800 mb-2">💰 Compensation</h4>
                <p className="text-sm text-emerald-700">{proposalForm.proposedCompensation || 'Not specified'}</p>
              </div>
            </div>
            
            {/* Portfolio Links Review */}
            <div className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
              <h4 className="font-semibold text-purple-800 mb-2">📁 Portfolio Links</h4>
              <div className="space-y-1">
                {proposalForm.portfolioLinks.filter(l => l.trim()).map((link, index) => (
                  <a key={index} href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-700 hover:text-purple-900 underline block">
                    {link}
                  </a>
                ))}
              </div>
            </div>
            
            {/* Additional Notes Review */}
            {proposalForm.additionalNotes.trim() && (
              <div className="p-4 bg-gray-50 border-l-4 border-gray-400 rounded-r-lg">
                <h4 className="font-semibold text-gray-800 mb-2">📝 Additional Notes</h4>
                <p className="text-sm text-gray-700">{proposalForm.additionalNotes}</p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[95vh] p-0 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 border-0 rounded-t-3xl shadow-2xl"
        >
          <SheetHeader className="px-6 py-6 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4 animate-pulse" />
            <SheetTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              Submit Proposal
            </SheetTitle>
            <div className="mt-2 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm">
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-center">
                {campaign?.title}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 text-center">
                Show why you're the perfect match
              </p>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-contain">
            {formContent}
            
            <div className="flex flex-col gap-3 pt-6 border-t border-slate-200 dark:border-slate-700 pb-8">
              <div className="text-sm text-slate-600 dark:text-slate-400 text-center">
                💪 Stand out from the crowd with a compelling proposal
              </div>
              <Button 
                onClick={handleSubmit}
                disabled={!proposalForm.proposalText.trim()}
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Send className="h-5 w-5 mr-2" />
                Submit Proposal ✨
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full bg-white/80 hover:bg-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 border-0 shadow-2xl">
        <DialogHeader className="relative pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="absolute -top-2 -right-2">
            <Sparkles className="h-6 w-6 text-blue-500 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Award className="h-6 w-6 text-blue-500" />
            Submit Your Proposal
          </DialogTitle>
          <div className="mt-2 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm">
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {campaign?.title}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Show why you're the perfect match for this campaign
            </p>
          </div>
        </DialogHeader>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {formContent}
        </div>
        
        {/* Fixed Footer with Navigation */}
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center px-6 py-4">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </div>
            
            {currentStep < steps.length - 1 ? (
              <Button 
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={!isFormComplete()}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Send className="h-4 w-4" />
                Submit Proposal ✨
              </Button>
            )}
          </div>
          
          {/* Secondary Actions */}
          <div className="flex justify-between items-center px-6 pb-4 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              💪 Complete all steps to submit your proposal
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-white/80 hover:bg-white">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function InfluencerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [selectedCampaignBrief, setSelectedCampaignBrief] = useState<any>(null);
  const [selectedCampaignWorkspace, setSelectedCampaignWorkspace] = useState<any>(null);
  
  // Modal state management
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);
  const [showProposalSubmission, setShowProposalSubmission] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [paymentHistoryData, setPaymentHistoryData] = useState<any>(null);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  const [selectedCampaignForProposal, setSelectedCampaignForProposal] = useState<Campaign | null>(null);
  const [selectedCampaignDetails, setSelectedCampaignDetails] = useState<any>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedCampaignForQuestion, setSelectedCampaignForQuestion] = useState<any>(null);
  const [questionText, setQuestionText] = useState('');
  const [showMyQuestionsModal, setShowMyQuestionsModal] = useState(false);
  const [selectedCampaignForQuestions, setSelectedCampaignForQuestions] = useState<any>(null);
  
  // Enhanced campaign management state
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('deadline');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedChatCampaign, setSelectedChatCampaign] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'calendar' | 'archive'>('overview');
  
  const queryClient = useQueryClient();

  // Load payment data automatically on component mount
  const loadPaymentData = async () => {
    try {
      const response = await fetch('/api/payments', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPaymentHistoryData(data.payments || []);
        }
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
    }
  };

  // Load payment data when component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      loadPaymentData();
    }
  }, [isAuthenticated, user]);

  // Payment history handling function
  const handleViewPaymentHistory = async () => {
    setLoadingPaymentHistory(true);
    setShowPaymentHistoryModal(true);
    
    try {
      // Get campaign payments for this user
      const response = await fetch('/api/payments', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPaymentHistoryData(data.payments || []);
        } else {
          setPaymentHistoryData([]);
        }
      } else {
        // Fallback: get payments from earnings data
        const earningsResponse = await fetch('/api/reports/earnings', {
          credentials: 'include'
        });
        
        if (earningsResponse.ok) {
          const earningsData = await earningsResponse.json();
          if (earningsData.success && earningsData.earnings.length > 0) {
            // Extract payment history from earnings data
            const paymentHistory = earningsData.earnings[0]?.campaignBreakdown || [];
            setPaymentHistoryData(paymentHistory);
          } else {
            setPaymentHistoryData([]);
          }
        } else {
          setPaymentHistoryData([]);
        }
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
      setPaymentHistoryData([]);
    } finally {
      setLoadingPaymentHistory(false);
    }
  };

  // Report handling functions for earnings
  const handleViewMonthlyEarnings = async () => {
    setLoadingReport(true);
    setShowReportsModal('monthly');
    
    try {
      // First try to get existing earnings statements
      const response = await fetch('/api/reports/earnings', {
        credentials: 'include'
      });
      
      let data = await response.json();
      
      // If no statements exist, generate one
      if (data.success && data.earnings.length === 0) {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        const generateResponse = await fetch('/api/reports/earnings/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ year, month })
        });
        
        const generateData = await generateResponse.json();
        if (generateData.success) {
          data = { success: true, earnings: [generateData.earnings] };
        }
      }
      
      if (data.success) {
        setReportData(data.earnings);
        toast({ title: "Earnings report loaded successfully" });
      }
    } catch (error) {
      console.error('Error loading earnings report:', error);
      toast({ title: "Failed to load earnings report", variant: "destructive" });
    } finally {
      setLoadingReport(false);
    }
  };

  const handleViewEarningsAnalytics = async () => {
    setLoadingReport(true);
    setShowReportsModal('analytics');
    
    try {
      // Get existing earnings analytics
      const response = await fetch('/api/reports/earnings/analytics', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReportData(data.analytics);
        toast({ title: "Earnings analytics loaded successfully" });
      }
    } catch (error) {
      console.error('Error loading earnings analytics:', error);
      toast({ title: "Failed to load earnings analytics", variant: "destructive" });
    } finally {
      setLoadingReport(false);
    }
  };

  const handleExportEarnings = async () => {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // For earnings export, we use the user ID as reportId and pass year/month as query params
      if (user?.id) {
        const url = `/api/reports/${user.id}/export?reportType=earnings&year=${year}&month=${month}`;
        window.open(url, '_blank');
        toast({ title: "Tax report exported successfully" });
      } else {
        toast({ title: "User not authenticated", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error exporting tax report:', error);
      toast({ title: "Failed to export tax report", variant: "destructive" });
    }
  };
  
  // Proposal submission mutation
  const submitProposalMutation = useMutation({
    mutationFn: async ({ campaignId, proposalData }: { campaignId: string, proposalData: any }) => {
      const response = await fetch(`/api/campaigns/${campaignId}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposalData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit proposal');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/influencer/campaigns'] });
      setShowProposalSubmission(false);
      setSelectedCampaignForProposal(null);
      toast({
        title: "Proposal Submitted! ✨",
        description: "Your proposal has been sent to the brand. We'll notify you once they review it.",
      });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your proposal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Modal handlers
  const handleViewCampaignDetails = (campaign: any) => {
    setSelectedCampaignDetails(campaign);
  };

  const handleApplyToCampaign = (campaign: Campaign) => {
    setSelectedCampaignForProposal(campaign);
    setShowProposalSubmission(true);
    setShowAllCampaigns(false);
  };

  const handleSubmitProposal = (campaignId: string, proposalData: any) => {
    submitProposalMutation.mutate({ campaignId, proposalData });
  };
  
  // Get real performance metrics from imported data
  const { data: performanceMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/performance-metrics'],
    enabled: isAuthenticated,
  });
  
  const metrics = (performanceMetrics as any)?.metrics || {};
  const dataSource = (performanceMetrics as any)?.dataSource || {};
  
  // Type check for metrics display
  const hasMetrics = metrics && typeof metrics === 'object' && Object.keys(metrics).length > 0;

  // Milestone celebration system
  const { 
    milestones, 
    pendingCelebration, 
    closeCelebration,
    isLoading: milestonesLoading 
  } = useMilestones();
  
  // Get real social media data from imported accounts
  const socialAccounts = (user as any)?.socialAccounts || [];
  const youtubeAccount = socialAccounts.find((acc: any) => acc.platform === 'youtube');
  const instagramAccount = socialAccounts.find((acc: any) => acc.platform === 'instagram');
  const tiktokAccount = socialAccounts.find((acc: any) => acc.platform === 'tiktok');

  const socialMetrics = {
    instagram: { 
      followers: instagramAccount?.followerCount ? ((Number(instagramAccount.followerCount) || 0) >= 10000 ? `${((Number(instagramAccount.followerCount) || 0) / 1000).toFixed(0)}K` : (Number(instagramAccount.followerCount) || 0).toLocaleString()) : "Not connected",
      engagement: instagramAccount?.engagementRate ? `${Number(instagramAccount.engagementRate) || 0}%` : "N/A"
    },
    youtube: { 
      followers: youtubeAccount?.followerCount ? (Number(youtubeAccount.followerCount) || 0).toLocaleString() : "Not connected",
      engagement: youtubeAccount?.engagementRate ? `${Number(youtubeAccount.engagementRate) || 0}%` : "N/A"
    },
    tiktok: { 
      followers: tiktokAccount?.followerCount ? ((Number(tiktokAccount.followerCount) || 0) >= 10000 ? `${((Number(tiktokAccount.followerCount) || 0) / 1000).toFixed(0)}K` : (Number(tiktokAccount.followerCount) || 0).toLocaleString()) : "Not connected",
      engagement: tiktokAccount?.engagementRate ? `${Number(tiktokAccount.engagementRate) || 0}%` : "N/A"
    }
  };

  // Fetch active campaigns available to influencers
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns'],
    enabled: isAuthenticated,
  });

  // Fetch influencer's specific campaigns (approved/pending/rejected)
  const { data: influencerCampaigns, isLoading: influencerCampaignsLoading } = useQuery({
    queryKey: ['/api/influencer/campaigns'],
    enabled: isAuthenticated,
    refetchInterval: 5000, // Refresh every 5 seconds to get latest campaign status
    staleTime: 0, // Always fetch fresh data for campaign status changes
  });

  // Transform campaigns data for display
  const appliedCampaignIds = new Set([
    ...((influencerCampaigns as any)?.approved?.map((p: any) => p.campaign?.id) || []),
    ...((influencerCampaigns as any)?.pending?.map((p: any) => p.campaign?.id) || []),
    ...((influencerCampaigns as any)?.workInProgress?.map((p: any) => p.campaign?.id) || []),
    ...((influencerCampaigns as any)?.paid?.map((p: any) => p.campaign?.id) || []),
    ...((influencerCampaigns as any)?.rejected?.map((p: any) => p.campaign?.id) || [])
  ]);

  // Available campaigns (not applied to yet) - latest first
  const upcomingEvents: BrandEvent[] = Array.isArray(campaignsData) 
    ? campaignsData
        .filter((campaign: any) => !appliedCampaignIds.has(campaign.id))
        .sort((a: any, b: any) => new Date(b.createdAt || b.generalStartDate || Date.now()).getTime() - new Date(a.createdAt || a.generalStartDate || Date.now()).getTime())
        .map((campaign: any) => ({
          id: campaign.id,
          name: campaign.title,
          brand: campaign.brand || campaign.brandName || 'Brand Partner',
          date: campaign.generalStartDate ? 
            `Starts: ${campaign.generalStartDate}` : 
            campaign.startDate ?
            `Starts: ${new Date(campaign.startDate).toLocaleDateString()}` :
            'Apply Now - Flexible Timeline',
          endDate: campaign.generalEndDate ? 
            `Ends: ${campaign.generalEndDate}` :
            campaign.endDate ?
            `Ends: ${new Date(campaign.endDate).toLocaleDateString()}` :
            'Duration To Be Confirmed',
          budgetRange: campaign.budgetRange || 'Budget Negotiable',
          description: campaign.description || '',
          status: 'Available',
          platforms: campaign.platforms || ['instagram', 'tiktok', 'youtube'],
          fullCampaign: campaign
        }))
    : [];

  // Pending campaigns (applied but waiting for response)
  const pendingCampaigns = (influencerCampaigns as any)?.pending || [];
  
  // Active work campaigns (upfront payment received, need to complete deliverables)
  const workInProgressCampaigns = (influencerCampaigns as any)?.workInProgress || [];

// Transform campaigns for enhanced features
  const enhancedCampaignData = useMemo(() => {
    // Calculate campaign progress based on status and payment workflow
    const calculateCampaignProgress = (proposal: any): number => {
      const status = proposal.status;
      const paymentStatus = proposal.paymentStatus;
      
      // Progress stages:
      // 0% - Just approved, no work started
      // 20% - Upfront payment received, work can begin
      // 40% - Work in progress
      // 60% - Deliverables submitted
      // 80% - Content approved by brand
      // 100% - Campaign completed and paid
      
      switch (status) {
        case 'approved':
          if (!paymentStatus) return 0; // Just approved, no payment workflow yet
          if (paymentStatus === 'upfront_payment_pending') return 20; // Payment workflow started
          if (paymentStatus === 'work_in_progress') return 40; // Work begun
          return 0;
          
        case 'work_in_progress':
          return 40;
          
        case 'deliverables_submitted':
          return 60;
          
        case 'content_approved':
          return 80;
          
        case 'completed':
        case 'paid':
          return 100;
          
        default:
          return 0;
      }
    };
    const allProposals = [
      ...((influencerCampaigns as any)?.approved || []),
      ...((influencerCampaigns as any)?.workInProgress || []),
      ...((influencerCampaigns as any)?.paid || [])
    ];

    return allProposals.map((proposal: any) => {
      const deadline = proposal.campaign?.exactEndDate ? new Date(proposal.campaign.exactEndDate) : null;
      const now = new Date();
      const daysUntilDeadline = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : undefined;
      
      // Use brand-set priority instead of calculated urgency
      const brandPriority = proposal.campaign?.priority || 'medium';
      const isUrgent = brandPriority === 'urgent' || (brandPriority === 'high' && daysUntilDeadline !== null && daysUntilDeadline < 3);
      
      return {
        id: proposal.id,
        status: proposal.status,
        proposedCompensation: proposal.proposedCompensation || '0',
        paymentStatus: proposal.paymentStatus,
        campaign: proposal.campaign,
        isUrgent: isUrgent,
        brandPriority: brandPriority,
        urgencyReason: proposal.campaign?.urgencyReason,
        daysUntilDeadline,
        urgentMilestones: 0, // Will be populated by milestone data
        totalTimeSpent: 0, // Will be populated by time tracking data
        progress: {
          overallProgress: calculateCampaignProgress(proposal),
          currentStage: proposal.status === 'deliverables_submitted' ? 'review' : 'content_creation'
        }
      };
    });
  }, [influencerCampaigns]);

  // Filter and sort campaigns
  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = [...enhancedCampaignData];

    // Apply filters
    switch (activeFilter) {
      case 'urgent':
        filtered = filtered.filter(c => c.isUrgent);
        break;
      case 'active':
        filtered = filtered.filter(c => c.status === 'approved' || c.status === 'work_in_progress');
        break;
      case 'in_review':
        filtered = filtered.filter(c => c.status === 'deliverables_submitted');
        break;
      case 'payment_pending':
        filtered = filtered.filter(c => c.paymentStatus === 'pending' || c.status === 'completed');
        break;
      case 'completed':
        filtered = filtered.filter(c => c.status === 'paid');
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'deadline':
          aValue = a.daysUntilDeadline || Infinity;
          bValue = b.daysUntilDeadline || Infinity;
          break;
        case 'payment':
          aValue = parseFloat(a.proposedCompensation);
          bValue = parseFloat(b.proposedCompensation);
          break;
        case 'urgency':
          // Sort by brand priority: urgent (0) > high (1) > medium (2) > low (3)
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          aValue = priorityOrder[a.brandPriority as keyof typeof priorityOrder] || 2;
          bValue = priorityOrder[b.brandPriority as keyof typeof priorityOrder] || 2;
          break;
        case 'progress':
          aValue = a.progress?.overallProgress || 0;
          bValue = b.progress?.overallProgress || 0;
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }

      return sortOrder === 'asc' ? 
        (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) :
        (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
    });

    return filtered;
  }, [enhancedCampaignData, activeFilter, sortBy, sortOrder]);

  // Campaign counts for filters
  const campaignCounts = useMemo(() => {
    const counts: Partial<Record<FilterType, number>> = {};
    counts.all = enhancedCampaignData.length;
    counts.urgent = enhancedCampaignData.filter(c => c.isUrgent).length;
    counts.active = enhancedCampaignData.filter(c => c.status === 'approved' || c.status === 'work_in_progress').length;
    counts.in_review = enhancedCampaignData.filter(c => c.status === 'deliverables_submitted').length;
    counts.payment_pending = enhancedCampaignData.filter(c => c.paymentStatus === 'pending' || c.status === 'completed').length;
    counts.completed = enhancedCampaignData.filter(c => c.status === 'paid').length;
    return counts;
  }, [enhancedCampaignData]);

  // Archive data (completed campaigns)
  const archivedCampaigns = enhancedCampaignData
    .filter(c => c.status === 'paid')
    .map(campaign => ({
      id: campaign.id,
      title: campaign.campaign?.title || 'Campaign',
      brandName: campaign.campaign?.brandName || 'Brand',
      completedDate: new Date().toISOString(), // Placeholder - should come from actual completion date
      compensation: campaign.proposedCompensation,
      currency: campaign.campaign?.currency || 'INR',
      totalTimeSpent: campaign.totalTimeSpent,
      performanceMetrics: {
        reach: Math.floor(Math.random() * 100000), // Placeholder
        engagement: Math.floor(Math.random() * 10),
        conversions: Math.floor(Math.random() * 1000),
        roi: Math.floor(Math.random() * 300)
      },
      rating: Math.floor(Math.random() * 3) + 3, // 3-5 star rating
      milestoneCount: 5,
      completedMilestones: 5
    }));

  // Event handlers for enhanced features
  const handleChatClick = (campaignId: string) => {
    setSelectedChatCampaign(campaignId);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleSortChange = (sortBy: SortType, sortOrder: SortOrder) => {
    setSortBy(sortBy);
    setSortOrder(sortOrder);
  };

  const handleCalendarEventClick = (eventId: string) => {
    // Find and show campaign details
    const campaign = enhancedCampaignData.find(c => c.id === eventId);
    if (campaign) {
      setSelectedCampaignDetails(campaign);
    }
  };

  const handleArchiveViewCampaign = (campaignId: string) => {
    // Navigate to campaign details or open workspace
    const campaign = archivedCampaigns.find(c => c.id === campaignId);
    if (campaign) {
      // Could open a detailed view or workspace for the archived campaign
      console.log('Viewing archived campaign:', campaign);
    }
  };

  const recentCampaigns: CampaignResult[] = [];
  const performanceData: any[] = [];
  const audienceData = {
    ageGroups: [],
    genderDistribution: { female: 0, male: 0, other: 0 },
    topLocations: []
  };

  const renderPerformanceHighlights = (): React.ReactNode => {
    if (metricsLoading) {
      return (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Calculating metrics...</p>
        </div>
      );
    } 
    
    if (hasMetrics) {
      return (
        <div className="space-y-4">
          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-r from-teal-400 to-teal-500 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold">{(metrics as any)?.totalReach?.value || "0"}</div>
              <div className="text-sm opacity-90">{(metrics as any)?.totalReach?.label || "Total Reach"}</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold">{(metrics as any)?.avgEngagement?.value || "0%"}</div>
              <div className="text-sm opacity-90">{(metrics as any)?.avgEngagement?.label || "Avg Engagement"}</div>
            </div>
            <div className="bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold">{(metrics as any)?.brandCampaigns?.value || "0"}</div>
              <div className="text-sm opacity-90">{(metrics as any)?.brandCampaigns?.label || "Brand Campaigns"}</div>
            </div>
            <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold">{(metrics as any)?.clientSatisfaction?.value || "0%"}</div>
              <div className="text-sm opacity-90">{(metrics as any)?.clientSatisfaction?.label || "Client Satisfaction"}</div>
            </div>
          </div>

          {/* Data Source Info */}
          <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
            📊 Calculated from {(dataSource as any)?.portfolioContent || 0} imported videos across {(dataSource as any)?.socialAccounts || 0} connected accounts
          </div>

          {youtubeAccount && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Current Social Media Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">YouTube Subscribers</span>
                  <span className="font-semibold">{youtubeAccount.followerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Channel Name</span>
                  <span className="font-semibold">{youtubeAccount.displayName}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="text-center py-6">
        <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h4 className="font-medium text-gray-900 mb-2">No performance data yet</h4>
        <p className="text-sm text-gray-600 mb-4">Import your social media accounts to see authentic performance metrics</p>
        <Link href="/profile-import">
          <Button className="bg-brand-teal hover:bg-brand-teal/90">
            Import Social Media
          </Button>
        </Link>
      </div>
    );
  };

  const { themeConfig } = useTheme();
  
  return (
    <div className={`min-h-screen ${themeConfig.background}`}>
      <Navigation />
      
      {/* Dynamic background decorations */}
      {themeConfig.decorations}
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="relative">
              {/* Animated background gradient */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-teal-600/10 rounded-2xl blur-lg animate-pulse"></div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-14 w-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-xl border border-white/10">
                    <Sparkles className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
                      Creator Dashboard
                    </h1>
                    <p className="text-purple-100 font-medium flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Welcome back, <span className="font-bold text-purple-300">{(user as any)?.firstName}!</span>
                      <Award className="h-4 w-4 text-yellow-400 animate-bounce" />
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/profile-import">
                <Button variant="outline" className="glass border-purple-400/30 text-purple-100 hover:bg-purple-600/20 hover:text-white backdrop-blur-sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Import Social Media
                </Button>
              </Link>
              <Link href="/influencer-settings">
                <Button variant="outline" className="glass border-white/20 text-purple-200 hover:bg-white/10 backdrop-blur-sm">
                  Settings
                </Button>
              </Link>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl border-0">
                <Plus className="h-4 w-4 mr-2" />
                Connect
              </Button>
            </div>
          </div>
        </div>

        <InfluencerNav />

        {/* Premium Profile Section */}
        <Card className="mb-8 relative overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-500">
          {/* Premium animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-slate-800 dark:via-blue-900/20 dark:to-purple-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          {/* Floating decorative elements */}
          <div className="absolute top-4 right-6 w-20 h-20 bg-gradient-to-br from-brand-teal/20 to-blue-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-6 left-8 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-lg animate-pulse delay-500"></div>
          
          <CardContent className="p-8 relative z-10">
            <div className="flex items-start gap-8">
              {/* Enhanced Avatar */}
              <div className="relative group-hover:scale-105 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-teal to-blue-500 rounded-full p-1 animate-spin-slow">
                  <div className="w-full h-full bg-white rounded-full"></div>
                </div>
                <Avatar className="h-24 w-24 relative z-10 shadow-lg">
                  <AvatarImage src={(user as any)?.profileImageUrl} className="object-cover" />
                  <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-brand-teal to-blue-500 text-white">
                    {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {/* Status indicator */}
                <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-4 border-white animate-pulse flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="flex-1">
                {/* Name and badges */}
                <div className="flex items-center gap-4 mb-3">
                  <h2 className="text-3xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    {(user as any)?.firstName} {(user as any)?.lastName}
                  </h2>
                  <div className="flex gap-2">
                    {youtubeAccount && (
                      <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <SiYoutube className="w-3 h-3 mr-1" />
                        {youtubeAccount.displayName} • YouTube Creator
                      </Badge>
                    )}
                    <Badge className="bg-gradient-to-r from-brand-teal to-blue-500 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Content Creator
                    </Badge>
                  </div>
                </div>
                
                {/* Enhanced bio */}
                <p className="text-gray-700 mb-6 max-w-2xl text-lg leading-relaxed">
                  {(user as any)?.bio || "Content creator sharing engaging videos and connecting with audiences across multiple platforms."}
                </p>
                
                {/* Premium social metrics */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 p-4 rounded-xl border border-pink-200/50 hover:shadow-lg transition-all duration-300 group/metric">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg group-hover/metric:scale-110 transition-transform duration-300">
                        <SiInstagram className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-gray-900">{socialMetrics.instagram.followers}</span>
                          <span className="text-sm text-gray-500 font-medium">followers</span>
                        </div>
                        <p className="text-xs text-pink-600 font-semibold">Instagram</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-red-200/50 hover:shadow-lg transition-all duration-300 group/metric">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg group-hover/metric:scale-110 transition-transform duration-300">
                        <SiYoutube className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-gray-900">{socialMetrics.youtube.followers}</span>
                          <span className="text-sm text-gray-500 font-medium">subscribers</span>
                        </div>
                        <p className="text-xs text-red-600 font-semibold">YouTube</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 p-4 rounded-xl border border-gray-200/50 hover:shadow-lg transition-all duration-300 group/metric">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-gray-800 to-black rounded-lg group-hover/metric:scale-110 transition-transform duration-300">
                        <SiTiktok className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-gray-900">{socialMetrics.tiktok.followers}</span>
                          <span className="text-sm text-gray-500 font-medium">followers</span>
                        </div>
                        <p className="text-xs text-gray-800 font-semibold">TikTok</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Premium CTA */}
                <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-blue-200/50 overflow-hidden group/cta">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 group-hover/cta:from-blue-600/10 group-hover/cta:to-purple-600/10 transition-colors duration-300"></div>
                  
                  <div className="relative flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-blue-600 animate-pulse" />
                        <p className="font-bold text-blue-900">Supercharge Your Profile</p>
                      </div>
                      <p className="text-sm text-blue-700 font-medium">Connect more platforms to unlock advanced analytics, audience insights, and premium brand opportunities</p>
                    </div>
                    <Link href="/profile-import">
                      <Button className="bg-gradient-to-r from-brand-teal to-blue-500 hover:from-brand-teal/90 hover:to-blue-500/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        <Plus className="h-4 w-4 mr-2" />
                        Import Profiles
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Reports Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Earnings & Financial Reports</h2>
              <p className="text-gray-600">Track your campaign earnings, payments, and tax information</p>
            </div>
            <Button 
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              onClick={handleViewEarningsAnalytics}
              disabled={loadingReport}
              data-testid="button-view-earnings"
            >
              {loadingReport && showReportsModal === 'analytics' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  View Earnings
                </>
              )}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Monthly Earnings */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  Monthly Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Month</span>
                    <span className="font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Campaigns</span>
                    <span className="font-medium">{((influencerCampaigns as any)?.approved?.length || 0) + ((influencerCampaigns as any)?.paid?.length || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Est. Earnings</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(((influencerCampaigns as any)?.approved?.concat((influencerCampaigns as any)?.paid || [])?.reduce((sum: number, proposal: any) => sum + (proposal.proposedCompensation || 0), 0) || 0), (influencerCampaigns as any)?.approved?.[0]?.campaign?.currency || (influencerCampaigns as any)?.paid?.[0]?.campaign?.currency || 'INR')}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={handleViewMonthlyEarnings}
                    disabled={loadingReport}
                    data-testid="button-view-monthly-earnings"
                  >
                    {loadingReport && showReportsModal === 'monthly' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'View Detailed Report'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid Campaigns</span>
                    <span className="font-medium text-green-600">{paymentHistoryData ? paymentHistoryData.filter((p: any) => p.status === 'paid' || p.status === 'completed').length : 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending Payment</span>
                    <span className="font-medium text-orange-600">{paymentHistoryData ? paymentHistoryData.filter((p: any) => p.status === 'pending').length : 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Received</span>
                    <span className="font-medium text-green-600">
                      ₹{paymentHistoryData ? paymentHistoryData.filter((p: any) => p.status === 'paid' || p.status === 'completed').reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0).toLocaleString() : '0'}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={handleViewPaymentHistory}
                    disabled={loadingPaymentHistory}
                    data-testid="button-view-payments"
                  >
                    {loadingPaymentHistory ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'View Payment History'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tax & Export */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Tax & Export
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">YTD Earnings</span>
                    <span className="font-medium">
                      {formatCurrency(((influencerCampaigns as any)?.paid?.reduce((sum: number, proposal: any) => sum + (proposal.proposedCompensation || 0), 0) || 0), (influencerCampaigns as any)?.paid?.[0]?.campaign?.currency || 'INR')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax Documents</span>
                    <span className="font-medium text-blue-600">Ready</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">1099 Status</span>
                    <span className="font-medium text-green-600">Available</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-3 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={handleExportEarnings}
                    data-testid="button-export-tax"
                  >
                    Export Tax Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Events and Campaigns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enhanced Campaign Management Section */}
            {enhancedCampaignData.length > 0 ? (
              <Card className="shadow-sm border">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Target className="h-6 w-6 text-blue-600" />
                        Campaign Management
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                        Track progress, manage deadlines, and collaborate with brands
                      </CardDescription>
                    </div>
                    
                    {/* View Toggle */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={activeView === 'overview' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveView('overview')}
                        data-testid="view-overview"
                        className="shadow-sm"
                      >
                        Overview
                      </Button>
                      <Button
                        variant={activeView === 'calendar' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveView('calendar')}
                        data-testid="view-calendar"
                        className="shadow-sm"
                      >
                        Calendar
                      </Button>
                      <Button
                        variant={activeView === 'archive' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveView('archive')}
                        data-testid="view-archive"
                        className="shadow-sm"
                      >
                        Archive
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Overview View */}
                  {activeView === 'overview' && (
                    <div className="space-y-6">
                      {/* Campaign Filters */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border">
                        <CampaignFilters
                          activeFilter={activeFilter}
                          sortBy={sortBy}
                          sortOrder={sortOrder}
                          onFilterChange={handleFilterChange}
                          onSortChange={handleSortChange}
                          campaignCounts={campaignCounts}
                        />
                      </div>

                      {/* Active Campaigns Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            Active Campaigns
                            <Badge variant="secondary" className="ml-2">
                              {filteredAndSortedCampaigns.length}
                            </Badge>
                          </h3>
                        </div>
                        
                        {/* Enhanced Campaign Cards */}
                        <div className="grid gap-4">
                          {filteredAndSortedCampaigns.length > 0 ? (
                            filteredAndSortedCampaigns.map((campaign) => (
                              <EnhancedCampaignCard
                                key={campaign.id}
                                campaignData={campaign}
                                onChatClick={handleChatClick}
                                onCreateContent={(campaignData) => setSelectedCampaignWorkspace(campaignData)}
                                onViewBrief={(campaignData) => setSelectedCampaignBrief(campaignData)}
                                className="border-2 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200"
                              />
                            ))
                          ) : (
                            <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
                              <CardContent className="flex flex-col items-center justify-center py-12">
                                <Target className="w-12 h-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Campaigns Found</h3>
                                <p className="text-gray-500 dark:text-gray-500 text-center max-w-md">
                                  {activeFilter === 'all' 
                                    ? 'You don\'t have any active campaigns yet. Start by browsing available campaigns below.'
                                    : `No campaigns match the "${activeFilter.replace('_', ' ')}" filter. Try adjusting your filters.`
                                  }
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>

                      {/* Compact Calendar Widget */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                          <CompactCalendar
                            campaigns={filteredAndSortedCampaigns}
                            onEventClick={handleCalendarEventClick}
                          />
                        </div>
                        
                        {archivedCampaigns.length > 0 && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                            <ArchiveSummaryWidget campaigns={archivedCampaigns} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Calendar View */}
                  {activeView === 'calendar' && (
                    <CampaignCalendar
                      campaigns={filteredAndSortedCampaigns}
                      onEventClick={handleCalendarEventClick}
                    />
                  )}

                  {/* Archive View */}
                  {activeView === 'archive' && (
                    <CampaignArchive
                      campaigns={archivedCampaigns}
                      onViewCampaign={handleArchiveViewCampaign}
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    My Active Campaigns
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-800">
                    0 Active
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Paid campaigns first (higher priority) */}
                    {(influencerCampaigns as any)?.paid?.map((proposal: any) => (
                      <div key={proposal.id} className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{proposal.campaign?.title}</h3>
                            <p className="text-sm text-gray-600">{proposal.campaign?.brandName}</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-blue-600 text-white mb-2">
                              PAID ✓
                            </Badge>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(proposal.proposedCompensation || 0, proposal.campaign?.currency || 'INR')}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{proposal.campaign?.description}</p>
                        
                        {/* Next Steps for Paid Campaigns */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <h4 className="font-medium text-green-900 mb-2">💰 Payment Received! Next Steps:</h4>
                          <ul className="text-sm text-green-800 space-y-1">
                            <li>• Payment has been processed successfully</li>
                            <li>• Content creation deadline: {new Date(proposal.campaign?.endDate).toLocaleDateString()}</li>
                            <li>• Submit content for brand approval</li>
                            {proposal.brandFeedback && <li>• Brand notes: "{proposal.brandFeedback}"</li>}
                          </ul>
                        </div>

                        {/* Approved Content Action Section */}
                        <ApprovedContentActions proposalId={proposal.id} />
                        
                        <div className="flex gap-2">
                          <WorkspaceButton 
                            proposal={proposal}
                            onOpenWorkspace={() => setSelectedCampaignWorkspace(proposal)}
                            user={user}
                            buttonText="Start Creating Content"
                            testId={`start-campaign-${proposal.id}`}
                          />
                          <Button 
                            size="sm" 
                            className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
                            data-testid={`view-brief-${proposal.id}`}
                            onClick={() => setSelectedCampaignBrief(proposal)}
                          >
                            View Brief
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Approved campaigns (awaiting payment) */}
                    {(influencerCampaigns as any)?.approved?.map((proposal: any) => (
                      <div key={proposal.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{proposal.campaign?.title}</h3>
                            <p className="text-sm text-gray-600">{proposal.campaign?.brandName}</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-600 text-white mb-2">
                              APPROVED ✓
                            </Badge>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(proposal.proposedCompensation || 0, proposal.campaign?.currency || 'INR')}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{proposal.campaign?.description}</p>
                        
                        {/* Next Steps for Approved (unpaid) campaigns */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <h4 className="font-medium text-yellow-900 mb-2">⏳ Awaiting Payment - Next Steps:</h4>
                          <ul className="text-sm text-yellow-800 space-y-1">
                            <li>• Brand will process payment soon</li>
                            <li>• Review final campaign brief and deliverables</li>
                            <li>• Content creation deadline: {new Date(proposal.campaign?.endDate).toLocaleDateString()}</li>
                            {proposal.brandFeedback && <li>• Brand notes: "{proposal.brandFeedback}"</li>}
                          </ul>
                        </div>

                        {/* Approved Content Action Section */}
                        <ApprovedContentActions proposalId={proposal.id} />
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-yellow-600 text-yellow-700 hover:bg-yellow-50" 
                            data-testid={`view-brief-${proposal.id}`}
                            onClick={() => setSelectedCampaignBrief(proposal)}
                          >
                            View Brief
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-gray-400 text-gray-600" 
                            disabled
                          >
                            Waiting for Payment
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Campaigns (Applied, Waiting for Response) */}
            {pendingCampaigns.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Pending Applications
                  </CardTitle>
                  <Badge className="bg-orange-100 text-orange-800">
                    {pendingCampaigns.length} Under Review
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingCampaigns.map((proposal: any) => (
                      <div key={proposal.id} className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{proposal.campaign?.title}</h3>
                            <p className="text-sm text-gray-600">{proposal.campaign?.brandName}</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-orange-600 text-white mb-2">
                              PENDING ⏳
                            </Badge>
                            <p className="text-sm text-gray-600">
                              Applied {new Date(proposal.appliedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{proposal.campaign?.description}</p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Status:</strong> Your application is under review. The brand will respond soon.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Available Campaigns - Scrollable */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand-teal" />
                  Available Campaigns
                </CardTitle>
                <div className="flex gap-2 items-center">
                  <Badge variant="outline" className="text-brand-teal border-brand-teal">
                    {upcomingEvents.length} Available
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-brand-teal hover:bg-brand-teal/10"
                    onClick={() => setShowAllCampaigns(true)}
                    data-testid="view-all-campaigns"
                  >
                    View All Campaigns
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {campaignsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading campaigns...</p>
                  </div>
                ) : upcomingEvents.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
                    <div className="space-y-4">
                      {upcomingEvents.map((event) => (
                        <div key={event.id} className="p-4 border-2 border-teal-400 rounded-xl hover:bg-gradient-to-br hover:from-teal-50/80 hover:to-white hover:border-teal-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-teal-50/60 to-white shadow-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 text-lg mb-1">{event.name}</h3>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-teal-500 rounded-full" />
                                <p className="text-sm font-medium text-gray-700">{event.brand}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="bg-gradient-to-r from-blue-100/80 to-cyan-100/80 rounded-lg p-2 border-2 border-blue-300 mb-2">
                                <p className="text-xs font-medium text-blue-700">Timeline</p>
                                <p className="text-sm font-bold text-blue-800">{event.date}</p>
                              </div>
                              <Badge className="bg-green-100/80 text-green-800 border-2 border-green-300 shadow-md animate-pulse">
                                Open to Apply
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed font-medium">{event.description}</p>
                          
                          {/* Platform Requirements Display */}
                          {event.platforms && event.platforms.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                Platforms Required:
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                {event.platforms.map((platform: string) => {
                                  const getPlatformIcon = (platform: string) => {
                                    switch (platform.toLowerCase()) {
                                      case 'instagram': return <SiInstagram className="w-3 h-3" />;
                                      case 'tiktok': return <SiTiktok className="w-3 h-3" />;
                                      case 'youtube': return <SiYoutube className="w-3 h-3" />;
                                      default: return null;
                                    }
                                  };
                                  const getPlatformColor = (platform: string) => {
                                    switch (platform.toLowerCase()) {
                                      case 'instagram': return 'bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 border-pink-300';
                                      case 'tiktok': return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
                                      case 'youtube': return 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border-red-300';
                                      default: return 'bg-gray-100 text-gray-700 border-gray-300';
                                    }
                                  };
                                  return (
                                    <Badge 
                                      key={platform} 
                                      className={`${getPlatformColor(platform)} border-2 font-medium text-xs flex items-center gap-1 px-2 py-1`}
                                    >
                                      {getPlatformIcon(platform)}
                                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Budget Display */}
                          {event.budgetRange && (
                            <div className="mb-4">
                              <div className="bg-gradient-to-r from-green-100/80 to-emerald-100/80 rounded-lg p-2 border-2 border-green-300">
                                <p className="text-xs font-medium text-green-700 mb-1">💰 Budget Range</p>
                                <p className="text-sm font-bold text-green-800">{event.budgetRange}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleViewCampaignDetails(event)}
                              className="border-2 border-teal-300 text-teal-600 hover:bg-teal-50 hover:border-teal-400 shadow-md flex-1"
                              data-testid={`view-details-${event.id}`}
                            >
                              View Details
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                const campaign = Array.isArray(campaignsData) ? campaignsData.find((c: any) => c.id === event.id) : null;
                                if (campaign) handleApplyToCampaign(campaign);
                              }}
                              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white border-2 border-teal-500 hover:border-teal-600 shadow-lg hover:shadow-xl transition-all duration-200 flex-1"
                              data-testid={`apply-now-${event.id}`}
                            >
                              Apply Now
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns available</h3>
                    <p className="text-gray-600 mb-4">All campaigns have been applied to or no new campaigns are available at the moment</p>
                    <Button 
                      className="bg-brand-teal hover:bg-brand-teal/90"
                      onClick={() => setShowAllCampaigns(true)}
                      data-testid="browse-all-campaigns"
                    >
                      Browse All Campaigns
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Campaign Results */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-brand-teal" />
                  Recent Campaign Results
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-brand-teal">
                  View All Campaigns
                </Button>
              </CardHeader>
              <CardContent>
                {influencerCampaigns && ((influencerCampaigns as any)?.paid?.length > 0 || (influencerCampaigns as any)?.approved?.length > 0) ? (
                  <div className="space-y-4">
                    {((influencerCampaigns as any)?.paid || []).slice(0, 3).map((proposal: any) => (
                      <div key={proposal.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{proposal.campaign?.title}</h3>
                            <p className="text-sm text-gray-600">{proposal.campaign?.brandName}</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-600 text-white mb-1">
                              COMPLETED ✓
                            </Badge>
                            <p className="text-xs text-gray-600">
                              {formatCurrency(proposal.proposedCompensation || 0, proposal.campaign?.currency || 'INR')}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Campaign completed successfully</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>• Views: {((metrics as any)?.totalReach?.rawValue || 0).toLocaleString()}</span>
                          <span>• Engagement: {(metrics as any)?.avgEngagement?.displayValue || '0%'}</span>
                        </div>
                      </div>
                    ))}
                    {((influencerCampaigns as any)?.approved || []).slice(0, 2).map((proposal: any) => (
                      <div key={proposal.id} className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{proposal.campaign?.title}</h3>
                            <p className="text-sm text-gray-600">{proposal.campaign?.brandName}</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-blue-600 text-white mb-1">
                              IN PROGRESS
                            </Badge>
                            <p className="text-xs text-gray-600">
                              {formatCurrency(proposal.proposedCompensation || 0, proposal.campaign?.currency || 'INR')}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">Content creation in progress</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No completed campaigns yet</h3>
                    <p className="text-gray-600 mb-4">Apply to campaigns to start building your collaboration history</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Performance & Audience */}
          <div className="space-y-8">
            {/* Performance Highlights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-brand-teal" />
                  Performance Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderPerformanceHighlights()}
              </CardContent>
            </Card>

            {/* Milestone Progress */}
            {performanceMetrics && !milestonesLoading && milestones && (
              <MilestoneProgress 
                milestones={milestones}
                currentStats={{
                  totalFollowers: socialAccounts.reduce((sum: number, acc: any) => sum + (Number(acc.followerCount) || 0), 0),
                  totalViews: (metrics as any)?.totalReach?.rawValue || 0,
                  totalEngagement: Math.round(((metrics as any)?.totalReach?.rawValue || 0) * ((metrics as any)?.avgEngagement?.rawValue || 0) / 100),
                  totalContent: (dataSource as any)?.portfolioContent || 0,
                  totalCollaborations: (metrics as any)?.brandCampaigns?.rawValue || 0
                }}
              />
            )}

            {/* Audience Demographics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-brand-teal" />
                  Audience Demographics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {socialAccounts.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-1">Total Followers</h3>
                        <p className="text-2xl font-bold text-blue-600">
                          {socialAccounts.reduce((sum: number, acc: any) => sum + (Number(acc.followerCount) || 0), 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">Across {socialAccounts.length} platforms</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-1">Avg Engagement</h3>
                        <p className="text-2xl font-bold text-green-600">
                          {(metrics as any)?.avgEngagement?.displayValue || '0%'}
                        </p>
                        <p className="text-xs text-gray-600">Cross-platform average</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Platform Breakdown</h4>
                      {socialAccounts.map((account: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {account.platform === 'instagram' ? '📸' : 
                               account.platform === 'youtube' ? '📺' : 
                               account.platform === 'tiktok' ? '🎵' : '📱'}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900 capitalize">{account.platform}</p>
                              <p className="text-sm text-gray-600">@{account.username}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{Number(account.followerCount || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-600">followers</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Social Accounts</h3>
                    <p className="text-gray-600 mb-4">Import your social media data to unlock detailed audience insights</p>
                    <Link href="/profile-import">
                      <Button variant="outline" className="text-brand-teal border-brand-teal hover:bg-brand-teal hover:text-white">
                        Import Platforms
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campaign Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-brand-teal" />
                  Campaign Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-blue-500 mb-4 mx-auto" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Discover Brand Campaigns</h3>
                  <p className="text-gray-600 mb-4">
                    Apply to active brand campaigns and grow your partnerships
                  </p>
                  <Link href="/campaigns">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Browse Campaigns
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Inline Chat Component */}
      {selectedChatCampaign && (
        <div className="fixed bottom-4 right-4 w-96 h-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold">Campaign Chat</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedChatCampaign(null)}
              data-testid="close-chat"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="h-80">
            <CampaignChat 
              campaignId={selectedChatCampaign}
              isOpen={!!selectedChatCampaign}
              onClose={() => setSelectedChatCampaign(null)}
              user={user}
              inline={true}
            />
          </div>
        </div>
      )}

      {/* Milestone Celebration Modal */}
      <MilestoneCelebration 
        milestone={pendingCelebration}
        isOpen={!!pendingCelebration}
        onClose={closeCelebration}
      />

      {/* Campaign Modals */}
      <CampaignBriefModal 
        proposal={selectedCampaignBrief}
        isOpen={!!selectedCampaignBrief}
        onOpenChange={(open: boolean) => !open && setSelectedCampaignBrief(null)}
      />
      
      <CampaignWorkspaceModal 
        proposal={selectedCampaignWorkspace}
        isOpen={!!selectedCampaignWorkspace}
        onOpenChange={(open: boolean) => !open && setSelectedCampaignWorkspace(null)}
        user={user}
      />

      {/* Enhanced Campaign Modals */}
      <AllCampaignsModal
        isOpen={showAllCampaigns}
        onOpenChange={setShowAllCampaigns}
        campaigns={campaignsData}
        onApplyToCampaign={handleApplyToCampaign}
      />

      <ProposalSubmissionModal
        isOpen={showProposalSubmission}
        onOpenChange={setShowProposalSubmission}
        campaign={selectedCampaignForProposal}
        onSubmitProposal={handleSubmitProposal}
      />

      {/* Enhanced Campaign Details Modal */}
      <EnhancedCampaignModal
        campaign={selectedCampaignDetails ? {
          id: selectedCampaignDetails.id,
          title: selectedCampaignDetails.name,
          description: selectedCampaignDetails.description,
          campaignType: selectedCampaignDetails.fullCampaign?.campaignType || 'Partnership',
          budget: selectedCampaignDetails.fullCampaign?.budget || selectedCampaignDetails.budgetRange || 'Budget TBD',
          platforms: selectedCampaignDetails.fullCampaign?.platforms || ['instagram', 'tiktok', 'youtube'],
          targetAudience: selectedCampaignDetails.fullCampaign?.targetAudience || 'Young professionals and lifestyle enthusiasts aged 22-35, primarily located in North America and Europe. Interest in fashion, wellness, and modern lifestyle brands.',
          brandName: selectedCampaignDetails.brand,
          generalStartDate: selectedCampaignDetails.fullCampaign?.generalStartDate,
          generalEndDate: selectedCampaignDetails.fullCampaign?.generalEndDate,
          priority: selectedCampaignDetails.fullCampaign?.priority || 'medium',
          briefOverview: selectedCampaignDetails.fullCampaign?.briefOverview || selectedCampaignDetails.description,
          brandVoice: selectedCampaignDetails.fullCampaign?.brandVoice || 'Authentic and engaging voice that resonates with target audience',
          keyMessages: selectedCampaignDetails.fullCampaign?.keyMessages || 'Highlight product quality, lifestyle integration, and brand values',
          contentFormats: selectedCampaignDetails.fullCampaign?.contentFormats || ['Posts', 'Stories', 'Reels', 'Videos'],
          platformRequirements: selectedCampaignDetails.fullCampaign?.platformRequirements || 'High-quality content that aligns with brand aesthetic and values. Maintain consistent brand messaging across all platforms.',
          paymentStructure: selectedCampaignDetails.fullCampaign?.paymentStructure || 'Competitive performance-based compensation with upfront payment',
          paymentTimeline: (() => {
            // Try multiple paths for payment structure data
            const paymentStructure = selectedCampaignDetails.fullCampaign?.paymentStructure || 
                                    selectedCampaignDetails.paymentStructure ||
                                    (selectedCampaignDetails as any)?.paymentStructure;
            
            if (paymentStructure && typeof paymentStructure === 'object') {
              const upfront = paymentStructure.upfront || 0;
              const completion = paymentStructure.completion || 0;
              const bonus = paymentStructure.bonus || 0;
              
              let timeline = `${upfront}% upfront, ${completion}% upon completion and approval`;
              if (bonus > 0) {
                timeline += `, ${bonus}% performance bonus after content goes live`;
              }
              return timeline;
            }
            return 'Payment structure not available'; // Temporary debug fallback
          })(),
          // Enhanced information for better understanding
          videoSpecs: selectedCampaignDetails.fullCampaign?.videoSpecs || 'Instagram: 1080x1920 (9:16), TikTok: 1080x1920 (9:16), YouTube: 1920x1080 (16:9). High-quality, well-lit content preferred.',
          captionRequirements: selectedCampaignDetails.fullCampaign?.captionRequirements || 'Include brand hashtag and mention. Authentic storytelling encouraged. Keep captions engaging and conversational.',
          audiencePersonas: selectedCampaignDetails.fullCampaign?.audiencePersonas || 'Fashion-forward millennials and Gen Z consumers who value authenticity, sustainability, and personal style expression.',
          targetAudienceLocation: selectedCampaignDetails.fullCampaign?.targetAudienceLocation || 'Primary: North America, Europe. Secondary: Australia, Urban Asia',
          brandIndustry: selectedCampaignDetails.fullCampaign?.brandIndustry || 'Fashion & Lifestyle',
          ratesByPlatform: selectedCampaignDetails.fullCampaign?.ratesByPlatform || 'Instagram: Standard rates, TikTok: Performance bonus available, YouTube: Premium rates for video content',
          urgencyReason: selectedCampaignDetails.fullCampaign?.urgencyReason
        } : null}
        isOpen={!!selectedCampaignDetails}
        onOpenChange={(open) => {
          if (!open) setSelectedCampaignDetails(null);
        }}
        onApply={(campaignId) => {
          const campaign = Array.isArray(campaignsData) ? campaignsData.find((c: any) => c.id === campaignId) : null;
          if (campaign) {
            handleApplyToCampaign(campaign);
            setSelectedCampaignDetails(null);
          }
        }}
        onAskQuestion={(campaignId) => {
          setSelectedCampaignForQuestion(selectedCampaignDetails);
          setShowQuestionModal(true);
          setSelectedCampaignDetails(null);
        }}
        onViewQuestions={(campaignId) => {
          setSelectedCampaignForQuestions(selectedCampaignDetails);
          setShowMyQuestionsModal(true);
          setSelectedCampaignDetails(null);
        }}
      />

      {/* Earnings Reports Modal */}
      <Dialog open={!!showReportsModal} onOpenChange={() => setShowReportsModal(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showReportsModal === 'monthly' && (
                <>
                  <CreditCard className="w-5 h-5 text-green-600" />
                  Monthly Earnings Report
                </>
              )}
              {showReportsModal === 'analytics' && (
                <>
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Earnings Analytics
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {loadingReport ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-green-600" />
                <p className="text-gray-600">Loading earnings data...</p>
              </div>
            ) : reportData && reportData.length > 0 ? (
              <>
                {showReportsModal === 'monthly' && (
                  <div className="space-y-6">
                    {reportData.map((earnings: any, index: number) => (
                      <Card key={earnings.id || index} className="border-l-4 border-l-green-500">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              Monthly Earnings - {earnings.period}
                            </CardTitle>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Generated: {new Date(earnings.generatedAt).toLocaleDateString()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <p className="text-sm text-green-600 font-medium">Total Earnings</p>
                              <p className="text-2xl font-bold text-green-700">${earnings.totalEarnings?.toLocaleString() || '0'}</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-600 font-medium">Campaigns</p>
                              <p className="text-xl font-bold text-blue-700">{earnings.campaignCount || 0}</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <p className="text-sm text-purple-600 font-medium">Avg per Campaign</p>
                              <p className="text-xl font-bold text-purple-700">
                                ${earnings.campaignCount > 0 ? Math.round(earnings.totalEarnings / earnings.campaignCount).toLocaleString() : '0'}
                              </p>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                              <p className="text-sm text-orange-600 font-medium">Platform Fees</p>
                              <p className="text-xl font-bold text-orange-700">${earnings.platformFees?.toLocaleString() || '0'}</p>
                            </div>
                          </div>
                          
                          {earnings.campaignBreakdown && (
                            <div className="mb-4">
                              <h4 className="font-medium mb-3">Campaign Breakdown</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Campaign</TableHead>
                                    <TableHead>Brand</TableHead>
                                    <TableHead className="text-right">Earnings</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {earnings.campaignBreakdown.map((campaign: any, idx: number) => (
                                    <TableRow key={idx}>
                                      <TableCell className="font-medium">{campaign.name}</TableCell>
                                      <TableCell>{campaign.brand}</TableCell>
                                      <TableCell className="text-right font-medium">
                                        ${campaign.earnings?.toLocaleString() || '0'}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Badge variant={campaign.status === 'paid' ? 'default' : 'secondary'}>
                                          {campaign.status}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                          
                          <div className="flex gap-2 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const url = `/api/reports/${earnings.id}/export?reportType=earnings`;
                                window.open(url, '_blank');
                              }}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Export PDF
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {showReportsModal === 'analytics' && (
                  <div className="space-y-6">
                    <Card className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="text-lg">Earnings Analytics Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Total Lifetime Earnings</p>
                            <p className="text-2xl font-bold text-blue-700">${reportData.totalEarnings?.toLocaleString() || '0'}</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Monthly Average</p>
                            <p className="text-2xl font-bold text-green-700">${reportData.monthlyAverage?.toLocaleString() || '0'}</p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-600 font-medium">Growth Rate</p>
                            <p className="text-2xl font-bold text-purple-700">{reportData.growthRate?.toFixed(1) || '0'}%</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium mb-3">Earnings by Platform</h4>
                            <div className="space-y-2">
                              {reportData.platformBreakdown?.map((platform: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <span className="font-medium">{platform.name}</span>
                                  <span className="text-green-600">${platform.earnings?.toLocaleString() || '0'}</span>
                                </div>
                              )) || (
                                <p className="text-gray-500 text-center py-4">No platform data available</p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-3">Recent Performance</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">This Month:</span>
                                <span className="font-medium">${reportData.currentMonth?.toLocaleString() || '0'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Last Month:</span>
                                <span className="font-medium">${reportData.lastMonth?.toLocaleString() || '0'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Top Campaign:</span>
                                <span className="font-medium">${reportData.topCampaign?.toLocaleString() || '0'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Earnings Data Available</h3>
                <p className="text-gray-600 mb-4">
                  {showReportsModal === 'monthly' 
                    ? 'Complete your first campaign to start generating earnings reports.'
                    : 'Build your earnings history to access detailed analytics and insights.'
                  }
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (showReportsModal === 'monthly') {
                      handleViewMonthlyEarnings();
                    } else {
                      handleViewEarningsAnalytics();
                    }
                  }}
                >
                  Generate Report
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment History Modal */}
      <Dialog open={showPaymentHistoryModal} onOpenChange={() => setShowPaymentHistoryModal(false)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment History
            </DialogTitle>
            <DialogDescription>
              View your complete payment transaction history
            </DialogDescription>
          </DialogHeader>
          
          {loadingPaymentHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : paymentHistoryData && paymentHistoryData.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{paymentHistoryData.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Received</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {paymentHistoryData.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Payments</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ₹{paymentHistoryData.length > 0 ? (paymentHistoryData.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0) / paymentHistoryData.length).toFixed(0) : '0'}
                  </div>
                  <div className="text-sm text-gray-600">Avg Payment</div>
                </Card>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistoryData.map((payment: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {payment.campaignName || 'Campaign Payment'}
                        </TableCell>
                        <TableCell>
                          {payment.brandName || 'Brand Partner'}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            ₹{(payment.amount || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                            {payment.status || 'Completed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {payment.date ? new Date(payment.date).toLocaleDateString() : 'Recent'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
              <p className="text-gray-600 mb-4">
                Complete your first campaign to start earning and building your payment history.
              </p>
              <Button 
                variant="outline"
                onClick={() => setShowPaymentHistoryModal(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ask Question Modal */}
      <Dialog open={showQuestionModal} onOpenChange={setShowQuestionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Ask a Question
            </DialogTitle>
            <DialogDescription>
              Send a question to the brand about {selectedCampaignForQuestion?.name || 'this campaign'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Campaign: {selectedCampaignForQuestion?.name}</h4>
              <p className="text-blue-800 text-sm">{selectedCampaignForQuestion?.brand}</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="question" className="text-sm font-medium text-gray-700">
                Your Question
              </label>
              <textarea
                id="question"
                placeholder="Type your question about this campaign..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                data-testid="textarea-question"
              />
              <p className="text-xs text-gray-500">
                Be specific about what you'd like to know (timeline, requirements, budget details, etc.)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowQuestionModal(false);
                setQuestionText('');
                setSelectedCampaignForQuestion(null);
              }}
              data-testid="button-cancel-question"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!questionText.trim()) return;
                
                try {
                  // Use the new campaign Q&A endpoint
                  const response = await fetch(`/api/campaigns/${selectedCampaignForQuestion?.id}/ask`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      content: questionText,
                      subject: `Question about ${selectedCampaignForQuestion?.name}`
                    }),
                  });

                  if (response.ok) {
                    toast({
                      title: "Question Sent Successfully",
                      description: "The brand will receive your question in their campaign Messages tab and respond within 24 hours.",
                    });
                    
                    // Close modal and reset
                    setShowQuestionModal(false);
                    setQuestionText('');
                    setSelectedCampaignForQuestion(null);
                  } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to send question');
                  }
                } catch (error) {
                  console.error('Error sending question:', error);
                  toast({
                    title: "Error Sending Question",
                    description: error instanceof Error ? error.message : "Please try again later.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!questionText.trim()}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-send-question"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Question
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* My Questions Modal */}
      <MyQuestionsModal 
        campaign={selectedCampaignForQuestions}
        isOpen={showMyQuestionsModal}
        onOpenChange={setShowMyQuestionsModal}
        currentUserId={user?.id}
      />
    </div>
  );
}