import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileText,
  FileJson,
  Download,
  ArrowRight,
  Settings2,
  FileImage,
  AlertCircle,
  CloudIcon,
  Check,
  Loader2,
  Sparkles,
 } from '@mui/icons-material';
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { SuccessState } from "@/components/ui/success-state";
import { enhancedToast } from "@/components/ui/enhanced-toast";
import { AssistantPanel, AssistantType } from "@/components/ai/assistant-panel";
import {
  SmartChecklist,
  CheckItemStatus,
  ChecklistItem,
} from "@/components/workflow/smart-checklist";

// Report format options
export enum ReportFormat {
  UAD_GPAR = "uad-gpar",
  UAD_URAR = "uad-urar",
  DESKTOP_2055 = "desktop-2055",
  RENTAL_1025 = "rental-1025",
  COMMERICAL_1004C = "commerical-1004c",
  CUSTOM = "custom",
}

// Report output format options
export enum ReportOutputFormat {
  PDF = "pdf",
  XML = "xml",
  MISMO_XML = "mismo-xml",
  JSON = "json",
  ENV_FILE = "env-file",
}

// Default report format configuration
const formatConfig = {
  [ReportFormat.UAD_GPAR]: {
    title: "General Purpose Appraisal Report (GPAR)",
    description: "Form 1004/70 for standard single-family residences",
    outputOptions: [ReportOutputFormat.PDF, ReportOutputFormat.XML, ReportOutputFormat.MISMO_XML],
  },
  [ReportFormat.UAD_URAR]: {
    title: "Uniform Residential Appraisal Report (URAR)",
    description: "Detailed form for single-family and PUD properties",
    outputOptions: [ReportOutputFormat.PDF, ReportOutputFormat.XML, ReportOutputFormat.MISMO_XML],
  },
  [ReportFormat.DESKTOP_2055]: {
    title: "Desktop Appraisal Report (2055)",
    description: "Exterior-only or desktop appraisal format",
    outputOptions: [ReportOutputFormat.PDF, ReportOutputFormat.XML],
  },
  [ReportFormat.RENTAL_1025]: {
    title: "Small Residential Income Property (1025)",
    description: "For 2-4 unit residential income properties",
    outputOptions: [ReportOutputFormat.PDF, ReportOutputFormat.XML],
  },
  [ReportFormat.COMMERICAL_1004C]: {
    title: "Commercial Report (1004C)",
    description: "For commercial and special use properties",
    outputOptions: [ReportOutputFormat.PDF, ReportOutputFormat.JSON],
  },
  [ReportFormat.CUSTOM]: {
    title: "Custom Report Format",
    description: "Custom narrative or specialty format",
    outputOptions: [ReportOutputFormat.PDF, ReportOutputFormat.JSON, ReportOutputFormat.ENV_FILE],
  },
};

// Output format labels and icons
const outputFormatConfig = {
  [ReportOutputFormat.PDF]: {
    label: "PDF Document",
    icon: <FileText className="h-5 w-5" />,
    description: "Standard PDF document for printing and distribution",
  },
  [ReportOutputFormat.XML]: {
    label: "XML Data File",
    icon: <FileJson className="h-5 w-5" />,
    description: "XML format for standard LOS integrations",
  },
  [ReportOutputFormat.MISMO_XML]: {
    label: "MISMO XML",
    icon: <FileJson className="h-5 w-5" />,
    description: "MISMO compliant XML for GSE submission",
  },
  [ReportOutputFormat.JSON]: {
    label: "JSON Data",
    icon: <FileJson className="h-5 w-5" />,
    description: "JSON data format for API integrations",
  },
  [ReportOutputFormat.ENV_FILE]: {
    label: "ENV Report",
    icon: <FileImage className="h-5 w-5" />,
    description: "ENV format for appraisal interchanges",
  },
};

// Advanced options interface
interface AdvancedOptions {
  includePhotos: boolean;
  includeMaps: boolean;
  includeDataSources: boolean;
  includeAiAnalysis: boolean;
  watermark: boolean;
  compressFiles: boolean;
  encrypted: boolean;
  embeddedFonts: boolean;
}

interface ReportGenerationProps {
  reportId?: string;
  defaultFormat?: ReportFormat;
  onGenerate?: (
    reportId: string,
    format: ReportFormat,
    outputFormats: ReportOutputFormat[],
    options: AdvancedOptions
  ) => Promise<void>;
  className?: string;
}

export function ReportGeneration({
  reportId,
  defaultFormat = ReportFormat.UAD_GPAR,
  onGenerate,
  className = "",
}: ReportGenerationProps) {
  const [_, setLocation] = useLocation();
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>(defaultFormat);
  const [selectedOutputFormats, setSelectedOutputFormats] = useState<ReportOutputFormat[]>([
    ReportOutputFormat.PDF,
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("format");

  // Advanced options state
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptions>({
    includePhotos: true,
    includeMaps: true,
    includeDataSources: false,
    includeAiAnalysis: false,
    watermark: false,
    compressFiles: true,
    encrypted: false,
    embeddedFonts: true,
  });

  // Example checklist items
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    {
      id: "1",
      title: "Subject Property Information",
      status: CheckItemStatus.COMPLETED,
      requiredForCompletion: true,
      group: "Required Data",
    },
    {
      id: "2",
      title: "Comparable Properties (min 3)",
      status: CheckItemStatus.COMPLETED,
      requiredForCompletion: true,
      detail: "4 comparable properties selected",
      group: "Required Data",
    },
    {
      id: "3",
      title: "Subject Photos",
      status: CheckItemStatus.COMPLETED,
      requiredForCompletion: true,
      detail: "12 photos uploaded",
      group: "Required Data",
    },
    {
      id: "4",
      title: "Market Analysis Section",
      status: CheckItemStatus.WARNING,
      requiredForCompletion: true,
      detail: "Market analysis is present but lacks specific data on recent trends",
      group: "Required Data",
    },
    {
      id: "5",
      title: "Adjustment Support",
      status: CheckItemStatus.WARNING,
      requiredForCompletion: false,
      detail: "Some adjustments lack sufficient support documentation",
      group: "Documentation",
    },
    {
      id: "6",
      title: "Flood Map Reference",
      status: CheckItemStatus.ERROR,
      requiredForCompletion: true,
      detail: "Missing flood zone information and map reference",
      group: "Documentation",
    },
    {
      id: "7",
      title: "Reconciliation",
      status: CheckItemStatus.COMPLETED,
      requiredForCompletion: true,
      group: "Analysis",
    },
    {
      id: "8",
      title: "Enhanced Neighborhood Analysis",
      status: CheckItemStatus.PENDING,
      requiredForCompletion: false,
      aiRecommended: true,
      group: "Recommendations",
    },
    {
      id: "9",
      title: "Trend Analysis Graphs",
      status: CheckItemStatus.PENDING,
      requiredForCompletion: false,
      aiRecommended: true,
      group: "Recommendations",
    },
  ]);

  // Toggle output format selection
  const toggleOutputFormat = (format: ReportOutputFormat) => {
    if (selectedOutputFormats.includes(format)) {
      setSelectedOutputFormats((prev) => prev.filter((f) => f !== format));
    } else {
      setSelectedOutputFormats((prev) => [...prev, format]);
    }
  };

  // Handle toggle for advanced options
  const handleAdvancedOptionChange = (key: keyof AdvancedOptions) => {
    setAdvancedOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle format change
  const handleFormatChange = (format: ReportFormat) => {
    setSelectedFormat(format);

    // Reset output formats to default for the selected format
    const defaultOutputs = formatConfig[format].outputOptions;
    setSelectedOutputFormats([defaultOutputs[0]]);
  };

  // Handle report generation
  const handleGenerateReport = async () => {
    if (!reportId || !onGenerate) {
      // For demo, simulate report generation
      handleSimulatedGeneration();
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationError(null);
      setIsSuccess(false);

      await onGenerate(reportId, selectedFormat, selectedOutputFormats, advancedOptions);

      setIsSuccess(true);
      enhancedToast.success({
        title: "Report Generated",
        description: "Your appraisal report has been generated successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate report";
      setGenerationError(errorMessage);

      enhancedToast.error({
        title: "Generation Failed",
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Simulated generation for demo purposes
  const handleSimulatedGeneration = async () => {
    try {
      setIsGenerating(true);
      setGenerationError(null);
      setIsSuccess(false);

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Check for "error" condition for demo purposes
      const hasErrors = checklistItems.some((item) => item.status === CheckItemStatus.ERROR);
      if (hasErrors) {
        throw new Error("Cannot generate report with unresolved critical issues");
      }

      setIsSuccess(true);
      enhancedToast.success({
        title: "Report Generated",
        description: "Your appraisal report has been generated successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate report";
      setGenerationError(errorMessage);

      enhancedToast.error({
        title: "Generation Failed",
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunAiCheck = async () => {
    // Simulate AI check
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Update checklist with AI recommendations
    setChecklistItems((prev) => {
      const updated = [...prev];

      // Find the error item and update it
      const floodMapItem = updated.find((item) => item.id === "6");
      if (floodMapItem) {
        floodMapItem.status = CheckItemStatus.WARNING;
        floodMapItem.detail =
          "AI found potential flood zone data: Zone X, Panel 123. Please verify.";
      }

      // Add a new AI-recommended item
      const newItem: ChecklistItem = {
        id: "10",
        title: "Additional Comparable Support",
        status: CheckItemStatus.PENDING,
        requiredForCompletion: false,
        aiRecommended: true,
        description: "AI suggests adding two more comparable sales that better match subject size",
        group: "Recommendations",
      };

      return [...updated, newItem];
    });

    return Promise.resolve();
  };

  // Handle checklist item click
  const handleChecklistItemClick = (item: ChecklistItem) => {
    enhancedToast.info({
      title: "Action Required",
      description: `Navigate to the appropriate section to address: ${item.title}`,
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs defaultValue="format" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4"><>

          <TabsTrigger value="format">Report Format</TabsTrigger>
          <TabsTrigger
</> value="options">Options</TabsTrigger>
          <TabsTrigger value="verify">Pre-Flight Check</TabsTrigger>
        </TabsList>

        {/* Format selection tab */}
        <TabsContent value="format">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4"><>

              <h3 className="text-lg font-medium">Select Report Format</h3>

              <RadioGroup
</>
                value={selectedFormat}
                onValueChange={(value) => handleFormatChange(value as ReportFormat)}
                className="space-y-3"
              >
                {Object.entries(formatConfig).map(([format, config]) => (
                  <div key={format} className="flex items-start space-x-3">
                    <RadioGroupItem value={format} id={format} className="mt-1" />
                    <Label htmlFor={format} className="flex-1 cursor-pointer space-y-1"><>

                      <span className="font-medium">{config.title}</span>
                      <p
</> className="text-sm text-muted-foreground">{config.description}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4"><>

              <h3 className="text-lg font-medium">Output Formats</h3>
              <p
</> className="text-sm text-muted-foreground">Select one or more output formats</p>

              <div className="space-y-3 mt-4">
                {formatConfig[selectedFormat].outputOptions.map((format) => (
                  <div key={format} className="flex items-start space-x-3">
                    <Switch
                      id={`output-${format}`}
                      checked={selectedOutputFormats.includes(format)}
                      onCheckedChange={() => toggleOutputFormat(format)}
                    />
                    <Label htmlFor={`output-${format}`} className="flex-1 cursor-pointer space-y-1"><>

                      <span className="font-medium flex items-center gap-2">
                        {outputFormatConfig[format].icon}
                        {outputFormatConfig[format].label}
                      </span>
                      <p
</> className="text-sm text-muted-foreground">
                        {outputFormatConfig[format].description}
                      </p>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={() => setActiveTab("options")}>
              Advanced Options
              <Settings2 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        {/* Advanced options tab */}
        <TabsContent value="options">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4"><>

              <h3 className="text-lg font-medium">Content Options</h3>

              <div
</> className="space-y-3">
                <div className="flex items-center justify-between"><>

                  <Label htmlFor="include-photos" className="cursor-pointer">
                    Include Photos
                  </Label>
                  <Switch
</>
                    id="include-photos"
                    checked={advancedOptions.includePhotos}
                    onCheckedChange={() => handleAdvancedOptionChange("includePhotos")}
                  />
                </div>

                <div className="flex items-center justify-between"><>

                  <Label htmlFor="include-maps" className="cursor-pointer">
                    Include Maps
                  </Label>
                  <Switch
</>
                    id="include-maps"
                    checked={advancedOptions.includeMaps}
                    onCheckedChange={() => handleAdvancedOptionChange("includeMaps")}
                  />
                </div>

                <div className="flex items-center justify-between"><>

                  <Label htmlFor="include-data-sources" className="cursor-pointer">
                    Include Data Sources
                  </Label>
                  <Switch
</>
                    id="include-data-sources"
                    checked={advancedOptions.includeDataSources}
                    onCheckedChange={() => handleAdvancedOptionChange("includeDataSources")}
                  />
                </div>

                <div className="flex items-center justify-between"><>

                  <Label htmlFor="include-ai-analysis" className="cursor-pointer">
                    Include AI Analysis
                  </Label>
                  <Switch
</>
                    id="include-ai-analysis"
                    checked={advancedOptions.includeAiAnalysis}
                    onCheckedChange={() => handleAdvancedOptionChange("includeAiAnalysis")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4"><>

              <h3 className="text-lg font-medium">Output Options</h3>

              <div
</> className="space-y-3">
                <div className="flex items-center justify-between"><>

                  <Label htmlFor="watermark" className="cursor-pointer">
                    Add Watermark
                  </Label>
                  <Switch
</>
                    id="watermark"
                    checked={advancedOptions.watermark}
                    onCheckedChange={() => handleAdvancedOptionChange("watermark")}
                  />
                </div>

                <div className="flex items-center justify-between"><>

                  <Label htmlFor="compress-files" className="cursor-pointer">
                    Compress Files
                  </Label>
                  <Switch
</>
                    id="compress-files"
                    checked={advancedOptions.compressFiles}
                    onCheckedChange={() => handleAdvancedOptionChange("compressFiles")}
                  />
                </div>

                <div className="flex items-center justify-between"><>

                  <Label htmlFor="encrypted" className="cursor-pointer">
                    Encrypted (Password Protected)
                  </Label>
                  <Switch
</>
                    id="encrypted"
                    checked={advancedOptions.encrypted}
                    onCheckedChange={() => handleAdvancedOptionChange("encrypted")}
                  />
                </div>

                <div className="flex items-center justify-between"><>

                  <Label htmlFor="embedded-fonts" className="cursor-pointer">
                    Embed Fonts
                  </Label>
                  <Switch
</>
                    id="embedded-fonts"
                    checked={advancedOptions.embeddedFonts}
                    onCheckedChange={() => handleAdvancedOptionChange("embeddedFonts")}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6"><>

            <Button variant="outline" onClick={() => setActiveTab("format")}>
              Back to Format Selection
            </Button>
            <Button
</> onClick={() => setActiveTab("verify")}>
              Continue to Pre-Flight Check
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        {/* Verification tab */}
        <TabsContent value="verify">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2"><>

              <SmartChecklist
                items={checklistItems}
                onItemClick={handleChecklistItemClick}
                onRunAiCheck={handleRunAiCheck}
                title="Pre-Flight Verification"
                description="Ensure all required items are complete before generating report"
                grouped={true}
              />
            </div>

            <div
</> className="space-y-4">
              <AssistantPanel
                type={AssistantType.COMPLIANCE}
                collapsible={false}
                suggestions={[
                  "Check for missing data fields",
                  "Is my report GSE compliant?",
                  "How can I fix the flood data issue?",
                ]}
              />

              <Card className="border-t-4 border-t-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Report Configuration</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between pb-2 border-b"><>

                      <span className="text-muted-foreground">Format:</span>
                      <span
</> className="font-medium">{formatConfig[selectedFormat].title}</span>
                    </div>

                    <div className="flex justify-between pb-2 border-b"><>

                      <span className="text-muted-foreground">Output Formats:</span>
                      <div
</> className="flex flex-col items-end gap-1">
                        {selectedOutputFormats.map((format) => (
                          <span key={format} className="font-medium flex items-center">
                            {outputFormatConfig[format].icon}
                            <span className="ml-1">{outputFormatConfig[format].label}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between"><>

                      <span className="text-muted-foreground">Status:</span>
                      <span
</>
                        className={`font-medium flex items-center ${
                          checklistItems.some((item) => item.status === CheckItemStatus.ERROR)
                            ? "text-destructive"
                            : checklistItems.some((item) => item.status === CheckItemStatus.WARNING)
                              ? "text-amber-500"
                              : "text-green-500"
                        }`}
                      >
                        {checklistItems.some((item) => item.status === CheckItemStatus.ERROR) ? (
                          <AlertCircle className="h-4 w-4 mr-1" />
                        ) : checklistItems.some(
                            (item) => item.status === CheckItemStatus.WARNING
                          ) ? (
                          <AlertCircle className="h-4 w-4 mr-1" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        {checklistItems.some((item) => item.status === CheckItemStatus.ERROR)
                          ? "Critical Issues"
                          : checklistItems.some((item) => item.status === CheckItemStatus.WARNING)
                            ? "Warnings Present"
                            : "Ready for Generation"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-between mt-6"><>

            <Button variant="outline" onClick={() => setActiveTab("options")}>
              Back to Options
            </Button>

            <div
</> className="flex gap-2">
              {isSuccess && (
                <Button variant="outline" className="gap-1">
                  <Download className="h-4 w-4" />
                  Download Report
                </Button>
              )}

              <LoadingState isLoading={isGenerating} loadingText="Generating..." variant="inline">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating || selectedOutputFormats.length === 0}
                >
                  {isSuccess ? (
                    <>
                      <CloudIcon className="mr-2 h-4 w-4" />
                      Regenerate Report
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </LoadingState>
            </div>
          </div>

          {generationError && (
            <ErrorState
              title="Report Generation Failed"
              message={generationError}
              onRetry={handleGenerateReport}
              className="mt-4"
            />
          )}

          {isSuccess && (
            <SuccessState
              title="Report Generated Successfully"
              message="Your appraisal report has been generated and is ready for delivery."
              className="mt-4"
              showActions={true}
              onContinue={() => setLocation("/delivery")}
              continueText="Proceed to Delivery"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
