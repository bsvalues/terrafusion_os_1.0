import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export interface PieDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface AnimatedPieChartProps {
  data: PieDataPoint[];
  title: string;
  description?: string;
  colors?: string[];
  isAnimating?: boolean;
  height?: number;
  showLabels?: boolean;
  showInsights?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

const defaultColors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

const AnimatedPieChart: React.FC<AnimatedPieChartProps> = ({
  data,
  title,
  description,
  colors = defaultColors,
  isAnimating = true,
  height = 300,
  showLabels = true,
  showInsights = true,
  innerRadius = 60,
  outerRadius = 100,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [startAngle, setStartAngle] = useState(0);
  const [endAngle, setEndAngle] = useState(0);
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null);
  const [insightText, setInsightText] = useState<string | null>(null);

  // Assign colors to data points if not provided
  const chartData = data.map((item /* , index */) => ({
    ...item,
    color: item.color || colors[index % colors.length],
  }));

  // Calculate total for percentage
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Animation for pie chart rotation and growth
  useEffect(() => {
    if (!isAnimating) {
      setEndAngle(360);
      return;
    }

    // Gradually reveal the pie chart
    const timer = setInterval(() => {
      setEndAngle(prev => {
        if (prev >= 360) {
          clearInterval(timer);
          return 360;
        }
        return prev + 5;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [isAnimating]);

  // Additional animation to rotate the chart
  useEffect(() => {
    if (!isAnimating || endAngle < 360) return;

    const rotationTimer = setInterval(() => {
      setStartAngle(prev => (prev + 1) % 360);
    }, 100);

    return () => clearInterval(rotationTimer);
  }, [isAnimating, endAngle]);

  // Generate insights based on the data
  useEffect(() => {
    if (!showInsights || !data.length) return;

    // Find the largest slice
    const maxIndex = data.reduce((maxIdx, item, idx, arr) => 
      item.value > arr[maxIdx].value ? idx : maxIdx, 0);
    
    // Find the smallest slice
    const minIndex = data.reduce((minIdx, item, idx, arr) => 
      item.value < arr[minIdx].value ? idx : minIdx, 0);

    const insightMessages = [
      `${data[maxIndex].name} represents the largest segment at ${Math.round((data[maxIndex].value / total) * 100)}% of the total.`,
      `${data[minIndex].name} is the smallest category at only ${Math.round((data[minIndex].value / total) * 100)}% of the total.`,
      `The difference between the largest and smallest segments is ${Math.round(Math.abs(data[maxIndex].value - data[minIndex].value) / total * 100)}%.`
    ];

    // Rotate through insights
    let currentInsight = 0;
    const insightTimer = setInterval(() => {
      setInsightText(insightMessages[currentInsight]);
      setSelectedSlice(currentInsight === 0 ? maxIndex : currentInsight === 1 ? minIndex : null);
      currentInsight = (currentInsight + 1) % insightMessages.length;
    }, 5000);

    // Initial insight
    setInsightText(insightMessages[0]);
    setSelectedSlice(maxIndex);

    return () => clearInterval(insightTimer);
  }, [data, showInsights, total]);

  const onPieEnter = (_: any /* , index */: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, name } = props;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (!showLabels) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill={chartData[index].color}
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {name} ({(percent * 100).toFixed(0)}%)
      </text>
    );
  };

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-4">
        <motion.h3 
          className="text-lg font-bold text-gray-900"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.h3>
        {description && (
          <motion.p 
            className="text-sm text-gray-600"
            initial={{ y: -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {description}
          </motion.p>
        )}
      </div>

      <AnimatePresence>
        {showInsights && insightText && (
          <motion.div 
            className="p-3 mb-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            key={insightText}
          >
            <span className="font-bold">Insight:</span> {insightText}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={showLabels}
              label={renderCustomizedLabel}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              startAngle={startAngle}
              endAngle={startAngle + endAngle}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              animationDuration={1000}
              animationBegin={0}
            >
              {chartData.map((entry /* , index */) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  stroke={selectedSlice === index ? '#000' : '#fff'} 
                  strokeWidth={selectedSlice === index ? 2 : 1} 
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [
                `${value} (${Math.round((value / total) * 100)}%)`,
                'Value'
              ]}
              contentStyle={{ 
                background: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              formatter={(value: string, entry: any) => (
                <span style={{ color: entry.color, fontWeight: activeIndex === entry.payload.index ? 'bold' : 'normal' }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default AnimatedPieChart;