import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bell, BellRing, Check, Clock, AlertCircle, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface CampaignNotificationsProps {
  userId?: string;
  showUnreadOnly?: boolean;
  maxHeight?: string;
}

export function CampaignNotifications({ 
  userId, 
  showUnreadOnly = false, 
  maxHeight = "h-96" 
}: CampaignNotificationsProps) {
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/notifications", { status: showUnreadOnly ? 'pending' : undefined }],
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest(`/api/notifications/${notificationId}/read`, "PUT");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const getNotificationIcon = (type: string, priority: string) => {
    const baseClasses = "w-5 h-5";
    
    switch (type) {
      case 'campaign_launched':
      case 'campaign_resumed':
        return <BellRing className={`${baseClasses} text-green-600`} />;
      case 'campaign_paused':
        return <Clock className={`${baseClasses} text-yellow-600`} />;
      case 'campaign_completed':
        return <Check className={`${baseClasses} text-blue-600`} />;
      case 'deadline_reminder':
      case 'payment_due':
        return <AlertCircle className={`${baseClasses} text-red-600`} />;
      case 'milestone_reached':
        return <BellRing className={`${baseClasses} text-purple-600`} />;
      default:
        return <Info className={`${baseClasses} text-gray-600`} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const unreadCount = notifications.filter(n => n.status !== 'read').length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={maxHeight}>
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-8 px-6">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div 
                    className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                      notification.status !== 'read' ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notificationType, notification.priority)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm text-gray-900">
                            {notification.title}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={`${getPriorityColor(notification.priority)} text-xs`}
                          >
                            {notification.priority}
                          </Badge>
                          {notification.status !== 'read' && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                          
                          {notification.status !== 'read' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              disabled={markAsReadMutation.isPending}
                              className="text-xs h-6"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Notification Bell Icon for Navigation/Header
export function NotificationBell() {
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications", { status: 'pending' }],
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </div>
  );
}