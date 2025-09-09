import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useEffect, useState } from 'react';

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

interface MilestoneCheckResponse {
  success: boolean;
  newMilestones: Milestone[];
  uncelebratedMilestones: Milestone[];
}

export function useMilestones() {
  const [pendingCelebration, setPendingCelebration] = useState<Milestone | null>(null);
  const queryClient = useQueryClient();

  // Fetch all milestones for the user
  const milestonesQuery = useQuery({
    queryKey: ['/api/milestones'],
    queryFn: async () => {
      const response = await apiRequest('/api/milestones', 'GET');
      return await response.json() as { success: boolean; milestones: Milestone[] };
    },
  });

  // Check for new milestones
  const checkMilestonesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/milestones/check', 'POST');
      return await response.json() as MilestoneCheckResponse;
    },
    onSuccess: (data) => {
      // If there are uncelebrated milestones, show the first one
      if (data.uncelebratedMilestones.length > 0) {
        const nextMilestone = data.uncelebratedMilestones
          .sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())[0];
        setPendingCelebration(nextMilestone);
      }
      
      // Invalidate milestones query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/milestones'] });
    },
  });

  // Mark milestone celebration as shown
  const celebrateMilestone = useMutation({
    mutationFn: async (milestoneId: string) => {
      const response = await apiRequest(`/api/milestones/${milestoneId}/celebrate`, 'PATCH');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/milestones'] });
      setPendingCelebration(null);
    },
  });

  // Auto-check for milestones on mount and periodically
  useEffect(() => {
    const checkMilestones = () => {
      checkMilestonesMutation.mutate();
    };

    // Check immediately on mount
    checkMilestones();

    // Check every 30 seconds for new milestones
    const interval = setInterval(checkMilestones, 30000);

    return () => clearInterval(interval);
  }, []);

  const closeCelebration = () => {
    setPendingCelebration(null);
  };

  return {
    milestones: milestonesQuery.data?.milestones || [],
    isLoading: milestonesQuery.isLoading,
    error: milestonesQuery.error,
    pendingCelebration,
    closeCelebration,
    celebrateMilestone: celebrateMilestone.mutate,
    isCheckingMilestones: checkMilestonesMutation.isPending,
    isCelebrating: celebrateMilestone.isPending,
    checkMilestones: checkMilestonesMutation.mutate,
    refetch: milestonesQuery.refetch,
  };
}

// Helper functions for milestone formatting and display
export const formatMilestoneThreshold = (threshold: number, type: string): string => {
  if (type === 'engagement' || type === 'views') {
    if (threshold >= 1000000) return `${(threshold / 1000000).toFixed(1)}M`;
    if (threshold >= 1000) return `${(threshold / 1000).toFixed(0)}K`;
  }
  return threshold.toLocaleString();
};

export const getMilestoneTypeLabel = (type: string): string => {
  switch (type) {
    case 'followers':
      return 'Followers';
    case 'views':
      return 'Views';
    case 'engagement':
      return 'Engagement';
    case 'content':
      return 'Content Created';
    case 'collaborations':
      return 'Brand Collaborations';
    default:
      return 'Achievement';
  }
};

export const getMilestoneProgress = (current: number, threshold: number): number => {
  return Math.min(100, (current / threshold) * 100);
};