import React from 'react';
import { DashboardChartCard } from './dashboard-chart-card';
import { ElevationChart } from '@/components/visualization/elevation-chart';

export interface ElevationDataPoint {
  x: number;
  y: number;
  elevation: number;
}

export interface TerrainVisualizationCardProps {
  /** Card title */
  title: string;
  /** Optional card description */
  description?: string;
  /** Array of elevation data points */
  elevationData: ElevationDataPoint[];
  /** Color gradient for visualization */
  colorGradient?: 'terrain' | 'primary' | 'rainbow' | 'heat';
  /** Optional height for the visualization */
  height?: number;
  /** Optional card variant */
  variant?: 'default' | 'glass' | 'gradient' | 'elevation';
  /** Optional className for additional styling */
  className?: string;
  /** Optional onClick handler */
  onClick?: () => void;
}

/**
 * TerrainVisualizationCard Component
 *
 * A specialized card for displaying 3D terrain visualizations
 */
export const TerrainVisualizationCard: React.FC<TerrainVisualizationCardProps> = ({
  title,
  description,
  elevationData,
  colorGradient = 'terrain',
  height = 300,
  variant = 'glass',
  className,
  onClick,
}) => {
  return (
    <DashboardChartCard
      title={title}
      description={description}
      variant={variant}
      className={className}
      onClick={onClick}
    >
      <div style={{ height: `${height}px` }} className="w-full">
        <ElevationChart
          data={elevationData}
          colorScheme={colorGradient}
          rotateEnabled={true}
          showTooltip={true}
          interactive={true}
        />
      </div>
    </DashboardChartCard>
  );
};
