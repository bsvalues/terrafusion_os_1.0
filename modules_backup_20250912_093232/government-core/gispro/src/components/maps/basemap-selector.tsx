import React, {useState, useEffect} from 'react';
import {createPortal} from 'react-dom';
import {Map, 
  Control, 
  DomUtil, 
  DomEvent,
  TileLayer} from 'leaflet';
import {getBaseMapUrl,
  getBaseMapAttribution} from '@/lib/map-utils';
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Label} from "@/components/ui/label";
import {Layers} from '@mui/icons-material';

// Type for base map options
type BaseMapType = 'street' | 'satellite' | 'topo';

interface BaseMapSelectorProps {map: Map;
  position: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  initialBaseMap?: BaseMapType;
  onBaseMapChange?: (baseMap: BaseMapType) => void;}

/**
 * BaseMapSelector component for the map
 * Allows switching between different base maps (street, satellite, topographic)
 */
const BaseMapSelector: React.FC<BaseMapSelectorProps> = ({map,
  position,
  initialBaseMap = 'street',
  onBaseMapChange}) => {const [selectedBaseMap, setSelectedBaseMap] = useState<BaseMapType>(initialBaseMap);
  const [baseMapLayer, setBaseMapLayer] = useState<TileLayer | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Initialize or update base map layer when selection changes
  useEffect(() =>{
    if (!map) return;
    
    // Remove existing base map layer if any
    if (baseMapLayer) {
      baseMapLayer.remove();}
    
    // Remove any existing tile layers
    map.eachLayer((layer) => {if (layer instanceof TileLayer) {
        map.removeLayer(layer);}
    });
    
    // Create new base map layer
    const url = getBaseMapUrl(selectedBaseMap);
    const attribution = getBaseMapAttribution(selectedBaseMap);
    
    const newBaseMapLayer = new TileLayer(url, {attribution,
      maxZoom: 19});
    
    // Add the new base map layer to the map
    newBaseMapLayer.addTo(map);
    setBaseMapLayer(newBaseMapLayer);
    
    // Notify parent component
    onBaseMapChange?.(selectedBaseMap);
    
    // Clean up on unmount
    return () => {if (newBaseMapLayer) {
        newBaseMapLayer.remove();}
    };
  }, [map, selectedBaseMap, onBaseMapChange]);

  // Handle base map change
  const changeBaseMap = (baseMap: BaseMapType) => {setSelectedBaseMap(baseMap);};

  // Custom control component to render in Leaflet map
  const BaseMapControl = Control.extend({
    onAdd: function() {
      const container = DomUtil.create('div', 'leaflet-bar leaflet-control basemap-selector-tool');
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
      createPortal(<div className="basemap-selector-control"><div className="flex flex-col space-y-2"><div className="flex items-center justify-between"><h3 className="font-medium flex items-center"><><Layers className="w-4 h-4 mr-1" />Base Map</h3><button
</>onClick={() => setIsExpanded(!isExpanded)}
                className="px-2 py-1 text-xs bg-gray-200 rounded"
              >
                {isExpanded ? 'Collapse' : 'Expand'}</button></div>{isExpanded && (<RadioGroup 
                value={selectedBaseMap} 
                onValueChange={(value) => changeBaseMap(value as BaseMapType)}
                className="space-y-1"
              ><div className="flex items-center space-x-2"><RadioGroupItem value="street" id="street" /><Label htmlFor="street" className="text-xs">Street</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="satellite" id="satellite" /><Label htmlFor="satellite" className="text-xs">Satellite</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="topo" id="topo" /><Label htmlFor="topo" className="text-xs">Topographic</Label></div></RadioGroup>)}</div></div>,
        mountPoint
      );
      
      return container;
    },
    
    onRemove: function() {// Clean up on removal
      if (baseMapLayer) {
        baseMapLayer.remove();}
    }
  });

  // Leaflet-compatible component
  useEffect(() => {if (!map) return;
    
    const control = new BaseMapControl({ position});
    control.addTo(map);
    
    return () => {control.remove();};
  }, [map, position, selectedBaseMap, isExpanded]);

  // Empty div as the real rendering happens via portal
  return null;
};

export default BaseMapSelector;