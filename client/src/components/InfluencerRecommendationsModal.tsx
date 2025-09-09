import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MapPin, Users, TrendingUp, Star, MessageSquare, Check, X, Clock, CreditCard, MessageCircle, User, ExternalLink, FileText, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CampaignChat } from "@/components/CampaignChat";
import { useAuth } from "@/hooks/useAuth";

interface CampaignProposalsModalProps {
  campaignId: string;
  isOpen?: boolean;
  onClose: () => void;
}

interface CampaignProposal {
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
  influencer: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    location?: string;
    bio?: string;
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

export function InfluencerRecommendationsModal({ campaignId, isOpen = false, onClose }: CampaignProposalsModalProps) {
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [showChatModal, setShowChatModal] = useState<string | null>(null);
  const [expandedChats, setExpandedChats] = useState<Set<string>>(new Set());
  const [chatUnreadCounts, setChatUnreadCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch submitted proposals for this campaign
  const { data: proposals, isLoading } = useQuery<CampaignProposal[]>({
    queryKey: [`/api/brand/campaigns/${campaignId}/proposals`],
    enabled: !!campaignId,
  });

  // Mutation to approve/reject proposals
  const updateProposalMutation = useMutation({
    mutationFn: async ({ proposalId, status, brandFeedback }: { 
      proposalId: string; 
      status: 'approved' | 'rejected'; 
      brandFeedback?: string;
    }) => {
      return await apiRequest(`/api/brand/proposals/${proposalId}/status`, "PUT", {
        status,
        brandFeedback,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/brand/campaigns/${campaignId}/proposals`] });
      queryClient.invalidateQueries({ queryKey: ["/api/brand/campaigns"] });
      
      toast({
        title: variables.status === 'approved' ? "Proposal Approved" : "Proposal Rejected",
        description: variables.status === 'approved' 
          ? "The influencer has been notified of the approval."
          : "The influencer has been notified of the rejection.",
      });
      
      setFeedback(prev => ({ ...prev, [variables.proposalId]: "" }));
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update proposal status",
        variant: "destructive",
      });
    },
  });

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return '📸';
      case 'youtube': return '📺';
      case 'tiktok': return '🎵';
      case 'facebook': return '👥';
      default: return '📱';
    }
  };

  const handleApprove = (proposalId: string) => {
    updateProposalMutation.mutate({
      proposalId,
      status: 'approved',
      brandFeedback: feedback[proposalId] || undefined,
    });
  };

  const handleReject = (proposalId: string) => {
    updateProposalMutation.mutate({
      proposalId,
      status: 'rejected',
      brandFeedback: feedback[proposalId] || undefined,
    });
  };

  const renderInfluencerCard = (proposal: CampaignProposal) => (
    <Card key={proposal.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={proposal.influencer.profileImageUrl} />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {proposal.influencer.firstName[0]}{proposal.influencer.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{proposal.influencer.firstName} {proposal.influencer.lastName}</h3>
              <Badge className={`${proposal.status === 'approved' ? 'bg-green-100 text-green-800' : proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {proposal.status === 'approved' && <Check className="w-3 h-3 mr-1" />}
                {proposal.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                {proposal.status === 'rejected' && <X className="w-3 h-3 mr-1" />}
                {proposal.status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">₹{proposal.proposedCompensation}</div>
            <div className="text-sm text-gray-600">{proposal.proposedTimeline}</div>
          </div>
        </div>

        {/* Social Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {proposal.influencer.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0) > 0 
                ? formatFollowers(proposal.influencer.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0))
                : '0'}
            </div>
            <div className="text-xs text-gray-600">Total Followers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {proposal.influencer.socialAccounts[0]?.engagementRate || '0.0%'}
            </div>
            <div className="text-xs text-gray-600">Avg Engagement</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{proposal.influencer.socialAccounts.length}</div>
            <div className="text-xs text-gray-600">Platforms</div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-sm text-gray-600 mb-4">
          📧 {proposal.influencer.socialAccounts[0]?.username}@gmail.com
        </div>

        {/* Deliverables */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Proposed Deliverables</h4>
          <div className="flex items-center text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-500 mr-1" />
            {proposal.proposedDeliverables.join(', ') || '1 reel'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {proposal.status === 'approved' && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-1 ${expandedChats.has(proposal.id) ? 'bg-blue-100 text-blue-800 border-blue-300' : ''}`}
                  onClick={() => {
                    const newExpanded = new Set(expandedChats);
                    if (expandedChats.has(proposal.id)) {
                      newExpanded.delete(proposal.id);
                    } else {
                      newExpanded.add(proposal.id);
                    }
                    setExpandedChats(newExpanded);
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  {expandedChats.has(proposal.id) ? 'Close Chat' : 'Chat'}
                </Button>
                
                {/* Small Popup Chat Window */}
                {expandedChats.has(proposal.id) && (
                  <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={proposal.influencer.profileImageUrl} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {proposal.influencer.firstName[0]}{proposal.influencer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">
                            {proposal.influencer.firstName} {proposal.influencer.lastName}
                          </h4>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-500">Online</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newExpanded = new Set(expandedChats);
                          newExpanded.delete(proposal.id);
                          setExpandedChats(newExpanded);
                        }}
                        className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </Button>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="h-72">
                      <CampaignChat 
                        campaignId={campaignId}
                        proposalId={proposal.id}
                        influencerId={proposal.influencer.id}
                        currentUser={{ 
                          id: (user as any)?.id || '',
                          role: 'brand', 
                          firstName: (user as any)?.firstName || '', 
                          lastName: (user as any)?.lastName || '' 
                        }}
                        campaignTitle={`Chat with ${proposal.influencer.firstName} ${proposal.influencer.lastName}`}
                        isActive={true}
                        isInline={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              View Progress
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <User className="w-4 h-4" />
              View Profile
            </Button>
          </div>
        </div>

        {/* Pending Actions */}
        {proposal.status === 'pending' && (
          <div className="mt-4 pt-4 border-t">
            <Textarea
              placeholder="Add feedback for the influencer..."
              value={feedback[proposal.id] || ''}
              onChange={(e) => setFeedback(prev => ({ ...prev, [proposal.id]: e.target.value }))}
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(proposal.id)}
                disabled={updateProposalMutation.isPending}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReject(proposal.id)}
                disabled={updateProposalMutation.isPending}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Campaign Proposals ({proposals?.length || 0})
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading campaign proposals...</span>
          </div>
        ) : !proposals || proposals.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals submitted yet</h3>
            <p className="text-gray-600">Influencers haven't submitted any proposals for this campaign yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{proposals.length}</div>
                    <div className="text-sm text-purple-700">Total Proposals</div>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{proposals.filter(p => p.status === 'approved').length}</div>
                    <div className="text-sm text-green-700">Approved</div>
                  </div>
                  <Check className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{proposals.filter(p => p.status === 'pending').length}</div>
                    <div className="text-sm text-yellow-700">Pending</div>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-orange-600">₹{proposals.reduce((sum, p) => sum + (parseInt(p.proposedCompensation.replace(/[^0-9]/g, '')) || 0), 0).toLocaleString()}</div>
                    <div className="text-sm text-orange-700">Total Budget</div>
                  </div>
                  <CreditCard className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  All ({proposals.length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Approved ({proposals.filter(p => p.status === 'approved').length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending ({proposals.filter(p => p.status === 'pending').length})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Rejected ({proposals.filter(p => p.status === 'rejected').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {proposals.map(renderInfluencerCard)}
                </div>
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {proposals.filter(p => p.status === 'approved').map(renderInfluencerCard)}
                </div>
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {proposals.filter(p => p.status === 'pending').map(renderInfluencerCard)}
                </div>
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {proposals.filter(p => p.status === 'rejected').map(renderInfluencerCard)}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="flex justify-end mt-6 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}