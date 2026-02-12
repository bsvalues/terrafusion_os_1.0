import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Home,
  Calendar,
  Ruler,
  Bed,
  Bath,
  Map,
  Trees,
  Car,
  DollarSign,
  Hash,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Share2,
 } from '@mui/icons-material';
import PropertyShareDialog from "./PropertyShareDialog";

interface PropertyInfoCardProps {
  property: any;
  className?: string;
}

export function PropertyInfoCard({ property, className }: PropertyInfoCardProps) {
  if (!property) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader><>

          <CardTitle>Property Information</CardTitle>
          <CardDescription
</>>Property data not available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div><>

            <CardTitle>Property Information</CardTitle>
            <CardDescription
</>>{property.address}</CardDescription>
            <div className="text-sm mt-1">
              {property.city}, {property.state} {property.zipCode}
            </div>
          </div>
          <Badge
            variant={
              property.propertyType?.toLowerCase()?.includes("family") ? "default" : "outline"
            }
          >
            {property.propertyType || "Residential"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Primary details */}
          <div className="space-y-2">
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

          {/* Secondary details */}
          <div className="space-y-2">
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

        {/* Additional details if available */}
        {(property.condition || property.constructionQuality) && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              {property.condition && <InfoItem label="Condition" value={property.condition} />}
              {property.constructionQuality && (
                <InfoItem label="Construction Quality" value={property.constructionQuality} />
              )}
            </div>
          </>
        )}

        {/* Features if available */}
        {property.additionalFeatures && property.additionalFeatures.length > 0 && (
          <>
            <Separator />
            <div><>

              <h4 className="text-sm font-medium mb-2">Features</h4>
              <div
</> className="flex flex-wrap gap-2">
                {property.additionalFeatures.map((feature: string /* , index */: number) => (
                  <Badge key={index} variant="secondary">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <ActionsSection propertyId={property.id} />
      </CardFooter>
    </Card>
  );
}

interface ActionsSectionProps {
  propertyId: number;
}

function ActionsSection({ propertyId }: ActionsSectionProps) {
  const [_, setLocation] = useLocation();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const handleUADFormClick = () => {
    setLocation(`/uad-form/${propertyId}`);
  };

  const handleShareClick = () => {
    setIsShareDialogOpen(true);
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      <div className="flex justify-between items-center"><>

        <h4 className="text-sm font-medium mb-1">Create Appraisal Documents</h4>
        <Button
</> variant="outline" size="sm" onClick={handleShareClick} className="ml-auto">
          <Share2 className="mr-2 h-4 w-4" />
          Share Property
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="default"
          size="sm"
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          onClick={handleUADFormClick}
        ><>

          <ClipboardList className="mr-2 h-4 w-4" />
          UAD Form
        </Button>

        <Button
</> variant="outline" size="sm"><>

          <FileText className="mr-2 h-4 w-4" />
          1004 Report
        </Button>

        <Button
</> variant="outline" size="sm">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Grid Report
        </Button>
      </div>

      {/* Share Dialog */}
      <PropertyShareDialog
        propertyId={propertyId}
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
      />
    </div>
  );
}

interface InfoItemProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
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
