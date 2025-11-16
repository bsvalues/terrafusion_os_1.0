import { useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { Permit } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { LineChart, Info, Calendar  } from '@mui/icons-material';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, isValid, parseISO } from 'date-fns';

interface TimeAnalysisChartProps {
  permits: Permit[];
}

interface TimeDataPoint {
  x: string; // Date string in ISO format
  y: number;
}

const TimeAnalysisChart = ({ permits }: TimeAnalysisChartProps) => {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  
  // Process permit data for time series analysis
  const chartData = useMemo(() => {
    if (!permits.length) return [];
    
    // Process permit data
    const processedData = permits
      .filter(permit => {
        // Ensure date is valid
        try {
          return isValid(parseISO(permit.issueDate));
        } catch (e) {
          return false;
        }
      })
      .map(permit => {
        return {
          id: permit.id,
          date: parseISO(permit.issueDate),
          enterPermit: permit.enterPermit
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    if (processedData.length === 0) {
      return [];
    }
    
    // Group permits by date
    const dateMap = new Map<string, { total: number; entered: number; skipped: number }>();
    
    processedData.forEach(permit => {
      const dateKey = format(permit.date, 'yyyy-MM-dd');
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { total: 0, entered: 0, skipped: 0 });
      }
      
      const entry = dateMap.get(dateKey)!;
      entry.total += 1;
      
      if (permit.enterPermit) {
        entry.entered += 1;
      } else {
        entry.skipped += 1;
      }
    });
    
    // Convert to array and sort by date
    const sortedDates = Array.from(dateMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
    
    // Create cumulative data
    let cumulativeTotal = 0;
    let cumulativeEntered = 0;
    
    const totalData: TimeDataPoint[] = [];
    const enteredData: TimeDataPoint[] = [];
    
    sortedDates.forEach(([dateStr, counts]) => {
      cumulativeTotal += counts.total;
      cumulativeEntered += counts.entered;
      
      totalData.push({
        x: dateStr,
        y: cumulativeTotal
      });
      
      enteredData.push({
        x: dateStr,
        y: cumulativeEntered
      });
    });
    
    // Build data structure for Nivo
    return [
      {
        id: 'Total Permits',
        color: '#6366f1',
        data: totalData
      },
      {
        id: 'Entered Permits',
        color: '#22c55e',
        data: enteredData
      }
    ];
  }, [permits]);
  
  const isEmpty = chartData.length === 0 || chartData[0]?.data.length === 0;
  
  return (
    <Card className="w-full h-full">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between"><>

        <CardTitle className="text-base font-medium">
          Permit Activity Over Time
        </CardTitle>
        <TooltipProvider
</>>
          <Tooltip>
            <TooltipTrigger asChild><>

              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent
</> side="top" align="end" className="text-sm">
              <p>Cumulative permit activity over time</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="w-full h-72 relative">
          {isEmpty ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mb-2" />
              <div className="text-center text-muted-foreground">
                No valid date data available
              </div>
            </div>
          ) : (
            <ResponsiveLine
              data={chartData}
              margin={{ top: 10, right: 110, bottom: 50, left: 60 }}
              xScale={{ 
                type: 'time',
                format: '%Y-%m-%d',
                useUTC: false,
                precision: 'day'
              }}
              xFormat="time:%Y-%m-%d"
              yScale={{
                type: 'linear',
                min: 0,
                max: 'auto',
                stacked: false,
                reverse: false
              }}
              curve="monotoneX"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                format: '%b %d',
                tickValues: 5,
                legend: 'Date',
                legendOffset: 36,
                legendPosition: 'middle'
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Count',
                legendOffset: -50,
                legendPosition: 'middle'
              }}
              enableGridX={false}
              enableGridY={true}
              colors={{ datum: 'color' }}
              lineWidth={3}
              pointSize={8}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              useMesh={true}
              enableArea={true}
              areaOpacity={0.1}
              legends={[
                {
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 100,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemDirection: 'left-to-right',
                  itemWidth: 80,
                  itemHeight: 20,
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: 'circle',
                  symbolBorderColor: 'rgba(0, 0, 0, .5)',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemBackground: 'rgba(0, 0, 0, .03)',
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
              theme={{
                text: {
                  fill: isDarkTheme ? '#f8fafc' : '#1e293b',
                },
                axis: {
                  ticks: {
                    text: {
                      fill: isDarkTheme ? '#cbd5e1' : '#64748b',
                    },
                  },
                  legend: {
                    text: {
                      fill: isDarkTheme ? '#cbd5e1' : '#64748b',
                    },
                  },
                },
                grid: {
                  line: {
                    stroke: isDarkTheme ? '#334155' : '#e2e8f0',
                  },
                },
                legends: {
                  text: {
                    fill: isDarkTheme ? '#cbd5e1' : '#64748b',
                  },
                },
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeAnalysisChart;