import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image, Upload, CheckCircle, AlertCircle  } from '@mui/icons-material';
import { toast } from "@/hooks/use-toast";

// Mock types to simulate mobile app integration
interface PhotoMetadata {
  id: string;
  reportId: string;
  photoType: string;
  url: string;
  caption: string;
  dateTaken: string;
  latitude: number | null;
  longitude: number | null;
  isOffline: boolean;
  status: "pending" | "syncing" | "synced" | "error";
  localPath?: string;
  errorMessage?: string;
  lastSyncAttempt?: string;
}

// Mock function to encode update for simulation
function encodeUpdate(data: any): string {
  return btoa(JSON.stringify(data));
}

// Mock function to decode update for simulation
function decodeUpdate(encoded: string): any {
  return JSON.parse(atob(encoded));
}

export default function PhotoSyncTestPage() {
  const [reportId, setReportId] = useState<string>("1234");
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [caption, setCaption] = useState<string>("");
  const [offline, setOffline] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<string>("disconnected");
  const [pendingUpdates, setPendingUpdates] = useState<string[]>([]);
  const [localPhotoCount, setLocalPhotoCount] = useState<number>(0);

  // Simulate fetching initial data
  useEffect(() => {
    fetchPhotos();
  }, [reportId]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (offlineMode) {
      // Disconnect WebSocket in offline mode
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setWsStatus("offline-mode");
      }
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      ws.send(
        JSON.stringify({
          type: "join",
          reportId,
        })
      );
    };

    ws.onclose = () => {
      setWsStatus("disconnected");
    };

    ws.onerror = () => {
      setWsStatus("error");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "update" && message.photos) {
          setPhotos(message.photos);
          toast({
            title: "Real-time update received",
            description: `Received updates for ${message.photos.length} photos`,
          });
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [reportId, offlineMode]);

  // Fetch photos from the server
  const fetchPhotos = async () => {
    if (offlineMode) {
      toast({
        title: "Offline Mode",
        description: "Using locally cached data",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/sync/reports/${reportId}/photos`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setPhotos(data.photos || []);
      setSyncStatus("Fetched photos from server");

      toast({
        title: "Photos Loaded",
        description: `Successfully loaded ${data.photos.length} photos`,
      });
    } catch (error) {
      console.error("Error fetching photos:", error);
      setSyncStatus(`Error: ${error.message}`);

      toast({
        title: "Error Loading Photos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Simulate uploading a new photo
  const addNewPhoto = () => {
    // Generate a unique ID
    const newId = Math.floor(Math.random() * 1000000).toString();

    // Create a new photo metadata object
    const newPhoto: PhotoMetadata = {
      id: newId,
      reportId,
      photoType: "SUBJECT",
      url: offline ? "" : `https://picsum.photos/seed/${newId}/800/600`,
      caption: caption || `Photo ${newId}`,
      dateTaken: new Date().toISOString(),
      latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
      isOffline: offline,
      status: offline ? "pending" : "synced",
      localPath: offline ? `/local/path/photo_${newId}.jpg` : undefined,
    };

    // Add the new photo to the list
    setPhotos((prev) => [...prev, newPhoto]);
    setLocalPhotoCount((prev) => prev + 1);

    // If offline, store the update to be synced later
    if (offline) {
      const update = encodeUpdate({ type: "add", photo: newPhoto });
      setPendingUpdates((prev) => [...prev, update]);

      toast({
        title: "Photo Stored Locally",
        description: "This photo will be synced when you go online",
      });
    } else {
      syncPhoto(newPhoto);
    }

    // Reset the caption field
    setCaption("");

    toast({
      title: "Photo Added",
      description: offline
        ? "Photo saved locally (offline mode)"
        : "Photo added and synced with server",
    });
  };

  // Simulate syncing a photo with the server
  const syncPhoto = async (photo: PhotoMetadata) => {
    if (offlineMode) {
      toast({
        title: "Offline Mode",
        description: "Cannot sync in offline mode",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSyncStatus(`Syncing photo ${photo.id}...`);

    try {
      // Encode the update for transmission
      const update = encodeUpdate({ type: "add", photo });

      // Send the update to the server
      const response = await fetch(`/api/sync/reports/${reportId}/photos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ update }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Update the UI with the synced result
      setPhotos(result.photos || photos);
      setSyncStatus(`Successfully synced photo ${photo.id}`);

      toast({
        title: "Photo Synced",
        description: "Successfully synced with the server",
      });
    } catch (error) {
      console.error("Error syncing photo:", error);
      setSyncStatus(`Error syncing photo: ${error.message}`);

      // Mark the photo as having an error
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id
            ? {
                ...p,
                status: "error",
                errorMessage: error.message,
                lastSyncAttempt: new Date().toISOString(),
              }
            : p
        )
      );

      toast({
        title: "Sync Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Simulate syncing all pending updates
  const syncAllPendingUpdates = async () => {
    if (pendingUpdates.length === 0) {
      toast({
        title: "No Updates Pending",
        description: "There are no pending updates to sync",
      });
      return;
    }

    setLoading(true);
    setSyncStatus(`Syncing ${pendingUpdates.length} pending updates...`);

    try {
      // In a real implementation, we would merge these updates
      // and send them to the server in an optimized way
      // For the test UI, we'll just simulate a successful sync

      // Update status of photos from pending to synced
      setPhotos((prev) =>
        prev.map((p) => (p.status === "pending" ? { ...p, status: "synced", isOffline: false } : p))
      );

      // Clear pending updates
      setPendingUpdates([]);
      setLocalPhotoCount(0);

      setSyncStatus(`Successfully synced ${pendingUpdates.length} updates`);

      toast({
        title: "Sync Complete",
        description: "All pending updates have been synced",
      });
    } catch (error) {
      console.error("Error syncing updates:", error);
      setSyncStatus(`Error syncing updates: ${error.message}`);

      toast({
        title: "Sync Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle offline mode
  const toggleOfflineMode = () => {
    setOfflineMode(!offlineMode);

    toast({
      title: offlineMode ? "Online Mode" : "Offline Mode",
      description: offlineMode
        ? "Connected to server. Changes will sync immediately."
        : "Disconnected from server. Changes will be saved locally.",
    });
  };

  return (
    <div className="container mx-auto py-6"><>

      <h1 className="text-3xl font-bold mb-6">TerraField Mobile Integration Test</h1>

      <div
</> className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center"><>

                <span>Photo Sync Test</span>
                <div
</>><>

                  <Badge
                    className={`ml-2 ${
                      wsStatus === "connected"
                        ? "bg-green-500"
                        : wsStatus === "disconnected"
                          ? "bg-gray-500"
                          : wsStatus === "error"
                            ? "bg-red-500"
                            : wsStatus === "offline-mode"
                              ? "bg-amber-500"
                              : ""
                    }`}
                  >
                    {wsStatus}
                  </Badge>

                  <Badge
</>
                    variant={offlineMode ? "destructive" : "default"}
                    className="ml-2 cursor-pointer"
                    onClick={toggleOfflineMode}
                  >
                    {offlineMode ? "Offline" : "Online"}
                  </Badge>

                  {localPhotoCount > 0 && (
                    <Badge variant="outline" className="ml-2">
                      {localPhotoCount} local changes
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 mb-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3"><>

                    <Label htmlFor="reportId">Report ID</Label>
                    <Input
</>
                      id="reportId"
                      value={reportId}
                      onChange={(e) => setReportId(e.target.value)}
                      placeholder="Enter Report ID"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={fetchPhotos}
                      disabled={loading || offlineMode}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading
                        </>
                      ) : (
                        "Load Photos"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-2">
                  <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2"><>

                      <TabsTrigger value="upload">Add New Photo</TabsTrigger>
                      <TabsTrigger
</> value="sync">Sync Status</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload">
                      <Card>
                        <CardHeader>
                          <CardTitle>Add New Photo</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div><>

                              <Label htmlFor="caption">Photo Caption</Label>
                              <Input
</>
                                id="caption"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Enter photo caption"
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                id="saveOffline"
                                type="checkbox"
                                checked={offline}
                                onChange={() => setOffline(!offline)}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor="saveOffline">
                                Save offline (simulate no connectivity)
                              </Label>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button onClick={addNewPhoto} className="w-full">
                            <Upload className="mr-2 h-4 w-4" />
                            Add New Photo
                          </Button>
                        </CardFooter>
                      </Card>
                    </TabsContent>

                    <TabsContent value="sync">
                      <Card>
                        <CardHeader>
                          <CardTitle>Sync Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div><>

                              <Label>Status</Label>
                              <div
</> className="p-2 border rounded bg-muted">
                                {syncStatus || "No sync activity yet"}
                              </div>
                            </div>

                            <div><>

                              <Label>Pending Updates</Label>
                              <div
</> className="p-2 border rounded bg-muted">
                                {pendingUpdates.length > 0 ? (
                                  <div>{pendingUpdates.length} update(s) pending</div>
                                ) : (
                                  "No pending updates"
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            onClick={syncAllPendingUpdates}
                            disabled={pendingUpdates.length === 0 || loading}
                            className="w-full"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Sync All Pending Updates
                          </Button>
                        </CardFooter>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                Photos
                <Badge className="ml-2">{photos.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : photos.length > 0 ? (
                <div className="space-y-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2"><>

                        <h3 className="font-semibold">{photo.caption}</h3>
                        <Badge
</>
                          variant={
                            photo.status === "synced"
                              ? "default"
                              : photo.status === "pending"
                                ? "outline"
                                : photo.status === "syncing"
                                  ? "secondary"
                                  : "destructive"
                          }
                        >
                          {photo.status}
                        </Badge>
                      </div>

                      <div className="mb-2">
                        {photo.url ? (
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            className="w-full h-32 object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-32 bg-muted flex items-center justify-center rounded">
                            <Image className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground"><>

                        <div>ID: {photo.id}</div>
                        <div
</>>Date: {new Date(photo.dateTaken).toLocaleString()}</div>
                        {photo.latitude && photo.longitude && (
                          <div>
                            Location: {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
                          </div>
                        )}
                        {photo.status === "error" && (
                          <div className="text-red-500">{photo.errorMessage}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                  <Image className="h-10 w-10 mb-2" /><>

                  <p>No photos found</p>
                  <p
</> className="text-xs">Add a photo or load from server</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
