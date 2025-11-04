/**
 * AgentAssistantShapConnector Component
 * Connects the Agent Assistant Panel to the SHAP explanation system
 */
import { useEffect, useState } from "react";
import { shapWebSocketClient, ShapData } from "@/lib/shapWebSocket";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3, AlertCircle, Info, Settings, Download, Refresh  } from '@mui/icons-material';
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AgentAssistantShapConnectorProps {
  propertyId?: number;
  imageUrl?: string;
  condition?: string;
  modelVersion?: string;
  onInsightGenerated?: (insights: any) => void;
}

export function AgentAssistantShapConnector({
  propertyId,
  imageUrl,
  condition = "good",
  modelVersion = "latest",
  onInsightGenerated,
}: AgentAssistantShapConnectorProps) {
  // SHAP connection states
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [shapData, setShapData] = useState<ShapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [explanationRequested, setExplanationRequested] = useState(false);

  // Connect to SHAP WebSocket on component mount
  useEffect(() => {
    connectToShapWebSocket();

    // Set up event listeners for SHAP WebSocket
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

  // Request SHAP values when condition or image URL changes
  useEffect(() => {
    if (connected && (condition || imageUrl)) {
      requestShapExplanation();
    }
  }, [connected, condition, imageUrl, modelVersion]);

  // Generate insights when SHAP data is updated
  useEffect(() => {
    if (shapData) {
      generateInsightsFromShap(shapData);
    }
  }, [shapData]);

  /**
   * Connect to the SHAP WebSocket server
   */
  const connectToShapWebSocket = async () => {
    try {
      setConnecting(true);
      setError(null);
      await shapWebSocketClient.connect();
    } catch (err) {
      setError("Failed to connect to the explanation service. Insights will be limited.");
      console.error("[Agent Assistant] SHAP connection error:", err);
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Handle SHAP WebSocket connection established
   */
  const handleConnectionEstablished = (data: any) => {
    console.log("[Agent Assistant] Connected to SHAP service:", data);
    setConnected(true);
    setError(null);

    // Request SHAP explanation if we have condition or image URL
    if (condition || imageUrl) {
      requestShapExplanation();
    }
  };

  /**
   * Handle SHAP update from WebSocket
   */
  const handleShapUpdate = (message: any) => {
    console.log("[Agent Assistant] Received SHAP data:", message);

    if (message.data) {
      if (typeof message.data === "object" && "condition" in message.data) {
        // Single condition data
        setShapData(message.data as ShapData);
      } else if (typeof message.data === "object") {
        // Multiple conditions data
        // Find the one matching our current condition
        const conditionData = message.data[condition];
        if (conditionData) {
          setShapData(conditionData);
        }
      }
    }
  };

  /**
   * Handle error from SHAP WebSocket
   */
  const handleError = (error: any) => {
    setError(`Error: ${error.error || "Unknown error in explanation service"}`);
    console.error("[Agent Assistant] SHAP error:", error);
  };

  /**
   * Handle SHAP WebSocket disconnection
   */
  const handleDisconnected = () => {
    setConnected(false);
    console.log("[Agent Assistant] Disconnected from SHAP service");
  };

  /**
   * Request SHAP explanation for current property
   */
  const requestShapExplanation = async () => {
    console.log(
      `[Agent Assistant] Requesting SHAP explanation for: ${condition}, version: ${modelVersion}`
    );
    setExplanationRequested(true);
    setError(null);

    try {
      // Our updated shapWebSocketClient will handle connection failures gracefully
      await shapWebSocketClient.requestShapForCondition(
        condition || "good",
        modelVersion || "latest"
      );
    } catch (error) {
      console.error("[Agent Assistant] Error requesting SHAP explanation:", error);
      setError("Could not connect to SHAP service. Using offline analysis mode.");
    }
  };

  /**
   * Generate natural language insights from SHAP data
   */
  const generateInsightsFromShap = (data: ShapData) => {
    // Sort features by absolute SHAP value to get most important features
    const sortedFeatures = [...data.features]
      .map((feature /* , index */) => ({ feature, value: data.values[index] }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    // Generate insights
    const newInsights: string[] = [];

    // Overall condition insight
    newInsights.push(
      `This property has an overall condition score of ${data.final_score.toFixed(1)}/5.0, indicating ${getConditionDescription(data.final_score)}.`
    );

    // Top positive feature
    const topPositive = sortedFeatures.find((f) => f.value > 0);
    if (topPositive) {
      newInsights.push(
        `The ${topPositive.feature.toLowerCase()} is a key strength, improving the condition score by ${topPositive.value.toFixed(2)} points.`
      );
    }

    // Top negative feature
    const topNegative = sortedFeatures.find((f) => f.value < 0);
    if (topNegative) {
      newInsights.push(
        `The ${topNegative.feature.toLowerCase()} is an area of concern, decreasing the condition score by ${Math.abs(topNegative.value).toFixed(2)} points.`
      );
    }

    // Add recommendation based on the worst feature
    if (topNegative) {
      newInsights.push(
        `Recommendation: Consider improvements to the ${topNegative.feature.toLowerCase()} to increase the property's value assessment.`
      );
    }

    // Model version insight
    if (data.model_version) {
      newInsights.push(
        `This analysis was performed using model version ${data.model_version}, which is ${modelVersion === "latest" ? "the latest available version" : "a previous model version"}.`
      );
    }

    setInsights(newInsights);

    // Call the callback if provided
    if (onInsightGenerated) {
      onInsightGenerated({
        condition_score: data.final_score,
        condition_category: getConditionCategory(data.final_score),
        key_strengths: sortedFeatures.filter((f) => f.value > 0).map((f) => f.feature),
        key_concerns: sortedFeatures.filter((f) => f.value < 0).map((f) => f.feature),
        recommendations: topNegative ? [`Improve ${topNegative.feature}`] : [],
        model_version: data.model_version || modelVersion,
      });
    }
  };

  /**
   * Get condition description based on score
   */
  const getConditionDescription = (score: number): string => {
    if (score >= 4.5) return "excellent condition";
    if (score >= 3.5) return "good condition";
    if (score >= 2.5) return "average condition";
    if (score >= 1.5) return "fair condition";
    return "poor condition";
  };

  /**
   * Get condition category based on score
   */
  const getConditionCategory = (score: number): string => {
    if (score >= 4.5) return "excellent";
    if (score >= 3.5) return "good";
    if (score >= 2.5) return "average";
    if (score >= 1.5) return "fair";
    return "poor";
  };

  /**
   * Get color for feature value
   */
  const getFeatureColor = (value: number): string => {
    if (value >= 0.5) return "text-green-600 font-medium";
    if (value >= 0.2) return "text-green-500";
    if (value >= 0) return "text-green-400";
    if (value >= -0.2) return "text-blue-400";
    if (value >= -0.5) return "text-blue-500";
    return "text-blue-600 font-medium";
  };

  /**
   * Get CSS variable for progress bar color based on value
   * Note: This is applied through inline styles instead of className
   */
  const getProgressColor = (value: number): string => {
    if (value >= 0) return "var(--green-500)";
    return "var(--blue-500)";
  };

  /**
   * Calculate progress value (0-100)
   */
  const getProgressValue = (value: number): number => {
    return Math.min(Math.abs(value) * 100, 100);
  };

  /**
   * Format SHAP value for display
   */
  const formatShapValue = (value: number): string => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!shapData && !error && (
        <div className="rounded-md border border-dashed p-6 text-center">
          {connecting || explanationRequested ? (
            <div className="space-y-3">
              <Refresh className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Generating condition insights...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Info className="mx-auto h-6 w-6 text-muted-foreground" /><>

              <p className="text-sm text-muted-foreground">
                Select a property image or condition to view AI analysis
              </p>
              <Button
</>
                variant="outline"
                size="sm"
                onClick={requestShapExplanation}
                disabled={!connected}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analyze Condition
              </Button>
            </div>
          )}
        </div>
      )}

      {shapData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><>

              <h3 className="text-lg font-medium">Condition Analysis</h3>
              <p
</> className="text-sm text-muted-foreground">AI-powered property assessment</p>
            </div>
            <Badge variant={connected ? "default" : "destructive"} className="px-2 py-1">
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          <Card>
            <CardHeader className="pb-2"><>

              <CardTitle className="text-lg">
                Overall Score: {shapData.final_score.toFixed(1)}/5.0
              </CardTitle>
              <CardDescription
</>>{getConditionDescription(shapData.final_score)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Accordion type="single" collapsible defaultValue="features">
                  <AccordionItem value="features"><>

                    <AccordionTrigger>Feature Breakdown</AccordionTrigger>
                    <AccordionContent
</>>
                      <div className="space-y-3 pt-2">
                        {shapData.features.map((feature /* , index */) => (
                          <div key={feature} className="space-y-1">
                            <div className="flex items-center justify-between"><>

                              <Label className="text-sm">{feature}</Label>
                              <TooltipProvider
</>>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className={`text-sm ${getFeatureColor(shapData.values[index])}`}
                                    >
                                      {formatShapValue(shapData.values[index])}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {shapData.values[index] >= 0
                                        ? `Increases score by ${shapData.values[index].toFixed(2)}`
                                        : `Decreases score by ${Math.abs(shapData.values[index]).toFixed(2)}`}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Progress
                              value={getProgressValue(shapData.values[index])}
                              className={
                                shapData.values[index] >= 0 ? "bg-green-100" : "bg-blue-100"
                              }
                              // Apply the color through a custom CSS class name
                              style={{
                                ["--progress-fill-color" as any]:
                                  shapData.values[index] >= 0
                                    ? "var(--green-500)"
                                    : "var(--blue-500)",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="insights"><>

                    <AccordionTrigger>Key Insights</AccordionTrigger>
                    <AccordionContent
</>>
                      <ul className="space-y-2 pt-2">
                        {insights.map((insight /* , index */) => (
                          <li key={index} className="text-sm flex items-start gap-2"><>

                            <span className="text-primary mt-1">•</span>
                            <span
</>>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  {shapData.model_version && (
                    <AccordionItem value="model-info"><>

                      <AccordionTrigger>Model Information</AccordionTrigger>
                      <AccordionContent
</>>
                        <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                          <div><>

                            <Label className="text-muted-foreground">Version</Label>
                            <p
</> className="font-medium">{shapData.model_version}</p>
                          </div>
                          <div><>

                            <Label className="text-muted-foreground">Architecture</Label>
                            <p
</> className="font-medium">MobileNetV2</p>
                          </div>
                          <div><>

                            <Label className="text-muted-foreground">Last Updated</Label>
                            <p
</> className="font-medium">March 15, 2025</p>
                          </div>
                          <div><>

                            <Label className="text-muted-foreground">Accuracy</Label>
                            <p
</> className="font-medium">92%</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={requestShapExplanation}><>

                <Refresh className="mr-2 h-3 w-3" />
                Refresh
              </Button>

              <Button
</>
                variant="outline"
                size="sm"
                onClick={() => {
                  const exportData = {
                    property_id: propertyId || "sample",
                    image_url: imageUrl,
                    condition: condition,
                    model_version: shapData.model_version || modelVersion,
                    timestamp: new Date().toISOString(),
                    shap_data: shapData,
                    insights: insights,
                  };

                  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);

                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `condition_analysis_${new Date().toISOString().split("T")[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="mr-2 h-3 w-3" />
                Export
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
