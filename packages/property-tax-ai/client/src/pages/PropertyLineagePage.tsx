import React, { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineageTimeline, DataLineageEntry } from "@/components/data-lineage/LineageTimeline";
import { LineageFilters, LineageFiltersState } from "@/components/data-lineage/LineageFilters";
import { CardSkeleton } from "@/components/ui/card-skeleton";
import { Icons } from "@/components/ui/icons";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function PropertyLineagePage() {
  const [, params] = useParams();
  const propertyId = params?.propertyId;
  const [filters, setFilters] = useState<LineageFiltersState>({});
  const [activeEntry, setActiveEntry] = useState<DataLineageEntry | null>(null);
  
  // Fetch property details
  const propertyQuery = useQuery({
    queryKey: ['/api/properties', propertyId],
    enabled: !!propertyId,
  });
  
  // Fetch data lineage entries with filters
  const lineageQuery = useQuery({
    queryKey: ['/api/data-lineage/property', propertyId, filters],
    enabled: !!propertyId,
  });
  
  // Fetch available fields
  const fieldsQuery = useQuery({
    queryKey: ['/api/data-lineage/fields'],
  });
  
  // Fetch available users
  const usersQuery = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Reset active entry when filters change
  useEffect(() => {
    setActiveEntry(null);
  }, [filters]);
  
  // Handle filter changes
  const handleFilterChange = (newFilters: LineageFiltersState) => {
    setFilters(newFilters);
  };
  
  // Handle entry click
  const handleEntryClick = (entry: DataLineageEntry) => {
    setActiveEntry(entry);
  };
  
  // Format date for display
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return format(new Date(date), "PPP 'at' p");
  };
  
  // If property ID is missing, show error
  if (!propertyId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Property ID is missing</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please provide a valid property ID to view its lineage history.</p>
            <Button asChild className="mt-4">
              <Link href="/properties">Back to Properties</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Loading property or lineage data
  const isLoading = propertyQuery.isLoading || lineageQuery.isLoading;
  
  // Error loading property data
  if (propertyQuery.isError) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load property data</CardDescription>
          </CardHeader>
          <CardContent>
            <p>There was an error loading the property information. Please try again later.</p>
            <Button asChild className="mt-4">
              <Link href="/properties">Back to Properties</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Extract property data
  const property = propertyQuery.data;
  
  // Get available sources from lineage data
  const availableSources = React.useMemo(() => {
    if (lineageQuery.data?.length) {
      const sources = [...new Set(lineageQuery.data.map((item: any) => item.source))];
      return sources.sort();
    }
    return [];
  }, [lineageQuery.data]);
  
  // Transform lineage data into timeline entries
  const lineageEntries: DataLineageEntry[] = React.useMemo(() => {
    if (!lineageQuery.data) return [];
    
    return lineageQuery.data.map((item: any) => ({
      id: item.id,
      propertyId: item.propertyId,
      fieldName: item.fieldName,
      oldValue: item.oldValue,
      newValue: item.newValue,
      changeTimestamp: new Date(item.changeTimestamp),
      source: item.source,
      userId: item.userId,
      userName: item.userName || `User #${item.userId}`,
      details: item.sourceDetails,
    }));
  }, [lineageQuery.data]);
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold mb-2">Property Data Lineage</h1>
          <Button variant="outline" asChild>
            <Link href="/properties">
              <Icons.arrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Link>
          </Button>
        </div>
        
        {isLoading ? (
          <CardSkeleton className="mt-4" />
        ) : (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{property?.address || "Property Details"}</CardTitle>
              <CardDescription>
                ID: {propertyId}
                {property?.parcelNumber && ` | Parcel: ${property.parcelNumber}`}
                {property?.propertyType && ` | Type: ${property.propertyType}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Property Information</h3>
                  <div className="space-y-1">
                    <p><span className="font-medium">Status:</span> {property?.status || "N/A"}</p>
                    <p><span className="font-medium">Value:</span> {property?.value ? `$${property.value}` : "N/A"}</p>
                    <p><span className="font-medium">Acres:</span> {property?.acres || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Timeline Information</h3>
                  <div className="space-y-1">
                    <p><span className="font-medium">Created:</span> {formatDate(property?.createdAt)}</p>
                    <p><span className="font-medium">Last Updated:</span> {formatDate(property?.lastUpdated)}</p>
                    <p>
                      <span className="font-medium">Changes:</span> {lineageEntries.length || 0} recorded
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <LineageFilters
            availableSources={availableSources}
            availableFields={fieldsQuery.data || []}
            availableUsers={usersQuery.data || []}
            onChange={handleFilterChange}
            value={filters}
          />
          
          {activeEntry && (
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base">Change Details</CardTitle>
                <CardDescription>
                  {format(new Date(activeEntry.changeTimestamp), "PPP 'at' p")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Field</h3>
                  <p className="font-medium">{activeEntry.fieldName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Old Value</h3>
                  <div className="p-2 bg-muted/50 rounded-md whitespace-pre-wrap">
                    {activeEntry.oldValue || "(empty)"}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">New Value</h3>
                  <div className="p-2 bg-muted/50 rounded-md whitespace-pre-wrap">
                    {activeEntry.newValue || "(empty)"}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Changed By</h3>
                  <p>{activeEntry.userName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Source</h3>
                  <p>{activeEntry.source.charAt(0).toUpperCase() + activeEntry.source.slice(1)}</p>
                </div>
                
                {activeEntry.details && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Additional Details</h3>
                    <div className="p-2 bg-muted/50 rounded-md text-xs whitespace-pre-wrap">
                      {typeof activeEntry.details === 'object' 
                        ? JSON.stringify(activeEntry.details, null, 2)
                        : String(activeEntry.details)
                      }
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setActiveEntry(null)}
                >
                  <Icons.close className="mr-2 h-4 w-4" />
                  Close Details
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="lg:col-span-3">
          {lineageQuery.isError ? (
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>Failed to load lineage data</CardDescription>
              </CardHeader>
              <CardContent>
                <p>There was an error loading the property lineage data. Please try again later.</p>
                <Button 
                  className="mt-4" 
                  onClick={() => lineageQuery.refetch()}
                >
                  <Icons.refresh className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <LineageTimeline
              entries={lineageEntries}
              isLoading={lineageQuery.isLoading}
              onEntryClick={handleEntryClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}