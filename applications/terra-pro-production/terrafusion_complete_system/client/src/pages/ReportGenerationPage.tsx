import React from "react";
import { useParams } from "wouter";
import {
  ReportGeneration,
  ReportFormat,
  ReportOutputFormat,
} from "@/components/workflow/report-generation";
import { PageHeader } from "../components/ui/page-header";
import { FileText, ChevronLeft  } from '@mui/icons-material';
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { enhancedToast } from "@/components/ui/enhanced-toast";

export function ReportGenerationPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const queryClient = useQueryClient();

  const handleGenerateReport = async (
    reportId: string,
    format: ReportFormat,
    outputFormats: ReportOutputFormat[],
    options: any
  ) => {
    // In a real implementation, we'd make an API call here
    console.log("Generating report with options:", { reportId, format, outputFormats, options });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Example error handling
    if (Math.random() > 0.9) {
      throw new Error("Failed to connect to report generation service");
    }

    // Successfully generated
    enhancedToast.success({
      title: "Report Generated",
      description: `Generated ${outputFormats.length} format(s) for report #${reportId}`,
    });

    // Invalidate report cache queries if needed
    queryClient.invalidateQueries({ queryKey: [`/api/reports/${reportId}`] });

    return Promise.resolve();
  };

  return (
    <div className="container mx-auto py-6 max-w-screen-xl">
      <PageHeader
        title="Generate Appraisal Report"
        description="Configure and generate your appraisal report in various formats"
        icon={<FileText className="h-6 w-6" />}
      >
        <Button variant="outline" size="sm" asChild>
          <a href="/appraisal/workflow">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Workflow
          </a>
        </Button>
      </PageHeader>

      <div className="mt-6">
        <ReportGeneration
          reportId={reportId}
          onGenerate={handleGenerateReport}
          defaultFormat={ReportFormat.UAD_GPAR}
        />
      </div>
    </div>
  );
}
