import React from 'react';
import AppLayout from '@/layout/app-layout';
import {
  DashboardLayout,
  DashboardItem,
  DashboardHeader,
  DashboardSection,
} from '@/components/dashboard/dashboard-layout';
import { DashboardChartCard, AIAnalysisCard } from '@/components/dashboard/dashboard-chart-card';
import { TerrainVisualizationCard } from '@/components/dashboard/terrain-visualization-card';
import TFButton from '@/components/ui/terrafusion/tf-button';
import { TFIconButton } from '@/components/ui/terrafusion/tf-icon-button';
import TFCard from '@/components/ui/terrafusion/tf-card';
import { TFStatCard } from '@/components/ui/terrafusion/tf-stat-card';
import { ElevationChart } from '@/components/visualization/elevation-chart';

// Mock data for the dashboard
const propertyStats = [
  { label: 'Inspections', value: 72120, trend: { value: 5.2, direction: 'up' as const } },
  { label: 'Properties', value: 48639, trend: { value: 1.8, direction: 'up' as const } },
  { label: 'Appeals', value: 128, trend: { value: 12.3, direction: 'down' as const } },
  { label: 'Assessment Ratio', value: '98.2%', trend: { value: 0.8, direction: 'up' as const } },
];

const Dashboard: React.FC = () => {
  return (
    <AppLayout>
      <DashboardHeader
        title="Terrafusion Dashboard"
        description="Property assessment analytics and insights"
        actions={
          <>
            <TFButton
              variant="outline"
              iconLeft={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                  />
                </svg>
              }
            >
              Export Data
            </TFButton>
            <TFButton
              variant="primary"
              iconLeft={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              }
            >
              New Assessment
            </TFButton>
          </>
        }
      />

      <DashboardLayout>
        {/* Stats row */}
        {propertyStats.map((stat /* , index */) => (
          <DashboardItem key={index}>
            <TFStatCard label={stat.label} value={stat.value} trend={stat.trend} />
          </DashboardItem>
        ))}

        {/* Main charts */}
        <DashboardItem colSpan={2} rowSpan={2}>
          <TerrainVisualizationCard
            title="Property Valuation by Region"
            description="Geospatial visualization of property value distribution"
            chart={
              <div className="w-full h-full bg-card rounded-xl relative overflow-hidden">
                {/* Mock GIS visualization */}
<>
                <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-primary via-purple-500 to-pink-500"></div>
                <div
</> className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  Interactive GIS Map Rendered Here
                </div>
              </div>
            }
            actions={
              <TFIconButton
                variant="ghost"
                size="sm"
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                }
              />
            }
          />
        </DashboardItem>

        <DashboardItem>
          <DashboardChartCard
            title="Assessment Trends"
            description="Monthly assessment activity"
            chart={
              <div className="w-full h-32 flex items-end justify-between space-x-1">
                {/* Mock bar chart */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const height = 30 + Math.random() * 70;
                  return (
                    <div
                      key={i}
                      className="bg-gradient-to-t from-primary/80 to-primary rounded-t-sm"
                      style={{ height: `${height}%`, width: '8%' }}
                    />
                  );
                })}
              </div>
            }
          />
        </DashboardItem>

        <DashboardItem>
          <AIAnalysisCard
            title="AI Property Analysis"
            description="Insights from comparative market analysis"
            chart={
              <div className="w-full space-y-3">
                <div className="p-3 bg-foreground/5 rounded-lg">
                  <p className="text-sm">
                    Properties in North District show 12% value increase due to new transportation
                    infrastructure development.
                  </p>
                </div>
                <div className="p-3 bg-foreground/5 rounded-lg">
                  <p className="text-sm">
                    Detected 8 potential assessment anomalies requiring review in the Southwest
                    region.
                  </p>
                </div>
              </div>
            }
          />
        </DashboardItem>

        <DashboardSection
          title="Terrain Analysis"
          description="Elevation models of assessed regions"
        />

        <DashboardItem>
<>
          <DashboardChartCard
            title="Downtown District"
            chart={<ElevationChart height={140} color="rgba(6, 182, 212, 1)" />}
            variant="gradient"
          />
        </DashboardItem>

        <DashboardItem
</>>
<>
          <DashboardChartCard
            title="Waterfront Region"
            chart={<ElevationChart height={140} color="rgba(124, 58, 237, 1)" />}
            variant="gradient"
          />
        </DashboardItem>

        <DashboardItem
</>>
<>
          <DashboardChartCard
            title="North Hills"
            chart={<ElevationChart height={140} color="rgba(236, 72, 153, 1)" />}
            variant="gradient"
          />
        </DashboardItem>

        <DashboardItem
</> colSpan={3}>
          <DashboardChartCard
            title="Recent Activities"
            variant="default"
            chart={
              <div className="w-full divide-y divide-border/20">
                {[
                  {
                    activity: 'Property BC101 assessment completed',
                    time: '2 hours ago',
                    user: 'John Davis',
                  },
                  {
                    activity: 'New appeal filed for Property BC405',
                    time: '4 hours ago',
                    user: 'System',
                  },
                  {
                    activity: 'Mass appraisal batch #24 completed',
                    time: 'Yesterday',
                    user: 'AI Agent',
                  },
                  {
                    activity: 'GIS data updated for Downtown district',
                    time: 'Yesterday',
                    user: 'Maria Smith',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div>
<>
                      <p className="font-medium text-sm">{item.activity}</p>
                      <p
</> className="text-xs text-muted-foreground">
                        {item.time} by {item.user}
                      </p>
                    </div>
                    <TFButton variant="ghost" size="sm">
                      View
                    </TFButton>
                  </div>
                ))}
              </div>
            }
          />
        </DashboardItem>
      </DashboardLayout>
    </AppLayout>
  );
};

export default Dashboard;
