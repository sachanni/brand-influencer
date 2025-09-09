import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  Calendar,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  FileText,
  Send,
  MessageCircle,
  Star,
  Package,
  Rocket,
  Flag,
  Trophy,
  Activity,
  BarChart3,
  Loader2
} from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  type: 'campaign' | 'content' | 'payment' | 'review' | 'communication';
  icon?: any;
  participants?: string[];
  metrics?: {
    label: string;
    value: string | number;
  }[];
}

interface TimelineActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
  metadata?: any;
}

interface CampaignTimelineWithMilestonesProps {
  campaignId: string;
}

export function CampaignTimelineWithMilestones({ campaignId }: CampaignTimelineWithMilestonesProps) {
  const [activeView, setActiveView] = useState<'milestones' | 'activity'>('milestones');

  // Fetch campaign data
  const { data: campaign } = useQuery({
    queryKey: [`/api/brand/campaigns/${campaignId}`],
    queryFn: async () => {
      const response = await fetch(`/api/brand/campaigns/${campaignId}`);
      if (!response.ok) throw new Error('Failed to fetch campaign');
      return response.json();
    },
    enabled: !!campaignId
  });

  // Fetch milestones
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: [`/api/brand/campaigns/${campaignId}/milestones`],
    queryFn: async () => {
      const response = await fetch(`/api/brand/campaigns/${campaignId}/milestones`);
      if (!response.ok) throw new Error('Failed to fetch milestones');
      return response.json();
    },
    enabled: !!campaignId
  });

  // Fetch activity
  const { data: activities = [] } = useQuery({
    queryKey: [`/api/brand/campaigns/${campaignId}/activity`],
    queryFn: async () => {
      const response = await fetch(`/api/brand/campaigns/${campaignId}/activity`);
      if (!response.ok) throw new Error('Failed to fetch activity');
      const data = await response.json();
      // Map the activity data to expected format
      return data.map((activity: any) => ({
        id: activity.id,
        type: activity.activityType,
        title: activity.activityType === 'proposal_submitted' ? 'Proposal Submitted' :
               activity.activityType === 'proposal_approved' ? 'Proposal Approved' :
               activity.activityType === 'proposal_rejected' ? 'Proposal Rejected' :
               activity.activityType === 'milestone_completed' ? 'Milestone Completed' :
               activity.activityType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        description: activity.activityDescription,
        timestamp: activity.createdAt || new Date().toISOString(),
        metadata: activity.metadata,
        user: activity.userId ? {
          name: activity.metadata?.influencerName || 'User',
          role: activity.activityType.includes('proposal') ? 'Influencer' : 'System'
        } : undefined
      }));
    },
    enabled: !!campaignId
  });

  // Generate default milestones if none exist
  const getDefaultMilestones = (): Milestone[] => {
    if (!campaign) return [];
    
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);
    const midDate = new Date((startDate.getTime() + endDate.getTime()) / 2);
    const today = new Date();

    return [
      {
        id: '1',
        title: 'Campaign Launch',
        description: 'Campaign officially launched and open for proposals',
        date: startDate.toISOString(),
        status: today >= startDate ? 'completed' : 'upcoming',
        type: 'campaign',
        icon: Rocket,
        metrics: [
          { label: 'Budget', value: `₹${campaign.budget?.toLocaleString() || '0'}` },
          { label: 'Duration', value: `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days` }
        ]
      },
      {
        id: '2',
        title: 'Influencer Selection',
        description: 'Review proposals and select influencers for collaboration',
        date: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: campaign.proposals?.some((p: any) => p.status === 'approved') ? 'completed' : 
                today >= new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000) ? 'in-progress' : 'upcoming',
        type: 'campaign',
        icon: Users,
        metrics: campaign.proposals ? [
          { label: 'Proposals', value: campaign.proposals.length },
          { label: 'Approved', value: campaign.proposals.filter((p: any) => p.status === 'approved').length }
        ] : []
      },
      {
        id: '3',
        title: 'Content Creation',
        description: 'Influencers create and submit content for review',
        date: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: today >= new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000) ? 'in-progress' : 'upcoming',
        type: 'content',
        icon: FileText,
        metrics: [
          { label: 'Expected Content', value: campaign.deliverables?.length || 0 },
          { label: 'Submitted', value: 0 }
        ]
      },
      {
        id: '4',
        title: 'Content Review & Approval',
        description: 'Review submitted content and provide feedback',
        date: midDate.toISOString(),
        status: today >= midDate ? 'in-progress' : 'upcoming',
        type: 'review',
        icon: CheckCircle2,
        metrics: [
          { label: 'Under Review', value: 0 },
          { label: 'Approved', value: 0 }
        ]
      },
      {
        id: '5',
        title: 'Content Publishing',
        description: 'Approved content goes live on social media platforms',
        date: new Date(endDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'upcoming',
        type: 'content',
        icon: Send,
        metrics: [
          { label: 'Published', value: 0 },
          { label: 'Platforms', value: campaign.platforms?.join(', ') || 'N/A' }
        ]
      },
      {
        id: '6',
        title: 'Performance Review',
        description: 'Analyze campaign performance and metrics',
        date: new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'upcoming',
        type: 'review',
        icon: BarChart3,
        metrics: [
          { label: 'Reach', value: '0' },
          { label: 'Engagement', value: '0%' }
        ]
      },
      {
        id: '7',
        title: 'Payment Processing',
        description: 'Process payments to influencers',
        date: endDate.toISOString(),
        status: 'upcoming',
        type: 'payment',
        icon: DollarSign,
        metrics: [
          { label: 'Total Payout', value: '₹0' },
          { label: 'Influencers', value: 0 }
        ]
      },
      {
        id: '8',
        title: 'Campaign Completion',
        description: 'Campaign successfully completed',
        date: endDate.toISOString(),
        status: 'upcoming',
        type: 'campaign',
        icon: Trophy,
        metrics: [
          { label: 'Duration', value: `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days` },
          { label: 'Status', value: 'Active' }
        ]
      }
    ];
  };

  // Map the API milestones to the expected format
  const formattedMilestones = milestones.map((m: any) => ({
    id: m.id,
    title: m.milestoneType === 'launched' ? 'Campaign launched and live for influencers' :
           m.milestoneType === 'first_application' ? 'First influencer application received' :
           m.milestoneType === 'all_approved' ? 'All influencers approved and notified' :
           m.milestoneType === 'content_submitted' ? 'All content submitted by influencers' :
           m.milestoneType === 'payment_processed' ? 'All payments processed successfully' :
           m.milestoneType === 'completed' ? 'Campaign completed successfully' : m.description,
    description: m.description,
    // Use completedDate for completed milestones, targetDate otherwise
    date: m.status === 'completed' && m.completedDate ? m.completedDate : 
          m.targetDate || m.createdAt || new Date().toISOString(),
    status: m.status || 'pending',
    type: m.milestoneType === 'launched' || m.milestoneType === 'completed' ? 'campaign' :
          m.milestoneType === 'payment_processed' ? 'payment' :
          m.milestoneType === 'content_submitted' ? 'content' : 'review'
  }));

  const displayMilestones = milestones.length > 0 ? formattedMilestones : getDefaultMilestones();

  const getMilestoneIcon = (milestone: Milestone) => {
    const IconComponent = milestone.icon || Circle;
    return <IconComponent className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-gradient-to-br from-emerald-100 to-green-100';
      case 'in-progress': return 'text-blue-600 bg-gradient-to-br from-blue-100 to-cyan-100 animate-pulse';
      case 'upcoming': return 'text-gray-500 bg-gradient-to-br from-gray-100 to-gray-200';
      default: return 'text-gray-400 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'campaign': return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border-purple-300 shadow-sm';
      case 'content': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-300 shadow-sm';
      case 'payment': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-300 shadow-sm';
      case 'review': return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border-orange-300 shadow-sm';
      case 'communication': return 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-700 border-pink-300 shadow-sm';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const calculateProgress = () => {
    const completed = displayMilestones.filter((m: Milestone) => m.status === 'completed').length;
    return (completed / displayMilestones.length) * 100;
  };

  if (milestonesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mr-2 text-purple-600" />
        <span>Loading timeline...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2 p-1 bg-gradient-to-r from-purple-100/80 to-blue-100/80 rounded-lg border-2 border-purple-300">
        <Button
          variant={activeView === 'milestones' ? 'default' : 'ghost'}
          onClick={() => setActiveView('milestones')}
          className={activeView === 'milestones' ? 
            'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all hover:from-purple-700 hover:to-blue-700 border-2 border-purple-500' : 
            'hover:bg-white/80 text-purple-600 hover:text-purple-800 border-2 border-transparent hover:border-purple-300'}
        >
          <Flag className="w-4 h-4 mr-2" />
          Milestones
        </Button>
        <Button
          variant={activeView === 'activity' ? 'default' : 'ghost'}
          onClick={() => setActiveView('activity')}
          className={activeView === 'activity' ? 
            'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all hover:from-purple-700 hover:to-blue-700 border-2 border-purple-500' : 
            'hover:bg-white/80 text-purple-600 hover:text-purple-800 border-2 border-transparent hover:border-purple-300'}
        >
          <Activity className="w-4 h-4 mr-2" />
          Recent Activity
        </Button>
      </div>

      {/* Content */}
      {activeView === 'milestones' ? (
        <Card className="shadow-xl border-2 border-purple-400 bg-gradient-to-br from-purple-50/80 to-blue-50/80">
          <CardHeader className="bg-gradient-to-r from-purple-100/80 to-blue-100/80 border-b-2 border-purple-300 py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                <Flag className="w-4 h-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent font-bold">
                Campaign Milestones
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ScrollArea className="h-[350px] pr-2">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 via-blue-200 to-purple-100 rounded-full"></div>
                
                {/* Milestones */}
                <div className="space-y-2">
                  {displayMilestones.map((milestone: Milestone, index: number) => (
                    <div key={milestone.id} className="relative flex items-start group">
                      {/* Icon */}
                      <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 group-hover:scale-105 border-2 ${
                        milestone.status === 'completed' ? 
                          'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-400 shadow-md shadow-green-200/50' :
                        milestone.status === 'in-progress' ? 
                          'bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-blue-400 shadow-md shadow-blue-200/50' :
                          'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-600 border-gray-300 shadow-md'
                      }`}>
                        {milestone.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 drop-shadow" />
                        ) : milestone.status === 'in-progress' ? (
                          <div className="w-3 h-3">{getMilestoneIcon(milestone)}</div>
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="ml-3 flex-1">
                        <Card className={`border-2 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${
                          milestone.status === 'in-progress' ? 
                            'border-blue-400 bg-gradient-to-br from-blue-100/80 to-cyan-100/80' : 
                          milestone.status === 'completed' ?
                            'border-green-400 bg-gradient-to-br from-green-100/80 to-emerald-100/80' :
                            'border-gray-300 bg-gradient-to-br from-gray-50/80 to-white hover:border-purple-300'
                        }`}>
                          <CardContent className="p-2">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex-1 mr-2">
                                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1 mb-1">
                                  {milestone.title}
                                  <Badge className={`text-xs font-semibold border px-1 py-0.5 ${
                                    milestone.type === 'campaign' ? 'bg-gradient-to-r from-purple-100/80 to-purple-200/80 text-purple-700 border-purple-400' :
                                    milestone.type === 'content' ? 'bg-gradient-to-r from-blue-100/80 to-blue-200/80 text-blue-700 border-blue-400' :
                                    milestone.type === 'payment' ? 'bg-gradient-to-r from-green-100/80 to-green-200/80 text-green-700 border-green-400' :
                                    milestone.type === 'review' ? 'bg-gradient-to-r from-orange-100/80 to-orange-200/80 text-orange-700 border-orange-400' :
                                    'bg-gradient-to-r from-gray-100/80 to-gray-200/80 text-gray-700 border-gray-400'
                                  }`}>
                                    {milestone.type}
                                  </Badge>
                                </h4>
                                <p className="text-xs text-gray-600 leading-tight">{milestone.description}</p>
                              </div>
                              <div className="text-right flex flex-col items-end gap-0.5">
                                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100/80 px-1.5 py-0.5 rounded border border-gray-200">
                                  <Calendar className="w-3 h-3" />
                                  <span className="font-medium">{new Date(milestone.date).toLocaleDateString()}</span>
                                </div>
                                <Badge className={`font-semibold px-1.5 py-0.5 text-xs border ${
                                  milestone.status === 'completed' ? 
                                    'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400' :
                                  milestone.status === 'in-progress' ? 
                                    'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400' :
                                    'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 border-gray-300'
                                }`}>
                                  {milestone.status === 'completed' ? '✓ Done' :
                                   milestone.status === 'in-progress' ? '⚡ Active' : 
                                   '○ Pending'}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Metrics */}
                            {milestone.metrics && milestone.metrics.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mt-1.5 pt-1.5 border-t border-gray-200">
                                {milestone.metrics.map((metric: {label: string; value: string | number}, idx: number) => (
                                  <div key={idx} className="text-center p-1 rounded bg-gradient-to-br from-white/80 to-gray-100/80 border border-gray-200 hover:border-purple-300 transition-all duration-200">
                                    <div className="text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{metric.value}</div>
                                    <div className="text-xs text-gray-600 font-medium">{metric.label}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-xl border-2 border-purple-400 bg-gradient-to-br from-purple-50/80 to-blue-50/80">
          <CardHeader className="bg-gradient-to-r from-purple-100/80 to-blue-100/80 border-b-2 border-purple-300 py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent font-bold">
                Recent Activity
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[400px]">
              {activities.length === 0 ? (
                <div className="text-center py-8 bg-gradient-to-br from-gray-50/80 to-white rounded-lg border-2 border-gray-200">
                  <div className="p-3 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full inline-block mb-3">
                    <Activity className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-600 font-medium text-sm">No activity yet</p>
                  <p className="text-xs text-gray-400 mt-1">Activities will appear here as the campaign progresses</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity: TimelineActivity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gradient-to-br from-white/80 to-gray-50/80 hover:from-purple-100/80 hover:to-blue-100/80 rounded-lg border-2 border-gray-200 hover:border-purple-300 shadow-md hover:shadow-lg transition-all duration-200">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-900">{activity.title}</h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{activity.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <Badge className="bg-gradient-to-r from-gray-100/80 to-gray-200/80 text-gray-600 border border-gray-300">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </Badge>
                          {activity.user && (
                            <span className="flex items-center gap-1 text-gray-500">
                              <Circle className="w-2 h-2" />
                              {activity.user.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}