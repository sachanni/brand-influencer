import React, { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Edit3, AlertTriangle, Link, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ProductionMilestone {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  order: number;
  requiresUrl?: boolean;
  urlPattern?: RegExp;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  completedAt?: string;
  metadata?: {
    livePostUrl?: string;
    platform?: string;
    contentType?: string;
  };
}

interface ProductionMilestoneManagerProps {
  proposalId: string;
  contentId?: string;
  className?: string;
}

// Production-ready milestone definitions
const PRODUCTION_MILESTONES: Omit<ProductionMilestone, 'id' | 'retryCount' | 'status'>[] = [
  {
    title: 'Script Writing',
    description: 'Create compelling script and concept',
    order: 1,
    maxRetries: 3
  },
  {
    title: 'Content Creation',
    description: 'Film or create the content',
    order: 2,
    maxRetries: 3
  },
  {
    title: 'Editing',
    description: 'Edit and polish the content',
    order: 3,
    maxRetries: 3
  },
  {
    title: 'Review & Revisions',
    description: 'Review feedback and make revisions',
    order: 4,
    maxRetries: 3
  },
  {
    title: 'Publishing',
    description: 'Publish content live and add URL',
    order: 5,
    requiresUrl: true,
    urlPattern: /^https?:\/\/(www\.)?(instagram\.com|instagr\.am|tiktok\.com|youtube\.com|youtu\.be|facebook\.com|twitter\.com|x\.com)/,
    maxRetries: 5
  }
];

// URL validation patterns by platform
const URL_PATTERNS = {
  instagram: /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|tv|reel)\//,
  tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.]+\/video\//,
  youtube: /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)\w+/,
  facebook: /^https?:\/\/(www\.)?facebook\.com\/.*\/(posts|videos)\//,
  twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\//
};

// Production logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[MilestoneManager] INFO: ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[MilestoneManager] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[MilestoneManager] WARN: ${message}`, data);
  },
  debug: (message: string, data?: any) => {
    console.debug(`[MilestoneManager] DEBUG: ${message}`, data);
  }
};

export function ProductionMilestoneManager({ 
  proposalId, 
  contentId,
  className 
}: ProductionMilestoneManagerProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<ProductionMilestone | null>(null);
  const [liveUrl, setLiveUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch milestone status from backend
  const { data: milestonesData, isLoading } = useQuery({
    queryKey: ['/api/proposals', proposalId, 'production-milestones'],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/proposals/${proposalId}/production-milestones`, 'GET');
        const data = await response.json();
        log.debug('Fetched milestones', data);
        return data.milestones || [];
      } catch (error) {
        log.error('Failed to fetch milestones', error);
        // Return default milestones if backend doesn't have them yet
        return PRODUCTION_MILESTONES.map((m, index) => ({
          id: `milestone-${index + 1}`,
          ...m,
          status: 'pending' as const,
          retryCount: 0
        }));
      }
    },
    enabled: !!proposalId
  });

  // Enhanced URL validation
  const validateUrl = useCallback((url: string, platform?: string): string | null => {
    if (!url || !url.trim()) {
      return 'URL is required for Publishing milestone';
    }

    const trimmedUrl = url.trim();
    
    // Check if URL is properly formatted
    try {
      new URL(trimmedUrl);
    } catch {
      return 'Please enter a valid URL (e.g., https://instagram.com/p/ABC123)';
    }

    // Platform-specific validation
    if (platform && URL_PATTERNS[platform as keyof typeof URL_PATTERNS]) {
      const pattern = URL_PATTERNS[platform as keyof typeof URL_PATTERNS];
      if (!pattern.test(trimmedUrl)) {
        return `URL must be a valid ${platform} post URL`;
      }
    } else {
      // Generic social media URL validation
      const isValidSocialUrl = Object.values(URL_PATTERNS).some(pattern => pattern.test(trimmedUrl));
      if (!isValidSocialUrl) {
        return 'URL must be from a supported platform (Instagram, TikTok, YouTube, Facebook, Twitter)';
      }
    }

    return null;
  }, []);

  // Production-ready milestone completion with retry logic
  const completeMilestoneMutation = useMutation({
    mutationFn: async ({ milestone, livePostUrl }: { milestone: ProductionMilestone; livePostUrl?: string }) => {
      const startTime = Date.now();
      log.info(`Starting milestone completion: ${milestone.title}`, { 
        proposalId, 
        milestoneId: milestone.id, 
        requiresUrl: milestone.requiresUrl,
        retryCount: milestone.retryCount 
      });

      try {
        // Step 1: URL validation for Publishing milestone
        if (milestone.requiresUrl && livePostUrl) {
          setIsValidating(true);
          const validationError = validateUrl(livePostUrl);
          if (validationError) {
            throw new Error(validationError);
          }
        }

        // Step 2: Complete milestone via API
        const response = await apiRequest(`/api/milestones/${milestone.id}/complete`, 'POST', {
          proposalId,
          livePostUrl: livePostUrl || undefined,
          milestoneType: milestone.title,
          metadata: {
            timestamp: new Date().toISOString(),
            retryAttempt: milestone.retryCount + 1,
            contentId
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to complete milestone');
        }

        const result = await response.json();
        
        log.info(`Milestone completed successfully: ${milestone.title}`, {
          duration: Date.now() - startTime,
          result
        });

        return result;

      } catch (error: any) {
        log.error(`Milestone completion failed: ${milestone.title}`, {
          error: error.message,
          duration: Date.now() - startTime,
          retryCount: milestone.retryCount
        });
        throw error;
      } finally {
        setIsValidating(false);
      }
    },
    
    onSuccess: (data, variables) => {
      const { milestone } = variables;
      
      toast({
        title: "✅ Milestone Completed!",
        description: `${milestone.title} has been marked as complete.`,
        duration: 5000
      });

      // Invalidate related queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['/api/proposals', proposalId, 'production-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['/api/influencer/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/influencer/content'] });
      
      // Reset form
      setLiveUrl('');
      setUrlError('');
      setShowDialog(false);
      setSelectedMilestone(null);

      log.info(`Milestone completion successful: ${milestone.title}`);
    },

    onError: (error: Error, variables) => {
      const { milestone } = variables;
      
      log.error(`Milestone completion error: ${milestone.title}`, error);
      
      // Enhanced error handling with rollback
      toast({
        title: "❌ Milestone Completion Failed",
        description: error.message,
        variant: "destructive",
        duration: 8000
      });

      // Check if we should retry
      if (milestone.retryCount < milestone.maxRetries) {
        setTimeout(() => {
          log.info(`Retrying milestone completion: ${milestone.title}`, {
            retryCount: milestone.retryCount + 1,
            maxRetries: milestone.maxRetries
          });
          
          // Increment retry count and try again
          completeMilestoneMutation.mutate({
            milestone: { ...milestone, retryCount: milestone.retryCount + 1 },
            livePostUrl: variables.livePostUrl
          });
        }, 2000 * (milestone.retryCount + 1)); // Exponential backoff
      }
    }
  });

  const handleMilestoneClick = useCallback((milestone: ProductionMilestone) => {
    if (milestone.status === 'completed') return;

    log.debug(`Opening milestone dialog: ${milestone.title}`, milestone);
    
    setSelectedMilestone(milestone);
    setLiveUrl(milestone.metadata?.livePostUrl || '');
    setUrlError('');
    setShowDialog(true);
  }, []);

  const handleComplete = useCallback(() => {
    if (!selectedMilestone) return;

    // Validate URL if required
    if (selectedMilestone.requiresUrl) {
      const error = validateUrl(liveUrl);
      if (error) {
        setUrlError(error);
        return;
      }
    }

    log.info(`Completing milestone: ${selectedMilestone.title}`, {
      requiresUrl: selectedMilestone.requiresUrl,
      hasUrl: !!liveUrl
    });

    completeMilestoneMutation.mutate({
      milestone: selectedMilestone,
      livePostUrl: liveUrl || undefined
    });
  }, [selectedMilestone, liveUrl, validateUrl, completeMilestoneMutation]);

  const milestones = milestonesData || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="milestone-loading">
        <Clock className="w-6 h-6 animate-spin mr-2" />
        <span>Loading milestones...</span>
      </div>
    );
  }

  return (
    <>
      <div className={cn("space-y-4", className)} data-testid="production-milestone-manager">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Campaign Milestones</h3>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">
              {milestones.filter((m: ProductionMilestone) => m.status === 'completed').length} / {milestones.length} Complete
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {milestones.map((milestone: ProductionMilestone) => {
            const isCompleted = milestone.status === 'completed';
            const isPending = milestone.status === 'pending';
            const isInProgress = milestone.status === 'in_progress';
            const isFailed = milestone.status === 'failed';

            return (
              <Card 
                key={milestone.id}
                className={cn(
                  "transition-all duration-200 cursor-pointer hover:shadow-md",
                  isCompleted && "border-green-200 bg-green-50/50 dark:bg-green-950/20",
                  isInProgress && "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20",
                  isFailed && "border-red-200 bg-red-50/50 dark:bg-red-950/20",
                  isPending && "hover:border-blue-200"
                )}
                onClick={() => handleMilestoneClick(milestone)}
                data-testid={`milestone-${milestone.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        isCompleted && "bg-green-500 text-white",
                        isInProgress && "bg-blue-500 text-white",
                        isFailed && "bg-red-500 text-white",
                        isPending && "bg-gray-200 text-gray-500"
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : isFailed ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : isInProgress ? (
                          <Clock className="w-5 h-5 animate-spin" />
                        ) : (
                          milestone.order
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium">{milestone.title}</h4>
                        <p className="text-sm text-gray-600">{milestone.description}</p>
                        {milestone.metadata?.livePostUrl && (
                          <div className="flex items-center gap-1 mt-1">
                            <Link className="w-3 h-3 text-blue-500" />
                            <a 
                              href={milestone.metadata.livePostUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {milestone.metadata.livePostUrl.length > 40 
                                ? `${milestone.metadata.livePostUrl.substring(0, 40)}...`
                                : milestone.metadata.livePostUrl
                              }
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {milestone.retryCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry {milestone.retryCount}
                        </Badge>
                      )}
                      
                      <Badge 
                        variant={
                          isCompleted ? "default" : 
                          isInProgress ? "secondary" : 
                          isFailed ? "destructive" : 
                          "outline"
                        }
                        className={cn(
                          isCompleted && "bg-green-500 hover:bg-green-600",
                        )}
                      >
                        {milestone.status === 'completed' && 'Completed'}
                        {milestone.status === 'in_progress' && 'In Progress'}
                        {milestone.status === 'failed' && 'Failed'}
                        {milestone.status === 'pending' && 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Milestone Completion Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Complete Milestone
            </DialogTitle>
            <DialogDescription>
              {selectedMilestone?.title} - {selectedMilestone?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedMilestone?.requiresUrl && (
              <div className="space-y-2">
                <Label htmlFor="live-url">
                  Live Post URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="live-url"
                  value={liveUrl}
                  onChange={(e) => {
                    setLiveUrl(e.target.value);
                    if (urlError) setUrlError('');
                  }}
                  placeholder="https://instagram.com/p/ABC123 or https://tiktok.com/@user/video/123"
                  className={urlError ? 'border-red-300 focus-visible:ring-red-500' : ''}
                  disabled={completeMilestoneMutation.isPending}
                />
                {urlError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {urlError}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Paste the URL of your published post from Instagram, TikTok, YouTube, Facebook, or Twitter
                </p>
              </div>
            )}

            {selectedMilestone?.retryCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  This is retry attempt {selectedMilestone.retryCount + 1} of {selectedMilestone.maxRetries}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={completeMilestoneMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                disabled={
                  completeMilestoneMutation.isPending || 
                  (selectedMilestone?.requiresUrl && !liveUrl.trim()) ||
                  isValidating
                }
                className="flex-1"
              >
                {completeMilestoneMutation.isPending || isValidating ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    {isValidating ? 'Validating...' : 'Completing...'}
                  </>
                ) : (
                  'Complete Milestone'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}