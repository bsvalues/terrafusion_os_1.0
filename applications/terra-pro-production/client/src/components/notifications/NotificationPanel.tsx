import React, { useState } from "react";
import { AlertCircle,
  Bell,
  Brain,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Image,
  Info,
  Lightbulb,
  MoreHorizontal,
  Zap,
 } from '@mui/icons-material';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface Notification {
  id: string;
  type: "alert" | "reminder" | "update" | "insight" | "compliance" | "market";
  message: string;
  date: string;
  read: boolean;
  importance?: "high" | "medium" | "low";
  aiGenerated?: boolean;
  data?: any;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  className?: string;
}

/**
 * NotificationPanel - AI-enhanced notification system for the appraisal workflow
 */
const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  className,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Count unread notifications
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Filter high importance AI notifications for quick access
  const highImportanceAI = notifications.filter(
    (notification) =>
      notification.importance === "high" && notification.aiGenerated && !notification.read
  );

  // Helper function to get the appropriate icon for a notification type
  const getNotificationIcon = (type: string, aiGenerated?: boolean) => {
    switch (type) {
      case "alert":
        return aiGenerated ? (
          <Brain className="h-4 w-4 text-red-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-500" />
        );
      case "reminder":
        return aiGenerated ? (
          <Brain className="h-4 w-4 text-amber-500" />
        ) : (
          <Calendar className="h-4 w-4 text-amber-500" />
        );
      case "update":
        return aiGenerated ? (
          <Brain className="h-4 w-4 text-blue-500" />
        ) : (
          <Info className="h-4 w-4 text-blue-500" />
        );
      case "insight":
        return <Lightbulb className="h-4 w-4 text-primary" />;
      case "compliance":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "market":
        return <Zap className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Helper function to format the notification date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  return (
    <Card
      className={`w-full transition-all duration-300 ease-in-out border-primary/20 ${expanded ? "shadow-md" : ""} ${className || ""}`}
    >
      <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-5 w-5 text-primary" />
            {unreadCount > 0 && (
              <div className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] px-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                {unreadCount}
              </div>
            )}
          </div>
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              AI-Powered Notifications
              {unreadCount > 0 && (
                <Badge
                  variant="outline"
                  className="h-5 text-[10px] bg-primary/5 text-primary border-primary/20"
                >
                  {unreadCount} New
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Real-time insights and updates for your appraisals
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end"><>

              <DropdownMenuLabel className="text-xs">Notification Settings</DropdownMenuLabel>
              <DropdownMenuSeparator
</> />
              <DropdownMenuItem onClick={onMarkAllAsRead} className="text-xs"><>

                <Check className="mr-2 h-3.5 w-3.5" />
                Mark all as read
              </DropdownMenuItem>
              <DropdownMenuItem
</> className="text-xs"><>

                <Brain className="mr-2 h-3.5 w-3.5 text-primary" />
                AI notification preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator
</> />
              <DropdownMenuItem className="text-xs">
                <Bell className="mr-2 h-3.5 w-3.5" />
                Configure alert settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Quick Actions for High-Priority AI notifications */}
      {!expanded && highImportanceAI.length > 0 && (
        <CardContent className="px-4 py-3 pt-0">
          <div className="space-y-2">
            {highImportanceAI.slice(0, 1).map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-2 p-2 rounded-md bg-primary/5 border border-primary/15"
              ><>

                <div className="mt-0.5">
                  {getNotificationIcon(notification.type, notification.aiGenerated)}
                </div>
                <div
</> className="flex-1 text-xs">
                  <div className="font-medium mb-0.5 flex items-center gap-1.5"><>

                    <span>AI Insight</span>
                    <Badge
</> className="h-4 text-[10px] bg-primary/20 text-primary border-primary/20">
                      High Priority
                    </Badge>
                  </div><>

                  <p>{notification.message}</p>
                  <div
</> className="flex items-center gap-2 mt-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] border-primary/20 text-primary"
                      onClick={() => onMarkAsRead(notification.id)}
                    ><>

                      <Zap className="h-3 w-3 mr-1" />
                      Take action
                    </Button>
                    <Button
</>
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px]"
                      onClick={() => onDismiss(notification.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {highImportanceAI.length > 1 && (
              <Button
                variant="ghost"
                className="w-full text-xs text-primary h-6"
                onClick={() => setExpanded(true)}
              >
                +{highImportanceAI.length - 1} more AI insights
              </Button>
            )}
          </div>
        </CardContent>
      )}

      {/* Expanded View with all notifications */}
      {expanded && (
        <CardContent className="px-4 pt-0 pb-3">
          <ScrollArea className="h-[320px] pr-3">
            <div className="space-y-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Brain className="h-8 w-8 text-muted-foreground mb-2 opacity-50" /><>

                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                  <p
</> className="text-xs text-muted-foreground mt-1">
                    AI insights and updates will appear here
                  </p>
                </div>
              ) : (
                notifications.map((notification /* , index */) => (
                  <div key={notification.id}>
                    <div
                      className={`flex items-start gap-2 p-2 rounded-md transition-colors ${
                        !notification.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted"
                      }`}
                    ><>

                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type, notification.aiGenerated)}
                      </div>
                      <div
</> className="flex-1 text-xs">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium capitalize">
                              {notification.aiGenerated ? "AI " : ""}
                              {notification.type}
                            </span>
                            {notification.importance === "high" && (
                              <Badge
                                variant="outline"
                                className="h-4 text-[10px] border-red-200 text-red-600 bg-red-50"
                              >
                                High
                              </Badge>
                            )}
                            {!notification.read && (
                              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(notification.date)}
                          </span>
                        </div><>

                        <p className={!notification.read ? "font-medium" : ""}>
                          {notification.message}
                        </p>
                        <div
</> className="flex items-center gap-2 mt-1.5">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px]"
                              onClick={() => onMarkAsRead(notification.id)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Mark as read
                            </Button>
                          )}
                          {notification.type === "insight" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] border-primary/20 text-primary"
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Apply insight
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px]"
                            onClick={() => onDismiss(notification.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator className="my-1" />}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      )}

      {expanded && (
        <CardFooter className="px-4 py-2 flex justify-between border-t">
          <Button variant="ghost" size="sm" className="text-xs" onClick={onMarkAllAsRead}><>

            <Check className="h-3.5 w-3.5 mr-1.5" />
            Mark all as read
          </Button>
          <Button
</> variant="outline" size="sm" className="text-xs border-primary/20 text-primary">
            <Brain className="h-3.5 w-3.5 mr-1.5" />
            AI Notification Settings
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default NotificationPanel;
