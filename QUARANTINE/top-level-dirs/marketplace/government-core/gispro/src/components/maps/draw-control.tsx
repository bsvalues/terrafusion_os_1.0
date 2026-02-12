import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { GeoJSONFeature } from '@/lib/map-utils';

// Event constants
const CREATED = 'draw:created';
const EDITED = 'draw:edited';
const DELETED = 'draw:deleted';

interface DrawControlProps {
  position?: L.ControlPosition;
  onCreate?: (feature: GeoJSONFeature) => void;
  onEdit?: (features: GeoJSONFeature[]) => void;
  onDelete?: (features: GeoJSONFeature[]) => void;
  onMounted?: (drawControl: L.Control.Draw) => void;
  draw?: {
    polyline?: L.DrawOptions.PolylineOptions | false;
    polygon?: L.DrawOptions.PolygonOptions | false;
    rectangle?: L.DrawOptions.RectangleOptions | false;
    circle?: L.DrawOptions.CircleOptions | false;
    marker?: L.DrawOptions.MarkerOptions | false;
    circlemarker?: L.DrawOptions.CircleMarkerOptions | false;
  };
  edit?: {
    featureGroup: L.FeatureGroup;
    edit?: L.DrawOptions.EditHandlerOptions | false;
    remove?: L.DrawOptions.DeleteHandlerOptions | false;
  };
}

// Extending Leaflet Event types for Draw events
declare module 'leaflet' {
  interface LeafletEvent {
    layer?: L.Layer;
    layers?: {
      getLayers(): L.Layer[];
    };
    layerType?: string;
  }
}

/**
 * React component that adds Leaflet.Draw controls to the map
 */
export function DrawControl({
  position = 'topleft',
  onCreate,
  onEdit,
  onDelete,
  onMounted,
  draw,
  edit,
}: DrawControlProps) {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const featGroupRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    // Initialize the FeatureGroup to store editable layers
    if (!featGroupRef.current) {
      featGroupRef.current = edit?.featureGroup || new L.FeatureGroup();
      map.addLayer(featGroupRef.current);
    }

    const featureGroup = featGroupRef.current;

    // Set default options for each drawing tool - improved for better UX
    const defaultOptions = {
      polyline: {
        shapeOptions: {
          color: '#3B82F6',
          weight: 4,
          opacity: 0.8
        },
        showLength: true,
        metric: true,
        guidelineDistance: 10,
        maxGuideLineLength: 4000,
        repeatMode: true, // Allow drawing multiple polylines without reselecting tool
        tooltip: {
          start: 'Click to start drawing a line',
          cont: 'Click to continue the line (double-click to finish)',
          end: 'Double-click to finish the line'
        }
      },
      polygon: {
        allowIntersection: false,
        drawError: {
          color: '#EF4444',
          message: '<strong>Error:</strong> Polygon edges cannot cross!'
        },
        shapeOptions: {
          color: '#3B82F6',
          weight: 3,
          fillOpacity: 0.3,
          fillColor: '#93C5FD'
        },
        showArea: true,
        metric: true,
        repeatMode: true,
        tooltip: {
          start: 'Click to start drawing a parcel',
          cont: 'Click to continue the parcel boundary',
          end: 'Click first point to close this parcel'
        }
      },
      rectangle: {
        shapeOptions: {
          color: '#3B82F6',
          weight: 3,
          fillOpacity: 0.3,
          fillColor: '#93C5FD'
        },
        showArea: true,
        metric: true,
        repeatMode: true,
        tooltip: {
          start: 'Click and drag to draw a rectangle'
        }
      },
      circle: {
        shapeOptions: {
          color: '#3B82F6',
          weight: 3,
          fillOpacity: 0.3,
          fillColor: '#93C5FD'
        },
        metric: true,
        repeatMode: true,
        tooltip: {
          start: 'Click and drag to draw a circle',
          end: 'Release mouse to finish drawing'
        }
      },
      circlemarker: {
        radius: 6,
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.8,
        repeatMode: true,
        tooltip: {
          start: 'Click to place a marker'
        }
      },
      marker: {
        icon: new L.Icon.Default(),
        repeatMode: true,
        tooltip: {
          start: 'Click to place a marker'
        }
      }
    };
    
    // Process draw options to ensure we have valid configuration objects for each drawing tool
    const processedDrawOptions: any = {};
    
    if (draw) {
      // Start with a clean slate for all draw tools
      processedDrawOptions.polyline = false;
      processedDrawOptions.polygon = false;
      processedDrawOptions.rectangle = false;
      processedDrawOptions.circle = false;
      processedDrawOptions.circlemarker = false;
      processedDrawOptions.marker = false;
      
      // Only apply configurations for tools that are enabled
      Object.entries(draw).forEach(([tool, option]) => {
        // Skip if the tool is explicitly disabled with false
        if (option === false) {
          processedDrawOptions[tool] = false;
          return;
        }
        
        // For all other cases (whether true, an object, or undefined), start with default options
        if (defaultOptions.hasOwnProperty(tool)) {
          const defaultForTool = defaultOptions[tool as keyof typeof defaultOptions];
          
          // Use appropriate options based on input type
          if (typeof option === 'object') {
            // Merge provided options with defaults
            processedDrawOptions[tool] = {
              ...defaultForTool,
              ...option
            };
          } else {
            // For boolean true or undefined, use defaults
            processedDrawOptions[tool] = { ...defaultForTool };
          }
        }
      });
    } else {
      // If no draw options provided, disable all tools
      processedDrawOptions.polyline = false;
      processedDrawOptions.polygon = false;
      processedDrawOptions.rectangle = false;
      processedDrawOptions.circle = false;
      processedDrawOptions.circlemarker = false;
      processedDrawOptions.marker = false;
    }

    // Initialize draw control with improved edit options
    const editOptions: any = {
      featureGroup,
      remove: edit?.remove !== false
    };
    
    // Only add edit capability if explicitly enabled
    if (edit?.edit !== false) {
      editOptions.edit = {
        // Enhanced edit options for better UX
        selectedPathOptions: {
          color: '#FCD34D',
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 10'
        },
        moveMarkers: true,  // Allow moving markers during edit
        removeDisabled: false, // Don't disable remove while editing
        editDisabled: false,  // Always allow editing
        showHiddenLayers: true // Show all editable layers
      };
    } else {
      editOptions.edit = false;
    }
    
    const drawOptions = {
      position,
      draw: processedDrawOptions,
      edit: editOptions
    };

    drawControlRef.current = new L.Control.Draw(drawOptions);
    map.addControl(drawControlRef.current);

    if (onMounted && drawControlRef.current) {
      onMounted(drawControlRef.current);
    }

    // Event handler for draw:created
    const handleCreated = (e: L.LeafletEvent) => {
      featureGroup.addLayer(e.layer);
      
      if (onCreate) {
        const geoJSON = e.layer.toGeoJSON() as GeoJSONFeature;
        if (e.layerType) {
          geoJSON.properties = { ...geoJSON.properties, type: e.layerType };
        }
        onCreate(geoJSON);
      }
    };

    // Event handler for draw:edited
    const handleEdited = (e: L.LeafletEvent) => {
      if (onEdit && e.layers) {
        const editedFeatures: GeoJSONFeature[] = [];
        e.layers.getLayers().forEach((layer: any) => {
          const geoJSON = layer.toGeoJSON() as GeoJSONFeature;
          editedFeatures.push(geoJSON);
        });
        onEdit(editedFeatures);
      }
    };

    // Event handler for draw:deleted
    const handleDeleted = (e: L.LeafletEvent) => {
      if (onDelete && e.layers) {
        const deletedFeatures: GeoJSONFeature[] = [];
        e.layers.getLayers().forEach((layer: any) => {
          const geoJSON = layer.toGeoJSON() as GeoJSONFeature;
          deletedFeatures.push(geoJSON);
        });
        onDelete(deletedFeatures);
      }
    };

    // Attach event handlers
    map.on(CREATED, handleCreated);
    map.on(EDITED, handleEdited);
    map.on(DELETED, handleDeleted);

    // Return cleanup function
    return () => {
      map.off(CREATED, handleCreated);
      map.off(EDITED, handleEdited);
      map.off(DELETED, handleDeleted);
      
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }

      // Do not remove featureGroup here as it may be shared with other components
    };
  }, [map, position, onCreate, onEdit, onDelete, onMounted, draw, edit]);

  return null;
}

export default DrawControl;