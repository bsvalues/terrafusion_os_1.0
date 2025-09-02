import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-measure';
import 'leaflet-measure/dist/leaflet-measure.css';

// Add the necessary type declarations for the Leaflet Measure plugin
declare module 'leaflet' {
  namespace Control {
    class Measure extends L.Control {
      constructor(options: MeasureOptions);
      enable(): void;
      disable(): void;
    }
  }
  
  interface MeasureOptions {
    position?: L.ControlPosition;
    primaryLengthUnit?: 'feet' | 'meters' | 'miles' | 'kilometers';
    secondaryLengthUnit?: 'feet' | 'meters' | 'miles' | 'kilometers' | null;
    primaryAreaUnit?: 'acres' | 'hectares' | 'sqfeet' | 'sqmeters' | 'sqmiles' | 'sqkilometers';
    secondaryAreaUnit?: 'acres' | 'hectares' | 'sqfeet' | 'sqmeters' | 'sqmiles' | 'sqkilometers' | null;
    activeColor?: string;
    completedColor?: string;
    popupOptions?: L.PopupOptions;
    captureZIndex?: number;
    snappable?: boolean;
    units?: {
      kilometers: {
        factor: number;
        display: string;
        decimals: number;
      };
      [key: string]: {
        factor: number;
        display: string;
        decimals: number;
      };
    };
  }
}

interface MeasurementControlProps {
  measureType: 'distance' | 'area' | null;
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
}

export function MeasurementControl({ 
  measureType, 
  position = 'bottomright' 
}: MeasurementControlProps) {
  const map = useMap();
  const measureControlRef = useRef<L.Control.Measure | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);

  useEffect(() => {
    if (!map) return;

    // Create the measurement control
    const measureControl = new L.Control.Measure({
      position: position as L.ControlPosition,
      primaryLengthUnit: 'feet',
      secondaryLengthUnit: 'miles',
      primaryAreaUnit: 'acres',
      secondaryAreaUnit: 'sqmiles',
      activeColor: '#3388ff',
      completedColor: '#4C516D',
      snappable: true,
      captureZIndex: 10000,
    });

    // Add the control to the map but don't automatically activate it
    map.addControl(measureControl);
    measureControlRef.current = measureControl;

    // Handle cleanup
    return () => {
      if (measureControlRef.current) {
        try {
          measureControlRef.current.disable();
          map.removeControl(measureControlRef.current);
        } catch (e) {
          console.error('Error removing measure control:', e);
        }
      }
    };
  }, [map, position]);

  // Handle measurement tool activation/deactivation
  useEffect(() => {
    if (!measureControlRef.current) return;

    try {
      if (measureType === 'distance' || measureType === 'area') {
        if (!isMeasuring) {
          measureControlRef.current.enable();
          setIsMeasuring(true);
        }
      } else if (isMeasuring) {
        measureControlRef.current.disable();
        setIsMeasuring(false);
      }
    } catch (e) {
      console.error('Error toggling measure control:', e);
    }
  }, [measureType, isMeasuring]);

  return null; // This component doesn't render anything directly
}