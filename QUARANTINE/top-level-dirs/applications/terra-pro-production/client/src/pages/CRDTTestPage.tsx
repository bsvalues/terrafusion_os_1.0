import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// This component tests the CRDT implementation with both REST API and WebSocket
export default function CRDTTestPage() {
  const [parcelId, setParcelId] = useState<string>("TEST001");
  const [noteText, setNoteText] = useState<string>("");
  const [author, setAuthor] = useState<string>("Test User");
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");
  const [lastUpdate, setLastUpdate] = useState<string>("Never");
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Add a log message and keep only the last 20 messages
  const addLog = (message: string) => {
    setLogMessages((prev) => {
      const newLogs = [...prev, `${new Date().toLocaleTimeString()} - ${message}`];
      return newLogs.slice(-20); // Keep only the last 20 messages
    });
  };

  // Connect to WebSocket server
  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      addLog("Already connected to WebSocket server");
      return;
    }

    try {
      // Determine the correct protocol and create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      addLog(`Connecting to WebSocket at ${wsUrl}...`);

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setConnectionStatus("Connected");
        addLog("WebSocket connection established");

        // Join the parcel channel
        if (wsRef.current && parcelId) {
          wsRef.current.send(
            JSON.stringify({
              type: "join",
              parcelId,
            })
          );
          addLog(`Joined parcel: ${parcelId}`);
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addLog(`Received WebSocket message: ${data.type}`);

          if (data.type === "init") {
            // Initial data from server
            setNoteText(data.data.notes || "");
            setAuthor(data.data.author || "Test User");
            setLastUpdate(data.data.lastModified || new Date().toISOString());
            addLog("Initialized with server data");
          } else if (data.type === "update") {
            // Update from another client
            setNoteText(data.data.notes || "");
            setAuthor(data.data.author || "Test User");
            setLastUpdate(data.data.lastModified || new Date().toISOString());
            addLog("Received update from another client");
          }
        } catch (error) {
          addLog(`Error parsing WebSocket message: ${error}`);
        }
      };

      wsRef.current.onclose = () => {
        setConnectionStatus("Disconnected");
        addLog("WebSocket connection closed");
      };

      wsRef.current.onerror = (error) => {
        setConnectionStatus("Error");
        addLog(`WebSocket error: ${error}`);
      };
    } catch (error) {
      addLog(`Error creating WebSocket connection: ${error}`);
    }
  };

  // Disconnect from WebSocket server
  const disconnectWebSocket = () => {
    if (!wsRef.current) {
      addLog("No WebSocket connection exists");
      return;
    }

    try {
      // Leave the parcel channel
      if (wsRef.current.readyState === WebSocket.OPEN && parcelId) {
        wsRef.current.send(
          JSON.stringify({
            type: "leave",
            parcelId,
          })
        );
      }

      wsRef.current.close();
      wsRef.current = null;
      setConnectionStatus("Disconnected");
      addLog("WebSocket connection closed");
    } catch (error) {
      addLog(`Error disconnecting WebSocket: ${error}`);
    }
  };

  // Load the initial parcel note data using REST API
  const loadParcelNote = async () => {
    if (!parcelId) {
      toast({
        title: "Error",
        description: "Parcel ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      addLog(`Loading parcel note data for: ${parcelId}`);
      const response = await fetch(`/api/parcels/${parcelId}/notes`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      setNoteText(data.notes || "");
      setAuthor(data.author || "Test User");
      setLastUpdate(data.lastModified || new Date().toISOString());

      addLog("Successfully loaded parcel note data");

      toast({
        title: "Success",
        description: "Parcel note data loaded",
      });
    } catch (error) {
      addLog(`Error loading parcel note: ${error}`);

      toast({
        title: "Error",
        description: `Failed to load parcel note: ${error}`,
        variant: "destructive",
      });
    }
  };

  // Save the parcel note data using REST API
  const saveParcelNote = async () => {
    if (!parcelId) {
      toast({
        title: "Error",
        description: "Parcel ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      addLog(`Saving parcel note data for: ${parcelId}`);

      const updateData = {
        notes: noteText,
        author: author,
        lastModified: new Date().toISOString(),
      };

      const response = await fetch(`/api/parcels/${parcelId}/notes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setLastUpdate(data.lastModified);

      addLog("Successfully saved parcel note data");

      toast({
        title: "Success",
        description: "Parcel note data saved",
      });
    } catch (error) {
      addLog(`Error saving parcel note: ${error}`);

      toast({
        title: "Error",
        description: `Failed to save parcel note: ${error}`,
        variant: "destructive",
      });
    }
  };

  // Send an update via WebSocket
  const sendWebSocketUpdate = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog("WebSocket not connected");
      toast({
        title: "Error",
        description: "WebSocket not connected",
        variant: "destructive",
      });
      return;
    }

    if (!parcelId) {
      addLog("Parcel ID is required");
      toast({
        title: "Error",
        description: "Parcel ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      addLog("Sending update via WebSocket");

      // In a real implementation, we would encode the CRDT update here
      // For this test, we'll just send a mock update
      const mockUpdate = {
        type: "update",
        parcelId,
        update: btoa(
          JSON.stringify({
            notes: noteText,
            author,
            lastModified: new Date().toISOString(),
          })
        ),
      };

      wsRef.current.send(JSON.stringify(mockUpdate));
      setLastUpdate(new Date().toISOString());

      addLog("Update sent via WebSocket");

      toast({
        title: "Success",
        description: "Update sent via WebSocket",
      });
    } catch (error) {
      addLog(`Error sending WebSocket update: ${error}`);

      toast({
        title: "Error",
        description: `Failed to send WebSocket update: ${error}`,
        variant: "destructive",
      });
    }
  };

  // Connect WebSocket when component mounts
  useEffect(() => {
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Reconnect WebSocket when parcelId changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Leave the previous parcel channel
      wsRef.current.send(
        JSON.stringify({
          type: "leave",
        })
      );

      // Join the new parcel channel
      wsRef.current.send(
        JSON.stringify({
          type: "join",
          parcelId,
        })
      );

      addLog(`Switched to parcel: ${parcelId}`);
    }
  }, [parcelId]);

  return (
    <div className="container mx-auto p-4"><>

      <h1 className="text-3xl font-bold mb-6">TerraField Mobile CRDT Test</h1>

      <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><>

            <CardTitle>Parcel Note Editor</CardTitle>
            <CardDescription
</>>
              Edit notes for a specific parcel ID using CRDT synchronization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5"><>

                <Label htmlFor="parcelId">Parcel ID</Label>
                <Input
</>
                  id="parcelId"
                  value={parcelId}
                  onChange={(e) => setParcelId(e.target.value)}
                  placeholder="Enter parcel ID (e.g., TEST001)"
                />
              </div>

              <div className="grid w-full items-center gap-1.5"><>

                <Label htmlFor="author">Author</Label>
                <Input
</>
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="grid w-full items-center gap-1.5"><>

                <Label htmlFor="notes">Notes</Label>
                <Textarea
</>
                  id="notes"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter notes about this parcel..."
                  rows={8}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="w-full flex justify-between items-center text-sm text-muted-foreground">
              <span>
                Connection:{" "}
                <span
                  className={connectionStatus === "Connected" ? "text-green-500" : "text-red-500"}
                >
                  {connectionStatus}
                </span>
              </span>
              <span>Last update: {new Date(lastUpdate).toLocaleString()}</span>
            </div>
            <div className="w-full grid grid-cols-2 gap-4"><>

              <Button onClick={loadParcelNote} variant="outline">
                Load via REST
              </Button>
              <Button
</> onClick={saveParcelNote} variant="outline">
                Save via REST
              </Button>
            </div>
            <div className="w-full grid grid-cols-2 gap-4"><>

              <Button
                onClick={connectWebSocket}
                variant="default"
                disabled={connectionStatus === "Connected"}
              >
                Connect WebSocket
              </Button>
              <Button
</>
                onClick={disconnectWebSocket}
                variant="destructive"
                disabled={connectionStatus !== "Connected"}
              >
                Disconnect WebSocket
              </Button>
            </div>
            <Button
              onClick={sendWebSocketUpdate}
              className="w-full"
              disabled={connectionStatus !== "Connected"}
            >
              Send Update via WebSocket
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader><>

            <CardTitle>Event Log</CardTitle>
            <CardDescription
</>>Real-time log of synchronization events</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full border rounded-md p-4">
              {logMessages.map((message /* , index */) => (
                <div key={index} className="py-1">
                  <span className="text-xs text-muted-foreground font-mono">{message}</span>
                  {index < logMessages.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
              {logMessages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <span className="text-muted-foreground">No events logged yet</span>
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLogMessages([])} variant="outline" className="w-full">
              Clear Log
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
