import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Elevation data point interface
 */
export interface ElevationDataPoint {
  x: number;
  y: number;
  elevation: number;
}

/**
 * ElevationChart Props Interface
 */
export interface ElevationChartProps {
  /** The data to visualize */
  data: ElevationDataPoint[];
  /** Height of the chart in pixels */
  height?: number;
  /** Width of the chart in pixels (if not specified, container width is used) */
  width?: number;
  /** Color scheme for the elevation gradient */
  colorScheme?: 'terrain' | 'primary' | 'rainbow' | 'heat';
  /** Whether to animate the chart */
  animated?: boolean;
  /** Whether rotation is enabled */
  rotateEnabled?: boolean;
  /** Whether to show tooltip on hover */
  showTooltip?: boolean;
  /** Whether the chart is interactive */
  interactive?: boolean;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Elevation Chart Component
 *
 * A 3D visualization component for elevation data
 */
export const ElevationChart: React.FC<ElevationChartProps> = ({
  data,
  height = 300,
  width,
  colorScheme = 'terrain',
  animated = true,
  rotateEnabled = true,
  showTooltip = false,
  interactive = false,
  className,
}) => {
  // Map color scheme to actual colors
  const colorScale = React.useMemo(() => {
    switch (colorScheme) {
      case 'terrain':
        return ['#134e4a', '#14b8a6', '#5eead4'];
      case 'primary':
        return ['#1e40af', '#3b82f6', '#93c5fd'];
      case 'rainbow':
        return ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
      case 'heat':
        return ['#991b1b', '#dc2626', '#f59e0b', '#fbbf24'];
      default:
        return ['#134e4a', '#14b8a6', '#5eead4'];
    }
  }, [colorScheme]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Find min/max values for normalization
  const { minElevation, maxElevation } = React.useMemo(() => {
    if (!data || data.length === 0) {
      return { minElevation: 0, maxElevation: 100 };
    }

    let min = data[0].elevation;
    let max = data[0].elevation;

    for (const point of data) {
      if (point.elevation < min) min = point.elevation;
      if (point.elevation > max) max = point.elevation;
    }

    return { minElevation: min, maxElevation: max };
  }, [data]);

  // Normalize elevation to 0-1 scale
  const normalizeElevation = (elevation: number) => {
    if (maxElevation === minElevation) return 0.5;
    return (elevation - minElevation) / (maxElevation - minElevation);
  };

  // Get color based on elevation using the color scale
  const getColorForElevation = (normalizedElevation: number) => {
    if (colorScale.length === 1) return colorScale[0];

    const index = normalizedElevation * (colorScale.length - 1);
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);

    // If we're at an exact color, just return it
    if (lowerIndex === upperIndex) return colorScale[lowerIndex];

    // Otherwise interpolate between the two colors
    const lowerColor = hexToRgb(colorScale[lowerIndex]);
    const upperColor = hexToRgb(colorScale[upperIndex]);
    const weight = index - lowerIndex;

    const r = Math.round(lowerColor.r * (1 - weight) + upperColor.r * weight);
    const g = Math.round(lowerColor.g * (1 - weight) + upperColor.g * weight);
    const b = Math.round(lowerColor.b * (1 - weight) + upperColor.b * weight);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  // Animation logic
  useEffect(() => {
    if (animated && rotateEnabled && !isHovering) {
      const interval = setInterval(() => {
        setRotation(prev => (prev + 0.5) % 360);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [animated, rotateEnabled, isHovering]);

  // Rendering logic
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = width || containerRef.current?.offsetWidth || 300;
    canvas.width = canvasWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, height);

    // Calculate center point for rotation
    const centerX = canvasWidth / 2;
    const centerY = height / 2;

    // Sort data points by distance from viewpoint for proper rendering (painter's algorithm)
    const sortedPoints = [...data].sort((a, b) => {
      const rotationRad = (rotation * Math.PI) / 180;

      // Transform coordinates based on rotation
      const aRotatedX = Math.cos(rotationRad) * a.x - Math.sin(rotationRad) * a.y;
      const bRotatedX = Math.cos(rotationRad) * b.x - Math.sin(rotationRad) * b.y;

      // Sort back-to-front
      return aRotatedX - bRotatedX;
    });

    // Find x, y min/max for normalization
    let xMin = Infinity,
      xMax = -Infinity,
      yMin = Infinity,
      yMax = -Infinity;
    for (const point of data) {
      if (point.x < xMin) xMin = point.x;
      if (point.x > xMax) xMax = point.x;
      if (point.y < yMin) yMin = point.y;
      if (point.y > yMax) yMax = point.y;
    }

    // Normalize coordinates to canvas size with margins
    const margin = 40;
    const normalizeX = (x: number) =>
      margin + ((x - xMin) / (xMax - xMin)) * (canvasWidth - 2 * margin);
    const normalizeY = (y: number) => margin + ((y - yMin) / (yMax - yMin)) * (height - 2 * margin);

    // Convert rotation to radians
    const rotationRad = (rotation * Math.PI) / 180;

    // Draw each point
    for (const point of sortedPoints) {
      const normalizedElevation = normalizeElevation(point.elevation);
      const color = getColorForElevation(normalizedElevation);

      // Original normalized coordinates
      const x = normalizeX(point.x);
      const y = normalizeY(point.y);

      // Apply 3D rotation around Y axis
      const rotatedX =
        centerX + (x - centerX) * Math.cos(rotationRad) - (y - centerY) * Math.sin(rotationRad);
      const rotatedY =
        centerY + (x - centerX) * Math.sin(rotationRad) + (y - centerY) * Math.cos(rotationRad);

      // Apply elevation (z-axis) with perspective
      const elevationOffset = normalizedElevation * 50;
      const perspectiveY = rotatedY - elevationOffset;

      // Draw a 3D point (small rectangle with shading)
      const pointSize = 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.rect(rotatedX - pointSize / 2, perspectiveY - pointSize / 2, pointSize, pointSize);
      ctx.fill();

      // Optional: Add shading based on elevation for 3D effect
      const shadowOpacity = 0.3 + normalizedElevation * 0.7;
      ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
      ctx.beginPath();
      ctx.rect(
        rotatedX - pointSize / 2,
        perspectiveY + pointSize / 2,
        pointSize,
        normalizedElevation * 20
      );
      ctx.fill();
    }

    // Draw terrain scale legend
    drawScaleLegend(ctx, canvasWidth, height);
  }, [data, width, height, colorScale, rotation, minElevation, maxElevation]);

  // Draw scale legend
  const drawScaleLegend = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const legendWidth = 15;
    const legendHeight = 100;
    const legendX = canvasWidth - legendWidth - 10;
    const legendY = canvasHeight - legendHeight - 10;

    // Draw gradient
    const gradient = ctx.createLinearGradient(0, legendY, 0, legendY + legendHeight);
    colorScale.forEach((color: string /* , index */: number) => {
      gradient.addColorStop(1 - index / (colorScale.length - 1), color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    // Draw min/max labels
    ctx.fillStyle = 'white';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(maxElevation)}`, legendX - 5, legendY + 10);
    ctx.fillText(`${Math.round(minElevation)}`, legendX - 5, legendY + legendHeight - 5);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-lg',
        'bg-slate-900/60 transition-opacity duration-300',
        className
      )}
      style={{ width: width ? `${width}px` : '100%', height: `${height}px` }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <canvas ref={canvasRef} className="block" />

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 text-xs text-white/60">
        <span>3D Terrain Visualization</span>
      </div>
    </div>
  );
};

export default ElevationChart;
