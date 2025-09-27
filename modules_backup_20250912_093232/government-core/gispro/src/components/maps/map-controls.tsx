import {useState, useRef, useEffect} from 'react';
import {useMap} from 'react-leaflet';
import L from 'leaflet';
import {Button} from '@/components/ui/button';
import {Ruler, Square, Circle as CircleIcon, Trash2, Calculator} from '@mui/icons-material';
import {cn} from '@/lib/utils';
import {calculateArea,
  formatCoordinates,
  squareMetersToAcres,
  squareMetersToSquareFeet,} from '@/lib/map-utils';

interface MapControlsProps {position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  className?: string;}

/**
 * Provides advanced controls for map measurement and annotations
 */
export function MapControls({position = 'topleft', className}: MapControlsProps) {const map = useMap();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);
  const tempLayerRef = useRef<L.LayerGroup | null>(null);
  const measureStartPointRef = useRef<L.LatLng | null>(null);
  const measurePointsRef = useRef<L.LatLng[]>([]);
  const [measurementInfo, setMeasurementInfo] = useState<{
    distance?: number;
    area?: number;
    perimeter?: number;} | null>(null);

  // Initialize layer groups
  useEffect(() =>{measureLayerRef.current = L.layerGroup().addTo(map);
    tempLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      if (measureLayerRef.current) {
        measureLayerRef.current.clearLayers();
        map.removeLayer(measureLayerRef.current);}
      if (tempLayerRef.current) {tempLayerRef.current.clearLayers();
        map.removeLayer(tempLayerRef.current);}
    };
  }, [map]);

  // Cleanup when active tool changes
  useEffect(() => {if (!activeTool) {
      // Clear all temporary layers and reset measurement state
      if (tempLayerRef.current) {
        tempLayerRef.current.clearLayers();}
      measureStartPointRef.current = null;
      measurePointsRef.current = [];
      setMeasurementInfo(null);

      // Restore default map interactions
      map.dragging.enable();
      map.doubleClickZoom.enable();

      // Return to default cursor
      map.getContainer().style.cursor = '';
    } else {// Set cursor and disable some map interactions
      map.getContainer().style.cursor = 'crosshair';
      map.doubleClickZoom.disable();}
  }, [activeTool, map]);

  // Handle distance measurement
  const handleDistanceClick = () => {if (activeTool === 'distance') {
      setActiveTool(null);} else {setActiveTool('distance');

      // Reset current measurement
      measureStartPointRef.current = null;
      measurePointsRef.current = [];
      if (tempLayerRef.current) {
        tempLayerRef.current.clearLayers();}
      setMeasurementInfo(null);
    }
  };

  // Handle area measurement by rectangle
  const handleRectangleClick = () => {if (activeTool === 'rectangle') {
      setActiveTool(null);} else {setActiveTool('rectangle');

      // Reset current measurement
      measureStartPointRef.current = null;
      measurePointsRef.current = [];
      if (tempLayerRef.current) {
        tempLayerRef.current.clearLayers();}
      setMeasurementInfo(null);
    }
  };

  // Handle area measurement by circle
  const handleCircleClick = () => {if (activeTool === 'circle') {
      setActiveTool(null);} else {setActiveTool('circle');

      // Reset current measurement
      measureStartPointRef.current = null;
      measurePointsRef.current = [];
      if (tempLayerRef.current) {
        tempLayerRef.current.clearLayers();}
      setMeasurementInfo(null);
    }
  };

  // Clear all measurements
  const handleClearClick = () => {if (measureLayerRef.current) {
      measureLayerRef.current.clearLayers();}
    if (tempLayerRef.current) {tempLayerRef.current.clearLayers();}
    measureStartPointRef.current = null;
    measurePointsRef.current = [];
    setMeasurementInfo(null);
    setActiveTool(null);
  };

  // Map click handler for measurements
  useEffect(() => {if (!activeTool) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const point = e.latlng;

      switch (activeTool) {
        case 'distance':
          handleDistanceMeasurement(point);
          break;
        case 'rectangle':
          handleRectangleMeasurement(point);
          break;
        case 'circle':
          handleCircleMeasurement(point);
          break;}
    };

    const handleMapMouseMove = (e: L.LeafletMouseEvent) => {if (!measureStartPointRef.current || !tempLayerRef.current) return;

      const point = e.latlng;

      // Clear temporary layers
      tempLayerRef.current.clearLayers();

      switch (activeTool) {
        case 'distance':
          if (measurePointsRef.current.length > 0) {
            const lastPoint = measurePointsRef.current[measurePointsRef.current.length - 1];
            const tempLine = L.polyline([lastPoint, point], {
              color: '#ff0000',
              weight: 2,
              opacity: 0.7,
              dashArray: '5, 10',});
            tempLayerRef.current.addLayer(tempLine);
          }
          break;
        case 'rectangle':
          const rectBounds = L.latLngBounds(measureStartPointRef.current, point);
          const tempRect = L.rectangle(rectBounds, {color: '#ff0000',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.2,
            dashArray: '5, 10',});
          tempLayerRef.current.addLayer(tempRect);
          break;
        case 'circle':
          const radius = measureStartPointRef.current.distanceTo(point);
          const tempCircle = L.circle(measureStartPointRef.current, {radius: radius,
            color: '#ff0000',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.2,
            dashArray: '5, 10',});
          tempLayerRef.current.addLayer(tempCircle);
          break;
      }
    };

    map.on('click', handleMapClick);
    map.on('mousemove', handleMapMouseMove);

    return () => {map.off('click', handleMapClick);
      map.off('mousemove', handleMapMouseMove);};
  }, [activeTool, map]);

  // Distance measurement handler
  const handleDistanceMeasurement = (point: L.LatLng) => {if (!measureLayerRef.current) return;

    if (!measureStartPointRef.current) {
      // First click - start measurement
      measureStartPointRef.current = point;
      measurePointsRef.current = [point];

      // Add start marker
      const startMarker = L.circleMarker(point, {
        radius: 4,
        color: '#0066cc',
        fillColor: '#0066cc',
        fillOpacity: 1,});
      measureLayerRef.current.addLayer(startMarker);
    } else {// Subsequent clicks - add to measurement
      measurePointsRef.current.push(point);

      // Add line segment
      const prevPoint = measurePointsRef.current[measurePointsRef.current.length - 2];
      const line = L.polyline([prevPoint, point], {
        color: '#0066cc',
        weight: 3,
        opacity: 0.8,});
      measureLayerRef.current.addLayer(line);

      // Add point marker
      const marker = L.circleMarker(point, {radius: 4,
        color: '#0066cc',
        fillColor: '#0066cc',
        fillOpacity: 1,});
      measureLayerRef.current.addLayer(marker);

      // Calculate total distance
      let totalDistance = 0;
      for (let i = 1; i< measurePointsRef.current.length; i++) {totalDistance += measurePointsRef.current[i - 1].distanceTo(measurePointsRef.current[i]);}

      setMeasurementInfo({distance: totalDistance});

      // Add distance label
      const midPoint = L.latLng((prevPoint.lat + point.lat) / 2, (prevPoint.lng + point.lng) / 2);

      const segmentDistance = prevPoint.distanceTo(point);
      const distanceText =
        segmentDistance > 1000
          ? `${(segmentDistance / 1000).toFixed(2)} km`
          : `${segmentDistance.toFixed(1)} m`;

      const label = L.divIcon({
        html: `<div class="measurement-label">${distanceText}</div>`,
        className: 'measurement-label-icon',
        iconSize: [60, 20],
        iconAnchor: [30, 10],
      });

      const labelMarker = L.marker(midPoint, {icon: label});
      measureLayerRef.current.addLayer(labelMarker);
    }
  };

  // Rectangle measurement handler
  const handleRectangleMeasurement = (point: L.LatLng) => {if (!measureLayerRef.current) return;

    if (!measureStartPointRef.current) {
      // First click - start rectangle
      measureStartPointRef.current = point;} else {// Second click - complete rectangle
      const bounds = L.latLngBounds(measureStartPointRef.current, point);
      const rectangle = L.rectangle(bounds, {
        color: '#0066cc',
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0.2,});
      measureLayerRef.current.addLayer(rectangle);

      // Calculate area
      const area = calculateArea([
        bounds.getNorthWest(),
        bounds.getNorthEast(),
        bounds.getSouthEast(),
        bounds.getSouthWest(),
      ]);

      setMeasurementInfo({area});

      // Add area label at center
      const center = bounds.getCenter();
      const areaText =
        area > 10000 ? `${squareMetersToAcres(area).toFixed(2)} acres` : `${area.toFixed(1)} m²`;

      const label = L.divIcon({
        html: `<div class="measurement-label">${areaText}</div>`,
        className: 'measurement-label-icon',
        iconSize: [80, 20],
        iconAnchor: [40, 10],
      });

      const labelMarker = L.marker(center, {icon: label});
      measureLayerRef.current.addLayer(labelMarker);

      // Reset for next measurement
      measureStartPointRef.current = null;
      setActiveTool(null);
    }
  };

  // Circle measurement handler
  const handleCircleMeasurement = (point: L.LatLng) => {if (!measureLayerRef.current) return;

    if (!measureStartPointRef.current) {
      // First click - set center
      measureStartPointRef.current = point;

      // Add center marker
      const centerMarker = L.circleMarker(point, {
        radius: 4,
        color: '#0066cc',
        fillColor: '#0066cc',
        fillOpacity: 1,});
      measureLayerRef.current.addLayer(centerMarker);
    } else {// Second click - set radius and complete circle
      const radius = measureStartPointRef.current.distanceTo(point);
      const circle = L.circle(measureStartPointRef.current, {
        radius: radius,
        color: '#0066cc',
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0.2,});
      measureLayerRef.current.addLayer(circle);

      // Calculate area
      const area = Math.PI * radius * radius;

      setMeasurementInfo({area});

      // Add area label at center
      const areaText =
        area > 10000 ? `${squareMetersToAcres(area).toFixed(2)} acres` : `${area.toFixed(1)} m²`;

      const label = L.divIcon({
        html: `<div class="measurement-label">${areaText}</div>`,
        className: 'measurement-label-icon',
        iconSize: [80, 20],
        iconAnchor: [40, 10],
      });

      const labelMarker = L.marker(measureStartPointRef.current, {icon: label});
      measureLayerRef.current.addLayer(labelMarker);

      // Reset for next measurement
      measureStartPointRef.current = null;
      setActiveTool(null);
    }
  };

  // Control component
  useEffect(() =>{// Add CSS for measurement labels
    const style = document.createElement('style');
    style.textContent = `
      .measurement-label {
        background: rgba(0, 102, 204, 0.9);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 500;
        text-align: center;
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);}
      .measurement-label-icon {background: transparent !important;
        border: none !important;}
    `;
    document.head.appendChild(style);

    return () => {document.head.removeChild(style);};
  }, []);

  return (<div className={cn('flex flex-col gap-1 bg-white rounded-lg shadow-lg border p-1', className)}><Button
        variant={activeTool === 'distance' ? 'default' : 'ghost'}
        size="sm"
        onClick={handleDistanceClick}
        className="w-8 h-8 p-0"
        title="Measure Distance"
      ><Ruler className="h-4 w-4" /></Button><Button
        variant={activeTool === 'rectangle' ? 'default' : 'ghost'}
        size="sm"
        onClick={handleRectangleClick}
        className="w-8 h-8 p-0"
        title="Measure Area (Rectangle)"
      ><Square className="h-4 w-4" /></Button><Button
        variant={activeTool === 'circle' ? 'default' : 'ghost'}
        size="sm"
        onClick={handleCircleClick}
        className="w-8 h-8 p-0"
        title="Measure Area (Circle)"
      ><CircleIcon className="h-4 w-4" /></Button><hr className="my-1" /><Button
        variant="ghost"
        size="sm"
        onClick={handleClearClick}
        className="w-8 h-8 p-0"
        title="Clear Measurements"
      ><Trash2 className="h-4 w-4" /></Button>{measurementInfo && (<div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1 min-w-32">{measurementInfo.distance && (<div><strong>Distance:</strong><br />{measurementInfo.distance > 1000
                ? `${(measurementInfo.distance / 1000).toFixed(2)} km`
                : `${measurementInfo.distance.toFixed(1)} m`}</div>)}
          {measurementInfo.area && (<div><strong>Area:</strong><br />{measurementInfo.area > 10000
                ? `${squareMetersToAcres(measurementInfo.area).toFixed(2)} acres`
                : `${measurementInfo.area.toFixed(1)} m²`}<br /><span className="text-gray-600">{squareMetersToSquareFeet(measurementInfo.area).toLocaleString()} ft²</span></div>)}</div>)}

      {activeTool && (<div className="mt-1 p-2 bg-blue-50 rounded text-xs text-blue-700"><Calculator className="h-3 w-3 inline mr-1" />{activeTool === 'distance' && 'Click to add points'}
          {activeTool === 'rectangle' && 'Click two corners'}
          {activeTool === 'circle' && 'Click center, then radius'}</div>)}</div>
  );
}
