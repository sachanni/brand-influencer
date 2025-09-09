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
  ArrowUp,
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
  const [currentStep, setCurrentStep] = useState(editingCampaign ? 0 : -1); // Start with template selection for new campaigns
  
  // Fetch brand profile to get preferred currency
  const { data: brandProfile } = useQuery({
    queryKey: ["/api/brand/profile"],
  });
  
  const brandCurrency = ((brandProfile as any)?.profile?.preferredCurrency || 'INR') as SupportedCurrency;

  // Campaign templates for one-click generation
  const campaignTemplates = [
    {
      id: 'fashion-launch',
      title: 'Fashion Product Launch',
      description: 'Perfect for clothing brands launching new collections',
      icon: '👗',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'from-pink-50 to-rose-50',
      borderColor: 'border-pink-200',
      data: {
        campaignType: 'product-launch',
        platforms: ['instagram', 'tiktok', 'youtube'],
        selectedObjectives: ['brand-awareness', 'engagement', 'sales'],
        selectedAgeGroups: ['gen-z', 'millennials'],
        selectedInterests: ['fashion'],
        targetAudienceLocation: 'global',
        budget: '₹50,000 - ₹2,00,000',
        paymentStructure: { upfront: 50, completion: 50, bonus: 0 },
        priority: 'medium'
      }
    },
    {
      id: 'tech-review',
      title: 'Tech Product Review',
      description: 'Ideal for gadgets, apps, and tech service reviews',
      icon: '📱',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      data: {
        campaignType: 'product-review',
        platforms: ['youtube', 'twitter', 'instagram'],
        selectedObjectives: ['brand-awareness', 'traffic', 'leads'],
        selectedAgeGroups: ['millennials', 'gen-x'],
        selectedInterests: ['tech'],
        targetAudienceLocation: 'global',
        budget: '₹1,00,000 - ₹5,00,000',
        paymentStructure: 'full-upfront',
        priority: 'medium'
      }
    },
    {
      id: 'food-lifestyle',
      title: 'Food & Lifestyle',
      description: 'Great for restaurants, food brands, and lifestyle products',
      icon: '🍕',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'from-orange-50 to-amber-50',
      borderColor: 'border-orange-200',
      data: {
        campaignType: 'brand-awareness',
        platforms: ['instagram', 'youtube', 'tiktok'],
        selectedObjectives: ['brand-awareness', 'engagement', 'ugc'],
        selectedAgeGroups: ['gen-z', 'millennials', 'gen-x'],
        selectedInterests: ['food', 'lifestyle'],
        targetAudienceLocation: 'india',
        budget: '₹25,000 - ₹1,00,000',
        paymentStructure: { upfront: 50, completion: 50, bonus: 0 },
        priority: 'low'
      }
    },
    {
      id: 'fitness-wellness',
      title: 'Fitness & Wellness',
      description: 'Perfect for gyms, supplements, and wellness brands',
      icon: '💪',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      data: {
        campaignType: 'brand-awareness',
        platforms: ['instagram', 'youtube', 'tiktok'],
        selectedObjectives: ['brand-awareness', 'engagement', 'leads'],
        selectedAgeGroups: ['millennials', 'gen-x'],
        selectedInterests: ['fitness'],
        targetAudienceLocation: 'global',
        budget: '₹75,000 - ₹3,00,000',
        paymentStructure: { upfront: 50, completion: 50, bonus: 0 },
        priority: 'medium'
      }
    },
    {
      id: 'beauty-skincare',
      title: 'Beauty & Skincare',
      description: 'Ideal for cosmetics, skincare, and beauty brands',
      icon: '💄',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
      data: {
        campaignType: 'product-launch',
        platforms: ['instagram', 'youtube', 'tiktok'],
        selectedObjectives: ['brand-awareness', 'engagement', 'sales'],
        selectedAgeGroups: ['gen-z', 'millennials'],
        selectedInterests: ['fashion'],
        targetAudienceLocation: 'global',
        budget: '₹1,00,000 - ₹4,00,000',
        paymentStructure: { upfront: 50, completion: 50, bonus: 0 },
        priority: 'high'
      }
    },
    {
      id: 'gaming-entertainment',
      title: 'Gaming & Entertainment',
      description: 'Great for games, streaming platforms, and entertainment',
      icon: '🎮',
      color: 'from-violet-500 to-purple-500',
      bgColor: 'from-violet-50 to-purple-50',
      borderColor: 'border-violet-200',
      data: {
        campaignType: 'brand-awareness',
        platforms: ['youtube', 'twitch', 'tiktok'],
        selectedObjectives: ['brand-awareness', 'engagement', 'traffic'],
        selectedAgeGroups: ['gen-z', 'millennials'],
        selectedInterests: ['tech'],
        targetAudienceLocation: 'global',
        budget: '₹1,50,000 - ₹6,00,000',
        paymentStructure: 'full-upfront',
        priority: 'medium'
      }
    }
  ];

  // Function to apply template data
  const applyTemplate = (template: typeof campaignTemplates[0]) => {
    const templateData = {
      ...template.data,
      title: `${template.title} Campaign`,
      description: `${template.description}. This campaign is designed to maximize engagement and reach your target audience effectively.`,
      briefOverview: `This ${template.title.toLowerCase()} campaign focuses on ${template.description.toLowerCase()}. We'll work with relevant influencers to create authentic content that resonates with your target audience.`,
      brandVoice: 'Authentic and engaging, matching your brand personality'
    };
    
    Object.entries(templateData).forEach(([key, value]) => {
      updateFormData(key, value);
    });
    
    setCurrentStep(0); // Go to Basic Information step
    // Scroll to top of wizard content
    setTimeout(() => {
      const wizardContent = document.querySelector('[data-testid="wizard-content"]');
      if (wizardContent) {
        wizardContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };
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
    selectedAgeGroups: editingCampaign?.selectedAgeGroups || [],
    selectedInterests: editingCampaign?.selectedInterests || [],
    selectedCharacteristics: editingCampaign?.selectedCharacteristics || [],
    competitorAnalysis: editingCampaign?.competitorAnalysis || {},
    minimumInfluencers: editingCampaign?.minimumInfluencers || "",
    
    // Payment Structure
    paymentStructure: editingCampaign?.paymentStructure || { upfront: 50, completion: 50, bonus: 0 },
    ratesByPlatform: editingCampaign?.ratesByPlatform || {},
    paymentTimeline: editingCampaign?.paymentTimeline || "Within 7 days of deliverable approval",
    bonusStructure: editingCampaign?.bonusStructure || {},
    budget: editingCampaign?.budget || "1k-10k",
    
    // Objectives & KPIs
    selectedObjectives: editingCampaign?.selectedObjectives || [],
    kpiTargets: editingCampaign?.kpiTargets || {},
    
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
      setCurrentStep(-1);
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
        selectedAgeGroups: [],
        selectedInterests: [],
        selectedCharacteristics: [],
        competitorAnalysis: {},
        minimumInfluencers: "",
        
        // Payment Structure
        paymentStructure: { upfront: 50, completion: 50, bonus: 0 },
        ratesByPlatform: {},
        paymentTimeline: "Within 7 days of deliverable approval",
        bonusStructure: {},
        budget: "1k-10k",
        
        // Objectives & KPIs
        selectedObjectives: [],
        kpiTargets: {},
        
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
          if ((!formData.selectedAgeGroups || formData.selectedAgeGroups.length === 0) && 
              (!formData.selectedInterests || formData.selectedInterests.length === 0) &&
              (!formData.selectedCharacteristics || formData.selectedCharacteristics.length === 0)) {
            errors.targetAudience = 'Please select at least one audience category (age, interests, or characteristics)';
          }
          break;
        case 'targetAudienceLocation':
          if (!formData.targetAudienceLocation) errors.targetAudienceLocation = 'Geographic targeting is required';
          break;
        case 'budget':
          if (!formData.budget) errors.budget = 'Budget range is required';
          break;
        case 'startDate':
          if (!formData.startDate) {
            errors.startDate = 'Start date is required';
          } else {
            const startDate = new Date(formData.startDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (startDate < today) {
              errors.startDate = 'Start date cannot be in the past';
            }
          }
          break;
        case 'endDate':
          if (!formData.endDate) {
            errors.endDate = 'End date is required';
          } else if (formData.startDate) {
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);
            if (endDate <= startDate) {
              errors.endDate = 'End date must be after start date';
            }
          }
          break;
        case 'priority':
          if (!formData.priority) errors.priority = 'Priority level is required';
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
      // Scroll to top of wizard content
      setTimeout(() => {
        const wizardContent = document.querySelector('[data-testid="wizard-content"]');
        if (wizardContent) {
          wizardContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, editingCampaign ? 0 : -1));
    // Scroll to top of wizard content
    setTimeout(() => {
      const wizardContent = document.querySelector('[data-testid="wizard-content"]');
      if (wizardContent) {
        wizardContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-end z-50 p-4">
      <Card className="w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 text-white relative flex-shrink-0 py-4">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-lg font-bold tracking-tight">
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-7 h-7 p-0"
              data-testid="button-close-wizard"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          
          {/* Compact Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/90 font-medium">Step {currentStep + 1} of {wizardSteps.length}</span>
              <span className="text-white/90 font-medium">{Math.round(progressPercentage)}% Complete</span>
            </div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col min-h-0" data-testid="wizard-content">
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
            <div className="p-4">

            {/* Step 0: Template Selection */}
            {currentStep === -1 && (
              <div className="space-y-4">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Quick Start with Templates</h3>
                    <p className="text-gray-600 mt-2">Choose a professionally designed template to get started in seconds, or create from scratch</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-sm text-blue-900">
                      <p className="font-bold mb-1">🚀 Smart Templates Save Time</p>
                      <p>Each template is pre-configured with industry best practices, optimal platform selections, and proven audience targeting to maximize your campaign success.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {campaignTemplates.map((template) => (
                    <div 
                      key={template.id}
                      className={cn(
                        "relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg",
                        `border-gray-200 bg-white hover:${template.borderColor}`
                      )}
                      onClick={() => applyTemplate(template)}
                      data-testid={`template-${template.id}`}
                    >
                      <div className="text-center space-y-3">
                        <div className={`w-12 h-12 bg-gradient-to-r ${template.color} rounded-full flex items-center justify-center mx-auto text-xl`}>
                          {template.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">{template.title}</h4>
                          <p className="text-sm text-gray-600 mt-2">{template.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {template.data.platforms.slice(0, 3).map((platform: string) => (
                            <span key={platform} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                              {platform}
                            </span>
                          ))}
                        </div>
                        <div className={`px-3 py-2 bg-gradient-to-r ${template.bgColor} rounded-lg border ${template.borderColor}`}>
                          <div className="text-xs font-medium text-gray-700">
                            Budget: {template.data.budget}
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute top-3 right-3">
                        <div className={`w-6 h-6 bg-gradient-to-r ${template.color} rounded-full flex items-center justify-center`}>
                          <Zap className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-6">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 mb-3">Prefer to start from scratch?</h4>
                    <Button
                      onClick={() => {
                        setCurrentStep(0);
                        // Scroll to top of wizard content
                        setTimeout(() => {
                          const wizardContent = document.querySelector('[data-testid="wizard-content"]');
                          if (wizardContent) {
                            wizardContent.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }, 100);
                      }}
                      variant="outline"
                      className="h-12 px-6 text-base font-medium hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400"
                      data-testid="create-from-scratch"
                    >
                      <Target className="w-5 h-5 mr-2" />
                      Create Custom Campaign
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Premium Basic Information */}
            {currentStep === 0 && (
              <div className="space-y-5">
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
                      "h-10 text-sm border-2 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20",
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
                      "min-h-[80px] text-sm border-2 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 resize-none",
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
                        "h-10 text-sm border-2 transition-all duration-200",
                        validationErrors.campaignType 
                          ? 'border-red-300 focus:border-red-400' 
                          : 'border-gray-200 focus:border-purple-400 hover:border-gray-300'
                      )} 
                      data-testid="wizard-select-campaign-type"
                    >
                      <SelectValue placeholder="Choose the type that best fits your campaign" />
                    </SelectTrigger>
                    <SelectContent className="border-2">
                      <SelectItem value="product-launch" className="py-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <Zap className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Product Launch</div>
                            <div className="text-xs text-gray-500">Introducing new products or services</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="brand-awareness" className="py-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Target className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Brand Awareness</div>
                            <div className="text-xs text-gray-500">Building recognition and reach</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="seasonal" className="py-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                            <Calendar className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Seasonal Campaign</div>
                            <div className="text-xs text-gray-500">Holiday or seasonal promotions</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="influencer-takeover" className="py-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                            <Users className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Influencer Takeover</div>
                            <div className="text-xs text-gray-500">Collaborative content creation</div>
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
                    <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-200 cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="thumbnail-upload"
                        data-testid="wizard-input-thumbnail"
                      />
                      <label htmlFor="thumbnail-upload" className="cursor-pointer">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform duration-200">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Upload Campaign Image</p>
                        <p className="text-xs text-gray-500 mb-1">Drag & drop or click to browse</p>
                        <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
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

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Info className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm text-blue-900">
                      <p className="font-bold text-sm mb-2">💡 Pro Tips for Success</p>
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
              <div className="space-y-5">
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
                      "min-h-[80px] text-sm border-2 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 resize-none",
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
                      "min-h-[70px] text-sm border-2 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 resize-none",
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
              <div className="space-y-5">
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-900 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2 text-purple-600" />
                    Content Formats *
                  </Label>
                  <p className="text-sm text-gray-600">Select the types of content you want influencers to create</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                      { name: 'Instagram', icon: '📸', color: 'from-pink-500 to-purple-600', desc: 'Visual storytelling' },
                      { name: 'TikTok', icon: '🎵', color: 'from-gray-900 to-gray-600', desc: 'Short-form videos' },
                      { name: 'YouTube', icon: '📹', color: 'from-red-500 to-red-600', desc: 'Long-form content' },
                      { name: 'Facebook', icon: '👥', color: 'from-blue-500 to-indigo-500', desc: 'Social networking' },
                      { name: 'Twitter', icon: '🐦', color: 'from-sky-500 to-blue-500', desc: 'Microblogging' }
                    ].map((platform) => {
                      const isSelected = formData.platforms.includes(platform.name.toLowerCase());
                      return (
                        <div 
                          key={platform.name}
                          className={cn(
                            "relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200",
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
                          <div className="flex flex-col items-center text-center space-y-1">
                            <div className={`w-10 h-10 bg-gradient-to-r ${platform.color} rounded-full flex items-center justify-center text-xl`}>
                              {platform.icon}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">{platform.name}</h4>
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


                {/* Campaign Objectives - Quick Selection */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">Campaign Objectives</h4>
                      <p className="text-sm text-gray-600">Choose your primary goals (select multiple)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { 
                        id: 'brand-awareness', 
                        title: 'Brand Awareness', 
                        desc: 'Increase visibility & recognition',
                        icon: '👁️',
                        color: 'from-blue-500 to-cyan-500',
                        bgColor: 'from-blue-50 to-cyan-50',
                        metrics: ['Reach', 'Impressions', 'Brand mentions']
                      },
                      { 
                        id: 'engagement', 
                        title: 'Engagement', 
                        desc: 'Boost likes, comments, shares',
                        icon: '💬',
                        color: 'from-green-500 to-emerald-500',
                        bgColor: 'from-green-50 to-emerald-50',
                        metrics: ['Engagement rate', 'Comments', 'Shares']
                      },
                      { 
                        id: 'traffic', 
                        title: 'Website Traffic', 
                        desc: 'Drive visitors to your site',
                        icon: '🌐',
                        color: 'from-orange-500 to-red-500',
                        bgColor: 'from-orange-50 to-red-50',
                        metrics: ['Click-through rate', 'Website visits', 'Page views']
                      },
                      { 
                        id: 'leads', 
                        title: 'Lead Generation', 
                        desc: 'Collect potential customer info',
                        icon: '📧',
                        color: 'from-purple-500 to-pink-500',
                        bgColor: 'from-purple-50 to-pink-50',
                        metrics: ['Email signups', 'Form submissions', 'Downloads']
                      },
                      { 
                        id: 'sales', 
                        title: 'Sales & Conversions', 
                        desc: 'Generate direct revenue',
                        icon: '💰',
                        color: 'from-yellow-500 to-orange-500',
                        bgColor: 'from-yellow-50 to-orange-50',
                        metrics: ['Conversion rate', 'Sales volume', 'Revenue']
                      },
                      { 
                        id: 'ugc', 
                        title: 'User-Generated Content', 
                        desc: 'Encourage customer content',
                        icon: '📸',
                        color: 'from-teal-500 to-blue-500',
                        bgColor: 'from-teal-50 to-blue-50',
                        metrics: ['UGC submissions', 'Hashtag usage', 'Reposts']
                      }
                    ].map((objective) => {
                      const isSelected = formData.selectedObjectives?.includes(objective.id) || false;
                      return (
                        <div 
                          key={objective.id}
                          className={cn(
                            "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                            isSelected 
                              ? `border-indigo-500 bg-gradient-to-br ${objective.bgColor} shadow-lg scale-105` 
                              : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md hover:scale-102'
                          )}
                          onClick={() => {
                            const currentObjectives = formData.selectedObjectives || [];
                            const newObjectives = isSelected 
                              ? currentObjectives.filter(id => id !== objective.id)
                              : [...currentObjectives, objective.id];
                            updateFormData('selectedObjectives', newObjectives);
                          }}
                          data-testid={`objective-${objective.id}`}
                        >
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          
                          <div className="text-center space-y-3">
                            <div className={`w-12 h-12 bg-gradient-to-r ${objective.color} rounded-full flex items-center justify-center mx-auto text-lg`}>
                              {objective.icon}
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900 text-sm">{objective.title}</h5>
                              <p className="text-xs text-gray-600 mt-1">{objective.desc}</p>
                            </div>
                            
                            {isSelected && (
                              <div className="text-xs text-gray-500 space-y-1">
                                <div className="font-medium">Key Metrics:</div>
                                {objective.metrics.map((metric, index) => (
                                  <div key={index} className="text-xs">• {metric}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                        "h-10 text-sm border-2 transition-all duration-200",
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
                      className="h-10 text-sm border-2 border-gray-200 focus:border-purple-400 hover:border-gray-300 transition-all duration-200" 
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

            {/* Step 3: Content Specifications */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm text-green-900">
                      <p className="font-bold text-base mb-2">📝 Content Specifications Best Practices</p>
                      <ul className="space-y-1 text-sm">
                        <li>• Clear content specifications lead to 70% better results</li>
                        <li>• Specific objectives help influencers create targeted content</li>
                        <li>• Multiple platform selection increases campaign reach</li>
                        <li>• Define your target audience precisely for better matching</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Audience & Platforms */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm text-cyan-900">
                      <p className="font-bold text-base mb-2">👥 Audience & Platform Best Practices</p>
                      <ul className="space-y-1 text-sm">
                        <li>• Clear target audience increases campaign success by 60%</li>
                        <li>• Multi-platform campaigns get 3x more engagement</li>
                        <li>• Precise audience targeting improves ROI significantly</li>
                        <li>• Geographic targeting helps local brand relevance</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Target Audience - Card Selection */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">Target Audience</h4>
                      <p className="text-sm text-gray-600">Choose your ideal audience by selecting cards below</p>
                    </div>
                  </div>

                  {/* Age Groups */}
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                          <span className="text-white text-xs">👥</span>
                        </div>
                        Age Groups (select multiple)
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { id: 'gen-z', label: 'Gen Z', desc: '16-24 years', icon: '🎯', color: 'from-pink-500 to-rose-500' },
                          { id: 'millennials', label: 'Millennials', desc: '25-34 years', icon: '📱', color: 'from-blue-500 to-cyan-500' },
                          { id: 'gen-x', label: 'Gen X', desc: '35-44 years', icon: '💼', color: 'from-green-500 to-emerald-500' },
                          { id: 'mature', label: 'Mature', desc: '45+ years', icon: '👔', color: 'from-purple-500 to-indigo-500' }
                        ].map((age) => {
                          const isSelected = formData.selectedAgeGroups?.includes(age.id) || false;
                          return (
                            <div 
                              key={age.id}
                              className={cn(
                                "relative p-2 rounded-lg border-2 cursor-pointer transition-all duration-200",
                                isSelected 
                                  ? 'border-purple-500 bg-white shadow-md scale-105' 
                                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                              )}
                              onClick={() => {
                                const currentAges = formData.selectedAgeGroups || [];
                                const newAges = isSelected 
                                  ? currentAges.filter(id => id !== age.id)
                                  : [...currentAges, age.id];
                                updateFormData('selectedAgeGroups', newAges);
                              }}
                              data-testid={`age-group-${age.id}`}
                            >
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <div className="text-center space-y-1">
                                <div className={`w-6 h-6 bg-gradient-to-r ${age.color} rounded-full flex items-center justify-center mx-auto text-xs`}>
                                  {age.icon}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 text-xs">{age.label}</div>
                                  <div className="text-xs text-gray-500">{age.desc}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interest Categories */}
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                          <span className="text-white text-xs">❤️</span>
                        </div>
                        Interest Categories (select multiple)
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { id: 'fashion', label: 'Fashion & Beauty', desc: 'Style, makeup, trends', icon: '💄', color: 'from-pink-500 to-rose-500' },
                          { id: 'lifestyle', label: 'Lifestyle', desc: 'Daily life, habits', icon: '🌟', color: 'from-yellow-500 to-orange-500' },
                          { id: 'tech', label: 'Tech & Gaming', desc: 'Gadgets, games, apps', icon: '🎮', color: 'from-blue-500 to-indigo-500' },
                          { id: 'food', label: 'Food & Travel', desc: 'Cuisine, adventures', icon: '🍕', color: 'from-green-500 to-teal-500' },
                          { id: 'fitness', label: 'Fitness & Health', desc: 'Wellness, workouts', icon: '💪', color: 'from-red-500 to-pink-500' },
                          { id: 'family', label: 'Home & Family', desc: 'Parenting, home decor', icon: '🏠', color: 'from-purple-500 to-violet-500' }
                        ].map((interest) => {
                          const isSelected = formData.selectedInterests?.includes(interest.id) || false;
                          return (
                            <div 
                              key={interest.id}
                              className={cn(
                                "relative p-2 rounded-lg border-2 cursor-pointer transition-all duration-200",
                                isSelected 
                                  ? 'border-purple-500 bg-white shadow-md scale-105' 
                                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                              )}
                              onClick={() => {
                                const currentInterests = formData.selectedInterests || [];
                                const newInterests = isSelected 
                                  ? currentInterests.filter(id => id !== interest.id)
                                  : [...currentInterests, interest.id];
                                updateFormData('selectedInterests', newInterests);
                              }}
                              data-testid={`interest-${interest.id}`}
                            >
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <div className="text-center space-y-2">
                                <div className={`w-10 h-10 bg-gradient-to-r ${interest.color} rounded-full flex items-center justify-center mx-auto text-lg`}>
                                  {interest.icon}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">{interest.label}</div>
                                  <div className="text-xs text-gray-500">{interest.desc}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Audience Characteristics */}
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-2">
                          <span className="text-white text-xs">🎭</span>
                        </div>
                        Audience Characteristics (select multiple)
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { id: 'urban', label: 'Urban', desc: 'City dwellers', icon: '🏙️', color: 'from-gray-500 to-slate-500' },
                          { id: 'suburban', label: 'Suburban', desc: 'Suburban areas', icon: '🏘️', color: 'from-green-500 to-emerald-500' },
                          { id: 'budget-conscious', label: 'Budget-Conscious', desc: 'Value seekers', icon: '💰', color: 'from-yellow-500 to-amber-500' },
                          { id: 'premium', label: 'Premium', desc: 'Luxury buyers', icon: '💎', color: 'from-purple-500 to-indigo-500' }
                        ].map((char) => {
                          const isSelected = formData.selectedCharacteristics?.includes(char.id) || false;
                          return (
                            <div 
                              key={char.id}
                              className={cn(
                                "relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200",
                                isSelected 
                                  ? 'border-purple-500 bg-white shadow-md scale-105' 
                                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                              )}
                              onClick={() => {
                                const currentChars = formData.selectedCharacteristics || [];
                                const newChars = isSelected 
                                  ? currentChars.filter(id => id !== char.id)
                                  : [...currentChars, char.id];
                                updateFormData('selectedCharacteristics', newChars);
                              }}
                              data-testid={`characteristic-${char.id}`}
                            >
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <div className="text-center space-y-2">
                                <div className={`w-8 h-8 bg-gradient-to-r ${char.color} rounded-full flex items-center justify-center mx-auto text-sm`}>
                                  {char.icon}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">{char.label}</div>
                                  <div className="text-xs text-gray-500">{char.desc}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Smart Audience Summary */}
                    {(formData.selectedAgeGroups?.length > 0 || formData.selectedInterests?.length > 0 || formData.selectedCharacteristics?.length > 0) && (
                      <div className="bg-white rounded-lg border-2 border-emerald-200 p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <h6 className="font-semibold text-gray-900">Your Target Audience Summary</h6>
                        </div>
                        
                        <div className="text-sm text-gray-700 space-y-2">
                          {formData.selectedAgeGroups?.length > 0 && (
                            <div><strong>Age Groups:</strong> {formData.selectedAgeGroups.map(age => {
                              const ageData = [
                                { id: 'gen-z', label: 'Gen Z (16-24)' },
                                { id: 'millennials', label: 'Millennials (25-34)' },
                                { id: 'gen-x', label: 'Gen X (35-44)' },
                                { id: 'mature', label: 'Mature (45+)' }
                              ].find(a => a.id === age);
                              return ageData?.label;
                            }).join(', ')}</div>
                          )}
                          
                          {formData.selectedInterests?.length > 0 && (
                            <div><strong>Interests:</strong> {formData.selectedInterests.map(interest => {
                              const interestData = [
                                { id: 'fashion', label: 'Fashion & Beauty' },
                                { id: 'lifestyle', label: 'Lifestyle' },
                                { id: 'tech', label: 'Tech & Gaming' },
                                { id: 'food', label: 'Food & Travel' },
                                { id: 'fitness', label: 'Fitness & Health' },
                                { id: 'family', label: 'Home & Family' }
                              ].find(i => i.id === interest);
                              return interestData?.label;
                            }).join(', ')}</div>
                          )}
                          
                          {formData.selectedCharacteristics?.length > 0 && (
                            <div><strong>Characteristics:</strong> {formData.selectedCharacteristics.map(char => {
                              const charData = [
                                { id: 'urban', label: 'Urban' },
                                { id: 'suburban', label: 'Suburban' },
                                { id: 'budget-conscious', label: 'Budget-Conscious' },
                                { id: 'premium', label: 'Premium' }
                              ].find(c => c.id === char);
                              return charData?.label;
                            }).join(', ')}</div>
                          )}
                        </div>
                        
                        <div className="mt-3 p-2 bg-emerald-50 rounded border border-emerald-200">
                          <div className="text-xs text-emerald-800">
                            <strong>💡 Estimated Reach:</strong> Your selections target approximately{' '}
                            <span className="font-semibold">
                              {formData.selectedAgeGroups?.length * formData.selectedInterests?.length * 50000 || 25000}
                            </span>{' '}
                            potential customers based on current market data.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {validationErrors.targetAudience && (
                    <p className="text-sm text-red-600 mt-3 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {validationErrors.targetAudience}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Payment Structure */}
            {currentStep === 4 && (
              <div className="space-y-5">
                {/* Budget Selection */}
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
                            "relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200",
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
                            <div className={`w-10 h-10 bg-gradient-to-r ${budget.color} rounded-full flex items-center justify-center mx-auto`}>
                              <DollarSign className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-sm">{budget.label}</h4>
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

                {/* Platform-Specific Rates */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">Platform-Specific Rates</h4>
                      <p className="text-sm text-gray-600">Set rates per post/video for each platform</p>
                    </div>
                  </div>

                  {formData.platforms.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Platforms Selected</h3>
                      <p className="text-gray-500 mb-4">Select content formats in Content Specifications to see platform-specific rate options</p>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                        <ArrowUp className="w-4 h-4" />
                        <span>Choose platforms in the Content Specifications step</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { platform: 'Instagram', icon: '📷', color: 'from-pink-500 to-rose-500', rates: { post: '500-2000', story: '200-800', reel: '800-3000' } },
                        { platform: 'TikTok', icon: '🎵', color: 'from-purple-500 to-pink-500', rates: { video: '1000-5000', live: '500-2000' } },
                        { platform: 'YouTube', icon: '📺', color: 'from-red-500 to-orange-500', rates: { video: '2000-10000', shorts: '500-2000', live: '1000-5000' } },
                        { platform: 'Facebook', icon: '👥', color: 'from-blue-500 to-indigo-500', rates: { post: '300-1500', video: '800-4000', story: '200-800' } },
                        { platform: 'Twitter', icon: '🐦', color: 'from-sky-500 to-blue-500', rates: { tweet: '200-1000', thread: '500-2500' } }
                      ].filter((platformData) => 
                        formData.platforms.includes(platformData.platform.toLowerCase())
                      ).map((platformData) => (
                        <div key={platformData.platform} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 bg-gradient-to-r ${platformData.color} rounded-full flex items-center justify-center text-xs`}>
                              {platformData.icon}
                            </div>
                            <h5 className="font-medium text-gray-900 text-sm">{platformData.platform}</h5>
                          </div>
                          
                          <div className="space-y-1">
                            {Object.entries(platformData.rates).map(([type, range]) => (
                              <div key={type} className="flex items-center justify-between">
                                <span className="text-xs text-gray-600 capitalize">{type}:</span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-gray-500 font-medium">{currencySymbol}</span>
                                  <Input
                                    type="number"
                                    placeholder={range.split('-')[0]}
                                    value={formData.ratesByPlatform[platformData.platform]?.[type] || range.split('-')[0]}
                                    onChange={(e) => {
                                      const platform = platformData.platform;
                                      updateFormData('ratesByPlatform', {
                                        ...formData.ratesByPlatform,
                                        [platform]: {
                                          ...formData.ratesByPlatform[platform],
                                          [type]: e.target.value
                                        }
                                      });
                                    }}
                                    className="h-8 w-20 text-xs border-2 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 rounded-md"
                                    data-testid={`rate-${platformData.platform.toLowerCase()}-${type}`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="text-xs text-gray-500 mt-2">
                            Suggested: {currencySymbol}{platformData.rates[Object.keys(platformData.rates)[0]].replace('-', ` - ${currencySymbol}`)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Split Configuration */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">Payment Structure</h4>
                      <p className="text-sm text-gray-600">Configure how payments are split across milestones</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-900">Upfront Payment (%)</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={formData.paymentStructure.upfront}
                          onChange={(e) => {
                            const upfront = parseInt(e.target.value);
                            const remaining = 100 - upfront;
                            const completion = Math.min(remaining, formData.paymentStructure.completion);
                            const bonus = remaining - completion;
                            updateFormData('paymentStructure', {
                              upfront,
                              completion,
                              bonus: Math.max(0, bonus)
                            });
                          }}
                          className="flex-1 cursor-pointer"
                        />
                        <span className="w-12 text-center font-semibold text-emerald-700">
                          {Number(formData.paymentStructure.upfront) || 0}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Paid upon project acceptance</p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-900">On Completion (%)</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          min="0"
                          max={100 - formData.paymentStructure.upfront}
                          value={formData.paymentStructure.completion}
                          onChange={(e) => {
                            const completion = parseInt(e.target.value);
                            const remaining = 100 - formData.paymentStructure.upfront - completion;
                            updateFormData('paymentStructure', {
                              ...formData.paymentStructure,
                              completion,
                              bonus: Math.max(0, remaining)
                            });
                          }}
                          className="flex-1 cursor-pointer"
                        />
                        <span className="w-12 text-center font-semibold text-emerald-700">
                          {Number(formData.paymentStructure.completion) || 0}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Paid after deliverable approval</p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-900">Performance Bonus (%)</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          min="0"
                          max={100 - formData.paymentStructure.upfront - formData.paymentStructure.completion}
                          value={formData.paymentStructure.bonus}
                          onChange={(e) => {
                            updateFormData('paymentStructure', {
                              ...formData.paymentStructure,
                              bonus: parseInt(e.target.value)
                            });
                          }}
                          className="flex-1 cursor-pointer"
                        />
                        <span className="w-12 text-center font-semibold text-emerald-700">
                          {Number(formData.paymentStructure.bonus) || 0}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Bonus for exceptional results</p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">Total Distribution:</span>
                      <span className={`font-bold ${
                        (() => {
                          const upfront = Number(formData.paymentStructure.upfront) || 0;
                          const completion = Number(formData.paymentStructure.completion) || 0;
                          const bonus = Number(formData.paymentStructure.bonus) || 0;
                          const total = upfront + completion + bonus;
                          return total === 100 ? 'text-green-600' : 'text-red-600';
                        })()
                      }`}>
                        {(() => {
                          const upfront = Number(formData.paymentStructure.upfront) || 0;
                          const completion = Number(formData.paymentStructure.completion) || 0;
                          const bonus = Number(formData.paymentStructure.bonus) || 0;
                          const total = upfront + completion + bonus;
                          return isNaN(total) ? '0' : total;
                        })()}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Timeline & Bonus Structure */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-purple-600" />
                      Payment Timeline
                    </Label>
                    <Select 
                      value={formData.paymentTimeline} 
                      onValueChange={(value) => updateFormData('paymentTimeline', value)}
                    >
                      <SelectTrigger className="h-10 text-sm border-2 border-gray-200 focus:border-purple-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Within 24 hours of deliverable approval">Within 24 hours ⚡</SelectItem>
                        <SelectItem value="Within 3 days of deliverable approval">Within 3 days 🚀</SelectItem>
                        <SelectItem value="Within 7 days of deliverable approval">Within 7 days 📅</SelectItem>
                        <SelectItem value="Within 14 days of deliverable approval">Within 14 days 📊</SelectItem>
                        <SelectItem value="Monthly batch payment on 1st">Monthly on 1st 🗓️</SelectItem>
                        <SelectItem value="Monthly batch payment on 15th">Monthly on 15th 🗓️</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-semibold text-gray-900 flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-purple-600" />
                      Bonus Triggers
                    </Label>
                    <div className="space-y-2">
                      {[
                        'Exceeds engagement rate by 25%',
                        'Generates 100+ comments',
                        'Drives 50+ website clicks',
                        'Achieves viral status (10k+ views)',
                        'Creates trending content'
                      ].map((trigger, index) => (
                        <label key={index} className="flex items-center space-x-3 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.bonusStructure[trigger] || false}
                            onChange={(e) => {
                              updateFormData('bonusStructure', {
                                ...formData.bonusStructure,
                                [trigger]: e.target.checked
                              });
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-gray-700">{trigger}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm text-blue-900">
                      <p className="font-bold text-base mb-2">💰 Payment Best Practices</p>
                      <ul className="space-y-1 text-sm">
                        <li>• 50/50 split is industry standard for trust</li>
                        <li>• Faster payments attract top influencers</li>
                        <li>• Performance bonuses increase content quality</li>
                        <li>• Clear terms = fewer payment disputes</li>
                      </ul>
                    </div>
                  </div>
                </div>


              </div>
            )}

            {/* Step 6: Timeline & Priority */}
            {currentStep === 5 && (
              <div className="space-y-5">
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

            {/* Step 7: Final Review */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">Campaign Review</h4>
                      <p className="text-sm text-gray-600">Review all details before launching your campaign</p>
                    </div>
                  </div>
                </div>

                {/* Basic Information Summary */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <h5 className="font-semibold text-gray-900">Basic Information</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Campaign Title:</span>
                      <p className="text-gray-900 mt-1">{formData.title || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Campaign Type:</span>
                      <p className="text-gray-900 mt-1 capitalize">{formData.campaignType || 'Not specified'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-900 mt-1">{formData.description || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Campaign Brief Summary */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <Info className="w-4 h-4 text-white" />
                    </div>
                    <h5 className="font-semibold text-gray-900">Campaign Brief</h5>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Brief Overview:</span>
                      <p className="text-gray-900 mt-1">{formData.briefOverview || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Brand Voice & Tone:</span>
                      <p className="text-gray-900 mt-1">{formData.brandVoice || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Content & Platforms Summary */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                    <h5 className="font-semibold text-gray-900">Content & Platforms</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Selected Platforms:</span>
                      <div className="mt-1">
                        {formData.platforms?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {formData.platforms.map((platform: string) => (
                              <span key={platform} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs capitalize">
                                {String(platform)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No platforms selected</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Campaign Objectives:</span>
                      <div className="mt-1">
                        {formData.selectedObjectives?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {formData.selectedObjectives.map((objective: string) => (
                              <span key={objective} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs">
                                {String(objective).replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No objectives selected</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Target Audience Summary */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <h5 className="font-semibold text-gray-900">Target Audience</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Age Groups:</span>
                      <div className="mt-1">
                        {formData.selectedAgeGroups?.length > 0 ? (
                          <div className="space-y-1">
                            {formData.selectedAgeGroups.map((age: string) => {
                              const ageLabels: { [key: string]: string } = {
                                'gen-z': 'Gen Z (16-24)',
                                'millennials': 'Millennials (25-34)',
                                'gen-x': 'Gen X (35-44)',
                                'mature': 'Mature (45+)'
                              };
                              return (
                                <span key={age} className="block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {ageLabels[age] || String(age)}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-500">Not specified</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Interests:</span>
                      <div className="mt-1">
                        {formData.selectedInterests?.length > 0 ? (
                          <div className="space-y-1">
                            {formData.selectedInterests.map((interest: string) => {
                              const interestLabels: { [key: string]: string } = {
                                'fashion': 'Fashion & Beauty',
                                'lifestyle': 'Lifestyle',
                                'tech': 'Tech & Gaming',
                                'food': 'Food & Travel',
                                'fitness': 'Fitness & Health',
                                'family': 'Home & Family'
                              };
                              return (
                                <span key={interest} className="block px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                  {interestLabels[interest] || String(interest)}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-500">Not specified</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Geographic Location:</span>
                      <p className="text-gray-900 mt-1 capitalize">{formData.targetAudienceLocation || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Structure Summary */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <h5 className="font-semibold text-gray-900">Payment Structure</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Budget Range:</span>
                      <p className="text-gray-900 mt-1">{formData.budget || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Payment Structure:</span>
                      <p className="text-gray-900 mt-1">
                        {typeof formData.paymentStructure === 'object' && formData.paymentStructure !== null 
                          ? `${formData.paymentStructure.upfront}% upfront, ${formData.paymentStructure.completion}% on completion${formData.paymentStructure.bonus > 0 ? `, ${formData.paymentStructure.bonus}% bonus` : ''}`
                          : typeof formData.paymentStructure === 'string' 
                            ? formData.paymentStructure.replace('-', ' ')
                            : 'Not specified'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline & Priority Summary */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <h5 className="font-semibold text-gray-900">Timeline & Priority</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Start Date:</span>
                      <p className="text-gray-900 mt-1">
                        {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">End Date:</span>
                      <p className="text-gray-900 mt-1">
                        {formData.endDate ? new Date(formData.endDate).toLocaleDateString() : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Priority Level:</span>
                      <p className="text-gray-900 mt-1 capitalize">{formData.priority || 'Not specified'}</p>
                    </div>
                    {formData.urgencyReason && (
                      <div className="md:col-span-3">
                        <span className="font-medium text-gray-700">Urgency Reason:</span>
                        <p className="text-gray-900 mt-1">{formData.urgencyReason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Launch Information */}
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
                disabled={currentStep === -1}
                className={cn(
                  "h-10 px-4 text-sm font-medium transition-all duration-200",
                  currentStep === -1 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:bg-gray-100 hover:border-gray-400 hover:scale-105"
                )}
                data-testid="wizard-button-previous"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStep === 0 ? 'Back to Templates' : 'Previous'}
              </Button>

              <div className="flex items-center space-x-3 text-sm text-gray-600">
                {currentStep >= 0 && (
                  <>
                    <div className="flex items-center space-x-2">
                      {wizardSteps.map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all duration-200",
                            index < currentStep ? "bg-green-500" :
                            index === currentStep ? "bg-purple-500 scale-125" :
                            "bg-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-medium">Step {currentStep + 1} of {wizardSteps.length}</span>
                  </>
                )}
                {currentStep === -1 && (
                  <span className="font-medium">Choose Template or Create Custom</span>
                )}
              </div>

              {currentStep === -1 ? (
                <div className="w-32"></div>
              ) : currentStep === wizardSteps.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="h-10 px-6 text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 shadow-lg"
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
                  className="h-10 px-6 text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 shadow-lg"
                  data-testid="wizard-button-next"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}