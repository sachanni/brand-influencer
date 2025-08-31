import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, CheckCircle, Circle, User, Activity, Target, DollarSign, MessageSquare } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface CampaignTimelineProps {
  campaignId: string;
}

export function CampaignTimeline({ campaignId }: CampaignTimelineProps) {
  // Fetch campaign milestones
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery<any[]>({
    queryKey: ["/api/brand/campaigns", campaignId, "milestones"],
    queryFn: () => fetch(`/api/brand/campaigns/${campaignId}/milestones`).then(res => res.json()),
  });

  // Fetch campaign activity log
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<any[]>({
    queryKey: ["/api/brand/campaigns", campaignId, "activity"],
    queryFn: () => fetch(`/api/brand/campaigns/${campaignId}/activity?limit=20`).then(res => res.json()),
  });

  const getMilestoneIcon = (type: string, status: string) => {
    const iconProps = { className: "w-4 h-4" };
    
    if (status === 'completed') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (status === 'in_progress') {
      return <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />;
    } else {
      return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'status_change':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'proposal_received':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'content_approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'payment_made':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'message_sent':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse';
      case 'pending':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'skipped':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = milestones.length;
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  if (milestonesLoading || activitiesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Campaign Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Campaign Progress
            </div>
            <Badge variant="secondary">
              {completedMilestones}/{totalMilestones} Milestones
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  {getMilestoneIcon(milestone.milestoneType, milestone.status)}
                  {index < milestones.length - 1 && (
                    <div className="w-px h-8 bg-gray-200 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm capitalize">
                      {milestone.milestoneType.replace(/_/g, ' ')}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={`${getMilestoneStatusColor(milestone.status)} text-xs`}
                    >
                      {milestone.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                  {milestone.completedDate && (
                    <p className="text-xs text-gray-500">
                      Completed {formatDistanceToNow(new Date(milestone.completedDate), { addSuffix: true })}
                    </p>
                  )}
                  {milestone.expectedDate && !milestone.completedDate && (
                    <p className="text-xs text-gray-500">
                      Expected {format(new Date(milestone.expectedDate), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No activity recorded yet</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    {getActivityIcon(activity.activityType)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.activityDescription}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                      {activity.metadata && (
                        <div className="mt-2 text-xs text-gray-600">
                          {activity.previousState && activity.newState && (
                            <span>
                              Status: {activity.previousState.status} → {activity.newState.status}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}