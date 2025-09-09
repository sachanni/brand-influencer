import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Users, 
  TrendingUp, 
  Eye,
  Building,
  Mail,
  Phone,
  Globe,
  Star,
  ExternalLink,
  Edit,
  MoreHorizontal,
  Loader2,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  X,
  Calendar,
  Target,
  CreditCard,
  BarChart3,
  MessageCircle,
  User,
  Upload,
  Heart,
  Share,
  Camera,
  Video,
  Image,
  AlertTriangle,
  Shield,
  Zap,
  TrendingDown,
  Send,
  Paperclip,
  Download
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useBrandCurrency } from "@/hooks/useBrandCurrency";
import { Navigation } from "@/components/layout/navigation";
import { BrandNav } from "@/components/BrandNav";
import { ContentViewerModal } from "@/components/ContentViewerModal";
import { CampaignChat } from "@/components/CampaignChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'draft';
  budget: number;
  reach: number;
  engagement: string;
  startDate: string;
  endDate: string;
  collaborators: number;
  description: string;
  platforms: string[];
}

interface BrandProfile {
  companyName: string;
  industry: string;
  website: string;
  companySize: string;
  targetAudienceAge: string;
  targetAudienceGender: string;
  targetAudienceLocation: string;
  budgetRange: string;
  description: string;
  logoUrl: string;
}

interface ContentReviewCardProps {
  content: {
    id: string;
    title: string;
    description: string;
    contentType: string;
    contentUrl: string;
    previewUrl: string;
    platform: string;
    submittedAt: string;
    campaignTitle: string;
    influencerName: string;
    status?: 'submitted' | 'approved' | 'rejected' | 'live';
  };
  onApprove: () => void;
  onReject: () => void;
}

function ContentReviewCard({ content, onApprove, onReject }: ContentReviewCardProps) {
  const [showContentModal, setShowContentModal] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showInlineVideo, setShowInlineVideo] = useState(false);
  const [showInlinePdf, setShowInlinePdf] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'image': return <Eye className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'bg-pink-100 text-pink-800';
      case 'tiktok': return 'bg-black text-white';
      case 'youtube': return 'bg-red-100 text-red-800';
      case 'facebook': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
      {/* Campaign Header - Prominent Campaign Identification */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-lg">{content.campaignTitle}</h2>
              <p className="text-blue-100 text-sm">Content Review • {content.influencerName}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {content.status === 'submitted' ? 'Pending Review' : content.status}
          </Badge>
        </div>
      </div>
      {/* Header Section */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                {getContentTypeIcon(content.contentType)}
                <span className="text-sm font-medium capitalize text-gray-700">{content.contentType}</span>
              </div>
              <Badge variant="outline" className={
                content.status === 'submitted' ? "bg-orange-50 text-orange-700 border-orange-200 animate-pulse" :
                content.status === 'approved' ? "bg-green-50 text-green-700 border-green-200" :
                content.status === 'live' ? "bg-blue-50 text-blue-700 border-blue-200" :
                "bg-red-50 text-red-700 border-red-200"
              }>
                {content.status === 'submitted' && <Clock className="w-3 h-3 mr-1" />}
                {content.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                {content.status === 'live' && <ExternalLink className="w-3 h-3 mr-1" />}
                {content.status === 'submitted' ? 'Pending Review' :
                 content.status === 'approved' ? 'Approved' :
                 content.status === 'live' ? 'Published Live' :
                 content.status === 'rejected' ? 'Rejected' : content.status}
              </Badge>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{content.title}</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">{content.description}</p>
            
            {/* Content Details */}
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Badge className={getPlatformColor(content.platform)}>
                  {content.platform.charAt(0).toUpperCase() + content.platform.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Submitted {formatDate(content.submittedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {content.previewUrl && (
        <div className="mb-4">
          {content.contentType.toLowerCase() === 'video' ? (
            <div className="relative w-full bg-black rounded-xl border shadow-lg overflow-hidden">
              {showInlineVideo ? (
                // Inline Video Player (Industry Standard)
                (<div className="relative">
                  <video
                    className="w-full h-64 object-cover rounded-xl"
                    controls
                    preload="metadata"
                    poster={content.previewUrl}
                    onPlay={() => setVideoPlaying(true)}
                    onPause={() => setVideoPlaying(false)}
                    onError={(e) => {
                      console.error('Video failed to load:', content.contentUrl);
                      // Show error message to user
                      const video = e.target as HTMLVideoElement;
                      video.style.display = 'none';
                    }}
                    onLoadStart={() => console.log('Video loading started')}
                    onCanPlay={() => console.log('Video can play')}
                    data-testid={`inline-video-${content.id}`}
                  >
                    <source src={content.contentUrl} type="video/mp4" />
                    <source src={content.contentUrl} type="video/webm" />
                    <source src={content.contentUrl} type="video/mov" />
                    Your browser does not support the video tag.
                  </video>
                  {/* Platform Badge on Video */}
                  <div className="absolute top-3 right-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(content.platform)}`}>
                      {content.platform.charAt(0).toUpperCase() + content.platform.slice(1)}
                    </div>
                  </div>
                </div>)
              ) : (
                // Video Preview/Thumbnail (Click to Play)
                (<div 
                  className="relative w-full h-64 bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 rounded-xl overflow-hidden group cursor-pointer"
                  onClick={() => setShowInlineVideo(true)}
                  data-testid={`video-preview-${content.id}`}
                >
                  {/* Thumbnail Background */}
                  {content.previewUrl && (
                    <img 
                      src={content.previewUrl} 
                      alt={content.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-30" />
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 rounded-full p-6 shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-12 h-12 text-purple-600 ml-1" fill="currentColor" />
                    </div>
                  </div>
                  {/* Video Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium uppercase tracking-wide">Video Content</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-200">
                        <div className="flex items-center space-x-1">
                          <div className="w-4 h-3 bg-white rounded-sm opacity-80" />
                          <span>HD</span>
                        </div>
                        <span>•</span>
                        <span>Click to Play</span>
                      </div>
                    </div>
                  </div>
                  {/* Corner Platform Badge */}
                  <div className="absolute top-3 right-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(content.platform)}`}>
                      {content.platform.charAt(0).toUpperCase() + content.platform.slice(1)}
                    </div>
                  </div>
                </div>)
              )}
            </div>
          ) : content.contentType.toLowerCase() === 'image' ? (
            <div 
              className="relative w-full h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl border shadow-lg overflow-hidden group cursor-pointer"
              onClick={() => setShowContentModal(true)}
              data-testid={`image-preview-${content.id}`}
            >
              <div className="absolute inset-0 bg-black bg-opacity-10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Eye className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
                  <p className="text-lg font-semibold tracking-wide">Image Content</p>
                  <p className="text-sm opacity-90">High Resolution</p>
                </div>
              </div>
              <div className="absolute top-3 right-3">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(content.platform)}`}>
                  {content.platform.charAt(0).toUpperCase() + content.platform.slice(1)}
                </div>
              </div>
            </div>
          ) : content.contentType.toLowerCase() === 'pdf' ? (
            <div className="relative w-full bg-gray-100 rounded-xl border shadow-lg overflow-hidden">
              {showInlinePdf ? (
                // Inline PDF Viewer (Industry Standard)
                (<div className="relative">
                  <embed
                    src={content.contentUrl}
                    type="application/pdf"
                    className="w-full h-96 rounded-xl"
                    title={`PDF: ${content.title}`}
                    data-testid={`inline-pdf-${content.id}`}
                  />
                  {/* Platform Badge on PDF */}
                  <div className="absolute top-3 right-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(content.platform)}`}>
                      {content.platform.charAt(0).toUpperCase() + content.platform.slice(1)}
                    </div>
                  </div>
                </div>)
              ) : (
                // PDF Preview/Thumbnail (Click to View)
                (<div 
                  className="relative w-full h-64 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl overflow-hidden group cursor-pointer"
                  onClick={() => {
                    console.log('PDF clicked, opening inline viewer');
                    setShowInlinePdf(true);
                  }}
                  data-testid={`pdf-preview-${content.id}`}
                >
                  {/* Thumbnail Background */}
                  {content.previewUrl && (
                    <img 
                      src={content.previewUrl} 
                      alt={content.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-30" />
                  {/* Document Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 rounded-2xl p-8 shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                      <FileText className="w-16 h-16 text-indigo-600" />
                    </div>
                  </div>
                  {/* PDF Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium uppercase tracking-wide">PDF Content</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-200">
                        <span>Click to View</span>
                      </div>
                    </div>
                  </div>
                  {/* Corner Platform Badge */}
                  <div className="absolute top-3 right-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(content.platform)}`}>
                      {content.platform.charAt(0).toUpperCase() + content.platform.slice(1)}
                    </div>
                  </div>
                </div>)
              )}
            </div>
          ) : (
            <div 
              className="relative w-full h-64 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500 rounded-xl border shadow-lg overflow-hidden group cursor-pointer"
              onClick={() => setShowContentModal(true)}
              data-testid={`content-preview-${content.id}`}
            >
              <div className="absolute inset-0 bg-black bg-opacity-10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <FileText className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
                  <p className="text-lg font-semibold tracking-wide capitalize">{content.contentType} Content</p>
                  <p className="text-sm opacity-90">Ready for Review</p>
                </div>
              </div>
              <div className="absolute top-3 right-3">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(content.platform)}`}>
                  {content.platform.charAt(0).toUpperCase() + content.platform.slice(1)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Action Footer */}
      <div className="bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {content.contentUrl && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowContentModal(true)}
                className="hover:bg-white"
                data-testid={`button-view-content-${content.id}`}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Full Content
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onReject}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400 font-semibold px-6"
              data-testid={`button-reject-${content.id}`}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button 
              size="sm"
              onClick={onApprove}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 shadow-md hover:shadow-lg transition-all duration-200"
              data-testid={`button-approve-${content.id}`}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>
      </div>
      {/* Content Viewer Modal */}
      <ContentViewerModal
        isOpen={showContentModal}
        onClose={() => setShowContentModal(false)}
        content={content}
      />
    </div>
  );
}

export default function BrandDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { formatBrandCurrency } = useBrandCurrency();

  // Fetch pending payments for quick overview
  const { data: pendingPaymentsData } = useQuery({
    queryKey: ['/api/pending-payments'],
    queryFn: async () => {
      const response = await apiRequest('/api/pending-payments', 'GET');
      return response.json();
    },
  });

  const pendingPayments = pendingPaymentsData?.pendingPayments || [];

  // Fetch approved proposals needing upfront payments
  const { data: approvedProposalsData, refetch: refetchApprovedProposals } = useQuery({
    queryKey: ['/api/brand/approved-proposals'],
    queryFn: async () => {
      const response = await fetch('/api/brand/approved-proposals', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      return data;
    },
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache (renamed from cacheTime in TanStack Query v5)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch P&L summary for dashboard
  const { data: plSummaryData, isLoading: plSummaryLoading } = useQuery({
    queryKey: ['/api/reports/pnl/summary'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const plSummary = (plSummaryData as any)?.summary || {
    avgROI: 0,
    profitMargin: 0,
    totalRevenue: 0,
    totalCosts: 0
  };

  const approvedProposals = approvedProposalsData?.proposals || [];
  const [activeDetailView, setActiveDetailView] = useState<'campaigns' | 'collaborations' | 'reach' | 'engagement' | null>(null);
  const [showReportsModal, setShowReportsModal] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selectedCampaignWorkspace, setSelectedCampaignWorkspace] = useState<any>(null);

  // Report handling functions
  const handleViewMonthlyReport = async () => {
    setLoadingReport(true);
    setShowReportsModal('monthly');
    
    try {
      // First try to get existing statements
      const response = await fetch('/api/reports/statements', {
        credentials: 'include'
      });
      
      let data = await response.json();
      
      // If no statements exist, generate one
      if (data.success && data.statements.length === 0) {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        const generateResponse = await fetch('/api/reports/statements/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ year, month })
        });
        
        const generateData = await generateResponse.json();
        if (generateData.success) {
          data = { success: true, statements: [generateData.statement] };
        }
      }
      
      if (data.success) {
        setReportData(data.statements);
        toast({ title: "Monthly statement loaded successfully" });
      }
    } catch (error) {
      console.error('Error loading monthly statement:', error);
      toast({ title: "Failed to load monthly statement", variant: "destructive" });
    } finally {
      setLoadingReport(false);
    }
  };

  const handleViewPLReports = async () => {
    setLoadingReport(true);
    setShowReportsModal('pnl');
    
    try {
      // Get existing P&L reports
      const response = await fetch('/api/reports/pnl', {
        credentials: 'include'
      });
      
      let data = await response.json();
      
      // If no reports exist and we have campaigns, generate one
      if (data.success && data.reports.length === 0 && campaigns.length > 0) {
        const recentCampaign = campaigns[0];
        
        const generateResponse = await fetch('/api/reports/pnl/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            campaignId: recentCampaign.id,
            reportPeriod: 'campaign_total'
          })
        });
        
        const generateData = await generateResponse.json();
        if (generateData.success) {
          data = { success: true, reports: [generateData.report] };
        }
      }
      
      if (data.success) {
        setReportData(data.reports);
        toast({ title: "P&L reports loaded successfully" });
      }
    } catch (error) {
      console.error('Error loading P&L reports:', error);
      toast({ title: "Failed to load P&L reports", variant: "destructive" });
    } finally {
      setLoadingReport(false);
    }
  };

  const handleExportReports = async () => {
    try {
      // First get available statements
      const response = await fetch('/api/reports/statements', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success && data.statements.length > 0) {
        // Use the most recent statement
        const statement = data.statements[0];
        const url = `/api/reports/${statement.id}/export?reportType=statement`;
        window.open(url, '_blank');
        toast({ title: "Report exported successfully" });
      } else {
        // Generate a statement first, then export
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        const generateResponse = await fetch('/api/reports/statements/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ year, month })
        });
        
        const generateData = await generateResponse.json();
        if (generateData.success) {
          const url = `/api/reports/${generateData.statement.id}/export?reportType=statement`;
          window.open(url, '_blank');
          toast({ title: "Statement generated and exported successfully" });
        }
      }
    } catch (error) {
      console.error('Error exporting reports:', error);
      toast({ title: "Failed to export reports", variant: "destructive" });
    }
  };
  
  // Get campaigns from API
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<any[]>({
    queryKey: ["/api/brand/campaigns"],
  });
  
  // Get submitted content for review
  const { data: submittedContent = [], isLoading: contentLoading } = useQuery<any[]>({
    queryKey: ["/api/brand/content-review"],
  });
  
  // Calculate metrics from real data with proper campaign categorization
  const activeCampaigns = campaigns.filter(c => c.status === 'active' && (c.collaborators || 0) === 0);
  const inProgressCampaigns = campaigns.filter(c => c.status === 'active' && (c.collaborators || 0) > 0);
  const completedCampaigns = campaigns.filter(c => c.status === 'completed');
  const draftCampaigns = campaigns.filter(c => c.status === 'draft');
  
  const metrics = {
    activeCampaigns: activeCampaigns.length,
    inProgressCampaigns: inProgressCampaigns.length,
    totalCampaigns: campaigns.length,
    totalCollaborations: campaigns.reduce((total, c) => total + (c.collaborators || 0), 0),
    totalReach: campaigns.reduce((total, c) => total + (c.reach || 0), 0),
    avgEngagement: campaigns.length > 0 
      ? (campaigns.reduce((total, c) => total + parseFloat(c.engagement || '0'), 0) / campaigns.length)
      : 0
  };


  const [brandProfile] = useState<BrandProfile>({
    companyName: "Luxe Beauty Co.",
    industry: "Fashion & Beauty",
    website: "https://luxebeauty.com",
    companySize: "medium",
    targetAudienceAge: "25-34",
    targetAudienceGender: "female",
    targetAudienceLocation: "North America",
    budgetRange: "₹8L-₹20L",
    description: "Premium beauty brand focusing on sustainable, cruelty-free cosmetics for the modern woman.",
    logoUrl: ""
  });

  const getStatusColor = (status: string, collaborators: number = 0) => {
    if (status === 'active' && collaborators > 0) {
      return 'bg-blue-100 text-blue-800'; // In Progress
    }
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'; // Seeking Influencers
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayStatus = (status: string, collaborators: number = 0) => {
    if (status === 'active' && collaborators > 0) {
      return 'in progress';
    }
    return status === 'active' ? 'seeking influencers' : status;
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'bg-pink-100 text-pink-800';
      case 'tiktok': return 'bg-purple-100 text-purple-800';
      case 'youtube': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  // Content review mutation
  const reviewContentMutation = useMutation({
    mutationFn: async ({ contentId, status, feedback }: { contentId: string; status: string; feedback?: string }) => {
      const response = await fetch(`/api/brand/content/${contentId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, feedback })
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand/content-review'] });
      
      // Show appropriate success message
      if (data.paymentNotification) {
        // Content approval triggered automatic payment
        toast({ 
          title: '✅ Content Approved & Payment Processed', 
          description: data.paymentNotification.message,
          className: 'bg-green-50 border-green-200'
        });
      } else {
        // Regular content review
        toast({ title: 'Success', description: 'Content review submitted successfully' });
      }
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to submit content review', variant: 'destructive' });
    }
  });

  // Mutation for initiating upfront payments
  const initiateUpfrontPaymentMutation = useMutation({
    mutationFn: async ({ proposalId }: { proposalId: string }) => {
      return await apiRequest('/api/payments/upfront', 'POST', { proposalId });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand/approved-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pending-payments'] });
      toast({ title: 'Success', description: 'Upfront payment initiated successfully. Redirecting to payment...' });
      
      // Redirect to payment page or process payment
      if ((data as any).payment?.razorpayOrderId) {
        // Handle Razorpay payment flow here
        console.log('Payment created:', (data as any).payment);
      }
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to initiate upfront payment', 
        variant: 'destructive' 
      });
    }
  });

  const handleContentReview = async (contentId: string, status: 'approved' | 'rejected', feedback?: string) => {
    await reviewContentMutation.mutateAsync({ contentId, status, feedback });
  };

  const handleInitiateUpfrontPayment = async (proposalId: string) => {
    await initiateUpfrontPaymentMutation.mutateAsync({ proposalId });
  };

  const { themeConfig } = useTheme();
  
  return (
    <div className={`min-h-screen ${themeConfig.background}`}>
      <Navigation />
      {/* Dynamic background decorations */}
      {themeConfig.decorations}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BrandNav />
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="glass bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-400/20 text-white cursor-pointer hover:from-purple-600/30 hover:to-blue-600/30 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl backdrop-blur-lg"
            onClick={() => setActiveDetailView('campaigns')}
            data-testid="card-campaigns"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Campaigns</p>
                  <p className="text-3xl font-bold">{campaignsLoading ? '-' : metrics.totalCampaigns}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-400/20 text-white cursor-pointer hover:from-green-600/30 hover:to-emerald-600/30 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl backdrop-blur-lg"
            onClick={() => setActiveDetailView('collaborations')}
            data-testid="card-collaborations"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Collaborations</p>
                  <p className="text-3xl font-bold">{campaignsLoading ? '-' : metrics.totalCollaborations}</p>
                </div>
                <Users className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-400/20 text-white cursor-pointer hover:from-purple-600/30 hover:to-pink-600/30 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl backdrop-blur-lg"
            onClick={() => setActiveDetailView('reach')}
            data-testid="card-reach"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Reach</p>
                  <p className="text-3xl font-bold">{campaignsLoading ? '-' : formatNumber(metrics.totalReach)}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-400/20 text-white cursor-pointer hover:from-orange-600/30 hover:to-red-600/30 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl backdrop-blur-lg"
            onClick={() => setActiveDetailView('engagement')}
            data-testid="card-engagement"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Engagement</p>
                  <p className="text-3xl font-bold">{campaignsLoading ? '-' : metrics.avgEngagement}%</p>
                </div>
                <Star className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Reports Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Financial Reports</h2>
              <p className="text-gray-600">Track your campaign spending, ROI, and financial performance</p>
            </div>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth() + 1;
                
                fetch('/api/reports/statements/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ year, month })
                })
                .then(res => res.json())
                .then(data => {
                  if (data.success) {
                    toast({ title: "Statement generated successfully" });
                  }
                })
                .catch(err => {
                  toast({ title: "Failed to generate statement", variant: "destructive" });
                });
              }}
              data-testid="button-generate-statement"
            >
              <FileText className="w-4 h-4" />
              Generate Statement
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Monthly Statements */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Monthly Statements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Month</span>
                    <span className="font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Campaigns</span>
                    <span className="font-medium">{metrics.totalCampaigns}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Campaign Spend</span>
                    <span className="font-medium text-red-600">-${(metrics.totalCampaigns * 2500).toLocaleString()}</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={handleViewMonthlyReport}
                    disabled={loadingReport}
                    data-testid="button-view-monthly"
                  >
                    {loadingReport && showReportsModal === 'monthly' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'View Monthly Report'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Campaign P&L */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Campaign P&L
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Campaigns</span>
                    <span className="font-medium">{campaigns.filter(c => c.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg. ROI</span>
                    {plSummaryLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className={`font-medium ${plSummary.avgROI > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {plSummary.avgROI > 0 ? '+' : ''}{plSummary.avgROI}%
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Profit Margin</span>
                    {plSummaryLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className={`font-medium ${plSummary.profitMargin > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {plSummary.profitMargin > 0 ? '+' : ''}{plSummary.profitMargin}%
                      </span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={handleViewPLReports}
                    disabled={loadingReport}
                    data-testid="button-view-pnl"
                  >
                    {loadingReport && showReportsModal === 'pnl' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'View P&L Reports'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Financial Analytics */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Financial Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-medium text-green-600">${(metrics.totalReach * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cost per Engagement</span>
                    <span className="font-medium">${((metrics.totalCampaigns * 2500) / Math.max(metrics.totalReach * (Number(metrics.avgEngagement) / 100), 1)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending Invoices</span>
                    <span className="font-medium text-orange-600">3</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-3 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={handleExportReports}
                    data-testid="button-view-analytics"
                  >
                    Export Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Campaigns */}
          <div className="lg:col-span-2">
            <Card className="glass bg-white/10 border-white/20 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Active Campaigns <span className="text-sm text-purple-200 font-normal">(Seeking Influencers)</span></CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaignsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">Loading campaigns...</p>
                  </div>
                ) : activeCampaigns.length === 0 ? (
                  <div className="text-center py-8 pt-[16px] pb-[16px] pl-[16px] pr-[16px] bg-[#dbeafe] rounded-xl">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns seeking influencers</h3>
                    <p className="text-gray-600">Create your first campaign to start finding influencers!</p>
                  </div>
                ) : (
                  activeCampaigns.map((campaign) => (
                    <Card 
                      key={campaign.id} 
                      className="group relative overflow-hidden border-2 border-purple-400 hover:border-purple-600 transition-all duration-300 hover:shadow-2xl bg-gradient-to-br from-purple-50/80 to-white hover:-translate-y-1"
                    >
                      {/* Campaign Thumbnail Background */}
                      {campaign.thumbnailUrl && (
                        <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                          <img
                            src={campaign.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100/30 via-pink-100/20 to-transparent pointer-events-none" />
                      
                      <CardContent className="relative p-6">
                        {/* Header Section */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            {/* Campaign Thumbnail */}
                            {campaign.thumbnailUrl && (
                              <div className="w-12 h-12 rounded-xl overflow-hidden mb-4 ring-2 ring-purple-100 shadow-lg">
                                <img
                                  src={campaign.thumbnailUrl}
                                  alt={campaign.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                            )}
                            
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                                {campaign.title}
                              </h3>
                              <Badge className={`${getStatusColor(campaign.status, campaign.collaborators)} shadow-sm`}>
                                {getDisplayStatus(campaign.status, campaign.collaborators)}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                              {campaign.description}
                            </p>
                          </div>
                          
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-purple-600">
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </div>

                        {/* Platform Tags */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          {(campaign.platforms || []).map((platform: string) => (
                            <Badge 
                              key={platform} 
                              className={`${getPlatformColor(platform)} border-2 shadow-md px-3 py-1 text-xs font-medium hover:shadow-lg transition-all duration-200`}
                            >
                              {platform}
                            </Badge>
                          ))}
                        </div>

                        {/* Key Metrics - Only Most Important for Active Campaigns */}
                        <div className="grid grid-cols-4 gap-3 mb-6">
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-100/80 to-emerald-100/80 rounded-xl border-2 border-green-300">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-green-600" />
                              <span className="text-green-700 font-medium text-xs">Budget</span>
                            </div>
                            <p className="font-bold text-green-800 text-sm">
                              {campaign.budgetRange || '₹1K-₹10K'}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-100/80 to-cyan-100/80 rounded-xl border-2 border-blue-300">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="text-blue-700 font-medium text-xs">Applications</span>
                            </div>
                            <p className="font-bold text-blue-800">{campaign.proposalsCount || 0}</p>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-100/80 to-amber-100/80 rounded-xl border-2 border-orange-300">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-orange-600" />
                              <span className="text-orange-700 font-medium text-xs">Approved</span>
                            </div>
                            <p className="font-bold text-orange-800">{campaign.approvedProposals || 0}</p>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-100/80 to-violet-100/80 rounded-xl border-2 border-purple-300">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-purple-600" />
                              <span className="text-purple-700 font-medium text-xs">Status</span>
                            </div>
                            <Badge className="bg-green-100/80 text-green-800 border-2 border-green-300 text-xs">
                              Seeking
                            </Badge>
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between pt-4 border-t-2 border-gray-300">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {campaign.startDate && campaign.endDate ? 
                                  `${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()}` :
                                  'Dates TBD'
                                }
                              </span>
                            </div>
                            
                            {/* Quick Status Indicator */}
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-xs text-green-600 font-medium">Live & Seeking</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Quick Action - View Applications */}
                            {(campaign.proposalsCount || 0) > 0 && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setLocation('/brand-campaign-management')}
                                className="text-blue-600 border-2 border-blue-300 hover:bg-blue-100 hover:border-blue-400"
                                data-testid={`button-view-applications-${campaign.id}`}
                              >
                                <Users className="w-4 h-4 mr-1" />
                                {campaign.proposalsCount}
                              </Button>
                            )}
                            
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => setLocation('/brand-campaign-management')}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-purple-500 hover:border-purple-600"
                              data-testid={`button-view-details-${campaign.id}`}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Manage
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {/* In Progress Campaigns */}
            {inProgressCampaigns.length > 0 && (
              <Card className="mt-6 glass bg-white/10 border-white/20 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-white">In Progress <span className="text-sm text-blue-200 font-normal">(With Assigned Influencers)</span></CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {inProgressCampaigns.map((campaign) => (
                    <Card 
                      key={campaign.id} 
                      className="group relative overflow-hidden border-2 border-blue-400 hover:border-blue-600 transition-all duration-300 hover:shadow-2xl bg-gradient-to-br from-blue-50/80 to-white hover:-translate-y-1"
                    >
                      {/* Campaign Thumbnail Background */}
                      {campaign.thumbnailUrl && (
                        <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                          <img
                            src={campaign.thumbnailUrl}
                            alt={campaign.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Proposal Alert Badge */}
                      {(campaign.pendingProposals || 0) > 0 && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 animate-pulse shadow-lg">
                            <AlertTriangle className="w-3 h-3" />
                            {campaign.pendingProposals} New Proposal{campaign.pendingProposals !== 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                      
                      <CardContent className="relative z-10 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900 text-lg">{campaign.title}</h3>
                              <Badge className="bg-blue-100 text-blue-800 border border-blue-300">
                                🔄 in progress
                              </Badge>
                            </div>
                            <p className="text-gray-700 mb-3 leading-relaxed">{campaign.description}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {(campaign.platforms || []).map((platform: string) => (
                                <Badge key={platform} variant="outline" className={`${getPlatformColor(platform)} border font-medium`}>
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-4">
                          <div className="bg-white/60 p-3 rounded-lg border border-blue-200">
                            <span className="text-blue-600 font-medium">💰 Budget</span>
                            <p className="font-bold text-gray-900">{campaign.budget ? formatCurrency(Number(campaign.budget)) : 'TBD'}</p>
                          </div>
                          <div className="bg-white/60 p-3 rounded-lg border border-blue-200">
                            <span className="text-blue-600 font-medium">📊 Applications</span>
                            <p className="font-bold text-gray-900">{campaign.proposalsCount || 0}</p>
                          </div>
                          <div className="bg-white/60 p-3 rounded-lg border border-orange-200">
                            <span className="text-orange-600 font-medium">✅ Approved</span>
                            <p className="font-bold text-orange-800">{campaign.approvedProposals || 0}</p>
                          </div>
                          <div className="bg-white/60 p-3 rounded-lg border border-blue-200">
                            <span className="text-blue-600 font-medium">🎯 Status</span>
                            <p className="font-bold text-blue-700">In Progress</p>
                          </div>
                          <div className="bg-white/60 p-3 rounded-lg border border-blue-200">
                            <span className="text-blue-600 font-medium">👥 Collaborators</span>
                            <p className="font-bold text-blue-700">{campaign.collaborators || 0}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {campaign.startDate && campaign.endDate ? 
                                `${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()}` :
                                'Dates TBD'
                              }
                            </span>
                            <span className="text-green-600 font-medium">● Live & Seeking</span>
                          </div>
                          <div className="flex gap-2">
                            {(campaign.pendingProposals || 0) > 0 && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  localStorage.setItem('viewCampaignId', campaign.id);
                                  localStorage.setItem('viewProposals', 'true');
                                  setLocation('/brand-campaign-management');
                                }}
                                className="bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                                data-testid={`button-review-proposals-${campaign.id}`}
                              >
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Review Proposals ({campaign.pendingProposals})
                              </Button>
                            )}
                            
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => setLocation('/brand-campaign-management')}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-blue-500 hover:border-blue-600"
                              data-testid={`button-manage-${campaign.id}`}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Manage
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Content Review Section */}
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Content Review Workspace
                  {submittedContent.length > 0 && (
                    <Badge className="bg-orange-100 text-orange-800">
                      {submittedContent.length} pending
                    </Badge>
                  )}
                </CardTitle>
                <div className="text-sm text-gray-500">
                  Review submitted content from approved campaigns
                </div>
              </CardHeader>
              <CardContent>
                {contentLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">Loading submitted content...</p>
                  </div>
                ) : submittedContent.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No content pending review</h3>
                    <p className="text-gray-600">Submitted content from influencers will appear here for approval.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submittedContent.map((content) => (
                      <ContentReviewCard 
                        key={content.id}
                        content={content}
                        onApprove={() => handleContentReview(content.id, 'approved')}
                        onReject={() => handleContentReview(content.id, 'rejected')}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Campaigns */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Past Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Eco-Urban Beauty Line</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>2.4M</span>
                          <span>5.2%</span>
                          <span>\u20b910L</span>
                          <span>6</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </div>
                </div>
                <Button variant="link" className="mt-3 p-0 h-auto text-teal-600">
                  See all campaigns
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Building className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Brand Contact</p>
                      <p className="font-medium">{(user as any)?.firstName || 'John'} {(user as any)?.lastName || 'Smith'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{(user as any)?.email || 'contact@luxebeauty.com'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{(user as any)?.phone || '+1 (555) 123-4567'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <a href={brandProfile.website} className="font-medium text-teal-600 hover:text-teal-700 flex items-center">
                        {brandProfile.website}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Target Audience</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Age Range:</span>
                      <span className="font-medium">{brandProfile.targetAudienceAge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gender:</span>
                      <span className="font-medium capitalize">{brandProfile.targetAudienceGender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium">{brandProfile.targetAudienceLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Budget Range:</span>
                      <span className="font-medium">{brandProfile.budgetRange}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button className="w-full bg-teal-600 hover:bg-teal-700" data-testid="button-send-inquiry">
                    Send Inquiry
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Overview
                  {(pendingPayments.length > 0 || approvedProposals.length > 0) && (
                    <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">
                      {pendingPayments.length + approvedProposals.length} action{pendingPayments.length + approvedProposals.length !== 1 ? 's' : ''} needed
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Approved Proposals - Professional Payment Section */}
                {approvedProposals.length > 0 && (
                  <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                    {/* Header with Clear Action Indicator */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Ready to Launch</h3>
                          <p className="text-sm text-gray-600">Proposals approved - Initiate payments to begin work</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 px-3 py-1">
                          {approvedProposals.length} Campaign{approvedProposals.length !== 1 ? 's' : ''} Ready
                        </Badge>
                      </div>
                    </div>

                    {/* Professional Payment Info Panel */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-blue-900">Payment Structure</h4>
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">Industry Standard</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-blue-700">Service Fee + 18% GST</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-blue-700">Custom Payment Structure</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-blue-700">ITC Eligible for Your Business</span>
                        </div>
                      </div>
                    </div>
                    {/* Premium Campaign Cards */}
                    <div className="space-y-4">
                      {approvedProposals.slice(0, 3).map((proposal: any) => (
                        <div key={proposal.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                          
                          {/* Campaign Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">{proposal.campaign?.title?.charAt(0)}</span>
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900 text-lg">{proposal.campaign?.title}</h4>
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 text-xs">
                                      ✓ Approved
                                    </Badge>
                                    <span className="text-sm text-gray-500">Campaign Ready</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span>@{proposal.influencer?.username}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>{proposal.deliverables}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  <span>{proposal.timeline}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Professional Payment Breakdown */}
                          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 mb-4">
                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-blue-600" />
                              Investment Breakdown
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">Service Fee</span>
                                  <span className="font-medium">₹{proposal.proposedCompensation?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">GST (18%)</span>
                                  <span className="font-medium">₹{Math.round((proposal.proposedCompensation || 0) * 0.18).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-base font-bold border-t border-gray-200 pt-2">
                                  <span className="text-gray-900">Total Investment</span>
                                  <span className="text-blue-600">₹{Math.round((proposal.proposedCompensation || 0) * 1.18).toLocaleString()}</span>
                                </div>
                              </div>
                              
                              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                                <div className="text-center">
                                  <div className="text-xs text-green-600 font-medium mb-1">Pay Now to Start</div>
                                  <div className="text-2xl font-bold text-green-700">₹{Math.round(((proposal.proposedCompensation || 0) * 1.18 - (proposal.proposedCompensation || 0) * 1.18 * 0.05) * 0.5).toLocaleString()}</div>
                                  <div className="text-xs text-green-600">50% Upfront Payment</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Remaining 50% paid after work completion
                              </span>
                            </div>
                            <div className="flex gap-3">
                              <Button
                                size="sm" 
                                variant="outline"
                                className="border-blue-500 text-blue-600 hover:bg-blue-50 font-medium px-4"
                                onClick={() => setSelectedCampaignWorkspace(proposal)}
                                data-testid={`button-workspace-${proposal.id}`}
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                View Workspace
                              </Button>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold px-6 shadow-md hover:shadow-lg transition-all duration-200"
                                onClick={() => handleInitiateUpfrontPayment(proposal.id)}
                                disabled={initiateUpfrontPaymentMutation.isPending}
                                data-testid={`button-initiate-payment-${proposal.id}`}
                              >
                                {initiateUpfrontPaymentMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <CreditCard className="w-4 h-4 mr-2" />
                                )}
                                Start Campaign
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {approvedProposals.length > 3 && (
                        <p className="text-sm text-blue-600 font-medium">
                          +{approvedProposals.length - 3} more proposal{approvedProposals.length - 3 !== 1 ? 's' : ''} waiting...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Pending Payments - Modern Alert Section */}
                {pendingPayments.length > 0 ? (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
                    {/* Alert Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Payment Action Required</h3>
                          <p className="text-sm text-gray-600">Complete pending payments to maintain workflow</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                        <Badge className="bg-gradient-to-r from-amber-100 to-orange-200 text-amber-800 border-amber-300 px-3 py-1">
                          {pendingPayments.length} Payment{pendingPayments.length !== 1 ? 's' : ''} Due
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Outstanding Amount Card */}
                    <div className="bg-gradient-to-r from-white to-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                      <div className="text-center">
                        <div className="text-sm text-amber-600 font-medium mb-1">Total Outstanding</div>
                        <div className="text-3xl font-bold text-amber-700">
                          ₹{pendingPayments.reduce((total: number, payment: any) => 
                            total + (payment.proposal?.proposedCompensation || 0), 0
                          ).toLocaleString()}
                        </div>
                        <div className="text-xs text-amber-600">Across {pendingPayments.length} campaign{pendingPayments.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    
                    {/* Pending Items Preview */}
                    <div className="space-y-3 mb-6">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{pendingPayments.length}</span>
                        </div>
                        Recent Due Payments
                      </h4>
                      {pendingPayments.slice(0, 2).map((payment: any) => (
                        <div key={`${payment.campaign.id}-${payment.proposal.id}`} className="bg-white rounded-lg p-3 border border-amber-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{payment.campaign.title}</div>
                              <div className="text-sm text-gray-600">@{payment.influencer?.username}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-amber-700">₹{payment.proposal?.proposedCompensation?.toLocaleString()}</div>
                              <div className="text-xs text-amber-600">Due: {new Date(payment.dueDate).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {pendingPayments.length > 2 && (
                        <div className="text-center">
                          <span className="inline-flex items-center gap-2 text-sm text-amber-600 font-medium bg-amber-100 px-3 py-1 rounded-full">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            +{pendingPayments.length - 2} more payment{pendingPayments.length - 2 !== 1 ? 's' : ''} waiting
                          </span>
                        </div>
                      )}
                    </div>
                
                    {/* Action Button */}
                    <Button 
                      className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-3 shadow-md hover:shadow-lg transition-all duration-200"
                      onClick={() => setLocation('/settings-payment')}
                      data-testid="button-process-payments"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Process {pendingPayments.length} Payment{pendingPayments.length !== 1 ? 's' : ''} Now
                    </Button>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">All Payments Current</h3>
                    <p className="text-sm text-gray-600">Your payment obligations are up to date</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Detail View Modals */}
      <Dialog open={activeDetailView !== null} onOpenChange={() => setActiveDetailView(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeDetailView === 'campaigns' && (
                <>
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  Campaign Details
                </>
              )}
              {activeDetailView === 'collaborations' && (
                <>
                  <Users className="h-5 w-5 text-green-600" />
                  Collaboration Details
                </>
              )}
              {activeDetailView === 'reach' && (
                <>
                  <Eye className="h-5 w-5 text-purple-600" />
                  Reach Analytics
                </>
              )}
              {activeDetailView === 'engagement' && (
                <>
                  <Star className="h-5 w-5 text-orange-600" />
                  Engagement Analytics
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {activeDetailView === 'campaigns' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-teal-50 border-teal-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-teal-700 text-sm font-medium">Active Campaigns</p>
                          <p className="text-2xl font-bold text-teal-800">{metrics.activeCampaigns}</p>
                        </div>
                        <TrendingUp className="h-6 w-6 text-teal-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-700 text-sm font-medium">In Progress</p>
                          <p className="text-2xl font-bold text-blue-800">{metrics.inProgressCampaigns}</p>
                        </div>
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-700 text-sm font-medium">Completed</p>
                          <p className="text-2xl font-bold text-purple-800">{completedCampaigns.length}</p>
                        </div>
                        <CheckCircle className="h-6 w-6 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">All Campaigns</h3>
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{campaign.title}</h4>
                              <Badge className={getStatusColor(campaign.status, campaign.collaborators)}>
                                {getDisplayStatus(campaign.status, campaign.collaborators)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Budget:</span>
                                <p className="font-medium">{campaign.budget ? formatCurrency(Number(campaign.budget)) : 'TBD'}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Reach:</span>
                                <p className="font-medium">{formatNumber(campaign.reach || 0)}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Engagement:</span>
                                <p className="font-medium">{campaign.engagement || '0%'}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Collaborators:</span>
                                <p className="font-medium">{campaign.collaborators || 0}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeDetailView === 'collaborations' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-700 text-sm font-medium">Total Collaborations</p>
                          <p className="text-2xl font-bold text-green-800">{metrics.totalCollaborations}</p>
                        </div>
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-700 text-sm font-medium">Active Campaigns</p>
                          <p className="text-2xl font-bold text-blue-800">{inProgressCampaigns.length}</p>
                        </div>
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Campaigns with Collaborations</h3>
                  {inProgressCampaigns.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No active collaborations</h3>
                        <p className="text-gray-600">Your campaigns haven't received any influencer applications yet.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    inProgressCampaigns.map((campaign) => (
                      <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium">{campaign.title}</h4>
                              <p className="text-sm text-gray-600">{campaign.description}</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              {campaign.collaborators} Collaborator{campaign.collaborators !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Budget:</span>
                              <p className="font-medium">{campaign.budget ? formatCurrency(Number(campaign.budget)) : 'TBD'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Expected Reach:</span>
                              <p className="font-medium">{formatNumber(campaign.reach || 0)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Target Engagement:</span>
                              <p className="font-medium">{campaign.engagement || '0%'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeDetailView === 'reach' && (
              <div className="space-y-4">
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-purple-700 text-sm font-medium">Total Reach</p>
                        <p className="text-3xl font-bold text-purple-800">{formatNumber(metrics.totalReach)}</p>
                      </div>
                      <Eye className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-sm text-purple-600">
                      Combined reach across all your campaign collaborations
                    </p>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Reach by Campaign Status</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Active Campaigns:</span>
                          <span className="font-medium">{formatNumber(activeCampaigns.reduce((total, c) => total + (c.reach || 0), 0))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">In Progress:</span>
                          <span className="font-medium">{formatNumber(inProgressCampaigns.reduce((total, c) => total + (c.reach || 0), 0))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Completed:</span>
                          <span className="font-medium">{formatNumber(completedCampaigns.reduce((total, c) => total + (c.reach || 0), 0))}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Average Reach per Campaign</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">All Campaigns:</span>
                          <span className="font-medium">{campaigns.length > 0 ? formatNumber(Math.round(metrics.totalReach / campaigns.length)) : '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Active Only:</span>
                          <span className="font-medium">{activeCampaigns.length > 0 ? formatNumber(Math.round(activeCampaigns.reduce((total, c) => total + (c.reach || 0), 0) / activeCampaigns.length)) : '0'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeDetailView === 'engagement' && (
              <div className="space-y-4">
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-orange-700 text-sm font-medium">Average Engagement Rate</p>
                        <p className="text-3xl font-bold text-orange-800">{metrics.avgEngagement}%</p>
                      </div>
                      <Star className="h-8 w-8 text-orange-600" />
                    </div>
                    <p className="text-sm text-orange-600">
                      Average engagement rate across all campaign collaborations
                    </p>
                  </CardContent>
                </Card>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Engagement by Campaign</h3>
                  {campaigns.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No engagement data</h3>
                        <p className="text-gray-600">Create campaigns to start tracking engagement metrics.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    campaigns.map((campaign) => {
                      const engagement = parseFloat(campaign.engagement || '0');
                      return (
                        <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium">{campaign.title}</h4>
                                <Badge className={getStatusColor(campaign.status, campaign.collaborators)}>
                                  {getDisplayStatus(campaign.status, campaign.collaborators)}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-orange-600">{engagement}%</p>
                                <p className="text-sm text-gray-600">Engagement Rate</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Reach:</span>
                                <p className="font-medium">{formatNumber(campaign.reach || 0)}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Collaborators:</span>
                                <p className="font-medium">{campaign.collaborators || 0}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Budget:</span>
                                <p className="font-medium">{campaign.budget ? formatCurrency(Number(campaign.budget)) : 'TBD'}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Financial Reports Modal */}
      <Dialog open={!!showReportsModal} onOpenChange={() => setShowReportsModal(null)}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showReportsModal === 'monthly' && (
                <>
                  <FileText className="w-5 h-5 text-blue-600" />
                  Monthly Financial Statements
                </>
              )}
              {showReportsModal === 'pnl' && (
                <>
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Campaign P&L Reports
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {loadingReport ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-gray-600">Loading report data...</p>
              </div>
            ) : reportData && reportData.length > 0 ? (
              <>
                {showReportsModal === 'monthly' && (
                  <div className="space-y-6">
                    {reportData.map((statement: any, index: number) => (
                      <Card key={statement.id || index} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {statement.statementType === 'monthly' ? 'Monthly' : 'Annual'} Statement - {statement.period}
                            </CardTitle>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              Generated: {new Date(statement.generatedAt).toLocaleDateString()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                              <p className="text-sm text-red-600 font-medium">Total Expenses</p>
                              <p className="text-2xl font-bold text-red-700">${statement.totalExpenses?.toLocaleString() || '0'}</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <p className="text-sm text-green-600 font-medium">Revenue Generated</p>
                              <p className="text-2xl font-bold text-green-700">${statement.revenue?.toLocaleString() || '0'}</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-600 font-medium">Net Profit</p>
                              <p className="text-2xl font-bold text-blue-700">${statement.netProfit?.toLocaleString() || '0'}</p>
                            </div>
                          </div>
                          
                          {statement.transactionsSummary && (
                            <div className="mb-4">
                              <h4 className="font-medium mb-3">Transaction Summary</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Count</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {Object.entries(statement.transactionsSummary).map(([category, data]: [string, any]) => (
                                    <TableRow key={category}>
                                      <TableCell className="font-medium">{category.replace(/_/g, ' ').toUpperCase()}</TableCell>
                                      <TableCell>{data.count}</TableCell>
                                      <TableCell className="text-right font-medium">
                                        ${data.amount?.toLocaleString() || '0'}
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
                                const url = `/api/reports/${statement.id}/export?reportType=statement`;
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

                {showReportsModal === 'pnl' && (
                  <div className="space-y-6">
                    {reportData.map((report: any, index: number) => (
                      <Card key={report.id || index} className="border-l-4 border-l-green-500">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {report.campaignName || report.campaignTitle || 'Campaign'} P&L Report - {report.reportPeriod?.toUpperCase()}
                            </CardTitle>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Campaign: {report.campaignName || report.campaignTitle || 'N/A'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-600 font-medium">Revenue</p>
                              <p className="text-xl font-bold text-blue-700">{formatBrandCurrency(Number(report.totalRevenue || 0))}</p>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                              <p className="text-sm text-red-600 font-medium">Costs</p>
                              <p className="text-xl font-bold text-red-700">{formatBrandCurrency(Number(report.totalCosts || 0))}</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <p className="text-sm text-green-600 font-medium">Profit</p>
                              <p className="text-xl font-bold text-green-700">{formatBrandCurrency(Number(report.grossProfit || 0))}</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <p className="text-sm text-purple-600 font-medium">ROI</p>
                              <p className="text-xl font-bold text-purple-700">{Number(report.roi || 0).toFixed(1)}%</p>
                            </div>
                          </div>

                          {report.costBreakdown && (
                            <div className="mb-4">
                              <h4 className="font-medium mb-3">Cost Breakdown</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Cost Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">% of Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {Object.entries(report.costBreakdown).map(([type, amount]: [string, any]) => (
                                    <TableRow key={type}>
                                      <TableCell className="font-medium">{type.replace(/_/g, ' ').toUpperCase()}</TableCell>
                                      <TableCell className="text-right">{formatBrandCurrency(Number(amount || 0))}</TableCell>
                                      <TableCell className="text-right">
                                        {Number(report.totalCosts) > 0 ? ((Number(amount) / Number(report.totalCosts)) * 100).toFixed(1) : '0'}%
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
                                const url = `/api/reports/${report.id}/export?reportType=pnl`;
                                window.open(url, '_blank');
                              }}
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Export PDF
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Available</h3>
                <p className="text-gray-600 mb-4">
                  {showReportsModal === 'monthly' 
                    ? 'Generate your first monthly statement to start tracking financial performance.'
                    : 'Create campaigns to generate P&L reports and track profitability.'
                  }
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (showReportsModal === 'monthly') {
                      handleViewMonthlyReport();
                    } else {
                      handleViewPLReports();
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
      {/* Brand Campaign Workspace Modal */}
      <Dialog open={!!selectedCampaignWorkspace} onOpenChange={(open) => !open && setSelectedCampaignWorkspace(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Campaign Workspace: {selectedCampaignWorkspace?.campaign?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Enhanced Stats Dashboard */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200 text-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:from-green-100 hover:to-green-150 cursor-pointer hover:cursor-pointer">
                <div className="space-y-1">
                  <div className="text-lg font-bold text-green-600">₹{selectedCampaignWorkspace?.proposedCompensation?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-green-600">+ GST (18%): ₹{Math.round((selectedCampaignWorkspace?.proposedCompensation || 0) * 0.18).toLocaleString()}</div>
                  <div className="text-xl font-bold text-green-700 border-t border-green-200 pt-1">₹{Math.round((selectedCampaignWorkspace?.proposedCompensation || 0) * 1.18).toLocaleString()}</div>
                </div>
                <div className="text-sm text-green-700">Total Investment</div>
                <div className="text-xs text-green-600 mt-1">Est. ROI: 3.2x</div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 text-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:from-blue-100 hover:to-blue-150 cursor-pointer hover:cursor-pointer">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedCampaignWorkspace?.campaign?.endDate 
                    ? Math.max(0, Math.ceil((new Date(selectedCampaignWorkspace.campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    : 0
                  }
                </div>
                <div className="text-sm text-blue-700">Days Remaining</div>
                <div className="text-xs text-blue-600 mt-1">On schedule</div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 text-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:from-purple-100 hover:to-purple-150 cursor-pointer hover:cursor-pointer">
                <div className="text-2xl font-bold text-purple-600">87%</div>
                <div className="text-sm text-purple-700">Confidence Score</div>
                <div className="text-xs text-purple-600 mt-1">High Success Rate</div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 text-center transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:from-orange-100 hover:to-orange-150 cursor-pointer hover:cursor-pointer">
                <div className="text-2xl font-bold text-orange-600">{selectedCampaignWorkspace?.status === 'completion_payment_pending' ? '90%' : '50%'}</div>
                <div className="text-sm text-orange-700">Campaign Progress</div>
                <div className="text-xs text-orange-600 mt-1">
                  {selectedCampaignWorkspace?.status === 'completion_payment_pending' ? 'Ready for review' : 'In progress'}
                </div>
              </div>
            </div>

            {/* Performance Metrics Bar */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border transition-all duration-200 hover:shadow-lg hover:from-gray-100 hover:to-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800">Expected Performance Metrics</h3>
                <Badge variant="secondary" className="transition-all duration-200 hover:scale-105">Based on influencer history</Badge>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-lg transition-all duration-200 hover:bg-blue-50 hover:shadow-sm cursor-pointer">
                  <div className="text-lg font-bold text-blue-600">2.4M</div>
                  <div className="text-xs text-gray-600">Est. Reach</div>
                </div>
                <div className="p-3 rounded-lg transition-all duration-200 hover:bg-green-50 hover:shadow-sm cursor-pointer">
                  <div className="text-lg font-bold text-green-600">8.5%</div>
                  <div className="text-xs text-gray-600">Avg Engagement</div>
                </div>
                <div className="p-3 rounded-lg transition-all duration-200 hover:bg-purple-50 hover:shadow-sm cursor-pointer">
                  <div className="text-lg font-bold text-purple-600">15K</div>
                  <div className="text-xs text-gray-600">Est. Clicks</div>
                </div>
                <div className="p-3 rounded-lg transition-all duration-200 hover:bg-orange-50 hover:shadow-sm cursor-pointer">
                  <div className="text-lg font-bold text-orange-600">$2.1</div>
                  <div className="text-xs text-gray-600">Cost per Click</div>
                </div>
              </div>
            </div>

            {/* Enhanced Tabbed Interface */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-gray-100 to-gray-200 p-2 rounded-xl h-auto shadow-sm border">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-blue-50 hover:border-blue-300 hover:border-2 hover:text-blue-700 text-gray-600 font-medium text-sm border-2 border-transparent"
                >
                  <Eye className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-green-50 hover:border-green-300 hover:border-2 hover:text-green-700 text-gray-600 font-medium text-sm border-2 border-transparent"
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="content" 
                  className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-purple-50 hover:border-purple-300 hover:border-2 hover:text-purple-700 text-gray-600 font-medium text-sm border-2 border-transparent"
                >
                  <FileText className="w-4 h-4" />
                  Content Hub
                </TabsTrigger>
                <TabsTrigger 
                  value="timeline" 
                  className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-orange-50 hover:border-orange-300 hover:border-2 hover:text-orange-700 text-gray-600 font-medium text-sm border-2 border-transparent"
                >
                  <Clock className="w-4 h-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger 
                  value="collaboration" 
                  className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-105 hover:bg-pink-50 hover:border-pink-300 hover:border-2 hover:text-pink-700 text-gray-600 font-medium text-sm border-2 border-transparent"
                >
                  <MessageCircle className="w-4 h-4" />
                  Communication
                </TabsTrigger>
              </TabsList>

              {/* Campaign Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Campaign & Influencer Details</h3>
                  
                  {/* Influencer Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Influencer: @{selectedCampaignWorkspace?.influencer?.username}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span> {selectedCampaignWorkspace?.influencer?.firstName} {selectedCampaignWorkspace?.influencer?.lastName}
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span> {selectedCampaignWorkspace?.influencer?.email}
                      </div>
                      <div>
                        <span className="text-gray-600">Deliverables:</span> {selectedCampaignWorkspace?.proposedDeliverables?.join(', ')}
                      </div>
                      <div>
                        <span className="text-gray-600">Timeline:</span> {selectedCampaignWorkspace?.proposedTimeline}
                      </div>
                    </div>
                  </div>

                  {/* Campaign Guidelines */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Campaign Requirements
                    </h4>
                    <p className="text-sm text-gray-700">{selectedCampaignWorkspace?.campaign?.requirements || selectedCampaignWorkspace?.campaign?.description}</p>
                  </div>
                </div>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Performance Analytics */}
                  <div className="bg-white p-6 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-102">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Performance Analytics
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg transition-all duration-200 hover:bg-blue-100 hover:shadow-sm cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Eye className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Estimated Reach</span>
                        </div>
                        <span className="font-bold text-blue-600">2.4M</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg transition-all duration-200 hover:bg-green-100 hover:shadow-sm cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Heart className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Expected Engagement</span>
                        </div>
                        <span className="font-bold text-green-600">8.5%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg transition-all duration-200 hover:bg-purple-100 hover:shadow-sm cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Target className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">Click-through Rate</span>
                        </div>
                        <span className="font-bold text-purple-600">0.62%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg transition-all duration-200 hover:bg-orange-100 hover:shadow-sm cursor-pointer">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium">Conversion Rate</span>
                        </div>
                        <span className="font-bold text-orange-600">1.8%</span>
                      </div>
                    </div>
                  </div>

                  {/* Audience Demographics */}
                  <div className="bg-white p-6 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-102">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Audience Demographics
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Age 18-24</span>
                          <span>32%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{width: '32%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Age 25-34</span>
                          <span>45%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{width: '45%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Age 35+</span>
                          <span>23%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{width: '23%'}}></div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center text-sm">
                          <span>Gender Split</span>
                          <div className="flex gap-2">
                            <Badge variant="secondary">Female 65%</Badge>
                            <Badge variant="outline">Male 35%</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROI Projection */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border transition-all duration-200 hover:shadow-lg hover:from-green-100 hover:to-blue-100">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    ROI Projection & Risk Assessment
                  </h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer">
                      <div className="text-2xl font-bold text-green-600">3.2x</div>
                      <div className="text-sm text-gray-600">Expected ROI</div>
                      <div className="text-xs text-green-600 mt-1">Based on similar campaigns</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer">
                      <div className="text-2xl font-bold text-blue-600">87%</div>
                      <div className="text-sm text-gray-600">Success Probability</div>
                      <div className="text-xs text-blue-600 mt-1">High confidence score</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer">
                      <div className="text-2xl font-bold text-orange-600">Low</div>
                      <div className="text-sm text-gray-600">Risk Level</div>
                      <div className="text-xs text-orange-600 mt-1">Verified influencer</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Content Hub Tab */}
              <TabsContent value="content" className="space-y-6 mt-6">
                <div className="space-y-6">
                  {/* Content Requirements */}
                  <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Content Requirements & Specifications
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium mb-3">Deliverables</h5>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                            <Video className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">1 Instagram Reel (15-30s)</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                            <Image className="w-4 h-4 text-green-600" />
                            <span className="text-sm">2 Story Posts</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                            <Camera className="w-4 h-4 text-purple-600" />
                            <span className="text-sm">1 Feed Post</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-3">Content Guidelines</h5>
                        <div className="space-y-2 text-sm text-gray-700">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <span>Include #sponsored hashtag</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <span>Tag @{selectedCampaignWorkspace?.campaign?.title?.toLowerCase().replace(/\s+/g, '')}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <span>Show product in natural setting</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <span>Include call-to-action in caption</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Status & Approval Workflow */}
                  <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      Content Approval Workflow
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <span className="font-medium">Draft Creation</span>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          <span className="font-medium">Content Submission</span>
                        </div>
                        <Badge variant="outline">Awaiting</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                          <span className="font-medium">Brand Review</span>
                        </div>
                        <Badge variant="outline">Upcoming</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                          <span className="font-medium">Content Publishing</span>
                        </div>
                        <Badge variant="outline">Final Step</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Enhanced Timeline Tab */}
              <TabsContent value="timeline" className="space-y-6 mt-6">
                <div className="space-y-6">
                  {/* Project Timeline */}
                  <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Campaign Timeline & Milestones
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-green-800">Proposal Approved</h5>
                            <span className="text-sm text-green-600">✓ Completed</span>
                          </div>
                          <p className="text-sm text-green-700 mt-1">Contract signed and campaign parameters finalized</p>
                          <p className="text-xs text-green-600 mt-2">Completed 2 days ago</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <Clock className="w-6 h-6 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-blue-800">Content Creation Phase</h5>
                            <span className="text-sm text-blue-600">🔄 In Progress</span>
                          </div>
                          <p className="text-sm text-blue-700 mt-1">Influencer is creating content according to brief specifications</p>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-blue-600 mb-1">
                              <span>Progress</span>
                              <span>60%</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{width: '60%'}}></div>
                            </div>
                          </div>
                          <p className="text-xs text-blue-600 mt-2">Estimated completion: 3 days</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-300">
                        <Upload className="w-6 h-6 text-orange-600 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-orange-800">Content Submission</h5>
                            <span className="text-sm text-orange-600">⏳ Upcoming</span>
                          </div>
                          <p className="text-sm text-orange-700 mt-1">Content will be submitted for brand review and approval</p>
                          <p className="text-xs text-orange-600 mt-2">Expected: 5 days from now</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-300">
                        <Shield className="w-6 h-6 text-purple-600 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-purple-800">Brand Review & Approval</h5>
                            <span className="text-sm text-purple-600">⏳ Pending</span>
                          </div>
                          <p className="text-sm text-purple-700 mt-1">48-hour review period for content approval or feedback</p>
                          <p className="text-xs text-purple-600 mt-2">Scheduled: 7 days from now</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                        <Play className="w-6 h-6 text-gray-600 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-800">Content Publishing</h5>
                            <span className="text-sm text-gray-600">⏳ Scheduled</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">Final content goes live across designated platforms</p>
                          <p className="text-xs text-gray-600 mt-2">Target date: 10 days from now</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Automated Alerts & Notifications */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      Automated Alerts & Risk Monitoring
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <h5 className="font-medium text-green-800 mb-2">✅ On Track</h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          <li>• Content creation timeline</li>
                          <li>• Budget allocation</li>
                          <li>• Influencer engagement</li>
                        </ul>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <h5 className="font-medium text-orange-800 mb-2">⚠️ Monitoring</h5>
                        <ul className="text-sm space-y-1 text-gray-700">
                          <li>• Delivery deadline adherence</li>
                          <li>• Content quality standards</li>
                          <li>• Communication responsiveness</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Communication Tab */}
              <TabsContent value="collaboration" className="space-y-6 mt-6">
                <div className="space-y-6">
                  {/* Communication Hub */}
                  <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                      Communication Hub
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium mb-3">Quick Actions</h5>
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Send className="w-4 h-4 mr-2" />
                            Send Message to Influencer
                          </Button>
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Paperclip className="w-4 h-4 mr-2" />
                            Share Brief Documents
                          </Button>
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Check-in Call
                          </Button>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-3">Communication Preferences</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                            <span>Primary: Platform Messages</span>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span>Email: Weekly Updates</span>
                            <Badge variant="outline">Enabled</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                            <span>SMS: Urgent Only</span>
                            <Badge variant="secondary">Available</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collaboration Tools */}
                  <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Collaboration Tools
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <h5 className="font-medium text-blue-800">Shared Documents</h5>
                        <p className="text-xs text-blue-600 mt-1">Brief, contracts, guidelines</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Download className="w-3 h-3 mr-1" />
                          Access
                        </Button>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <Camera className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <h5 className="font-medium text-green-800">Content Preview</h5>
                        <p className="text-xs text-green-600 mt-1">Real-time content sharing</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <h5 className="font-medium text-purple-800">Performance Data</h5>
                        <p className="text-xs text-purple-600 mt-1">Live analytics dashboard</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Monitor
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Feed */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      Recent Activity
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="text-sm">Influencer accepted campaign proposal</span>
                        <span className="text-xs text-gray-500 ml-auto">2 days ago</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm">Content brief document shared</span>
                        <span className="text-xs text-gray-500 ml-auto">1 day ago</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                        <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                        <span className="text-sm">Influencer marked content creation as 60% complete</span>
                        <span className="text-xs text-gray-500 ml-auto">6 hours ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Guidelines & Progress Tab (Legacy) */}
              <TabsContent value="monitoring" className="space-y-6 mt-6">
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
                    Campaign Timeline & Progress
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">Proposal Approved</div>
                        <div className="text-sm text-gray-600">Influencer proposal has been accepted</div>
                      </div>
                    </div>
                    {selectedCampaignWorkspace?.status === 'completion_payment_pending' ? (
                      <>
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-medium">Content Submitted</div>
                            <div className="text-sm text-gray-600">Awaiting final payment release</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <div>
                            <div className="font-medium">Final Payment Pending</div>
                            <div className="text-sm text-gray-600">Review content and release final payment</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium">Work in Progress</div>
                            <div className="text-sm text-gray-600">Influencer is creating content</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Upload className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="font-medium">Content Submission</div>
                            <div className="text-sm text-gray-600">Waiting for content delivery</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}