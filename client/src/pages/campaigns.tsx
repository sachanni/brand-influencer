import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBrandCurrency } from "@/hooks/useBrandCurrency";
import { Calendar, CreditCard, MapPin, Target, Users, Clock, Send, Plus, X, ExternalLink, Sparkles, Award, Zap, Building, Tag, Globe, DollarSign, Smartphone, CheckCircle, Package, MessageCircle } from "lucide-react";
import { SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import { CampaignBriefModal } from "@/components/CampaignBriefModal";

interface Campaign {
  id: string;
  title: string;
  description: string;
  campaignType: string;
  budget: string;
  generalStartDate: string;
  generalEndDate: string;
  exactStartDate?: string;
  exactEndDate?: string;
  platforms: string[];
  targetAudience: string;
  minimumInfluencers: number;
  budgetRange: string;
  requirements: string;
  deliverables: string[];
  thumbnailUrl?: string; // Campaign thumbnail image
  // Brand information
  brandName?: string;
  brandIndustry?: string;
  brandWebsite?: string;
  // Application status for influencers
  applicationStatus?: string | null;
  hasApplied?: boolean;
  appliedAt?: string | null;
}

interface ProposalFormData {
  proposalText: string;
  proposedDeliverables: string[];
  proposedTimeline: string;
  proposedCompensation: string;
  portfolioLinks: string[];
  additionalNotes: string;
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

const platformIcons = {
  instagram: SiInstagram,
  tiktok: SiTiktok,
  youtube: SiYoutube,
};

export default function CampaignsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [proposalForm, setProposalForm] = useState<ProposalFormData>({
    proposalText: "",
    proposedDeliverables: [""],
    proposedTimeline: "",
    proposedCompensation: "",
    portfolioLinks: [""],
    additionalNotes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { formatBrandCurrency } = useBrandCurrency();

  // Check if user is an influencer (only influencers can apply to campaigns)
  const isInfluencer = user && (user as any)?.role === 'influencer';

  const { data: publicCampaigns = [], isLoading: loadingPublic } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  // Fetch campaign invitations for influencers
  const { data: invitations = [], isLoading: loadingInvitations } = useQuery<any[]>({
    queryKey: ["/api/influencer/invitations"],
    enabled: !!isInfluencer, // Only fetch if user is an influencer
  });

  // Combine public campaigns and invitation campaigns
  const campaigns = [
    ...publicCampaigns.map(campaign => ({ ...campaign, isInvitation: false })),
    ...(Array.isArray(invitations) ? invitations : []).map((invitation: any) => ({
      id: invitation.campaignId,
      title: invitation.campaignTitle,
      description: invitation.campaignDescription,
      budget: invitation.campaignBudget,
      deadline: invitation.campaignDeadline,
      thumbnailUrl: invitation.campaignThumbnailUrl,
      brandName: invitation.brandName,
      isInvitation: true,
      invitationId: invitation.id,
      invitationStatus: invitation.status,
      personalMessage: invitation.personalMessage,
      compensationOffer: invitation.compensationOffer,
      createdAt: invitation.createdAt,
    }))
  ];

  const isLoading = loadingPublic || loadingInvitations;

  const submitProposalMutation = useMutation({
    mutationFn: async (data: { campaignId: string; proposal: ProposalFormData }) => {
      return await apiRequest(`/api/campaigns/${data.campaignId}/proposals`, "POST", data.proposal);
    },
    onSuccess: () => {
      toast({
        title: "Proposal Submitted",
        description: "Your proposal has been submitted successfully. The brand will review it shortly.",
      });
      // Close both modals for clean user experience
      setShowProposalModal(false);
      setSelectedCampaign(null);
      // Reset the form
      setProposalForm({
        proposalText: "",
        proposedDeliverables: [""],
        proposedTimeline: "",
        proposedCompensation: "",
        portfolioLinks: [""],
        additionalNotes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/influencer/proposals"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit proposal",
        variant: "destructive",
      });
    },
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return await apiRequest(`/api/invitations/${invitationId}/status`, "PUT", { status: "accepted" });
    },
    onSuccess: () => {
      toast({
        title: "Invitation Accepted!",
        description: "You've successfully accepted the campaign invitation. You can now submit your proposal.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/influencer/invitations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    },
  });

  // Decline invitation mutation  
  const declineInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return await apiRequest(`/api/invitations/${invitationId}/status`, "PUT", { status: "declined" });
    },
    onSuccess: () => {
      toast({
        title: "Invitation Declined",
        description: "You've declined the campaign invitation.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/influencer/invitations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline invitation",
        variant: "destructive",
      });
    },
  });

  const handleSubmitProposal = () => {
    if (!selectedCampaign) return;

    const cleanedProposal = {
      ...proposalForm,
      proposedDeliverables: proposalForm.proposedDeliverables.filter(d => d.trim()),
      portfolioLinks: proposalForm.portfolioLinks.filter(l => l.trim()),
    };

    submitProposalMutation.mutate({
      campaignId: selectedCampaign.id,
      proposal: cleanedProposal,
    });
  };

  const addDeliverable = () => {
    setProposalForm(prev => ({
      ...prev,
      proposedDeliverables: [...prev.proposedDeliverables, ""]
    }));
  };

  const updateDeliverable = (index: number, value: string) => {
    setProposalForm(prev => ({
      ...prev,
      proposedDeliverables: prev.proposedDeliverables.map((d, i) => i === index ? value : d)
    }));
  };

  const addPortfolioLink = () => {
    setProposalForm(prev => ({
      ...prev,
      portfolioLinks: [...prev.portfolioLinks, ""]
    }));
  };

  const updatePortfolioLink = (index: number, value: string) => {
    // Smart URL handling - auto-add https:// if missing
    let processedValue = value.trim();
    if (processedValue && !processedValue.startsWith('http://') && !processedValue.startsWith('https://')) {
      processedValue = 'https://' + processedValue;
    }
    
    setProposalForm(prev => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.map((l, i) => i === index ? processedValue : l)
    }));
  };

  const removePortfolioLink = (index: number) => {
    setProposalForm(prev => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.filter((_, i) => i !== index)
    }));
  };

  const removeDeliverable = (index: number) => {
    setProposalForm(prev => ({
      ...prev,
      proposedDeliverables: prev.proposedDeliverables.filter((_, i) => i !== index)
    }));
  };

  const getPlatformFromUrl = (url: string) => {
    if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    return 'web';
  };

  const getPlatformIcon = (url: string) => {
    const platform = getPlatformFromUrl(url);
    switch (platform) {
      case 'instagram': return <SiInstagram className="h-4 w-4 text-pink-500" />;
      case 'tiktok': return <SiTiktok className="h-4 w-4 text-black" />;
      case 'youtube': return <SiYoutube className="h-4 w-4 text-red-500" />;
      default: return <ExternalLink className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPricingIndicator = (compensation: string) => {
    const numericValue = parseFloat(compensation.replace(/[^0-9.]/g, ''));
    if (isNaN(numericValue)) return null;
    
    // Industry standard pricing tiers (adjust based on your platform's standards)
    if (numericValue >= 1000) {
      return { color: 'text-red-500', bg: 'bg-red-50', label: 'High Rate', icon: '🔴' };
    } else if (numericValue >= 300) {
      return { color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Market Rate', icon: '🟡' };
    } else if (numericValue > 0) {
      return { color: 'text-green-500', bg: 'bg-green-50', label: 'Competitive', icon: '🟢' };
    }
    return null;
  };

  const addPortfolioLinkWithPrefix = (platform: string) => {
    const prefix = platformPrefixes[platform as keyof typeof platformPrefixes] || 'https://www.';
    setProposalForm(prev => ({
      ...prev,
      portfolioLinks: [...prev.portfolioLinks, prefix]
    }));
  };

  const selectPitchTemplate = (template: string) => {
    setProposalForm(prev => ({
      ...prev,
      proposalText: template
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading campaigns...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Campaigns</h1>
        <p className="text-gray-600">
          Discover and apply to brand campaigns that match your content style and audience.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Campaigns</h3>
            <p className="text-gray-600">
              There are currently no active campaigns available. Check back soon for new opportunities!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign: any) => (
            <Card key={campaign.id} className="group relative overflow-hidden hover:shadow-2xl hover:shadow-teal-300/60 transition-all duration-500 cursor-pointer border-2 border-teal-400 hover:border-teal-600 bg-gradient-to-br from-teal-50/80 to-white hover:-translate-y-2 backdrop-blur-sm" onClick={() => setSelectedCampaign(campaign)}>
              {/* Background Thumbnail Image */}
              {campaign.thumbnailUrl && (
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                  <img
                    src={campaign.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover scale-110 group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-100/40 via-pink-100/30 to-transparent pointer-events-none" />
              
              {/* Campaign Thumbnail */}
              {campaign.thumbnailUrl && (
                <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={campaign.thumbnailUrl}
                    alt={campaign.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
              )}
              
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl font-bold line-clamp-2 text-gray-900 group-hover:text-purple-800 transition-colors duration-300">
                    {campaign.title}
                  </CardTitle>
                  <div className="flex flex-col gap-1 ml-2">
                    <Badge className="shadow-md border-2 border-teal-300 bg-teal-100/80 text-teal-800">
                      {campaign.campaignType?.replace('_', ' ') || 'Campaign'}
                    </Badge>
                    {(campaign as any).isInvitation && (
                      <Badge className="bg-blue-100/80 text-blue-700 border-2 border-blue-300 shadow-md animate-pulse">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Invited
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 relative">
                <p className="text-gray-800 text-sm line-clamp-3 leading-relaxed font-medium">
                  {campaign.description}
                </p>

                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-green-100/80 to-emerald-100/80 rounded-lg border-2 border-green-300">
                    <div className="flex items-center gap-2 text-green-700">
                      <CreditCard className="h-4 w-4" />
                      <span className="font-medium text-sm">Budget</span>
                    </div>
                    <span className="font-bold text-green-800 text-sm">{campaign.budgetRange || 'Negotiable'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-100/80 to-cyan-100/80 rounded-lg border-2 border-blue-300">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium text-sm">Timeline</span>
                    </div>
                    <span className="font-bold text-blue-800 text-xs">
                      {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-100/80 to-violet-100/80 rounded-lg border-2 border-purple-300">
                    <div className="flex items-center gap-2 text-purple-700">
                      <Users className="h-4 w-4" />
                      <span className="font-medium text-sm">Spots</span>
                    </div>
                    <span className="font-bold text-purple-800 text-sm">{campaign.minimumInfluencers}+ creators</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {campaign.platforms?.map((platform: any) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons];
                    return Icon ? (
                      <div key={platform} className="flex items-center gap-1 px-2 py-1 bg-gray-100/80 rounded-md border-2 border-gray-300">
                        <Icon className="h-4 w-4 text-gray-700" />
                        <span className="text-xs font-medium text-gray-700">{platform}</span>
                      </div>
                    ) : (
                      <Badge key={platform} className="text-xs border-2 border-gray-300 bg-gray-100/80 text-gray-700">
                        {platform}
                      </Badge>
                    );
                  })}
                </div>

                {isInfluencer ? (
                  // Handle invitation campaigns
                  (campaign as any).isInvitation ? (
                    (campaign as any).invitationStatus === 'pending' ? (
                      <div className="flex gap-2 w-full">
                        <Button 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            acceptInvitationMutation.mutate((campaign as any).invitationId);
                          }}
                          disabled={acceptInvitationMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-2 border-green-500 hover:border-green-600 shadow-lg"
                          data-testid={`accept-invitation-${campaign.id}`}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            declineInvitationMutation.mutate((campaign as any).invitationId);
                          }}
                          disabled={declineInvitationMutation.isPending}
                          className="flex-1 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                          data-testid={`decline-invitation-${campaign.id}`}
                        >
                          Decline
                        </Button>
                      </div>
                    ) : (campaign as any).invitationStatus === 'accepted' ? (
                      campaign.hasApplied ? (
                        <div className="w-full space-y-2">
                          <Button 
                            variant="secondary" 
                            className="w-full" 
                            disabled
                            data-testid={`status-${campaign.id}`}
                          >
                            {campaign.applicationStatus === 'pending' && 'Application Submitted'}
                            {campaign.applicationStatus === 'approved' && 'Approved'}
                            {campaign.applicationStatus === 'rejected' && 'Not Selected'}
                            {campaign.applicationStatus === 'paid' && 'Payment Processing'}
                          </Button>
                          <div className="text-xs text-gray-500 text-center">
                            Applied {campaign.appliedAt && new Date(campaign.appliedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <Button 
                          className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white border-2 border-teal-500 hover:border-teal-600 shadow-lg hover:shadow-xl transition-all duration-200" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCampaign(campaign);
                            setShowProposalModal(true);
                          }}
                          data-testid={`apply-${campaign.id}`}
                        >
                          Submit Proposal
                        </Button>
                      )
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        disabled
                        data-testid={`declined-${campaign.id}`}
                      >
                        Invitation Declined
                      </Button>
                    )
                  ) : (
                    // Handle regular public campaigns
                    campaign.hasApplied ? (
                      <div className="w-full space-y-2">
                        <Button 
                          className={`w-full border-2 shadow-lg ${
                            campaign.applicationStatus === 'pending' ? 'bg-orange-100/80 text-orange-800 border-orange-300' :
                            campaign.applicationStatus === 'approved' ? 'bg-green-100/80 text-green-800 border-green-300' :
                            campaign.applicationStatus === 'rejected' ? 'bg-red-100/80 text-red-800 border-red-300' :
                            campaign.applicationStatus === 'paid' ? 'bg-blue-100/80 text-blue-800 border-blue-300' :
                            'bg-gray-100/80 text-gray-800 border-gray-300'
                          }`}
                          disabled
                          data-testid={`status-${campaign.id}`}
                        >
                          {campaign.applicationStatus === 'pending' && 'Application Submitted'}
                          {campaign.applicationStatus === 'approved' && 'Approved'}
                          {campaign.applicationStatus === 'rejected' && 'Not Selected'}
                          {campaign.applicationStatus === 'paid' && 'Payment Processing'}
                        </Button>
                        <div className="text-xs text-gray-500 text-center">
                          Applied {campaign.appliedAt && new Date(campaign.appliedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <Button 
                        className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white border-2 border-teal-500 hover:border-teal-600 shadow-lg hover:shadow-xl transition-all duration-200" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCampaign(campaign);
                          setShowProposalModal(true);
                        }}
                        data-testid={`apply-${campaign.id}`}
                      >
                        Apply Now
                      </Button>
                    )
                  )
                ) : (
                  <Button 
                    variant="outline"
                    className="w-full border-2 border-teal-300 text-teal-600 hover:bg-teal-50 hover:border-teal-400 shadow-md" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCampaign(campaign);
                      setShowBriefModal(true);
                    }}
                  >
                    View Details
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Enhanced Campaign Details Modal - Available on Dashboard page */}

      {/* Enhanced Proposal Submission Modal - Only for influencers */}
      {isInfluencer && (
        <Dialog open={showProposalModal} onOpenChange={setShowProposalModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 border-0 shadow-2xl">
            {/* Header with gradient and sparkles */}
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
                  {selectedCampaign?.title}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Show why you're the perfect match for this campaign
                </p>
              </div>
            </DialogHeader>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto space-y-8 py-6">
              {/* Your Pitch Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Your Pitch
                  <span className="text-red-500">*</span>
                </div>
                
                {/* Pitch Template Selection */}
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
                    placeholder="🎯 Craft your compelling pitch here... Tell the brand why you're the perfect creator for their campaign. Highlight your unique style, audience engagement, and how you'll bring their vision to life!"
                    value={proposalForm.proposalText}
                    onChange={(e) => setProposalForm(prev => ({ ...prev, proposalText: e.target.value }))}
                    rows={5}
                    className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 rounded-xl shadow-sm backdrop-blur-sm text-base leading-relaxed"
                    required
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                    {proposalForm.proposalText.length}/500
                  </div>
                </div>
              </div>

              {/* Deliverables Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
                  <Target className="h-5 w-5 text-green-500" />
                  Proposed Deliverables
                </div>
                <div className="space-y-3">
                  {proposalForm.proposedDeliverables.map((deliverable, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="e.g., 1 Instagram Reel + 3 Stories + Brand mention in bio"
                          value={deliverable}
                          onChange={(e) => updateDeliverable(index, e.target.value)}
                          className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 rounded-lg pl-4 pr-12"
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
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addDeliverable} 
                    className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 hover:from-green-100 hover:to-emerald-100"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Another Deliverable
                  </Button>
                </div>
              </div>

              {/* Timeline & Compensation Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Timeline
                  </Label>
                  <Select 
                    value={proposalForm.proposedTimeline} 
                    onValueChange={(value) => setProposalForm(prev => ({ ...prev, proposedTimeline: value }))}
                  >
                    <SelectTrigger className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 rounded-lg">
                      <SelectValue placeholder="Select delivery timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2 days">1-2 days ⚡</SelectItem>
                      <SelectItem value="3-5 days">3-5 days 🎯</SelectItem>
                      <SelectItem value="1 week">1 week 📅</SelectItem>
                      <SelectItem value="2 weeks">2 weeks 🗓️</SelectItem>
                      <SelectItem value="custom">Custom timeline</SelectItem>
                    </SelectContent>
                  </Select>
                  {proposalForm.proposedTimeline === 'custom' && (
                    <Input
                      placeholder="Specify your custom timeline"
                      value=""
                      onChange={(e) => setProposalForm(prev => ({ ...prev, proposedTimeline: e.target.value }))}
                      className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  )}
                </div>
                
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-500" />
                    Compensation
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="e.g., 40K, Product + 15K, or Negotiable"
                      value={proposalForm.proposedCompensation}
                      onChange={(e) => setProposalForm(prev => ({ ...prev, proposedCompensation: e.target.value }))}
                      className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 rounded-lg pr-20"
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
                  <div className="text-xs text-slate-500 flex items-center gap-4">
                    <span className="flex items-center gap-1">🟢 Under 25K - Competitive</span>
                    <span className="flex items-center gap-1">🟡 25K-80K - Market Rate</span>
                    <span className="flex items-center gap-1">🔴 80K+ - Premium Rate</span>
                  </div>
                </div>
              </div>

              {/* Portfolio Links Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
                  <ExternalLink className="h-5 w-5 text-purple-500" />
                  Portfolio Links
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Share your best work! Choose a platform and we'll prefill the URL ✨
                </p>
                
                {/* Platform Selection Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPortfolioLinkWithPrefix('instagram')}
                    className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-pink-200 dark:border-pink-700 text-pink-700 dark:text-pink-300 hover:from-pink-100 hover:to-rose-100 flex items-center gap-2"
                  >
                    <SiInstagram className="h-4 w-4" />
                    Instagram
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPortfolioLinkWithPrefix('youtube')}
                    className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 hover:from-red-100 hover:to-orange-100 flex items-center gap-2"
                  >
                    <SiYoutube className="h-4 w-4" />
                    YouTube
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPortfolioLinkWithPrefix('tiktok')}
                    className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:from-gray-100 hover:to-slate-100 flex items-center gap-2"
                  >
                    <SiTiktok className="h-4 w-4" />
                    TikTok
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPortfolioLinkWithPrefix('website')}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-indigo-100 flex items-center gap-2"
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
                          className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 rounded-lg pl-12 pr-4"
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
              </div>

              {/* Additional Notes */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Additional Notes
                </Label>
                <Textarea
                  placeholder="💡 Any special ideas, previous brand collaborations, or unique value you bring to this campaign..."
                  value={proposalForm.additionalNotes}
                  onChange={(e) => setProposalForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  rows={3}
                  className="bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 rounded-xl"
                />
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                💪 Stand out from the crowd with a compelling proposal
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowProposalModal(false);
                    setSelectedCampaign(null);
                  }} 
                  className="bg-white/80 hover:bg-white"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitProposal}
                  disabled={!proposalForm.proposalText.trim() || submitProposalMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {submitProposalMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Submitting Your Proposal...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Proposal ✨
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Enhanced Campaign Brief Modal */}
      <CampaignBriefModal
        campaign={selectedCampaign}
        isOpen={showBriefModal}
        onOpenChange={(open) => {
          setShowBriefModal(open);
          if (!open) setSelectedCampaign(null);
        }}
        onApply={(campaignId) => {
          setShowBriefModal(false);
          setShowProposalModal(true);
        }}
        onAskQuestion={(campaignId) => {
          console.log('Ask question about campaign:', campaignId);
          // TODO: Implement Q&A system
        }}
        applicationStatus={selectedCampaign?.applicationStatus || undefined}
      />
    </div>
  );
}