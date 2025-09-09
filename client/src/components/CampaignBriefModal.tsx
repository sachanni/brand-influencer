import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Target, Users, DollarSign, Calendar, MessageCircle, 
  CheckCircle, Clock, MapPin, Globe, Award, Zap,
  FileText, Video, Camera, Mic, Eye, Star, Briefcase,
  TrendingUp, BarChart3, Settings, AlertTriangle
} from "lucide-react";
import { SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";

interface Campaign {
  id: string;
  title: string;
  description: string;
  campaignType: string;
  
  // Enhanced Brief Fields
  briefOverview?: string;
  brandVoice?: string;
  keyMessages?: string;
  contentDosAndDonts?: string;
  
  // Content Specifications
  contentFormats?: string[];
  platformRequirements?: string;
  videoSpecs?: string;
  captionRequirements?: string;
  
  // Audience & Platforms
  platforms: string[];
  targetAudience: string;
  audiencePersonas?: string;
  targetAudienceLocation?: string;
  
  // Payment Structure
  paymentStructure?: string;
  ratesByPlatform?: string;
  paymentTimeline?: string;
  budget: string;
  
  // Timeline & Priority
  generalStartDate?: string;
  generalEndDate?: string;
  exactStartDate?: string;
  exactEndDate?: string;
  priority?: string;
  urgencyReason?: string;
  
  // Brand Information
  brandName?: string;
  brandIndustry?: string;
  brandWebsite?: string;
  thumbnailUrl?: string;
}

interface CampaignBriefModalProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (campaignId: string) => void;
  onAskQuestion?: (campaignId: string) => void;
  onViewQuestions?: (campaignId: string) => void;
  applicationStatus?: string;
}

const platformIcons = {
  instagram: SiInstagram,
  tiktok: SiTiktok,
  youtube: SiYoutube,
};

const platformColors = {
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  tiktok: "bg-black text-white",
  youtube: "bg-red-600 text-white",
};

export function CampaignBriefModal({ 
  campaign, 
  isOpen, 
  onOpenChange, 
  onApply, 
  onAskQuestion,
  onViewQuestions,
  applicationStatus 
}: CampaignBriefModalProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!campaign) return null;

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getApplicationStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                {campaign.title}
              </DialogTitle>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className="capitalize">
                  {campaign.campaignType}
                </Badge>
                {campaign.priority && (
                  <Badge className={getPriorityColor(campaign.priority)}>
                    {campaign.priority} Priority
                  </Badge>
                )}
                {applicationStatus && (
                  <Badge className={getApplicationStatusColor(applicationStatus)}>
                    {applicationStatus}
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-gray-600 text-base leading-relaxed">
                {campaign.description}
              </DialogDescription>
            </div>
            {campaign.thumbnailUrl && (
              <img 
                src={campaign.thumbnailUrl} 
                alt={campaign.title}
                className="w-24 h-24 object-cover rounded-xl ml-6 shadow-md"
              />
            )}
          </div>

          {/* Key Campaign Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 mb-1">Budget Range</p>
                    <p className="font-semibold text-blue-900">{campaign.budget}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 mb-1">Duration</p>
                    <p className="font-semibold text-green-900">
                      {campaign.generalStartDate && campaign.generalEndDate ? 
                        `${new Date(campaign.generalStartDate).toLocaleDateString()} - ${new Date(campaign.generalEndDate).toLocaleDateString()}` : 
                        'Timeline TBD'
                      }
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 mb-1">Platforms</p>
                    <div className="flex items-center gap-1">
                      {campaign.platforms.slice(0, 3).map((platform) => {
                        const Icon = platformIcons[platform as keyof typeof platformIcons];
                        return Icon ? (
                          <Icon key={platform} className="w-4 h-4 text-purple-600" />
                        ) : null;
                      })}
                      {campaign.platforms.length > 3 && (
                        <span className="text-xs text-purple-600">+{campaign.platforms.length - 3}</span>
                      )}
                    </div>
                  </div>
                  <Eye className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 mb-1">Brand</p>
                    <p className="font-semibold text-orange-900">{campaign.brandName || 'Brand Name'}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-6 bg-gray-100 border-2 border-gray-300 rounded-xl p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-blue-400 hover:bg-blue-100 hover:border-2 hover:border-blue-300 transition-all duration-200 rounded-lg font-medium">Overview</TabsTrigger>
            <TabsTrigger value="brief" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-green-400 hover:bg-green-100 hover:border-2 hover:border-green-300 transition-all duration-200 rounded-lg font-medium">Campaign Brief</TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-purple-400 hover:bg-purple-100 hover:border-2 hover:border-purple-300 transition-all duration-200 rounded-lg font-medium">Content Specs</TabsTrigger>
            <TabsTrigger value="audience" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-teal-400 hover:bg-teal-100 hover:border-2 hover:border-teal-300 transition-all duration-200 rounded-lg font-medium">Audience</TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-emerald-400 hover:bg-emerald-100 hover:border-2 hover:border-emerald-300 transition-all duration-200 rounded-lg font-medium">Payment</TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-orange-400 hover:bg-orange-100 hover:border-2 hover:border-orange-300 transition-all duration-200 rounded-lg font-medium">Timeline</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-blue-400 bg-gradient-to-br from-blue-50/80 to-white shadow-lg hover:shadow-xl hover:border-blue-500 transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-blue-600" />
                    Campaign Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-700 leading-relaxed text-sm font-medium">
                    {campaign.briefOverview || campaign.description}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50/80 to-white shadow-lg hover:shadow-xl hover:border-green-500 transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-green-600" />
                    Target Audience
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-700 mb-2 text-sm font-medium">{campaign.targetAudience}</p>
                  {campaign.targetAudienceLocation && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-green-100/50 rounded-lg p-2 border border-green-300">
                      <MapPin className="w-3 h-3" />
                      <span className="font-medium">{campaign.targetAudienceLocation}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-purple-400 bg-gradient-to-br from-purple-50/80 to-white shadow-lg hover:shadow-xl hover:border-purple-500 transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Platform Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {campaign.platforms.map((platform) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons];
                    const getEnhancedPlatformStyle = (platform: string) => {
                      switch (platform.toLowerCase()) {
                        case 'instagram': return 'bg-gradient-to-r from-pink-100/80 to-purple-100/80 border-2 border-pink-400';
                        case 'tiktok': return 'bg-gradient-to-r from-gray-100/80 to-gray-200/80 border-2 border-gray-400';
                        case 'youtube': return 'bg-gradient-to-r from-red-100/80 to-orange-100/80 border-2 border-red-400';
                        default: return 'bg-gradient-to-r from-gray-100/80 to-gray-200/80 border-2 border-gray-400';
                      }
                    };
                    return (
                      <div key={platform} className={`p-3 rounded-xl ${getEnhancedPlatformStyle(platform)} shadow-md hover:shadow-lg transition-all duration-200`}>
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="w-5 h-5" />}
                          <div>
                            <h4 className="font-bold capitalize text-sm">{platform}</h4>
                            <p className="text-xs font-medium opacity-80">Content required</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaign Brief Tab */}
          <TabsContent value="brief" className="space-y-4">
            <div className="space-y-4">
              {campaign.briefOverview && (
                <Card className="border-2 border-blue-400 bg-gradient-to-br from-blue-50/80 to-white shadow-lg hover:shadow-xl hover:border-blue-500 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Detailed Brief
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm font-medium">
                      {campaign.briefOverview}
                    </p>
                  </CardContent>
                </Card>
              )}

              {campaign.brandVoice && (
                <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50/80 to-white shadow-lg hover:shadow-xl hover:border-green-500 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mic className="w-5 h-5 text-green-600" />
                      Brand Voice & Tone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm font-medium">
                      {campaign.brandVoice}
                    </p>
                  </CardContent>
                </Card>
              )}

              {campaign.keyMessages && (
                <Card className="border-2 border-purple-400 bg-gradient-to-br from-purple-50/80 to-white shadow-lg hover:shadow-xl hover:border-purple-500 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="w-5 h-5 text-purple-600" />
                      Key Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm font-medium">
                      {campaign.keyMessages}
                    </p>
                  </CardContent>
                </Card>
              )}

              {campaign.contentDosAndDonts && (
                <Card className="border-2 border-orange-400 bg-gradient-to-br from-orange-50/80 to-white shadow-lg hover:shadow-xl hover:border-orange-500 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Settings className="w-5 h-5 text-orange-600" />
                      Content Guidelines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm font-medium">
                      {campaign.contentDosAndDonts}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Content Specifications Tab */}
          <TabsContent value="content" className="space-y-4">
            {/* Platform Requirements Cards */}
            <Card className="border-2 border-purple-400 bg-gradient-to-br from-purple-50/80 to-white shadow-lg hover:shadow-xl hover:border-purple-500 transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Platform Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {campaign.platforms.map((platform) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons];
                    const getEnhancedPlatformStyle = (platform: string) => {
                      switch (platform.toLowerCase()) {
                        case 'instagram': return 'bg-gradient-to-r from-pink-100/80 to-purple-100/80 border-2 border-pink-400';
                        case 'tiktok': return 'bg-gradient-to-r from-gray-100/80 to-gray-200/80 border-2 border-gray-400';
                        case 'youtube': return 'bg-gradient-to-r from-red-100/80 to-orange-100/80 border-2 border-red-400';
                        default: return 'bg-gradient-to-r from-gray-100/80 to-gray-200/80 border-2 border-gray-400';
                      }
                    };
                    return (
                      <div key={platform} className={`p-3 rounded-xl ${getEnhancedPlatformStyle(platform)} shadow-md`}>
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="w-5 h-5" />}
                          <div>
                            <h4 className="font-bold capitalize text-sm">{platform}</h4>
                            <p className="text-xs font-medium opacity-80">Content required</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaign.contentFormats && (
                <Card className="border-2 border-blue-400 bg-gradient-to-br from-blue-50/80 to-white shadow-lg hover:shadow-xl hover:border-blue-500 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Camera className="w-5 h-5 text-blue-600" />
                      Content Formats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {(Array.isArray(campaign.contentFormats) ? campaign.contentFormats : [campaign.contentFormats]).map((format, index) => (
                        <Badge key={index} className="mr-2 mb-2 bg-blue-100 text-blue-800 border-2 border-blue-300 font-medium">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {campaign.videoSpecs && (
                <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50/80 to-white shadow-lg hover:shadow-xl hover:border-green-500 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Video className="w-5 h-5 text-green-600" />
                      Video Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm font-medium">
                      {campaign.videoSpecs}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {campaign.platformRequirements && (
              <Card className="border-2 border-teal-400 bg-gradient-to-br from-teal-50/80 to-white shadow-lg hover:shadow-xl hover:border-teal-500 transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="w-5 h-5 text-teal-600" />
                    Platform Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm font-medium">
                    {campaign.platformRequirements}
                  </p>
                </CardContent>
              </Card>
            )}

            {campaign.captionRequirements && (
              <Card className="border-2 border-orange-400 bg-gradient-to-br from-orange-50/80 to-white shadow-lg hover:shadow-xl hover:border-orange-500 transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Caption Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm font-medium">
                    {campaign.captionRequirements}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="space-y-4">
            <Card className="border-2 border-blue-400 bg-gradient-to-br from-blue-50/80 to-white shadow-lg hover:shadow-xl hover:border-blue-500 transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                  Target Audience Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 leading-relaxed mb-3 text-sm font-medium">
                  {campaign.targetAudience}
                </p>
                {campaign.targetAudienceLocation && (
                  <div className="bg-blue-100/50 rounded-lg p-3 border-2 border-blue-300">
                    <div className="flex items-center gap-2 text-blue-700">
                      <MapPin className="w-4 h-4" />
                      <span className="font-semibold">Primary Location: {campaign.targetAudienceLocation}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {campaign.audiencePersonas && (
              <Card className="border-2 border-purple-400 bg-gradient-to-br from-purple-50/80 to-white shadow-lg hover:shadow-xl hover:border-purple-500 transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="w-5 h-5 text-purple-600" />
                    Audience Personas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm font-medium">
                    {campaign.audiencePersonas}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50/80 to-white shadow-lg hover:shadow-xl hover:border-green-500 transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Payment Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="bg-green-100/50 rounded-lg p-3 border-2 border-green-300">
                      <p className="text-xs text-green-600 mb-1 font-medium">💰 Budget Range</p>
                      <p className="text-lg font-bold text-green-700">{campaign.budget}</p>
                    </div>
                    {campaign.paymentStructure && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1 font-medium">Payment Structure</p>
                        <p className="text-gray-700 text-sm font-medium">{
                          (() => {
                            if (typeof campaign.paymentStructure === 'object' && campaign.paymentStructure !== null) {
                              const structure = campaign.paymentStructure as any;
                              const upfront = structure.upfront || 0;
                              const completion = structure.completion || 0; 
                              const bonus = structure.bonus || 0;
                              
                              let terms = [];
                              if (upfront > 0) terms.push(`${upfront}% Upfront`);
                              if (completion > 0) terms.push(`${completion}% on Completion`);
                              if (bonus > 0) terms.push(`${bonus}% Performance Bonus`);
                              
                              return terms.length > 0 ? terms.join(', ') : 'Custom Payment Plan';
                            }
                            return campaign.paymentStructure;
                          })()
                        }</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {campaign.paymentTimeline && (
                <Card className="border-2 border-blue-400 bg-gradient-to-br from-blue-50/80 to-white shadow-lg hover:shadow-xl hover:border-blue-500 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Payment Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-700 leading-relaxed text-sm font-medium">
                      {campaign.paymentTimeline}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {campaign.ratesByPlatform && (
              <Card className="border-2 border-purple-400 bg-gradient-to-br from-purple-50/80 to-white shadow-lg hover:shadow-xl hover:border-purple-500 transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    Platform-Specific Rates
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm font-medium">
                    {campaign.ratesByPlatform}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-blue-400 bg-gradient-to-br from-blue-50/80 to-white shadow-lg hover:shadow-xl hover:border-blue-500 transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Campaign Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="bg-blue-100/50 rounded-lg p-3 border-2 border-blue-300">
                      <p className="text-xs text-blue-600 mb-1 font-medium">📅 Start Date</p>
                      <p className="font-bold text-blue-800">
                        {campaign.generalStartDate ? new Date(campaign.generalStartDate).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                    <div className="bg-red-100/50 rounded-lg p-3 border-2 border-red-300">
                      <p className="text-xs text-red-600 mb-1 font-medium">🏁 End Date</p>
                      <p className="font-bold text-red-800">
                        {campaign.generalEndDate ? new Date(campaign.generalEndDate).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {campaign.priority && (
                <Card className="border-2 border-orange-400 bg-gradient-to-br from-orange-50/80 to-white shadow-lg hover:shadow-xl hover:border-orange-500 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Priority Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <Badge className={`${getPriorityColor(campaign.priority)} border-2 font-bold text-sm px-3 py-1`}>
                        {campaign.priority} Priority
                      </Badge>
                      {campaign.urgencyReason && (
                        <div className="bg-orange-100/50 rounded-lg p-3 border-2 border-orange-300">
                          <p className="text-gray-700 text-sm leading-relaxed font-medium">
                            {campaign.urgencyReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <div className="flex items-center gap-3">
            {onAskQuestion && (
              <Button
                variant="outline"
                onClick={() => onAskQuestion(campaign.id)}
                className="flex items-center gap-2"
                data-testid="button-ask-question"
              >
                <MessageCircle className="w-4 h-4" />
                Ask Question
              </Button>
            )}
            {onViewQuestions && (
              <Button
                variant="outline"
                onClick={() => onViewQuestions(campaign.id)}
                className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                data-testid="button-view-questions"
              >
                <Eye className="w-4 h-4" />
                My Questions
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-modal"
            >
              Close
            </Button>
            {onApply && applicationStatus !== 'approved' && applicationStatus !== 'pending' && (
              <Button
                onClick={() => onApply(campaign.id)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-apply-campaign"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply Now
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}