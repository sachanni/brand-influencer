import React, { useState } from 'react';
import { Filter, SortAsc, SortDesc, Calendar, Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type FilterType = 'all' | 'urgent' | 'in_review' | 'payment_pending' | 'completed' | 'active';
export type SortType = 'deadline' | 'payment' | 'progress' | 'urgency' | 'created_at';
export type SortOrder = 'asc' | 'desc';

interface FilterOption {
  id: FilterType;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  count?: number;
}

interface SortOption {
  id: SortType;
  label: string;
  icon: React.ComponentType<any>;
}

interface CampaignFiltersProps {
  activeFilter: FilterType;
  sortBy: SortType;
  sortOrder: SortOrder;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: (sortBy: SortType, sortOrder: SortOrder) => void;
  campaignCounts?: Partial<Record<FilterType, number>>;
  className?: string;
}

const filterOptions: FilterOption[] = [
  {
    id: 'all',
    label: 'All Campaigns',
    description: 'Show all active campaigns',
    icon: Filter,
    color: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200'
  },
  {
    id: 'urgent',
    label: 'Urgent',
    description: 'Less than 2 days remaining or overdue',
    icon: AlertCircle,
    color: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
  },
  {
    id: 'active',
    label: 'Active',
    description: 'Currently working on these campaigns',
    icon: Clock,
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200'
  },
  {
    id: 'in_review',
    label: 'In Review',
    description: 'Content submitted and awaiting brand review',
    icon: TrendingUp,
    color: 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200'
  },
  {
    id: 'payment_pending',
    label: 'Payment Pending',
    description: 'Waiting for payment processing',
    icon: DollarSign,
    color: 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200'
  },
  {
    id: 'completed',
    label: 'Completed',
    description: 'Successfully finished campaigns',
    icon: Clock,
    color: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
  }
];

const sortOptions: SortOption[] = [
  { id: 'deadline', label: 'Deadline', icon: Calendar },
  { id: 'payment', label: 'Payment Amount', icon: DollarSign },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'urgency', label: 'Urgency', icon: AlertCircle },
  { id: 'created_at', label: 'Recently Added', icon: Clock }
];

export function CampaignFilters({
  activeFilter,
  sortBy,
  sortOrder,
  onFilterChange,
  onSortChange,
  campaignCounts = {} as Partial<Record<FilterType, number>>,
  className
}: CampaignFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFilterOption = filterOptions.find(f => f.id === activeFilter) || filterOptions[0];
  const activeSortOption = sortOptions.find(s => s.id === sortBy) || sortOptions[0];

  const handleSortChange = (newSortBy: SortType) => {
    if (newSortBy === sortBy) {
      // Toggle order if same sort field
      onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for new sort fields
      onSortChange(newSortBy, 'desc');
    }
  };

  return (
    <div className={cn("flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700", className)} data-testid="campaign-filters">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;
          const count = campaignCounts[filter.id] || 0;

          return (
            <Button
              key={filter.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "transition-all duration-200",
                !isActive && filter.color
              )}
              data-testid={`filter-${filter.id}`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {filter.label}
              {count > 0 && (
                <Badge 
                  variant={isActive ? "secondary" : "outline"} 
                  className="ml-2 text-xs"
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Sort Controls */}
      <div className="flex items-center space-x-2 sm:ml-auto">
        <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" data-testid="sort-dropdown">
              <activeSortOption.icon className="w-4 h-4 mr-2" />
              {activeSortOption.label}
              {sortOrder === 'asc' ? (
                <SortAsc className="w-4 h-4 ml-2" />
              ) : (
                <SortDesc className="w-4 h-4 ml-2" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              const isActive = sortBy === option.id;
              
              return (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => handleSortChange(option.id)}
                  className={cn(isActive && "bg-gray-100 dark:bg-gray-800")}
                  data-testid={`sort-option-${option.id}`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {option.label}
                  {isActive && (
                    <div className="ml-auto">
                      {sortOrder === 'asc' ? (
                        <SortAsc className="w-4 h-4" />
                      ) : (
                        <SortDesc className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filter Description */}
      {activeFilter !== 'all' && (
        <div className="sm:absolute sm:top-full sm:left-4 sm:mt-2 text-sm text-gray-600 dark:text-gray-400">
          {activeFilterOption.description}
        </div>
      )}
    </div>
  );
}

// Quick filter buttons component for mobile
export function QuickFilters({ 
  activeFilter, 
  onFilterChange, 
  campaignCounts = {} as Partial<Record<FilterType, number>>
}: Pick<CampaignFiltersProps, 'activeFilter' | 'onFilterChange' | 'campaignCounts'>) {
  const quickFilters = filterOptions.slice(0, 4); // Show first 4 most important filters

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800" data-testid="quick-filters">
      {quickFilters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        const count = campaignCounts[filter.id] || 0;

        return (
          <Button
            key={filter.id}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            className="text-xs"
            data-testid={`quick-filter-${filter.id}`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {filter.label}
            {count > 0 && <span className="ml-1">({count})</span>}
          </Button>
        );
      })}
    </div>
  );
}