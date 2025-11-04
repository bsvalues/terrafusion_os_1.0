import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

type Notification = {
  id: string;
  type: string;
  userId: number;
  title: string;
  message: string;
  resourceId?: string;
  resourceType?: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
};

const NotificationTestPage: React.FC = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState("1");
  const [notificationType, setNotificationType] = useState("PHOTO_ENHANCEMENT_STARTED");
  const [title, setTitle] = useState("Photo Enhancement Started");
  const [message, setMessage] = useState(
    "We are enhancing your property photo. This may take a moment..."
  );
  const [resourceId, setResourceId] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Fetch existing notifications
  const { data: notifications, refetch } = useQuery<{
    success: boolean;
    notifications: Notification[];
  }>({
    queryKey: [`/api/notifications`, userId],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?userId=${userId}`);
      return response.json();
    },
    enabled: !!userId,
  });

  // Handle WebSocket connection
  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/notifications`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log("Notification WebSocket connected");
      setWsConnected(true);
      newSocket.send(
        JSON.stringify({
          type: "register",
          userId: parseInt(userId),
        })
      );
    };

    newSocket.onmessage = (event) => {
      console.log("Received notification:", event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
          toast({
            title: "New Notification",
            description: data.notification.title,
          });
          // Refresh the notifications list
          refetch();
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    newSocket.onclose = () => {
      console.log("Notification WebSocket disconnected");
      setWsConnected(false);
    };

    newSocket.onerror = (error) => {
      console.error("Notification WebSocket error:", error);
      setWsConnected(false);
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId, toast, refetch]);

  const sendTestNotification = async () => {
    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          type: notificationType,
          title,
          message,
          resourceId: resourceId || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Test Notification Sent",
          description: "The notification was sent successfully.",
        });
        // Refresh the notifications list
        refetch();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  const clearAllNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications/clear?userId=${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Notifications Cleared",
          description: "All notifications have been cleared.",
        });
        // Refresh the notifications list
        refetch();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to clear notifications",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: parseInt(userId),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Notification Marked as Read",
          description: "The notification has been marked as read.",
        });
        // Refresh the notifications list
        refetch();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to mark notification as read",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8"><>

      <h1 className="text-3xl font-bold mb-6">TerraField Mobile Notification Test</h1>

      <div
</> className="grid md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Send Test Notification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2"><>

                  <Label htmlFor="userId">User ID</Label>
                  <Input
</>
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="User ID"
                  />
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="notificationType">Notification Type</Label>
                  <Select
</> value={notificationType} onValueChange={setNotificationType}>
                    <SelectTrigger><>

                      <SelectValue placeholder="Select notification type" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="PHOTO_ENHANCEMENT_STARTED">
                        Photo Enhancement Started
                      </SelectItem>
                      <SelectItem
</> value="PHOTO_ENHANCEMENT_COMPLETED">
                        Photo Enhancement Completed
                      </SelectItem><>

                      <SelectItem value="PHOTO_ENHANCEMENT_FAILED">
                        Photo Enhancement Failed
                      </SelectItem>
                      <SelectItem
</> value="SYNC_STARTED">Sync Started</SelectItem><>

                      <SelectItem value="SYNC_COMPLETED">Sync Completed</SelectItem>
                      <SelectItem
</> value="SYNC_FAILED">Sync Failed</SelectItem><>

                      <SelectItem value="NEW_PHOTO_AVAILABLE">New Photo Available</SelectItem>
                      <SelectItem
</> value="OFFLINE_QUEUE_UPDATED">Offline Queue Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="title">Title</Label>
                  <Input
</>
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Notification title"
                  />
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="message">Message</Label>
                  <Textarea
</>
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Notification message"
                    rows={3}
                  />
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="resourceId">Resource ID (optional)</Label>
                  <Input
</>
                    id="resourceId"
                    value={resourceId}
                    onChange={(e) => setResourceId(e.target.value)}
                    placeholder="Resource ID (e.g., photo ID)"
                  />
                </div>

                <div className="pt-2 flex justify-between"><>

                  <Button onClick={sendTestNotification}>Send Notification</Button>
                  <div
</> className="flex items-center gap-2"><>

                    <div
                      className={`w-3 h-3 rounded-full ${wsConnected ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    <span
</> className="text-sm text-muted-foreground">
                      {wsConnected ? "WebSocket Connected" : "WebSocket Disconnected"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><>

              <CardTitle>Current Notifications</CardTitle>
              <Button
</> variant="outline" size="sm" onClick={clearAllNotifications}>
                Clear All
              </Button>
            </CardHeader>
            <CardContent>
              {notifications?.notifications?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {notifications?.notifications?.map((notification) => (
                    <div key={notification.id} className="p-4 border rounded-lg relative">
                      <div className="flex justify-between items-start">
                        <div><>

                          <h3 className="font-medium">{notification.title}</h3>
                          <p
</> className="text-sm text-muted-foreground">{notification.message}</p><>

                          <p className="text-xs text-muted-foreground mt-1">
                            Type: {notification.type}
                            {notification.resourceId &&
                              ` | Resource ID: ${notification.resourceId}`}
                          </p>
                          <p
</> className="text-xs text-muted-foreground mt-0.5">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            disabled={notification.read}
                          >
                            {notification.read ? "Read" : "Mark as Read"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationTestPage;
