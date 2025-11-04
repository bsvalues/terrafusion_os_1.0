import React from "react";
import { useParams } from "wouter";
import { AppraisalWorkflow, AppraisalStep } from "@/components/workflow/AppraisalWorkflow";
import { PageHeader } from "../components/ui/page-header";
import { Clipboard, ChevronLeft  } from '@mui/icons-material';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function WorkflowPage() {
  const { reportId, step } = useParams<{ reportId?: string; step?: string }>();

  // Convert URL parameter to enum if provided
  const currentStep = step
    ? Object.values(AppraisalStep).find((s) => s === step) || AppraisalStep.ORDER_INTAKE
    : AppraisalStep.ORDER_INTAKE;

  // For demo purposes: show some completed steps
  const completedSteps = [
    AppraisalStep.ORDER_INTAKE,
    AppraisalStep.PROPERTY_DATA,
    AppraisalStep.SUBJECT_PHOTOS,
  ];

  return (
    <div className="container mx-auto py-6 max-w-screen-xl">
      <PageHeader
        title="Appraisal Workflow"
        description="Complete the step-by-step process to create your appraisal report"
        icon={<Clipboard className="h-6 w-6" />}
      >
        <Button variant="outline" size="sm" asChild>
          <a href="/dashboard">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </a>
        </Button>
      </PageHeader>

      <Card className="mt-6">
        <CardContent className="p-6">
          <AppraisalWorkflow
            currentReportId={reportId}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </CardContent>
      </Card>
    </div>
  );
}
