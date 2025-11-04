import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AppraisalGuidance } from "@/components/onboarding/AppraisalGuidance";
import { CheckCircle,
  ChevronRight,
  ArrowRight,
  BarChart2,
  Camera,
  FileText,
  Clock,
  Zap,
  Shield,
 } from '@mui/icons-material';

export default function OnboardingPage() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("welcome");
  const [progress, setProgress] = useState(1);

  const handleNextStep = () => {
    if (activeTab === "welcome") {
      setActiveTab("features");
      setProgress(2);
    } else if (activeTab === "features") {
      setActiveTab("guidance");
      setProgress(3);
    } else {
      // Completed onboarding
      setLocation("/");
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8 text-center"><>

        <h1 className="text-3xl font-bold mb-2">Welcome to Terrafusion Platform</h1>
        <p
</> className="text-muted-foreground">Your AI-Powered Property Appraisal Assistant</p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center relative"><>

          <div className="absolute left-0 right-0 top-1/2 h-1 bg-muted -z-10"></div>

          <div
</>
            className={`flex flex-col items-center ${progress >= 1 ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                progress >= 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {progress > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
            </div>
            <span className="text-sm">Welcome</span>
          </div>

          <div
            className={`flex flex-col items-center ${progress >= 2 ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                progress >= 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {progress > 2 ? <CheckCircle className="h-5 w-5" /> : "2"}
            </div>
            <span className="text-sm">Key Features</span>
          </div>

          <div
            className={`flex flex-col items-center ${progress >= 3 ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                progress >= 3
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {progress > 3 ? <CheckCircle className="h-5 w-5" /> : "3"}
            </div>
            <span className="text-sm">Guided Start</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="welcome">
          <Card>
            <CardHeader><>

              <CardTitle className="text-2xl">Terrafusion For Appraisers</CardTitle>
              <CardDescription
</>>
                Terrafusion is designed to enhance your appraisal workflow, not replace your
                expertise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6 flex flex-col items-center text-center">
                  <Clock className="h-12 w-12 text-primary mb-4" /><>

                  <h3 className="text-lg font-medium mb-2">Save Time</h3>
                  <p
</> className="text-muted-foreground">
                    Cut average appraisal time by up to 30% with AI-assisted valuation and condition
                    assessment that helps you focus on the details that matter most.
                  </p>
                </div>

                <div className="border rounded-lg p-6 flex flex-col items-center text-center">
                  <Shield className="h-12 w-12 text-primary mb-4" /><>

                  <h3 className="text-lg font-medium mb-2">Enhance Accuracy</h3>
                  <p
</> className="text-muted-foreground">
                    Improve consistency and reduce revision requests with data-driven insights that
                    complement your professional judgment.
                  </p>
                </div>

                <div className="border rounded-lg p-6 flex flex-col items-center text-center">
                  <Zap className="h-12 w-12 text-primary mb-4" /><>

                  <h3 className="text-lg font-medium mb-2">Streamline Workflow</h3>
                  <p
</> className="text-muted-foreground">
                    From fieldwork to final reports, Terrafusion provides a seamless end-to-end
                    solution for modern appraisers.
                  </p>
                </div>

                <div className="border rounded-lg p-6 flex flex-col items-center text-center">
                  <FileText className="h-12 w-12 text-primary mb-4" /><>

                  <h3 className="text-lg font-medium mb-2">Generate Reports</h3>
                  <p
</> className="text-muted-foreground">
                    Create compliant, professional reports with confidence, knowing your valuation
                    is backed by both AI analysis and your expertise.
                  </p>
                </div>
              </div>

              <div className="border-l-4 border-l-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-r-md">
                <p className="text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Note for appraisers:</span> Terrafusion is your
                  assistant, not your replacement. Every AI recommendation can be reviewed and
                  adjusted based on your professional judgment, which remains the cornerstone of
                  quality appraisals.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleNextStep}>
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader><>

              <CardTitle className="text-2xl">Key AI Features Simplified</CardTitle>
              <CardDescription
</>>
                Terrafusion provides powerful AI tools that are easy to understand and use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="bg-primary/10 p-3 rounded-full"><>

                    <BarChart2 className="h-6 w-6 text-primary" />
                  </div>
                  <div
</>><>

                    <h3 className="text-lg font-medium mb-1">AI Valuation Assistant</h3>
                    <p
</> className="text-muted-foreground mb-3">
                      Generates property valuations with detailed adjustments and confidence levels
                      to support your appraisal process.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">
                          Clear confidence ratings show when to trust the AI
                        </span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">
                          Adjustment breakdowns explain every factor's impact
                        </span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">
                          All values can be overridden with your professional judgment
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="bg-primary/10 p-3 rounded-full"><>

                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div
</>><>

                    <h3 className="text-lg font-medium mb-1">Condition Analysis from Photos</h3>
                    <p
</> className="text-muted-foreground mb-3">
                      Analyzes property photos to objectively assess property condition and identify
                      issues that might impact value.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">
                          Consistent 1-5 condition scoring with detailed breakdown
                        </span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">
                          Component-level analysis (roof, exterior, etc.)
                        </span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">
                          Includes practical interpretation for your reports
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="bg-primary/10 p-3 rounded-full"><>

                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div
</>><>

                    <h3 className="text-lg font-medium mb-1">AI Insights Dashboard</h3>
                    <p
</> className="text-muted-foreground mb-3">
                      View the performance of AI tools in simple terms that help you understand when
                      to rely on them and when to exercise more caution.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">
                          Performance metrics translated to practical implications
                        </span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">
                          Focus on accuracy and reliability, not technical details
                        </span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">
                          Clear indicators of when models need adjustment
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between"><>

              <Button
                variant="outline"
                onClick={() => {
                  setActiveTab("welcome");
                  setProgress(1);
                }}
              >
                Back
              </Button>
              <Button
</> onClick={handleNextStep}>
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="guidance">
          <div className="space-y-6">
            <Card className="mb-6">
              <CardHeader><>

                <CardTitle className="text-2xl">Get Started With Terrafusion</CardTitle>
                <CardDescription
</>>
                  Chose a guided path based on your experience level or specific needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Select one of the guided tasks below to get started using Terrafusion in your
                  workflow. Each task includes step-by-step instructions to help you learn the
                  platform efficiently.
                </p>
              </CardContent>
            </Card><>


            <AppraisalGuidance />
          </div>

          <div
</> className="mt-6 flex justify-between"><>

            <Button
              variant="outline"
              onClick={() => {
                setActiveTab("features");
                setProgress(2);
              }}
            >
              Back
            </Button>
            <Button
</> onClick={() => setLocation("/")}>
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
