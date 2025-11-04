import React, { useEffect, useState } from "react";
import { UADFormSection as UADFormSectionComponent } from "./UADFormSection";
import { UADFormSection, UADField } from "./constants";
import { useUADForm } from "@/contexts/UADFormContext";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Save,
  RotateCcw,
  Warning,
  Check,
  Refresh,
  ExternalLink,
  Printer,
  FileUp,
  FileDown,
 } from '@mui/icons-material';
import { cn } from "@/lib/utils";

interface UADFormProps {
  propertyId?: number;
  initialViewMode?: boolean;
  className?: string;
}

export const UADForm: React.FC<UADFormProps> = ({
  propertyId,
  initialViewMode = false,
  className,
}) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    formData,
    updateField,
    isDataChanged,
    resetChanges,
    saveChanges,
    isSaving,
    loadFormDataFromProperty,
    isLoading,
    currentPropertyId,
    hasUnsavedChanges,
  } = useUADForm();

  // Load property data when the component mounts or propertyId changes
  useEffect(() => {
    if (propertyId && propertyId !== currentPropertyId) {
      loadFormDataFromProperty(propertyId);
    }
  }, [propertyId, currentPropertyId, loadFormDataFromProperty]);

  // Handle save
  const handleSave = async () => {
    try {
      await saveChanges();
      toast({
        title: "Form saved successfully",
        description: "All changes have been saved.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving form:", error);
      toast({
        title: "Error saving form",
        description: "An error occurred while saving the form.",
        variant: "destructive",
      });
    }
  };

  // Handle reset
  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    resetChanges();
    setShowResetConfirm(false);
    toast({
      title: "Form reset",
      description: "All changes have been reverted.",
      variant: "default",
    });
  };

  // Sync data with property - refreshes data from the database
  const handleRefresh = async () => {
    if (!currentPropertyId) return;

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes that will be lost if you refresh. Continue?"
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      await loadFormDataFromProperty(currentPropertyId);
      toast({
        title: "Form refreshed",
        description: "The form has been refreshed with the latest property data.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error refreshing form:", error);
      toast({
        title: "Error refreshing form",
        description: "An error occurred while refreshing the form.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle between edit and view modes
  const toggleViewMode = () => {
    setViewMode(!viewMode);
  };

  // Form sections configuration
  const formSections = [
    {
      id: UADFormSection.SUBJECT_PROPERTY,
      title: "Subject Property",
      description: "Basic information about the subject property",
    },
    {
      id: UADFormSection.IMPROVEMENTS,
      title: "Improvements",
      description: "Physical characteristics and condition of the improvements",
      subsections: [
        { id: "general", title: "General Characteristics" },
        { id: "rooms", title: "Room Count" },
        { id: "basement", title: "Basement & Finished Areas Below Grade" },
      ],
    },
    {
      id: UADFormSection.SITE,
      title: "Site",
      description: "Information about the site and land characteristics",
    },
    {
      id: UADFormSection.SALES_COMPARISON,
      title: "Sales Comparison Approach",
      description: "Comparable sales analysis and adjustments",
      subsections: [
        { id: "subject", title: "Subject" },
        { id: "comparable1", title: "Comparable #1" },
        { id: "comparable2", title: "Comparable #2" },
        { id: "comparable3", title: "Comparable #3" },
      ],
    },
    {
      id: UADFormSection.RECONCILIATION,
      title: "Reconciliation",
      description: "Final value reconciliation and conclusions",
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center"><>

          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p
</> className="text-muted-foreground">Loading form data...</p>
        </div>
      </div>
    );
  }

  // No property selected state
  if (!currentPropertyId && !propertyId) {
    return (
      <div className="text-center p-8">
        <Warning className="mx-auto h-12 w-12 text-amber-500 mb-4" /><>

        <h3 className="text-xl font-semibold mb-2">No Property Selected</h3>
        <p
</> className="text-muted-foreground mb-4">
          Please select a property to load the appraisal form.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Form Header and Controls */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><>

          <h1 className="text-2xl font-bold tracking-tight">
            Uniform Residential Appraisal Report
          </h1>
          <p
</> className="text-muted-foreground">
            Form 1004 UAD / Fannie Mae Form 1004 / Freddie Mac Form 70
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={toggleViewMode}>
            {viewMode ? (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Edit Mode
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                View Mode
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}><>

            <Refresh className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button
</> variant="outline" size="sm"><>

            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>

          <Button
</> variant="outline" size="sm"><>

            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>

          <Button
</> variant="outline" size="sm">
            <FileUp className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <Alert className="mb-6 bg-amber-50 border-amber-500">
          <Warning className="h-4 w-4 text-amber-500" /><>

          <AlertTitle className="text-amber-700">Unsaved Changes</AlertTitle>
          <AlertDescription
</> className="text-amber-600">
            You have unsaved changes. Be sure to save your work before navigating away.
          </AlertDescription>
        </Alert>
      )}

      {/* Form Sections */}
      {formSections.map((section) => (
        <UADFormSectionComponent
          key={section.id}
          title={section.title}
          description={section.description}
          section={section.id}
          subsections={section.subsections}
          isCollapsible={true}
          defaultExpanded={section.id === UADFormSection.SUBJECT_PROPERTY}
        />
      ))}

      {/* Form Controls */}
      <div className="sticky bottom-4 flex justify-end space-x-4 bg-background p-4 border rounded-lg shadow-md">
        <Button variant="outline" onClick={handleReset} disabled={!isDataChanged || isSaving}><>

          <RotateCcw className="mr-2 h-4 w-4" />
          Reset Changes
        </Button>

        <Button
</> onClick={handleSave} disabled={!isDataChanged || isSaving}>
          {isSaving ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-b-2 rounded-full border-background"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><>

            <AlertDialogTitle>Reset Form Changes?</AlertDialogTitle>
            <AlertDialogDescription
</>>
              This will discard all unsaved changes and revert the form to its last saved state.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><>

            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
</> onClick={confirmReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
