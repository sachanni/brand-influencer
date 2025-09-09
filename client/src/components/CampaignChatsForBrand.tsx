import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CampaignChat } from "./CampaignChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Users, Loader2, Check, RefreshCw, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

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

interface CampaignChatsForBrandProps {
  campaignId: string;
  currentUser: {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

export function CampaignChatsForBrand({ campaignId, currentUser }: CampaignChatsForBrandProps) {
  const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");

  // Fetch approved proposals for this campaign with refresh
  const { data: proposals, isLoading, refetch, error } = useQuery<CampaignProposal[]>({
    queryKey: [`/api/brand/campaigns/${campaignId}/proposals`],
    enabled: !!campaignId,
    refetchInterval: 10000, // Refresh every 10 seconds to get latest data
    refetchOnWindowFocus: true,
  });

  // Filter only approved proposals
  const approvedProposals = proposals?.filter(p => p.status === 'approved') || [];

  // Set the first approved proposal as selected by default
  if (approvedProposals.length > 0 && !selectedInfluencer) {
    setSelectedInfluencer(approvedProposals[0].id);
    setActiveTab(approvedProposals[0].id);
  }

  // Log for debugging
  console.log('Campaign Chats - Campaign ID:', campaignId);
  console.log('Campaign Chats - Proposals:', proposals);
  console.log('Campaign Chats - Approved:', approvedProposals);
  console.log('Campaign Chats - Error:', error);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading campaign chats...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Chats</h3>
        <p className="text-gray-600 mb-4">Failed to load influencer chats. Please try again.</p>
        <Button onClick={() => refetch()} className="bg-gradient-to-r from-purple-500 to-orange-500">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (approvedProposals.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Chats</h3>
        <p className="text-gray-600">No approved influencers for this campaign yet.</p>
        <p className="text-sm text-gray-500 mt-2">Approve proposals to start chatting with influencers.</p>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          className="mt-4"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        {proposals && proposals.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Found {proposals.length} total proposal(s), but none are approved yet.
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Pending: {proposals.filter(p => p.status === 'pending').length} | 
              Rejected: {proposals.filter(p => p.status === 'rejected').length}
            </p>
          </div>
        )}
      </div>
    );
  }

  // If only one approved proposal, show chat directly
  if (approvedProposals.length === 1) {
    const proposal = approvedProposals[0];
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={proposal.influencer.profileImageUrl} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {proposal.influencer.firstName[0]}{proposal.influencer.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium text-gray-900">
                  {proposal.influencer.firstName} {proposal.influencer.lastName}
                </h4>
                <p className="text-sm text-gray-600">{proposal.influencer.location}</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" />
              Approved
            </Badge>
          </div>
        </div>

        <CampaignChat
          campaignId={campaignId}
          proposalId={proposal.id}
          influencerId={proposal.influencer.id}
          brandId={currentUser.id}
          currentUser={currentUser}
          campaignTitle={`Chat with ${proposal.influencer.firstName} ${proposal.influencer.lastName}`}
          isActive={true}
        />
      </div>
    );
  }

  // Multiple approved proposals - show tabs
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-orange-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-700">
            <Users className="w-5 h-5" />
            <span className="font-medium">{approvedProposals.length} Approved Influencers</span>
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="ghost" 
            size="sm"
            className="text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto p-1 bg-gray-100 rounded-lg">
            {approvedProposals.map((proposal) => (
              <TabsTrigger
                key={proposal.id}
                value={proposal.id}
                className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={proposal.influencer.profileImageUrl} />
                  <AvatarFallback className="text-xs bg-purple-100 text-purple-600">
                    {proposal.influencer.firstName[0]}{proposal.influencer.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {proposal.influencer.firstName} {proposal.influencer.lastName}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {approvedProposals.map((proposal) => (
          <TabsContent key={proposal.id} value={proposal.id} className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={proposal.influencer.profileImageUrl} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {proposal.influencer.firstName[0]}{proposal.influencer.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {proposal.influencer.firstName} {proposal.influencer.lastName}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{proposal.influencer.location}</span>
                          <span>•</span>
                          <span>₹{proposal.proposedCompensation}</span>
                          <span>•</span>
                          <span>{proposal.proposedTimeline}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      Approved
                    </Badge>
                  </div>
                </div>

                <CampaignChat
                  campaignId={campaignId}
                  proposalId={proposal.id}
                  influencerId={proposal.influencer.id}
                  brandId={currentUser.id}
                  currentUser={currentUser}
                  campaignTitle={`Chat with ${proposal.influencer.firstName} ${proposal.influencer.lastName}`}
                  isActive={activeTab === proposal.id}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}