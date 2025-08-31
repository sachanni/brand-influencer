import { useState, useEffect } from "react";
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
import { Calendar, CreditCard, MapPin, Target, Users, Clock, Send, Plus, X, ExternalLink, Sparkles, Award, Zap, Building, Tag, Globe, DollarSign, Smartphone, CheckCircle, Package } from "lucide-react";
import { SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";

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

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

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
          {campaigns.map((campaign: Campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedCampaign(campaign)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold line-clamp-2">
                    {campaign.title}
                  </CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    {campaign.campaignType.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm line-clamp-3">
                  {campaign.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    <span>{campaign.budgetRange || 'Budget negotiable'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {campaign.generalStartDate || 'Start date TBD'} - {campaign.generalEndDate || 'End date TBD'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Min. {campaign.minimumInfluencers} influencer{campaign.minimumInfluencers > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {campaign.platforms?.map((platform) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons];
                    return Icon ? (
                      <Icon key={platform} className="h-5 w-5 text-gray-600" />
                    ) : (
                      <Badge key={platform} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    );
                  })}
                </div>

                {isInfluencer ? (
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
                      className="w-full" 
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
                ) : (
                  <Button 
                    variant="outline"
                    className="w-full" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCampaign(campaign);
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

      {/* Enhanced Campaign Details Modal */}
      <Dialog open={!!selectedCampaign && !showProposalModal} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          {selectedCampaign && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                      {selectedCampaign.title}
                    </DialogTitle>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        ✓ Open for Applications
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Ready to apply!
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCampaign(null)}
                    className="h-8 w-8 p-0"
                  >
                    ✕
                  </Button>
                </div>
              </DialogHeader>
              
              <div className="overflow-y-auto flex-1 p-6 space-y-8">
                {/* Campaign Overview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Campaign Description</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedCampaign.description}</p>
                </div>

                {/* Brand Partner Information */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    Brand Partner
                  </h3>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-800">{selectedCampaign.brandName || 'Brand Partner'}</p>
                    {selectedCampaign.brandIndustry && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Tag className="w-4 h-4" />
                        <span>Industry: {selectedCampaign.brandIndustry}</span>
                      </div>
                    )}
                    {selectedCampaign.brandWebsite && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe className="w-4 h-4" />
                        <a href={selectedCampaign.brandWebsite} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline">
                          {selectedCampaign.brandWebsite}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Campaign Timeline */}
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Campaign Timeline
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-green-700">Apply Now - Flexible Timeline</p>
                          <p className="text-xs text-gray-600">Applications are being reviewed</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Duration To Be Confirmed</p>
                          <p className="text-xs text-gray-600">
                            {selectedCampaign.generalStartDate ? 
                              `Estimated: ${selectedCampaign.generalStartDate} - ${selectedCampaign.generalEndDate}` :
                              'Timeline will be finalized after selection'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Budget Information */}
                  <div className="bg-orange-50 rounded-lg p-4 space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                      Budget Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">💰</span>
                        <div>
                          <p className="font-medium text-orange-700">Budget Negotiable</p>
                          <p className="text-sm text-gray-600">
                            {selectedCampaign.budgetRange || 'Compensation based on your reach and engagement'}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 bg-white p-2 rounded border">
                        💡 Your proposal will include your expected compensation
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Requirements */}
                {selectedCampaign.platforms && selectedCampaign.platforms.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-purple-600" />
                      Platform Requirements
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedCampaign.platforms.map((platform) => {
                        const Icon = platformIcons[platform as keyof typeof platformIcons];
                        return (
                          <div key={platform} className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                            {Icon && <Icon className="h-5 w-5 text-purple-600" />}
                            <span className="font-medium text-purple-700 capitalize">{platform}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Requirements & Deliverables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Requirements
                    </h3>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-gray-700">{selectedCampaign.requirements || 'Detailed requirements will be shared upon selection'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Package className="w-5 h-5 text-indigo-600" />
                      Deliverables
                    </h3>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      {selectedCampaign.deliverables && selectedCampaign.deliverables.length > 0 ? (
                        <ul className="space-y-2">
                          {selectedCampaign.deliverables.map((deliverable, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-700">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{deliverable}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-700">Specific deliverables will be discussed during the collaboration process</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Target Audience */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-pink-600" />
                    Target Audience
                  </h3>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedCampaign.targetAudience || 'Target audience details will be provided to selected influencers'}</p>
                  </div>
                </div>

                {/* Campaign Status */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <span className="text-green-600">✅</span>
                    Campaign Status
                  </h3>
                  <p className="text-gray-700 mb-2">
                    This campaign is <strong className="text-green-600">open for applications</strong> and ready to apply!
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Applications are being reviewed on a rolling basis</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-4 flex justify-between items-center">
                <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
                  Close
                </Button>
                <div className="flex gap-3">
                  {isInfluencer && !selectedCampaign?.hasApplied && (
                    <Button 
                      onClick={() => setShowProposalModal(true)}
                      className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6"
                    >
                      Apply Now
                    </Button>
                  )}
                  {isInfluencer && selectedCampaign?.hasApplied && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">
                        Already applied - {selectedCampaign.applicationStatus === 'pending' ? 'Under review' : selectedCampaign.applicationStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
    </div>
  );
}