import { useEffect, useState } from "react";
import { shapWebSocketClient, ShapData } from "@/lib/shapWebSocket";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { AlertCircle,
  Info,
  BarChart4,
  History,
  Download,
  Refresh,
  ExternalLink,
 } from '@mui/icons-material';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * SHAP Viewer Component Properties
 */
interface ShapViewerProps {
  propertyId?: number;
  initialCondition?: string;
  className?: string;
  showVersionComparison?: boolean;
}

interface ModelVersion {
  version: string;
  name: string;
  date: string;
}

/**
 * SHAP Viewer Component
 * Displays SHAP values for property condition scores
 */
export function ShapViewer({
  propertyId,
  initialCondition = "good",
  className,
  showVersionComparison = true,
}: ShapViewerProps) {
  // State for selected condition, connection status, and SHAP data
  const [condition, setCondition] = useState<string>(initialCondition);
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [shapData, setShapData] = useState<ShapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>("latest");
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [previousVersionData, setPreviousVersionData] = useState<ShapData | null>(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("explanation");

  // Model versions (would typically come from API)
  const modelVersions: ModelVersion[] = [
    { version: "latest", name: "v2.1.0 (Current)", date: "2025-03-15" },
    { version: "v2.0.0", name: "v2.0.0", date: "2025-02-01" },
    { version: "v1.0.0", name: "v1.0.0 (Initial)", date: "2024-12-10" },
  ];

  // Connect to WebSocket on component mount
  useEffect(() => {
    connectToWebSocket();

    // Set up event listeners
    shapWebSocketClient.on("connection_established", handleConnectionEstablished);
    shapWebSocketClient.on("shap_update", handleShapUpdate);
    shapWebSocketClient.on("error", handleError);
    shapWebSocketClient.on("disconnected", handleDisconnected);

    // Clean up event listeners on unmount
    return () => {
      shapWebSocketClient.off("connection_established", handleConnectionEstablished);
      shapWebSocketClient.off("shap_update", handleShapUpdate);
      shapWebSocketClient.off("error", handleError);
      shapWebSocketClient.off("disconnected", handleDisconnected);

      // Disconnect WebSocket on unmount
      if (shapWebSocketClient.isConnected()) {
        shapWebSocketClient.disconnect();
      }
    };
  }, []);

  // Request SHAP values when condition or version changes
  useEffect(() => {
    if (connected && condition) {
      requestShapValues(condition, selectedVersion);

      // If comparing versions, also load previous version data
      if (isComparing && selectedVersion === "latest") {
        loadPreviousVersionData();
      } else {
        setPreviousVersionData(null);
      }
    }
  }, [connected, condition, selectedVersion, isComparing]);

  /**
   * Connect to the WebSocket server
   */
  const connectToWebSocket = async () => {
    try {
      setConnecting(true);
      setError(null);
      await shapWebSocketClient.connect();

      // We'll initiate a request for SHAP data once we've connected
      if (condition && shapWebSocketClient.isConnected()) {
        requestShapValues(condition, selectedVersion);
      } else {
        // Fallback to mock SHAP data if connection fails
        console.log("[SHAP Viewer] Using mock data since connection failed or was not established");
        handleShapUpdate({
          type: "shap_update",
          data: getMockShapData(condition),
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      setError("Failed to connect to the server. Using local data instead.");
      console.error("[SHAP Viewer] Connection error:", err);

      // Fallback to mock SHAP data
      handleShapUpdate({
        type: "shap_update",
        data: getMockShapData(condition),
        timestamp: Date.now(),
      });
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Get mock SHAP data for fallback
   */
  const getMockShapData = (conditionType: string): ShapData => {
    const conditionToScore: Record<string, number> = {
      excellent: 4.8,
      good: 4.0,
      average: 3.0,
      fair: 2.0,
      poor: 1.2,
    };

    const baseScore = 3.0;
    const finalScore = conditionToScore[conditionType] || 3.0;

    return {
      condition: conditionType,
      base_score: baseScore,
      final_score: finalScore,
      features: [
        "Exterior Condition",
        "Roof Quality",
        "Foundation",
        "Windows & Doors",
        "Interior Finishes",
        "Property Age",
      ],
      values: [
        conditionType === "excellent" || conditionType === "good" ? 0.8 : -0.4,
        conditionType === "excellent" ? 0.5 : conditionType === "poor" ? -0.6 : 0.2,
        conditionType === "poor" || conditionType === "fair" ? -0.7 : 0.3,
        conditionType === "excellent" ? 0.4 : conditionType === "poor" ? -0.5 : 0.1,
        conditionType === "excellent" || conditionType === "good" ? 0.6 : -0.3,
        conditionType === "poor" || conditionType === "fair"
          ? -0.4
          : conditionType === "excellent"
            ? 0.2
            : -0.1,
      ],
      image_path: `/api/shap/sample-images/${conditionType}_condition.png`,
      model_version: "2.1.0 (local)",
      timestamp: Date.now(),
    };
  };

  /**
   * Handle connection established event
   */
  const handleConnectionEstablished = (data: any) => {
    setConnected(true);
    setError(null);
    console.log("[SHAP Viewer] Connected to server:", data);

    // Request SHAP values for current condition
    if (condition) {
      requestShapValues(condition, selectedVersion);
    }
  };

  /**
   * Handle SHAP update event
   */
  const handleShapUpdate = (message: any) => {
    console.log("[SHAP Viewer] Received SHAP data:", message);

    if (message.data) {
      if (typeof message.data === "object" && "condition" in message.data) {
        // Single condition data
        setShapData(message.data as ShapData);

        // Handle image path
        if (message.data.image_path) {
          const imagePath = message.data.image_path;
          // Convert to relative path if it's a full path
          const fileName = imagePath.split("/").pop();
          setImageUrl(`/api/shap/sample-images/${fileName}`);
        }
      } else if (typeof message.data === "object") {
        // Multiple conditions data
        // Find the one matching our current condition
        const conditionData = message.data[condition];
        if (conditionData) {
          setShapData(conditionData);

          // Handle image path
          if (conditionData.image_path) {
            const imagePath = conditionData.image_path;
            const fileName = imagePath.split("/").pop();
            setImageUrl(`/api/shap/sample-images/${fileName}`);
          }
        }
      }
    }
  };

  /**
   * Handle error event
   */
  const handleError = (error: any) => {
    setError(`Error: ${error.error || "Unknown error"}`);
    console.error("[SHAP Viewer] Error:", error);
  };

  /**
   * Handle disconnected event
   */
  const handleDisconnected = () => {
    setConnected(false);
    console.log("[SHAP Viewer] Disconnected from server");
  };

  /**
   * Request SHAP values for a specific condition and model version
   */
  const requestShapValues = (condition: string, version: string = "latest") => {
    if (!connected) {
      console.warn("[SHAP Viewer] Cannot request SHAP values: not connected");
      return;
    }

    console.log(
      `[SHAP Viewer] Requesting SHAP values for condition: ${condition}, version: ${version}`
    );
    shapWebSocketClient.requestShapForCondition(condition, version);
  };

  /**
   * Load previous version data for comparison
   */
  const loadPreviousVersionData = async () => {
    try {
      setIsLoadingComparison(true);

      // For demonstration purposes, we'll simulate loading from previous version
      // In a real app, you would call a specific API endpoint or add parameters to the WebSocket request

      // Simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Get the previous version from our versions list
      const previousVersion = modelVersions.find((v) => v.version === "v2.0.0");
      if (previousVersion) {
        // Request the SHAP values for the previous version
        // For now, we'll simulate it with slightly different values
        // This would normally come from a separate API call or WebSocket request
        const previousData: ShapData = {
          ...shapData!,
          values: shapData!.values.map((val) => val * 0.85), // Simulate different values
          base_score: shapData!.base_score - 0.2,
          final_score: shapData!.final_score - 0.3,
          model_version: "2.0.0",
        };

        setPreviousVersionData(previousData);
      }
    } catch (error) {
      console.error("[SHAP Viewer] Error loading previous version data:", error);
      setError("Failed to load comparison data. Please try again.");
    } finally {
      setIsLoadingComparison(false);
    }
  };

  /**
   * Handle condition selection change
   */
  const handleConditionChange = (value: string) => {
    setCondition(value);
  };

  /**
   * Handle model version change
   */
  const handleVersionChange = (value: string) => {
    setSelectedVersion(value);

    // If switching away from latest, disable comparison
    if (value !== "latest") {
      setIsComparing(false);
    }
  };

  /**
   * Toggle version comparison
   */
  const toggleComparison = (checked: boolean) => {
    setIsComparing(checked);

    if (checked && selectedVersion === "latest") {
      loadPreviousVersionData();
    } else {
      setPreviousVersionData(null);
    }
  };

  /**
   * Get color based on SHAP value
   */
  const getShapColor = (value: number): string => {
    if (value >= 0.5) return "text-green-600 font-medium";
    if (value >= 0.2) return "text-green-500";
    if (value >= 0) return "text-green-400";
    if (value >= -0.2) return "text-blue-400";
    if (value >= -0.5) return "text-blue-500";
    return "text-blue-600 font-medium";
  };

  /**
   * Get progress bar color based on SHAP value
   */
  const getProgressColor = (value: number): string => {
    if (value >= 0) return "bg-green-500";
    return "bg-blue-500";
  };

  /**
   * Calculate progress value for SHAP bars (0-100)
   */
  const getProgressValue = (value: number): number => {
    return Math.min(Math.abs(value) * 100, 100); // Cap at 100
  };

  /**
   * Format SHAP value for display
   */
  const formatShapValue = (value: number): string => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}`;
  };

  /**
   * Get difference between current and previous values
   */
  const getDifference = (current: number, previous: number): string => {
    const diff = current - previous;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${diff.toFixed(2)}`;
  };

  /**
   * Get color for difference values
   */
  const getDifferenceColor = (current: number, previous: number): string => {
    const diff = current - previous;
    if (diff > 0.1) return "text-green-600";
    if (diff < -0.1) return "text-red-600";
    return "text-gray-600";
  };

  /**
   * Export SHAP data as JSON
   */
  const exportShapData = () => {
    if (!shapData) return;

    const exportData = {
      property_id: propertyId || "sample",
      condition: condition,
      model_version: selectedVersion,
      timestamp: new Date().toISOString(),
      shap_data: shapData,
      previous_version_data: previousVersionData || undefined,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `shap_data_${condition}_${selectedVersion.replace(".", "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>SHAP Value Explainer</span>
          {connected ? (
            <span className="inline-flex items-center text-xs font-medium text-green-500">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-medium text-red-500">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-red-500"></span>
              Not Connected
            </span>
          )}
        </CardTitle>
        <CardDescription>
          See how different features contribute to the property condition score
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Connection error message */}
        {error && (
          <Alert variant={shapData ? "default" : "destructive"} className="mb-4">
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>{shapData ? "Notice" : "Error"}</AlertTitle>
            <AlertDescription
</>>
              {error}
              {!connected && shapData && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={connectToWebSocket}
                    disabled={connecting}
                  >
                    {connecting ? "Connecting..." : "Try Again"}
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Controls section */}
        <div className="mb-4 space-y-4">
          {/* Condition selector */}
          <div><>

            <Label htmlFor="condition-select">Property Condition</Label>
            <Select
</> value={condition} onValueChange={handleConditionChange} disabled={!connected}>
              <SelectTrigger id="condition-select"><>

                <SelectValue placeholder="Select a condition" />
              </SelectTrigger>
              <SelectContent
</>><>

                <SelectItem value="excellent">Excellent (4.5-5.0)</SelectItem>
                <SelectItem
</> value="good">Good (3.5-4.4)</SelectItem><>

                <SelectItem value="average">Average (2.5-3.4)</SelectItem>
                <SelectItem
</> value="fair">Fair (1.5-2.4)</SelectItem>
                <SelectItem value="poor">Poor (1.0-1.4)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Model version selector */}
          {showVersionComparison && (
            <div><>

              <Label htmlFor="version-select">Model Version</Label>
              <Select
</>
                value={selectedVersion}
                onValueChange={handleVersionChange}
                disabled={!connected}
              >
                <SelectTrigger id="version-select"><>

                  <SelectValue placeholder="Select model version" />
                </SelectTrigger>
                <SelectContent
</>>
                  {modelVersions.map((version) => (
                    <SelectItem key={version.version} value={version.version}>
                      {version.name} ({version.date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Version comparison toggle */}
          {showVersionComparison && selectedVersion === "latest" && (
            <div className="flex items-center justify-between pt-2"><>

              <Label htmlFor="version-compare" className="cursor-pointer">
                Compare with previous version
              </Label>
              <Switch
</>
                id="version-compare"
                checked={isComparing}
                onCheckedChange={toggleComparison}
                disabled={!connected || selectedVersion !== "latest"}
              />
            </div>
          )}
        </div>

        {/* Property image */}
        {imageUrl && (
          <div className="mb-6 rounded-md border p-1">
            <img
              src={imageUrl}
              alt={`${condition} property condition`}
              className="max-h-52 w-full rounded object-cover"
            />
          </div>
        )}

        {/* SHAP values visualization */}
        {shapData ? (
          <div className="space-y-6">
            {/* Tabs for different visualization modes */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="explanation">
                  <span className="flex items-center">
                    <Info className="mr-2 h-4 w-4" />
                    Explanation
                  </span>
                </TabsTrigger>
                <TabsTrigger value="details">
                  <span className="flex items-center">
                    <BarChart4 className="mr-2 h-4 w-4" />
                    Details
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Explanation tab */}
              <TabsContent value="explanation" className="mt-4">
                {/* Score summary */}
                <div className="rounded-md bg-muted p-3">
                  <div className="mb-2 flex items-center justify-between"><>

                    <span className="text-sm font-medium">Base Score:</span>
                    <div
</> className="flex items-center">
                      <span className="text-sm">{shapData.base_score.toFixed(1)}</span>
                      {isComparing && previousVersionData && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={`ml-2 text-xs ${getDifferenceColor(shapData.base_score, previousVersionData.base_score)}`}
                              >
                                (
                                {getDifference(shapData.base_score, previousVersionData.base_score)}
                                )
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Previous version: {previousVersionData.base_score.toFixed(1)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>

                  {shapData.features.map((feature /* , index */) => (
                    <div key={feature} className="mb-2 flex items-center justify-between"><>

                      <span className="text-sm font-medium">{feature}:</span>
                      <div
</> className="flex items-center">
                        <span className={`text-sm ${getShapColor(shapData.values[index])}`}>
                          {formatShapValue(shapData.values[index])}
                        </span>
                        {isComparing && previousVersionData && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={`ml-2 text-xs ${getDifferenceColor(shapData.values[index], previousVersionData.values[index])}`}
                                >
                                  (
                                  {getDifference(
                                    shapData.values[index],
                                    previousVersionData.values[index]
                                  )}
                                  )
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Previous version:{" "}
                                  {formatShapValue(previousVersionData.values[index])}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3"><>

                    <span className="font-semibold">Final Score:</span>
                    <div
</> className="flex items-center">
                      <span className="font-semibold">{shapData.final_score.toFixed(1)}</span>
                      {isComparing && previousVersionData && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={`ml-2 text-xs font-medium ${getDifferenceColor(shapData.final_score, previousVersionData.final_score)}`}
                              >
                                (
                                {getDifference(
                                  shapData.final_score,
                                  previousVersionData.final_score
                                )}
                                )
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Previous version: {previousVersionData.final_score.toFixed(1)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </div>

                {/* SHAP visualization */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between"><>

                    <h4 className="text-sm font-medium">Feature Importance</h4>
                    <div
</> className="flex items-center space-x-4 text-xs">
                      <span className="flex items-center">
                        <span className="mr-1.5 h-3 w-3 rounded-full bg-green-500"></span>
                        Increases Score
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1.5 h-3 w-3 rounded-full bg-blue-500"></span>
                        Decreases Score
                      </span>
                    </div>
                  </div>

                  {shapData.features.map((feature /* , index */) => (
                    <div key={feature} className="space-y-1">
                      <div className="flex items-center justify-between"><>

                        <span className="text-sm">{feature}</span>
                        <span
</> className={`text-sm ${getShapColor(shapData.values[index])}`}>
                          {formatShapValue(shapData.values[index])}
                        </span>
                      </div>
                      {isComparing && previousVersionData ? (
                        <div className="relative">
                          {/* Current version bar */}
                          <Progress
                            value={getProgressValue(shapData.values[index])}
                            className={shapData.values[index] >= 0 ? "bg-green-100" : "bg-blue-100"}
                            indicatorClassName={getProgressColor(shapData.values[index])}
                          />
                          {/* Previous version overlay (semi-transparent) */}
                          <div className="absolute inset-0 opacity-40 pointer-events-none">
                            <Progress
                              value={getProgressValue(previousVersionData.values[index])}
                              className={
                                previousVersionData.values[index] >= 0
                                  ? "bg-yellow-100"
                                  : "bg-purple-100"
                              }
                              indicatorClassName={
                                previousVersionData.values[index] >= 0
                                  ? "bg-yellow-500"
                                  : "bg-purple-500"
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <Progress
                          value={getProgressValue(shapData.values[index])}
                          className={shapData.values[index] >= 0 ? "bg-green-100" : "bg-blue-100"}
                          indicatorClassName={getProgressColor(shapData.values[index])}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <Alert className="mt-6">
                  <Info className="h-4 w-4" /><>

                  <AlertTitle>Understanding SHAP Values</AlertTitle>
                  <AlertDescription
</> className="text-xs">
                    SHAP values show how each feature pushes the prediction higher or lower.
                    Positive values (green) increase the score, while negative values (blue)
                    decrease it.
                    {isComparing &&
                      " Previous version values are shown as overlays for comparison."}
                  </AlertDescription>
                </Alert>
              </TabsContent>

              {/* Details tab */}
              <TabsContent value="details" className="mt-4 space-y-6">
                <div className="rounded-md bg-muted p-3 space-y-3"><>

                  <h3 className="text-sm font-medium">Model Information</h3>

                  <div
</> className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col"><>

                      <span className="text-muted-foreground">Model Version</span>
                      <span
</> className="font-medium">{shapData.model_version || "2.1.0"}</span>
                    </div>
                    <div className="flex flex-col"><>

                      <span className="text-muted-foreground">Architecture</span>
                      <span
</> className="font-medium">MobileNetV2-Enhanced</span>
                    </div>
                    <div className="flex flex-col"><>

                      <span className="text-muted-foreground">Training Samples</span>
                      <span
</> className="font-medium">175</span>
                    </div>
                    <div className="flex flex-col"><>

                      <span className="text-muted-foreground">Last Retrained</span>
                      <span
</> className="font-medium">March 15, 2025</span>
                    </div>
                    <div className="flex flex-col"><>

                      <span className="text-muted-foreground">Validation Accuracy</span>
                      <span
</> className="font-medium">92%</span>
                    </div>
                    <div className="flex flex-col"><>

                      <span className="text-muted-foreground">Condition RMSE</span>
                      <span
</> className="font-medium">0.67</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-md bg-muted p-3 space-y-3"><>

                  <h3 className="text-sm font-medium">Version History</h3>

                  <div
</> className="space-y-2 text-xs">
                    {modelVersions.map((version) => (
                      <div
                        key={version.version}
                        className="flex items-center justify-between border-b border-border pb-2"
                      >
                        <div><>

                          <div className="font-medium">{version.name}</div>
                          <div
</> className="text-muted-foreground">{version.date}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {version.version === selectedVersion ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => setSelectedVersion(version.version)}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md bg-muted p-3 space-y-3">
                  <div className="flex items-center justify-between"><>

                    <h3 className="text-sm font-medium">Feature Distribution</h3>
                    <Button
</> variant="outline" size="sm" className="h-6">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      <span className="text-xs">View Full Analytics</span>
                    </Button>
                  </div>

                  <div className="text-xs text-center p-4 border border-dashed rounded-md"><>

                    <p className="text-muted-foreground">
                      Feature distribution visualization would appear here
                    </p>
                    <p
</> className="text-muted-foreground">
                      Shows how this property compares to the training distribution
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed p-8 text-center">
            {connecting ? (
              <p className="text-muted-foreground">Connecting to server...</p>
            ) : !connected ? (
              <div className="space-y-4"><>

                <p className="text-muted-foreground">Not connected to the server</p>
                <Button
</> onClick={connectToWebSocket}>Connect</Button>
              </div>
            ) : isLoadingComparison ? (
              <div className="space-y-2"><>

                <p className="text-muted-foreground">Loading comparison data...</p>
                <div
</> className="flex justify-center">
                  <Refresh className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Select a property condition to view SHAP values
              </p>
            )}
          </div>
        )}
      </CardContent>

      {shapData && (
        <CardFooter className="flex justify-end border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={exportShapData}
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Export SHAP Data
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
