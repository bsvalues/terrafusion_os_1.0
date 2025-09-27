import React, {useState, useRef, useEffect, useMemo} from 'react';
import MapboxProvider from './mapbox-provider';
import {cn} from '@/lib/utils';
import mapboxgl from 'mapbox-gl';
import LeafletContextWrapper from '../leaflet/leaflet-context-wrapper';
import {containsParcelOverlay} from '@/lib/leaflet-helpers';

export interface MapboxMapProps {id?: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  longitude?: number;
  latitude?: number;
  zoom?: number;
  style?: string;
  children?: React.ReactNode;
  onMapLoad?: (map: mapboxgl.Map) => void;
  onMapCreated?: (map: mapboxgl.Map) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  geoJsonData?: GeoJSON.Polygon | GeoJSON.Feature | GeoJSON.FeatureCollection | null;
  points?: Array<{
    coordinate: { lat: number; lng: number};
    description?: string;
    type?: string;
  }>;
  forceLeafletContext?: boolean;
}

/**
 * MapboxMap component - renders a Mapbox GL JS map with the provided configuration
 */
export function MapboxMap({id = 'mapbox-map',
  className,
  width = '100%',
  height = '100%',
  longitude = -119.16, // Benton County, WA
  latitude = 46.23,
  zoom = 11,
  style = 'mapbox://styles/mapbox/streets-v12',
  children,
  onMapLoad,
  onMapCreated,
  initialCenter,
  initialZoom,
  geoJsonData,
  points,
  forceLeafletContext = false,}: MapboxMapProps) {
  // Create a unique ID for the map container if not provided
  const mapId = useRef<string>(id);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const geoJsonSourceId = 'geojson-data';
  const pointsSourceId = 'points-data';

  const [mapContainerStyle, setMapContainerStyle] = useState({
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  });

  // Update the map container style if width or height changes
  useEffect(() =>{
    setMapContainerStyle({
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    });
  }, [width, height]);

  // Handle map load event - add sources and layers for GeoJSON and points
  const handleMapLoad = (map: mapboxgl.Map) => {mapRef.current = map;

    // Initialize sources and layers for GeoJSON data
    map.addSource(geoJsonSourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],},
    });

    // Add fill layer for polygons
    map.addLayer({id: 'geojson-fill',
      type: 'fill',
      source: geoJsonSourceId,
      paint: {
        'fill-color': '#4285f4',
        'fill-opacity': 0.3,},
    });

    // Add outline layer for polygons
    map.addLayer({id: 'geojson-outline',
      type: 'line',
      source: geoJsonSourceId,
      paint: {
        'line-color': '#4285f4',
        'line-width': 2,},
    });

    // Initialize source and layer for points
    map.addSource(pointsSourceId, {type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],},
    });

    // Add points layer
    map.addLayer({id: 'points-layer',
      type: 'circle',
      source: pointsSourceId,
      paint: {
        'circle-radius': 6,
        'circle-color': '#e63946',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff',},
    });

    // Call both callbacks if provided
    if (onMapLoad) onMapLoad(map);
    if (onMapCreated) onMapCreated(map);

    // Update data if already available
    updateGeoJsonData(map);
    updatePointsData(map);
  };

  // Update GeoJSON data when it changes
  useEffect(() => {if (mapRef.current) {
      updateGeoJsonData(mapRef.current);}
  }, [geoJsonData]);

  // Update points data when it changes
  useEffect(() => {if (mapRef.current) {
      updatePointsData(mapRef.current);}
  }, [points]);

  // Helper function to update GeoJSON data
  const updateGeoJsonData = (map: mapboxgl.Map) => {
    const source = map.getSource(geoJsonSourceId) as mapboxgl.GeoJSONSource;

    if (source && geoJsonData) {
      // If geoJsonData is a Polygon, wrap it in a Feature
      if (geoJsonData.type === 'Polygon') {
        source.setData({
          type: 'Feature',
          geometry: geoJsonData,
          properties: {},
        });
      }
      // If geoJsonData is already a Feature or FeatureCollection, use it directly
      else {source.setData(geoJsonData as any);}
    } else if (source) {// Clear the source if no data
      source.setData({
        type: 'FeatureCollection',
        features: [],});
    }
  };

  // Helper function to update points data
  const updatePointsData = (map: mapboxgl.Map) => {const source = map.getSource(pointsSourceId) as mapboxgl.GeoJSONSource;

    if (source && points && points.length > 0) {
      // Convert points to GeoJSON features
      const features = points.map((point /* , index */) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [point.coordinate.lng, point.coordinate.lat],},
        properties: {
          id: `point-${index}`,
          description: point.description || `Point ${index + 1}`,
          type: point.type || 'default',
        },
      }));

      source.setData({type: 'FeatureCollection',
        features,});
    } else if (source) {// Clear the source if no points
      source.setData({
        type: 'FeatureCollection',
        features: [],});
    }
  };

  // Determine initial view state
  const initialViewState = {longitude: initialCenter ? initialCenter[0] : longitude,
    latitude: initialCenter ? initialCenter[1] : latitude,
    zoom: initialZoom !== undefined ? initialZoom : zoom,};

  // Check if children contain components that need Leaflet context
  const needsLeafletContext = useMemo(() => {return forceLeafletContext || containsParcelOverlay(children);}, [children, forceLeafletContext]);

  return (<div className={cn('mapbox-map-container relative', className)} style={mapContainerStyle}><div
        id={mapId.current}
        className="absolute inset-0 w-full h-full"
        style={{ background: '#e5e7eb'}} // Light gray background while loading /><MapboxProvider
        mapContainerId={mapId.current}
        initialViewState={initialViewState}
        mapStyle={style}
        onMapLoaded={handleMapLoad}
      >{needsLeafletContext ? (<LeafletContextWrapper
            center={[initialViewState.latitude, initialViewState.longitude]}
            zoom={initialViewState.zoom}
            mapboxInstance={mapRef.current}
            visible={false}
          >{children}</LeafletContextWrapper>) : (
          children
        )}</MapboxProvider></div>
  );
}

export default MapboxMap;
