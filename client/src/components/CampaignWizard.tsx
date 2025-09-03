import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { getCurrencySymbol, type SupportedCurrency } from '@/lib/currency';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Info,
  Target,
  Users,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  MapPin,
  Zap,
  ImageIcon,
  Upload,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  fields: string[];
}

const wizardSteps: WizardStep[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Define your campaign fundamentals',
    icon: <Target className="w-5 h-5" />,
    fields: ['title', 'description', 'campaignType', 'thumbnailUrl']
  },
  {
    id: 'brief',
    title: 'Campaign Brief',
    description: 'Detailed brief and brand guidelines',
    icon: <Info className="w-5 h-5" />,
    fields: ['briefOverview', 'brandVoice', 'keyMessages', 'contentDosAndDonts']
  },
  {
    id: 'content',
    title: 'Content Specifications',
    description: 'Platform requirements and content formats',
    icon: <ImageIcon className="w-5 h-5" />,
    fields: ['contentFormats', 'platformRequirements', 'videoSpecs', 'captionRequirements']
  },
  {
    id: 'targeting',
    title: 'Audience & Platforms',
    description: 'Target audience and platform selection',
    icon: <Users className="w-5 h-5" />,
    fields: ['platforms', 'targetAudience', 'audiencePersonas', 'targetAudienceLocation']
  },
  {
    id: 'payment',
    title: 'Payment Structure',
    description: 'Compensation and payment terms',
    icon: <DollarSign className="w-5 h-5" />,
    fields: ['paymentStructure', 'ratesByPlatform', 'paymentTimeline', 'budget']
  },
  {
    id: 'timeline',
    title: 'Timeline & Priority',
    description: 'Campaign schedule and urgency',
    icon: <Calendar className="w-5 h-5" />,
    fields: ['startDate', 'endDate', 'priority', 'urgencyReason']
  },
  {
    id: 'final',
    title: 'Final Review',
    description: 'Review and launch your campaign',
    icon: <Check className="w-5 h-5" />,
    fields: ['objectives']
  }
];

interface CampaignWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (campaignData: any) => void;
  isLoading?: boolean;
  editingCampaign?: any;
}

export function CampaignWizard({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false,
  editingCampaign 
}: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Fetch brand profile to get preferred currency
  const { data: brandProfile } = useQuery({
    queryKey: ["/api/brand/profile"],
  });
  
  const brandCurrency = ((brandProfile as any)?.profile?.preferredCurrency || 'INR') as SupportedCurrency;
  const currencySymbol = getCurrencySymbol(brandCurrency);
  
  // Currency-specific budget ranges
  const getBudgetRanges = (currency: SupportedCurrency) => {
    const ranges = {
      INR: [
        { value: '1k-10k', label: '₹1K - ₹10K', desc: 'Starter campaigns', tier: 'Basic', color: 'from-green-500 to-emerald-500' },
        { value: '11k-20k', label: '₹11K - ₹20K', desc: 'Small-medium reach', tier: 'Standard', color: 'from-blue-500 to-cyan-500' },
        { value: '21k-30k', label: '₹21K - ₹30K', desc: 'Growing campaigns', tier: 'Standard', color: 'from-blue-500 to-cyan-500' },
        { value: '31k-50k', label: '₹31K - ₹50K', desc: 'Established reach', tier: 'Professional', color: 'from-purple-500 to-pink-500' },
        { value: '51k-75k', label: '₹51K - ₹75K', desc: 'Premium campaigns', tier: 'Professional', color: 'from-purple-500 to-pink-500' },
        { value: '76k-100k', label: '₹76K - ₹1L', desc: 'High-impact reach', tier: 'Premium', color: 'from-orange-500 to-red-500' },
        { value: '1l-2l', label: '₹1L - ₹2L', desc: 'Major campaigns', tier: 'Premium', color: 'from-orange-500 to-red-500' },
        { value: '2l-5l', label: '₹2L - ₹5L', desc: 'Enterprise level', tier: 'Enterprise', color: 'from-gray-800 to-gray-900' },
        { value: '5l+', label: '₹5L+', desc: 'Maximum reach', tier: 'Enterprise', color: 'from-gray-800 to-gray-900' }
      ],
      USD: [
        { value: '100-500', label: '$100 - $500', desc: 'Starter campaigns', tier: 'Basic', color: 'from-green-500 to-emerald-500' },
        { value: '500-1k', label: '$500 - $1K', desc: 'Small-medium reach', tier: 'Standard', color: 'from-blue-500 to-cyan-500' },
        { value: '1k-2k', label: '$1K - $2K', desc: 'Growing campaigns', tier: 'Standard', color: 'from-blue-500 to-cyan-500' },
        { value: '2k-5k', label: '$2K - $5K', desc: 'Established reach', tier: 'Professional', color: 'from-purple-500 to-pink-500' },
        { value: '5k-10k', label: '$5K - $10K', desc: 'Premium campaigns', tier: 'Professional', color: 'from-purple-500 to-pink-500' },
        { value: '10k-25k', label: '$10K - $25K', desc: 'High-impact reach', tier: 'Premium', color: 'from-orange-500 to-red-500' },
        { value: '25k-50k', label: '$25K - $50K', desc: 'Major campaigns', tier: 'Premium', color: 'from-orange-500 to-red-500' },
        { value: '50k+', label: '$50K+', desc: 'Enterprise level', tier: 'Enterprise', color: 'from-gray-800 to-gray-900' }
      ],
      GBP: [
        { value: '100-500', label: '£100 - £500', desc: 'Starter campaigns', tier: 'Basic', color: 'from-green-500 to-emerald-500' },
        { value: '500-1k', label: '£500 - £1K', desc: 'Small-medium reach', tier: 'Standard', color: 'from-blue-500 to-cyan-500' },
        { value: '1k-2k', label: '£1K - £2K', desc: 'Growing campaigns', tier: 'Standard', color: 'from-blue-500 to-cyan-500' },
        { value: '2k-5k', label: '£2K - £5K', desc: 'Established reach', tier: 'Professional', color: 'from-purple-500 to-pink-500' },
        { value: '5k-10k', label: '£5K - £10K', desc: 'Premium campaigns', tier: 'Professional', color: 'from-purple-500 to-pink-500' },
        { value: '10k-20k', label: '£10K - £20K', desc: 'High-impact reach', tier: 'Premium', color: 'from-orange-500 to-red-500' },
        { value: '20k-40k', label: '£20K - £40K', desc: 'Major campaigns', tier: 'Premium', color: 'from-orange-500 to-red-500' },
        { value: '40k+', label: '£40K+', desc: 'Enterprise level', tier: 'Enterprise', color: 'from-gray-800 to-gray-900' }
      ],
      EUR: [
        { value: '100-500', label: '€100 - €500', desc: 'Starter campaigns', tier: 'Basic', color: 'from-green-500 to-emerald-500' },
        { value: '500-1k', label: '€500 - €1K', desc: 'Small-medium reach', tier: 'Standard', color: 'from-blue-500 to-cyan-500' },
        { value: '1k-2k', label: '€1K - €2K', desc: 'Growing campaigns', tier: 'Standard', color: 'from-blue-500 to-cyan-500' },
        { value: '2k-5k', label: '€2K - €5K', desc: 'Established reach', tier: 'Professional', color: 'from-purple-500 to-pink-500' },
        { value: '5k-10k', label: '€5K - €10K', desc: 'Premium campaigns', tier: 'Professional', color: 'from-purple-500 to-pink-500' },
        { value: '10k-25k', label: '€10K - €25K', desc: 'High-impact reach', tier: 'Premium', color: 'from-orange-500 to-red-500' },
        { value: '25k-50k', label: '€25K - €50K', desc: 'Major campaigns', tier: 'Premium', color: 'from-orange-500 to-red-500' },
        { value: '50k+', label: '€50K+', desc: 'Enterprise level', tier: 'Enterprise', color: 'from-gray-800 to-gray-900' }
      ]
    };
    return ranges[currency];
  };
  
  const budgetRanges = getBudgetRanges(brandCurrency);
  const [formData, setFormData] = useState({
    // Basic Information
    title: editingCampaign?.title || "",
    description: editingCampaign?.description || "",
    campaignType: editingCampaign?.campaignType || "",
    thumbnailUrl: editingCampaign?.thumbnailUrl || "",
    
    // Enhanced Brief Section
    briefOverview: editingCampaign?.briefOverview || "",
    brandVoice: editingCampaign?.brandVoice || "",
    keyMessages: editingCampaign?.keyMessages || [],
    contentDosAndDonts: editingCampaign?.contentDosAndDonts || { dos: [], donts: [] },
    moodBoardUrls: editingCampaign?.moodBoardUrls || [],
    exampleContentUrls: editingCampaign?.exampleContentUrls || [],
    
    // Content Specifications
    contentFormats: editingCampaign?.contentFormats || [],
    platformRequirements: editingCampaign?.platformRequirements || {},
    videoSpecs: editingCampaign?.videoSpecs || { duration: "30-60s", resolution: "1080p", aspectRatio: "9:16" },
    imageSpecs: editingCampaign?.imageSpecs || { resolution: "1080x1080", format: "JPG/PNG" },
    captionRequirements: editingCampaign?.captionRequirements || "",
    
    // Enhanced Audience & Platforms
    platforms: editingCampaign?.platforms || [],
    targetAudience: editingCampaign?.targetAudience || "",
    audiencePersonas: editingCampaign?.audiencePersonas || [],
    audienceInsights: editingCampaign?.audienceInsights || {},
    targetAudienceLocation: editingCampaign?.targetAudienceLocation || "",
    competitorAnalysis: editingCampaign?.competitorAnalysis || {},
    minimumInfluencers: editingCampaign?.minimumInfluencers || "",
    
    // Payment Structure
    paymentStructure: editingCampaign?.paymentStructure || { upfront: 50, completion: 50, bonus: 0 },
    ratesByPlatform: editingCampaign?.ratesByPlatform || {},
    paymentTimeline: editingCampaign?.paymentTimeline || "Within 7 days of deliverable approval",
    bonusStructure: editingCampaign?.bonusStructure || {},
    budget: editingCampaign?.budget || "1k-10k",
    
    // Timeline & Priority
    startDate: editingCampaign?.startDate || "",
    endDate: editingCampaign?.endDate || "",
    priority: editingCampaign?.priority || "medium",
    urgencyReason: editingCampaign?.urgencyReason || "",
    
    // Final Review
    objectives: editingCampaign?.objectives || "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens for a new campaign
  useEffect(() => {
    if (isOpen && !editingCampaign) {
      // Reset to initial state for new campaign
      setCurrentStep(0);
      setFormData({
        // Basic Information
        title: "",
        description: "",
        campaignType: "",
        thumbnailUrl: "",
        
        // Enhanced Brief Section
        briefOverview: "",
        brandVoice: "",
        keyMessages: [],
        contentDosAndDonts: { dos: [], donts: [] },
        moodBoardUrls: [],
        exampleContentUrls: [],
        
        // Content Specifications
        contentFormats: [],
        platformRequirements: {},
        videoSpecs: { duration: "30-60s", resolution: "1080p", aspectRatio: "9:16" },
        imageSpecs: { resolution: "1080x1080", format: "JPG/PNG" },
        captionRequirements: "",
        
        // Enhanced Audience & Platforms
        platforms: [],
        targetAudience: "",
        audiencePersonas: [],
        audienceInsights: {},
        targetAudienceLocation: "",
        competitorAnalysis: {},
        minimumInfluencers: "",
        
        // Payment Structure
        paymentStructure: { upfront: 50, completion: 50, bonus: 0 },
        ratesByPlatform: {},
        paymentTimeline: "Within 7 days of deliverable approval",
        bonusStructure: {},
        budget: "1k-10k",
        
        // Timeline & Priority
        startDate: "",
        endDate: "",
        priority: "medium",
        urgencyReason: "",
        
        // Final Review
        objectives: "",
      });
      setValidationErrors({});
    }
  }, [isOpen, editingCampaign]);

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Set loading state
      updateFormData('thumbnailUrl', 'UPLOADING');

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('thumbnail', file);

      // Upload file to server
      const response = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      if (result.success && result.thumbnailUrl) {
        // Set the permanent server URL
        updateFormData('thumbnailUrl', result.thumbnailUrl);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      // Clear the upload state and show error
      updateFormData('thumbnailUrl', '');
      // You could add a toast notification here for better UX
      alert('Failed to upload image. Please try again.');
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when field is updated
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (stepIndex: number): boolean => {
    const step = wizardSteps[stepIndex];
    const errors: Record<string, string> = {};

    step.fields.forEach(field => {
      switch (field) {
        case 'title':
          if (!formData.title.trim()) errors.title = 'Campaign title is required';
          break;
        case 'description':
          if (!formData.description.trim()) errors.description = 'Campaign description is required';
          break;
        case 'campaignType':
          if (!formData.campaignType) errors.campaignType = 'Campaign type is required';
          break;
        case 'thumbnailUrl':
          if (!formData.thumbnailUrl || formData.thumbnailUrl === 'UPLOADING') {
            errors.thumbnailUrl = 'Campaign thumbnail is required';
          }
          break;
        case 'platforms':
          if (formData.platforms.length === 0) errors.platforms = 'At least one platform must be selected';
          break;
        case 'targetAudience':
          if (!formData.targetAudience.trim()) errors.targetAudience = 'Target audience is required';
          break;
        case 'targetAudienceLocation':
          if (!formData.targetAudienceLocation) errors.targetAudienceLocation = 'Geographic targeting is required';
          break;
        case 'budget':
          if (!formData.budget) errors.budget = 'Budget range is required';
          break;
        case 'urgencyReason':
          if ((formData.priority === 'urgent' || formData.priority === 'high') && !formData.urgencyReason.trim()) {
            errors.urgencyReason = `Please explain why this campaign requires ${formData.priority} priority`;
          }
          break;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, wizardSteps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onSubmit(formData);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'pending';
  };

  const progressPercentage = ((currentStep + 1) / wizardSteps.length) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white relative flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold tracking-tight">
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 p-0"
              data-testid="button-close-wizard"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Compact Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/90 font-medium">Step {currentStep + 1} of {wizardSteps.length}</span>
              <span className="text-white/90 font-medium">{Math.round(progressPercentage)}% Complete</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
          {/* Compact Step Navigation */}
          <div className="border-b bg-gradient-to-r from-gray-50 to-slate-50 flex-shrink-0">
            <div className="flex">
              {wizardSteps.map((step, index) => {
                const status = getStepStatus(index);
                return (
                  <div 
                    key={step.id}
                    className={cn(
                      "flex-1 p-3 text-center border-r last:border-r-0 transition-all duration-300 relative",
                      status === 'completed' && "bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700",
                      status === 'current' && "bg-gradient-to-br from-purple-50 to-indigo-50 text-purple-700 border-b-2 border-purple-500",
                      status === 'pending' && "text-gray-500"
                    )}
                    data-testid={`step-indicator-${step.id}`}
                  >
                    {/* Active step indicator */}
                    {status === 'current' && (
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                    )}
                    
                    <div className="flex items-center justify-center mb-1">
                      {status === 'completed' ? (
                        <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
                          status === 'current' 
                            ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white" 
                            : "bg-white border border-gray-300 text-gray-600"
                        )}>
                          {React.cloneElement(step.icon as React.ReactElement, { className: "w-3 h-3" })}
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "text-xs font-semibold",
                      status === 'current' && "text-purple-700"
                    )}>{step.title}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6">

            {/* Step 1: Premium Basic Information */}
            {currentStep === 0 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-base font-semibold text-gray-900 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-purple-600" />
                    Campaign Title *
                  </Label>
                  <Input
                    placeholder="e.g., Summer Collection Launch - Be descriptive and engaging"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    className={cn(
                      "h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20",
                      validationErrors.title 
                        ? 'border-red-300 focus:border-red-400' 
                        : 'border-gray-200 focus:border-purple-400 hover:border-gray-300'
                    )}
                    data-testid="wizard-input-title"
                  />
                  {validationErrors.title && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {validationErrors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-base font-semibold text-gray-900 flex items-center">
                    <Info className="w-4 h-4 mr-2 text-purple-600" />
                    Campaign Description *
                  </Label>
                  <Textarea
                    placeholder="Describe your campaign goals, key messages, brand values, target outcomes, and what you're looking for in content creators. Be specific about the style, tone, and deliverables you want."
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    className={cn(
                      "min-h-[120px] text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 resize-none",
                      validationErrors.description 
                        ? 'border-red-300 focus:border-red-400' 
                        : 'border-gray-200 focus:border-purple-400 hover:border-gray-300'
                    )}
                    data-testid="wizard-input-description"
                  />
                  {validationErrors.description && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {validationErrors.description}
                    </p>
                  )}
                  <div className="text-sm text-gray-500">
                    {formData.description.length}/500 characters
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="campaignType" className="text-base font-semibold text-gray-900 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-purple-600" />
                    Campaign Type *
                  </Label>
                  <Select value={formData.campaignType} onValueChange={(value) => updateFormData('campaignType', value)}>
                    <SelectTrigger 
                      className={cn(
                        "h-12 text-base border-2 transition-all duration-200",
                        validationErrors.campaignType 
                          ? 'border-red-300 focus:border-red-400' 
                          : 'border-gray-200 focus:border-purple-400 hover:border-gray-300'
                      )} 
                      data-testid="wizard-select-campaign-type"
                    >
                      <SelectValue placeholder="Choose the type that best fits your campaign" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="product-launch" className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold">Product Launch</div>
                            <div className="text-sm text-gray-500">Introducing new products or services</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="brand-awareness" className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Target className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold">Brand Awareness</div>
                            <div className="text-sm text-gray-500">Building recognition and reach</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="seasonal" className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold">Seasonal Campaign</div>
                            <div className="text-sm text-gray-500">Holiday or seasonal promotions</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="influencer-takeover" className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold">Influencer Takeover</div>
                            <div className="text-sm text-gray-500">Collaborative content creation</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.campaignType && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {validationErrors.campaignType}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="thumbnail" className="text-base font-semibold text-gray-900 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2 text-purple-600" />
                    Campaign Thumbnail
                  </Label>
                  <p className="text-sm text-gray-600">Add a compelling visual to represent your campaign (optional, but highly recommended for better engagement)</p>
                  
                  {!formData.thumbnailUrl ? (
                    <div className="border-2 border-dashed border-purple-200 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-200 cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="thumbnail-upload"
                        data-testid="wizard-input-thumbnail"
                      />
                      <label htmlFor="thumbnail-upload" className="cursor-pointer">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-200">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-base font-semibold text-gray-700 mb-2">Upload Campaign Image</p>
                        <p className="text-sm text-gray-500 mb-1">Drag & drop or click to browse</p>
                        <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB • Recommended size: 1200x630px</p>
                      </label>
                    </div>
                  ) : formData.thumbnailUrl === 'UPLOADING' ? (
                    <div className="relative border-2 border-purple-300 rounded-xl p-6 bg-gradient-to-r from-purple-50 to-indigo-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                          <div className="animate-spin w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-800">Uploading image...</p>
                          <p className="text-sm text-gray-600">Please wait while we process your image</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative border-2 border-purple-200 rounded-xl p-6 bg-gradient-to-r from-purple-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <img 
                              src={formData.thumbnailUrl} 
                              alt="Campaign thumbnail" 
                              className="w-16 h-16 object-cover rounded-xl shadow-md"
                            />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div>
                            <p className="text-base font-semibold text-gray-800">Campaign image uploaded successfully</p>
                            <p className="text-sm text-gray-600">Looking great! Click remove to change</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateFormData('thumbnailUrl', '')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                          data-testid="button-remove-thumbnail"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Info className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm text-blue-900">
                      <p className="font-bold text-base mb-2">💡 Pro Tips for Success</p>
                      <ul className="space-y-1 text-sm">
                        <li>• Use action words in your title to create excitement</li>
                        <li>• Include specific deliverables in your description</li>
                        <li>• A compelling thumbnail increases proposal rates by 40%</li>
                        <li>• Be clear about your brand voice and style preferences</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Enhanced Campaign Brief */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="briefOverview" className="text-base font-semibold text-gray-900 flex items-center">
                    <Info className="w-4 h-4 mr-2 text-purple-600" />
                    Campaign Brief Overview *
                  </Label>
                  <p className="text-sm text-gray-600">Provide a comprehensive overview of what this campaign is about and what you want to achieve</p>
                  <Textarea
                    placeholder="Describe your campaign's main purpose, goals, and key outcomes you're looking for. Include your brand story, campaign theme, and the message you want to convey through influencers."
                    value={formData.briefOverview}
                    onChange={(e) => updateFormData('briefOverview', e.target.value)}
                    className={cn(
                      "min-h-[120px] text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 resize-none",
                      validationErrors.briefOverview 
                        ? 'border-red-300 focus:border-red-400' 
                        : 'border-gray-200 focus:border-purple-400 hover:border-gray-300'
                    )}
                    data-testid="wizard-input-brief-overview"
                  />
                  {validationErrors.briefOverview && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {validationErrors.briefOverview}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="brandVoice" className="text-base font-semibold text-gray-900 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-600" />
                    Brand Voice & Tone *
                  </Label>
                  <p className="text-sm text-gray-600">Describe how you want your brand to sound and feel in the content</p>
                  <Textarea
                    placeholder="e.g., Friendly and approachable, Professional but warm, Energetic and inspiring, Authentic and relatable, Sophisticated and elegant"
                    value={formData.brandVoice}
                    onChange={(e) => updateFormData('brandVoice', e.target.value)}
                    className={cn(
                      "min-h-[100px] text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 resize-none",
                      validationErrors.brandVoice 
                        ? 'border-red-300 focus:border-red-400' 
                        : 'border-gray-200 focus:border-purple-400 hover:border-gray-300'
                    )}
                    data-testid="wizard-input-brand-voice"
                  />
                  {validationErrors.brandVoice && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {validationErrors.brandVoice}
                    </p>
                  )}
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Info className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm text-blue-900">
                      <p className="font-bold text-base mb-2">📝 Brief Best Practices</p>
                      <ul className="space-y-1 text-sm">
                        <li>• Be specific about your campaign goals and expected outcomes</li>
                        <li>• Define your brand voice clearly to guide content creation</li>
                        <li>• Include your brand values and what makes you unique</li>
                        <li>• Clear briefs result in 60% better content alignment</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Content Specifications */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-900 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2 text-purple-600" />
                    Content Formats *
                  </Label>
                  <p className="text-sm text-gray-600">Select the types of content you want influencers to create</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: 'Instagram', icon: '📸', color: 'from-pink-500 to-purple-600', desc: 'Visual storytelling' },
                      { name: 'TikTok', icon: '🎵', color: 'from-gray-900 to-gray-600', desc: 'Short-form videos' },
                      { name: 'YouTube', icon: '📹', color: 'from-red-500 to-red-600', desc: 'Long-form content' }
                    ].map((platform) => {
                      const isSelected = formData.platforms.includes(platform.name.toLowerCase());
                      return (
                        <div 
                          key={platform.name}
                          className={cn(
                            "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                            isSelected 
                              ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg scale-105' 
                              : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md hover:scale-102',
                            validationErrors.platforms ? 'border-red-300' : ''
                          )}
                          onClick={() => {
                            const newPlatforms = isSelected 
                              ? formData.platforms.filter((p: string) => p !== platform.name.toLowerCase())
                              : [...formData.platforms, platform.name.toLowerCase()];
                            updateFormData('platforms', newPlatforms);
                          }}
                          data-testid={`wizard-platform-${platform.name.toLowerCase()}`}
                        >
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className={`w-12 h-12 bg-gradient-to-r ${platform.color} rounded-full flex items-center justify-center text-2xl`}>
                              {platform.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                              <p className="text-xs text-gray-500">{platform.desc}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {validationErrors.platforms && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {validationErrors.platforms}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="targetAudience" className="text-base font-semibold text-gray-900 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-purple-600" />
                    Target Audience *
                  </Label>
                  <p className="text-sm text-gray-600">Describe your ideal audience demographics and interests</p>
                  <Input
                    placeholder="e.g., Fashion & Beauty enthusiasts, Age 18-35, Urban millennials"
                    value={formData.targetAudience}
                    onChange={(e) => updateFormData('targetAudience', e.target.value)}
                    className={cn(
                      "h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20",
                      validationErrors.targetAudience 
                        ? 'border-red-300 focus:border-red-400' 
                        : 'border-gray-200 focus:border-purple-400 hover:border-gray-300'
                    )}
                    data-testid="wizard-input-target-audience"
                  />
                  {validationErrors.targetAudience && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {validationErrors.targetAudience}
                    </p>
                  )}
                  
                  {/* Enhanced tip section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">💡 Quick Selection Tip</p>
                        <p className="text-blue-700 mt-1">Click any category below to instantly populate your target audience, or type your own custom description above.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {['Fashion & Beauty', 'Lifestyle', 'Tech & Gaming', 'Food & Travel', 'Fitness & Health', 'Home & Family'].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => updateFormData('targetAudience', suggestion)}
                        className="px-4 py-2 text-sm font-medium bg-white border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-400 rounded-lg transition-all duration-200 hover:shadow-sm hover:scale-105"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="location" className="text-base font-semibold text-gray-900 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                    Geographic Targeting *
                  </Label>
                  <p className="text-sm text-gray-600">Choose where you want to reach your audience</p>
                  <Select value={formData.targetAudienceLocation} onValueChange={(value) => updateFormData('targetAudienceLocation', value)}>
                    <SelectTrigger 
                      className={cn(
                        "h-12 text-base border-2 transition-all duration-200",
                        validationErrors.targetAudienceLocation 
                          ? 'border-red-300 focus:border-red-400' 
                          : 'border-gray-200 focus:border-purple-400 hover:border-gray-300'
                      )} 
                      data-testid="wizard-select-location"
                    >
                      <SelectValue placeholder="Choose your target geographic region" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="global" className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                            🌍
                          </div>
                          <div>
                            <div className="font-semibold">Global</div>
                            <div className="text-sm text-gray-500">Worldwide reach</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="india" className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                            🇮🇳
                          </div>
                          <div>
                            <div className="font-semibold">India</div>
                            <div className="text-sm text-gray-500">Entire country</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="india-mumbai" className="py-2">
                        <div className="pl-11">
                          <div className="font-medium">Mumbai, India</div>
                          <div className="text-sm text-gray-500">Financial capital</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="india-delhi" className="py-2">
                        <div className="pl-11">
                          <div className="font-medium">Delhi, India</div>
                          <div className="text-sm text-gray-500">National capital region</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="india-bangalore" className="py-2">
                        <div className="pl-11">
                          <div className="font-medium">Bangalore, India</div>
                          <div className="text-sm text-gray-500">Tech hub</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="usa" className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-red-500 rounded-lg flex items-center justify-center">
                            🇺🇸
                          </div>
                          <div>
                            <div className="font-semibold">United States</div>
                            <div className="text-sm text-gray-500">North America</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="uk" className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-red-600 rounded-lg flex items-center justify-center">
                            🇬🇧
                          </div>
                          <div>
                            <div className="font-semibold">United Kingdom</div>
                            <div className="text-sm text-gray-500">Europe</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.targetAudienceLocation && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {validationErrors.targetAudienceLocation}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="influencers" className="text-base font-semibold text-gray-900 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-600" />
                    Minimum Influencers
                  </Label>
                  <p className="text-sm text-gray-600">How many influencers do you want to work with for this campaign?</p>
                  <Select value={formData.minimumInfluencers} onValueChange={(value) => updateFormData('minimumInfluencers', value)}>
                    <SelectTrigger 
                      className="h-12 text-base border-2 border-gray-200 focus:border-purple-400 hover:border-gray-300 transition-all duration-200" 
                      data-testid="wizard-select-influencers"
                    >
                      <SelectValue placeholder="Choose your preferred influencer count" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="5-10" className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold">5-10 Influencers</div>
                            <div className="text-sm text-gray-500">Boutique campaign</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="10-25" className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold">10-25 Influencers</div>
                            <div className="text-sm text-gray-500">Standard reach</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="25-50" className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold">25-50 Influencers</div>
                            <div className="text-sm text-gray-500">Wide coverage</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="50+" className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold">50+ Influencers</div>
                            <div className="text-sm text-gray-500">Maximum reach</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm text-amber-900">
                      <p className="font-bold text-base mb-2">🎯 Smart Targeting Strategy</p>
                      <ul className="space-y-1 text-sm">
                        <li>• Specific targeting = 3x better engagement rates</li>
                        <li>• Choose 2-3 platforms for focused campaigns</li>
                        <li>• Local targeting often outperforms global</li>
                        <li>• Quality influencers &gt; quantity for brand campaigns</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Premium Timeline & Priority */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">Campaign Timeline</h4>
                      <p className="text-sm text-gray-600">Set your campaign start and end dates</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="startDate" className="text-base font-semibold text-gray-900 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-purple-600" />
                        Start Date & Time
                      </Label>
                      <Input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => updateFormData('startDate', e.target.value)}
                        className="h-12 text-base border-2 border-gray-200 focus:border-purple-400 hover:border-gray-300 transition-all duration-200"
                        data-testid="wizard-input-start-date"
                      />
                      <p className="text-xs text-gray-500">When do you want the campaign to begin?</p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="endDate" className="text-base font-semibold text-gray-900 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-purple-600" />
                        End Date & Time
                      </Label>
                      <Input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => updateFormData('endDate', e.target.value)}
                        className="h-12 text-base border-2 border-gray-200 focus:border-purple-400 hover:border-gray-300 transition-all duration-200"
                        data-testid="wizard-input-end-date"
                      />
                      <p className="text-xs text-gray-500">Campaign deadline for deliverables</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="priority" className="text-base font-semibold text-gray-900 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-purple-600" />
                    Priority Level
                  </Label>
                  <p className="text-sm text-gray-600">How urgent is this campaign for your business goals?</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { value: 'low', label: 'Low Priority', desc: 'Standard timeline, flexible deadlines', color: 'from-green-500 to-emerald-500', bgColor: 'from-green-50 to-emerald-50', borderColor: 'border-green-200' },
                      { value: 'medium', label: 'Medium Priority', desc: 'Preferred timeline, moderate urgency', color: 'from-blue-500 to-cyan-500', bgColor: 'from-blue-50 to-cyan-50', borderColor: 'border-blue-200' },
                      { value: 'high', label: 'High Priority', desc: 'Fast turnaround needed', color: 'from-orange-500 to-amber-500', bgColor: 'from-orange-50 to-amber-50', borderColor: 'border-orange-200' },
                      { value: 'urgent', label: 'Urgent', desc: 'Critical timeline, immediate action', color: 'from-red-500 to-rose-500', bgColor: 'from-red-50 to-rose-50', borderColor: 'border-red-200' }
                    ].map((priority) => {
                      const isSelected = formData.priority === priority.value;
                      return (
                        <div 
                          key={priority.value}
                          className={cn(
                            "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                            isSelected 
                              ? `${priority.borderColor} bg-gradient-to-br ${priority.bgColor} shadow-lg scale-105` 
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:scale-102'
                          )}
                          onClick={() => updateFormData('priority', priority.value)}
                          data-testid={`wizard-priority-${priority.value}`}
                        >
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 bg-gradient-to-r ${priority.color} rounded-full flex items-center justify-center`}>
                              <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{priority.label}</h4>
                              <p className="text-sm text-gray-600">{priority.desc}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {(formData.priority === 'urgent' || formData.priority === 'high') && (
                  <div className="space-y-3">
                    <Label htmlFor="urgency-reason" className="text-base font-semibold text-gray-900 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                      Reason for {formData.priority} priority *
                    </Label>
                    <p className="text-sm text-gray-600">Help influencers understand why this campaign needs priority handling</p>
                    <Textarea
                      placeholder={`Please explain why this campaign requires ${formData.priority} priority (e.g., product launch date, event deadline, seasonal campaign, competitor response, limited-time promotion)`}
                      value={formData.urgencyReason}
                      onChange={(e) => updateFormData('urgencyReason', e.target.value)}
                      className={cn(
                        "min-h-[100px] text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 resize-none",
                        validationErrors.urgencyReason 
                          ? 'border-red-300 focus:border-red-400' 
                          : 'border-gray-200 focus:border-purple-400 hover:border-gray-300'
                      )}
                      data-testid="wizard-input-urgency-reason"
                    />
                    {validationErrors.urgencyReason && (
                      <p className="text-sm text-red-600 mt-1 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {validationErrors.urgencyReason}
                      </p>
                    )}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800">
                        <strong>💡 Tip:</strong> Clear urgency explanations help influencers prioritize your campaign and often lead to faster responses.
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm text-indigo-900">
                      <p className="font-bold text-base mb-2">⏰ Timeline Best Practices</p>
                      <ul className="space-y-1 text-sm">
                        <li>• Allow 5-7 days for quality content creation</li>
                        <li>• Buffer 2-3 days for revisions and approvals</li>
                        <li>• High-priority campaigns get 40% faster responses</li>
                        <li>• Clear deadlines = better planning = higher quality</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Premium Budget & Objectives */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label htmlFor="budget" className="text-base font-semibold text-gray-900 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-purple-600" />
                    Budget Range * ({brandCurrency})
                  </Label>
                  <p className="text-sm text-gray-600">Choose your investment level for this campaign</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {budgetRanges.map((budget) => {
                      const isSelected = formData.budget === budget.value;
                      return (
                        <div 
                          key={budget.value}
                          className={cn(
                            "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                            isSelected 
                              ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg scale-105' 
                              : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md hover:scale-102',
                            validationErrors.budget ? 'border-red-300' : ''
                          )}
                          onClick={() => updateFormData('budget', budget.value)}
                          data-testid={`wizard-budget-${budget.value}`}
                        >
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className="text-center space-y-2">
                            <div className={`w-12 h-12 bg-gradient-to-r ${budget.color} rounded-full flex items-center justify-center mx-auto`}>
                              <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">{budget.label}</h4>
                              <p className="text-xs text-gray-500">{budget.desc}</p>
                              <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                                budget.tier === 'Basic' ? 'bg-green-100 text-green-700' :
                                budget.tier === 'Standard' ? 'bg-blue-100 text-blue-700' :
                                budget.tier === 'Professional' ? 'bg-purple-100 text-purple-700' :
                                budget.tier === 'Premium' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {budget.tier}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {validationErrors.budget && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {validationErrors.budget}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="objectives" className="text-base font-semibold text-gray-900 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-purple-600" />
                    Campaign Objectives & Success Metrics
                  </Label>
                  <p className="text-sm text-gray-600">Define your goals, KPIs, and what success looks like for this campaign</p>
                  <Textarea
                    placeholder="Example objectives:
• Increase brand awareness by 25%
• Generate 500+ website visits
• Achieve 5% engagement rate minimum
• Collect 100+ user-generated content pieces
• Drive 50+ product inquiries
• Build email list with 200+ subscribers

Include specific deliverables, content requirements, and measurable outcomes..."
                    value={formData.objectives}
                    onChange={(e) => updateFormData('objectives', e.target.value)}
                    className="min-h-[140px] text-base border-2 border-gray-200 focus:border-purple-400 hover:border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 resize-none"
                    data-testid="wizard-input-objectives"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Be specific about your expectations and success criteria</span>
                    <span>{formData.objectives.length}/1000 characters</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {['Brand Awareness', 'Lead Generation', 'Sales Conversion', 'Engagement', 'User-Generated Content', 'Website Traffic', 'Social Growth', 'Product Launch'].map((objective) => (
                      <button
                        key={objective}
                        type="button"
                        onClick={() => {
                          const current = formData.objectives;
                          const addition = current ? `\n• ${objective}` : `• ${objective}`;
                          updateFormData('objectives', current + addition);
                        }}
                        className="p-2 text-xs bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-lg transition-colors duration-200 text-center"
                      >
                        + {objective}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm text-emerald-900">
                      <p className="font-bold text-base mb-2">🎆 Ready to Launch Your Campaign</p>
                      <ul className="space-y-1 text-sm">
                        <li>• Campaign will be created as a reviewable draft</li>
                        <li>• You can edit all details before going live</li>
                        <li>• Influencers can start submitting proposals once published</li>
                        <li>• Our matching algorithm will suggest relevant creators</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="border-t bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={cn(
                  "h-12 px-6 text-base font-medium transition-all duration-200",
                  currentStep === 0 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:bg-gray-100 hover:border-gray-400 hover:scale-105"
                )}
                data-testid="wizard-button-previous"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>

              <div className="flex items-center space-x-4 text-base text-gray-600">
                <div className="flex items-center space-x-2">
                  {wizardSteps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-3 h-3 rounded-full transition-all duration-200",
                        index < currentStep ? "bg-green-500" :
                        index === currentStep ? "bg-purple-500 scale-125" :
                        "bg-gray-300"
                      )}
                    />
                  ))}
                </div>
                <span className="font-medium">Step {currentStep + 1} of {wizardSteps.length}</span>
              </div>

              {currentStep === wizardSteps.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 shadow-lg"
                  data-testid="wizard-button-submit"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {editingCampaign ? 'Updating Campaign...' : 'Creating Campaign...'}
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      {editingCampaign ? 'Update Campaign' : 'Launch Campaign'}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 shadow-lg"
                  data-testid="wizard-button-next"
                >
                  Continue to {wizardSteps[currentStep + 1]?.title}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}