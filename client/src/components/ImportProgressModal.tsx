import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Download, Users, Image, FileText, BarChart3 } from "lucide-react";

interface ImportStep {
  id: string;
  name: string;
  description: string;
  icon: any;
  completed: boolean;
}

interface ImportProgressModalProps {
  isOpen: boolean;
  platform: string;
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  estimatedTimeRemaining?: number;
  startTime?: number;
}

export function ImportProgressModal({ 
  isOpen, 
  platform, 
  currentStep, 
  totalSteps, 
  isComplete,
  estimatedTimeRemaining = 0,
  startTime = Date.now()
}: ImportProgressModalProps) {
  const steps: ImportStep[] = [
    {
      id: 'validate',
      name: 'Validating Profile',
      description: 'Verifying channel ID and accessibility (~2-3 seconds)',
      icon: CheckCircle2,
      completed: currentStep > 0,
    },
    {
      id: 'profile',
      name: 'Importing Profile Data',
      description: 'Fetching channel info, profile picture, and bio (~3-4 seconds)',
      icon: Image,
      completed: currentStep > 1,
    },
    {
      id: 'metrics',
      name: 'Analyzing Metrics',
      description: 'Calculating followers, engagement, and reach (~2-3 seconds)',
      icon: BarChart3,
      completed: currentStep > 2,
    },
    {
      id: 'content',
      name: 'Processing Content',
      description: 'Importing recent posts and performance data (~3-4 seconds)',
      icon: FileText,
      completed: currentStep > 3,
    },
    {
      id: 'finalize',
      name: 'Finalizing Import',
      description: 'Saving data and updating your profile (~1-2 seconds)',
      icon: Download,
      completed: isComplete,
    },
  ];

  const progress = (currentStep / totalSteps) * 100;
  
  // Calculate elapsed and remaining time
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-teal" />
            Importing {platform} Data
          </DialogTitle>
          <DialogDescription>
            Please wait while we import your {platform} data. This process typically takes 10-15 seconds.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-teal mb-2">
              {isComplete ? '100' : Math.round(progress)}%
            </div>
            <Progress value={isComplete ? 100 : progress} className="h-2 mb-4" />
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                {isComplete 
                  ? `Import completed in ${formatTime(elapsedTime)}!` 
                  : `Step ${currentStep + 1} of ${totalSteps}`
                }
              </p>
              {!isComplete && estimatedTimeRemaining > 0 && (
                <p className="text-xs text-gray-500">
                  Estimated time remaining: {formatTime(estimatedTimeRemaining)}
                </p>
              )}
              {!isComplete && elapsedTime > 0 && (
                <p className="text-xs text-gray-400">
                  Elapsed: {formatTime(elapsedTime)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep && !isComplete;
              const isCompleted = step.completed;
              
              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-brand-teal/10 border border-brand-teal/30' 
                      : isCompleted 
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    isCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : isActive 
                        ? 'bg-brand-teal/20 text-brand-teal' 
                        : 'bg-gray-200 text-gray-400'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-sm">{step.name}</div>
                    <div className="text-xs text-gray-600">{step.description}</div>
                  </div>
                  
                  {isCompleted && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  
                  {isActive && (
                    <div className="w-5 h-5 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              );
            })}
          </div>

          {isComplete && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-center mb-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-800 font-medium">
                  Professional import completed successfully!
                </p>
              </div>
              <div className="text-xs text-green-700 space-y-1">
                <div className="font-medium">Data imported:</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>✓ Profile picture</div>
                  <div>✓ Bio/description</div>
                  <div>✓ Subscriber count</div>
                  <div>✓ Video count</div>
                  <div>✓ Total views</div>
                  <div>✓ Engagement rate</div>
                  <div>✓ Content categories</div>
                  <div>✓ Recent videos</div>
                  <div>✓ Performance metrics</div>
                  <div>✓ Account metadata</div>
                </div>
              </div>
            </div>
          )}

          {!isComplete && currentStep >= 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs text-blue-800">
                <div className="font-medium mb-1">Currently importing:</div>
                {currentStep === 0 && "• Verifying channel accessibility and permissions"}
                {currentStep === 1 && "• Fetching profile image, name, bio, and channel metadata"}
                {currentStep === 2 && "• Calculating engagement rates and audience metrics"}
                {currentStep === 3 && "• Analyzing recent content and performance data"}
                {currentStep === 4 && "• Saving comprehensive data to your profile"}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}