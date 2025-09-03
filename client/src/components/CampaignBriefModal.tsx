import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
              <p className="text-gray-600 text-base leading-relaxed">
                {campaign.description}
              </p>
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="brief">Campaign Brief</TabsTrigger>
            <TabsTrigger value="content">Content Specs</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Campaign Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {campaign.briefOverview || campaign.description}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Target Audience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3">{campaign.targetAudience}</p>
                  {campaign.targetAudienceLocation && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{campaign.targetAudienceLocation}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Platform Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {campaign.platforms.map((platform) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons];
                    const colorClass = platformColors[platform as keyof typeof platformColors];
                    return (
                      <div key={platform} className={`p-4 rounded-lg ${colorClass}`}>
                        <div className="flex items-center gap-3">
                          {Icon && <Icon className="w-6 h-6" />}
                          <div>
                            <h4 className="font-semibold capitalize">{platform}</h4>
                            <p className="text-sm opacity-90">Content required</p>
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
          <TabsContent value="brief" className="space-y-6">
            <div className="space-y-6">
              {campaign.briefOverview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Detailed Brief
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {campaign.briefOverview}
                    </p>
                  </CardContent>
                </Card>
              )}

              {campaign.brandVoice && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="w-5 h-5 text-green-600" />
                      Brand Voice & Tone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {campaign.brandVoice}
                    </p>
                  </CardContent>
                </Card>
              )}

              {campaign.keyMessages && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      Key Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {campaign.keyMessages}
                    </p>
                  </CardContent>
                </Card>
              )}

              {campaign.contentDosAndDonts && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-orange-600" />
                      Content Guidelines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {campaign.contentDosAndDonts}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Content Specifications Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Platform Requirements Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Platform Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {campaign.platforms.map((platform) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons];
                    const colorClass = platform === 'instagram' ? 'bg-gradient-to-r from-pink-100 to-purple-100' : 
                                     platform === 'tiktok' ? 'bg-gradient-to-r from-black/5 to-gray-100' :
                                     platform === 'youtube' ? 'bg-gradient-to-r from-red-100 to-orange-100' :
                                     'bg-gray-100';
                    return (
                      <div key={platform} className={`p-4 rounded-lg ${colorClass}`}>
                        <div className="flex items-center gap-3">
                          {Icon && <Icon className="w-6 h-6" />}
                          <div>
                            <h4 className="font-semibold capitalize">{platform}</h4>
                            <p className="text-sm opacity-90">Content required</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaign.contentFormats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-blue-600" />
                      Content Formats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(Array.isArray(campaign.contentFormats) ? campaign.contentFormats : [campaign.contentFormats]).map((format, index) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-2">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {campaign.videoSpecs && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-green-600" />
                      Video Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {campaign.videoSpecs}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {campaign.platformRequirements && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-600" />
                    Platform Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {campaign.platformRequirements}
                  </p>
                </CardContent>
              </Card>
            )}

            {campaign.captionRequirements && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Caption Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {campaign.captionRequirements}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Target Audience Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {campaign.targetAudience}
                </p>
                {campaign.targetAudienceLocation && (
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>Primary Location: {campaign.targetAudienceLocation}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {campaign.audiencePersonas && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-purple-600" />
                    Audience Personas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {campaign.audiencePersonas}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Payment Structure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Budget Range</p>
                      <p className="text-lg font-semibold text-green-700">{campaign.budget}</p>
                    </div>
                    {campaign.paymentStructure && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Payment Structure</p>
                        <p className="text-gray-700">{campaign.paymentStructure}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {campaign.paymentTimeline && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Payment Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {campaign.paymentTimeline}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {campaign.ratesByPlatform && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    Platform-Specific Rates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {campaign.ratesByPlatform}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Campaign Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Start Date</p>
                      <p className="font-semibold">
                        {campaign.generalStartDate ? new Date(campaign.generalStartDate).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">End Date</p>
                      <p className="font-semibold">
                        {campaign.generalEndDate ? new Date(campaign.generalEndDate).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {campaign.priority && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Priority Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Badge className={getPriorityColor(campaign.priority)}>
                        {campaign.priority} Priority
                      </Badge>
                      {campaign.urgencyReason && (
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {campaign.urgencyReason}
                        </p>
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