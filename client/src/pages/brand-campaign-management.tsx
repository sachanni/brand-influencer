import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InfluencerRecommendationsModal } from "@/components/InfluencerRecommendationsModal";
import { InfluencerSelectionModal } from "@/components/InfluencerSelectionModal";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Users, 
  TrendingUp, 
  Eye,
  CreditCard,
  Calendar,
  Target,
  MoreHorizontal,
  Play,
  Pause,
  Edit,
  Send,
  Loader2,
  Archive,
  Copy,
  Clock,
  Activity,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  X,
  DollarSign,
  FileText,
  CheckCircle
} from "lucide-react";
import { Navigation } from "@/components/layout/navigation";
import { BrandNav } from "@/components/BrandNav";
import { useBrandCurrency } from "@/hooks/useBrandCurrency";
import { CampaignTimeline } from "@/components/campaign-timeline";
import { CampaignTimelineWithMilestones } from "@/components/CampaignTimelineWithMilestones";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignChat } from "@/components/CampaignChat";
import { CampaignChatsForBrand } from "@/components/CampaignChatsForBrand";
import { CampaignInfluencersList } from "@/components/CampaignInfluencersList";
import { CampaignQuestionsView } from "@/components/CampaignQuestionsView";
import { useAuth } from "@/hooks/useAuth";
import { CampaignWizard } from '@/components/CampaignWizard';
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'draft' | 'pending_approval';
  budget: number;
  reach: number;
  engagement: string;
  startDate: string;
  endDate: string;
  collaborators: number;
  description: string;
  platforms: string[];
  progress: number;
  thumbnailUrl?: string; // Campaign thumbnail image
}

export default function BrandCampaignManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatBrandCurrency, preferredCurrency } = useBrandCurrency();
  const { user } = useAuth();
  const [activeDetailTab, setActiveDetailTab] = useState('timeline');
  const [selectedCampaignForInfluencers, setSelectedCampaignForInfluencers] = useState<any>(null);
  const [showInfluencerSelection, setShowInfluencerSelection] = useState(false);

  // Smart button logic functions
  const canEditCampaign = (campaign: any): { allowed: boolean; reason?: string } => {
    if (campaign.status === 'completed') {
      return { allowed: false, reason: "Cannot edit completed campaigns" };
    }
    if (campaign.status === 'active' && (campaign.collaborators || 0) > 0) {
      return { allowed: false, reason: "Cannot edit active campaigns with influencers" };
    }
    return { allowed: true };
  };

  const canLaunchCampaign = (campaign: any): { allowed: boolean; reason?: string } => {
    if (campaign.status !== 'draft') {
      return { allowed: false, reason: "Campaign is not in draft status" };
    }
    if (!campaign.budget || Number(campaign.budget) <= 0) {
      return { allowed: false, reason: "Campaign budget is required" };
    }
    if (!campaign.platforms || campaign.platforms.length === 0) {
      return { allowed: false, reason: "At least one platform must be selected" };
    }
    if (!campaign.description || campaign.description.trim().length === 0) {
      return { allowed: false, reason: "Campaign description is required" };
    }
    if (campaign.startDate && new Date(campaign.startDate) < new Date()) {
      return { allowed: false, reason: "Cannot launch campaigns with past start dates" };
    }
    return { allowed: true };
  };

  const canPauseCampaign = (campaign: any): { allowed: boolean; reason?: string } => {
    if (campaign.status !== 'active') {
      return { allowed: false, reason: "Only active campaigns can be paused" };
    }
    return { allowed: true };
  };

  const canViewInfluencers = (campaign: any): { allowed: boolean; reason?: string } => {
    if (campaign.status === 'draft') {
      return { allowed: false, reason: "No influencers assigned to draft campaigns" };
    }
    return { allowed: true };
  };

  const canArchiveCampaign = (campaign: any): { allowed: boolean; reason?: string } => {
    if (campaign.status !== 'completed') {
      return { allowed: false, reason: "Only completed campaigns can be archived" };
    }
    return { allowed: true };
  };

  const canResumeCampaign = (campaign: any): { allowed: boolean; reason?: string } => {
    if (campaign.status !== 'paused') {
      return { allowed: false, reason: "Only paused campaigns can be resumed" };
    }
    return { allowed: true };
  };

  // Get campaigns from API
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<any[]>({
    queryKey: ["/api/brand/campaigns"],
  });

  // Get brand profile for recommendations
  const { data: brandProfile } = useQuery({
    queryKey: ['/api/brand/profile'],
  });

  // Filter campaigns by status
  const currentCampaigns = campaigns.filter((campaign: any) => 
    campaign.status === 'active' || campaign.status === 'draft' || campaign.status === 'pending_approval' || campaign.status === 'paused'
  );
  const completedCampaigns = campaigns.filter((campaign: any) => 
    campaign.status === 'completed' || campaign.status === 'archived'
  );

  // Create campaign mutation with better UX
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      return await apiRequest("/api/brand/campaigns", "POST", {
        ...campaignData,
        status: 'draft', // Start as draft
        platforms: campaignData.platforms || [],
        deliverables: [],
        requirements: campaignData.objectives || '',
        budgetRange: campaignData.budgetRange,
        minimumInfluencers: 1,
        targetAudienceLocation: campaignData.targetAudienceLocation,
      });
    },
    onMutate: async (campaignData: any) => {
      // Close the form immediately for better UX
      setShowCreateForm(false);
      
      // Show a loading toast instead of optimistic update
      toast({
        title: "Creating Campaign...",
        description: "Please wait while we create your campaign.",
      });
    },
    onSuccess: () => {
      toast({
        title: "Campaign Created",
        description: "Your campaign has been created as a draft. You can launch it when ready.",
      });
      handleCancelEdit(); // This will reset form and close it
      queryClient.invalidateQueries({ queryKey: ["/api/brand/campaigns"] });
    },
    onError: (error: any) => {
      // Show the form again if it was closed
      setShowCreateForm(true);
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, campaignData }: { campaignId: string, campaignData: any }) => {
      return await apiRequest(`/api/brand/campaigns/${campaignId}`, "PUT", {
        ...campaignData,
        platforms: campaignData.platforms || [],
        deliverables: [],
        requirements: campaignData.objectives || '',
        budgetRange: campaignData.budgetRange,
        minimumInfluencers: 1,
        targetAudienceLocation: campaignData.targetAudienceLocation,
      });
    },
    onSuccess: () => {
      toast({
        title: "Campaign Updated",
        description: "Your campaign has been updated successfully.",
      });
      handleCancelEdit();
      queryClient.invalidateQueries({ queryKey: ["/api/brand/campaigns"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign",
        variant: "destructive",
      });
    },
  });

  // Launch campaign mutation
  const launchCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest(`/api/brand/campaigns/${campaignId}/launch`, "PUT");
    },
    onMutate: async (campaignId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/brand/campaigns"] });

      // Snapshot the previous value
      const previousCampaigns = queryClient.getQueryData(["/api/brand/campaigns"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["/api/brand/campaigns"], (old: any[]) => {
        return old?.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: 'active' }
            : campaign
        ) || [];
      });

      // Return a context object with the snapshotted value
      return { previousCampaigns };
    },
    onSuccess: () => {
      toast({
        title: "Campaign Launched",
        description: "Your campaign is now live and visible to influencers!",
      });
      // Force a refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/brand/campaigns"] });
    },
    onError: (error: any, campaignId: string, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCampaigns) {
        queryClient.setQueryData(["/api/brand/campaigns"], context.previousCampaigns);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to launch campaign",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["/api/brand/campaigns"] });
    },
  });

  // Pause campaign mutation
  const pauseCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest(`/api/brand/campaigns/${campaignId}/pause`, "PUT");
    },
    onMutate: async (campaignId: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/brand/campaigns"] });
      const previousCampaigns = queryClient.getQueryData(["/api/brand/campaigns"]);
      
      queryClient.setQueryData(["/api/brand/campaigns"], (old: any[]) => {
        return old?.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: 'paused' }
            : campaign
        ) || [];
      });

      return { previousCampaigns };
    },
    onSuccess: () => {
      toast({
        title: "Campaign Paused",
        description: "Your campaign has been paused and is no longer visible to influencers.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/brand/campaigns"] });
    },
    onError: (error: any, campaignId: string, context: any) => {
      if (context?.previousCampaigns) {
        queryClient.setQueryData(["/api/brand/campaigns"], context.previousCampaigns);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to pause campaign",
        variant: "destructive",
      });
    },
  });

  // Send campaign invitations mutation
  const sendInvitationsMutation = useMutation({
    mutationFn: async ({ campaignId, influencerIds, personalMessage, compensationOffer }: {
      campaignId: string;
      influencerIds: string[];
      personalMessage: string;
      compensationOffer?: string;
    }) => {
      return await apiRequest(`/api/brand/campaigns/${campaignId}/invitations`, "POST", {
        influencerIds,
        personalMessage,
        compensationOffer
      });
    },
    onSuccess: (data: any, variables) => {
      toast({
        title: "Invitations Sent",
        description: `Campaign invitations sent to ${variables.influencerIds.length} influencer${variables.influencerIds.length > 1 ? 's' : ''}!`,
      });
      // Update campaign status to invitation_only
      queryClient.invalidateQueries({ queryKey: ["/api/brand/campaigns"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitations",
        variant: "destructive",
      });
    },
  });

  // Archive campaign mutation  
  const archiveCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest(`/api/brand/campaigns/${campaignId}/archive`, "PUT");
    },
    onSuccess: () => {
      toast({
        title: "Campaign Archived",
        description: "Campaign has been archived and moved to history.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/brand/campaigns"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to archive campaign",
        variant: "destructive",
      });
    },
  });

  // Resume campaign mutation
  const resumeCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest(`/api/brand/campaigns/${campaignId}/resume`, "PUT");
    },
    onMutate: async (campaignId: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/brand/campaigns"] });
      const previousCampaigns = queryClient.getQueryData(["/api/brand/campaigns"]);
      
      queryClient.setQueryData(["/api/brand/campaigns"], (old: any[]) => {
        return old?.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: 'active' }
            : campaign
        ) || [];
      });

      return { previousCampaigns };
    },
    onSuccess: () => {
      toast({
        title: "Campaign Resumed",
        description: "Your campaign is now active and visible to influencers again.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/brand/campaigns"] });
    },
    onError: (error: any, campaignId: string, context: any) => {
      if (context?.previousCampaigns) {
        queryClient.setQueryData(["/api/brand/campaigns"], context.previousCampaigns);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to resume campaign",
        variant: "destructive",
      });
    },
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedCampaignForRecommendations, setSelectedCampaignForRecommendations] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<string | null>(null);
  const [selectedCampaignForDetails, setSelectedCampaignForDetails] = useState<string | null>(null);
  const [expandedIntelligenceSections, setExpandedIntelligenceSections] = useState<{[key: string]: boolean}>({});

  // Toggle Campaign Intelligence section
  const toggleIntelligenceSection = (campaignId: string) => {
    setExpandedIntelligenceSections(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    description: "",
    budget: "1k-10k", // Set default to first option to avoid confusion with placeholder
    campaignType: "",
    startDate: "",
    endDate: "",
    minimumInfluencers: "",
    platforms: [] as string[],
    targetAudience: "",
    objectives: "",
    targetAudienceLocation: "",
    priority: "medium" as string,
    urgencyReason: "",
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_approval': return 'bg-orange-100 text-orange-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-slate-100 text-slate-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'bg-pink-100 text-pink-800';
      case 'tiktok': return 'bg-purple-100 text-purple-800';
      case 'youtube': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Currency formatting is now handled by the useBrandCurrency hook

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  const handleCreateCampaign = () => {
    if (!newCampaign.title || !newCampaign.description || !newCampaign.budget) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in title, description, and budget.",
        variant: "destructive",
      });
      return;
    }

    if (newCampaign.platforms.length === 0) {
      toast({
        title: "Missing Platform Selection",
        description: "Please select at least one platform for your campaign.",
        variant: "destructive",
      });
      return;
    }

    if (!newCampaign.targetAudienceLocation) {
      toast({
        title: "Missing Geographic Targeting",
        description: "Please select a target location for your campaign.",
        variant: "destructive",
      });
      return;
    }

    // Prepare campaign data with dynamic currency formatting
    const campaignDataWithCurrency = {
      ...newCampaign,
      budgetRange: `Up to ${formatBrandCurrency(Number(newCampaign.budget))}`
    };

    if (editingCampaign) {
      updateCampaignMutation.mutate({ campaignId: editingCampaign, campaignData: campaignDataWithCurrency });
    } else {
      createCampaignMutation.mutate(campaignDataWithCurrency);
    }
  };

  const handleEditCampaign = (campaign: any) => {
    // Populate form with existing campaign data
    // Format dates properly for datetime-local inputs
    const formatDateForInput = (date: any) => {
      if (!date) return "";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    };

    setNewCampaign({
      title: campaign.title || "",
      description: campaign.description || "",
      budget: campaign.budgetRange || campaign.budget?.toString() || "",
      campaignType: campaign.campaignType || "",
      startDate: formatDateForInput(campaign.exactStartDate || campaign.startDate),
      endDate: formatDateForInput(campaign.exactEndDate || campaign.endDate),
      minimumInfluencers: campaign.minimumInfluencers?.toString() || "",
      platforms: campaign.platforms || [],
      targetAudience: campaign.targetAudience || "",
      objectives: campaign.requirements || campaign.objectives || "",
      targetAudienceLocation: campaign.targetAudienceLocation || "",
      priority: campaign.priority || "medium",
      urgencyReason: campaign.urgencyReason || "",
    });
    setEditingCampaign(campaign.id);
    setShowCreateForm(true);
  };

  const handleCancelEdit = () => {
    setEditingCampaign(null);
    setShowCreateForm(false);
    // Reset form
    setNewCampaign({
      title: "",
      description: "",
      budget: "1k-10k", // Reset to default budget
      campaignType: "",
      startDate: "",
      endDate: "",
      minimumInfluencers: "",
      platforms: [] as string[],
      targetAudience: "",
      objectives: "",
      targetAudienceLocation: "",
      priority: "medium",
      urgencyReason: "",
    });
  };

  // Check if we should open campaign details on mount (coming from View Details button)
  useEffect(() => {
    const viewCampaignId = localStorage.getItem('viewCampaignId');
    if (viewCampaignId && campaigns) {
      const campaignExists = campaigns.some(c => c.id === viewCampaignId);
      if (campaignExists) {
        setSelectedCampaignForDetails(viewCampaignId);
      }
      // Clear the localStorage after using it
      localStorage.removeItem('viewCampaignId');
    }
  }, [campaigns]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BrandNav />
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaign Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your influencer marketing campaigns</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={() => setShowWizard(true)}
              className="bg-teal-600 hover:bg-teal-700"
              data-testid="button-create-campaign-wizard"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Campaign (Wizard)
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                if (showCreateForm && editingCampaign) {
                  handleCancelEdit();
                } else {
                  setShowCreateForm(!showCreateForm);
                }
              }}
              data-testid="button-create-campaign"
            >
              <Plus className="w-5 h-5 mr-2" />
              {editingCampaign ? 'Cancel Edit' : 'Quick Create'}
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">Total Campaigns</p>
                  <p className="text-3xl font-bold">{campaignsLoading ? '-' : campaigns.length}</p>
                </div>
                <Target className="h-8 w-8 text-teal-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Campaigns</p>
                  <p className="text-3xl font-bold">{campaignsLoading ? '-' : currentCampaigns.filter(c => c.status === 'active').length}</p>
                </div>
                <Play className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Pending Approval</p>
                  <p className="text-3xl font-bold">{campaignsLoading ? '-' : campaigns.filter(c => c.status === 'pending_approval').length}</p>
                </div>
                <Pause className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Spent</p>
                  <p className="text-3xl font-bold">{campaignsLoading ? '-' : formatBrandCurrency(campaigns.reduce((total, c) => total + (Number(c.budget) || 0), 0))}</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={`grid gap-8 ${showCreateForm ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Enhanced Create/Edit Campaign Form */}
          {showCreateForm && (
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-t-lg relative">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center">
                      {editingCampaign ? <Edit className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                      {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      {editingCampaign ? 'Editing Mode' : 'Draft'}
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingCampaign(null);
                      setNewCampaign({
                        title: "",
                        description: "",
                        budget: "1k-10k",
                        campaignType: "",
                        startDate: "",
                        endDate: "",
                        minimumInfluencers: "",
                        platforms: [],
                        targetAudience: "",
                        objectives: "",
                        targetAudienceLocation: "",
                        priority: "medium",
                        urgencyReason: "",
                      });
                    }}
                    className="absolute top-4 right-4 text-white hover:bg-white/20"
                    data-testid="button-close-form"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
              <CardContent className="space-y-6 p-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center pb-2 border-b border-gray-200">
                    <Target className="w-4 h-4 mr-2 text-teal-600" />
                    Campaign Information
                  </h4>
                  
                  <div>
                    <Label htmlFor="campaign-name" className="text-sm font-medium">Campaign Name *</Label>
                    <Input
                      id="campaign-name"
                      placeholder="Enter a compelling campaign name"
                      value={newCampaign.title}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      data-testid="input-campaign-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="campaign-type" className="text-sm font-medium">Campaign Type</Label>
                    <Select value={newCampaign.campaignType} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, campaignType: value }))}>
                      <SelectTrigger className="mt-1 focus:ring-2 focus:ring-teal-500" data-testid="select-campaign-type">
                        <SelectValue placeholder="Choose campaign type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product-launch">🚀 Product Launch</SelectItem>
                        <SelectItem value="brand-awareness">📢 Brand Awareness</SelectItem>
                        <SelectItem value="seasonal">🎉 Seasonal Campaign</SelectItem>
                        <SelectItem value="influencer-takeover">👑 Influencer Takeover</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">Campaign Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your campaign objectives, target audience, and key requirements..."
                      rows={3}
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      data-testid="textarea-description"
                    />
                    <p className="text-xs text-gray-500 mt-1">Be specific about your goals and requirements to attract the right influencers.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">Budget Range</Label>
                    <Select value={newCampaign.budget} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, budget: value }))}>
                      <SelectTrigger data-testid="select-budget">
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1k-10k">₹1K - ₹10K</SelectItem>
                        <SelectItem value="11k-20k">₹11K - ₹20K</SelectItem>
                        <SelectItem value="21k-30k">₹21K - ₹30K</SelectItem>
                        <SelectItem value="31k-50k">₹31K - ₹50K</SelectItem>
                        <SelectItem value="51k-75k">₹51K - ₹75K</SelectItem>
                        <SelectItem value="76k-100k">₹76K - ₹1L</SelectItem>
                        <SelectItem value="1l-2l">₹1L - ₹2L</SelectItem>
                        <SelectItem value="2l-5l">₹2L - ₹5L</SelectItem>
                        <SelectItem value="5l+">₹5L+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Start Date</Label>
                    <Input
                      type="date"
                      value={newCampaign.startDate}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, startDate: e.target.value }))}
                      data-testid="input-start-date"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      type="date"
                      value={newCampaign.endDate}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, endDate: e.target.value }))}
                      data-testid="input-end-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="influencers">Minimum Influencers</Label>
                    <Select value={newCampaign.minimumInfluencers} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, minimumInfluencers: value }))}>
                      <SelectTrigger data-testid="select-influencers">
                        <SelectValue placeholder="5-10" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5-10">5-10</SelectItem>
                        <SelectItem value="10-25">10-25</SelectItem>
                        <SelectItem value="25-50">25-50</SelectItem>
                        <SelectItem value="50+">50+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="platforms">Platforms</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Instagram', 'TikTok', 'YouTube'].map((platform) => {
                      const isSelected = newCampaign.platforms.includes(platform.toLowerCase());
                      return (
                        <Badge 
                          key={platform} 
                          variant={isSelected ? "default" : "outline"} 
                          className={`cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            setNewCampaign(prev => ({
                              ...prev,
                              platforms: isSelected 
                                ? prev.platforms.filter(p => p !== platform.toLowerCase())
                                : [...prev.platforms, platform.toLowerCase()]
                            }));
                          }}
                          data-testid={`platform-${platform.toLowerCase()}`}
                        >
                          {platform}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    placeholder="e.g., Fashion & Beauty"
                    value={newCampaign.targetAudience}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, targetAudience: e.target.value }))}
                    data-testid="input-target-audience"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Geographic Targeting</Label>
                  <Select value={newCampaign.targetAudienceLocation} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, targetAudienceLocation: value }))}>
                    <SelectTrigger data-testid="select-location">
                      <SelectValue placeholder="Select target location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="india">India</SelectItem>
                      <SelectItem value="india-north">India - Northern States</SelectItem>
                      <SelectItem value="india-south">India - Southern States</SelectItem>
                      <SelectItem value="india-west">India - Western States</SelectItem>
                      <SelectItem value="india-east">India - Eastern States</SelectItem>
                      <SelectItem value="india-mumbai">Mumbai, India</SelectItem>
                      <SelectItem value="india-delhi">Delhi, India</SelectItem>
                      <SelectItem value="india-bangalore">Bangalore, India</SelectItem>
                      <SelectItem value="india-chennai">Chennai, India</SelectItem>
                      <SelectItem value="india-kolkata">Kolkata, India</SelectItem>
                      <SelectItem value="india-pune">Pune, India</SelectItem>
                      <SelectItem value="usa">United States</SelectItem>
                      <SelectItem value="usa-west">United States - West Coast</SelectItem>
                      <SelectItem value="usa-east">United States - East Coast</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="canada">Canada</SelectItem>
                      <SelectItem value="australia">Australia</SelectItem>
                      <SelectItem value="germany">Germany</SelectItem>
                      <SelectItem value="france">France</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-orange-500" />
                    Campaign Priority
                  </h4>
                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={newCampaign.priority || 'medium'} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger data-testid="select-priority">
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                            Low Priority - Standard timeline
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                            Medium Priority - Preferred timeline
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                            High Priority - Fast turnaround needed
                          </div>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                            Urgent - Critical timeline
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(newCampaign.priority === 'urgent' || newCampaign.priority === 'high') && (
                    <div className="mt-3">
                      <Label htmlFor="urgency-reason">Reason for {newCampaign.priority} priority</Label>
                      <Textarea
                        placeholder={`Please explain why this campaign requires ${newCampaign.priority} priority (e.g., product launch date, event deadline, seasonal campaign)`}
                        value={newCampaign.urgencyReason || ''}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, urgencyReason: e.target.value }))}
                        className="mt-1 min-h-[80px]"
                        data-testid="input-urgency-reason"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This helps influencers understand the timeline requirements and prioritize accordingly.
                      </p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleCreateCampaign}
                  disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                  data-testid="button-submit-campaign"
                >
                  {(createCampaignMutation.isPending || updateCampaignMutation.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingCampaign ? 'Updating...' : 'Creating Campaign...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Current Campaigns */}
          <div className={showCreateForm ? "lg:col-span-2" : "lg:col-span-3"}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Current Campaigns</CardTitle>
                <Button variant="outline" size="sm">
                  Manage Campaigns
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {campaignsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">Loading campaigns...</p>
                  </div>
                ) : currentCampaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active campaigns</h3>
                    <p className="text-gray-600">Create your first campaign to start collaborating with influencers!</p>
                  </div>
                ) : (
                  currentCampaigns.map((campaign: any) => (
                  <div key={campaign.id} className="group relative bg-gradient-to-br from-slate-50/80 via-blue-50/40 to-purple-50/30 border-2 border-gradient-to-r border-blue-200/60 rounded-xl p-6 hover:border-blue-300/80 hover:shadow-xl hover:shadow-blue-200/30 transition-all duration-300 hover:-translate-y-1 hover:bg-gradient-to-br hover:from-blue-50/60 hover:via-purple-50/40 hover:to-teal-50/30 overflow-hidden backdrop-blur-sm">
                    {/* Decorative gradient accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {/* Campaign Thumbnail or Default Icon */}
                          {campaign.thumbnailUrl && !campaign.thumbnailUrl.startsWith('blob:') ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                              <img
                                src={campaign.thumbnailUrl}
                                alt={campaign.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Hide broken image and show fallback
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            </div>
                          ) : null}
                          
                          {/* Enhanced Fallback Icon */}
                          <div className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm ${
                            campaign.thumbnailUrl && !campaign.thumbnailUrl.startsWith('blob:') ? 'hidden' : 'flex'
                          }`}>
                            <Target className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                            <p className="text-sm text-gray-500">{campaign.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getStatusColor(campaign.status || 'draft')}>
                            {campaign.status?.replace('_', ' ') || 'Draft'}
                          </Badge>
                          {/* Priority Badge */}
                          {campaign.priority && (
                            <Badge className={
                              campaign.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                              campaign.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                              campaign.priority === 'medium' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              'bg-green-100 text-green-800 border-green-200'
                            } title={campaign.urgencyReason || ''}>
                              {campaign.priority === 'urgent' ? '🚨 Urgent' :
                               campaign.priority === 'high' ? '⚡ High Priority' :
                               campaign.priority === 'medium' ? '📅 Medium Priority' :
                               '🟢 Low Priority'}
                            </Badge>
                          )}
                          {campaign.platforms?.map((platform: string) => (
                            <Badge key={platform} variant="outline" className={getPlatformColor(platform)}>
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {/* Enhanced Three Dots Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`menu-options-${campaign.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {/* Edit Campaign */}
                          <DropdownMenuItem 
                            onClick={() => {
                              handleEditCampaign(campaign);
                              setShowCreateForm(true);
                            }}
                            disabled={!canEditCampaign(campaign).allowed}
                            data-testid={`option-edit-${campaign.id}`}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Campaign
                          </DropdownMenuItem>

                          {/* Duplicate Campaign */}
                          <DropdownMenuItem 
                            onClick={() => {
                              const duplicatedCampaign = {
                                ...campaign,
                                title: `${campaign.title} (Copy)`,
                                status: 'draft'
                              };
                              handleEditCampaign(duplicatedCampaign);
                              setEditingCampaign(null); // Clear editing state for new campaign
                              setShowCreateForm(true);
                            }}
                            data-testid={`option-duplicate-${campaign.id}`}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate Campaign
                          </DropdownMenuItem>

                          {/* Campaign Analytics */}
                          <DropdownMenuItem 
                            onClick={() => setSelectedCampaignForDetails(campaign.id)}
                            data-testid={`option-analytics-${campaign.id}`}
                          >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>

                          {/* View Timeline */}
                          <DropdownMenuItem 
                            onClick={() => {
                              // Set campaign for timeline view - you can implement this
                              setSelectedCampaignForDetails(campaign.id);
                            }}
                            data-testid={`option-timeline-${campaign.id}`}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            View Timeline
                          </DropdownMenuItem>

                          {/* Manage Influencers */}
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedCampaignForInfluencers(campaign);
                              setShowInfluencerSelection(true);
                            }}
                            data-testid={`option-manage-influencers-${campaign.id}`}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Manage Influencers
                          </DropdownMenuItem>

                          {/* Pause/Resume Campaign */}
                          {campaign.status === 'active' && (
                            <DropdownMenuItem 
                              onClick={() => pauseCampaignMutation.mutate(campaign.id)}
                              disabled={pauseCampaignMutation.isPending}
                              data-testid={`option-pause-${campaign.id}`}
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              Pause Campaign
                            </DropdownMenuItem>
                          )}

                          {campaign.status === 'paused' && canResumeCampaign(campaign).allowed && (
                            <DropdownMenuItem 
                              onClick={() => resumeCampaignMutation.mutate(campaign.id)}
                              disabled={resumeCampaignMutation.isPending}
                              data-testid={`option-resume-${campaign.id}`}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Resume Campaign
                            </DropdownMenuItem>
                          )}

                          {/* Launch Options for Draft Campaigns */}
                          {campaign.status === 'draft' && canLaunchCampaign(campaign).allowed && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => launchCampaignMutation.mutate(campaign.id)}
                                disabled={launchCampaignMutation.isPending}
                                data-testid={`option-launch-public-menu-${campaign.id}`}
                              >
                                <Globe className="w-4 h-4 mr-2" />
                                Launch Publicly
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Archive Campaign */}
                          {(campaign.status === 'completed' || campaign.status === 'paused') && (
                            <DropdownMenuItem 
                              onClick={() => {
                                // Add archive functionality
                                toast({
                                  title: "Archive Campaign",
                                  description: "Campaign archived successfully.",
                                });
                              }}
                              data-testid={`option-archive-${campaign.id}`}
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Archive Campaign
                            </DropdownMenuItem>
                          )}

                          {/* Chat with Influencers */}
                          {campaign.collaborators > 0 && (
                            <DropdownMenuItem 
                              onClick={() => {
                                // Navigate to chat interface
                                toast({
                                  title: "Chat Feature",
                                  description: "Opening chat with campaign influencers...",
                                });
                              }}
                              data-testid={`option-chat-${campaign.id}`}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Chat with Influencers
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Professional KPI Dashboard */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 group-hover:text-gray-800 transition-colors">Performance KPIs</h4>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-xs text-gray-500">Real-time</span>
                        </div>
                      </div>
                      
                      {/* Primary KPIs Row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="text-center p-3 bg-gradient-to-br from-blue-50/60 via-blue-100/30 to-blue-200/20 backdrop-blur-sm rounded-lg border border-blue-200/40 group-hover:border-blue-300/60 group-hover:shadow-lg group-hover:bg-gradient-to-br group-hover:from-blue-100/70 group-hover:via-blue-200/40 group-hover:to-blue-300/25 transition-all duration-300">
                          <div className="flex items-center justify-center mb-1">
                            <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                            <p className="text-lg font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
                              {(() => {
                                const budget = Number(campaign.budget || campaign.budgetMax || 0);
                                const reach = Number(campaign.actualReach || campaign.targetReach || 0);
                                const roi = reach > 0 && budget > 0 ? ((reach * 0.02 - budget) / budget * 100).toFixed(1) : '0.0';
                                return roi + '%';
                              })()}
                            </p>
                          </div>
                          <p className="text-xs font-medium text-gray-600 group-hover:text-gray-700 transition-colors duration-300">ROI/ROAS</p>
                        </div>

                        <div className="text-center p-3 bg-gradient-to-br from-green-50/60 via-green-100/30 to-green-200/20 backdrop-blur-sm rounded-lg border border-green-200/40 group-hover:border-green-300/60 group-hover:shadow-lg group-hover:bg-gradient-to-br group-hover:from-green-100/70 group-hover:via-green-200/40 group-hover:to-green-300/25 transition-all duration-300">
                          <div className="flex items-center justify-center mb-1">
                            <Target className="w-4 h-4 text-green-600 mr-1" />
                            <p className="text-lg font-bold text-green-600 group-hover:text-green-700 transition-colors duration-300">
                              {(() => {
                                const budget = Number(campaign.budget || campaign.budgetMax || 0);
                                const reach = Number(campaign.actualReach || campaign.targetReach || 1000);
                                const cpm = reach > 0 ? (budget / reach * 1000).toFixed(2) : '0.00';
                                return formatBrandCurrency(cpm, { maximumFractionDigits: 2 });
                              })()}
                            </p>
                          </div>
                          <p className="text-xs font-medium text-gray-600 group-hover:text-gray-700 transition-colors duration-300">CPM</p>
                        </div>

                        <div className="text-center p-3 bg-gradient-to-br from-purple-50/60 via-purple-100/30 to-purple-200/20 backdrop-blur-sm rounded-lg border border-purple-200/40 group-hover:border-purple-300/60 group-hover:shadow-lg group-hover:bg-gradient-to-br group-hover:from-purple-100/70 group-hover:via-purple-200/40 group-hover:to-purple-300/25 transition-all duration-300">
                          <div className="flex items-center justify-center mb-1">
                            <Activity className="w-4 h-4 text-purple-600 mr-1" />
                            <p className="text-lg font-bold text-purple-600 group-hover:text-purple-700 transition-colors duration-300">
                              {(() => {
                                const engagement = campaign.actualEngagement || campaign.targetEngagement || '3.2%';
                                return typeof engagement === 'string' ? engagement : engagement + '%';
                              })()}
                            </p>
                          </div>
                          <p className="text-xs font-medium text-gray-600 group-hover:text-gray-700 transition-colors duration-300">CTR</p>
                        </div>

                        <div className="text-center p-3 bg-gradient-to-br from-orange-50/60 via-orange-100/30 to-orange-200/20 backdrop-blur-sm rounded-lg border border-orange-200/40 group-hover:border-orange-300/60 group-hover:shadow-lg group-hover:bg-gradient-to-br group-hover:from-orange-100/70 group-hover:via-orange-200/40 group-hover:to-orange-300/25 transition-all duration-300">
                          <div className="flex items-center justify-center mb-1">
                            <DollarSign className="w-4 h-4 text-orange-600 mr-1" />
                            <p className="text-lg font-bold text-orange-600 group-hover:text-orange-700 transition-colors duration-300">
                              {(() => {
                                const budget = Number(campaign.budget || campaign.budgetMax || 0);
                                const conversions = Math.max(1, Math.floor((Number(campaign.actualReach || campaign.targetReach || 0)) * 0.025));
                                const cpa = conversions > 0 ? (budget / conversions).toFixed(0) : '0';
                                return formatBrandCurrency(cpa, { maximumFractionDigits: 0 });
                              })()}
                            </p>
                          </div>
                          <p className="text-xs font-medium text-gray-600 group-hover:text-gray-700 transition-colors duration-300">CPA</p>
                        </div>
                      </div>

                      {/* Secondary Metrics Row with Performance Trends */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-gradient-to-br from-teal-50/60 via-teal-100/30 to-teal-200/20 backdrop-blur-sm rounded-lg border border-teal-200/40 group-hover:border-teal-300/60 group-hover:shadow-lg group-hover:bg-gradient-to-br group-hover:from-teal-100/70 group-hover:via-teal-200/40 group-hover:to-teal-300/25 transition-all duration-300">
                          <div className="flex items-center justify-center space-x-2 mb-1">
                            <p className="text-lg font-semibold text-teal-700 group-hover:text-teal-800 transition-colors duration-300">{campaign.budget ? formatBrandCurrency(Number(campaign.budget)) : 'TBD'}</p>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-teal-500 rounded-full opacity-60"></div>
                              <TrendingUp className="w-3 h-3 text-teal-500 ml-1" />
                            </div>
                          </div>
                          <p className="text-xs font-medium text-teal-600 group-hover:text-teal-700 transition-colors duration-300">Total Budget</p>
                        </div>
                        
                        <div className="text-center p-3 bg-gradient-to-br from-emerald-50/60 via-emerald-100/30 to-emerald-200/20 backdrop-blur-sm rounded-lg border border-emerald-200/40 group-hover:border-emerald-300/60 group-hover:shadow-lg group-hover:bg-gradient-to-br group-hover:from-emerald-100/70 group-hover:via-emerald-200/40 group-hover:to-emerald-300/25 transition-all duration-300">
                          <div className="flex items-center justify-center space-x-2 mb-1">
                            <p className="text-lg font-semibold text-emerald-700 group-hover:text-emerald-800 transition-colors duration-300">{campaign.actualReach || campaign.targetReach ? formatNumber(campaign.actualReach || campaign.targetReach) : '0'}</p>
                            <div className="flex items-center">
                              {/* Mini trend sparkline */}
                              <div className="flex items-end space-x-0.5 ml-1">
                                <div className="w-0.5 h-2 bg-emerald-400"></div>
                                <div className="w-0.5 h-3 bg-emerald-500"></div>
                                <div className="w-0.5 h-4 bg-emerald-600"></div>
                                <div className="w-0.5 h-3 bg-emerald-500"></div>
                                <div className="w-0.5 h-5 bg-emerald-600"></div>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs font-medium text-emerald-600 group-hover:text-emerald-700 transition-colors duration-300">Current Reach</p>
                        </div>
                        
                        <div className="text-center p-3 bg-gradient-to-br from-rose-50/60 via-rose-100/30 to-rose-200/20 backdrop-blur-sm rounded-lg border border-rose-200/40 group-hover:border-rose-300/60 group-hover:shadow-lg group-hover:bg-gradient-to-br group-hover:from-rose-100/70 group-hover:via-rose-200/40 group-hover:to-rose-300/25 transition-all duration-300">
                          <div className="flex items-center justify-center space-x-2 mb-1">
                            <p className="text-lg font-semibold text-rose-700 group-hover:text-rose-800 transition-colors duration-300">{campaign.collaborators || 0}</p>
                            <div className="flex items-center">
                              <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-xs px-1 py-0.5 rounded">
                                {campaign.status === 'active' ? '+2' : 'New'}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs font-medium text-rose-600 group-hover:text-rose-700 transition-colors duration-300">Active Creators</p>
                        </div>
                      </div>

                    </div>

                    {/* Collapsible Campaign Intelligence Panel */}
                    <div className="mb-4 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/40 backdrop-blur-sm rounded-lg border border-indigo-200/60 group-hover:border-indigo-300/80 group-hover:shadow-lg transition-all duration-300">
                      {/* Compact Header - Always Visible */}
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gradient-to-r hover:from-indigo-100/70 hover:via-purple-100/50 hover:to-pink-100/40 transition-all duration-200"
                        onClick={() => toggleIntelligenceSection(campaign.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <h4 className="text-sm font-semibold text-indigo-700 group-hover:text-indigo-800 transition-colors">Campaign Intelligence</h4>
                          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">
                            {campaign.campaignGoal || campaign.campaignType || 'Brand Awareness'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-3">
                          {/* Compact Summary - Only when collapsed */}
                          {!expandedIntelligenceSections[campaign.id] && (
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <span>{campaign.targetAudienceLocation || 'Global'}</span>
                              <span>•</span>
                              <span>{(campaign.platforms || ['Instagram', 'TikTok']).length} platforms</span>
                              <span>•</span>
                              <span>{campaign.contentType || 'Posts & Stories'}</span>
                            </div>
                          )}
                          {expandedIntelligenceSections[campaign.id] ? (
                            <ChevronUp className="w-4 h-4 text-indigo-500 transition-transform" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-indigo-500 transition-transform" />
                          )}
                        </div>
                      </div>
                      
                      {/* Expanded Content - Only Visible When Expanded */}
                      {expandedIntelligenceSections[campaign.id] && (
                        <div className="px-4 pb-4 border-t border-indigo-100/50 bg-gradient-to-r from-indigo-25/30 via-purple-25/30 to-pink-25/30">
                          <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Target Audience */}
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-medium text-gray-700">Target Audience</span>
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                <p>{campaign.targetAudienceLocation || 'Global'}</p>
                                <p>{campaign.targetAudienceSize || '10K-100K followers'}</p>
                                <p>{campaign.targetAudienceDemographics || '18-35, All genders'}</p>
                              </div>
                            </div>

                            {/* Platforms */}
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Globe className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-medium text-gray-700">Platforms</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {(campaign.platforms || ['Instagram', 'TikTok']).slice(0, 3).map((platform: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-white/50 border-gray-200">
                                    {platform}
                                  </Badge>
                                ))}
                                {(campaign.platforms || []).length > 3 && (
                                  <Badge variant="outline" className="text-xs bg-white/50 border-gray-200">
                                    +{(campaign.platforms || []).length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Campaign Type & Content */}
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-medium text-gray-700">Content</span>
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                <p>{campaign.contentType || 'Posts & Stories'}</p>
                                <p>{campaign.minimumPosts || 1} minimum posts</p>
                                <p className="text-indigo-600 font-medium">
                                  {campaign.paymentModel === 'flat_fee' ? 'Fixed Rate' : 
                                   campaign.paymentModel === 'cpa' ? 'Performance Based' : 'Hybrid Model'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Progress Section */}
                    <div className="space-y-3 p-4 bg-gradient-to-br from-slate-50/70 via-blue-50/40 to-purple-50/30 backdrop-blur-sm rounded-lg border border-slate-200/60 group-hover:border-blue-300/80 group-hover:bg-gradient-to-br group-hover:from-blue-50/60 group-hover:via-purple-50/40 group-hover:to-slate-50/50 transition-all duration-300">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-700 group-hover:text-gray-800 transition-colors duration-300">Campaign Progress</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-blue-600 group-hover:text-blue-700 transition-colors duration-300 font-semibold">{campaign.progress || 0}%</span>
                          {(campaign.progress || 0) >= 75 && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </div>
                      <Progress value={campaign.progress || 0} className="h-3 bg-gray-200/50 group-hover:bg-gray-200/70 transition-colors duration-300" />
                      
                      {/* Progress Milestones */}
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span className={(campaign.progress || 0) >= 25 ? 'text-blue-600 font-medium' : ''}>
                          Planning
                        </span>
                        <span className={(campaign.progress || 0) >= 50 ? 'text-blue-600 font-medium' : ''}>
                          Production
                        </span>
                        <span className={(campaign.progress || 0) >= 75 ? 'text-blue-600 font-medium' : ''}>
                          Review
                        </span>
                        <span className={(campaign.progress || 0) >= 100 ? 'text-green-600 font-medium' : ''}>
                          Complete
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200/60 group-hover:border-gray-300/80 transition-colors duration-300">
                      <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                        {campaign.startDate && campaign.endDate ? 
                          `${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()}` :
                          'Dates TBD'
                        }
                      </span>
                      <div className="flex space-x-2">
                        {/* Smart Edit Button */}
                        {(() => {
                          const editState = canEditCampaign(campaign);
                          const button = (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditCampaign(campaign)}
                              disabled={!editState.allowed}
                              data-testid={`button-edit-${campaign.id}`}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          );
                          
                          return !editState.allowed ? (
                            <Tooltip>
                              <TooltipTrigger asChild>{button}</TooltipTrigger>
                              <TooltipContent>{editState.reason}</TooltipContent>
                            </Tooltip>
                          ) : button;
                        })()}

                        {/* Smart Launch Options */}
                        {campaign.status === 'draft' && (() => {
                          const isTemporary = String(campaign.id).startsWith('temp-');
                          const launchState = canLaunchCampaign(campaign);
                          
                          const dropdownMenu = (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  size="sm" 
                                  disabled={isTemporary || !launchState.allowed}
                                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                                  data-testid={`button-launch-options-${campaign.id}`}
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Launch
                                  <ChevronDown className="w-3 h-3 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => !isTemporary && launchCampaignMutation.mutate(campaign.id)}
                                  disabled={launchCampaignMutation.isPending}
                                  data-testid={`option-launch-public-${campaign.id}`}
                                >
                                  <Globe className="w-4 h-4 mr-2" />
                                  Launch Publicly
                                  <span className="text-xs text-gray-500 ml-2">(All influencers can see)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedCampaignForInfluencers(campaign);
                                    setShowInfluencerSelection(true);
                                  }}
                                  disabled={sendInvitationsMutation.isPending}
                                  data-testid={`option-assign-influencers-${campaign.id}`}
                                >
                                  <Users className="w-4 h-4 mr-2" />
                                  Assign to Influencers
                                  <span className="text-xs text-gray-500 ml-2">(Invite specific influencers)</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          );
                          
                          return !launchState.allowed ? (
                            <Tooltip>
                              <TooltipTrigger asChild>{dropdownMenu}</TooltipTrigger>
                              <TooltipContent>{launchState.reason}</TooltipContent>
                            </Tooltip>
                          ) : dropdownMenu;
                        })()}

                        {/* Smart Resume Button */}
                        {campaign.status === 'paused' && (() => {
                          const resumeState = canResumeCampaign(campaign);
                          const button = (
                            <Button 
                              size="sm" 
                              onClick={() => resumeCampaignMutation.mutate(campaign.id)}
                              disabled={!resumeState.allowed || resumeCampaignMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                            >
                              {resumeCampaignMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  Resuming...
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-1" />
                                  Resume
                                </>
                              )}
                            </Button>
                          );
                          
                          return !resumeState.allowed ? (
                            <Tooltip>
                              <TooltipTrigger asChild>{button}</TooltipTrigger>
                              <TooltipContent>{resumeState.reason}</TooltipContent>
                            </Tooltip>
                          ) : button;
                        })()}

                        {/* Smart Pause Button */}
                        {campaign.status === 'active' && (() => {
                          const pauseState = canPauseCampaign(campaign);
                          const button = (
                            <Button 
                              variant="outline"
                              size="sm" 
                              onClick={() => pauseCampaignMutation.mutate(campaign.id)}
                              disabled={!pauseState.allowed || pauseCampaignMutation.isPending}
                              className="border-orange-300 text-orange-600 hover:bg-orange-50"
                            >
                              {pauseCampaignMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  Pausing...
                                </>
                              ) : (
                                <>
                                  <Pause className="w-4 h-4 mr-1" />
                                  Pause
                                </>
                              )}
                            </Button>
                          );
                          
                          return !pauseState.allowed ? (
                            <Tooltip>
                              <TooltipTrigger asChild>{button}</TooltipTrigger>
                              <TooltipContent>{pauseState.reason}</TooltipContent>
                            </Tooltip>
                          ) : button;
                        })()}

                        {/* Smart View Influencers Button */}
                        {campaign.status !== 'draft' && (() => {
                          const viewState = canViewInfluencers(campaign);
                          const button = (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedCampaignForRecommendations(campaign.id)}
                              disabled={!viewState.allowed}
                            >
                              <Users className="w-4 h-4 mr-1" />
                              View Influencers
                            </Button>
                          );
                          
                          return !viewState.allowed ? (
                            <Tooltip>
                              <TooltipTrigger asChild>{button}</TooltipTrigger>
                              <TooltipContent>{viewState.reason}</TooltipContent>
                            </Tooltip>
                          ) : button;
                        })()}

                        {/* Smart Archive Button */}
                        {campaign.status === 'completed' && (() => {
                          const archiveState = canArchiveCampaign(campaign);
                          const button = (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => archiveCampaignMutation.mutate(campaign.id)}
                              disabled={!archiveState.allowed || archiveCampaignMutation.isPending}
                              className="border-gray-300 text-gray-600 hover:bg-gray-50"
                            >
                              {archiveCampaignMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  Archiving...
                                </>
                              ) : (
                                <>
                                  <Archive className="w-4 h-4 mr-1" />
                                  Archive
                                </>
                              )}
                            </Button>
                          );
                          
                          return !archiveState.allowed ? (
                            <Tooltip>
                              <TooltipTrigger asChild>{button}</TooltipTrigger>
                              <TooltipContent>{archiveState.reason}</TooltipContent>
                            </Tooltip>
                          ) : button;
                        })()}

                        {/* Campaign Details Button */}
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCampaignForDetails(campaign.id)}
                          className="border-purple-300 text-purple-600 hover:bg-purple-50"
                        >
                          <Activity className="w-4 h-4 mr-1" />
                          View Timeline
                        </Button>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Completed Campaigns */}
            {completedCampaigns.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Completed Campaigns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {completedCampaigns.map((campaign: any) => (
                    <div key={campaign.id} className="bg-gray-50 border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Target className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                              <p className="text-sm text-gray-500">{campaign.description}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className={getStatusColor(campaign.status || 'completed')}>
                              {campaign.status?.replace('_', ' ') || 'Completed'}
                            </Badge>
                            {campaign.platforms?.map((platform: string) => (
                              <Badge key={platform} variant="outline" className={getPlatformColor(platform)}>
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-teal-600">{campaign.budget ? formatBrandCurrency(Number(campaign.budget)) : 'TBD'}</p>
                          <p className="text-sm text-gray-500">Budget</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{campaign.reach ? formatNumber(campaign.reach) : '0'}</p>
                          <p className="text-sm text-gray-500">Reach</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{campaign.engagement || '0%'}</p>
                          <p className="text-sm text-gray-500">Engagement</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{campaign.collaborators || 0}</p>
                          <p className="text-sm text-gray-500">Influencers</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Campaign Progress</span>
                          <span>100%</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-500">
                          {campaign.startDate && campaign.endDate ? 
                            `${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()}` :
                            'Campaign Completed'
                          }
                        </span>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedCampaignForRecommendations(campaign.id)}
                          >
                            View Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Influencer Recommendations Modal */}
        {selectedCampaignForRecommendations && (
          <InfluencerRecommendationsModal 
            campaignId={selectedCampaignForRecommendations}
            isOpen={true}
            onClose={() => setSelectedCampaignForRecommendations(null)}
          />
        )}

        {/* Campaign Details Modal with Timeline */}
        {selectedCampaignForDetails && (() => {
          const campaign = campaigns?.find(c => c.id === selectedCampaignForDetails);
          if (!campaign) return null;
          
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{campaign.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={campaign.status === 'active' ? 'default' : campaign.status === 'completed' ? 'secondary' : 'outline'}
                        className={
                          campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {campaign.status}
                      </Badge>
                      {campaign.startDate && campaign.endDate && (
                        <span className="text-sm text-gray-500">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCampaignForDetails(null)}
                    className="h-8 w-8 p-0"
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="p-6">
                  <Tabs defaultValue="timeline" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                      <TabsTrigger value="influencers">Influencers</TabsTrigger>
                      <TabsTrigger value="messages" className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Messages
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="timeline" className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Campaign Timeline</h3>
                      </div>
                      <CampaignTimelineWithMilestones campaignId={campaign.id} />
                    </TabsContent>
                    
                    <TabsContent value="influencers" className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Campaign Influencers</h3>
                      </div>
                      <CampaignInfluencersList campaignId={campaign.id} />
                    </TabsContent>
                    
                    <TabsContent value="messages" className="space-y-4">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Campaign Messages & Q&A</h3>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>Campaign-specific messaging:</strong> Pre-approval questions from interested influencers and post-approval collaboration chats appear here.
                        </p>
                      </div>
                      
                      <Tabs defaultValue="questions" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="questions">Pre-Approval Questions</TabsTrigger>
                          <TabsTrigger value="collaborations">Approved Collaborations</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="questions" className="space-y-4">
                          <CampaignQuestionsView campaignId={campaign.id} />
                        </TabsContent>
                        
                        <TabsContent value="collaborations" className="space-y-4">
                          <CampaignChatsForBrand campaignId={campaign.id} currentUser={user} />
                        </TabsContent>
                      </Tabs>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Campaign Performance */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">This Month's Performance</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Total Reach</span>
                    <span className="font-medium">2.1M</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Engagement Rate</span>
                    <span className="font-medium">4.8%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Conversion Rate</span>
                    <span className="font-medium">2.3%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>ROI</span>
                    <span className="font-medium text-green-600">284%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Top Performing Campaign</h4>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Eco-Friendly Beauty Line</p>
                    <p className="text-xs text-gray-500">5.2% engagement • 18 influencers</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Upcoming Campaigns</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Winter Collection</span>
                    <span className="text-gray-500">Dec 15</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Holiday Special</span>
                    <span className="text-gray-500">Dec 20</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>New Year Campaign</span>
                    <span className="text-gray-500">Jan 1</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Creation Wizard */}
      <CampaignWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSubmit={(campaignData) => {
          if (editingCampaign) {
            updateCampaignMutation.mutate({ id: editingCampaign, ...campaignData });
          } else {
            createCampaignMutation.mutate(campaignData);
          }
          setShowWizard(false);
        }}
        isLoading={createCampaignMutation.isPending || updateCampaignMutation.isPending}
        editingCampaign={editingCampaign ? campaigns.find(c => c.id === editingCampaign) : undefined}
      />

      {/* Influencer Selection Modal */}
      <InfluencerSelectionModal
        isOpen={showInfluencerSelection}
        onClose={() => {
          setShowInfluencerSelection(false);
          setSelectedCampaignForInfluencers(null);
        }}
        onInvite={(selectedInfluencers, personalMessage, compensationOffer) => {
          if (selectedCampaignForInfluencers) {
            sendInvitationsMutation.mutate({
              campaignId: selectedCampaignForInfluencers.id,
              influencerIds: selectedInfluencers,
              personalMessage,
              compensationOffer
            });
          }
          setShowInfluencerSelection(false);
          setSelectedCampaignForInfluencers(null);
        }}
        onInviteExternal={(invitations, campaignDetails) => {
          // Send external invitations
          const invitationData = {
            campaignId: selectedCampaignForInfluencers?.id,
            invitations,
            campaignDetails
          };
          
          // Create API call for external invitations
          apiRequest('/api/brand/invite-external-influencers', 'POST', invitationData).then(() => {
            toast({
              title: "Invitations Sent!",
              description: `Successfully sent ${invitations.length} invitation${invitations.length !== 1 ? 's' : ''} to external influencers.`,
            });
          }).catch((error) => {
            toast({
              title: "Error",
              description: error.message || "Failed to send invitations",
              variant: "destructive",
            });
          });
          
          setShowInfluencerSelection(false);
          setSelectedCampaignForInfluencers(null);
        }}
        campaignTitle={selectedCampaignForInfluencers?.title || ''}
        campaignDescription={selectedCampaignForInfluencers?.description}
        campaignBudget={selectedCampaignForInfluencers?.budget ? formatBrandCurrency(Number(selectedCampaignForInfluencers.budget)) : undefined}
      />
    </div>
  );
}