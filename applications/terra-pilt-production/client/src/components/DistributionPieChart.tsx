import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Download  } from '@mui/icons-material';
import { DistributionData, CHART_COLORS } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

interface DistributionPieChartProps {
  data: DistributionData[] | null;
  isLoading: boolean;
  error: Error | null;
  onDownload?: () => void;
  title?: string;
  year?: string;
}

const DistributionPieChart: React.FC<DistributionPieChartProps> = ({
  data,
  isLoading,
  error,
  onDownload,
  title = "Distribution",
  year,
}) => {
  // Calculate the total for percentage display
  const total = React.useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, item) => sum + item.amount, 0);
  }, [data]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = ((item.amount / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md"><>

          <p className="font-medium">{item.district}</p>
          <p
</>>{`Amount: ${formatCurrency(item.amount)}`}</p>
          <p>{`Percentage: ${percentage}%`}</p>
        </div>
      );
    }
    return null;
  };
  
  // Custom legend component to ensure consistent colors
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <div className="mt-6 grid grid-cols-2 gap-2">
        {payload.map((entry: any /* , index */: number) => (
          <div key={`legend-${index}`} className="flex items-center">
            <span 
              className="h-3 w-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600 truncate">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          {title} {year && `(${year})`}
        </CardTitle>
        {onDownload && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDownload}
            disabled={isLoading || !!error}
            title="Download data"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-600">
              <AlertCircle className="h-10 w-10 mb-2" /><>

              <p className="text-center">Error loading chart data</p>
              <p
</> className="text-sm text-center">{error.message}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data || []}
                  dataKey="amount"
                  nameKey="district"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={0}
                  label={false}
                  paddingAngle={2}
                  isAnimationActive={true}
                >
                  {data?.map((entry /* , index */) => (<>

                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[index % CHART_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip
</> content={<CustomTooltip />} />
                <Legend
                  content={renderLegend}
                  layout="horizontal"
                  verticalAlign="bottom"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DistributionPieChart;
