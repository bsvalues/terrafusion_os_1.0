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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { SuccessState } from "@/components/ui/success-state";
import { enhancedToast } from "@/components/ui/enhanced-toast";
import { Clipboard,
  ClipboardCheck,
  Building2,
  Images,
  FileText,
  FileBarChart2,
  FileCheck,
  CheckCircle2,
  Warning,
  ChevronRight,
  Mail,
  ArrowRight,
 } from '@mui/icons-material';

// Define workflow steps
export enum AppraisalStep {
  ORDER_INTAKE = "order-intake",
  PROPERTY_DATA = "property-data",
  SUBJECT_PHOTOS = "subject-photos",
  COMPARABLE_SELECTION = "comparable-selection",
  FORM_COMPLETION = "form-completion",
  ADJUSTMENTS = "adjustments",
  COMPLIANCE_CHECK = "compliance-check",
  FINAL_REVIEW = "final-review",
  REPORT_GENERATION = "report-generation",
  DELIVERY = "delivery",
}

interface StepInfo {
  id: AppraisalStep;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

interface WorkflowProps {
  currentReportId?: string;
  currentStep?: AppraisalStep;
  completedSteps?: AppraisalStep[];
}

export function AppraisalWorkflow({
  currentReportId,
  currentStep = AppraisalStep.ORDER_INTAKE,
  completedSteps = [],
}: WorkflowProps) {
  const [_, setLocation] = useLocation();

  // Define all steps and their information
  const steps: StepInfo[] = [
    {
      id: AppraisalStep.ORDER_INTAKE,
      title: "Order Intake",
      description: "Import and process the appraisal order",
      icon: <Mail className="h-6 w-6" />,
      path: "/email-order",
    },
    {
      id: AppraisalStep.PROPERTY_DATA,
      title: "Property Data",
      description: "Enter subject property information",
      icon: <Building2 className="h-6 w-6" />,
      path: currentReportId ? `/property/${currentReportId}` : "/property-data",
    },
    {
      id: AppraisalStep.SUBJECT_PHOTOS,
      title: "Subject Photos",
      description: "Capture and organize property photos",
      icon: <Images className="h-6 w-6" />,
      path: currentReportId ? `/photos/${currentReportId}` : "/photos",
    },
    {
      id: AppraisalStep.COMPARABLE_SELECTION,
      title: "Comparable Selection",
      description: "Find and select comparable properties",
      icon: <FileBarChart2 className="h-6 w-6" />,
      path: currentReportId ? `/comparables/${currentReportId}` : "/comps",
    },
    {
      id: AppraisalStep.FORM_COMPLETION,
      title: "Form Completion",
      description: "Complete the UAD appraisal form",
      icon: <Clipboard className="h-6 w-6" />,
      path: currentReportId ? `/uad-form/${currentReportId}` : "/uad-form",
    },
    {
      id: AppraisalStep.ADJUSTMENTS,
      title: "Adjustments",
      description: "Make market adjustments to comparables",
      icon: <FileBarChart2 className="h-6 w-6" />,
      path: currentReportId ? `/comps/${currentReportId}/adjustments` : "/comps",
    },
    {
      id: AppraisalStep.COMPLIANCE_CHECK,
      title: "Compliance Check",
      description: "Validate UAD compliance",
      icon: <ClipboardCheck className="h-6 w-6" />,
      path: currentReportId ? `/compliance/${currentReportId}` : "/compliance",
    },
    {
      id: AppraisalStep.FINAL_REVIEW,
      title: "Final Review",
      description: "Review and finalize the appraisal",
      icon: <FileCheck className="h-6 w-6" />,
      path: currentReportId ? `/review/${currentReportId}` : "/review",
    },
    {
      id: AppraisalStep.REPORT_GENERATION,
      title: "Report Generation",
      description: "Generate PDF and XML reports",
      icon: <FileText className="h-6 w-6" />,
      path: currentReportId ? `/reports/${currentReportId}` : "/reports",
    },
    {
      id: AppraisalStep.DELIVERY,
      title: "Delivery",
      description: "Deliver the final appraisal",
      icon: <CheckCircle2 className="h-6 w-6" />,
      path: currentReportId ? `/delivery/${currentReportId}` : "/delivery",
    },
  ];

  // Calculate current step index
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  // Calculate progress percentage
  const totalSteps = steps.length;
  const completedCount = completedSteps.length;
  const progress = Math.round((completedCount / totalSteps) * 100);

  // Group steps by status
  const upcomingSteps = steps.filter(
    (step) => !completedSteps.includes(step.id) && step.id !== currentStep
  );

  // Determine if the current report is ready for final submission
  const isReadyForSubmission = completedSteps.includes(AppraisalStep.REPORT_GENERATION);

  return (
    <div className="space-y-8">
      {/* Progress overview */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Appraisal Progress</CardTitle>
            {currentReportId && (
              <Badge variant="outline" className="font-normal">
                Report #{currentReportId}
              </Badge>
            )}
          </div>
          <CardDescription>Complete each step to produce a final appraisal report</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between"><>

              <span className="text-sm font-medium">Overall completion</span>
              <span
</> className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Main workflow guides */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="mb-4"><>

          <TabsTrigger value="current">Current Step</TabsTrigger>
          <TabsTrigger
</> value="all">All Steps</TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <Badge className="ml-2">{completedSteps.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Current step view */}
        <TabsContent value="current">
          {currentIndex >= 0 && (
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center gap-2">
                  {steps[currentIndex].icon}
                  <div><>

                    <CardTitle>{steps[currentIndex].title}</CardTitle>
                    <CardDescription
</>>{steps[currentIndex].description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent><>

                <WorkflowStepContent stepId={steps[currentIndex].id} reportId={currentReportId} />
              </CardContent>
              <CardFooter
</> className="flex justify-between">
                {currentIndex > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setLocation(steps[currentIndex - 1].path)}
                  >
                    Previous: {steps[currentIndex - 1].title}
                  </Button>
                )}
                {currentIndex < steps.length - 1 && (
                  <Button
                    className="ml-auto"
                    onClick={() => setLocation(steps[currentIndex + 1].path)}
                  >
                    Next: {steps[currentIndex + 1].title}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* All steps view */}
        <TabsContent value="all">
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((step /* , index */) => (
              <Card
                key={step.id}
                className={`cursor-pointer hover:shadow transition-shadow ${
                  currentStep === step.id ? "ring-1 ring-primary" : ""
                } ${completedSteps.includes(step.id) ? "bg-muted/20" : ""}`}
                onClick={() => setLocation(step.path)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><>

                      <div
                        className={`p-1.5 rounded-full ${
                          completedSteps.includes(step.id)
                            ? "bg-green-100 text-green-700"
                            : currentStep === step.id
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {step.icon}
                      </div>
                      <CardTitle
</> className="text-base">{step.title}</CardTitle>
                    </div>
                    <Badge
                      variant={
                        completedSteps.includes(step.id)
                          ? "default"
                          : currentStep === step.id
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        completedSteps.includes(step.id) ? "bg-green-100 text-green-700" : ""
                      }
                    >
                      {completedSteps.includes(step.id)
                        ? "Completed"
                        : currentStep === step.id
                          ? "Current"
                          : `Step ${index + 1}`}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1">{step.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Completed steps view */}
        <TabsContent value="completed">
          {completedSteps.length === 0 ? (
            <Alert>
              <Warning className="h-4 w-4" /><>

              <AlertTitle>No completed steps</AlertTitle>
              <AlertDescription
</>>
                Start with the first step by importing an order or creating a new appraisal.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {steps
                .filter((step) => completedSteps.includes(step.id))
                .map((step) => (
                  <Card
                    key={step.id}
                    className="cursor-pointer hover:shadow transition-shadow bg-muted/20"
                    onClick={() => setLocation(step.path)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><>

                          <div className="p-1.5 rounded-full bg-green-100 text-green-700">
                            {step.icon}
                          </div>
                          <CardTitle
</> className="text-base">{step.title}</CardTitle>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-700">
                          Completed
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">{step.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Ready for submission alert */}
      {isReadyForSubmission && (
        <Alert className="bg-green-50 text-green-800 border-green-300">
          <CheckCircle2 className="h-4 w-4 text-green-500" /><>

          <AlertTitle>Ready for Delivery</AlertTitle>
          <AlertDescription
</> className="flex justify-between items-center"><>

            <span>This appraisal is complete and ready to be delivered to the client.</span>
            <Button
</>
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setLocation(steps[steps.length - 1].path)}
            >
              Deliver Report
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Custom content for each step based on step ID
function WorkflowStepContent({ stepId, reportId }: { stepId: AppraisalStep; reportId?: string }) {
  switch (stepId) {
    case AppraisalStep.ORDER_INTAKE:
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Email Import</CardTitle>
              </CardHeader><>

              <CardContent className="text-sm">
                Import appraisal order details from client emails
              </CardContent>
              <CardFooter
</>>
                <Button variant="ghost" size="sm" className="w-full">
                  Import Email
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">PDF Import</CardTitle>
              </CardHeader><>

              <CardContent className="text-sm">Extract data from PDF order documents</CardContent>
              <CardFooter
</>>
                <Button variant="ghost" size="sm" className="w-full">
                  Upload PDF
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Manual Entry</CardTitle>
              </CardHeader><>

              <CardContent className="text-sm">Manually create a new appraisal order</CardContent>
              <CardFooter
</>>
                <Button variant="ghost" size="sm" className="w-full">
                  Create New
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200"><>

            <AlertTitle>AI-Powered Data Extraction</AlertTitle>
            <AlertDescription
</>>
              Our AI system will automatically extract property details, client information, and
              assignment data from your order documents.
            </AlertDescription>
          </Alert>
        </div>
      );

    case AppraisalStep.PROPERTY_DATA:
      return (
        <div className="space-y-4"><>

          <p className="text-sm text-muted-foreground">
            Enter detailed information about the subject property including physical
            characteristics, location, and zoning details.
          </p>

          <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Basic Information</CardTitle>
              </CardHeader><>

              <CardContent className="text-sm">
                Property address, type, and ownership details
              </CardContent>
              <CardFooter
</>>
                <Button variant="ghost" size="sm" className="w-full">
                  Enter Details
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Physical Characteristics</CardTitle>
              </CardHeader><>

              <CardContent className="text-sm">
                Square footage, rooms, features, and condition
              </CardContent>
              <CardFooter
</>>
                <Button variant="ghost" size="sm" className="w-full">
                  Enter Features
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200"><>

            <AlertTitle>Integration with TerraField Mobile</AlertTitle>
            <AlertDescription
</>>
              Connect to our mobile app to import property measurements, sketches, and photos
              captured during on-site inspection.
            </AlertDescription>
          </Alert>
        </div>
      );

    // Add specific content for other steps as needed

    default:
      return (
        <div className="space-y-4"><>

          <p className="text-sm text-muted-foreground">
            Follow the workflow steps to complete this appraisal report. Each step must be completed
            in sequence to ensure accuracy and compliance.
          </p>

          <Alert
</> variant="default"><>

            <AlertTitle>Workflow Guidance</AlertTitle>
            <AlertDescription
</>>
              The Terrafusion Platform guides you through each step of the appraisal process, from
              data collection to final report delivery.
            </AlertDescription>
          </Alert>
        </div>
      );
  }
}
