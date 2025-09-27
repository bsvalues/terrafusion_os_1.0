import React, {useState, useEffect} from 'react';
import {createPortal} from 'react-dom';
import {Map,
  Control,
  DomUtil,
  DomEvent,
  LeafletMouseEvent,
  LatLng,
  Polyline,
  Polygon,
  LayerGroup,} from 'leaflet';
import {MeasurementType,
  MeasurementUnit,
  calculateDistance,
  calculateArea,
  calculatePerimeter,
  formatDistance,
  formatArea,} from '@/lib/map-utils';

interface MeasurementToolProps {map: Map;
  position: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  measurementValue?: number;
  measurementType?: MeasurementType;
  unit?: MeasurementUnit;
  onMeasure?: (value: number, type: MeasurementType) => void;
  onReset?: () => void;
  onUnitChange?: (unit: MeasurementUnit) => void;}

/**
 * MeasurementTool component for the map
 * Allows measuring distances, areas, and perimeters
 */
const MeasurementTool: React.FC<MeasurementToolProps> = ({map,
  position,
  measurementValue,
  measurementType = MeasurementType.DISTANCE,
  unit = MeasurementUnit.METERS,
  onMeasure,
  onReset,
  onUnitChange,}) => {const [selectedType, setSelectedType] = useState<MeasurementType>(measurementType);
  const [selectedUnit, setSelectedUnit] = useState<MeasurementUnit>(unit);
  const [isActive, setIsActive] = useState(false);
  const [isUnitMenuOpen, setIsUnitMenuOpen] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState<LatLng[]>([]);
  const [measurementValue_, setMeasurementValue] = useState<number | undefined>(measurementValue);
  const [measurementLayer, setMeasurementLayer] = useState<LayerGroup | null>(null);

  // Initialize measurement layer
  useEffect(() =>{
    if (map) {
      const layer = new LayerGroup();
      layer.addTo(map);
      setMeasurementLayer(layer);

      return () => {
        layer.remove();};
    }
  }, [map]);

  // Handle measurement type change
  useEffect(() => {setSelectedType(measurementType);}, [measurementType]);

  // Handle unit change
  useEffect(() => {setSelectedUnit(unit);}, [unit]);

  // Handle measurement value change from props
  useEffect(() => {setMeasurementValue(measurementValue);}, [measurementValue]);

  // Handle click events for measurement
  useEffect(() => {if (!map || !isActive || !measurementLayer) return;

    const handleMapClick = (e: LeafletMouseEvent) => {
      const newPoint = e.latlng;
      const newPoints = [...measurementPoints, newPoint];
      setMeasurementPoints(newPoints);

      // Clear previous measurements
      measurementLayer.clearLayers();

      // Draw current measurement
      if (selectedType === MeasurementType.DISTANCE) {
        // Draw line for distance measurement
        if (newPoints.length > 1) {
          const line = new Polyline(newPoints, {
            color: '#2563eb',
            weight: 3,
            dashArray: '5, 5',});

          measurementLayer.addLayer(line);

          // Calculate total distance
          let totalDistance = 0;
          for (let i = 1; i< newPoints.length; i++) {totalDistance += calculateDistance(
              [newPoints[i - 1].lat, newPoints[i - 1].lng],
              [newPoints[i].lat, newPoints[i].lng],
              selectedUnit
            );}

          setMeasurementValue(totalDistance);
          onMeasure?.(totalDistance, MeasurementType.DISTANCE);
        }
      } else if (
        selectedType === MeasurementType.AREA ||
        selectedType === MeasurementType.PERIMETER
      ) {// Draw polygon for area/perimeter measurement
        if (newPoints.length >2) {
          const polygon = new Polygon(newPoints, {
            color: '#2563eb',
            weight: 3,
            fillColor: '#93c5fd',
            fillOpacity: 0.2,
            dashArray: '5, 5',});

          measurementLayer.addLayer(polygon);

          // Convert points to format needed for turf.js
          const points = newPoints.map(p => [p.lng, p.lat]) as [number, number][];

          // Close the polygon if needed
          if (
            points[0][0] !== points[points.length - 1][0] ||
            points[0][1] !== points[points.length - 1][1]
          ) {points.push(points[0]);}

          // Calculate measurement based on type
          if (selectedType === MeasurementType.AREA) {import('@/lib/map-utils').then(({ pointsToPolygon, calculateArea}) => {const polygon = pointsToPolygon(points);
              const area = calculateArea(polygon, selectedUnit);
              setMeasurementValue(area);
              onMeasure?.(area, MeasurementType.AREA);});
          } else {import('@/lib/map-utils').then(({ pointsToPolygon, calculatePerimeter}) => {const polygon = pointsToPolygon(points);
              const perimeter = calculatePerimeter(polygon, selectedUnit);
              setMeasurementValue(perimeter);
              onMeasure?.(perimeter, MeasurementType.PERIMETER);});
          }
        }
      }
    };

    map.on('click', handleMapClick);

    return () => {map.off('click', handleMapClick);};
  }, [map, isActive, measurementPoints, selectedType, selectedUnit, measurementLayer, onMeasure]);

  // Reset measurement
  const handleReset = () => {setMeasurementPoints([]);
    setMeasurementValue(undefined);
    if (measurementLayer) {
      measurementLayer.clearLayers();}
    onReset?.();
  };

  // Toggle measurement tool active state
  const toggleActive = () => {if (isActive) {
      handleReset();}
    setIsActive(!isActive);
  };

  // Change measurement type
  const changeType = (type: MeasurementType) => {setSelectedType(type);
    handleReset();};

  // Change measurement unit
  const changeUnit = (unit: MeasurementUnit) => {setSelectedUnit(unit);
    setIsUnitMenuOpen(false);
    onUnitChange?.(unit);

    // Recalculate with new unit if we have measurement points
    if (measurementPoints.length > 0) {
      // Force re-render by resetting points
      const currentPoints = [...measurementPoints];
      setMeasurementPoints([]);
      setTimeout(() => {
        setMeasurementPoints(currentPoints);}, 0);
    }
  };

  // Format display value based on type and unit
  const getDisplayValue = () => {if (measurementValue_ === undefined) return 'Click map to start measuring';

    if (selectedType === MeasurementType.AREA) {
      return formatArea(measurementValue_);} else {return formatDistance(measurementValue_);}
  };

  // Custom control component to render in Leaflet map
  const MeasurementControl = Control.extend({
    onAdd: function () {
      const container = DomUtil.create('div', 'leaflet-bar leaflet-control measurement-tool');
      container.style.backgroundColor = 'white';
      container.style.padding = '10px';
      container.style.borderRadius = '4px';
      container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';

      // Prevent map interactions when interacting with the control
      DomEvent.disableClickPropagation(container);
      DomEvent.disableScrollPropagation(container);

      // Create container for the control content
      const mountPoint = DomUtil.create('div');
      container.appendChild(mountPoint);

      // Instead of using createPortal, manually create the HTML structure
      mountPoint.innerHTML = `<div class="measurement-control"><div class="flex flex-col space-y-2"><div class="flex items-center justify-between"><><h3 class="font-medium">Measure</h3><button
</>id="measurement-toggle-active"
                class="px-2 py-1 text-xs rounded ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
              >
                ${isActive ? 'Stop' : 'Start'}</button></div><div class="flex space-x-1"><><button 
                id="measurement-type-distance"
                class="px-2 py-1 text-xs rounded ${selectedType === MeasurementType.DISTANCE ? 'bg-blue-500 text-white active' : 'bg-gray-200'}"
              >Distance</button><button
</>id="measurement-type-area"
                class="px-2 py-1 text-xs rounded ${selectedType === MeasurementType.AREA ? 'bg-blue-500 text-white active' : 'bg-gray-200'}"
              >
                Area</button><button 
                id="measurement-type-perimeter"
                class="px-2 py-1 text-xs rounded ${selectedType === MeasurementType.PERIMETER ? 'bg-blue-500 text-white active' : 'bg-gray-200'}"
              >Perimeter</button></div><div class="relative"><button 
                id="measurement-unit-toggle"
                class="w-full px-2 py-1 text-xs bg-gray-100 rounded flex justify-between items-center"
              ><><span>Units: ${selectedUnit}</span><span
</></>>▼</span></button>${isUnitMenuOpen
                  ? `<div id="measurement-unit-menu" class="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded shadow-lg z-10"><><button 
                    id="measurement-unit-meters"
                    class="w-full px-2 py-1 text-xs text-left hover:bg-gray-100"
                  >Meters</button><button
</>id="measurement-unit-kilometers"
                    class="w-full px-2 py-1 text-xs text-left hover:bg-gray-100"
                  >
                    Kilometers</button><><button 
                    id="measurement-unit-feet"
                    class="w-full px-2 py-1 text-xs text-left hover:bg-gray-100"
                  >Feet</button><button
</>id="measurement-unit-miles"
                    class="w-full px-2 py-1 text-xs text-left hover:bg-gray-100"
                  >
                    Miles</button>${
                    selectedType === MeasurementType.AREA
                      ? `<><button 
                      id="measurement-unit-sqmeters"
                      class="w-full px-2 py-1 text-xs text-left hover:bg-gray-100"
                    >Square Meters</button><button
</>id="measurement-unit-hectares"
                      class="w-full px-2 py-1 text-xs text-left hover:bg-gray-100"
                    >
                      Hectares</button><button 
                      id="measurement-unit-acres"
                      class="w-full px-2 py-1 text-xs text-left hover:bg-gray-100"
                    >Acres</button>`
                      : ''}</div>`
                  : ''
              }</div><div class="flex items-center justify-between mt-2"><><div id="measurement-value" class="text-xs font-medium">${getDisplayValue()}</div><button
</>id="measurement-reset"
                class="px-2 py-1 text-xs bg-red-500 text-white rounded"
              >
                Reset</button></div></div></div>
      `;

      // Add event listeners
      const toggleActiveBtn = mountPoint.querySelector('#measurement-toggle-active');
      if (toggleActiveBtn) {
        DomEvent.on(toggleActiveBtn, 'click', () => {
          toggleActive();
          // Update button text and class after toggle
          toggleActiveBtn.textContent = isActive ? 'Start' : 'Stop';
          toggleActiveBtn.className = `px-2 py-1 text-xs rounded ${!isActive ? 'bg-blue-500 text-white' : 'bg-gray-200'}`;
        });
      }

      // Type buttons
      const distanceBtn = mountPoint.querySelector('#measurement-type-distance');
      if (distanceBtn) {DomEvent.on(distanceBtn, 'click', () => changeType(MeasurementType.DISTANCE));}

      const areaBtn = mountPoint.querySelector('#measurement-type-area');
      if (areaBtn) {DomEvent.on(areaBtn, 'click', () => changeType(MeasurementType.AREA));}

      const perimeterBtn = mountPoint.querySelector('#measurement-type-perimeter');
      if (perimeterBtn) {DomEvent.on(perimeterBtn, 'click', () => changeType(MeasurementType.PERIMETER));}

      // Unit toggle
      const unitToggleBtn = mountPoint.querySelector('#measurement-unit-toggle');
      if (unitToggleBtn) {DomEvent.on(unitToggleBtn, 'click', () => setIsUnitMenuOpen(!isUnitMenuOpen));}

      // Unit buttons
      const unitsMap = {'#measurement-unit-meters': MeasurementUnit.METERS,
        '#measurement-unit-kilometers': MeasurementUnit.KILOMETERS,
        '#measurement-unit-feet': MeasurementUnit.FEET,
        '#measurement-unit-miles': MeasurementUnit.MILES,
        '#measurement-unit-sqmeters': MeasurementUnit.SQUARE_METERS,
        '#measurement-unit-hectares': MeasurementUnit.HECTARES,
        '#measurement-unit-acres': MeasurementUnit.ACRES,};

      Object.entries(unitsMap).forEach(([selector, unitValue]) => {const unitBtn = mountPoint.querySelector(selector);
        if (unitBtn) {
          DomEvent.on(unitBtn, 'click', () => changeUnit(unitValue));}
      });

      // Reset button
      const resetBtn = mountPoint.querySelector('#measurement-reset');
      if (resetBtn) {DomEvent.on(resetBtn, 'click', handleReset);}

      return container;
    },

    onRemove: function () {// Clean up on removal},
  });

  // Leaflet-compatible component
  useEffect(() => {if (!map) return;

    const control = new MeasurementControl({ position});
    control.addTo(map);

    return () => {control.remove();};
  }, [map, position, isActive, selectedType, selectedUnit, measurementValue_, isUnitMenuOpen]);

  // Empty div as the real rendering happens via portal
  return null;
};

export default MeasurementTool;
