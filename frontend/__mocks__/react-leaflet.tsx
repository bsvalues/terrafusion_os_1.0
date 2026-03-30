/**
 * react-leaflet mock for Vitest/JSDOM.
 *
 * Leaflet requires real DOM APIs (ResizeObserver, SVG, canvas) that JSDOM
 * doesn't provide. This mock returns minimal React components so tests that
 * render Leaflet-containing components don't blow up, while still letting
 * test assertions on data-testid attributes work correctly.
 */
import React from 'react';

export const MapContainer: React.FC<{
  center?: [number, number];
  zoom?: number;
  style?: React.CSSProperties;
  scrollWheelZoom?: boolean;
  children?: React.ReactNode;
  [key: string]: unknown;
}> = ({ children, style }) => (
  <div data-mock="leaflet-map-container" style={style}>{children}</div>
);

export const TileLayer: React.FC<{
  url?: string;
  attribution?: string;
  [key: string]: unknown;
}> = () => null;

export const CircleMarker: React.FC<{
  center?: [number, number];
  radius?: number;
  color?: string;
  [key: string]: unknown;
}> = () => null;
