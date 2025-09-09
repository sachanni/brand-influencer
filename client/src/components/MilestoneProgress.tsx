import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Eye, Heart, Video, Star, TrendingUp } from 'lucide-react';
import { formatMilestoneThreshold, getMilestoneTypeLabel, getMilestoneProgress } from '@/hooks/useMilestones';

interface Milestone {
  id: string;
  milestoneType: 'followers' | 'engagement' | 'views' | 'content' | 'collaborations';
  threshold: number;
  platform?: string;
  achievedAt: string;
  isViewed: boolean;
  isCelebrated: boolean;
  celebrationShown: boolean;
}

interface MilestoneProgressProps {
  milestones: Milestone[];
  currentStats: {
    totalFollowers: number;
    totalViews: number;
    totalEngagement: number;
    totalContent: number;
    totalCollaborations: number;
  };
}

const getMilestoneIcon = (type: string) => {
  switch (type) {
    case 'followers':
      return Users;
    case 'views':
      return Eye;
    case 'engagement':
      return Heart;
    case 'content':
      return Video;
    case 'collaborations':
      return Star;
    default:
      return Trophy;
  }
};

const getMilestoneColor = (type: string) => {
  switch (type) {
    case 'followers':
      return 'text-blue-500';
    case 'views':
      return 'text-green-500';
    case 'engagement':
      return 'text-red-500';
    case 'content':
      return 'text-purple-500';
    case 'collaborations':
      return 'text-yellow-500';
    default:
      return 'text-brand-teal';
  }
};

const getNextMilestone = (milestones: Milestone[], type: string, current: number): number | null => {
  const typeMilestones = milestones
    .filter(m => m.milestoneType === type)
    .map(m => m.threshold)
    .sort((a, b) => a - b);
  
  // Define next possible thresholds if none achieved yet
  const defaultThresholds = {
    followers: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
    views: [1000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000],
    engagement: [100, 500, 1000, 5000, 10000, 50000, 100000],
    content: [10, 25, 50, 100, 200, 500],
    collaborations: [1, 5, 10, 25, 50, 100]
  };
  
  const allThresholds = [...typeMilestones, ...(defaultThresholds[type as keyof typeof defaultThresholds] || [])]
    .sort((a, b) => a - b);
  
  return allThresholds.find(threshold => threshold > current) || null;
};

export function MilestoneProgress({ milestones, currentStats }: MilestoneProgressProps) {
  const progressItems = [
    {
      type: 'followers',
      current: currentStats.totalFollowers,
      label: 'Total Followers',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      type: 'views',
      current: currentStats.totalViews,
      label: 'Total Views',
      icon: Eye,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      type: 'engagement',
      current: currentStats.totalEngagement,
      label: 'Total Engagement',
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    {
      type: 'content',
      current: currentStats.totalContent,
      label: 'Content Created',
      icon: Video,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand-teal" />
          Milestone Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {progressItems.map((item) => {
          const nextMilestone = getNextMilestone(milestones, item.type, item.current);
          const achievedMilestones = milestones
            .filter(m => m.milestoneType === item.type && m.threshold <= item.current)
            .sort((a, b) => b.threshold - a.threshold);
          
          const latestAchieved = achievedMilestones[0];
          const progress = nextMilestone ? getMilestoneProgress(item.current, nextMilestone) : 100;
          
          const Icon = item.icon;

          return (
            <div key={item.type} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${item.bgColor} rounded-lg`}>
                    <Icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-gray-600">
                      Current: {item.current.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  {latestAchieved && (
                    <Badge variant="outline" className="mb-1 text-brand-teal border-brand-teal">
                      <Trophy className="h-3 w-3 mr-1" />
                      {formatMilestoneThreshold(latestAchieved.threshold, item.type)}
                    </Badge>
                  )}
                  {nextMilestone && (
                    <p className="text-sm text-gray-600">
                      Next: {formatMilestoneThreshold(nextMilestone, item.type)}
                    </p>
                  )}
                </div>
              </div>
              
              {nextMilestone && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-gray-500 text-right">
                    {Math.round(progress)}% to next milestone
                  </p>
                </div>
              )}
              
              {!nextMilestone && latestAchieved && (
                <div className="text-center py-2">
                  <Badge className="bg-brand-teal text-white">
                    <Trophy className="h-3 w-3 mr-1" />
                    All milestones achieved!
                  </Badge>
                </div>
              )}
              
              {!nextMilestone && !latestAchieved && (
                <div className="text-center py-2 text-gray-500 text-sm">
                  Start creating content to unlock milestones!
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}