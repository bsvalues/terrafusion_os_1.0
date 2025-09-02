import { useState, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Ruler, 
  Square,
  Circle as CircleIcon,
  Trash2,
  Calculator
 } from '@mui/icons-material';
import { cn } from '@/lib/utils';
import { 
  calculateArea, 
  formatCoordinates, 
  squareMetersToAcres,
  squareMetersToSquareFeet
} from '@/lib/map-utils';

interface MapControlsProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  className?: string;
}

/**
 * Provides advanced controls for map measurement and annotations
 */
export function MapControls({ position = 'topleft', className }: MapControlsProps) {
  const map = useMap();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);
  const tempLayerRef = useRef<L.LayerGroup | null>(null);
  const measureStartPointRef = useRef<L.LatLng | null>(null);
  const measurePointsRef = useRef<L.LatLng[]>([]);
  const [measurementInfo, setMeasurementInfo] = useState<{ 
    distance?: number; 
    area?: number;
    perimeter?: number;
  } | null>(null);
  
  // Initialize layer groups
  useEffect(() => {
    measureLayerRef.current = L.layerGroup().addTo(map);
    tempLayerRef.current = L.layerGroup().addTo(map);
    
    return () => {
      if (measureLayerRef.current) {
        measureLayerRef.current.clearLayers();
        map.removeLayer(measureLayerRef.current);
      }
      if (tempLayerRef.current) {
        tempLayerRef.current.clearLayers();
        map.removeLayer(tempLayerRef.current);
      }
    };
  }, [map]);
  
  // Cleanup when active tool changes
  useEffect(() => {
    if (!activeTool) {
      // Clear all temporary layers and reset measurement state
      if (tempLayerRef.current) {
        tempLayerRef.current.clearLayers();
      }
      measureStartPointRef.current = null;
      measurePointsRef.current = [];
      setMeasurementInfo(null);
      
      // Restore default map interactions
      map.dragging.enable();
      map.doubleClickZoom.enable();
      
      // Return to default cursor
      map.getContainer().style.cursor = '';
    } else {
      // Set cursor and disable some map interactions
      map.getContainer().style.cursor = 'crosshair';
      map.doubleClickZoom.disable();
    }
  }, [activeTool, map]);
  
  // Handle distance measurement
  const handleDistanceClick = () => {
    if (activeTool === 'distance') {
      setActiveTool(null);
    } else {
      setActiveTool('distance');
      
      // Reset current measurement
      measureStartPointRef.current = null;
      measurePointsRef.current = [];
      if (tempLayerRef.current) {
        tempLayerRef.current.clearLayers();
      }
      setMeasurementInfo(null);
    }
  };
  
  // Handle area measurement by rectangle
  const handleRectangleClick = () => {
    if (activeTool === 'rectangle') {
      setActiveTool(null);
    } else {
      setActiveTool('rectangle');
      
      // Reset current measurement
      if (tempLayerRef.current) {
        tempLayerRef.current.clearLayers();
      }
      setMeasurementInfo(null);
    }
  };
  
  // Handle area measurement by polygon
  const handlePolygonClick = () => {
    if (activeTool === 'polygon') {
      setActiveTool(null);
    } else {
      setActiveTool('polygon');
      
      // Reset current measurement
      measurePointsRef.current = [];
      if (tempLayerRef.current) {
        tempLayerRef.current.clearLayers();
      }
      setMeasurementInfo(null);
    }
  };
  
  // Handle clear measurements
  const handleClearClick = () => {
    if (measureLayerRef.current) {
      measureLayerRef.current.clearLayers();
    }
    if (tempLayerRef.current) {
      tempLayerRef.current.clearLayers();
    }
    measureStartPointRef.current = null;
    measurePointsRef.current = [];
    setMeasurementInfo(null);
    setActiveTool(null);
  };
  
  // Handle map click events
  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!activeTool) return;
      
      const clickPoint = e.latlng;
      
      if (activeTool === 'distance') {
        if (!measureStartPointRef.current) {
          // First point
          measureStartPointRef.current = clickPoint;
          
          // Add marker at start point
          if (tempLayerRef.current) {
            const marker = L.circleMarker(clickPoint, {
              radius: 5,
              color: '#3B82F6',
              fillColor: '#3B82F6',
              fillOpacity: 1
            }).addTo(tempLayerRef.current);
            
            // Add tooltip showing coordinates
            marker.bindTooltip(formatCoordinates([clickPoint.lng, clickPoint.lat]), {
              permanent: true,
              direction: 'top',
              className: 'bg-white px-2 py-1 rounded shadow text-xs'
            }).openTooltip();
          }
        } else {
          // Second point
          const startPoint = measureStartPointRef.current;
          
          // Calculate distance
          const distance = startPoint.distanceTo(clickPoint);
          
          // Add final marker
          if (tempLayerRef.current) {
            const marker = L.circleMarker(clickPoint, {
              radius: 5,
              color: '#3B82F6',
              fillColor: '#3B82F6',
              fillOpacity: 1
            }).addTo(tempLayerRef.current);
            
            // Add tooltip showing coordinates
            marker.bindTooltip(formatCoordinates([clickPoint.lng, clickPoint.lat]), {
              permanent: true,
              direction: 'top',
              className: 'bg-white px-2 py-1 rounded shadow text-xs'
            }).openTooltip();
            
            // Draw line
            const line = L.polyline([startPoint, clickPoint], {
              color: '#3B82F6',
              weight: 3,
              dashArray: '5, 5'
            }).addTo(tempLayerRef.current);
            
            // Add distance label
            let distanceLabel: string;
            if (distance >= 1000) {
              distanceLabel = `${(distance / 1000).toFixed(2)} km`;
            } else {
              distanceLabel = `${Math.round(distance)} m`;
            }
            
            const midPoint = L.latLng(
              (startPoint.lat + clickPoint.lat) / 2,
              (startPoint.lng + clickPoint.lng) / 2
            );
            
            const tooltip = L.tooltip({
              permanent: true,
              direction: 'center',
              className: 'bg-primary text-white px-2 py-1 rounded-full shadow text-xs'
            })
              .setLatLng(midPoint)
              .setContent(distanceLabel)
              .addTo(tempLayerRef.current);
            
            // Move the measurement to permanent layer
            if (measureLayerRef.current) {
              tempLayerRef.current.clearLayers();
              
              L.circleMarker(startPoint, {
                radius: 5,
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 1
              }).addTo(measureLayerRef.current);
              
              L.circleMarker(clickPoint, {
                radius: 5,
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 1
              }).addTo(measureLayerRef.current);
              
              line.addTo(measureLayerRef.current);
              tooltip.addTo(measureLayerRef.current);
            }
            
            // Update measurement info
            setMeasurementInfo({ distance });
            
            // Reset for next measurement
            measureStartPointRef.current = null;
          }
        }
      } else if (activeTool === 'rectangle' && !measureStartPointRef.current) {
        // Save start point
        measureStartPointRef.current = clickPoint;
        
        // Set up mousemove handler for rectangle preview
        const handleMouseMove = (e: L.LeafletMouseEvent) => {
          if (!measureStartPointRef.current || !tempLayerRef.current) return;
          
          tempLayerRef.current.clearLayers();
          
          const bounds = L.latLngBounds(measureStartPointRef.current, e.latlng);
          
          L.rectangle(bounds, {
            color: '#3B82F6',
            weight: 2,
            fillColor: '#93C5FD',
            fillOpacity: 0.3,
            dashArray: '5, 5'
          }).addTo(tempLayerRef.current);
        };
        
        // Set up mouseup handler to complete rectangle
        const handleMouseUp = (e: L.LeafletMouseEvent) => {
          if (!measureStartPointRef.current || !tempLayerRef.current || !measureLayerRef.current) return;
          
          const bounds = L.latLngBounds(measureStartPointRef.current, e.latlng);
          
          // Create rectangle for final measurement
          const rectangle = L.rectangle(bounds, {
            color: '#3B82F6',
            weight: 2,
            fillColor: '#93C5FD',
            fillOpacity: 0.3
          });
          
          // Calculate area
          const geojson = rectangle.toGeoJSON();
          const area = calculateArea(geojson);
          
          // Add rectangle to permanent layer
          rectangle.addTo(measureLayerRef.current);
          
          // Add area label
          const center = bounds.getCenter();
          
          let areaLabel: string;
          if (area >= 10000) {
            // Show in hectares
            areaLabel = `${(area / 10000).toFixed(2)} ha`;
          } else {
            // Show in square meters
            areaLabel = `${Math.round(area)} m²`;
          }
          
          L.tooltip({
            permanent: true,
            direction: 'center',
            className: 'bg-primary text-white px-2 py-1 rounded-full shadow text-xs'
          })
            .setLatLng(center)
            .setContent(areaLabel)
            .addTo(measureLayerRef.current);
          
          // Update measurement info with acres and square feet too
          setMeasurementInfo({
            area,
            perimeter: 2 * (bounds.getNorth() - bounds.getSouth()) + 
                      2 * (bounds.getEast() - bounds.getWest())
          });
          
          // Reset state and remove handlers
          tempLayerRef.current.clearLayers();
          measureStartPointRef.current = null;
          map.off('mousemove', handleMouseMove);
          map.off('mouseup', handleMouseUp);
          setActiveTool(null);
        };
        
        map.on('mousemove', handleMouseMove);
        map.on('mouseup', handleMouseUp);
      } else if (activeTool === 'polygon') {
        // Add point to polygon
        measurePointsRef.current.push(clickPoint);
        
        // Draw current polygon
        if (tempLayerRef.current) {
          tempLayerRef.current.clearLayers();
          
          if (measurePointsRef.current.length === 1) {
            // Just add a marker for the first point
            L.circleMarker(clickPoint, {
              radius: 5,
              color: '#3B82F6',
              fillColor: '#3B82F6',
              fillOpacity: 1
            }).addTo(tempLayerRef.current);
          } else {
            // Add all markers
            measurePointsRef.current.forEach(point => {
              L.circleMarker(point, {
                radius: 5,
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 1
              }).addTo(tempLayerRef.current);
            });
            
            // Draw the polygon
            L.polyline(measurePointsRef.current, {
              color: '#3B82F6',
              weight: 2,
              dashArray: '5, 5'
            }).addTo(tempLayerRef.current);
          }
        }
      }
    };
    
    // Handle double click to complete polygon
    const handleDoubleClick = (e: L.LeafletMouseEvent) => {
      if (activeTool === 'polygon' && measurePointsRef.current.length >= 3) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
        
        // Close the polygon
        if (measureLayerRef.current && tempLayerRef.current) {
          // Create final polygon
          const points = [...measurePointsRef.current];
          const polygon = L.polygon(points, {
            color: '#3B82F6',
            weight: 2,
            fillColor: '#93C5FD',
            fillOpacity: 0.3
          });
          
          // Calculate area
          const geojson = polygon.toGeoJSON();
          const area = calculateArea(geojson);
          
          // Add polygon to permanent layer
          polygon.addTo(measureLayerRef.current);
          
          // Add area label at centroid
          const centroid = polygon.getBounds().getCenter();
          
          let areaLabel: string;
          if (area >= 10000) {
            // Show in hectares
            areaLabel = `${(area / 10000).toFixed(2)} ha`;
          } else {
            // Show in square meters
            areaLabel = `${Math.round(area)} m²`;
          }
          
          L.tooltip({
            permanent: true,
            direction: 'center',
            className: 'bg-primary text-white px-2 py-1 rounded-full shadow text-xs'
          })
            .setLatLng(centroid)
            .setContent(areaLabel)
            .addTo(measureLayerRef.current);
          
          // Update measurement info
          setMeasurementInfo({
            area,
            perimeter: calculatePolygonPerimeter(points)
          });
          
          // Reset state
          tempLayerRef.current.clearLayers();
          measurePointsRef.current = [];
          setActiveTool(null);
        }
      }
    };
    
    const calculatePolygonPerimeter = (points: L.LatLng[]): number => {
      let perimeter = 0;
      for (let i = 0; i < points.length; i++) {
        const nextIndex = (i + 1) % points.length;
        perimeter += points[i].distanceTo(points[nextIndex]);
      }
      return perimeter;
    };
    
    // Add event listeners
    map.on('click', handleMapClick);
    map.on('dblclick', handleDoubleClick);
    
    // Cleanup
    return () => {
      map.off('click', handleMapClick);
      map.off('dblclick', handleDoubleClick);
    };
  }, [activeTool, map]);
  
  // Position classes for the control panel
  const getPositionClass = () => {
    switch (position) {
      case 'topright': return 'top-2 right-2';
      case 'bottomleft': return 'bottom-2 left-2';
      case 'bottomright': return 'bottom-2 right-2';
      default: return 'top-2 left-2';
    }
  };
  
  return (
      <div 
        className={cn(
          'absolute z-[1000] bg-white rounded-md shadow-md p-2 flex flex-col gap-1',
          getPositionClass(),
          className
        )}
      >
        <Button 
          size="icon" 
          variant={activeTool === 'distance' ? 'default' : 'outline'} 
          onClick={handleDistanceClick}
          title="Measure Distance"
        ><>

          <Ruler size={18} />
        </Button>
        <Button
</>

          size="icon" 
          variant={activeTool === 'rectangle' ? 'default' : 'outline'} 
          onClick={handleRectangleClick}
          title="Measure Area (Rectangle)"
        ><>

          <Square size={18} />
        </Button>
        <Button
</>

          size="icon" 
          variant={activeTool === 'polygon' ? 'default' : 'outline'} 
          onClick={handlePolygonClick}
          title="Measure Area (Polygon)"
        ><>

          <CircleIcon size={18} />
        </Button>
        <div
</>
className="w-full h-px bg-gray-200 my-1"></div>
        <Button 
          size="icon" 
          variant="outline" 
          onClick={handleClearClick}
          title="Clear Measurements"
        >
          <Trash2 size={18} />
        </Button>
      </div>
      
      {/* Measurement info panel */}
      {measurementInfo && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-[1000] bg-white rounded-md shadow-md p-3 flex flex-col gap-1 min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center"><>

              <Calculator size={16} className="mr-2" />
              Measurement Results
            </h3>
            <Button
</>

              size="icon" 
              variant="ghost" 
              className="h-6 w-6"
              onClick={() => setMeasurementInfo(null)}
              title="Close"
            >
              <Trash2 size={14} />
            </Button>
          </div>
          
          {measurementInfo.distance !== undefined && (
            <div className="grid grid-cols-2 gap-1 text-xs"><>

              <span className="text-gray-500">Distance:</span>
              <span
</>
className="font-medium text-right">
                {measurementInfo.distance >= 1000 
                  ? `${(measurementInfo.distance / 1000).toFixed(2)} km` 
                  : `${Math.round(measurementInfo.distance)} m`}
              </span><>

              <span className="text-gray-500">Miles:</span>
              <span
</>
className="font-medium text-right">
                {(measurementInfo.distance * 0.000621371).toFixed(3)} mi
              </span><>

              <span className="text-gray-500">Feet:</span>
              <span
</>
className="font-medium text-right">
                {Math.round(measurementInfo.distance * 3.28084)} ft
              </span>
            </div>
          )}
          
          {measurementInfo.area !== undefined && (
            <div className="grid grid-cols-2 gap-1 text-xs"><>

              <span className="text-gray-500">Area:</span>
              <span
</>
className="font-medium text-right">
                {measurementInfo.area >= 10000 
                  ? `${(measurementInfo.area / 10000).toFixed(2)} ha` 
                  : `${Math.round(measurementInfo.area)} m²`}
              </span><>

              <span className="text-gray-500">Acres:</span>
              <span
</>
className="font-medium text-right">
                {squareMetersToAcres(measurementInfo.area).toFixed(3)} ac
              </span><>

              <span className="text-gray-500">Square Feet:</span>
              <span
</>
className="font-medium text-right">
                {Math.round(squareMetersToSquareFeet(measurementInfo.area))} ft²
              </span>
              
              {measurementInfo.perimeter !== undefined && (<>

                  <span className="text-gray-500 mt-1">Perimeter:</span>
                  <span
</>
className="font-medium text-right mt-1">
                    {measurementInfo.perimeter >= 1000 
                      ? `${(measurementInfo.perimeter / 1000).toFixed(2)} km` 
                      : `${Math.round(measurementInfo.perimeter)} m`}
                  </span>
              )}
            </div>
          )}
        </div>
      )}
  );
}