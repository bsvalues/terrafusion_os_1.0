import React, { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { PageLayout } from "@/components/layout/page-layout";
import { PropertyDataWizard } from "@/components/property/PropertyDataWizard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Info, ArrowLeft  } from '@mui/icons-material';

export default function PropertyEntryPage() {
  const [_, params] = useRoute("/property-entry/:id?");
  const propertyId = params?.id ? parseInt(params.id) : undefined;

  const [isCompleted, setIsCompleted] = useState(false);
  const [completedPropertyId, setCompletedPropertyId] = useState<number | null>(null);
  const [location, navigate] = useLocation();

  const handleComplete = (id: number) => {
    setCompletedPropertyId(id);
    setIsCompleted(true);
  };

  return (
    <PageLayout
      title={propertyId ? "Edit Property" : "New Property Entry"}
      description={
        propertyId
          ? "Update existing property information"
          : "Create a new property entry with our step-by-step wizard"
      }
      backUrl="/"
      backText="Back to Dashboard"
    >
      {isCompleted ? (
        <div className="max-w-4xl mx-auto">
          <Alert className="bg-success/20 border-success mb-6">
            <CheckCircle2 className="h-4 w-4 text-success" /><>

            <AlertTitle>Property {propertyId ? "updated" : "created"} successfully!</AlertTitle>
            <AlertDescription
</>>
              The property information has been saved to the database.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4"><>

            <Button onClick={() => navigate(`/property/${completedPropertyId}`)} size="lg">
              View Property Details
            </Button>

            <Button
</>
              variant="outline"
              onClick={() => {
                setIsCompleted(false);
                if (!propertyId) {
                  // Reset form for a new entry
                  navigate("/property-entry");
                }
              }}
              size="lg"
            >
              {propertyId ? "Continue Editing" : "Add Another Property"}
            </Button>

            <Button variant="secondary" onClick={() => navigate("/workflow")} size="lg">
              Continue to Workflow
            </Button>
          </div>

          <Alert className="mt-8 bg-muted">
            <Info className="h-4 w-4" /><>

            <AlertTitle>Next Steps</AlertTitle>
            <AlertDescription
</>>
              <ul className="list-disc list-inside space-y-1 mt-2"><>

                <li>Add property photos and sketches</li>
                            <li
</>>Complete the appraisal form</li><>

                <li>Select comparable properties</li>
                            <li
</>>Generate your final report</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <PropertyDataWizard propertyId={propertyId} onComplete={handleComplete} />
      )}
    </PageLayout>
  );
}
