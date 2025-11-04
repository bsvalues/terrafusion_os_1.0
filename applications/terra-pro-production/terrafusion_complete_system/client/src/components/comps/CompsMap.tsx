import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Info, DollarSign, Home, Calendar  } from '@mui/icons-material';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CompsMapProps {
  records?: ComparableRecord[];
  isLoading?: boolean;
  error?: string;
  onComparableClick?: (comparable: ComparableRecord) => void;
  centerLat?: number;
  centerLng?: number;
  height?: string;
  width?: string;
}

export interface ComparableRecord {
  id: number;
  propertyId?: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  saleDate: string;
  saleAmount: number;
  adjustedSaleAmount?: number;
  propertyType: string;
  yearBuilt?: number;
  squareFeet?: number;
  acreage?: number;
  bedrooms?: number;
  bathrooms?: number;
  distanceToSubject?: number;
  latitude?: number;
  longitude?: number;
}

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 }; // New York City by default

export function CompsMap({
  records = [],
  isLoading = false,
  error,
  onComparableClick,
  centerLat,
  centerLng,
  height = "500px",
  width = "100%",
}: CompsMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<ComparableRecord | null>(null);

  // Load Google Maps API
  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const googleMapsScript = document.createElement("script");
    googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY || ""}&libraries=places`;
    googleMapsScript.async = true;
    googleMapsScript.defer = true;
    googleMapsScript.onload = () => setMapLoaded(true);
    document.head.appendChild(googleMapsScript);

    return () => {
      document.head.removeChild(googleMapsScript);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded) return;

    const mapContainer = document.getElementById("comps-map");
    if (!mapContainer) return;

    const newMap = new google.maps.Map(mapContainer, {
      center: {
        lat: centerLat || DEFAULT_CENTER.lat,
        lng: centerLng || DEFAULT_CENTER.lng,
      },
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    setMap(newMap);

    return () => {
      // Cleanup
    };
  }, [mapLoaded, centerLat, centerLng]);

  // Update markers when records change
  useEffect(() => {
    if (!map || !records.length) {
      setMarkers([]);
      return;
    }

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));

    // Create bounds to fit all markers
    const bounds = new google.maps.LatLngBounds();

    // Add new markers
    const newMarkers = records.map((record /* , index */) => {
      // Use record coordinates if available, otherwise fake coordinates for demo
      const lat =
        record.latitude ||
        (centerLat ? centerLat + (Math.random() * 0.01 - 0.005) : DEFAULT_CENTER.lat);
      const lng =
        record.longitude ||
        (centerLng ? centerLng + (Math.random() * 0.01 - 0.005) : DEFAULT_CENTER.lng);

      const position = { lat, lng };
      bounds.extend(position);

      const marker = new google.maps.Marker({
        position,
        map,
        title: record.address,
        label: {
          text: `$${Math.round(record.saleAmount / 1000)}k`,
          color: "#ffffff",
          fontWeight: "bold",
          fontSize: "14px",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#4f46e5",
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        animation: 2, // 2 corresponds to google.maps.Animation.DROP
        zIndex: records.length - index,
      });

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="max-width: 200px; padding: 5px;"><>

            <div style="font-weight: bold; margin-bottom: 5px;">${record.address}</div>
            <div
</> style="margin-bottom: 5px;">${record.city}, ${record.state}</div><>

            <div style="font-weight: bold; color: #4f46e5;">$${record.saleAmount.toLocaleString()}</div>
            <div
</>>${record.squareFeet?.toLocaleString() || "N/A"} sq ft | ${record.bedrooms || "N/A"} bed | ${record.bathrooms || "N/A"} bath</div>
            <div>Built ${record.yearBuilt || "N/A"}</div>
          </div>
        `,
      });

      marker.addListener("click", () => {
        // Close any open info windows
        markers.forEach((m) => {
          if ((m as any).infoWindow) (m as any).infoWindow.close();
        });

        // Open this info window
        infoWindow.open(map, marker);

        // Set selected marker
        setSelectedMarker(record);

        // Call click handler
        if (onComparableClick) {
          onComparableClick(record);
        }
      });

      // Add info window to marker for later access
      (marker as any).infoWindow = infoWindow;

      return marker;
    });

    setMarkers(newMarkers);

    // Adjust map to fit all markers
    if (newMarkers.length > 0) {
      map.fitBounds(bounds);

      // Don't zoom in too far on only one marker
      if (map.getZoom() > 16) {
        map.setZoom(16);
      }
    }

    return () => {
      newMarkers.forEach((marker) => marker.setMap(null));
    };
  }, [map, records, centerLat, centerLng, onComparableClick]);

  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading Comparable Properties Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[400px] rounded-md" />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Map</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center"><>

          <CardTitle>Comparable Properties Map</CardTitle>
          <Badge
</> variant="outline">{records.length} Properties</Badge>
        </div>
        <CardDescription>Click on a marker to view property details</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div
          id="comps-map"
          style={{
            height,
            width,
            borderRadius: "0 0 var(--radius) var(--radius)",
          }}
        />
      </CardContent>
      {selectedMarker && (
        <CardFooter className="flex-col items-start space-y-2 pt-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {selectedMarker.address}, {selectedMarker.city}, {selectedMarker.state}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {selectedMarker.saleAmount.toLocaleString()}
            </Badge>
            {selectedMarker.squareFeet && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                {selectedMarker.squareFeet.toLocaleString()} sq ft
              </Badge>
            )}
            {selectedMarker.saleDate && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(selectedMarker.saleDate).toLocaleDateString()}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onComparableClick && onComparableClick(selectedMarker)}
          >
            View Details
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
