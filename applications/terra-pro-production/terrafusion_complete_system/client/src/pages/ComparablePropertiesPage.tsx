import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdjustmentModel, Comparable, Property } from "@shared/schema";
import { useAdjustmentModels } from "@/hooks/useAdjustmentModels";

// Components
import { AdjustmentModelSelector } from "@/components/AdjustmentModelSelector";
import { ComparableAdjustments } from "@/components/ComparableAdjustments";
import { MarketAnalysisDashboard } from "@/components/MarketAnalysisDashboard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileBarChart, HelpCircle, Table  } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";

export function ComparablePropertiesPage() {
  const { reportId } = useParams();
  const parsedReportId = reportId ? parseInt(reportId) : undefined;
  const { toast } = useToast();

  const [selectedComparableId, setSelectedComparableId] = useState<number | undefined>(undefined);
  const [selectedModelId, setSelectedModelId] = useState<number | undefined>(undefined);
  const [activeViewTab, setActiveViewTab] = useState<string>("adjustments");

  // Get report data
  const { data: report, isLoading: isLoadingReport } = useQuery({
    queryKey: ["/api/appraisal-reports", parsedReportId],
    queryFn: async () => {
      if (!parsedReportId) return null;
      const response = await apiRequest(`/api/appraisal-reports/${parsedReportId}`);
      return response.json();
    },
    enabled: !!parsedReportId,
  });

  // Get property data
  const { data: property, isLoading: isLoadingProperty } = useQuery({
    queryKey: ["/api/properties", report?.propertyId],
    queryFn: async () => {
      if (!report?.propertyId) return null;
      const response = await apiRequest(`/api/properties/${report.propertyId}`);
      return response.json();
    },
    enabled: !!report?.propertyId,
  });

  // Get comparables
  const { data: comparables, isLoading: isLoadingComparables } = useQuery({
    queryKey: ["/api/reports", parsedReportId, "comparables"],
    queryFn: async () => {
      if (!parsedReportId) return [];
      const response = await apiRequest(`/api/reports/${parsedReportId}/comparables`);
      return response.json();
    },
    enabled: !!parsedReportId,
  });

  // Get adjustment models
  const { models, isLoadingModels } = useAdjustmentModels(parsedReportId);

  useEffect(() => {
    // Set initial comparable if we have them but none selected
    if (comparables?.length > 0 && !selectedComparableId) {
      setSelectedComparableId(comparables[0].id);
    }

    // Set initial model if we have them but none selected
    if (models?.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0].id);
    }
  }, [comparables, models, selectedComparableId, selectedModelId]);

  const handleModelSelect = (model: AdjustmentModel) => {
    setSelectedModelId(model.id);
    toast({
      title: "Model Selected",
      description: `"${model.name}" is now the active adjustment model`,
    });
  };

  const selectedComparable = comparables?.find((c) => c.id === selectedComparableId);
  const selectedModel = models?.find((m) => m.id === selectedModelId);

  const isLoading = isLoadingReport || isLoadingProperty || isLoadingComparables || isLoadingModels;

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader><>

            <CardTitle>Report Not Found</CardTitle>
            <CardDescription
</>>The requested appraisal report could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (comparables?.length === 0) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader><>

            <CardTitle>No Comparables Found</CardTitle>
            <CardDescription
</>>
              This report does not have any comparable properties defined.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8 flex-col">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" /><>

              <p className="text-center text-muted-foreground mb-4">
                To perform adjustments, you need to add comparable properties to this report first.
              </p>
              <Button
</>>Add Comparable Properties</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-2xl font-bold tracking-tight">Comparable Properties</h1>
          <p
</> className="text-muted-foreground">
            Manage adjustments and analyze comparable properties for this report
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><>

            <HelpCircle className="mr-2 h-4 w-4" />
            Help
          </Button>
          <Button
</>>
            <FileBarChart className="mr-2 h-4 w-4" />
            Generate Grid
          </Button>
        </div>
      </div>

      <Tabs defaultValue="adjustments" value={activeViewTab} onValueChange={setActiveViewTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="adjustments"><>

              <Table className="mr-2 h-4 w-4" />
              Adjustments
            </TabsTrigger>
            <TabsTrigger
</> value="market-analysis">
              <FileBarChart className="mr-2 h-4 w-4" />
              Market Analysis
            </TabsTrigger>
          </TabsList>

          {activeViewTab === "adjustments" && comparables?.length > 0 && (
            <Select
              value={selectedComparableId?.toString()}
              onValueChange={(value) => setSelectedComparableId(parseInt(value))}
            >
              <SelectTrigger className="w-[250px]"><>

                <SelectValue placeholder="Select comparable" />
              </SelectTrigger>
              <SelectContent
</>>
                {comparables.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id.toString()}>
                    {comp.address}, {comp.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <TabsContent value="adjustments" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1"><>

              <AdjustmentModelSelector
                reportId={parsedReportId!}
                propertyId={property?.id}
                selectedModelId={selectedModelId}
                onSelectModel={handleModelSelect}
              />
            </div>

            <div
</> className="md:col-span-2">
              {selectedComparable && selectedModel && property ? (
                <ComparableAdjustments
                  subjectProperty={property as Property}
                  comparable={selectedComparable as Comparable}
                  selectedModel={selectedModel as AdjustmentModel}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p>
                      Select a comparable property and adjustment model to view or manage
                      adjustments
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="market-analysis" className="mt-0">
          <MarketAnalysisDashboard reportId={parsedReportId!} property={property as Property} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
