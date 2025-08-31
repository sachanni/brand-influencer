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
  const [approvedProposalTabs, setApprovedProposalTabs] = useState<{ [key: string]: string }>({});
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return "bg-green-100 text-green-800";
      case 'rejected': return "bg-red-100 text-red-800";
      case 'pending': return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
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
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-gray-200 hover:border-l-blue-400">
                <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <Avatar className="w-20 h-20 ring-2 ring-white shadow-md">
                          <AvatarImage src={proposal.influencer.profileImageUrl} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                            {proposal.influencer.firstName[0]}{proposal.influencer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        {proposal.status === 'approved' && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {proposal.influencer.firstName} {proposal.influencer.lastName}
                          </h3>
                          <Badge className={`${getStatusColor(proposal.status)} px-3 py-1`}>
                            {getStatusIcon(proposal.status)}
                            <span className="ml-1 capitalize font-medium">{proposal.status}</span>
                          </Badge>
                        </div>
                        
                        {proposal.influencer.location && (
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            {proposal.influencer.location}
                          </div>
                        )}

                        {proposal.influencer.bio && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {proposal.influencer.bio}
                          </p>
                        )}

                        {/* Social Media Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          {proposal.influencer.socialAccounts.slice(0, 3).map((account) => (
                            <div key={account.platform} className="bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-lg">{getPlatformIcon(account.platform)}</span>
                                <span className="text-sm font-medium text-gray-700">{account.platform}</span>
                              </div>
                              <div className="text-xs text-gray-600">@{account.username}</div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-bold text-gray-900">{formatFollowers(account.followerCount)}</span>
                                {account.engagementRate && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                    {account.engagementRate} eng.
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Content Categories */}
                        {proposal.influencer.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {proposal.influencer.categories.slice(0, 4).map((category) => (
                              <Badge key={category.category} variant="secondary" className="text-xs">
                                {category.category}
                              </Badge>
                            ))}
                            {proposal.influencer.categories.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{proposal.influencer.categories.length - 4} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end gap-3">
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {proposal.proposedCompensation}
                        </div>
                        <p className="text-sm text-gray-500">Proposed Rate</p>
                      </div>
                      
                      {/* Chat Button for Approved Proposals */}
                      {proposal.status === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowChatModal(proposal.id)}
                          className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-medium"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Start Chat
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Proposal Details */}
                  <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    {/* Pitch Message */}
                    {proposal.proposalText && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Influencer's Pitch</h4>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">{proposal.proposalText}</p>
                      </div>
                    )}
                    
                    {/* Deliverables and Timeline Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Proposed Deliverables</h4>
                        {proposal.proposedDeliverables && proposal.proposedDeliverables.length > 0 ? (
                          <ul className="text-sm text-gray-600 space-y-1">
                            {proposal.proposedDeliverables.map((deliverable, index) => (
                              <li key={index} className="flex items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 mr-2 flex-shrink-0"></span>
                                {deliverable}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No deliverables specified</p>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Proposed Timeline</h4>
                        <p className="text-sm text-gray-600">{proposal.proposedTimeline || 'No timeline specified'}</p>
                      </div>
                    </div>
                    
                    {/* Portfolio Links */}
                    {proposal.portfolioLinks && proposal.portfolioLinks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Portfolio Links</h4>
                        <div className="space-y-1">
                          {proposal.portfolioLinks.map((link, index) => (
                            <a 
                              key={index} 
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 underline block"
                            >
                              {link}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Additional Notes */}
                    {proposal.additionalNotes && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Additional Notes</h4>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">{proposal.additionalNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Brand Feedback Section */}
                  {proposal.status === 'pending' && (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <Label htmlFor={`feedback-${proposal.id}`} className="text-sm font-medium">
                          Feedback (Optional)
                        </Label>
                        <Textarea
                          id={`feedback-${proposal.id}`}
                          placeholder="Add feedback for the influencer..."
                          value={feedback[proposal.id] || ''}
                          onChange={(e) => setFeedback(prev => ({ ...prev, [proposal.id]: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => handleApprove(proposal.id)}
                          disabled={updateProposalMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid={`button-approve-${proposal.id}`}
                        >
                          {updateProposalMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Approve
                        </Button>
                        
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(proposal.id)}
                          disabled={updateProposalMutation.isPending}
                          data-testid={`button-reject-${proposal.id}`}
                        >
                          {updateProposalMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <X className="w-4 h-4 mr-2" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Show feedback if already reviewed */}
                  {proposal.brandFeedback && proposal.status !== 'pending' && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Your Feedback</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {proposal.brandFeedback}
                      </p>
                    </div>
                  )}

                  {/* Enhanced Interface for Approved Proposals Only */}
                  {proposal.status === 'approved' && (
                    <div className="border-t pt-4">
                      <div className="bg-green-50 p-3 rounded-lg mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-green-700">
                            <Check className="w-5 h-5 mr-2" />
                            <span className="font-medium">Proposal Approved</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Ready for collaboration</Badge>
                        </div>
                      </div>

                      {/* Campaign Workspace Tabs - Only for THIS approved proposal */}
                      <Tabs 
                        key={`tabs-${proposal.id}`}
                        value={approvedProposalTabs[proposal.id] || 'details'} 
                        onValueChange={(value) => setApprovedProposalTabs(prev => ({ ...prev, [proposal.id]: value }))}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="details" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Campaign Details
                          </TabsTrigger>
                          <TabsTrigger value="chat" className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Chat & Communication
                          </TabsTrigger>
                        </TabsList>

                        {/* Campaign Details Tab */}
                        <TabsContent value="details" className="mt-4 space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg text-center">
                              <div className="text-lg font-bold text-blue-600">₹{proposal.proposedCompensation}</div>
                              <div className="text-xs text-blue-700">Total Investment</div>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-lg text-center">
                              <div className="text-lg font-bold text-orange-600">{proposal.proposedTimeline}</div>
                              <div className="text-xs text-orange-700">Timeline</div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg text-center">
                              <div className="text-lg font-bold text-purple-600">{proposal.proposedDeliverables?.length || 0}</div>
                              <div className="text-xs text-purple-700">Deliverables</div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Deliverables</h4>
                              <div className="bg-gray-50 p-3 rounded">
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                  {proposal.proposedDeliverables?.map((deliverable, index) => (
                                    <li key={index}>{deliverable}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {proposal.portfolioLinks && proposal.portfolioLinks.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-1">Portfolio Links</h4>
                                <div className="bg-gray-50 p-3 rounded">
                                  {proposal.portfolioLinks.map((link, index) => (
                                    <a 
                                      key={index} 
                                      href={link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mb-1"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      {link}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {proposal.additionalNotes && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-1">Additional Notes</h4>
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-700">{proposal.additionalNotes}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        {/* Chat & Communication Tab */}
                        <TabsContent value="chat" className="mt-4">
                          <div className="bg-blue-50 p-3 rounded-lg mb-4">
                            <div className="flex items-center gap-2 text-blue-700">
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Campaign Chat with {proposal.influencer.firstName} {proposal.influencer.lastName}
                              </span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                              All messages are logged for transparency and audit purposes
                            </p>
                          </div>
                          
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
                            campaignTitle={`Campaign Discussion with ${proposal.influencer.firstName} ${proposal.influencer.lastName}`}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
      
      {/* Chat Modal for Approved Proposals */}
      {showChatModal && (
        <Dialog open={!!showChatModal} onOpenChange={(open) => !open && setShowChatModal(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                Chat with {proposals?.find(p => p.id === showChatModal)?.influencer.firstName} {proposals?.find(p => p.id === showChatModal)?.influencer.lastName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              <CampaignChat 
                campaignId={campaignId}
                proposalId={showChatModal}
                influencerId={proposals?.find(p => p.id === showChatModal)?.influencer.id || ''}
                currentUser={{ 
                  id: (user as any)?.id || '',
                  role: 'brand', 
                  firstName: (user as any)?.firstName || '', 
                  lastName: (user as any)?.lastName || '' 
                }}
                campaignTitle={`Chat with ${proposals?.find(p => p.id === showChatModal)?.influencer.firstName} ${proposals?.find(p => p.id === showChatModal)?.influencer.lastName}`}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}