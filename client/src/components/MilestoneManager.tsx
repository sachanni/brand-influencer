import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Edit3, Play, Square, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/currency';

interface Milestone {
  id: string;
  title: string;
  type: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  order: number;
  estimatedHours: string;
  actualHours?: string;
  dueDate?: string;
  completedAt?: string;
  isUrgent?: boolean;
}

interface TimeSession {
  id: string;
  milestoneId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  isActive: boolean;
}

interface MilestoneManagerProps {
  proposalId: string;
  proposalData?: {
    proposedCompensation: string;
    campaign?: {
      currency?: string;
      brandName?: string;
    };
  };
  className?: string;
}

export function MilestoneManager({ proposalId, proposalData, className }: MilestoneManagerProps) {
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ title: string; description: string; estimatedHours: string }>({
    title: '',
    description: '',
    estimatedHours: ''
  });

  const queryClient = useQueryClient();
  const currency = proposalData?.campaign?.currency || 'INR';

  // Fetch milestones
  const { data: milestonesData, isLoading: milestonesLoading } = useQuery({
    queryKey: ['/api/proposals', proposalId, 'milestones'],
    enabled: !!proposalId
  });

  // Fetch time sessions
  const { data: timeData, isLoading: timeLoading } = useQuery({
    queryKey: ['/api/proposals', proposalId, 'time-sessions'],
    enabled: !!proposalId
  });

  // Fetch active time session
  const { data: activeSessionData } = useQuery({
    queryKey: ['/api/time-tracking/active'],
    refetchInterval: 1000 // Update every second for live tracking
  });

  const milestones: Milestone[] = (milestonesData as any)?.milestones || [];
  const timeSessions: TimeSession[] = (timeData as any)?.sessions || [];
  const totalTimeSpent = (timeData as any)?.totalTimeSpent || 0;
  const totalHours = (timeData as any)?.totalHours || 0;
  const activeSession: TimeSession | null = (activeSessionData as any)?.session || null;

  // Initialize milestones mutation
  const initializeMilestonesMutation = useMutation({
    mutationFn: () => apiRequest(`/api/proposals/${proposalId}/milestones/initialize`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals', proposalId, 'milestones'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals', proposalId, 'progress'] });
    }
  });

  // Update milestone mutation
  const updateMilestone = useMutation({
    mutationFn: ({ milestoneId, updates }: { milestoneId: string; updates: any }) => 
      apiRequest(`/api/milestones/${milestoneId}`, 'PUT', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals', proposalId, 'milestones'] });
      setEditingMilestone(null);
    }
  });

  // Complete milestone mutation
  const completeMilestone = useMutation({
    mutationFn: (milestoneId: string) => 
      apiRequest(`/api/milestones/${milestoneId}/complete`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals', proposalId, 'milestones'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals', proposalId, 'progress'] });
    }
  });

  // Start time tracking mutation
  const startTimeTracking = useMutation({
    mutationFn: ({ milestoneId, description }: { milestoneId: string; description?: string }) => 
      apiRequest('/api/time-tracking/start', 'POST', { milestoneId, proposalId, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-tracking/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals', proposalId, 'time-sessions'] });
    }
  });

  // Stop time tracking mutation
  const stopTimeTracking = useMutation({
    mutationFn: (sessionId: string) => 
      apiRequest(`/api/time-tracking/${sessionId}/stop`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-tracking/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals', proposalId, 'time-sessions'] });
    }
  });

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone.id);
    setEditValues({
      title: milestone.title,
      description: milestone.description || '',
      estimatedHours: milestone.estimatedHours
    });
  };

  const handleSaveEdit = () => {
    if (!editingMilestone) return;
    
    updateMilestone.mutate({
      milestoneId: editingMilestone,
      updates: editValues
    });
  };

  const handleStartTracking = (milestoneId: string) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    startTimeTracking.mutate({
      milestoneId,
      description: `Working on ${milestone?.title}`
    });
  };

  const handleStopTracking = () => {
    if (activeSession) {
      stopTimeTracking.mutate(activeSession.id);
    }
  };

  const getMilestoneIcon = (status: string, isUrgent?: boolean) => {
    if (status === 'completed') return CheckCircle;
    if (isUrgent) return AlertTriangle;
    return Clock;
  };

  const getMilestoneColor = (status: string, isUrgent?: boolean) => {
    if (status === 'completed') return 'text-green-500';
    if (isUrgent) return 'text-red-500';
    if (status === 'in_progress') return 'text-blue-500';
    return 'text-gray-400';
  };

  const calculateHourlyRate = () => {
    if (totalHours === 0) return 0;
    const compensation = parseFloat(proposalData?.proposedCompensation || '0');
    return compensation / totalHours;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (milestonesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)} data-testid="milestone-manager">
      {/* Time Tracking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Time Tracking Summary
            {activeSession && (
              <Badge variant="destructive" className="animate-pulse">
                Recording: {activeSession.description}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatDuration(totalTimeSpent)}
              </div>
              <div className="text-sm text-gray-600">Total Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(calculateHourlyRate(), currency as any)}
              </div>
              <div className="text-sm text-gray-600">Per Hour</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {milestones.filter(m => m.status === 'completed').length}/{milestones.length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {milestones.filter(m => m.isUrgent && m.status !== 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Urgent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Initialize Milestones */}
      {milestones.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <h3 className="text-lg font-semibold mb-2">Get Started with Milestones</h3>
            <p className="text-gray-600 text-center mb-4">
              Set up your campaign milestones to track progress and manage your time effectively.
            </p>
            <Button 
              onClick={() => initializeMilestonesMutation.mutate()}
              disabled={initializeMilestonesMutation.isPending}
              data-testid="button-initialize-milestones"
            >
              {initializeMilestonesMutation.isPending ? 'Setting up...' : 'Initialize Milestones'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Milestones List */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map((milestone) => {
                const Icon = getMilestoneIcon(milestone.status, milestone.isUrgent);
                const iconColor = getMilestoneColor(milestone.status, milestone.isUrgent);
                const isActive = activeSession?.milestoneId === milestone.id;
                const isEditing = editingMilestone === milestone.id;

                return (
                  <div 
                    key={milestone.id} 
                    className={cn(
                      "border rounded-lg p-4 transition-all duration-200",
                      milestone.isUrgent && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
                      milestone.status === 'completed' && "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
                      isActive && "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                    )}
                    data-testid={`milestone-${milestone.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Icon className={cn("w-5 h-5 mt-1", iconColor)} />
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={editValues.title}
                                onChange={(e) => setEditValues(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Milestone title"
                                data-testid="input-milestone-title"
                              />
                              <Textarea
                                value={editValues.description}
                                onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Description"
                                rows={2}
                                data-testid="textarea-milestone-description"
                              />
                              <Input
                                type="number"
                                step="0.5"
                                value={editValues.estimatedHours}
                                onChange={(e) => setEditValues(prev => ({ ...prev, estimatedHours: e.target.value }))}
                                placeholder="Estimated hours"
                                data-testid="input-milestone-hours"
                              />
                              <div className="flex space-x-2">
                                <Button size="sm" onClick={handleSaveEdit} data-testid="button-save-milestone">
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setEditingMilestone(null)}
                                  data-testid="button-cancel-edit"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold">{milestone.title}</h4>
                                {milestone.isUrgent && (
                                  <Badge variant="destructive">Urgent</Badge>
                                )}
                                {milestone.status === 'completed' && (
                                  <Badge variant="secondary">Completed</Badge>
                                )}
                                {isActive && (
                                  <Badge className="bg-blue-100 text-blue-800">Recording</Badge>
                                )}
                              </div>
                              {milestone.description && (
                                <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>Est: {milestone.estimatedHours}h</span>
                                {milestone.actualHours && (
                                  <span>Actual: {milestone.actualHours}h</span>
                                )}
                                {milestone.dueDate && (
                                  <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {!isEditing && (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditMilestone(milestone)}
                            data-testid="button-edit-milestone"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          
                          {milestone.status !== 'completed' && (
                            <>
                              {isActive ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleStopTracking}
                                  disabled={stopTimeTracking.isPending}
                                  data-testid="button-stop-tracking"
                                >
                                  <Square className="w-4 h-4" />
                                  Stop
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStartTracking(milestone.id)}
                                  disabled={startTimeTracking.isPending || !!activeSession}
                                  data-testid="button-start-tracking"
                                >
                                  <Play className="w-4 h-4" />
                                  Start
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                onClick={() => completeMilestone.mutate(milestone.id)}
                                disabled={completeMilestone.isPending}
                                data-testid="button-complete-milestone"
                              >
                                Complete
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}