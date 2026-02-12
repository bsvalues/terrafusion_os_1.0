import React from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2,
  Share2,
  User,
  CalendarRange,
  Lock,
  Calendar,
  Ruler,
  Bed,
  Bath,
  Map,
  Trees,
  Car,
  DollarSign,
 } from '@mui/icons-material';

// Define types for the shared property data
interface Photo {
  photoUrl: string;
  photoTitle: string;
}

interface Comparable {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  saleDate?: string;
}

interface ValuationData {
  estimatedValue: number;
  valueDescription?: string;
}

interface Report {
  reportType: string;
  reportDate: string;
  reportUrl: string;
  appraisalValue?: number;
}

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType?: string;
  yearBuilt?: number;
  grossLivingArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: number;
  garageSize?: number;
  zoning?: string;
  taxAssessment?: number;
  photos?: Photo[];
  comparables?: Comparable[];
  valuationData?: ValuationData;
  reports?: Report[];
}

interface Creator {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface ShareLink {
  id: string;
  token: string;
  propertyId: number;
  creatorId: number;
  viewCount: number;
  viewsLimit?: number;
  expiresAt?: string;
  includePhotos: boolean;
  includeComparables: boolean;
  includeValuation: boolean;
  allowReports: boolean;
}

interface SharedPropertyResponse {
  property: Property;
  creator: Creator;
  shareLink: ShareLink;
}

export default function SharedPropertyPage() {
  const { token } = useParams();

  // Fetch the shared property data
  const { data, isLoading, error } = useQuery<SharedPropertyResponse>({
    queryKey: [`/api/shared/${token}`],
    queryFn: getQueryFn(),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="w-full">
          <CardContent className="flex justify-center items-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading shared property...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="w-full">
          <CardHeader><>

            <CardTitle>Property Not Found</CardTitle>
            <CardDescription
</>>This shared property link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The share link may have reached its view limit or expiration date, or it has been
              deleted by the property owner.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { property, creator, shareLink } = data;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="w-full mb-4">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div><>

              <CardTitle>Shared Property</CardTitle>
              <CardDescription
</>>{property.address}</CardDescription>
              <div className="text-sm mt-1">
                {property.city}, {property.state} {property.zipCode}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Badge
                variant={
                  property.propertyType?.toLowerCase()?.includes("family") ? "default" : "outline"
                }
              >
                {property.propertyType || "Residential"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>Shared by {creator.firstName || creator.username}</span>
            </div>
            {shareLink.expiresAt && (
              <div className="flex items-center">
                <CalendarRange className="h-4 w-4 mr-1" />
                <span>Expires on {new Date(shareLink.expiresAt).toLocaleDateString()}</span>
              </div>
            )}
            {shareLink.viewsLimit && (
              <div className="flex items-center">
                <Lock className="h-4 w-4 mr-1" />
                <span>
                  View {shareLink.viewCount} of {shareLink.viewsLimit}
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary details */}
            <div className="space-y-4"><>

              <h3 className="text-lg font-medium">Property Details</h3>
              <div
</> className="space-y-2">
                <InfoItem
                  icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                  label="Year Built"
                  value={property.yearBuilt ? property.yearBuilt.toString() : "Unknown"}
                />
                <InfoItem
                  icon={<Ruler className="h-4 w-4 text-muted-foreground" />}
                  label="Square Footage"
                  value={property.grossLivingArea ? `${property.grossLivingArea} sqft` : "Unknown"}
                />
                <InfoItem
                  icon={<Bed className="h-4 w-4 text-muted-foreground" />}
                  label="Bedrooms"
                  value={property.bedrooms || "Unknown"}
                />
                <InfoItem
                  icon={<Bath className="h-4 w-4 text-muted-foreground" />}
                  label="Bathrooms"
                  value={property.bathrooms || "Unknown"}
                />
              </div>
            </div>

            {/* Secondary details */}
            <div className="space-y-4"><>

              <h3 className="text-lg font-medium">Additional Information</h3>
              <div
</> className="space-y-2">
                {property.lotSize && (
                  <InfoItem
                    icon={<Trees className="h-4 w-4 text-muted-foreground" />}
                    label="Lot Size"
                    value={`${property.lotSize} ${property.lotSize < 5 ? "acres" : "sqft"}`}
                  />
                )}
                {property.garageSize && (
                  <InfoItem
                    icon={<Car className="h-4 w-4 text-muted-foreground" />}
                    label="Garage"
                    value={`${property.garageSize} car${property.garageSize > 1 ? "s" : ""}`}
                  />
                )}
                {property.zoning && (
                  <InfoItem
                    icon={<Map className="h-4 w-4 text-muted-foreground" />}
                    label="Zoning"
                    value={property.zoning}
                  />
                )}
                {property.taxAssessment && (
                  <InfoItem
                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                    label="Tax Assessment"
                    value={`$${property.taxAssessment.toLocaleString()}`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Additional sections based on share permissions */}
          {shareLink.includePhotos && property.photos && property.photos.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4"><>

                <h3 className="text-lg font-medium">Property Photos</h3>
                <div
</> className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {property.photos.map((photo: Photo /* , index */: number) => (
                    <div key={index} className="aspect-video relative rounded-md overflow-hidden">
                      <img
                        src={photo.photoUrl}
                        alt={photo.photoTitle}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {shareLink.includeComparables &&
            property.comparables &&
            property.comparables.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4"><>

                  <h3 className="text-lg font-medium">Comparable Properties</h3>
                  <div
</> className="grid grid-cols-1 gap-4">
                    {property.comparables.map((comp: Comparable /* , index */: number) => (
                      <Card key={index} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div><>

                              <h4 className="font-medium">{comp.address}</h4>
                              <p
</> className="text-sm text-muted-foreground">
                                {comp.city}, {comp.state} {comp.zipCode}
                              </p>
                            </div>
                            <div className="text-right"><>

                              <p className="font-medium">${comp.price.toLocaleString()}</p>
                              <p
</> className="text-sm text-muted-foreground">
                                {comp.saleDate
                                  ? new Date(comp.saleDate).toLocaleDateString()
                                  : "Unknown date"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

          {shareLink.includeValuation && property.valuationData && (
            <>
              <Separator />
              <div className="space-y-2"><>

                <h3 className="text-lg font-medium">Valuation Information</h3>
                <Card
</> className="bg-muted">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center"><>

                      <span className="text-sm">Estimated Value</span>
                      <span
</> className="text-xl font-bold">
                        ${property.valuationData.estimatedValue.toLocaleString()}
                      </span>
                    </div>
                    <Separator className="my-3" />
                    <p className="text-sm text-muted-foreground">
                      {property.valuationData.valueDescription ||
                        "Based on current market conditions and comparable properties."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {shareLink.allowReports && property.reports && property.reports.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4"><>

                <h3 className="text-lg font-medium">Appraisal Reports</h3>
                <div
</> className="grid grid-cols-1 gap-3">
                  {property.reports.map((report: Report /* , index */: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-between"
                      onClick={() => window.open(report.reportUrl, "_blank")}
                    ><>

                      <span>
                        {report.reportType} - {new Date(report.reportDate).toLocaleDateString()}
                      </span>
                      <span
</>>${report.appraisalValue?.toLocaleString() || "N/A"}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground mt-6">
        <p>
          This information was shared via TerraField. The content may be confidential and intended
          solely for the recipient.
        </p>
      </div>
    </div>
  );
}

// Export InfoItem component for reuse
export function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center space-x-2">
      {icon && icon}
      <div><>

        <span className="text-xs text-muted-foreground block">{label}</span>
        <span
</> className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}
