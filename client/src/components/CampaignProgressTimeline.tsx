import React from 'react';
import { CheckCircle, Clock, AlertCircle, DollarSign, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStage {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  icon: React.ComponentType<any>;
  color: string;
}

interface CampaignProgressTimelineProps {
  proposalId: string;
  currentStage: string;
  progressData?: {
    contentCreationProgress?: number;
    submissionProgress?: number;
    reviewProgress?: number;
    approvalProgress?: number;
    paymentProgress?: number;
    overallProgress?: number;
  };
  onStageClick?: (stage: string) => void;
  className?: string;
}

const stages: ProgressStage[] = [
  {
    id: 'content_creation',
    name: 'Content Creation',
    description: 'Script writing, filming, and editing',
    progress: 0,
    status: 'pending',
    icon: FileText,
    color: 'bg-blue-500'
  },
  {
    id: 'submission',
    name: 'Submission',
    description: 'Submitting content for review',
    progress: 0,
    status: 'pending',
    icon: Clock,
    color: 'bg-orange-500'
  },
  {
    id: 'review',
    name: 'Review',
    description: 'Brand review and feedback',
    progress: 0,
    status: 'pending',
    icon: AlertCircle,
    color: 'bg-purple-500'
  },
  {
    id: 'approval',
    name: 'Approval',
    description: 'Final approval and go-live',
    progress: 0,
    status: 'pending',
    icon: CheckCircle,
    color: 'bg-green-500'
  },
  {
    id: 'payment',
    name: 'Payment',
    description: 'Payment processing and completion',
    progress: 0,
    status: 'pending',
    icon: DollarSign,
    color: 'bg-emerald-500'
  }
];

export function CampaignProgressTimeline({ 
  proposalId, 
  currentStage, 
  progressData = {}, 
  onStageClick,
  className 
}: CampaignProgressTimelineProps) {
  const getStageProgress = (stageId: string): number => {
    switch (stageId) {
      case 'content_creation':
        return progressData.contentCreationProgress || 0;
      case 'submission':
        return progressData.submissionProgress || 0;
      case 'review':
        return progressData.reviewProgress || 0;
      case 'approval':
        return progressData.approvalProgress || 0;
      case 'payment':
        return progressData.paymentProgress || 0;
      default:
        return 0;
    }
  };

  const getStageStatus = (stageId: string, progress: number): 'pending' | 'in_progress' | 'completed' | 'blocked' => {
    if (progress === 100) return 'completed';
    if (stageId === currentStage && progress > 0) return 'in_progress';
    if (progress > 0) return 'in_progress';
    return 'pending';
  };

  const updatedStages = stages.map(stage => ({
    ...stage,
    progress: getStageProgress(stage.id),
    status: getStageStatus(stage.id, getStageProgress(stage.id))
  }));

  const overallProgress = progressData.overallProgress || 0;

  return (
    <div className={cn("w-full", className)} data-testid="campaign-timeline">
      {/* Overall Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Campaign Progress
          </h3>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {overallProgress}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-700" />
        
        {/* Progress Line */}
        <div 
          className="absolute left-8 top-8 w-0.5 bg-gradient-to-b from-blue-500 to-green-500 transition-all duration-1000 ease-out"
          style={{ 
            height: `${(overallProgress / 100) * (updatedStages.length - 1) * 120}px`
          }}
        />

        {/* Stages */}
        <div className="space-y-8">
          {updatedStages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = stage.id === currentStage;
            const isCompleted = stage.status === 'completed';
            const isInProgress = stage.status === 'in_progress';
            const isPending = stage.status === 'pending';

            return (
              <div 
                key={stage.id}
                className={cn(
                  "relative flex items-start group transition-all duration-200",
                  onStageClick && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 -m-2"
                )}
                onClick={() => onStageClick?.(stage.id)}
                data-testid={`stage-${stage.id}`}
              >
                {/* Stage Icon */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-300",
                  isCompleted && "bg-green-100 border-green-500 dark:bg-green-900 dark:border-green-400",
                  isInProgress && "bg-blue-100 border-blue-500 dark:bg-blue-900 dark:border-blue-400",
                  isActive && "bg-blue-100 border-blue-500 dark:bg-blue-900 dark:border-blue-400 ring-4 ring-blue-200 dark:ring-blue-800",
                  isPending && "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600"
                )}>
                  <Icon className={cn(
                    "w-6 h-6 transition-colors duration-300",
                    isCompleted && "text-green-600 dark:text-green-400",
                    isInProgress && "text-blue-600 dark:text-blue-400",
                    isActive && "text-blue-600 dark:text-blue-400",
                    isPending && "text-gray-400 dark:text-gray-500"
                  )} />
                  
                  {/* Progress Ring */}
                  {stage.progress > 0 && (
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className={cn(
                          "transition-all duration-500",
                          isCompleted && "text-green-500 dark:text-green-400",
                          isInProgress && "text-blue-500 dark:text-blue-400",
                          isPending && "text-gray-300 dark:text-gray-600"
                        )}
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - stage.progress / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>

                {/* Stage Content */}
                <div className="ml-6 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={cn(
                      "text-lg font-semibold transition-colors duration-200",
                      isCompleted && "text-green-700 dark:text-green-300",
                      isInProgress && "text-blue-700 dark:text-blue-300",
                      isActive && "text-blue-700 dark:text-blue-300",
                      isPending && "text-gray-600 dark:text-gray-400"
                    )}>
                      {stage.name}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {stage.progress > 0 && (
                        <span className={cn(
                          "text-sm font-medium px-2 py-1 rounded-full",
                          isCompleted && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                          isInProgress && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                          isPending && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        )}>
                          {stage.progress}%
                        </span>
                      )}
                      {isCompleted && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {stage.description}
                  </p>
                  
                  {/* Progress Bar for Individual Stage */}
                  {stage.progress > 0 && stage.progress < 100 && (
                    <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-500",
                          isInProgress && "bg-blue-500",
                          isPending && "bg-gray-400"
                        )}
                        style={{ width: `${stage.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}