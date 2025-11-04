import { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Permit } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { BarChart3, Info  } from '@mui/icons-material';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PermitTypeDistributionProps {
  permits: Permit[];
}

// This interface adds an index signature to make TypeScript happy with Nivo's BarDatum type
interface PermitCategoryData {
  category: string;
  Enter: number;
  Skip: number;
  total: number;
  formattedTotal: string;
  [key: string]: string | number; // Add index signature for compatibility with BarDatum
}

const PermitTypeDistribution = ({ permits }: PermitTypeDistributionProps) => {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  
  // Categorize permits by description
  const permitCategoriesData = useMemo(() => {
    if (!permits.length) return [];
    
    // Get permit descriptions and categorize them
    const permitCategories = permits.reduce((categories, permit) => {
      // Extract the main category from the permit description
      const description = permit.permitDescription.toLowerCase();
      let category = 'Other';
      
      // Categorize based on common permit types
      if (description.includes('commercial') || description.includes('business') || description.includes('office')) {
        category = 'Commercial';
      } else if (description.includes('residential') || description.includes('home') || description.includes('house')) {
        category = 'Residential';
      } else if (description.includes('roof') || description.includes('roofing')) {
        category = 'Roofing';
      } else if (description.includes('hvac') || description.includes('heating') || description.includes('air condition')) {
        category = 'HVAC';
      } else if (description.includes('plumbing') || description.includes('pipe')) {
        category = 'Plumbing';
      } else if (description.includes('electrical') || description.includes('wiring')) {
        category = 'Electrical';
      } else if (description.includes('demo') || description.includes('demolition')) {
        category = 'Demolition';
      } else if (description.includes('new construction') || description.includes('build') || description.includes('building')) {
        category = 'New Construction';
      } else if (description.includes('renovation') || description.includes('remodel')) {
        category = 'Renovation';
      }
      
      if (!categories[category]) {
        categories[category] = {
          category,
          Enter: 0,
          Skip: 0,
          total: 0,
          formattedTotal: '0'
        };
      }
      
      categories[category].total += 1;
      if (permit.enterPermit) {
        categories[category].Enter += 1;
      } else {
        categories[category].Skip += 1;
      }
      categories[category].formattedTotal = categories[category].total.toString();
      
      return categories;
    }, {} as Record<string, PermitCategoryData>);
    
    // Convert to array and sort by count
    return Object.values(permitCategories)
      .sort((a, b) => b.total - a.total)
      // Limit to top 8 categories for better visualization
      .slice(0, 8);
  }, [permits]);
  
  return (
    <Card className="w-full h-full">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between"><>

        <CardTitle className="text-base font-medium">
          Permit Categories Distribution
        </CardTitle>
        <TooltipProvider
</>>
          <Tooltip>
            <TooltipTrigger asChild><>

              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent
</> side="top" align="end" className="text-sm">
              <p>Distribution of permits by category and status</p>
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
              data={permitCategoriesData}
              keys={['Enter', 'Skip']}
              indexBy="category"
              margin={{ top: 10, right: 20, bottom: 50, left: 120 }}
              padding={0.3}
              groupMode="stacked"
              layout="horizontal"
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
                tickRotation: 0,
                legend: 'Number of Permits',
                legendPosition: 'middle',
                legendOffset: 40,
                truncateTickAt: 0
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: '',
                legendPosition: 'middle',
                legendOffset: -40,
                truncateTickAt: 0
              }}
              enableGridX={true}
              enableGridY={false}
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
              ariaLabel="Permit categories chart"
              barAriaLabel={e => e.id + ": " + e.formattedValue + " permits in category: " + e.indexValue}
              tooltip={({ id, value, color, indexValue }) => (
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
                  <div style={{ display: 'flex', alignItems: 'center' }}><>

                    <span style={{ 
                      display: 'block',
                      width: '12px',
                      height: '12px',
                      background: color,
                      marginRight: '4px',
                      borderRadius: '2px'
                    }}></span>
                    <span
</>>
                      {id}: <strong>{value}</strong>
                    </span>
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
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PermitTypeDistribution;