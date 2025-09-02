import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, User, CalendarDays, ArrowRightCircle, X, Maximize2  } from '@mui/icons-material';
import { BasicMapViewer } from '@/components/maps/basic-map-viewer';
import { MapLayer, getDummyParcelData } from '@/lib/map-utils';
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export type ParcelInfo = {
  parcelId: string;
  address?: string;
  ownerName?: string;
  acres?: number;
  propertyType?: string;
  assessedValue?: number;
  lastUpdated?: string;
};

type QuickParcelPreviewProps = {
  parcelId: string;
  onClose?: () => void;
  onViewDetails?: (parcelId: string) => void;
  mapLayers?: MapLayer[];
  className?: string;
};

export function QuickParcelPreview({ 
  parcelId, 
  onClose, 
  onViewDetails,
  mapLayers = [],
  className = ""
}: QuickParcelPreviewProps) {
  const [activeTab, setActiveTab] = useState<string>("info");
  
  // Fetch parcel information
  const { data: parcelInfo, isLoading } = useQuery({
    queryKey: ["/api/parcels", parcelId],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/parcels/${parcelId}`);
        return await res.json();
      } catch (error) {
        console.error("Error fetching parcel info:", error);
        // Return placeholder data for now
        return {
          parcelId,
          address: "123 Example St, Benton County, WA",
          ownerName: "John Doe",
          acres: 0.25,
          propertyType: "Residential",
          assessedValue: 275000,
          lastUpdated: "2024-03-15"
        } as ParcelInfo;
      }
    },
    enabled: !!parcelId,
  });

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(parcelId);
    }
  };

  return (
    <Card className={`shadow-lg border-neutral-200 overflow-hidden ${className}`}>
      <CardHeader className="bg-neutral-50 pb-3 border-b px-4 py-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium text-neutral-800 flex items-center">
            <MapPin className="h-4 w-4 mr-1.5 text-primary-600" />
            Parcel Quick Preview
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 px-4 py-2"><>

          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger
</> value="map">Map View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : parcelInfo ? (
            <CardContent className="p-4 space-y-4">
              <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200">
                <div className="flex justify-between items-start"><>

                  <h3 className="font-mono text-sm mb-1">{parcelInfo.parcelId}</h3>
                  <Badge
</> variant="outline" className="bg-primary-50 text-primary-700 border-primary-200">
                    {parcelInfo.propertyType}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-700">{parcelInfo.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-50 p-2.5 rounded-md border border-neutral-200">
                  <div className="flex items-center text-xs text-neutral-500 mb-1"><>

                    <User className="h-3.5 w-3.5 mr-1" />
                    Owner
                  </div>
                  <div
</> className="font-medium text-sm">{parcelInfo.ownerName}</div>
                </div>
                <div className="bg-neutral-50 p-2.5 rounded-md border border-neutral-200">
                  <div className="flex items-center text-xs text-neutral-500 mb-1"><>

                    <CalendarDays className="h-3.5 w-3.5 mr-1" />
                    Last Updated
                  </div>
                  <div
</> className="font-medium text-sm">{parcelInfo.lastUpdated}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-50 p-2.5 rounded-md border border-neutral-200"><>

                  <div className="text-xs text-neutral-500 mb-1">Assessed Value</div>
                  <div
</> className="font-medium text-sm">
                    ${parcelInfo.assessedValue?.toLocaleString()}
                  </div>
                </div>
                <div className="bg-neutral-50 p-2.5 rounded-md border border-neutral-200"><>

                  <div className="text-xs text-neutral-500 mb-1">Area</div>
                  <div
</> className="font-medium text-sm">{parcelInfo.acres} acres</div>
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-4">
              <div className="text-center text-neutral-500 p-4">
                No parcel information available
              </div>
            </CardContent>
          )}
        </TabsContent>
        
        <TabsContent value="map" className="p-0">
          <div className="h-[250px] bg-neutral-100 relative">
            <BasicMapViewer
              parcelId={parcelId}
              mapLayers={mapLayers}
              enableLayerControl={false}
            />
            <div className="absolute top-2 right-2 z-[1000]">
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-7 w-7 bg-white shadow-md"
                onClick={() => setActiveTab("info")}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-end border-t bg-neutral-50 px-4 py-2.5">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={handleViewDetails}
        >
          View Full Details
          <ArrowRightCircle className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}