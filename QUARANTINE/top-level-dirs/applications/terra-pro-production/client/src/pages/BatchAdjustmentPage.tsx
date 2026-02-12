import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BatchAdjustments from "@/components/BatchAdjustments";
import { Loader2  } from '@mui/icons-material';

// Demo data for comparables
const demoComparables = [
  {
    id: "comp1",
    address: "123 Oak Street",
    city: "Example City",
    state: "CA",
    zipCode: "90210",
    salePrice: "850000",
    saleDate: "2025-01-15",
    propertyType: "Single Family",
    yearBuilt: 2005,
    grossLivingArea: "2250",
    bedrooms: "4",
    bathrooms: "2.5",
    adjustments: [],
  },
  {
    id: "comp2",
    address: "456 Maple Avenue",
    city: "Example City",
    state: "CA",
    zipCode: "90210",
    salePrice: "925000",
    saleDate: "2025-02-03",
    propertyType: "Single Family",
    yearBuilt: 2010,
    grossLivingArea: "2450",
    bedrooms: "4",
    bathrooms: "3",
    adjustments: [
      {
        id: "adj1",
        comparableId: "comp2",
        adjustmentType: "Location",
        amount: "15000",
        description: "Superior location adjustment",
      },
    ],
  },
  {
    id: "comp3",
    address: "789 Pine Boulevard",
    city: "Example City",
    state: "CA",
    zipCode: "90211",
    salePrice: "795000",
    saleDate: "2025-01-28",
    propertyType: "Single Family",
    yearBuilt: 2001,
    grossLivingArea: "2100",
    bedrooms: "3",
    bathrooms: "2",
    adjustments: [],
  },
  {
    id: "comp4",
    address: "101 Cedar Lane",
    city: "Example City",
    state: "CA",
    zipCode: "90212",
    salePrice: "875000",
    saleDate: "2025-02-12",
    propertyType: "Single Family",
    yearBuilt: 2008,
    grossLivingArea: "2350",
    bedrooms: "4",
    bathrooms: "2.5",
    adjustments: [
      {
        id: "adj2",
        comparableId: "comp4",
        adjustmentType: "GLA",
        amount: "-8500",
        description: "Size adjustment - smaller than subject",
      },
    ],
  },
  {
    id: "comp5",
    address: "222 Birch Road",
    city: "Example City",
    state: "CA",
    zipCode: "90213",
    salePrice: "940000",
    saleDate: "2025-02-22",
    propertyType: "Single Family",
    yearBuilt: 2012,
    grossLivingArea: "2550",
    bedrooms: "5",
    bathrooms: "3.5",
    adjustments: [],
  },
];

const BatchAdjustmentPage = () => {
  const { toast } = useToast();
  const [comparables, setComparables] = useState(demoComparables);
  const [isLoading, setIsLoading] = useState(false);
  const appraisalId = "appraisal123"; // Demo appraisal ID

  // Fetch comparables (in a real implementation)
  useEffect(() => {
    const fetchComparables = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, we would fetch comparables from the API
        // const response = await fetch(`/api/appraisals/${appraisalId}/comparables`);
        // const data = await response.json();
        // setComparables(data);

        // Demo mode - use the demo data
        // Small delay to simulate API call
        setTimeout(() => {
          setComparables(demoComparables);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching comparables:", error);
        toast({
          title: "Error",
          description: "Failed to load comparables. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchComparables();
  }, [toast]);

  // Handle updates to comparables
  const handleUpdateComparables = (updatedComparables) => {
    setComparables(updatedComparables);
  };

  return (
    <div className="container max-w-7xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div><>

          <h1 className="text-3xl font-bold">Batch Adjustment & Export</h1>
          <p
</> className="text-gray-500 mt-1">
            Adjust multiple comparable properties and export them as PDF or ZIP
          </p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          Back
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader><>

          <CardTitle>Appraisal Summary</CardTitle>
          <CardDescription
</>>Properties being adjusted for appraisal #{appraisalId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div><>

              <p className="text-sm font-medium text-gray-500">Subject Property</p>
              <p
</> className="font-medium">123 Main Street, Example City</p>
            </div>
            <div><>

              <p className="text-sm font-medium text-gray-500">Appraisal Date</p>
              <p
</> className="font-medium">May 9, 2025</p>
            </div>
            <div><>

              <p className="text-sm font-medium text-gray-500">Appraiser</p>
              <p
</> className="font-medium">John Smith</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading comparables...</span>
        </div>
      ) : (
        <BatchAdjustments
          comparables={comparables}
          onUpdate={handleUpdateComparables}
          appraisalId={appraisalId}
        />
      )}
    </div>
  );
};

export default BatchAdjustmentPage;
