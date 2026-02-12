import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit,
  Camera,
  BarChart,
  ArrowRight,
  Lightbulb,
  Zap,
  CheckCircle2,
  Brain,
  ArrowUpCircle,
  LayoutDashboard,
  Star,
  Award,
 } from '@mui/icons-material';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * AIFeatureIntro Component
 *
 * A component for the home page that introduces the AI features of the
 * Terrafusion platform in a way that's accessible to appraisers without
 * technical backgrounds.
 */
export function AIFeatureIntro() {
  const [, setLocation] = useLocation();
  const [showNewFeatureIndicator, setShowNewFeatureIndicator] = useState(true);
  const [modelHealth, setModelHealth] = useState({
    "property-condition": 98,
    "valuation-engine": 96,
    "market-analysis": 99,
  });
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { connected, connectionMode, notifications } = useWebSocket();

  // Show "New" badge for 7 days after a feature is added
  useEffect(() => {
    const hasSeenNewFeature = localStorage.getItem("hasSeenAIFeatures");
    if (hasSeenNewFeature) {
      setShowNewFeatureIndicator(false);
    }

    // Set timer to auto-dismiss the new feature indicator
    const timer = setTimeout(() => {
      setShowNewFeatureIndicator(false);
      localStorage.setItem("hasSeenAIFeatures", "true");
    }, 60000); // Auto-dismiss after 1 minute

    return () => clearTimeout(timer);
  }, []);

  const handleSectionClick = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <div className="relative">
                <BrainCircuit className="mr-2 h-6 w-6 text-primary" />
                {showNewFeatureIndicator && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-2 -top-2 px-1 py-0 text-[10px]"
                  >
                    NEW
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl">AI-Powered Appraisal Tools</CardTitle>
            </div>
            <CardDescription className="text-base mt-1">
              Enhanced appraisal workflow with intelligent assistance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Badge variant={connected ? "success" : "outline"} className="mr-2">
                      <div className="flex items-center gap-1"><>

                        <div
                          className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`}
                        ></div>
                        <span
</>>{connected ? "Connected" : "Reconnecting..."}</span>
                      </div>
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI Services Connection Status: {connectionMode}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/onboarding")}
              className="whitespace-nowrap"
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              Interactive Guide
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {Object.entries(modelHealth).map(([model, health]) => (
            <TooltipProvider key={model}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1"><>

                      <span className="text-xs font-medium capitalize">
                        {model.replace("-", " ")}
                      </span>
                      <span
</> className="text-xs font-semibold">{health}%</span>
                    </div>
                    <Progress
                      value={health}
                      className="h-1.5"
                      style={
                        {
                          background: "rgb(229, 231, 235)",
                          "--tw-gradient-from":
                            health > 95 ? "#10b981" : health > 85 ? "#eab308" : "#ef4444",
                          "--tw-gradient-to":
                            health > 95 ? "#34d399" : health > 85 ? "#fcd34d" : "#f87171",
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm"><>

                    <p className="font-bold">
                      {health > 95 ? "Excellent" : health > 85 ? "Good" : "Needs attention"}
                    </p>
                    <p
</>>
                      {health > 95
                        ? "This AI model is working optimally"
                        : health > 85
                          ? "Model is performing well but could be improved"
                          : "Model performance needs attention"}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardHeader>

      {notifications.filter((n) => !n.read).length > 0 && (
        <Alert className="mx-6 mb-3 bg-blue-50 border-blue-100">
          <div className="flex items-start">
            <Brain className="h-4 w-4 mt-0.5 text-blue-500 mr-2" />
            <AlertDescription className="text-blue-700">
              New AI model update: Enhanced property condition detection now available
            </AlertDescription>
          </div>
        </Alert>
      )}

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className={`bg-background hover:shadow-md transition-all cursor-pointer ${expandedSection === "condition" ? "ring-2 ring-primary/20" : ""}`}
            onClick={() => handleSectionClick("condition")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <div className="p-1.5 rounded-full bg-blue-100 mr-2">
                  <Camera className="h-4 w-4 text-blue-600" />
                </div>
                Property Condition Analysis
                {expandedSection === "condition" && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    Enhanced
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent
              className={`pb-2 ${expandedSection === "condition" ? "border-t border-b py-2" : ""}`}
            >
              {expandedSection === "condition" ? (
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span>Automatic condition scoring (1-5)</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span>Component-level breakdowns</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span>Improvement recommendations</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Star className="h-4 w-4 text-amber-500 mr-2" />
                    <span>NEW: Deferred maintenance detection</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Automatically assess property condition from photos with detailed component
                  breakdowns
                </p>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation("/photos");
                }}
              >
                Try it <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>

          <Card
            className={`bg-background hover:shadow-md transition-all cursor-pointer ${expandedSection === "valuation" ? "ring-2 ring-primary/20" : ""}`}
            onClick={() => handleSectionClick("valuation")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <div className="p-1.5 rounded-full bg-green-100 mr-2">
                  <BarChart className="h-4 w-4 text-green-600" />
                </div>
                AI Valuation Assistant
                {expandedSection === "valuation" && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    Advanced
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent
              className={`pb-2 ${expandedSection === "valuation" ? "border-t border-b py-2" : ""}`}
            >
              {expandedSection === "valuation" ? (
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span>Smart comparable selection</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span>Adjustment explanations</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span>Confidence scoring</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Star className="h-4 w-4 text-amber-500 mr-2" />
                    <span>NEW: Market trend insights</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Get intelligent valuation suggestions with detailed adjustment explanations
                </p>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation("/ai-valuation");
                }}
              >
                Try it <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>

          <Card
            className={`bg-background hover:shadow-md transition-all cursor-pointer ${expandedSection === "productivity" ? "ring-2 ring-primary/20" : ""}`}
            onClick={() => handleSectionClick("productivity")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <div className="p-1.5 rounded-full bg-amber-100 mr-2">
                  <Zap className="h-4 w-4 text-amber-600" />
                </div>
                Productivity Tools
                {expandedSection === "productivity" && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    Time-saving
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent
              className={`pb-2 ${expandedSection === "productivity" ? "border-t border-b py-2" : ""}`}
            >
              {expandedSection === "productivity" ? (
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span>Auto form population</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span>Narrative generation</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span>Guided workflows</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Star className="h-4 w-4 text-amber-500 mr-2" />
                    <span>NEW: Report batch processing</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Workflow automations that help you complete appraisals faster with less effort
                </p>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation("/workflow");
                }}
              >
                Try it <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </CardContent>

      <CardFooter className="border-t flex-col sm:flex-row gap-2">
        <div className="w-full flex sm:flex-row flex-col justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <div className="text-sm">
              <span className="font-medium">Pro Tip:</span> AI features are easier to understand
              with the Guided Tour
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/system-monitor")}><>

              <LayoutDashboard className="mr-1 h-4 w-4" />
              Model Dashboard
            </Button>
            <Button
</> onClick={() => setLocation("/onboarding")}>
              Start Guided Tour <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export default AIFeatureIntro;
