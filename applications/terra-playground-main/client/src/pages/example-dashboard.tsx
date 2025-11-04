import React from 'react';
import { Helmet } from 'react-helmet';
import TFCard from '@/components/ui/terrafusion/tf-card';
import { TFStatCard } from '@/components/ui/terrafusion/tf-stat-card';
import TFButton from '@/components/ui/terrafusion/tf-button';
import { TFIconButton } from '@/components/ui/terrafusion/tf-icon-button';
import { DashboardChartCard, AIAnalysisCard } from '@/components/dashboard/dashboard-chart-card';
import { ElevationChart } from '@/components/visualization/elevation-chart';
import { TerrainVisualizationCard } from '@/components/dashboard/terrain-visualization-card';
import { MapIcon,
  PlusIcon,
  DownloadIcon,
  FilterIcon,
  RefreshIcon,
  LayoutDashboardIcon,
 } from '@mui/icons-material';

/**
 * Example Dashboard Page
 *
 * Demonstrates the Terrafusion UI components
 */
const ExampleDashboard: React.FC = () => {
  // Generate sample elevation data for charts
  const generateElevationData = (
    count: number,
    pattern: 'hills' | 'mountains' | 'random' = 'hills'
  ) => {
    const data = [];

    for (let i = 0; i < count; i++) {
      const x = i / (count - 1);
      const y = i / (count - 1);
      let elevation = 0;

      if (pattern === 'hills') {
        // Create gentle rolling hills pattern
        elevation = 100 + 50 * Math.sin(x * Math.PI * 2) + 30 * Math.cos(y * Math.PI * 3);
      } else if (pattern === 'mountains') {
        // Create sharp mountain peaks pattern
        elevation =
          100 + 200 * Math.pow(Math.sin(x * Math.PI), 2) * Math.pow(Math.cos(y * Math.PI * 2), 2);
      } else {
        // Random elevation
        elevation = 100 + Math.random() * 200;
      }

      data.push({ x, y, elevation });
    }

    return data;
  };

  const hillsData = generateElevationData(100, 'hills');
  const mountainsData = generateElevationData(100, 'mountains');
  const randomData = generateElevationData(100, 'random');

  return (
    <div className="container mx-auto p-4">
      <Helmet>
        <title>Terrafusion Dashboard Example</title>
      </Helmet>

      <div className="mb-6 flex items-center justify-between">
        <div>
<>
          <h1 className="text-2xl font-bold text-foreground">Property Assessment Dashboard</h1>
          <p
</> className="text-muted-foreground">GIS-powered property analysis tools</p>
        </div>

        <div className="flex items-center gap-2">
<>
          <TFButton variant="outline" iconLeft={<FilterIcon className="h-4 w-4" />}>
            Filters
          </TFButton>

          <TFButton
</> iconLeft={<PlusIcon className="h-4 w-4" />}>New Assessment</TFButton>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TFStatCard
          title="Properties Assessed"
          value={2847}
          trend="up"
          change={12.5}
          description="Total assessed properties"
          variant="primary"
          icon={<LayoutDashboardIcon className="h-4 w-4" />}
          format="number"
        />

        <TFStatCard
          title="Average Value"
          value={452000}
          trend="up"
          change={8.3}
          description="Mean property value"
          variant="secondary"
          format="currency"
        />

        <TFStatCard
          title="Assessment Completion"
          value={87.4}
          trend="up"
          change={5.2}
          description="Percentage complete"
          variant="success"
          format="percentage"
        />

        <TFStatCard
          title="Pending Reviews"
          value={124}
          trend="down"
          change={-15.7}
          description="Awaiting final review"
          variant="info"
          format="number"
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TerrainVisualizationCard
          title="Residential Elevation Profile"
          description="3D visualization of residential property elevations"
          elevationData={hillsData}
          colorGradient="terrain"
        />

        <TerrainVisualizationCard
          title="Commercial District Terrain"
          description="Business district topographical view"
          elevationData={mountainsData}
          colorGradient="primary"
        />
      </div>

      {/* Mixed Content Row */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <TerrainVisualizationCard
          title="Agricultural Land Profile"
          elevationData={randomData}
          colorGradient="rainbow"
          height={250}
        />

        <AIAnalysisCard title="Property Value Analysis" className="h-full">
<>
          <p className="text-sm text-gray-300">
            Property values in the north-west district show a consistent upward trend of 8.3% over
            the past quarter, with single-family homes appreciating faster than condominiums. Market
            liquidity remains high.
          </p>
          <div
</> className="mt-4 flex justify-between text-xs text-gray-400">
<>
            <span>Model: ValuePredictorLLM</span>
            <span
</>>Confidence: 92%</span>
          </div>
        </AIAnalysisCard>

        <AIAnalysisCard title="Development Opportunity Insights" className="h-full">
<>
          <p className="text-sm text-gray-300">
            Analysis of zoning regulations and market data indicates 3 high-potential areas for
            mixed-use development. Recommended parcels have favorable regulatory conditions and
            infrastructure access.
          </p>
          <div
</> className="mt-4 flex justify-between text-xs text-gray-400">
<>
            <span>Model: ZoningInsightLLM</span>
            <span
</>>Confidence: 78%</span>
          </div>
        </AIAnalysisCard>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardChartCard title="Property Types Distribution" variant="default">
          <div className="h-64 w-full p-4">
            <div className="text-center text-sm text-muted-foreground">
              Pie chart would display here
            </div>
          </div>
        </DashboardChartCard>

        <DashboardChartCard title="Assessment Timeline" variant="glass">
          <div className="h-64 w-full p-4">
            <div className="text-center text-sm text-muted-foreground">
              Timeline chart would display here
            </div>
          </div>
        </DashboardChartCard>

        <DashboardChartCard title="Property Value Trends" variant="gradient">
          <div className="h-64 w-full p-4">
            <div className="text-center text-sm text-muted-foreground">
              Line chart would display here
            </div>
          </div>
        </DashboardChartCard>
      </div>
    </div>
  );
};

export default ExampleDashboard;
