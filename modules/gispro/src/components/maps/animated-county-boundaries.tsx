import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoJSONFeature, MapLayerType } from '@/lib/map-utils';
import { 
  animateBoundary, 
  animateZoomToBoundary, 
  createPulsatingBoundary 
} from '@/lib/animation-utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BoundaryState = 'county' | 'township' | 'section' | 'parcel';

interface AnimatedCountyBoundariesProps {
  countyData: GeoJSONFeature;
  townshipData?: GeoJSONFeature[];
  sectionData?: GeoJSONFeature[];
  parcelData?: GeoJSONFeature[];
  onBoundaryChange?: (state: BoundaryState) => void;
  className?: string;
  highlightColor?: string;
  animationDuration?: number;
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
}

/**
 * AnimatedCountyBoundaries component renders a control to animate transitions
 * between different boundary hierarchies (county -> township -> section -> parcel)
 */
export function AnimatedCountyBoundaries({
  countyData,
  townshipData = [],
  sectionData = [],
  parcelData = [],
  onBoundaryChange,
  className = '',
  highlightColor = '#3388ff',
  animationDuration = 800,
  position = 'topleft'
}: AnimatedCountyBoundariesProps) {
  const map = useMap();
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const [currentState, setCurrentState] = useState<BoundaryState>('county');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Initialize the boundary layer
  useEffect(() => {
    if (!map) return;
    
    // Create the boundary layer if it doesn't exist
    if (!boundaryLayerRef.current) {
      boundaryLayerRef.current = L.geoJSON(countyData, {
        style: {
          color: '#3B82F6',
          weight: 3,
          fillOpacity: 0.2,
          fillColor: '#93C5FD'
        }
      }).addTo(map);
    }
    
    // Clean up on unmount
    return () => {
      if (boundaryLayerRef.current) {
        map.removeLayer(boundaryLayerRef.current);
        boundaryLayerRef.current = null;
      }
    };
  }, [map, countyData]);
  
  // Function to handle transitions between boundary states
  const transitionTo = (targetState: BoundaryState) => {
    if (!map || !boundaryLayerRef.current || isAnimating) return;
    
    // Don't animate if we're already in that state
    if (currentState === targetState) return;
    
    setIsAnimating(true);
    
    // Get the target data based on the state
    let targetData: GeoJSONFeature | GeoJSONFeature[] | undefined;
    switch (targetState) {
      case 'county':
        targetData = countyData;
        break;
      case 'township':
        targetData = townshipData.length > 0 ? townshipData[0] : undefined;
        break;
      case 'section':
        targetData = sectionData.length > 0 ? sectionData[0] : undefined;
        break;
      case 'parcel':
        targetData = parcelData.length > 0 ? parcelData[0] : undefined;
        break;
    }
    
    // If no target data, fall back to county data
    if (!targetData) {
      targetData = countyData;
    }
    
    // If target is an array, use the first element
    const singleTargetData = Array.isArray(targetData) ? targetData[0] : targetData;
    
    // Get current features from the boundary layer
    const currentFeatures: GeoJSONFeature[] = [];
    boundaryLayerRef.current.eachLayer((layer: any) => {
      if (layer.feature) {
        currentFeatures.push(layer.feature);
      }
    });
    
    // If no current features, just add the target data
    if (currentFeatures.length === 0) {
      boundaryLayerRef.current.addData(singleTargetData);
      setCurrentState(targetState);
      setIsAnimating(false);
      if (onBoundaryChange) onBoundaryChange(targetState);
      return;
    }
    
    const currentFeature = currentFeatures[0];
    
    // First, zoom to the boundary we're transitioning to
    animateZoomToBoundary(map, singleTargetData, 50, animationDuration);
    
    // Then animate the boundary transition
    animateBoundary(
      map,
      boundaryLayerRef.current,
      currentFeature,
      singleTargetData,
      animationDuration,
      () => {
        // Add a pulsating effect when the transition is complete
        createPulsatingBoundary(
          map,
          boundaryLayerRef.current!,
          singleTargetData,
          highlightColor,
          0.2, // buffer distance in km
          animationDuration,
          () => {
            setCurrentState(targetState);
            setIsAnimating(false);
            if (onBoundaryChange) onBoundaryChange(targetState);
          }
        );
      }
    );
  };
  
  // Create a Leaflet control for the boundary navigation
  useEffect(() => {
    if (!map) return;
    
    // Custom Leaflet Control
    const BoundaryControl = L.Control.extend({
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control animated-boundaries-control');
        container.style.backgroundColor = 'white';
        container.style.padding = '5px';
        container.style.borderRadius = '4px';
        container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
        
        return container;
      }
    });
    
    const control = new BoundaryControl({ position });
    control.addTo(map);
    
    // Clean up on unmount
    return () => {
      map.removeControl(control);
    };
  }, [map, position]);
  
  // Create CSS classes based on position
  const controlClasses = cn(
    'flex gap-1',
    position.includes('right') ? 'flex-row' : 'flex-row',
    position.includes('bottom') ? 'items-end' : 'items-start',
    className
  );
  
  return (
    <div className={controlClasses}><>

      <Button
        size="sm"
        variant={currentState === 'county' ? 'default' : 'outline'}
        onClick={() => transitionTo('county')}
        disabled={isAnimating || currentState === 'county'}
        className="text-xs py-1 h-8"
      >
        County
      </Button>
      
      <Button
</>
        size="sm"
        variant={currentState === 'township' ? 'default' : 'outline'}
        onClick={() => transitionTo('township')}
        disabled={isAnimating || currentState === 'township' || townshipData.length === 0}
        className="text-xs py-1 h-8"
      >
        Township
      </Button><>

      
      <Button
        size="sm"
        variant={currentState === 'section' ? 'default' : 'outline'}
        onClick={() => transitionTo('section')}
        disabled={isAnimating || currentState === 'section' || sectionData.length === 0}
        className="text-xs py-1 h-8"
      >
        Section
      </Button>
      
      <Button
</>
        size="sm"
        variant={currentState === 'parcel' ? 'default' : 'outline'}
        onClick={() => transitionTo('parcel')}
        disabled={isAnimating || currentState === 'parcel' || parcelData.length === 0}
        className="text-xs py-1 h-8"
      >
        Parcel
      </Button>
    </div>
  );
}

export default AnimatedCountyBoundaries;