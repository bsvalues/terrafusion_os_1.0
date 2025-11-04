import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { ShapViewer } from "@/components/ShapViewer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { InfoIcon,
  BarChart3,
  History,
  ChevronRight,
  HelpCircle,
  PlusCircle,
  Server,
 } from '@mui/icons-material';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ShapViewerPage() {
  const [_, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("shap-viewer");

  // Parse URL parameters
  const searchParams = new URLSearchParams(search);
  const condition = searchParams.get("condition") || "good";
  const propertyId = searchParams.get("propertyId")
    ? Number(searchParams.get("propertyId"))
    : undefined;

  console.log("SHAP Viewer Page rendering", { condition, propertyId });

  // Simulated model version information
  const modelVersionHistory = [
    {
      version: "2.1.0",
      date: "March 15, 2025",
      architect: "Dr. Sarah Chen",
      improvements: [
        "Enhanced feature extraction for historical properties",
        "Better handling of seasonal lighting variations",
        "Reduced bias in foundation assessment",
      ],
      accuracy: 0.92,
      samples: 175,
    },
    {
      version: "2.0.0",
      date: "February 1, 2025",
      architect: "Dr. Sarah Chen",
      improvements: [
        "Major architectural change to MobileNetV2",
        "Added transfer learning from real estate imagery",
        "Improved generalization across different property styles",
      ],
      accuracy: 0.89,
      samples: 150,
    },
    {
      version: "1.0.0",
      date: "December 10, 2024",
      architect: "Dr. Michael Torres",
      improvements: [
        "Initial release",
        "Basic condition assessment capabilities",
        "Limited feature detection across 6 key categories",
      ],
      accuracy: 0.85,
      samples: 100,
    },
  ];

  // Handle viewing specific model version
  const handleViewVersion = (version: string) => {
    toast({
      title: `Switching to model version ${version}`,
      description: "Loading model architecture and SHAP values...",
    });
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div><>

            <h1 className="text-2xl md:text-3xl font-bold">SHAP Value Explorer</h1>
            <p
</> className="text-muted-foreground mt-1">
              Transparent AI-driven property condition assessments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-2 py-1">
              <Server className="h-3 w-3 mr-1" />
              <span>Model v2.1.0</span>
            </Badge>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Back to Home
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 md:w-[400px]">
            <TabsTrigger value="shap-viewer"><>

              <InfoIcon className="h-4 w-4 mr-2" />
              Explainer
            </TabsTrigger>
            <TabsTrigger
</> value="version-history"><>

              <History className="h-4 w-4 mr-2" />
              Version History
            </TabsTrigger>
            <TabsTrigger
</> value="performance">
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* SHAP Viewer Tab */}
          <TabsContent value="shap-viewer" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><>

                <ShapViewer
                  propertyId={propertyId}
                  initialCondition={condition as string}
                  showVersionComparison={true}
                />
              </div>

              <div
</> className="space-y-6">
                <Card>
                  <CardHeader><>

                    <CardTitle>About SHAP Values</CardTitle>
                    <CardDescription
</>>Understanding property condition scoring</CardDescription>
                  </CardHeader>
                  <CardContent><>

                    <p className="mb-4 text-sm">
                      SHAP (SHapley Additive exPlanations) values help explain how each feature
                      contributes to the final property condition score, providing transparency into
                      AI decisions.
                    </p>
                    <p
</> className="mb-4 text-sm">
                      Features with positive values (green) push the score higher, while features
                      with negative values (blue) push the score lower.
                    </p>
                    <p className="text-sm">
                      This transparency helps appraisers understand and validate AI-generated
                      condition assessments for more accurate property valuations.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Model Evolution Benefits</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2"><>

                        <Badge className="mt-0.5 shrink-0">v1.0</Badge>
                        <span
</> className="text-sm">
                          Basic analysis of 6 property features using ResNet architecture
                        </span>
                      </li>
                      <li className="flex items-start gap-2"><>

                        <Badge className="mt-0.5 shrink-0">v2.0</Badge>
                        <span
</> className="text-sm">
                          Enhanced MobileNetV2 with transfer learning from 150+ properties
                        </span>
                      </li>
                      <li className="flex items-start gap-2"><>

                        <Badge variant="outline" className="bg-green-50 mt-0.5 shrink-0">
                          v2.1
                        </Badge>
                        <span
</> className="text-sm">
                          Current: Improved seasonal lighting compensation and historical property
                          detection
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Alert variant="default" className="bg-slate-50">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    Compare versions by selecting "Model Version" in the SHAP viewer and toggling
                    "Compare with previous version"
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </TabsContent>

          {/* Version History Tab */}
          <TabsContent value="version-history" className="mt-6">
            <Card>
              <CardHeader><>

                <CardTitle>Condition Assessment Model Version History</CardTitle>
                <CardDescription
</>>
                  Track the evolution of our property condition assessment model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {modelVersionHistory.map((version /* , index */) => (
                    <div key={version.version} className="relative">
                      {/* Version timeline connector */}
                      {index < modelVersionHistory.length - 1 && (
                        <div className="absolute left-[15px] top-[70px] bottom-0 w-0.5 bg-slate-200"></div>
                      )}

                      <div className="flex gap-6">
                        <div className="flex flex-col items-center">
                          <div
                            className={`rounded-full h-8 w-8 flex items-center justify-center ${index === 0 ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"}`}
                          >
                            {index === 0 ? (
                              <PlusCircle className="h-5 w-5" />
                            ) : (
                              <span className="text-xs font-medium">{index}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                            <div>
                              <h3 className="text-lg font-semibold flex items-center">
                                Version {version.version}
                                {index === 0 && (
                                  <Badge className="ml-2" variant="default">
                                    Current
                                  </Badge>
                                )}
                              </h3>
                              <p className="text-muted-foreground text-sm">
                                {version.date} • By {version.architect}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-sm">
                                <span className="text-muted-foreground">Accuracy:</span>{" "}
                                <span className="font-medium">
                                  {(version.accuracy * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Samples:</span>{" "}
                                <span className="font-medium">{version.samples}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewVersion(version.version)}
                              >
                                View
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </div>

                          <div className="border rounded-md p-3 bg-slate-50 mb-2"><>

                            <h4 className="text-sm font-medium mb-2">Improvements</h4>
                            <ul
</> className="space-y-1">
                              {version.improvements.map((improvement, i) => (
                                <li key={i} className="text-sm flex items-start gap-2"><>

                                  <span className="text-green-500 mt-1">•</span>
                                  <span
</>>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="mt-6">
            <Card>
              <CardHeader><>

                <CardTitle>Model Performance Analytics</CardTitle>
                <CardDescription
</>>Analytics and metrics across model versions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Accuracy Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-32 flex items-center justify-center border border-dashed rounded-md">
                          <p className="text-sm text-muted-foreground">Accuracy visualization</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Error Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-32 flex items-center justify-center border border-dashed rounded-md">
                          <p className="text-sm text-muted-foreground">Error distribution chart</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Feature Importance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-32 flex items-center justify-center border border-dashed rounded-md">
                          <p className="text-sm text-muted-foreground">Feature importance chart</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div><>

                    <h3 className="text-lg font-medium mb-4">Model Performance Comparison</h3>
                    <div
</> className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b"><>

                            <th className="text-left font-medium py-2 px-3">Version</th>
                            <th
</> className="text-left font-medium py-2 px-3">Accuracy</th><>

                            <th className="text-left font-medium py-2 px-3">RMSE</th>
                            <th
</> className="text-left font-medium py-2 px-3">MAE</th><>

                            <th className="text-left font-medium py-2 px-3">Training Samples</th>
                            <th
</> className="text-left font-medium py-2 px-3">Drift Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b bg-slate-50"><>

                            <td className="py-2 px-3 font-medium">v2.1.0 (Current)</td>
                            <td
</> className="py-2 px-3">92%</td><>

                            <td className="py-2 px-3">0.45</td>
                            <td
</> className="py-2 px-3">0.41</td><>

                            <td className="py-2 px-3">175</td>
                            <td
</> className="py-2 px-3">1.2%</td>
                          </tr>
                          <tr className="border-b"><>

                            <td className="py-2 px-3 font-medium">v2.0.0</td>
                            <td
</> className="py-2 px-3">89%</td><>

                            <td className="py-2 px-3">0.58</td>
                            <td
</> className="py-2 px-3">0.52</td><>

                            <td className="py-2 px-3">150</td>
                            <td
</> className="py-2 px-3">2.1%</td>
                          </tr>
                          <tr><>

                            <td className="py-2 px-3 font-medium">v1.0.0</td>
                            <td
</> className="py-2 px-3">85%</td><>

                            <td className="py-2 px-3">0.71</td>
                            <td
</> className="py-2 px-3">0.65</td><>

                            <td className="py-2 px-3">100</td>
                            <td
</> className="py-2 px-3">3.5%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                <p>
                  Performance metrics measured on validation set of 50 diverse properties across all
                  condition scores. Drift rate indicates the percentage of predictions that
                  significantly deviate from expert assessments.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
