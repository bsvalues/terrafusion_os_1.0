import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePropertyData } from "@/hooks/usePropertyData";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { RefreshCcw, Loader2, CheckCircle, AlertCircle, Info  } from '@mui/icons-material';

interface PropertyDataRetrievalProps {
  propertyId: number;
  reportId?: number;
  onDataRetrieved?: (property: any) => void;
}

export function PropertyDataRetrieval({
  propertyId,
  reportId,
  onDataRetrieved,
}: PropertyDataRetrievalProps) {
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [retrievalStep, setRetrievalStep] = useState<string | null>(null);
  const { toast } = useToast();
  const { retrievePropertyData, isRetrievingPropertyData } = usePropertyData();
  const { data: property } = usePropertyData().useProperty(propertyId);

  // Function to simulate the retrieval progress
  // In a real implementation, this would be based on actual backend progress updates via WebSockets
  const simulateProgressSteps = () => {
    setIsRetrieving(true);
    setProgress(0);
    setRetrievalStep("Connecting to property data sources...");

    // Create a series of steps with timeouts to simulate the progress
    const steps = [
      { message: "Connecting to property data sources...", progress: 10, delay: 500 },
      { message: "Retrieving property records...", progress: 25, delay: 1000 },
      { message: "Analyzing property characteristics...", progress: 45, delay: 1500 },
      { message: "Verifying tax assessment data...", progress: 65, delay: 1000 },
      { message: "Checking sales history...", progress: 80, delay: 1000 },
      { message: "Finalizing property details...", progress: 95, delay: 1000 },
    ];

    let currentStep = 0;

    const runNextStep = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setRetrievalStep(step.message);
        setProgress(step.progress);
        currentStep++;
        setTimeout(runNextStep, step.delay);
      } else {
        // Complete the progress after all steps
        setProgress(100);
        setRetrievalStep("Data retrieval complete");
        // Leave the progress showing complete for a moment before resetting
        setTimeout(() => {
          setIsRetrieving(false);
          setRetrievalStep(null);
        }, 1500);
      }
    };

    // Start the simulation
    runNextStep();
  };

  const handleRetrieveData = async () => {
    try {
      // Start the progress simulation
      simulateProgressSteps();

      // Trigger the actual data retrieval
      const updatedProperty = await retrievePropertyData({ propertyId, reportId });

      // Show success message
      toast({
        title: "Property Data Retrieved",
        description: "Successfully retrieved and updated property information.",
        variant: "default",
      });

      // Call the callback if provided
      if (onDataRetrieved) {
        onDataRetrieved(updatedProperty);
      }
    } catch (error) {
      console.error("Error retrieving property data:", error);

      // Show error message
      toast({
        title: "Data Retrieval Failed",
        description: "There was an error retrieving property data. Please try again.",
        variant: "destructive",
      });

      // Reset the progress state
      setIsRetrieving(false);
      setRetrievalStep(null);
    }
  };

  // Determine data quality indicators
  const getDataCompleteness = () => {
    if (!property) return 0;

    // Calculate completeness based on how many fields are filled out
    const requiredFields = [
      "address",
      "city",
      "state",
      "zipCode",
      "yearBuilt",
      "grossLivingArea",
      "bedrooms",
      "bathrooms",
    ];
    const optionalFields = [
      "lotSize",
      "garageSize",
      "propertyType",
      "condition",
      "constructionQuality",
    ];

    const filledRequiredCount = requiredFields.filter((field) => !!property[field]).length;
    const filledOptionalCount = optionalFields.filter((field) => !!property[field]).length;

    // Weight required fields more heavily than optional
    return (
      (filledRequiredCount / requiredFields.length) * 0.7 +
      (filledOptionalCount / optionalFields.length) * 0.3
    );
  };

  const dataCompleteness = property ? getDataCompleteness() * 100 : 0;
  const completenessText = property
    ? dataCompleteness > 80
      ? "Complete"
      : dataCompleteness > 50
        ? "Partial"
        : "Minimal"
    : "Unknown";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><>

          <RefreshCcw size={18} />
          Property Data Retrieval
        </CardTitle>
        <CardDescription
</>>
          Automatically retrieve property details from public records and AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {property && (
          <div className="space-y-3">
            <div className="flex justify-between items-center"><>

              <span className="text-sm text-muted-foreground">Data Completeness:</span>
              <span
</>
                className={cn(
                  "text-sm font-medium",
                  dataCompleteness > 80
                    ? "text-green-600"
                    : dataCompleteness > 50
                      ? "text-amber-600"
                      : "text-red-600"
                )}
              >
                {completenessText}
              </span>
            </div>
            <Progress
              value={dataCompleteness}
              className={cn(
                dataCompleteness > 80
                  ? "bg-green-200"
                  : dataCompleteness > 50
                    ? "bg-amber-200"
                    : "bg-red-200",
                "h-2"
              )}
            />

            <div className="pt-3 grid grid-cols-2 gap-2 text-sm">
              <div><>

                <span className="block text-muted-foreground">Year Built:</span>
                <span
</> className="font-medium">{property.yearBuilt || "Unknown"}</span>
              </div>
              <div><>

                <span className="block text-muted-foreground">Square Footage:</span>
                <span
</> className="font-medium">{property.grossLivingArea || "Unknown"}</span>
              </div>
              <div><>

                <span className="block text-muted-foreground">Bedrooms:</span>
                <span
</> className="font-medium">{property.bedrooms || "Unknown"}</span>
              </div>
              <div><>

                <span className="block text-muted-foreground">Bathrooms:</span>
                <span
</> className="font-medium">{property.bathrooms || "Unknown"}</span>
              </div>
            </div>
          </div>
        )}

        {isRetrieving && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-sm font-medium">{retrievalStep}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {!property && !isRetrieving && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Info size={40} className="text-muted-foreground mb-4" /><>

            <h3 className="text-lg font-medium">No Property Data Available</h3>
            <p
</> className="text-sm text-muted-foreground max-w-sm mt-1">
              Click "Retrieve Data" to automatically fetch property details from public records.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleRetrieveData}
          disabled={isRetrieving || isRetrievingPropertyData}
          className="w-full"
        >
          {isRetrieving || isRetrievingPropertyData ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Retrieving Data...
            </>
          ) : (
            <>
              <RefreshCcw size={16} className="mr-2" />
              Retrieve Property Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
