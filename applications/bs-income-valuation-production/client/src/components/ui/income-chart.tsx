import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, TooltipProps } from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { Income } from "@shared/schema";

interface IncomeChartProps {
  data: Income[];
}

type IncomeSource = "salary" | "business" | "freelance" | "investment" | "rental" | "other";

// Colors for each income source
const COLORS = {
  salary: "hsl(var(--chart-1))",
  business: "hsl(var(--chart-2))",
  freelance: "hsl(var(--chart-3))",
  investment: "hsl(var(--chart-4))",
  rental: "hsl(var(--chart-5))",
  other: "hsl(var(--muted))"
};

const frequencyMultiplier = {
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-md shadow-sm"><>

        <p className="font-medium capitalize">{data.name}</p>
        <p
</>

className="text-sm text-slate-600">
          <span className="font-medium">{formatCurrency(data.value)}</span> per year
        </p>
        <p className="text-xs text-slate-500">
          {formatPercentage(data.percentage)}
        </p>
      </div>
    );
  }

  return null;
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper function to format percentage
const formatPercentage = (percentage: number) => {
  return `${percentage.toFixed(1)}% of total`;
};

export const IncomeChart = ({ data }: IncomeChartProps) => {
  // Transform the income data for the chart
  const chartData = data.map(income => {
    // Convert all amounts to yearly
    const yearlyAmount = parseFloat(income.amount.toString()) * frequencyMultiplier[income.frequency as keyof typeof frequencyMultiplier];
    
    return {
      name: income.source,
      value: yearlyAmount,
      color: COLORS[income.source as IncomeSource]
    };
  });

  // Calculate total
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  
  // Add percentage to each item
  chartData.forEach(item => {
    item.percentage = (item.value / total) * 100;
  });

  // Sort by value descending
  chartData.sort((a, b) => b.value - a.value);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry /* , index */) => (<>

              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
</>

content={<CustomTooltip />} />
          <Legend 
            layout="vertical" 
            verticalAlign="middle"
            align="right"
            formatter={(value) => {
              const item = chartData.find(d => d.name === value);
              const percentage = item ? `: ${Math.round(item.percentage)}%` : '';
              return <span className="capitalize text-sm">{value}{percentage}</span>;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
