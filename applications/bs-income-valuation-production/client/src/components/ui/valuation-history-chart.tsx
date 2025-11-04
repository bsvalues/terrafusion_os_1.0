import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from "recharts";
import { Valuation } from "@shared/schema";

interface ValuationHistoryChartProps {
  valuations: Valuation[];
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-md shadow-sm"><>

        <p className="font-medium text-sm">{label}</p>
        <p
</>

className="text-sm text-primary-700">
          <span className="font-medium">
            {new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: 'USD',
              maximumFractionDigits: 0
            }).format(payload[0].value as number)}
          </span>
        </p>
      </div>
    );
  }

  return null;
};

export const ValuationHistoryChart = ({ valuations }: ValuationHistoryChartProps) => {
  // Format and sort the data for the chart
  const chartData = useMemo(() => {
    if (!valuations || valuations.length === 0) return [];

    // Create a copy and sort by date (oldest to newest)
    const sortedValuations = [...valuations].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    // Format the data for recharts
    return sortedValuations.map(valuation => {
      const date = new Date(valuation.createdAt);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        amount: Number(valuation.valuationAmount),
        name: valuation.name || "Valuation"
      };
    });
  }, [valuations]);

  // If there's no data or only one point, show a message
  if (chartData.length <= 1) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center"><>

        <p className="text-slate-500 mb-2">Not enough data to display chart</p>
        <p
</>

className="text-sm text-slate-400">Create at least two valuations to see your progress</p>
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickMargin={10}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            formatter={(value) => <span className="text-sm font-medium">Valuation History</span>}
          />
          <Line
            type="monotone"
            dataKey="amount"
            name="Valuation Amount"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "white", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};