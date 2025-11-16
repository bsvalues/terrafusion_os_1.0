import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { UADForm } from "@/components/uad/UADForm";
import { UADFormProvider } from "@/contexts/UADFormContext";
import { usePropertyData } from "@/hooks/usePropertyData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Home, FileText, Database, Refresh  } from '@mui/icons-material';
import { PropertyInfoCard } from "@/components/property/PropertyInfoCard";
import { PropertyDataRetrieval } from "@/components/property/PropertyDataRetrieval";

export default function UADFormPage() {
  const { id } = useParams<{ id?: string }>();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("form");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Convert ID to number if it exists
  const propertyId = id ? parseInt(id) : undefined;

  // Get property data
  const { useProperty, retrievePropertyData, isRetrievingPropertyData } = usePropertyData();
  const { data: property, isLoading, error } = useProperty(propertyId);

  useEffect(() => {
    if (error) {
      setErrorMessage("Failed to load property data. Please try again later.");
      console.error("Property data error:", error);
    } else {
      setErrorMessage(null);
    }
  }, [error]);

  // Handle property retrieval
  const handlePropertyDataRefresh = async () => {
    if (!propertyId) return;

    try {
      await retrievePropertyData({ propertyId });
    } catch (error) {
      console.error("Error refreshing property data:", error);
      setErrorMessage("Failed to refresh property data. Please try again.");
    }
  };

  // Handle property selection (if no ID provided)
  const handlePropertySelect = (selectedPropertyId: number) => {
    setLocation(`/uad-form/${selectedPropertyId}`);
  };

  // No property ID state
  if (!propertyId) {
    return (
      <div className="container py-8"><>

        <h1 className="text-3xl font-bold tracking-tight mb-6">UAD Form</h1>
        <Alert
</> className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-500" /><>

          <AlertTitle className="text-blue-700">No Property Selected</AlertTitle>
          <AlertDescription
</> className="text-blue-600">
            Please select a property to view its UAD form. You can select a property from the
            properties list.
          </AlertDescription>
        </Alert>

        {/* In a real implementation, you would add a property selector here */}
        <Card>
          <CardHeader><>

            <CardTitle>Select Property</CardTitle>
            <CardDescription
</>>Choose a property to complete a UAD form for it</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <Button onClick={() => setLocation("/property-data")}>
                <Home className="mr-2 h-4 w-4" />
                Go to Property Management
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center"><>

            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p
</> className="text-muted-foreground">Loading property data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (errorMessage) {
    return (
      <div className="container py-8">
        <Alert className="mb-6 bg-red-50 border-red-200 text-red-800">
          <AlertCircle className="h-4 w-4 text-red-500" /><>

          <AlertTitle className="text-red-700">Error</AlertTitle>
          <AlertDescription
</> className="text-red-600">{errorMessage}</AlertDescription>
        </Alert>

        <div className="flex justify-center mt-6">
          <Button onClick={() => window.location.reload()}>
            <Refresh className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div><>

          <h1 className="text-3xl font-bold tracking-tight">UAD Appraisal Form</h1>
          <p
</> className="text-muted-foreground">
            {property?.address}, {property?.city}, {property?.state} {property?.zipCode}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/property/${propertyId}`)}
          >
            <Home className="mr-2 h-4 w-4" />
            Property Details
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="form"><>

            <FileText className="mr-2 h-4 w-4" />
            UAD Form
          </TabsTrigger>
          <TabsTrigger
</> value="property"><>

            <Home className="mr-2 h-4 w-4" />
            Property Details
          </TabsTrigger>
          <TabsTrigger
</> value="data">
            <Database className="mr-2 h-4 w-4" />
            Data Retrieval
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-6">
          <UADFormProvider>
            <UADForm propertyId={propertyId} />
          </UADFormProvider>
        </TabsContent>

        <TabsContent value="property" className="space-y-6"><>

          <PropertyInfoCard property={property} />
        </TabsContent>

        <TabsContent
</> value="data" className="space-y-6">
          <PropertyDataRetrieval
            propertyId={propertyId}
            onDataRetrieved={handlePropertyDataRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
