import React, { useState } from "react";
import { useBasicWebSocket } from "../contexts/BasicWebSocketContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Info, Wifi, WifiOff  } from '@mui/icons-material';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const BasicWebSocketTestPage: React.FC = () => {
  const { connected, messages, sendMessage, lastMessage, usingFallback } = useBasicWebSocket();
  const [messageText, setMessageText] = useState("");

  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage({
        type: "chat",
        message: messageText,
        timestamp: Date.now(),
      });
      setMessageText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Get connection display information
  const getConnectionStatus = () => {
    if (!connected) {
      return {
        label: "Disconnected",
        variant: "destructive" as const,
        icon: <WifiOff className="h-4 w-4 mr-1" />,
      };
    }

    if (usingFallback) {
      return {
        label: "Connected (Fallback)",
        variant: "default" as const,
        icon: <Info className="h-4 w-4 mr-1" />,
      };
    }

    return {
      label: "Connected (WebSocket)",
      variant: "success" as const,
      icon: <Wifi className="h-4 w-4 mr-1" />,
    };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Basic WebSocket Test
            <Badge variant={connectionStatus.variant} className="flex items-center">
              {connectionStatus.icon}
              {connectionStatus.label}
            </Badge>
          </CardTitle>
          <CardDescription>
            Testing WebSocket implementation with automatic HTTP fallback
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {usingFallback && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4" /><>

                <AlertTitle>Using fallback connection mode</AlertTitle>
                <AlertDescription
</>>
                  WebSocket connection was not available, so the system is using HTTP long polling
                  as a reliable fallback. All functionality will continue to work, but with slightly
                  higher latency.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2"><>

              <Button
                onClick={() => sendMessage({ type: "ping", timestamp: Date.now() })}
                disabled={!connected}
              >
                Send Ping
              </Button>

              <Button
</>
                onClick={() =>
                  sendMessage({ type: "echo", message: "Hello Server!", timestamp: Date.now() })
                }
                variant="outline"
                disabled={!connected}
              >
                Send Echo
              </Button>

              <Button
                onClick={() =>
                  sendMessage({
                    type: "notification",
                    message: "Test notification",
                    importance: "info",
                    timestamp: Date.now(),
                  })
                }
                variant="secondary"
                disabled={!connected}
              >
                Test Notification
              </Button>
            </div>

            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="text-sm font-medium mb-2">Last Message:</h3>
              {lastMessage ? (
                <pre className="text-xs bg-card p-2 rounded overflow-x-auto">
                  {JSON.stringify(lastMessage, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground italic">No messages received yet</p>
              )}
            </div>

            <div><>

              <h3 className="text-sm font-medium mb-2">Message History:</h3>
              <ScrollArea
</> className="h-60 rounded-md border">
                {messages.length > 0 ? (
                  <div className="p-4 space-y-2">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`rounded p-2 text-xs ${
                          msg.type === "error"
                            ? "bg-red-50 border border-red-200"
                            : msg.type === "notification"
                              ? "bg-blue-50 border border-blue-200"
                              : "bg-card"
                        }`}
                      >
                        <div className="flex justify-between text-muted-foreground mb-1"><>

                          <span className="font-medium">{msg.type}</span>
                          <span
</>>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        {msg.message && <div className="mb-2 font-medium">{msg.message}</div>}
                        <pre className="overflow-x-auto text-xs opacity-80">
                          {JSON.stringify(msg, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground italic">
                    No message history
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <div className="flex w-full space-x-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message to send..."
              disabled={!connected}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!connected || !messageText.trim()}
              className="whitespace-nowrap"
            >
              Send Message
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BasicWebSocketTestPage;
