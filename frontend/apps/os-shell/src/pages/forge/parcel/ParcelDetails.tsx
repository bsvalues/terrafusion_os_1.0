// TFT-144 — Parcel details page
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PropertyValuationDisplay } from '@/components/forge/PropertyValuationDisplay';
import { PriceHistoryChartComponent } from '@/components/forge/PriceHistoryChartComponent';
import { NaturalHazardRisk } from '@/components/forge/NaturalHazardRisk';
import { SalesCompGridComponent } from '@/components/forge/SalesCompGridComponent';
import type { PropertyListing, PropertyValuation, HazardRisk } from '@/types/realEstate';
import { getPropertyValuation } from '@/services/forge/propertyValuationClientService';
import { getHazardRisk } from '@/services/forge/neighborhoodClientService';

interface ParcelDetailsProps {
  parcelId: string;
}

export function ParcelDetails({ parcelId }: ParcelDetailsProps) {
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [valuation, setValuation] = useState<PropertyValuation | null>(null);
  const [hazard, setHazard] = useState<HazardRisk | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetch(`/api/properties/${parcelId}`).then((r) => r.json()),
      getPropertyValuation(parcelId),
      getHazardRisk(parcelId),
    ]).then(([propResult, valResult, hazResult]) => {
      if (propResult.status === 'fulfilled') setProperty(propResult.value);
      if (valResult.status === 'fulfilled') setValuation(valResult.value);
      if (hazResult.status === 'fulfilled') setHazard(hazResult.value);
      setLoading(false);
    });
  }, [parcelId]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{property?.address ?? parcelId}</h1>
          <p className="text-sm text-muted-foreground">
            {property ? `${property.city}, ${property.state} ${property.zip}` : ''}
          </p>
        </div>
        {property && (
          <div className="flex gap-2">
            <Badge variant="outline">{property.propertyType}</Badge>
            <Badge variant="outline">{property.zoning}</Badge>
          </div>
        )}
      </div>

      {property && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Property Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Detail label="Year Built" value={String(property.yearBuilt)} />
              <Detail label="Sq Ft" value={property.squareFeet.toLocaleString()} />
              <Detail label="Lot Size" value={`${property.lotSize.toLocaleString()} sq ft`} />
              <Detail label="Bedrooms" value={String(property.bedrooms)} />
              <Detail label="Bathrooms" value={String(property.bathrooms)} />
              <Detail label="Neighborhood" value={property.neighborhood} />
              <Detail label="Last Sale" value={property.lastSaleDate} />
              <Detail label="Last Sale Price" value={`$${property.lastSalePrice.toLocaleString()}`} />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="valuation">
        <TabsList>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="comps">Comparables</TabsTrigger>
          <TabsTrigger value="hazard">Hazard</TabsTrigger>
        </TabsList>
        <TabsContent value="valuation">
          <PropertyValuationDisplay valuation={valuation} />
        </TabsContent>
        <TabsContent value="history">
          <PriceHistoryChartComponent parcelId={parcelId} />
        </TabsContent>
        <TabsContent value="comps">
          <SalesCompGridComponent parcelId={parcelId} />
        </TabsContent>
        <TabsContent value="hazard">
          <NaturalHazardRisk hazardRisk={hazard} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
