import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

interface CampaignEvent {
  id: string;
  title: string;
  brandName: string;
  date: Date;
  type: 'deadline' | 'milestone' | 'payment_due';
  status: string;
  compensation: string;
  currency: string;
  isUrgent?: boolean;
  daysUntil?: number;
}

interface CampaignCalendarProps {
  campaigns: Array<{
    id: string;
    campaign?: {
      title: string;
      brandName?: string;
      exactEndDate?: string;
      currency?: string;
    };
    proposedCompensation: string;
    status: string;
    isUrgent?: boolean;
    daysUntilDeadline?: number;
  }>;
  onEventClick?: (eventId: string) => void;
  className?: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CampaignCalendar({ campaigns, onEventClick, className }: CampaignCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Convert campaigns to calendar events
  const events = useMemo((): CampaignEvent[] => {
    const campaignEvents: CampaignEvent[] = [];

    campaigns.forEach(campaign => {
      if (campaign.campaign?.exactEndDate) {
        const deadline = new Date(campaign.campaign.exactEndDate);
        campaignEvents.push({
          id: campaign.id,
          title: campaign.campaign.title,
          brandName: campaign.campaign.brandName || 'Brand',
          date: deadline,
          type: 'deadline',
          status: campaign.status,
          compensation: campaign.proposedCompensation,
          currency: campaign.campaign.currency || 'INR',
          isUrgent: campaign.isUrgent,
          daysUntil: campaign.daysUntilDeadline
        });
      }
    });

    return campaignEvents;
  }, [campaigns]);

  // Get calendar grid data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Previous month's trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        events: []
      });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = events.filter(event => 
        event.date.getDate() === day &&
        event.date.getMonth() === month &&
        event.date.getFullYear() === year
      );
      
      days.push({
        date,
        isCurrentMonth: true,
        events: dayEvents
      });
    }
    
    // Next month's leading days
    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextMonthDay = 1;
    while (days.length < totalCells) {
      days.push({
        date: new Date(year, month + 1, nextMonthDay),
        isCurrentMonth: false,
        events: []
      });
      nextMonthDay++;
    }
    
    return days;
  }, [currentDate, events]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  const getEventColor = (event: CampaignEvent) => {
    if (event.isUrgent || (event.daysUntil && event.daysUntil < 0)) {
      return 'bg-red-500 text-white';
    }
    if (event.daysUntil && event.daysUntil < 2) {
      return 'bg-orange-500 text-white';
    }
    if (event.status === 'completed') {
      return 'bg-green-500 text-white';
    }
    return 'bg-blue-500 text-white';
  };

  const selectedDateEvents = selectedDate 
    ? events.filter(event => event.date.toDateString() === selectedDate.toDateString())
    : [];

  return (
    <div className={cn("space-y-4", className)} data-testid="campaign-calendar">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Campaign Calendar</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-today">
                Today
              </Button>
              
              <div className="flex items-center space-x-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateMonth('prev')}
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="text-lg font-semibold min-w-[140px] text-center">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateMonth('next')}
                  data-testid="button-next-month"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {DAYS_OF_WEEK.map(day => (
              <div 
                key={day} 
                className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400 border-b"
              >
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {calendarData.map((dayData, index) => {
              const hasEvents = dayData.events.length > 0;
              const hasUrgentEvents = dayData.events.some(e => e.isUrgent);
              
              return (
                <div
                  key={index}
                  className={cn(
                    "p-1 min-h-[80px] border border-gray-100 dark:border-gray-800 transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                    !dayData.isCurrentMonth && "text-gray-400 bg-gray-50 dark:bg-gray-900",
                    isToday(dayData.date) && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                    isSelected(dayData.date) && "bg-blue-100 dark:bg-blue-800 border-blue-300 dark:border-blue-600",
                    hasUrgentEvents && "border-red-200 dark:border-red-800"
                  )}
                  onClick={() => setSelectedDate(dayData.date)}
                  data-testid={`calendar-day-${dayData.date.getDate()}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={cn(
                      "text-sm font-medium",
                      isToday(dayData.date) && "text-blue-600 dark:text-blue-400 font-bold"
                    )}>
                      {dayData.date.getDate()}
                    </span>
                    
                    {hasEvents && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {dayData.events.length}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Event Indicators */}
                  <div className="space-y-1">
                    {dayData.events.slice(0, 2).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className={cn(
                          "text-xs p-1 rounded truncate",
                          getEventColor(event)
                        )}
                        title={`${event.title} - ${event.brandName}`}
                      >
                        {event.title.substring(0, 8)}...
                      </div>
                    ))}
                    
                    {dayData.events.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayData.events.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Date Details */}
          {selectedDate && selectedDateEvents.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" data-testid="selected-date-events">
              <h4 className="font-semibold mb-3">
                Events for {selectedDate.toLocaleDateString()}
              </h4>
              
              <div className="space-y-3">
                {selectedDateEvents.map(event => (
                  <div 
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded border cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => onEventClick?.(event.id)}
                    data-testid={`event-${event.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        event.isUrgent ? "bg-red-500" : "bg-blue-500"
                      )} />
                      
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-gray-600">{event.brandName}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-semibold text-sm">
                          {formatCurrency(parseFloat(event.compensation), event.currency as any)}
                        </div>
                        {event.daysUntil !== undefined && (
                          <div className={cn(
                            "text-xs",
                            event.daysUntil < 0 && "text-red-600",
                            event.daysUntil < 2 && event.daysUntil >= 0 && "text-orange-600"
                          )}>
                            {event.daysUntil < 0 
                              ? `${Math.abs(event.daysUntil)} days overdue`
                              : event.daysUntil === 0
                              ? 'Due today'
                              : `${event.daysUntil} days left`
                            }
                          </div>
                        )}
                      </div>
                      
                      {event.isUrgent && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendar Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Urgent/Overdue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Due Soon</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Compact calendar widget for dashboard
export function CompactCalendar({ campaigns, onEventClick }: Pick<CampaignCalendarProps, 'campaigns' | 'onEventClick'>) {
  const today = new Date();
  const upcomingEvents = campaigns
    .filter(c => c.campaign?.exactEndDate)
    .map(c => ({
      id: c.id,
      title: c.campaign!.title,
      brandName: c.campaign!.brandName || 'Brand',
      date: new Date(c.campaign!.exactEndDate!),
      compensation: c.proposedCompensation,
      currency: c.campaign!.currency || 'INR',
      isUrgent: c.isUrgent,
      daysUntil: c.daysUntilDeadline
    }))
    .filter(event => event.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <Card className="w-full" data-testid="compact-calendar">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No upcoming deadlines
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map(event => (
              <div 
                key={event.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors"
                onClick={() => onEventClick?.(event.id)}
                data-testid={`upcoming-event-${event.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    event.isUrgent ? "bg-red-500" : 
                    event.daysUntil && event.daysUntil < 2 ? "bg-orange-500" : "bg-blue-500"
                  )} />
                  
                  <div>
                    <div className="font-medium text-sm truncate max-w-[150px]">{event.title}</div>
                    <div className="text-xs text-gray-600">{event.brandName}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs font-medium">
                    {event.date.toLocaleDateString()}
                  </div>
                  <div className={cn(
                    "text-xs",
                    event.isUrgent && "text-red-600",
                    event.daysUntil && event.daysUntil < 2 && !event.isUrgent && "text-orange-600"
                  )}>
                    {event.daysUntil === 0 ? 'Today' : 
                     event.daysUntil === 1 ? 'Tomorrow' :
                     `${event.daysUntil} days`
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}