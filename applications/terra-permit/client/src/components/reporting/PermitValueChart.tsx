import { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Permit } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { BarChart3, Info, TrendingUp  } from '@mui/icons-material';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PermitValueChartProps {
  permits: Permit[];
}

interface PermitValueBin {
  id: string;
  range: string;
  value: number;
  count: number;
  Entered: number;
  Skipped: number;
  [key: string]: string | number; // Index signature for compatibility with BarDatum
}

const PermitValueChart = ({ permits }: PermitValueChartProps) => {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  
  // Process permit data to create value bins
  const { valueBins, averageValue, formattedAvgValue } = useMemo(() => {
    if (!permits.length) return { valueBins: [], averageValue: 0, formattedAvgValue: '$0' };
    
    // Extract permit values
    const permitValues = permits.map(permit => {
      // Parse permit value, removing non-numeric characters
      const valueString = permit.value.replace(/[^0-9.-]+/g, "");
      const value = parseFloat(valueString);
      return {
        id: permit.id,
        value: isNaN(value) ? 0 : value,
        enterPermit: permit.enterPermit
      };
    }).filter(item => item.value > 0); // Filter out zero or invalid values
    
    if (!permitValues.length) return { valueBins: [], averageValue: 0, formattedAvgValue: '$0' };
    
    // Calculate average value
    const avgValue = permitValues.reduce((sum, item) => sum + item.value, 0) / permitValues.length;
    const formattedAvg = `$${new Intl.NumberFormat('en-US').format(Math.round(avgValue))}`;
    
    // Determine value ranges for histogram
    const maxValue = Math.max(...permitValues.map(d => d.value));
    const minValue = Math.min(...permitValues.map(d => d.value));
    
    // Create bin ranges
    const numBins = 8; // Fixed number of bins for better visualization
    const binWidth = (maxValue - minValue) / numBins;
    
    // Initialize bins
    const bins: PermitValueBin[] = [];
    
    for (let i = 0; i < numBins; i++) {
      const binStart = minValue + i * binWidth;
      const binEnd = binStart + binWidth;
      
      // Format range labels
      const formattedStart = `$${new Intl.NumberFormat('en-US').format(Math.round(binStart))}`;
      const formattedEnd = `$${new Intl.NumberFormat('en-US').format(Math.round(binEnd))}`;
      
      bins.push({
        id: `bin-${i}`,
        range: `${formattedStart} - ${formattedEnd}`,
        value: binStart, // Use for sorting
        count: 0,
        Entered: 0,
        Skipped: 0
      });
    }
    
    // Assign permit values to bins
    permitValues.forEach(item => {
      const binIndex = Math.min(
        Math.floor((item.value - minValue) / binWidth),
        numBins - 1 // Ensure we don't exceed the last bin
      );
      
      if (binIndex >= 0 && binIndex < bins.length) {
        bins[binIndex].count += 1;
        
        if (item.enterPermit) {
          bins[binIndex].Entered += 1;
        } else {
          bins[binIndex].Skipped += 1;
        }
      }
    });
    
    // Filter out empty bins and format for Nivo
    const filteredBins = bins.filter(bin => bin.count > 0);
    
    return { 
      valueBins: filteredBins, 
      averageValue: avgValue,
      formattedAvgValue: formattedAvg
    };
  }, [permits]);
  
  return (
    <Card className="w-full h-full">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">
          Distribution of Permit Values
        </CardTitle>
        <TooltipProvider
>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" align="end" className="text-sm">
              <p>Distribution of permits by monetary value</p>
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
              <ResponsiveBar
                data={valueBins}
                keys={['Entered', 'Skipped']}
                indexBy="range"
                margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
                padding={0.3}
                groupMode="stacked"
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={['#22c55e', '#f97316']}
                borderRadius={4}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 45,
                  legend: 'Permit Value Range',
                  legendPosition: 'middle',
                  legendOffset: 40,
                  truncateTickAt: 0
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Number of Permits',
                  legendPosition: 'middle',
                  legendOffset: -50,
                  truncateTickAt: 0
                }}
                enableGridY={true}
                enableGridX={false}
                enableLabel={false}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                legends={[
                  {
                    dataFrom: 'keys',
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 40,
                    itemsSpacing: 20,
                    itemWidth: 80,
                    itemHeight: 20,
                    itemDirection: 'left-to-right',
                    itemOpacity: 0.85,
                    symbolSize: 16,
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemOpacity: 1
                        }
                      }
                    ]
                  }
                ]}
                role="application"
                ariaLabel="Permit value distribution chart"
                barAriaLabel={e => e.id + ": " + e.formattedValue + " permits in range: " + e.indexValue}
                tooltip={({ id, value, color, indexValue, data }) => (
                  <div
                    style={{
                      background: isDarkTheme ? '#1e293b' : 'white',
                      padding: '8px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      color: isDarkTheme ? 'white' : 'black',
                    }}
                  >
                    <div>
                      <strong>{indexValue}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        display: 'block',
                        width: '12px',
                        height: '12px',
                        background: color,
                        marginRight: '4px',
                        borderRadius: '2px'
                      }}></span>
                      <span
>
                        {id}: <strong>{value}</strong>
                      </span>
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '11px' }}>
                      Total in range: <strong>{data.count}</strong>
                    </div>
                  </div>
                )}
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
                // Show animated gradient on bars
                animate={true}
                motionConfig="gentle"
              />
              
              {/* Average value indicator */}
              <div className="absolute top-4 right-2 flex items-center bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md shadow-sm">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  Avg: {formattedAvgValue}
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PermitValueChart;