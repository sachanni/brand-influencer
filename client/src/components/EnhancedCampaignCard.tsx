import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  MessageCircle, 
  Calendar,
  TrendingUp,
  Play,
  CheckCircle,
  FileText,
  Upload
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { CampaignProgressTimeline } from './CampaignProgressTimeline';
import { MilestoneManager } from './MilestoneManager';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  title: string;
  description: string;
  brandName?: string;
  currency: string;
  exactEndDate?: string;
  status: string;
  paymentStatus?: string;
}

interface EnhancedCampaignData {
  id: string;
  status: string;
  proposedCompensation: string;
  paymentStatus?: string;
  campaign?: Campaign;
  progress?: {
    contentCreationProgress?: number;
    submissionProgress?: number;
    reviewProgress?: number;
    approvalProgress?: number;
    paymentProgress?: number;
    overallProgress?: number;
    currentStage?: string;
  };
  milestones?: Array<{
    id: string;
    title: string;
    status: string;
    isUrgent?: boolean;
  }>;
  urgentMilestones: number;
  totalTimeSpent: number;
  isUrgent: boolean;
  brandPriority?: string;
  urgencyReason?: string;
  daysUntilDeadline?: number;
}

interface EnhancedCampaignCardProps {
  campaignData: EnhancedCampaignData;
  onChatClick?: (campaignId: string) => void;
  onCreateContent?: (campaign: EnhancedCampaignData) => void;
  onViewBrief?: (campaign: EnhancedCampaignData) => void;
  className?: string;
}

export function EnhancedCampaignCard({ 
  campaignData, 
  onChatClick,
  onCreateContent,
  onViewBrief,
  className 
}: EnhancedCampaignCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'timeline'>('overview');

  // Fetch progress data
  const { data: progressData } = useQuery({
    queryKey: ['/api/proposals', campaignData.id, 'progress'],
    enabled: isExpanded
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'deliverables_submitted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getUrgencyLevel = () => {
    if (campaignData.urgentMilestones > 2) return { level: 'critical', color: 'text-red-600' };
    if (campaignData.urgentMilestones > 0) return { level: 'high', color: 'text-orange-600' };
    if (campaignData.daysUntilDeadline && campaignData.daysUntilDeadline < 3) return { level: 'medium', color: 'text-yellow-600' };
    return { level: 'low', color: 'text-green-600' };
  };

  const urgencyLevel = getUrgencyLevel();
  const overallProgress = campaignData.progress?.overallProgress || (progressData as any)?.overallProgress || 0;
  const currentStage = campaignData.progress?.currentStage || (progressData as any)?.progressStage?.currentStage || 'content_creation';

  const formatTimeSpent = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const calculateHourlyRate = () => {
    if (campaignData.totalTimeSpent === 0) return 0;
    const compensation = parseFloat(campaignData.proposedCompensation || '0');
    const hours = campaignData.totalTimeSpent / 3600;
    return compensation / hours;
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg",
      campaignData.isUrgent && "border-red-200 shadow-red-100",
      campaignData.status === 'completed' && "border-green-200 shadow-green-100",
      className
    )} data-testid={`campaign-card-${campaignData.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg line-clamp-1">
                {campaignData.campaign?.title || 'Campaign'}
              </CardTitle>
              {campaignData.isUrgent && (
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium">{campaignData.campaign?.brandName || 'Brand'}</span>
              <span>•</span>
              <Badge className={getStatusColor(campaignData.status)}>
                {campaignData.status.replace('_', ' ').toUpperCase()}
              </Badge>
              
              {/* Work Status Indicator */}
              {campaignData.paymentStatus === 'work_in_progress' && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 animate-pulse">
                  ⚡ WORK STARTED
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-semibold">
                  {formatCurrency(parseFloat(campaignData.proposedCompensation || '0'), campaignData.campaign?.currency as any || 'INR')}
                </span>
              </div>
              
              {campaignData.daysUntilDeadline && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className={cn(
                    campaignData.daysUntilDeadline < 2 && "text-red-600 font-semibold"
                  )}>
                    {campaignData.daysUntilDeadline > 0 
                      ? `${campaignData.daysUntilDeadline} days left`
                      : 'Overdue'
                    }
                  </span>
                </div>
              )}

              {campaignData.totalTimeSpent > 0 && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>{formatTimeSpent(campaignData.totalTimeSpent)}</span>
                </div>
              )}

              {/* Payment Status Indicator */}
              {campaignData.paymentStatus === 'work_in_progress' && (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-medium">
                    {formatCurrency(parseFloat(campaignData.proposedCompensation || '0') * 0.5, campaignData.campaign?.currency as any || 'INR')} received
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Work Status Actions - Show when payment received */}
            {campaignData.paymentStatus === 'work_in_progress' && (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => onCreateContent?.(campaignData)}
                  data-testid={`create-content-${campaignData.id}`}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Create Content
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-600 text-blue-700 hover:bg-blue-50"
                  onClick={() => onViewBrief?.(campaignData)}
                  data-testid={`view-brief-${campaignData.id}`}
                >
                  View Brief
                </Button>
              </div>
            )}

            {/* Chat Button */}
            {onChatClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChatClick(campaignData.campaign?.id || campaignData.id)}
                data-testid="button-chat"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            )}
            
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-expand">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <div className={cn("text-lg font-semibold", urgencyLevel.color)}>
              {campaignData.urgentMilestones}
            </div>
            <div className="text-xs text-gray-500">Urgent Tasks</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {campaignData.milestones?.filter(m => m.status === 'completed').length || 0}
              /
              {campaignData.milestones?.length || 0}
            </div>
            <div className="text-xs text-gray-500">Milestones</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(calculateHourlyRate(), campaignData.campaign?.currency as any || 'INR')}
            </div>
            <div className="text-xs text-gray-500">Per Hour</div>
          </div>
        </div>
      </CardHeader>

      {/* Expanded Content */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                { id: 'timeline', label: 'Timeline', icon: TrendingUp },
                { id: 'milestones', label: 'Milestones', icon: CheckCircle }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    )}
                    data-testid={`tab-${tab.id}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Campaign Description</h4>
                  <p className="text-sm text-gray-600">
                    {campaignData.campaign?.description || 'No description available.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700">Payment Status</h5>
                    <Badge className={getStatusColor(campaignData.paymentStatus || 'pending')}>
                      {campaignData.paymentStatus?.replace('_', ' ') || 'Pending'}
                    </Badge>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-700">Deadline</h5>
                    <p className="text-sm">
                      {campaignData.campaign?.exactEndDate 
                        ? new Date(campaignData.campaign.exactEndDate).toLocaleDateString()
                        : 'No deadline set'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <CampaignProgressTimeline
                proposalId={campaignData.id}
                currentStage={currentStage}
                progressData={campaignData.progress || (progressData as any)?.progressStage}
              />
            )}

            {activeTab === 'milestones' && (
              <MilestoneManager
                proposalId={campaignData.id}
                proposalData={{
                  proposedCompensation: campaignData.proposedCompensation,
                  campaign: campaignData.campaign
                }}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}