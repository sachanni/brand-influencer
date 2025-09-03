import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Archive, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Calendar, 
  Star,
  Award,
  Target,
  BarChart3,
  Eye,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

interface ArchivedCampaign {
  id: string;
  title: string;
  brandName: string;
  completedDate: string;
  compensation: string;
  currency: string;
  totalTimeSpent: number;
  performanceMetrics: {
    reach?: number;
    engagement?: number;
    conversions?: number;
    roi?: number;
  };
  learnings?: string;
  rating?: number;
  milestoneCount: number;
  completedMilestones: number;
}

interface CampaignArchiveProps {
  campaigns: ArchivedCampaign[];
  onViewCampaign?: (campaignId: string) => void;
  className?: string;
}

type SortOption = 'recent' | 'earnings' | 'performance' | 'duration' | 'rating';
type FilterOption = 'all' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year';

export function CampaignArchive({ campaigns, onViewCampaign, className }: CampaignArchiveProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Filter campaigns by date
  const filteredCampaigns = campaigns.filter(campaign => {
    const completedDate = new Date(campaign.completedDate);
    const now = new Date();
    
    switch (filterBy) {
      case 'this_month':
        return completedDate.getMonth() === now.getMonth() && 
               completedDate.getFullYear() === now.getFullYear();
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        return completedDate.getMonth() === lastMonth.getMonth() && 
               completedDate.getFullYear() === lastMonth.getFullYear();
      case 'this_quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3);
        return completedDate >= quarterStart;
      case 'this_year':
        return completedDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  // Sort campaigns
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime();
      case 'earnings':
        return parseFloat(b.compensation) - parseFloat(a.compensation);
      case 'performance':
        return (b.performanceMetrics.roi || 0) - (a.performanceMetrics.roi || 0);
      case 'duration':
        return b.totalTimeSpent - a.totalTimeSpent;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  // Calculate summary statistics
  const totalEarnings = filteredCampaigns.reduce((sum, campaign) => 
    sum + parseFloat(campaign.compensation), 0
  );
  
  const totalTimeSpent = filteredCampaigns.reduce((sum, campaign) => 
    sum + campaign.totalTimeSpent, 0
  );
  
  const averageRating = filteredCampaigns.reduce((sum, campaign) => 
    sum + (campaign.rating || 0), 0
  ) / filteredCampaigns.length;

  const averageHourlyRate = totalTimeSpent > 0 ? totalEarnings / (totalTimeSpent / 3600) : 0;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${hours}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={cn(
          "w-4 h-4",
          i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
        )} 
      />
    ));
  };

  return (
    <div className={cn("space-y-6", className)} data-testid="campaign-archive">
      {/* Archive Header & Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Archive className="w-5 h-5" />
              <span>Campaign Archive</span>
              <Badge variant="outline">{filteredCampaigns.length} campaigns</Badge>
            </CardTitle>
            
            <div className="flex items-center space-x-3">
              <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                <SelectTrigger className="w-40" data-testid="filter-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_quarter">This Quarter</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-40" data-testid="sort-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="earnings">Highest Earnings</SelectItem>
                  <SelectItem value="performance">Best Performance</SelectItem>
                  <SelectItem value="duration">Time Spent</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(totalEarnings, filteredCampaigns[0]?.currency as any || 'INR')}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Total Earnings</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatDuration(totalTimeSpent)}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Time Invested</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(averageHourlyRate, filteredCampaigns[0]?.currency as any || 'INR')}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Avg Hourly Rate</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 rounded-lg">
              <div className="flex items-center justify-center space-x-1">
                <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {averageRating.toFixed(1)}
                </span>
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Avg Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archived Campaigns Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedCampaigns.map(campaign => (
          <Card 
            key={campaign.id} 
            className="hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={() => setSelectedCampaign(selectedCampaign === campaign.id ? null : campaign.id)}
            data-testid={`archive-card-${campaign.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-base line-clamp-2">{campaign.title}</CardTitle>
                  <p className="text-sm text-gray-600">{campaign.brandName}</p>
                </div>
                
                <div className="flex items-center space-x-1">
                  {campaign.rating && renderStars(campaign.rating)}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(parseFloat(campaign.compensation), campaign.currency as any)}
                </div>
                <Badge variant="secondary">
                  {new Date(campaign.completedDate).toLocaleDateString()}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>{formatDuration(campaign.totalTimeSpent)}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  <span>{campaign.completedMilestones}/{campaign.milestoneCount}</span>
                </div>
                
                {campaign.performanceMetrics.reach && (
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-orange-500" />
                    <span>{(campaign.performanceMetrics.reach / 1000).toFixed(1)}K</span>
                  </div>
                )}
                
                {campaign.performanceMetrics.roi && (
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>{campaign.performanceMetrics.roi}% ROI</span>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {selectedCampaign === campaign.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  {campaign.learnings && (
                    <div>
                      <h5 className="font-medium text-sm mb-1">Key Learnings</h5>
                      <p className="text-sm text-gray-600 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        {campaign.learnings}
                      </p>
                    </div>
                  )}
                  
                  {campaign.performanceMetrics && (
                    <div>
                      <h5 className="font-medium text-sm mb-2">Performance Metrics</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {campaign.performanceMetrics.reach && (
                          <div className="flex justify-between">
                            <span>Reach:</span>
                            <span className="font-medium">{campaign.performanceMetrics.reach.toLocaleString()}</span>
                          </div>
                        )}
                        {campaign.performanceMetrics.engagement && (
                          <div className="flex justify-between">
                            <span>Engagement:</span>
                            <span className="font-medium">{campaign.performanceMetrics.engagement}%</span>
                          </div>
                        )}
                        {campaign.performanceMetrics.conversions && (
                          <div className="flex justify-between">
                            <span>Conversions:</span>
                            <span className="font-medium">{campaign.performanceMetrics.conversions}</span>
                          </div>
                        )}
                        {campaign.performanceMetrics.roi && (
                          <div className="flex justify-between">
                            <span>ROI:</span>
                            <span className="font-medium">{campaign.performanceMetrics.roi}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onViewCampaign?.(campaign.id)}
                      data-testid="button-view-details"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      data-testid="button-download-report"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {sortedCampaigns.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Archive className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Archived Campaigns</h3>
            <p className="text-gray-500 text-center max-w-md">
              Complete your first campaign to see performance analytics and build your portfolio history.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Summary widget for dashboard
export function ArchiveSummaryWidget({ campaigns }: { campaigns: ArchivedCampaign[] }) {
  const recentCampaigns = campaigns
    .sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime())
    .slice(0, 3);

  const totalEarnings = campaigns.reduce((sum, campaign) => 
    sum + parseFloat(campaign.compensation), 0
  );

  const averageRating = campaigns.reduce((sum, campaign) => 
    sum + (campaign.rating || 0), 0
  ) / (campaigns.length || 1);

  return (
    <Card data-testid="archive-summary-widget">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <Archive className="w-4 h-4" />
          <span>Recent Completions</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(totalEarnings, recentCampaigns[0]?.currency as any || 'INR')}
              </div>
              <div className="text-xs text-gray-500">Total Earned</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-blue-600">
                {campaigns.length}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            
            <div className="flex items-center justify-center space-x-1">
              <span className="text-lg font-bold text-yellow-600">
                {averageRating.toFixed(1)}
              </span>
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            </div>
          </div>

          {/* Recent Campaigns */}
          {recentCampaigns.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Recent Campaigns</h5>
              {recentCampaigns.map(campaign => (
                <div 
                  key={campaign.id} 
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  data-testid={`recent-campaign-${campaign.id}`}
                >
                  <div>
                    <div className="text-sm font-medium truncate max-w-[120px]">
                      {campaign.title}
                    </div>
                    <div className="text-xs text-gray-600">{campaign.brandName}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(parseFloat(campaign.compensation), campaign.currency as any)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(campaign.completedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}