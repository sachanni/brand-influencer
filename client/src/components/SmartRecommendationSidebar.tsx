import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Users, 
  Calendar, 
  BarChart3,
  ChevronRight,
  Star,
  AlertTriangle,
  CheckCircle,
  X,
  Minimize2
} from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: string;
  proposalCount?: number;
  approvedCount?: number;
  category: string;
}

interface BrandProfile {
  id: string;
  companyName: string;
  industry: string;
  targetAudience: string;
  budgetRange: string;
}

interface RecommendationItem {
  id: string;
  type: 'critical' | 'opportunity' | 'optimization' | 'insight';
  category: 'performance' | 'budget' | 'targeting' | 'content' | 'timing' | 'influencers';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionText?: string;
  onAction?: () => void;
}

interface SmartRecommendationSidebarProps {
  campaigns?: Campaign[];
  brandProfile?: BrandProfile;
  currentPage?: 'dashboard' | 'campaigns' | 'analytics' | 'proposals';
  currentCampaign?: Campaign;
  isVisible?: boolean;
  onClose?: () => void;
}

export function SmartRecommendationSidebar({ 
  campaigns = [], 
  brandProfile, 
  currentPage = 'dashboard',
  currentCampaign,
  isVisible = true,
  onClose 
}: SmartRecommendationSidebarProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<string[]>([]);

  // Smart recommendation engine
  const recommendations = useMemo(() => {
    const recs: RecommendationItem[] = [];

    // Campaign Performance Analysis
    if (campaigns.length > 0) {
      const activeCampaigns = campaigns.filter(c => c.status === 'active');
      const completedCampaigns = campaigns.filter(c => c.status === 'completed');
      const lowPerformingCampaigns = campaigns.filter(c => (c.proposalCount || 0) < 5);
      const highPerformingCampaigns = campaigns.filter(c => (c.proposalCount || 0) > 15);

      // Critical: Low proposal volume
      if (lowPerformingCampaigns.length > 0) {
        recs.push({
          id: 'low-proposals',
          type: 'critical',
          category: 'performance',
          title: 'Low Proposal Volume Detected',
          description: `${lowPerformingCampaigns.length} campaigns have fewer than 5 proposals. This suggests targeting may be too narrow or budget too low.`,
          impact: 'high',
          actionText: 'Analyze & Fix'
        });
      }

      // Optimization: Campaign overload
      if (activeCampaigns.length > 3) {
        recs.push({
          id: 'campaign-overload',
          type: 'optimization',
          category: 'performance',
          title: 'Multiple Active Campaigns',
          description: `${activeCampaigns.length} campaigns running simultaneously. Consider focusing budget on fewer, higher-impact campaigns.`,
          impact: 'medium',
          actionText: 'Review Strategy'
        });
      }

      // Opportunity: Scale successful campaigns
      if (highPerformingCampaigns.length > 0) {
        recs.push({
          id: 'scale-success',
          type: 'opportunity',
          category: 'budget',
          title: 'Scale High-Performing Campaigns',
          description: `${highPerformingCampaigns.length} campaigns have high proposal volume. Consider increasing budget for similar campaigns.`,
          impact: 'high',
          actionText: 'Scale Up'
        });
      }

      // Advanced analytics
      const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
      const avgProposals = campaigns.reduce((sum, c) => sum + (c.proposalCount || 0), 0) / campaigns.length;
      
      if (totalBudget > 50000) {
        recs.push({
          id: 'enterprise-features',
          type: 'opportunity',
          category: 'performance',
          title: 'Unlock Enterprise Features',
          description: 'With your campaign volume, consider dedicated account management and priority influencer matching.',
          impact: 'medium',
          actionText: 'Learn More'
        });
      }

      if (avgProposals < 8) {
        recs.push({
          id: 'improve-targeting',
          type: 'optimization',
          category: 'targeting',
          title: 'Expand Targeting Criteria',
          description: 'Your campaigns average fewer proposals than industry benchmark. Try broadening audience criteria.',
          impact: 'medium',
          actionText: 'Optimize Targeting'
        });
      }
    }

    // Budget Optimization
    if (brandProfile?.budgetRange) {
      const budgetTier = brandProfile.budgetRange.toLowerCase();
      if (budgetTier.includes('startup') || budgetTier.includes('small')) {
        recs.push({
          id: 'budget-micro-influencers',
          type: 'opportunity',
          category: 'budget',
          title: 'Focus on Micro-Influencers',
          description: 'Your budget range suggests micro-influencers (10K-100K followers) offer better ROI than macro-influencers.',
          impact: 'high',
          actionText: 'Find Micro-Influencers'
        });
      }
    }

    // Advanced Industry-Specific Insights
    if (brandProfile?.industry) {
      const industry = brandProfile.industry.toLowerCase();
      
      if (industry.includes('fashion') || industry.includes('beauty')) {
        recs.push({
          id: 'visual-content-focus',
          type: 'insight',
          category: 'content',
          title: 'Prioritize Visual Content',
          description: 'Fashion/beauty campaigns perform 40% better with high-quality visual content on Instagram and TikTok.',
          impact: 'high',
          actionText: 'View Guidelines'
        });

        // Seasonal recommendations for fashion/beauty
        const currentMonth = new Date().getMonth();
        if (currentMonth >= 2 && currentMonth <= 4) { // Spring season
          recs.push({
            id: 'spring-trends',
            type: 'opportunity',
            category: 'content',
            title: 'Spring Fashion Trends',
            description: 'Spring campaigns should focus on fresh looks, sustainable fashion, and outdoor content themes.',
            impact: 'medium',
            actionText: 'Get Trend Report'
          });
        }
      }

      if (industry.includes('tech') || industry.includes('software')) {
        recs.push({
          id: 'educational-content',
          type: 'opportunity',
          category: 'content',
          title: 'Educational Content Strategy',
          description: 'Tech brands see 60% higher engagement with educational/tutorial content from influencers.',
          impact: 'medium',
          actionText: 'Explore Strategy'
        });

        recs.push({
          id: 'demo-focused',
          type: 'insight',
          category: 'content',
          title: 'Product Demo Focus',
          description: 'Tech product demos by influencers drive 3x more conversions than traditional ads.',
          impact: 'high',
          actionText: 'Plan Demo Content'
        });
      }

      if (industry.includes('food') || industry.includes('restaurant')) {
        recs.push({
          id: 'food-visuals',
          type: 'insight',
          category: 'content',
          title: 'Food Photography Excellence',
          description: 'Food brands need high-quality photography and video content. Consider providing photography guidelines.',
          impact: 'high',
          actionText: 'Create Guidelines'
        });
      }

      if (industry.includes('fitness') || industry.includes('health')) {
        recs.push({
          id: 'transformation-content',
          type: 'opportunity',
          category: 'content',
          title: 'Transformation Stories',
          description: 'Fitness brands see highest engagement with before/after content and workout routines.',
          impact: 'high',
          actionText: 'Plan Transformation Series'
        });
      }
    }

    // Timing Optimization
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 9 || currentMonth <= 1) { // Oct-Jan (Holiday season)
      recs.push({
        id: 'holiday-boost',
        type: 'opportunity',
        category: 'timing',
        title: 'Holiday Season Opportunity',
        description: 'Campaigns launched during holiday season see 25% higher engagement. Consider increasing budget allocation.',
        impact: 'high',
        actionText: 'Plan Holiday Campaign'
      });
    }

    // Advanced Page-specific recommendations
    if (currentPage === 'campaigns' && currentCampaign) {
      const daysSinceStart = Math.floor((Date.now() - new Date(currentCampaign.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const proposalCount = currentCampaign.proposalCount || 0;
      
      if (daysSinceStart > 7 && proposalCount < 3) {
        recs.push({
          id: 'campaign-boost',
          type: 'critical',
          category: 'targeting',
          title: 'Campaign Needs Immediate Attention',
          description: 'This campaign has been live for a week with low proposal activity. Consider expanding targeting criteria or increasing budget.',
          impact: 'high',
          actionText: 'Optimize Now'
        });
      }

      // Budget utilization analysis
      if (currentCampaign.budget && proposalCount > 0) {
        const budgetPerProposal = currentCampaign.budget / Math.max(proposalCount, 1);
        if (budgetPerProposal > 50000) {
          recs.push({
            id: 'budget-oversized',
            type: 'optimization',
            category: 'budget',
            title: 'Budget May Be Too High',
            description: `With ${proposalCount} proposals, your budget per influencer is very high. Consider splitting into multiple campaigns.`,
            impact: 'medium',
            actionText: 'Review Budget'
          });
        }
      }

      // Platform-specific recommendations
      if ((currentCampaign as any).platforms && (currentCampaign as any).platforms.length === 1) {
        recs.push({
          id: 'multi-platform',
          type: 'opportunity',
          category: 'targeting',
          title: 'Consider Multi-Platform Strategy',
          description: 'Single-platform campaigns limit your reach. Consider expanding to complementary platforms.',
          impact: 'medium',
          actionText: 'Explore Platforms'
        });
      }

      // Campaign status-specific recommendations
      if (currentCampaign.status === 'draft') {
        recs.push({
          id: 'draft-launch-ready',
          type: 'opportunity',
          category: 'timing',
          title: 'Ready to Launch?',
          description: 'This campaign is in draft mode. Review all details and launch when ready to start receiving proposals.',
          impact: 'high',
          actionText: 'Review & Launch'
        });
      }

      if (currentCampaign.status === 'active' && proposalCount > 10) {
        recs.push({
          id: 'high-interest',
          type: 'insight',
          category: 'performance',
          title: 'High Influencer Interest',
          description: `${proposalCount} proposals received! This campaign is performing well. Consider similar campaigns in the future.`,
          impact: 'medium',
          actionText: 'Analyze Success Factors'
        });
      }
    }

    // Dynamic context-aware recommendations
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 11 && currentPage === 'campaigns') {
      recs.push({
        id: 'morning-optimization',
        type: 'insight',
        category: 'timing',
        title: 'Peak Planning Hours',
        description: 'Morning hours (9-11 AM) are ideal for campaign planning and strategy optimization.',
        impact: 'low',
        actionText: 'Plan Campaign'
      });
    }

    // Advanced Influencer Selection & Targeting Tips
    if (currentPage === 'campaigns') {
      recs.push({
        id: 'targeted-invites',
        type: 'opportunity',
        category: 'influencers',
        title: 'Use Targeted Invitations',
        description: 'Campaigns with targeted influencer invitations have 3x higher acceptance rates than public campaigns.',
        impact: 'high',
        actionText: 'Try Targeted Campaigns'
      });

      // Advanced targeting recommendations
      if (campaigns.length > 2) {
        const avgEngagement = campaigns.reduce((sum, c) => sum + (parseFloat((c as any).engagement || '0') || 0), 0) / campaigns.length;
        
        if (avgEngagement < 3) {
          recs.push({
            id: 'engagement-focus',
            type: 'critical',
            category: 'targeting',
            title: 'Focus on Engagement Over Followers',
            description: 'Your campaigns show low engagement rates. Prioritize micro-influencers with higher engagement over follower count.',
            impact: 'high',
            actionText: 'Adjust Strategy'
          });
        }
      }

      // Diversification recommendations
      const uniqueCategories = new Set();
      campaigns.forEach(c => {
        if ((c as any).category) uniqueCategories.add((c as any).category.toLowerCase());
      });

      if (uniqueCategories.size < 2 && campaigns.length > 3) {
        recs.push({
          id: 'diversify-campaigns',
          type: 'opportunity',
          category: 'targeting',
          title: 'Diversify Campaign Categories',
          description: 'All campaigns target similar categories. Consider diversifying to reach new audiences.',
          impact: 'medium',
          actionText: 'Explore New Categories'
        });
      }
    }

    // ROI and Performance Optimization
    if (campaigns.length > 0) {
      const totalSpent = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
      const completedCampaigns = campaigns.filter(c => c.status === 'completed');
      
      if (completedCampaigns.length > 2 && totalSpent > 100000) {
        recs.push({
          id: 'performance-tracking',
          type: 'insight',
          category: 'performance',
          title: 'Implement Advanced Tracking',
          description: 'With significant campaign investment, consider implementing detailed ROI tracking and attribution models.',
          impact: 'high',
          actionText: 'Set Up Tracking'
        });
      }

      // Frequency and timing optimization
      const activeCampaigns = campaigns.filter(c => c.status === 'active');
      if (activeCampaigns.length === 0 && campaigns.length > 0) {
        const lastCampaignDate = Math.max(...campaigns.map(c => new Date(c.endDate || c.startDate).getTime()));
        const daysSinceLastCampaign = Math.floor((Date.now() - lastCampaignDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastCampaign > 30) {
          recs.push({
            id: 'campaign-frequency',
            type: 'opportunity',
            category: 'timing',
            title: 'Maintain Campaign Momentum',
            description: 'It\'s been over a month since your last campaign. Regular campaigns help maintain brand visibility.',
            impact: 'medium',
            actionText: 'Plan New Campaign'
          });
        }
      }
    }

    // Filter out dismissed recommendations
    return recs.filter(rec => !dismissedRecommendations.includes(rec.id));
  }, [campaigns, brandProfile, currentPage, currentCampaign, dismissedRecommendations]);

  const getTypeIcon = (type: RecommendationItem['type']) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'opportunity': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'optimization': return <BarChart3 className="w-4 h-4 text-blue-500" />;
      case 'insight': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      default: return <Star className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: RecommendationItem['category']) => {
    switch (category) {
      case 'performance': return <BarChart3 className="w-4 h-4" />;
      case 'budget': return <DollarSign className="w-4 h-4" />;
      case 'targeting': return <Target className="w-4 h-4" />;
      case 'content': return <Star className="w-4 h-4" />;
      case 'timing': return <Calendar className="w-4 h-4" />;
      case 'influencers': return <Users className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getImpactColor = (impact: RecommendationItem['impact']) => {
    switch (impact) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const dismissRecommendation = (id: string) => {
    setDismissedRecommendations(prev => [...prev, id]);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed right-0 top-0 h-full bg-white border-l border-gray-200 shadow-xl transition-all duration-300 z-40 ${
      isMinimized ? 'w-12' : 'w-80'
    }`}>
      {isMinimized ? (
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(false)}
            className="w-full justify-center"
            data-testid="expand-recommendations"
          >
            <Lightbulb className="w-5 h-5 text-teal-600" />
          </Button>
          <div className="mt-2 text-center">
            <Badge variant="outline" className="rotate-90 text-xs">
              {recommendations.length}
            </Badge>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-gray-900">Smart Recommendations</h3>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  data-testid="minimize-recommendations"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                {onClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    data-testid="close-recommendations"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Personalized tips to optimize your campaigns
            </p>
          </div>

          {/* Content */}
          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-4 space-y-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    All systems optimized!<br />
                    No recommendations at this time.
                  </p>
                </div>
              ) : (
                recommendations.map((rec) => (
                  <Card key={rec.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          {getTypeIcon(rec.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-sm font-medium">
                                {rec.title}
                              </CardTitle>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getImpactColor(rec.impact)}`}
                              >
                                {rec.impact} impact
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              {getCategoryIcon(rec.category)}
                              <span className="capitalize">{rec.category}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissRecommendation(rec.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                          data-testid={`dismiss-${rec.id}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-3">
                        {rec.description}
                      </p>
                      {rec.actionText && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full justify-between text-xs"
                          onClick={rec.onAction}
                          data-testid={`action-${rec.id}`}
                        >
                          {rec.actionText}
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Performance Summary */}
              {campaigns.length > 0 && (
                <>
                  <Separator />
                  <Card className="bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-teal-600" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Active Campaigns</span>
                          <span className="font-medium">
                            {campaigns.filter(c => c.status === 'active').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Proposals</span>
                          <span className="font-medium">
                            {campaigns.reduce((sum, c) => sum + (c.proposalCount || 0), 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg. per Campaign</span>
                          <span className="font-medium">
                            {campaigns.length > 0 
                              ? Math.round(campaigns.reduce((sum, c) => sum + (c.proposalCount || 0), 0) / campaigns.length)
                              : 0
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}