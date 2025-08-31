import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Eye, Heart, Video, Star, Sparkles, Target, TrendingUp, Award } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';

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

interface MilestoneCelebrationProps {
  milestone: Milestone | null;
  isOpen: boolean;
  onClose: () => void;
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

const getMilestoneBgColor = (type: string) => {
  switch (type) {
    case 'followers':
      return 'bg-blue-50';
    case 'views':
      return 'bg-green-50';
    case 'engagement':
      return 'bg-red-50';
    case 'content':
      return 'bg-purple-50';
    case 'collaborations':
      return 'bg-yellow-50';
    default:
      return 'bg-teal-50';
  }
};

const formatThreshold = (threshold: number, type: string): string => {
  if (type === 'engagement' || type === 'views') {
    if (threshold >= 1000000) return `${(threshold / 1000000).toFixed(1)}M`;
    if (threshold >= 1000) return `${(threshold / 1000).toFixed(0)}K`;
  }
  return threshold.toLocaleString();
};

const getMilestoneTitle = (milestone: Milestone): string => {
  const formatted = formatThreshold(milestone.threshold, milestone.milestoneType);
  const platform = milestone.platform ? ` on ${milestone.platform}` : '';
  
  switch (milestone.milestoneType) {
    case 'followers':
      return `${formatted} Followers Reached${platform}!`;
    case 'views':
      return `${formatted} Total Views Milestone!`;
    case 'engagement':
      return `${formatted} Total Engagement Milestone!`;
    case 'content':
      return `${formatted} Content Pieces Created!`;
    case 'collaborations':
      return `${formatted} Brand Collaborations!`;
    default:
      return `${formatted} Milestone Achieved!`;
  }
};

const getMilestoneDescription = (milestone: Milestone): string => {
  switch (milestone.milestoneType) {
    case 'followers':
      return `Congratulations! You've reached ${formatThreshold(milestone.threshold, milestone.milestoneType)} followers${milestone.platform ? ` on ${milestone.platform}` : ''}. Your authentic content is resonating with your growing audience!`;
    case 'views':
      return `Amazing! Your content has been viewed ${formatThreshold(milestone.threshold, milestone.milestoneType)} times across all platforms. Your reach is expanding!`;
    case 'engagement':
      return `Fantastic! You've received ${formatThreshold(milestone.threshold, milestone.milestoneType)} total likes and comments. Your community is actively engaging with your content!`;
    case 'content':
      return `Impressive dedication! You've created ${formatThreshold(milestone.threshold, milestone.milestoneType)} pieces of content. Consistency is key to success!`;
    case 'collaborations':
      return `Professional milestone achieved! You've completed ${formatThreshold(milestone.threshold, milestone.milestoneType)} brand collaborations. Your influence is growing!`;
    default:
      return 'Congratulations on reaching this milestone! Keep up the great work!';
  }
};

export function MilestoneCelebration({ milestone, isOpen, onClose }: MilestoneCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const queryClient = useQueryClient();

  const celebrateMilestone = useMutation({
    mutationFn: async (milestoneId: string) => {
      return await apiRequest(`/api/milestones/${milestoneId}/celebrate`, 'PATCH');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/milestones'] });
      onClose();
    }
  });

  useEffect(() => {
    if (isOpen && milestone) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, milestone]);

  if (!milestone) return null;

  const Icon = getMilestoneIcon(milestone.milestoneType);
  const iconColor = getMilestoneColor(milestone.milestoneType);
  const bgColor = getMilestoneBgColor(milestone.milestoneType);

  const handleCelebrate = () => {
    celebrateMilestone.mutate(milestone.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden relative">
        {/* Confetti Animation */}
        <AnimatePresence>
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                  initial={{
                    x: `${Math.random() * 100}%`,
                    y: -20,
                    opacity: 1,
                    scale: 1,
                  }}
                  animate={{
                    y: 400,
                    x: `${Math.random() * 100}%`,
                    opacity: 0,
                    scale: 0,
                    rotate: 360,
                  }}
                  transition={{
                    duration: 3,
                    delay: Math.random() * 1.5,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Header with animated icon */}
        <DialogHeader className="text-center relative">
          <motion.div
            className={`mx-auto w-20 h-20 ${bgColor} rounded-full flex items-center justify-center mb-4`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Icon className={`h-10 w-10 ${iconColor}`} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-yellow-500" />
                Milestone Achieved!
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </div>
            </DialogTitle>
            
            <DialogDescription className="text-lg font-semibold text-brand-teal mb-2">
              {getMilestoneTitle(milestone)}
            </DialogDescription>
            
            <DialogDescription className="text-gray-600 max-w-md mx-auto leading-relaxed">
              {getMilestoneDescription(milestone)}
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        {/* Milestone Details */}
        <motion.div
          className="mt-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${bgColor} rounded-lg`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="font-medium capitalize">{milestone.milestoneType} Milestone</p>
                  <p className="text-sm text-gray-600">
                    Achieved on {new Date(milestone.achievedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {formatThreshold(milestone.threshold, milestone.milestoneType)}
                </p>
                {milestone.platform && (
                  <Badge variant="outline" className="mt-1 capitalize">
                    {milestone.platform}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Achievement Badge */}
          <div className="bg-gradient-to-r from-brand-teal to-teal-600 text-white rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="h-5 w-5" />
              <span className="font-semibold">Achievement Unlocked</span>
            </div>
            <p className="text-sm opacity-90">
              You're building an amazing presence! Keep creating authentic content that resonates with your audience.
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="mt-8 flex gap-3 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Button
            onClick={handleCelebrate}
            className="bg-brand-teal hover:bg-brand-teal/90 text-white px-8"
            disabled={celebrateMilestone.isPending}
          >
            {celebrateMilestone.isPending ? 'Celebrating...' : 'Celebrate! 🎉'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            View Later
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}