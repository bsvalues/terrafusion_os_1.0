import { useState } from 'react';
import { ResponsivePie } from '@nivo/pie';
import { Permit } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { BarChart3, Info  } from '@mui/icons-material';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PermitStatusChartProps {
  permits: Permit[];
}

const PermitStatusChart = ({ permits }: PermitStatusChartProps) => {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  
  // Count enter vs. skip permits
  const enterPermits = permits.filter(p => p.enterPermit).length;
  const skipPermits = permits.length - enterPermits;
  
  // Prepare data for Nivo pie chart
  const data = [
    {
      id: 'Enter',
      label: 'Enter',
      value: enterPermits,
      color: '#22c55e'
    },
    {
      id: 'Skip',
      label: 'Skip',
      value: skipPermits,
      color: '#f97316'
    }
  ];
  
  // Calculate percentages for display
  const enterPercentage = permits.length > 0 ? Math.round((enterPermits / permits.length) * 100) : 0;
  const skipPercentage = permits.length > 0 ? Math.round((skipPermits / permits.length) * 100) : 0;
  
  // Custom layer to display total count in center
  const CenterMetric = ({ centerX, centerY }: { centerX: number; centerY: number }) => {
    return (
      <g>
        <text
          x={centerX}
          y={centerY - 8}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            fill: isDarkTheme ? '#f8fafc' : '#1e293b'
          }}
        >
          {permits.length}
        </text>
        <text x={centerX}
          y={centerY + 16}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: '14px',
            fill: isDarkTheme ? '#cbd5e1' : '#64748b'
          }}
        >
          Total Permits
        </text>
      </g>
    );
  };
  
  return (
    <Card className="w-full h-full">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">
          Permit Status Distribution
        </CardTitle>
        <TooltipProvider
>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" align="end" className="text-sm">
              <p>Distribution of entered vs. skipped permits</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="w-full h-72 relative">
          {permits.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-2" />
              <div className="text-center text-muted-foreground">
                No permit data available
              </div>
            </div>
          ) : (
              <ResponsivePie
                data={data}
                margin={{ top: 30, right: 40, bottom: 40, left: 40 }}
                innerRadius={0.6}
                padAngle={0.5}
                cornerRadius={4}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                enableArcLabels={true}
                arcLabel={(d) => `${Math.round((d.value / permits.length) * 100)}%`}
                arcLabelsSkipAngle={10}
                arcLabelsRadiusOffset={0.65}
                arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
                colors={{ datum: 'data.color' }}
                layers={['arcs', 'arcLabels', 'arcLinkLabels', 'legends', CenterMetric]}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 40,
                    itemsSpacing: 20,
                    itemWidth: 80,
                    itemHeight: 20,
                    itemTextColor: isDarkTheme ? '#cbd5e1' : '#64748b',
                    itemDirection: 'left-to-right',
                    itemOpacity: 1,
                    symbolSize: 16,
                    symbolShape: 'circle',
                  }
                ]}
                animate={true}
                motionConfig="gentle"
                theme={{
                  text: {
                    fill: isDarkTheme ? '#f8fafc' : '#1e293b',
                  },
                  tooltip: {
                    container: {
                      background: isDarkTheme ? '#1e293b' : '#ffffff',
                      color: isDarkTheme ? '#f8fafc' : '#1e293b',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    },
                  },
                }}
              />
              <div className="absolute bottom-1 w-full flex justify-center gap-6 text-sm">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-[#22c55e] mr-2"></span>
                  <span className="text-muted-foreground">Enter: {enterPermits} ({enterPercentage}%)</span>
                </div>
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-[#f97316] mr-2"></span>
                  <span className="text-muted-foreground">Skip: {skipPermits} ({skipPercentage}%)</span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PermitStatusChart;