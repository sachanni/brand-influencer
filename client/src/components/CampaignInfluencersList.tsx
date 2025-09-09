import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Loader2, 
  MapPin, 
  Star, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  Mail,
  Phone,
  Instagram,
  Youtube,
  Music2,
  Facebook,
  Twitter,
  ExternalLink,
  BarChart3,
  DollarSign,
  IndianRupee,
  Euro,
  PoundSterling,
  Calendar,
  FileText,
  Activity,
  Bell
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InfluencerProposal {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  proposalText?: string;
  proposedDeliverables: string[];
  proposedTimeline: string;
  proposedCompensation: string;
  portfolioLinks: string[];
  additionalNotes?: string;
  brandFeedback?: string;
  createdAt: string;
  contentSubmissions?: any[];
  influencer: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    location?: string;
    bio?: string;
    email?: string;
    phoneNumber?: string;
    socialAccounts: Array<{
      platform: string;
      username: string;
      followerCount: number;
      engagementRate?: string;
    }>;
    categories: Array<{
      category: string;
    }>;
  };
}

interface CampaignInfluencersListProps {
  campaignId: string;
}

export function CampaignInfluencersList({ campaignId }: CampaignInfluencersListProps) {
  const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  // Fetch all proposals for this campaign
  const { data: proposals, isLoading } = useQuery<InfluencerProposal[]>({
    queryKey: [`/api/brand/campaigns/${campaignId}/proposals`],
    enabled: !!campaignId,
  });

  // Fetch brand profile to get preferred currency
  const { data: brandProfile } = useQuery({
    queryKey: ["/api/brand/profile"],
  });

  // Fetch conversation data to get unread counts for each proposal
  const { data: conversationsData } = useQuery({
    queryKey: ['/api/conversations/campaign', campaignId],
    enabled: !!campaignId,
    select: (data: any) => data || []
  });

  // Mutation to update proposal status
  const updateProposalMutation = useMutation({
    mutationFn: async ({ proposalId, status }: { proposalId: string; status: 'approved' | 'rejected' }) => {
      return apiRequest(`/api/brand/proposals/${proposalId}/status`, 'PUT', { status });
    },
    onSuccess: () => {
      // Invalidate and refetch proposals data
      queryClient.invalidateQueries({ queryKey: [`/api/brand/campaigns/${campaignId}/proposals`] });
    },
    onError: (error) => {
      console.error('Error updating proposal:', error);
    }
  });

  const approvedProposals = proposals?.filter(p => p.status === 'approved') || [];
  const pendingProposals = proposals?.filter(p => p.status === 'pending') || [];
  const rejectedProposals = proposals?.filter(p => p.status === 'rejected') || [];

  // Get currency icon based on brand's preferred currency
  const getCurrencyIcon = () => {
    const currency = (brandProfile as any)?.profile?.preferredCurrency || 'INR';
    switch (currency) {
      case 'USD':
        return DollarSign;
      case 'EUR':
        return Euro;
      case 'GBP':
        return PoundSterling;
      case 'INR':
      default:
        return IndianRupee;
    }
  };

  // Get currency symbol based on brand's preferred currency
  const getCurrencySymbol = () => {
    const currency = (brandProfile as any)?.profile?.preferredCurrency || 'INR';
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'INR':
      default:
        return '₹';
    }
  };

  const CurrencyIcon = getCurrencyIcon();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return "bg-green-100 text-green-800 border-green-200";
      case 'rejected': return "bg-red-100 text-red-800 border-red-200";
      case 'pending': return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'tiktok': return <Music2 className="w-4 h-4" />;
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mr-2 text-purple-600" />
        <span className="text-gray-600">Loading influencers...</span>
      </div>
    );
  }

  if (!proposals || proposals.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Influencers Yet</h3>
        <p className="text-gray-600 mb-4">No influencers have submitted proposals for this campaign.</p>
        <Button className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600">
          <Users className="w-4 h-4 mr-2" />
          Invite Influencers
        </Button>
      </div>
    );
  }

  // Helper to get unread count for a specific influencer
  const getUnreadCount = (influencerId: string) => {
    if (!conversationsData || !Array.isArray(conversationsData)) return 0;
    const conversation = conversationsData.find((conv: any) => 
      conv.influencerId === influencerId || conv.brandId === influencerId
    );
    return conversation?.unreadCount || 0;
  };

  const renderInfluencerCard = (proposal: InfluencerProposal) => {
    const unreadCount = getUnreadCount(proposal.influencer.id);
    const totalFollowers = proposal.influencer.socialAccounts.reduce((sum, acc) => sum + (acc.followerCount || 0), 0);
    const avgEngagement = proposal.influencer.socialAccounts.reduce((sum, acc) => {
      const rate = parseFloat(acc.engagementRate || '0');
      return sum + rate;
    }, 0) / (proposal.influencer.socialAccounts.length || 1);

    return (
      <Card key={proposal.id} className="hover:shadow-lg transition-all duration-200 overflow-hidden">
        <div className={`h-1 ${proposal.status === 'approved' ? 'bg-green-500' : proposal.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`} />
        
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16 ring-2 ring-white shadow-lg">
                <AvatarImage src={proposal.influencer.profileImageUrl} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-orange-500 text-white text-lg font-bold">
                  {proposal.influencer.firstName[0]}{proposal.influencer.lastName[0]}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {proposal.influencer.firstName} {proposal.influencer.lastName}
                  </h3>
                  <Badge className={`${getStatusColor(proposal.status)} flex items-center gap-1`}>
                    {getStatusIcon(proposal.status)}
                    <span className="capitalize">{proposal.status}</span>
                  </Badge>
                </div>
                
                {proposal.influencer.location && (
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="w-3 h-3 mr-1" />
                    {proposal.influencer.location}
                  </div>
                )}
                
                {proposal.influencer.bio && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {proposal.influencer.bio}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-1">
                  {proposal.influencer.categories.map((cat, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                      {cat.category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{getCurrencySymbol()}{proposal.proposedCompensation}</div>
              <div className="text-sm text-gray-500">{proposal.proposedTimeline}</div>
            </div>
          </div>

          {/* Social Media Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{formatFollowers(totalFollowers)}</div>
              <div className="text-xs text-gray-500">Total Followers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">{avgEngagement.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">Avg Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{proposal.influencer.socialAccounts.length}</div>
              <div className="text-xs text-gray-500">Platforms</div>
            </div>
          </div>

          {/* Social Accounts */}
          <div className="space-y-2 mb-4">
            {proposal.influencer.socialAccounts.map((account, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white border rounded-lg">
                <div className="flex items-center gap-2">
                  {getPlatformIcon(account.platform)}
                  <span className="text-sm font-medium">@{account.username}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">{formatFollowers(account.followerCount)} followers</span>
                  {account.engagementRate && (
                    <span className="text-green-600 font-medium">{account.engagementRate}% engagement</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Deliverables */}
          {proposal.proposedDeliverables && proposal.proposedDeliverables.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Proposed Deliverables
              </h4>
              <div className="space-y-1">
                {proposal.proposedDeliverables.map((deliverable, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>{deliverable}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            {proposal.status === 'approved' && (
              <>
                <Button 
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all relative"
                  onClick={() => setSelectedInfluencer(proposal.id)}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Chat
                  {unreadCount > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center p-0 animate-pulse"
                      data-testid={`unread-badge-${proposal.id}`}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-white border-2 border-emerald-400 text-emerald-600 hover:bg-emerald-50 font-medium shadow-sm hover:shadow-md transition-all"
                >
                  <Activity className="w-4 h-4 mr-1" />
                  View Progress
                </Button>
              </>
            )}
            {proposal.status === 'pending' && (
              <>
                <Button 
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                  onClick={() => updateProposalMutation.mutate({ proposalId: proposal.id, status: 'approved' })}
                  disabled={updateProposalMutation.isPending}
                  data-testid={`button-approve-${proposal.id}`}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {updateProposalMutation.isPending ? 'Approving...' : 'Approve'}
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-white border-2 border-red-400 text-red-600 hover:bg-red-50 font-medium shadow-sm hover:shadow-md transition-all"
                  onClick={() => updateProposalMutation.mutate({ proposalId: proposal.id, status: 'rejected' })}
                  disabled={updateProposalMutation.isPending}
                  data-testid={`button-reject-${proposal.id}`}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  {updateProposalMutation.isPending ? 'Rejecting...' : 'Reject'}
                </Button>
              </>
            )}
            <Button 
              size="sm"
              className="bg-white border-2 border-slate-400 text-slate-700 hover:bg-slate-50 font-medium shadow-sm hover:shadow-md transition-all"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Proposals</p>
                <p className="text-2xl font-bold text-purple-900">{proposals.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Approved</p>
                <p className="text-2xl font-bold text-green-900">{approvedProposals.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingProposals.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Total Budget</p>
                <p className="text-2xl font-bold text-orange-900">
                  {getCurrencySymbol()}{approvedProposals.reduce((sum, p) => sum + parseFloat(p.proposedCompensation), 0).toLocaleString()}
                </p>
              </div>
              <CurrencyIcon className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            All ({proposals.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Approved ({approvedProposals.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingProposals.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Rejected ({rejectedProposals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {proposals.map(renderInfluencerCard)}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {approvedProposals.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No approved influencers yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {approvedProposals.map(renderInfluencerCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {pendingProposals.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No pending proposals.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingProposals.map(renderInfluencerCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {rejectedProposals.length === 0 ? (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No rejected proposals.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {rejectedProposals.map(renderInfluencerCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}