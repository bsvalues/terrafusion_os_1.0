import { useEffect, useState, useRef } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import { GeoJSONFeature, GeoJSONFeatureCollection } from '@/lib/map-utils';
import { Parcel } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { Tooltip } from 'react-leaflet';
import { ParcelPopup } from './parcel-popup';
import L from 'leaflet';
import { Feature, Geometry, GeoJsonProperties } from 'geojson';

// Interface to represent a parcel with geometry
type ParcelWithGeoJson = Parcel & {
  geometry?: any;
}

type ParcelOverlayProps = {
  workflowId?: number;
  parcelId?: number;
  filter?: (parcel: Parcel) => boolean;
  style?: L.PathOptions | ((feature: Feature<Geometry, GeoJsonProperties>) => L.PathOptions);
  onParcelSelect?: (parcelId: number) => void;
  onParcelHover?: (parcel: Parcel | null) => void;
  showPopups?: boolean;
};

/**
 * Component that overlays parcel data on a map. Can be filtered to show
 * specific parcels for a workflow, by parcel ID, or using a custom filter.
 */
export function ParcelOverlay({
  workflowId,
  parcelId,
  filter,
  style,
  onParcelSelect,
  onParcelHover,
  showPopups = true,
}: ParcelOverlayProps) {
  const map = useMap();
  const [hoveredParcel, setHoveredParcel] = useState<Parcel | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const parcelLayerRef = useRef<L.GeoJSON | null>(null);
  
  // Query parcels, filtering by workflow if specified
  const { data: parcels, isLoading } = useQuery<Parcel[]>({
    queryKey: workflowId 
      ? ['/api/workflows', workflowId, 'parcels'] 
      : ['/api/parcels', parcelId],
  });
  
  // Convert parcels to GeoJSON
  const createGeoJson = (): GeoJSONFeatureCollection => {
    if (!parcels || parcels.length === 0) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }
    
    // Apply any filter if provided
    const filteredParcels = filter ? parcels.filter(filter) : parcels;
    
    // Map parcels to GeoJSON features
    const features = filteredParcels.map(parcel => {
      // Access geometry from parcel.geometry
      const geometry = (parcel as ParcelWithGeoJson).geometry;
      
      if (geometry) {
        // Ensure the properties contain the parcel information
        const feature = {
          type: 'Feature',
          properties: {
            id: parcel.id,
            parcelNumber: parcel.parcelNumber,
            owner: parcel.owner,
            address: parcel.address,
            acres: parcel.acres,
            zoning: parcel.zoning,
          },
          geometry: geometry
        };
        return feature as GeoJSONFeature;
      } else {
        // Create a placeholder if no geometry exists (would be populated from DB in real app)
        // This will be filtered out later to avoid null geometry issues
        return {
          type: 'Feature',
          properties: {
            id: parcel.id,
            parcelNumber: parcel.parcelNumber,
            owner: parcel.owner,
            address: parcel.address,
            acres: parcel.acres,
            zoning: parcel.zoning,
          },
          geometry: null
        } as unknown as GeoJSONFeature;
      }
    });
    
    return {
      type: 'FeatureCollection',
      // Filter out features with null geometries
      features: features.filter(f => f.geometry !== null)
    };
  };
  
  // Default style for parcels
  const defaultStyle = (feature: Feature<Geometry, GeoJsonProperties> | undefined): L.PathOptions => {
    if (!feature || !feature.properties) return {
      color: '#6B7280',
      weight: 1,
      fillColor: '#E5E7EB',
      fillOpacity: 0.2,
    };
    
    const isHovered = hoveredParcel && hoveredParcel.id === feature.properties.id;
    const isSelected = selectedParcel && selectedParcel.id === feature.properties.id;
    
    return {
      color: isSelected ? '#FF4500' : (isHovered ? '#2563EB' : '#6B7280'),
      weight: isSelected ? 3 : (isHovered ? 2 : 1),
      fillColor: isSelected ? '#FFA07A' : (isHovered ? '#DBEAFE' : '#E5E7EB'),
      fillOpacity: isSelected ? 0.4 : (isHovered ? 0.3 : 0.2),
    };
  };
  
  // Combine default style with provided style
  const getStyle = (feature: Feature<Geometry, GeoJsonProperties> | undefined): L.PathOptions => {
    const baseStyle = defaultStyle(feature);
    
    if (!style) {
      return baseStyle;
    }
    
    if (typeof style === 'function' && feature) {
      return { ...baseStyle, ...style(feature) };
    }
    
    if (typeof style === 'object') {
      return { ...baseStyle, ...style };
    }
    
    return baseStyle;
  };
  
  // Set up event handlers for each feature
  const onEachFeature = (feature: GeoJSONFeature, layer: L.Layer) => {
    if (feature.properties) {
      // Find the corresponding parcel
      const parcel = parcels?.find(p => p.id === feature.properties?.id);
      
      if (!parcel) return;
      
      layer.on({
        mouseover: (e) => {
          setHoveredParcel(parcel);
          if (onParcelHover) onParcelHover(parcel);
          
          // Prevent propagation to avoid map panning issues
          e.originalEvent.stopPropagation();
        },
        mouseout: (e) => {
          setHoveredParcel(null);
          if (onParcelHover) onParcelHover(null);
          
          // Prevent propagation to avoid map panning issues
          e.originalEvent.stopPropagation();
        },
        click: (e) => {
          setSelectedParcel(selectedParcel?.id === parcel.id ? null : parcel);
          if (onParcelSelect) onParcelSelect(parcel.id!);
          
          // Prevent propagation to avoid map panning issues
          e.originalEvent.stopPropagation();
        }
      });
    }
  };
  
  // Fit map bounds when parcels change
  useEffect(() => {
    if (parcels && parcels.length > 0 && parcelLayerRef.current) {
      try {
        const bounds = parcelLayerRef.current.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }
  }, [parcels, map]);
  
  if (isLoading) {
    return null;
  }
  
  return (
    <GeoJSON
      data={createGeoJson()}
      style={getStyle}
      onEachFeature={onEachFeature}
      ref={parcelLayerRef}
    >
      {showPopups && hoveredParcel && !selectedParcel && (
        <Tooltip 
          permanent={false} 
          direction="top" 
          offset={[0, -10]}
        >
          <div><>

            <div className="font-semibold">{hoveredParcel.parcelNumber}</div>
            <div
</>>{hoveredParcel.owner}</div>
          </div>
        </Tooltip>
      )}
      
      {showPopups && selectedParcel && (
        <Tooltip 
          permanent 
          direction="top" 
          offset={[0, -10]}
          className="leaflet-tooltip-parcel"
        >
          <ParcelPopup
            parcel={selectedParcel}
            feature={createGeoJson().features.find(
              f => f.properties?.id === selectedParcel.id
            ) as GeoJSONFeature}
            onClose={() => setSelectedParcel(null)}
            onViewDetails={(parcelId) => {
              if (onParcelSelect && typeof parcelId === 'number') {
                onParcelSelect(parcelId);
              }
            }}
            isMapPopup={true}
          />
        </Tooltip>
      )}
    </GeoJSON>
  );
}

export default ParcelOverlay;