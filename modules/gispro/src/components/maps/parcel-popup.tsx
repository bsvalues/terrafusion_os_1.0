import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Parcel } from '@shared/schema';
import { GeoJSONFeature, formatArea, squareMetersToAcres } from '@/lib/map-utils';
import { MapPin, ExternalLink, Clipboard, Home, MapPinned, Box  } from '@mui/icons-material';
import * as turf from '@turf/turf';

type ParcelPopupProps = {
  parcel: Parcel;
  feature: GeoJSONFeature;
  onClose?: () => void;
  onViewDetails?: (parcelId: string | number) => void;
  onSelectParcel?: (parcelId: string | number) => void;
  className?: string;
  isMapPopup?: boolean;
  position?: [number, number]; // Latitude, longitude
};

/**
 * Component that displays parcel information in a popup
 * Can be used either as a tooltip on the map or as a standalone component
 */
export function ParcelPopup({
  parcel,
  feature,
  onClose,
  onViewDetails,
  onSelectParcel,
  className = '',
  isMapPopup = false,
  position,
}: ParcelPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Calculate the area of the parcel from the feature if available
  const parcelArea = feature?.geometry?.type && ['Polygon', 'MultiPolygon'].includes(feature.geometry.type)
    ? turf.area(feature)
    : parcel.acres ? parseFloat(parcel.acres) * 4046.86 : 0; // Convert acres to square meters if needed
  
  // Format area in appropriate units
  const formattedArea = parcelArea ? formatArea(parcelArea) : '';
  const formattedAcres = parcelArea ? squareMetersToAcres(parcelArea).toFixed(2) : '';
  
  // Format the parcel number with proper spacing
  const formattedParcelNumber = parcel.parcelNumber?.toString().replace(/(\d{2})(\d{2})(\d{2})(\d{4})(\d{5})/, '$1-$2-$3-$4-$5') || '';
  
  // Close popup when clicking outside (if it's a map popup)
  useEffect(() => {
    if (isMapPopup && popupRef.current) {
      const handleClickOutside = (event: MouseEvent) => {
        if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
          if (onClose) onClose();
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMapPopup, onClose]);

  // Conditionally apply classes for map popup vs regular component
  const containerClasses = `${isMapPopup ? 'z-[1000] max-w-xs shadow-xl' : ''} ${className}`;

  return (
    <Card className={containerClasses} ref={popupRef}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base flex items-center gap-1"><>

              <MapPin className="h-4 w-4" />
              Parcel {parcel.id || parcel.parcelNumber}
            </CardTitle>
            <CardDescription
</>>
              {parcel.owner || 'Unknown Owner'}
            </CardDescription>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              &times;
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          {parcel.address && (
            <div className="flex items-start gap-2">
              <Home className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>{parcel.address}</span>
            </div>
          )}
          
          <div className="flex items-start gap-2">
            <MapPinned className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <span>Parcel #{formattedParcelNumber}</span>
          </div>
          
          {(formattedAcres || formattedArea) && (
            <div className="flex items-start gap-2">
              <Box className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>
                {formattedAcres && `${formattedAcres} acres`}
                {formattedAcres && formattedArea && ' / '}
                {formattedArea}
              </span>
            </div>
          )}
          
          {parcel.zoning && (
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline">{parcel.zoning}</Badge>
            </div>
          )}
        </div>
      </CardContent>
      
      {(onViewDetails || onSelectParcel) && (
        <>
          <Separator />
          <CardFooter className="pt-2 pb-2 flex gap-2 justify-end">
            {onSelectParcel && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => onSelectParcel(parcel.id || parcel.parcelNumber!)}
              >
                <Clipboard className="h-3.5 w-3.5 mr-1" />
                Select
              </Button>
            )}
            
            {onViewDetails && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onViewDetails(parcel.id || parcel.parcelNumber!)}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Details
              </Button>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
}

export default ParcelPopup;