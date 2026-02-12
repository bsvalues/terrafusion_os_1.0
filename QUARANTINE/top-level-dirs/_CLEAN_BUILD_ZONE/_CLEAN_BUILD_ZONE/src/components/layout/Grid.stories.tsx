/**
 * Grid Component Stories - TerraFusion Design System
 * Week 2, Day 1 - Layout Components Phase
 * 
 * Purpose: Comprehensive documentation and testing of Grid component
 * - Column-based layouts
 * - Responsive patterns
 * - Gap utilities
 * - Grid item spanning
 * - Auto-fit patterns
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Grid, GridItem } from '../layout/grid';

const meta = {
  title: 'Design System/Layout/Grid',
  component: Grid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Grid Component

A flexible CSS Grid wrapper for creating responsive grid layouts with powerful features.

## Features
- ✅ 1-12 column grid system
- ✅ Responsive column counts (breakpoint-specific)
- ✅ Gap utilities (none, xs, sm, md, lg, xl)
- ✅ GridItem for spanning multiple columns/rows
- ✅ Auto-fit for dynamic column sizing
- ✅ Alignment and justification controls
- ✅ Full TypeScript support

## Usage
\`\`\`tsx
import { Grid, GridItem } from '@/components/layout/grid';

// Basic 3-column grid
<Grid cols={3} gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>

// Responsive grid (1 col mobile, 2 tablet, 3 desktop)
<Grid cols={{ base: 1, md: 2, lg: 3 }} gap="lg">
  <Card>Content</Card>
  <Card>Content</Card>
  <Card>Content</Card>
</Grid>

// Auto-fit responsive columns
<Grid autoFit minColWidth="300px" gap="md">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</Grid>

// Spanning columns
<Grid cols={4} gap="md">
  <GridItem colSpan={2}>Wide item</GridItem>
  <GridItem colSpan={1}>Normal</GridItem>
  <GridItem colSpan={1}>Normal</GridItem>
</Grid>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    cols: {
      control: 'number',
      description: 'Number of columns (1-12) or responsive object',
    },
    gap: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Gap between grid items',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch'],
      description: 'Vertical alignment of items',
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch', 'between'],
      description: 'Horizontal justification of items',
    },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Basic Grid Layouts
 * Common column counts (2, 3, 4, 6 columns)
 */
export const BasicGridLayouts: Story = {
  render: () => (
    <div className="space-y-8">
      {/* 2 Columns */}
      <div>
        <h3 className="text-lg font-bold mb-4">2 Columns</h3>
        <Grid cols={2} gap="md">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-primary text-primary-foreground rounded-lg p-6 text-center font-medium">
              Item {i}
            </div>
          ))}
        </Grid>
      </div>

      {/* 3 Columns */}
      <div>
        <h3 className="text-lg font-bold mb-4">3 Columns</h3>
        <Grid cols={3} gap="md">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-secondary text-secondary-foreground rounded-lg p-6 text-center font-medium">
              Item {i}
            </div>
          ))}
        </Grid>
      </div>

      {/* 4 Columns */}
      <div>
        <h3 className="text-lg font-bold mb-4">4 Columns</h3>
        <Grid cols={4} gap="md">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-accent text-accent-foreground rounded-lg p-6 text-center font-medium">
              Item {i}
            </div>
          ))}
        </Grid>
      </div>

      {/* 6 Columns */}
      <div>
        <h3 className="text-lg font-bold mb-4">6 Columns (Fine Grid)</h3>
        <Grid cols={6} gap="sm">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="bg-muted text-muted-foreground rounded-lg p-4 text-center text-sm font-medium">
              {i}
            </div>
          ))}
        </Grid>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common grid layouts with 2, 3, 4, and 6 columns.',
      },
    },
  },
};

/**
 * Story 2: Column Spans
 * Using GridItem to span multiple columns
 */
export const ColumnSpans: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Simple spanning */}
      <div>
        <h3 className="text-lg font-bold mb-4">Basic Column Spanning (4-column grid)</h3>
        <Grid cols={4} gap="md">
          <GridItem colSpan={4} className="bg-primary text-primary-foreground rounded-lg p-6 text-center font-medium">
            Full Width (colSpan=4)
          </GridItem>
          <GridItem colSpan={2} className="bg-secondary text-secondary-foreground rounded-lg p-6 text-center font-medium">
            Half Width (colSpan=2)
          </GridItem>
          <GridItem colSpan={2} className="bg-secondary text-secondary-foreground rounded-lg p-6 text-center font-medium">
            Half Width (colSpan=2)
          </GridItem>
          <GridItem colSpan={1} className="bg-accent text-accent-foreground rounded-lg p-6 text-center font-medium">
            1
          </GridItem>
          <GridItem colSpan={3} className="bg-muted text-muted-foreground rounded-lg p-6 text-center font-medium">
            Three Quarters (colSpan=3)
          </GridItem>
        </Grid>
      </div>

      {/* Dashboard layout */}
      <div>
        <h3 className="text-lg font-bold mb-4">Dashboard Layout (12-column grid)</h3>
        <Grid cols={12} gap="md">
          <GridItem colSpan={12} className="bg-primary text-primary-foreground rounded-lg p-6">
            <h4 className="font-bold">Header (12 columns)</h4>
            <p className="text-sm opacity-80">Full-width header section</p>
          </GridItem>
          <GridItem colSpan={3} className="bg-secondary text-secondary-foreground rounded-lg p-6">
            <h4 className="font-bold mb-2">Sidebar</h4>
            <p className="text-sm">3 columns</p>
          </GridItem>
          <GridItem colSpan={9} className="bg-muted text-muted-foreground rounded-lg p-6">
            <h4 className="font-bold mb-2">Main Content</h4>
            <p className="text-sm">9 columns - Primary content area</p>
          </GridItem>
          <GridItem colSpan={4} className="bg-accent text-accent-foreground rounded-lg p-6">
            <h4 className="font-bold mb-2">Card 1</h4>
            <p className="text-sm">4 columns</p>
          </GridItem>
          <GridItem colSpan={4} className="bg-accent text-accent-foreground rounded-lg p-6">
            <h4 className="font-bold mb-2">Card 2</h4>
            <p className="text-sm">4 columns</p>
          </GridItem>
          <GridItem colSpan={4} className="bg-accent text-accent-foreground rounded-lg p-6">
            <h4 className="font-bold mb-2">Card 3</h4>
            <p className="text-sm">4 columns</p>
          </GridItem>
        </Grid>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use GridItem with colSpan to create asymmetric layouts.',
      },
    },
  },
};

/**
 * Story 3: Gap Utilities
 * Different spacing options between grid items
 */
export const GapUtilities: Story = {
  render: () => (
    <div className="space-y-8">
      {(['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const).map((gap) => (
        <div key={gap}>
          <h3 className="text-lg font-bold mb-4">Gap: {gap}</h3>
          <Grid cols={4} gap={gap}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-primary text-primary-foreground rounded-lg p-6 text-center font-medium">
                {i}
              </div>
            ))}
          </Grid>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All gap size options from none to xl.',
      },
    },
  },
};

/**
 * Story 4: Responsive Columns
 * Grid adapts to different screen sizes
 */
export const ResponsiveColumns: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Responsive 1-2-3 pattern */}
      <div>
        <h3 className="text-lg font-bold mb-4">Responsive: 1 → 2 → 3 Columns</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Mobile: 1 col | Tablet (md): 2 cols | Desktop (lg): 3 cols
        </p>
        <Grid cols={{ base: 1, md: 2, lg: 3 }} gap="md">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-primary text-primary-foreground rounded-lg p-6 text-center font-medium">
              Card {i}
            </div>
          ))}
        </Grid>
      </div>

      {/* Responsive 2-3-4 pattern */}
      <div>
        <h3 className="text-lg font-bold mb-4">Responsive: 2 → 3 → 4 Columns</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Mobile: 2 cols | Tablet (md): 3 cols | Desktop (lg): 4 cols
        </p>
        <Grid cols={{ base: 2, md: 3, lg: 4 }} gap="md">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-secondary text-secondary-foreground rounded-lg p-6 text-center font-medium">
              Item {i}
            </div>
          ))}
        </Grid>
      </div>

      {/* Responsive 1-2-4 pattern */}
      <div>
        <h3 className="text-lg font-bold mb-4">Responsive: 1 → 2 → 4 Columns</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Mobile: 1 col | Tablet (md): 2 cols | Desktop (xl): 4 cols
        </p>
        <Grid cols={{ base: 1, md: 2, xl: 4 }} gap="lg">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-accent text-accent-foreground rounded-lg p-6 text-center font-medium">
              Feature {i}
            </div>
          ))}
        </Grid>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Grid adapts column count at different breakpoints.',
      },
    },
  },
};

/**
 * Story 5: Alignment & Justification
 * Controlling item positioning within grid cells
 */
export const AlignmentAndJustification: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Vertical Alignment */}
      <div>
        <h3 className="text-lg font-bold mb-4">Vertical Alignment (align prop)</h3>
        <div className="space-y-4">
          {(['start', 'center', 'end', 'stretch'] as const).map((align) => (
            <div key={align}>
              <p className="text-sm font-medium mb-2">align="{align}"</p>
              <Grid cols={3} gap="md" align={align} className="min-h-[120px] bg-muted/30 rounded-lg p-4">
                <div className="bg-primary text-primary-foreground rounded-lg p-4 text-center text-sm">
                  Short
                </div>
                <div className="bg-primary text-primary-foreground rounded-lg p-4 text-center text-sm h-20">
                  Taller Item
                </div>
                <div className="bg-primary text-primary-foreground rounded-lg p-4 text-center text-sm">
                  Short
                </div>
              </Grid>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal Justification */}
      <div>
        <h3 className="text-lg font-bold mb-4">Horizontal Justification (justify prop)</h3>
        <div className="space-y-4">
          {(['start', 'center', 'end'] as const).map((justify) => (
            <div key={justify}>
              <p className="text-sm font-medium mb-2">justify="{justify}"</p>
              <Grid cols={3} gap="md" justify={justify} className="bg-muted/30 rounded-lg p-4">
                <div className="bg-secondary text-secondary-foreground rounded-lg p-4 text-center text-sm w-20">
                  A
                </div>
                <div className="bg-secondary text-secondary-foreground rounded-lg p-4 text-center text-sm w-20">
                  B
                </div>
                <div className="bg-secondary text-secondary-foreground rounded-lg p-4 text-center text-sm w-20">
                  C
                </div>
              </Grid>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Control item alignment and justification within grid cells.',
      },
    },
  },
};

/**
 * Story 6: Auto-fit Pattern
 * Dynamic column count based on available space
 */
export const AutoFitPattern: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold mb-4">Auto-fit with 250px min width</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Automatically creates as many columns as fit, with each at least 250px wide.
          Resize your browser to see columns adjust dynamically.
        </p>
        <Grid autoFit minColWidth="250px" gap="md">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-primary text-primary-foreground rounded-lg p-6 text-center font-medium">
              Card {i}
            </div>
          ))}
        </Grid>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">Auto-fit with 300px min width</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Larger minimum width means fewer columns on smaller screens.
        </p>
        <Grid autoFit minColWidth="300px" gap="lg">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-secondary text-secondary-foreground rounded-lg p-8 text-center font-medium">
              Feature {i}
            </div>
          ))}
        </Grid>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">Auto-fit with 200px min width (Dense)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Smaller minimum width creates denser layouts with more columns.
        </p>
        <Grid autoFit minColWidth="200px" gap="sm">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((i) => (
            <div key={i} className="bg-accent text-accent-foreground rounded-lg p-4 text-center text-sm font-medium">
              {i}
            </div>
          ))}
        </Grid>
      </div>

      <div className="mt-6 bg-muted rounded-lg p-4">
        <p className="text-sm font-medium mb-2">💡 When to use auto-fit:</p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Card galleries that should fill available space</li>
          <li>Product grids in e-commerce</li>
          <li>Image galleries</li>
          <li>When you want maximum flexibility without breakpoints</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Auto-fit creates responsive columns without explicit breakpoints.',
      },
    },
  },
};

/**
 * Story 7: Dashboard Layout Example
 * Real-world dashboard using Grid
 */
export const DashboardLayoutExample: Story = {
  render: () => (
    <div className="bg-background min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="bg-card border rounded-lg p-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Real-time metrics and insights</p>
      </div>

      {/* Stats Grid */}
      <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap="md">
        {[
          { label: 'Total Revenue', value: '$45,231', change: '+20.1%', positive: true },
          { label: 'Active Users', value: '2,350', change: '+15.3%', positive: true },
          { label: 'Bounce Rate', value: '32.5%', change: '-5.4%', positive: true },
          { label: 'Avg. Session', value: '4m 20s', change: '+2.1%', positive: true },
        ].map((stat, i) => (
          <div key={i} className="bg-card border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-3xl font-bold mb-2">{stat.value}</p>
            <p className={`text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
              {stat.change} from last month
            </p>
          </div>
        ))}
      </Grid>

      {/* Charts & Tables Grid */}
      <Grid cols={{ base: 1, lg: 3 }} gap="md">
        {/* Large Chart */}
        <GridItem colSpan={{ base: 1, lg: 2 }}>
          <div className="bg-card border rounded-lg p-6 h-[400px]">
            <h3 className="text-lg font-bold mb-4">Revenue Over Time</h3>
            <div className="flex items-end justify-between h-[300px] gap-2">
              {[60, 80, 65, 90, 70, 85, 95, 75, 88, 92, 78, 100].map((height, i) => (
                <div
                  key={i}
                  className="bg-primary rounded-t flex-1"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </GridItem>

        {/* Activity Feed */}
        <GridItem colSpan={1}>
          <div className="bg-card border rounded-lg p-6 h-[400px] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                'New user signed up',
                'Payment received: $1,250',
                'Report generated',
                'User updated profile',
                'New feature released',
                'System backup completed',
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-2 pb-3 border-b last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">{activity}</p>
                    <p className="text-xs text-muted-foreground">{i + 1}h ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GridItem>
      </Grid>

      {/* Bottom Cards */}
      <Grid cols={{ base: 1, md: 2, lg: 3 }} gap="md">
        {[
          { title: 'Top Products', count: 24 },
          { title: 'Customer Reviews', count: 156 },
          { title: 'Pending Orders', count: 8 },
        ].map((card, i) => (
          <div key={i} className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-bold mb-2">{card.title}</h3>
            <p className="text-4xl font-bold text-primary mb-4">{card.count}</p>
            <button className="text-sm text-primary hover:underline">View all →</button>
          </div>
        ))}
      </Grid>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete dashboard demonstrating Grid in production.',
      },
    },
  },
};
