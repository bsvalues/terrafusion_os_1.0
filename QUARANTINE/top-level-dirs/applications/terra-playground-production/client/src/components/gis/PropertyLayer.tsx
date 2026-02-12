import { useEffect, useMemo } from 'react';
import { Feature } from 'ol';
import { Geometry, Polygon } from 'ol/geom';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Fill, Stroke, Text } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { useGIS } from '@/contexts/gis-context';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Property types for styling
export type PropertyType =
  | 'residential'
  | 'commercial'
  | 'agricultural'
  | 'industrial'
  | 'vacant'
  | 'exempt';
export type PropertyStatus = 'current' | 'delinquent' | 'exempt' | 'appealed';
export type PropertyVisualizationMode = 'value' | 'type' | 'status' | 'assessment-date' | 'change';

interface PropertyLayerProps {
  visualizationMode?: PropertyVisualizationMode;
  opacity?: number;
  map: any; // OpenLayers map instance
}

const PropertyLayer = ({ visualizationMode = 'value', opacity = 0.7, map }: PropertyLayerProps) => {
  const { visibleLayers, layerOpacity } = useGIS();

  // Fetch property boundary data
  const { data: propertyData } = useQuery({
    queryKey: ['/api/gis/property-boundaries'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/gis/property-boundaries');
        const data = response as any;

        // Create default placeholder data if needed
        if (!data || !data.features) {
          console.warn('Property boundary data is missing or in unexpected format.');
          return {
            type: 'FeatureCollection',
            features: [],
          };
        }

        return {
          type: data.type || 'FeatureCollection',
          features: data.features || [],
        };
      } catch (error) {
        console.error('Error fetching property boundaries:', error);
        return {
          type: 'FeatureCollection',
          features: [],
        };
      }
    },
    enabled: !!map && visibleLayers['property-boundaries'] === true,
  });

  // Calculate styles based on property attributes and visualization mode
  const getPropertyStyle = (feature: any) => {
    const properties = feature.getProperties();

    // Default style
    let fillColor = 'rgba(255, 255, 255, 0.4)';
    let strokeColor = 'rgba(0, 128, 255, 1)';
    let strokeWidth = 1;
    let labelText = '';

    // Style based on visualization mode
    switch (visualizationMode) {
      case 'value':
        // Style based on property value ranges
        const value = properties.assessedValue || 0;
        if (value > 1000000)
          fillColor = 'rgba(128, 0, 38, 0.6)'; // Very high value
        else if (value > 500000)
          fillColor = 'rgba(189, 0, 38, 0.6)'; // High value
        else if (value > 300000)
          fillColor = 'rgba(227, 74, 51, 0.6)'; // Above average
        else if (value > 200000)
          fillColor = 'rgba(253, 141, 60, 0.6)'; // Average
        else if (value > 100000)
          fillColor = 'rgba(254, 217, 118, 0.6)'; // Below average
        else fillColor = 'rgba(255, 255, 204, 0.6)'; // Low value
        labelText = `$${Math.round(value / 1000)}k`;
        break;

      case 'type':
        // Style based on property type
        const type = properties.propertyType as PropertyType;
        switch (type) {
          case 'residential':
            fillColor = 'rgba(254, 196, 79, 0.6)';
            break;
          case 'commercial':
            fillColor = 'rgba(217, 95, 14, 0.6)';
            break;
          case 'agricultural':
            fillColor = 'rgba(102, 166, 30, 0.6)';
            break;
          case 'industrial':
            fillColor = 'rgba(231, 41, 138, 0.6)';
            break;
          case 'vacant':
            fillColor = 'rgba(166, 206, 227, 0.6)';
            break;
          case 'exempt':
            fillColor = 'rgba(178, 223, 138, 0.6)';
            break;
        }
        labelText = properties.propertyId || '';
        break;

      case 'status':
        // Style based on property status
        const status = properties.propertyStatus as PropertyStatus;
        switch (status) {
          case 'current':
            fillColor = 'rgba(65, 171, 93, 0.6)';
            break;
          case 'delinquent':
            fillColor = 'rgba(239, 59, 44, 0.6)';
            break;
          case 'exempt':
            fillColor = 'rgba(158, 202, 225, 0.6)';
            break;
          case 'appealed':
            fillColor = 'rgba(254, 178, 76, 0.6)';
            break;
        }
        break;

      case 'assessment-date':
        // Style based on last assessment date
        const assessmentDate = properties.lastAssessmentDate
          ? new Date(properties.lastAssessmentDate).getFullYear()
          : 2020;
        const currentYear = new Date().getFullYear();
        const yearDiff = currentYear - assessmentDate;

        if (yearDiff <= 1)
          fillColor = 'rgba(44, 162, 95, 0.6)'; // Recent
        else if (yearDiff <= 3)
          fillColor = 'rgba(153, 216, 201, 0.6)'; // Within 3 years
        else if (yearDiff <= 5)
          fillColor = 'rgba(224, 243, 219, 0.6)'; // Within 5 years
        else if (yearDiff <= 10)
          fillColor = 'rgba(254, 224, 144, 0.6)'; // Within 10 years
        else fillColor = 'rgba(252, 141, 89, 0.6)'; // Older than 10 years

        labelText = assessmentDate.toString();
        break;

      case 'change':
        // Style based on value change percentage
        const changePercent = properties.valueChangePercent || 0;

        if (changePercent > 20)
          fillColor = 'rgba(215, 25, 28, 0.6)'; // Large increase
        else if (changePercent > 10)
          fillColor = 'rgba(253, 174, 97, 0.6)'; // Moderate increase
        else if (changePercent > -10)
          fillColor = 'rgba(255, 255, 191, 0.6)'; // Stable
        else if (changePercent > -20)
          fillColor = 'rgba(171, 217, 233, 0.6)'; // Moderate decrease
        else fillColor = 'rgba(44, 123, 182, 0.6)'; // Large decrease

        labelText = `${changePercent > 0 ? '+' : ''}${Math.round(changePercent)}%`;
        break;
    }

    return new Style({
      fill: new Fill({
        color: fillColor,
      }),
      stroke: new Stroke({
        color: strokeColor,
        width: strokeWidth,
      }),
      text: labelText
        ? new Text({
            text: labelText,
            font: '10px Roboto, sans-serif',
            fill: new Fill({
              color: '#000',
            }),
            stroke: new Stroke({
              color: '#fff',
              width: 2,
            }),
            offsetY: -15,
          })
        : undefined,
    });
  };

  // Create vector source and layer
  const vectorSource = useMemo(() => {
    return new VectorSource({
      features: [],
      format: new GeoJSON(),
    });
  }, []);

  const vectorLayer = useMemo(() => {
    return new VectorLayer({
      source: vectorSource,
      style: getPropertyStyle,
      opacity: opacity,
    });
  }, [vectorSource, opacity]);

  // Initial layer setup
  useEffect(() => {
    if (map && vectorLayer) {
      map.addLayer(vectorLayer);

      return () => {
        map.removeLayer(vectorLayer);
      };
    }
  }, [map, vectorLayer]);

  // Update layer data when property data changes
  useEffect(() => {
    if (vectorSource && propertyData && propertyData.features) {
      vectorSource.clear();

      const features = propertyData.features.map((feature: any) => {
        return new Feature({
          geometry: new Polygon(feature.geometry.coordinates),
          ...feature.properties,
        });
      });

      vectorSource.addFeatures(features);
    }
  }, [vectorSource, propertyData]);

  // Update layer visibility and opacity
  useEffect(() => {
    if (vectorLayer) {
      vectorLayer.setVisible(visibleLayers['property-boundaries'] === true);
      vectorLayer.setOpacity(layerOpacity['property-boundaries'] || opacity);
    }
  }, [vectorLayer, visibleLayers, layerOpacity, opacity]);

  // Update styling when visualization mode changes
  useEffect(() => {
    if (vectorLayer) {
      vectorLayer.setStyle(getPropertyStyle);
    }
  }, [vectorLayer, visualizationMode]);

  // Component doesn't render anything directly, it just manages the layer
  return null;
};

export default PropertyLayer;
