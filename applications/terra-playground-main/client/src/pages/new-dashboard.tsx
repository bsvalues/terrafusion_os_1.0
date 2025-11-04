import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

// Design system components
import { Container } from '@/components/design-system/layout/Container';
import { Grid } from '@/components/design-system/layout/Grid';
import { Section } from '@/components/design-system/layout/Section';
import { Metric } from '@/components/design-system/data-display/Metric';
import { DataCard } from '@/components/design-system/data-display/DataCard';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/design-system/data-display/Table';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/design-system/navigation/Tabs';

// Icons
import { Building,
  FileSpreadsheet,
  MapPin,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  Calendar,
  Users,
  MapPinned,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart,
  Download,
 } from '@mui/icons-material';

// Service imports for real data
import { getPropertyStatistics } from '@/services/property-service';
import { getAssessmentMetrics } from '@/services/assessment-service';
import { getRecentPropertyChanges } from '@/services/change-tracking-service';

const NewDashboard: React.FC = () => {
  // State for dashboard data
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // Fetch real property statistics data
  const propertyStatsQuery = useQuery({
    queryKey: ['/api/property-statistics', timeRange],
    queryFn: () => getPropertyStatistics(timeRange),
  });

  // Fetch real assessment metrics
  const assessmentMetricsQuery = useQuery({
    queryKey: ['/api/assessment-metrics', timeRange],
    queryFn: () => getAssessmentMetrics(timeRange),
  });

  // Fetch real recent changes
  const recentChangesQuery = useQuery({
    queryKey: ['/api/property-changes/recent'],
    queryFn: () => getRecentPropertyChanges(10), // Fetch 10 most recent changes
  });

  return (
    <Container size="xl" className="py-6">
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex flex-col gap-2">
<>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p
</> className="text-muted-foreground">
            Overview of assessment activities and property data
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex justify-end mb-4">
          <Tabs
            value={timeRange}
            onValueChange={value => setTimeRange(value as any)}
            variant="pills"
          >
            <TabsList>
              <TabsTrigger value="day">
<>
                <Calendar className="h-4 w-4 mr-2" />
                Today
              </TabsTrigger>
              <TabsTrigger
</> value="week">
<>
                <Calendar className="h-4 w-4 mr-2" />
                Week
              </TabsTrigger>
              <TabsTrigger
</> value="month">
<>
                <Calendar className="h-4 w-4 mr-2" />
                Month
              </TabsTrigger>
              <TabsTrigger
</> value="year">
                <Calendar className="h-4 w-4 mr-2" />
                Year
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Key metrics */}
        <Section title="Key Metrics" description="Overview of property assessment statistics">
          <Grid cols={4} colsMd={2} colsSm={1} gap={4}>
            {/* Total Properties Metric */}
            <Metric
              label="Total Properties"
              value={propertyStatsQuery.data?.totalProperties || 0}
              valueFormatter={val => Number(val).toLocaleString()}
              delta={propertyStatsQuery.data?.propertyDelta}
              icon={<Building className="h-5 w-5" />}
              variant="stacked"
              isLoading={propertyStatsQuery.isLoading}
            />

            {/* Assessed Value Metric */}
            <Metric
              label="Total Assessed Value"
              value={propertyStatsQuery.data?.totalAssessedValue || 0}
              valueFormatter={val => `$${Number(val).toLocaleString()}`}
              delta={propertyStatsQuery.data?.valueDelta}
              icon={<FileSpreadsheet className="h-5 w-5" />}
              variant="stacked"
              isLoading={propertyStatsQuery.isLoading}
            />

            {/* Median Value Metric */}
            <Metric
              label="Median Property Value"
              value={propertyStatsQuery.data?.medianValue || 0}
              valueFormatter={val => `$${Number(val).toLocaleString()}`}
              delta={propertyStatsQuery.data?.medianDelta}
              icon={<TrendingUp className="h-5 w-5" />}
              variant="stacked"
              isLoading={propertyStatsQuery.isLoading}
            />

            {/* Property Changes Metric */}
            <Metric
              label="Property Changes"
              value={propertyStatsQuery.data?.changesCount || 0}
              valueFormatter={val => Number(val).toLocaleString()}
              delta={propertyStatsQuery.data?.changesDelta}
              icon={<MapPin className="h-5 w-5" />}
              variant="stacked"
              isLoading={propertyStatsQuery.isLoading}
            />
          </Grid>
        </Section>

        {/* Data visualizations */}
        <Section
          title="Data Analytics"
          description="Property assessment visualizations and analytics"
        >
          <Grid cols={2} colsSm={1} gap={4}>
            {/* Assessment Value Trends */}
            <DataCard
              title="Assessment Value Trends"
              description={`Property value changes over ${timeRange}`}
              variant="glass"
              elevation="medium"
              padding="md"
              isLoading={assessmentMetricsQuery.isLoading}
              error={assessmentMetricsQuery.isError ? 'Failed to load assessment data' : undefined}
              chart={
                <div className="h-[300px] flex items-center justify-center">
                  {assessmentMetricsQuery.data?.valueTrend ? (
                    <LineChart className="h-full w-full text-primary opacity-80" />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      Value trend visualization will appear here
                    </div>
                  )}
                </div>
              }
              actions={
                <button className="p-2 text-muted-foreground hover:text-foreground rounded-full">
                  <Download className="h-4 w-4" />
                </button>
              }
            />

            {/* Property Distribution */}
            <DataCard
              title="Property Type Distribution"
              description="Breakdown by property classification"
              variant="glass"
              elevation="medium"
              padding="md"
              isLoading={propertyStatsQuery.isLoading}
              error={propertyStatsQuery.isError ? 'Failed to load property data' : undefined}
              chart={
                <div className="h-[300px] flex items-center justify-center">
                  {propertyStatsQuery.data?.typeDistribution ? (
                    <PieChart className="h-full w-full text-primary opacity-80" />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      Property type distribution will appear here
                    </div>
                  )}
                </div>
              }
              actions={
                <button className="p-2 text-muted-foreground hover:text-foreground rounded-full">
                  <Download className="h-4 w-4" />
                </button>
              }
            />
          </Grid>
        </Section>

        {/* Recent Activity */}
        <Section title="Recent Activity" description="Latest property assessment changes">
          <DataCard
            variant="default"
            elevation="low"
            padding="md"
            isLoading={recentChangesQuery.isLoading}
            error={recentChangesQuery.isError ? 'Failed to load recent changes' : undefined}
          >
            <Table>
              <TableHeader>
                <TableRow>
<>
                  <TableHead>Property ID</TableHead>
                  <TableHead
</>>Address</TableHead>
<>
                  <TableHead>Change Type</TableHead>
                  <TableHead
</>>Previous Value</TableHead>
<>
                  <TableHead>New Value</TableHead>
                  <TableHead
</>>Change Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentChangesQuery.data?.map(change => (
                  <TableRow key={change.id}>
<>
                    <TableCell>{change.propertyId}</TableCell>
                    <TableCell
</>>{change.address}</TableCell>
<>
                    <TableCell>{change.changeType}</TableCell>
                    <TableCell
</>>
                      {typeof change.oldValue === 'number'
                        ? `$${Number(change.oldValue).toLocaleString()}`
                        : change.oldValue}
                    </TableCell>
<>
                    <TableCell>
                      {typeof change.newValue === 'number'
                        ? `$${Number(change.newValue).toLocaleString()}`
                        : change.newValue}
                    </TableCell>
                    <TableCell
</>>{new Date(change.timestamp).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}

                {/* Show a message if no data */}
                {recentChangesQuery.data && recentChangesQuery.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No recent changes found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DataCard>
        </Section>

        {/* Alert Cards */}
        <Section title="Alerts & Notifications" description="Important updates requiring attention">
          <Grid cols={3} colsMd={2} colsSm={1} gap={4}>
            <DataCard
              title="Data Synchronization"
              description="Last sync: 2 hours ago"
              variant="outline"
              padding="md"
              size="sm"
              chart={
                <div className="px-4 py-6 flex flex-col items-center text-center">
                  <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3 text-emerald-600 dark:text-emerald-400 mb-3">
<>
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <p
</> className="text-sm text-muted-foreground">
                    All systems are synchronized and up-to-date
                  </p>
                </div>
              }
            />

            <DataCard
              title="Field Validation Errors"
              description="3 properties need attention"
              variant="outline"
              padding="md"
              size="sm"
              chart={
                <div className="px-4 py-6 flex flex-col items-center text-center">
                  <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-3 text-amber-600 dark:text-amber-400 mb-3">
<>
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <p
</> className="text-sm text-muted-foreground">
                    Field validation errors detected in 3 properties
                  </p>
                </div>
              }
              linkUrl="/data-validation"
            />

            <DataCard
              title="Pending Approvals"
              description="8 items awaiting review"
              variant="outline"
              padding="md"
              size="sm"
              chart={
                <div className="px-4 py-6 flex flex-col items-center text-center">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 text-blue-600 dark:text-blue-400 mb-3">
<>
                    <Users className="h-6 w-6" />
                  </div>
                  <p
</> className="text-sm text-muted-foreground">
                    8 assessments are awaiting your approval
                  </p>
                </div>
              }
              linkUrl="/approvals"
            />
          </Grid>
        </Section>
      </div>
    </Container>
  );
};

export default NewDashboard;
