import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Map, 
  Control, 
  DomUtil, 
  DomEvent 
} from 'leaflet';
import { 
  MapLayerType,
  MapLayer
} from '@/lib/map-utils';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Filter, Plus  } from '@mui/icons-material';

interface PropertyFilter {
  name: string;
  value: string;
  operator?: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
}

interface LayerFilterProps {
  map: Map;
  position: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  layers: MapLayer[];
  onFilterChange?: (selectedTypes: string[]) => void;
}

/**
 * LayerFilter component for the map
 * Allows filtering map layers by type and properties
 */
const LayerFilter: React.FC<LayerFilterProps> = ({
  map,
  position,
  layers,
  onFilterChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  // State for property filter inputs
  const [propertyName, setPropertyName] = useState('');
  const [propertyValue, setPropertyValue] = useState('');
  const [propertyOperator, setPropertyOperator] = useState<PropertyFilter['operator']>('equals');

  // Get unique layer types from provided layers
  const layerTypes = React.useMemo(() => {
    const types = new Set<MapLayerType>();
    layers.forEach(layer => types.add(layer.type));
    return Array.from(types);
  }, [layers]);

  // Toggle layer type filter
  const toggleLayerType = (type: MapLayerType) => {
    let newTypes: string[];
    
    if (selectedTypes.includes(type)) {
      newTypes = selectedTypes.filter(t => t !== type);
    } else {
      newTypes = [...selectedTypes, type];
    }
    
    setSelectedTypes(newTypes);
    
    // Apply filters when a layer type is toggled
    if (map) {
      applyLayerFilters(map, newTypes);
    }
    
    onFilterChange?.(newTypes);
  };

  // Add property filter - we're simplifying this for the current iteration 
  // and just focusing on layer type filtering
  const addPropertyFilter = () => {
    if (!propertyName || !propertyValue) return;
    
    // In future iterations, we'll handle property filters
    
    // Clear inputs
    setPropertyName('');
    setPropertyValue('');
  };

  // Remove property filter - simplified for current iteration
  const removePropertyFilter = (index: number) => {
    // In future iterations, we'll handle property filters
  };

  // Apply filters - directly apply current selectedTypes
  const applyFilters = () => {
    // In our simplified version, we'll just use the layer type filters
    if (map) {
      applyLayerFilters(map, selectedTypes);
    }
    
    onFilterChange?.(selectedTypes);
  };

  // Clear all filters
  const clearFilters = () => {
    const emptyTypes: string[] = [];
    setSelectedTypes(emptyTypes);
    setPropertyName('');
    setPropertyValue('');
    
    if (map) {
      applyLayerFilters(map, emptyTypes);
    }
    
    onFilterChange?.(emptyTypes);
  };

  // Format operator for display
  const formatOperator = (operator?: PropertyFilter['operator']) => {
    switch(operator) {
      case 'equals': return '=';
      case 'contains': return 'contains';
      case 'greaterThan': return '>';
      case 'lessThan': return '<';
      default: return '=';
    }
  };

  // Custom control component to render in Leaflet map
  const LayerFilterControl = Control.extend({
    onAdd: function() {
      const container = DomUtil.create('div', 'leaflet-bar leaflet-control layer-filter-tool');
      container.style.backgroundColor = 'white';
      container.style.padding = '10px';
      container.style.borderRadius = '4px';
      container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
      
      // Prevent map interactions when interacting with the control
      DomEvent.disableClickPropagation(container);
      DomEvent.disableScrollPropagation(container);
      
      // Create portal for React component
      const mountPoint = DomUtil.create('div');
      container.appendChild(mountPoint);
      
      // Portal to render React inside Leaflet Control
      createPortal(
        <div className="layer-filter-control">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center"><>

                <Filter className="w-4 h-4 mr-1" />
                Layer Filter
              </h3>
              <button
</>

                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2 py-1 text-xs bg-gray-200 rounded"
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
            
            {isExpanded && (
                {/* Layer type filters */}
                <div className="border-t pt-2"><>

                  <h4 className="text-xs font-medium mb-1">Layer Type</h4>
                  <div
</>
className="flex flex-col space-y-1">
                    {layerTypes.map(type => (
                      <label 
                        key={type} 
                        className="flex items-center space-x-2 text-xs"
                      >
                        <Checkbox 
                          id={`type-${type}`}
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => toggleLayerType(type)}
                        />
                        <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Property filters */}
                <div className="border-t pt-2">
                  <h4 className="text-xs font-medium mb-1">Properties</h4>
                  
                  {/* Property filter inputs */}
                  <div className="flex flex-col space-y-1">
                    <Input
                      placeholder="Enter property name"
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      className="h-7 text-xs"
                    />
                    
                    <div className="flex space-x-1">
                      <select
                        value={propertyOperator}
                        onChange={(e) => setPropertyOperator(e.target.value as PropertyFilter['operator'])}
                        className="h-7 text-xs border rounded px-2"
                      ><>

                        <option value="equals">=</option>
                        <option
</>
value="contains">contains</option><>

                        <option value="greaterThan">&gt;</option>
                        <option
</>
value="lessThan">&lt;</option>
                      </select>
                      
                      <Input
                        placeholder="Enter filter value"
                        value={propertyValue}
                        onChange={(e) => setPropertyValue(e.target.value)}
                        className="h-7 text-xs"
                      />
                      
                      <Button
                        onClick={addPropertyFilter}
                        className="h-7 w-7 p-0"
                        title="Add property filter"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Property filters section is simplified in this version */}
                  <div className="mt-2 text-xs text-muted-foreground">
                    Property filtering will be available in the next update.
                  </div>
                </div>
                
                {/* Filter actions */}
                <div className="flex justify-between pt-2"><>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7 text-xs"
                  >
                    Clear Filters
                  </Button>
                  
                  <Button
</>

                    variant="default"
                    size="sm"
                    onClick={applyFilters}
                    className="h-7 text-xs"
                  >
                    Apply Filters
                  </Button>
                </div>
            )}
          </div>
        </div>,
        mountPoint
      );
      
      return container;
    },
    
    onRemove: function() {
      // Clean up on removal
    }
  });

  // Leaflet-compatible component
  useEffect(() => {
    if (!map) return;
    
    const control = new LayerFilterControl({ position });
    control.addTo(map);
    
    return () => {
      control.remove();
    };
  }, [map, position, isExpanded, selectedTypes, propertyName, propertyValue, propertyOperator, layerTypes]);

  // Empty div as the real rendering happens via portal
  return null;
};

// Function to filter layers on the map based on selected property types
function applyLayerFilters(
  map: Map,
  selectedTypes: string[]
): void {
  // Apply filters to each layer in the map
  // This is a simplified implementation that just shows/hides layers based on property types
  // or other criteria from the filters array
  
  // The filter string array contains the property types to show
  // Other layers should be hidden
  
  // Apply filter to each GeoJSON layer in the map
  map.eachLayer(layer => {
    // Skip the base tile layer and non-GeoJSON layers
    if (!('options' in layer) || !layer.options || layer.options.pane === 'tilePane') {
      return;
    }
    
    // Check if this is a GeoJSON layer
    if ('feature' in layer) {
      // Extract the layer type from feature properties
      const layerType = (layer as any).feature?.properties?.layerType;
      
      if (layerType && selectedTypes.length > 0) {
        if (selectedTypes.includes(layerType)) {
          // Show the layer
          if ('setStyle' in layer) {
            (layer as any).setStyle({ opacity: 1, fillOpacity: 0.2 });
          }
        } else {
          // Hide the layer
          if ('setStyle' in layer) {
            (layer as any).setStyle({ opacity: 0, fillOpacity: 0 });
          }
        }
      }
    }
  });
}

// Helper to check if a feature's properties match a property filter
function matchesPropertyFilter(
  properties: any, 
  filter: PropertyFilter
): boolean {
  if (!properties || !(filter.name in properties)) {
    return false;
  }
  
  const value = properties[filter.name];
  
  switch (filter.operator) {
    case 'contains':
      return String(value).toLowerCase().includes(filter.value.toLowerCase());
    case 'greaterThan':
      return Number(value) > Number(filter.value);
    case 'lessThan':
      return Number(value) < Number(filter.value);
    case 'equals':
    default:
      return String(value) === filter.value;
  }
}

export default LayerFilter;