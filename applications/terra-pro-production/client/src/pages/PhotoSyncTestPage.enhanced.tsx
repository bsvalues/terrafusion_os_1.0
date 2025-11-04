import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image, Upload, CheckCircle, AlertCircle, Refresh  } from '@mui/icons-material';
import { toast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/layout/page-layout";
import { useApp } from "@/contexts/AppContext";

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

export default function EnhancedPhotoSyncTestPage() {
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

  // Get global app context
  const { startLoading, stopLoading, setError } = useApp();

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

    startLoading("Fetching photos from server...");
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
    } catch (error: any) {
      console.error("Error fetching photos:", error);
      setSyncStatus(`Error: ${error.message || "Unknown error"}`);

      setError("Failed to load photos", error.message || "Unknown error");

      toast({
        title: "Error Loading Photos",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      stopLoading();
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

    startLoading(`Syncing photo ${photo.id}...`);
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
    } catch (error: any) {
      console.error("Error syncing photo:", error);
      const errorMsg = error.message || "Unknown error";
      setSyncStatus(`Error syncing photo: ${errorMsg}`);

      setError("Sync Error", `Failed to sync photo: ${errorMsg}`);

      // Mark the photo as having an error
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id
            ? {
                ...p,
                status: "error",
                errorMessage: errorMsg,
                lastSyncAttempt: new Date().toISOString(),
              }
            : p
        )
      );

      toast({
        title: "Sync Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      stopLoading();
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

    startLoading(`Syncing ${pendingUpdates.length} pending updates...`);
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
    } catch (error: any) {
      console.error("Error syncing updates:", error);
      const errorMsg = error.message || "Unknown error";
      setSyncStatus(`Error syncing updates: ${errorMsg}`);

      setError("Sync Error", `Failed to sync updates: ${errorMsg}`);

      toast({
        title: "Sync Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      stopLoading();
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
    <PageLayout
      title="TerraField Photo Sync"
      description="Test the photo synchronization feature for TerraField Mobile"
      showSyncStatus={true}
      actions={
        <div className="flex items-center gap-2"><>

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
          {pendingUpdates.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={syncAllPendingUpdates}
              disabled={offlineMode || loading}
            >
              <Refresh className="mr-2 h-4 w-4" />
              Sync All
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Photo Management</CardTitle>
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
                          disabled={pendingUpdates.length === 0 || offlineMode || loading}
                          className="w-full"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <Refresh className="mr-2 h-4 w-4" />
                              Sync All Pending Updates
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-lg font-medium mb-4">Photos</h3>
          {photos.length === 0 ? (
            <div className="text-center p-8 border rounded-lg bg-muted">
              <Image className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><>

              <h3 className="text-lg font-medium">No Photos</h3>
              <p
</> className="text-muted-foreground">
                {offlineMode
                  ? "You are in offline mode. Add new photos to store them locally."
                  : "No photos found for this report. Add new photos or load photos from the server."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="relative aspect-video bg-muted">
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge
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
                        {photo.status === "synced" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {photo.status === "syncing" && (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        )}
                        {photo.status === "error" && <AlertCircle className="h-3 w-3 mr-1" />}
                        {photo.status === "pending" && <Upload className="h-3 w-3 mr-1" />}
                        {photo.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4"><>

                    <h4 className="font-medium">{photo.caption}</h4>
                    <p
</> className="text-sm text-muted-foreground">ID: {photo.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(photo.dateTaken).toLocaleString()}
                    </p>
                    {photo.status === "error" && (
                      <p className="text-xs text-destructive mt-2">{photo.errorMessage}</p>
                    )}
                  </CardContent>
                  <CardFooter className="px-4 py-3 border-t bg-muted/50">
                    {photo.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => syncPhoto(photo)}
                        disabled={offlineMode}
                      >
                        <Refresh className="h-3 w-3 mr-2" />
                        Sync Now
                      </Button>
                    )}
                    {photo.status === "error" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => syncPhoto(photo)}
                        disabled={offlineMode}
                      >
                        <Refresh className="h-3 w-3 mr-2" />
                        Retry Sync
                      </Button>
                    )}
                    {(photo.status === "synced" || photo.status === "syncing") && (
                      <div className="w-full text-center text-xs text-muted-foreground">
                        {photo.isOffline ? "Stored locally" : "Synced with server"}
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
