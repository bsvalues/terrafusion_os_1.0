import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Download, Eye  } from '@mui/icons-material';

interface PropertyRecordCardProps {
  propertyId?: string | undefined;
}

export default function PropertyRecordCard({ propertyId }: PropertyRecordCardProps) {
  // Fetch property details
  const { data: property, isLoading } = useQuery({
    queryKey: ['/api/properties', propertyId],
    enabled: !!propertyId,
  });

  // Type-safe property access
  const propertyData = property as any;

  if (!propertyId) {
    return (
      <Card className="tf-card bg-tf-surface border-tf-accent/20">
        <CardContent className="p-8 text-center">
          <p className="text-tf-text/50">Select a property to view detailed records</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="tf-card bg-tf-surface border-tf-accent/20">
      <CardHeader className="border-b border-tf-accent/20 bg-tf-surface">
        <div className="flex items-center justify-between">
          <div>
<>
            <CardTitle className="text-lg font-semibold text-tf-text">Property Record Card</CardTitle>
            <p
</> className="text-sm text-tf-text/70">Official Benton County assessment data</p>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" className="tf-button-secondary text-tf-accent border-tf-accent/30">
<>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button
</> size="sm" variant="outline" className="tf-button-secondary text-tf-accent border-tf-accent/30">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 bg-tf-surface">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full bg-tf-accent/10" />
            <Skeleton className="h-4 w-3/4 bg-tf-accent/10" />
            <Skeleton className="h-4 w-1/2 bg-tf-accent/10" />
          </div>
        ) : propertyData ? (
          <div className="space-y-6">
            {/* Property Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
<>
                  <label className="text-xs font-medium text-tf-text/60 uppercase tracking-wide">Property Address</label>
                  <p
</> className="text-sm font-medium text-tf-text">{propertyData.address || 'N/A'}</p>
                </div>
                <div>
<>
                  <label className="text-xs font-medium text-tf-text/60 uppercase tracking-wide">Parcel ID</label>
                  <p
</> className="text-sm font-medium text-tf-text">{propertyData.parcelId || 'N/A'}</p>
                </div>
                <div>
<>
                  <label className="text-xs font-medium text-tf-text/60 uppercase tracking-wide">Owner</label>
                  <p
</> className="text-sm font-medium text-tf-text">{propertyData.ownerName || 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
<>
                  <label className="text-xs font-medium text-tf-text/60 uppercase tracking-wide">Property Type</label>
                  <p
</> className="text-sm font-medium text-tf-text">{propertyData.propertyType || 'N/A'}</p>
                </div>
                <div>
<>
                  <label className="text-xs font-medium text-tf-text/60 uppercase tracking-wide">Assessed Value</label>
                  <p
</> className="text-lg font-semibold text-tf-accent">
                    ${propertyData.assessedValue ? parseFloat(propertyData.assessedValue).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
<>
                  <label className="text-xs font-medium text-tf-text/60 uppercase tracking-wide">Land Value</label>
                  <p
</> className="text-sm font-medium text-tf-text">
                    ${propertyData.landValue ? parseFloat(propertyData.landValue).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Assessment Details */}
            <div className="border-t border-tf-accent/20 pt-6">
<>
              <h3 className="text-sm font-medium text-tf-text mb-4">Assessment Details</h3>
              <div
</> className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-tf-dark p-3 rounded border border-tf-accent/20">
<>
                  <label className="text-xs text-tf-text/60">Building Value</label>
                  <p
</> className="text-sm font-medium text-tf-text">
                    ${propertyData.buildingValue ? parseFloat(propertyData.buildingValue).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="bg-tf-dark p-3 rounded border border-tf-accent/20">
<>
                  <label className="text-xs text-tf-text/60">Total Value</label>
                  <p
</> className="text-sm font-medium text-tf-text">
                    ${propertyData.totalValue ? parseFloat(propertyData.totalValue).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="bg-tf-dark p-3 rounded border border-tf-accent/20">
<>
                  <label className="text-xs text-tf-text/60">Tax Year</label>
                  <p
</> className="text-sm font-medium text-tf-text">2024</p>
                </div>
                <div className="bg-tf-dark p-3 rounded border border-tf-accent/20">
<>
                  <label className="text-xs text-tf-text/60">Status</label>
                  <Badge
</> variant="outline" className="text-tf-accent border-tf-accent/30 bg-tf-accent/10">
                    Active
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-tf-accent/20 pt-6">
              <div className="flex flex-wrap gap-3">
                <Button className="tf-button-primary bg-tf-accent hover:bg-tf-accent/90 text-tf-dark">
<>
                  <MapPin className="w-4 h-4 mr-2" />
                  View on Map
                </Button>
                <Button
</> variant="outline" className="tf-button-secondary text-tf-accent border-tf-accent/30">
                  AI Analysis
                </Button>
<>
                <Button variant="outline" className="tf-button-secondary text-tf-accent border-tf-accent/30">
                  Comparable Sales
                </Button>
                <Button
</> variant="outline" className="tf-button-secondary text-tf-accent border-tf-accent/30">
                  Generate Report
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-tf-text/50">Property not found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}