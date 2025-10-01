// Global type declarations for Terrafusion OS

import * as React from 'react';

declare global {
  namespace React {
    // Extend ReactNode to include bigint compatibility
    type ReactNode =
      | React.ReactElement
      | string
      | number
      | React.ReactFragment
      | React.ReactPortal
      | boolean
      | null
      | undefined;
  }

  interface Window {
    electronAPI?: {
      getOSConnectionState: () => Promise<any>;
      onOSConnectionState: (_callback: (_state: any) => void) => () => void;
      getCountyConfig: () => Promise<any>;
      invokePlugin: (_moduleName: string, _method: string, _payload: any) => Promise<any>;
      emitPlugin: (_moduleName: string, _event: string, _data: any) => void;
      getSystemMetrics: () => Promise<any>;
    };
    gtag?: (_command: string, _targetId: string, _config?: any) => void;
  }

  // Extend ServiceWorkerRegistration for background sync
  interface ServiceWorkerRegistration {
    sync?: {
      register: (_tag: string) => Promise<void>;
    };
  }

  // Extend PerformanceEntry for FID and CLS metrics
  interface PerformanceEntry {
    processingStart?: number;
    hadRecentInput?: boolean;
    value?: number;
  }

  // Extend RequestInit for custom fetch options
  interface RequestInit {
    timeout?: number;
    compress?: boolean;
  }
}

// Type definitions for species detection
export type SpeciesType = 'carbon' | 'silicon' | 'quantum' | 'hybrid';

// Module declaration for missing packages
declare module '@tanstack/react-query' {
  export function useQuery(_options: any): any;
}

declare module 'chart.js/auto' {
  export const Chart: any;
}

declare module 'leaflet' {
  export const Map: any;
}

// Component type compatibility fixes
declare module 'lucide-react' {
  export const Warning: React.ComponentType<any>;
  export const Refresh: React.ComponentType<any>;
  export const Home: React.ComponentType<any>;
  export const BugReport: React.ComponentType<any>;
  export const ArrowLeft: React.ComponentType<any>;
  export const Settings: React.ComponentType<any>;
  export const Star: React.ComponentType<any>;
  export const Package: React.ComponentType<any>;
  export const Download: React.ComponentType<any>;
  export const Search: React.ComponentType<any>;
  export const Grid: React.ComponentType<any>;
  export const List: React.ComponentType<any>;
}

declare module 'recharts' {
  export const ResponsiveContainer: React.ComponentType<any>;
  export const LineChart: React.ComponentType<any>;
  export const PieChart: React.ComponentType<any>;
  export const RadarChart: React.ComponentType<any>;
  export const XAxis: React.ComponentType<any>;
  export const YAxis: React.ComponentType<any>;
  export const Tooltip: React.ComponentType<any>;
  export const Legend: React.ComponentType<any>;
  export const Line: React.ComponentType<any>;
  export const Pie: React.ComponentType<any>;
  export const Radar: React.ComponentType<any>;
  export const PolarAngleAxis: React.ComponentType<any>;
  export const PolarRadiusAxis: React.ComponentType<any>;
  export const Cell: React.ComponentType<any>;
}

declare module 'react-router-dom' {
  export const Routes: React.ComponentType<any>;
  export const Route: React.ComponentType<any>;
}

declare module 'react-rnd' {
  import React from 'react';

  export interface RndProps {
    size?: { width: number | string; height: number | string };
    position?: { x: number; y: number };
    onDragStop?: (_e: any, _d: any) => void;
    onResizeStop?: (_e: any, _direction: any, _ref: any, _delta: any, _position: any) => void;
    children?: React.ReactNode;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    bounds?: string;
    disableDragging?: boolean;
    enableResizing?: any;
    resizeHandleStyles?: any;
    style?: React.CSSProperties;
    className?: string;
    [key: string]: any;
  }

  export const Rnd: React.ComponentClass<RndProps>;
  export default Rnd;
}

declare module '@radix-ui/react-slot' {
  import { ComponentType } from 'react';
  export const Slot: ComponentType<any>;
}

export {};
