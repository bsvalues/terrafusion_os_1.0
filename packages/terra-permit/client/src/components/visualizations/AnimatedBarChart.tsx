import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine,
  Rectangle
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface BarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  fill: string;
  stroke?: string;
  dataKey?: string;
  payload?: any;
}

export interface BarDataPoint {
  name: string;
  value: number;
  comparisonValue?: number;
  category?: string;
  color?: string;
}

interface AnimatedBarChartProps {
  data: BarDataPoint[];
  title: string;
  description?: string;
  isAnimating?: boolean;
  color?: string;
  comparisonColor?: string;
  height?: number;
  showAverage?: boolean;
  horizontal?: boolean;
  barSize?: number;
  showInsights?: boolean;
  onBarClick?: (item: BarDataPoint, index: number) => void;
  highlightedIndex?: number | null;
}

const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({
  data,
  title,
  description,
  isAnimating = true,
  color = '#3b82f6',
  comparisonColor = '#93c5fd',
  height = 300,
  showAverage = true,
  horizontal = false,
  barSize = 30,
  showInsights = true,
  onBarClick,
  highlightedIndex = null,
}) => {
  const [displayData, setDisplayData] = useState<BarDataPoint[]>([]);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  
  const hasComparisonData = data.some(item => item.comparisonValue !== undefined);
  
  // Calculate average if showAverage is true
  const average = showAverage 
    ? data.reduce((sum, item) => sum + item.value, 0) / data.length 
    : 0;
  
  // Animation to reveal bars one by one
  useEffect(() => {
    if (!isAnimating || !data.length) {
      setDisplayData(data);
      setAnimationCompleted(true);
      return;
    }
    
    setDisplayData([]);
    setAnimationCompleted(false);
    
    // Clear any existing animation
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    
    let index = 0;
    const revealBars = () => {
      if (index < data.length) {
        setDisplayData(prev => [...prev, data[index]]);
        index++;
        animationRef.current = setTimeout(revealBars, 300);
      } else {
        setAnimationCompleted(true);
      }
    };
    
    animationRef.current = setTimeout(revealBars, 500);
    
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [data, isAnimating]);
  
  // Generate insights after animation completes
  useEffect(() => {
    if (!showInsights || !animationCompleted || !data.length) return;
    
    // Find maximum value and its index
    const maxValue = Math.max(...data.map(item => item.value));
    const maxIndex = data.findIndex(item => item.value === maxValue);
    
    // Find minimum value and its index
    const minValue = Math.min(...data.map(item => item.value));
    const minIndex = data.findIndex(item => item.value === minValue);
    
    // Calculate how current value compares to average
    const aboveAverage = data.filter(item => item.value > average).length;
    const belowAverage = data.filter(item => item.value < average).length;
    
    // Generate different insights
    const insights = [
      `${data[maxIndex].name} has the highest value at ${maxValue}, which is ${((maxValue / average - 1) * 100).toFixed(1)}% above average.`,
      `${data[minIndex].name} has the lowest value at ${minValue}, which is ${((1 - minValue / average) * 100).toFixed(1)}% below average.`,
      `${aboveAverage} items are above the average of ${average.toFixed(1)}, while ${belowAverage} are below.`
    ];
    
    // Show a different insight every 5 seconds
    let insightIndex = 0;
    setInsight(insights[insightIndex]);
    
    const insightTimer = setInterval(() => {
      insightIndex = (insightIndex + 1) % insights.length;
      setInsight(insights[insightIndex]);
    }, 5000);
    
    return () => clearInterval(insightTimer);
  }, [animationCompleted, data, average, showInsights]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-semibold">{label}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            Value: <span className="font-medium">{payload[0].value}</span>
          </p>
          {payload.length > 1 && (
            <p className="text-sm" style={{ color: payload[1].color }}>
              Comparison: <span className="font-medium">{payload[1].value}</span>
            </p>
          )}
        </div>
      );
    }
    
    return null;
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
        {showInsights && insight && (
          <motion.div 
            className="p-3 mb-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            key={insight}
          >
            <span className="font-bold">Insight:</span> {insight}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            barCategoryGap="20%"
            onClick={(data: any) => {
              if (onBarClick && data?.activePayload && data.activePayload.length > 0) {
                const index = displayData.findIndex(item => item.name === data.activePayload[0].payload.name);
                onBarClick(data.activePayload[0].payload, index);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            {horizontal ? (
              <>
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: '#4b5563' }}
                  width={120}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <XAxis 
                  type="number" 
                  tick={{ fill: '#4b5563' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
              </>
            ) : (
              <>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#4b5563' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tick={{ fill: '#4b5563' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
              </>
            )}
            
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {showAverage && (
              <ReferenceLine
                y={average}
                x={average}
                stroke="#64748b"
                strokeDasharray="4 4"
                isFront={false}
                label={{
                  value: `Avg: ${average.toFixed(1)}`,
                  fill: '#64748b',
                  fontSize: 12,
                  position: horizontal ? 'insideTopRight' : 'insideTopLeft'
                }}
              />
            )}
            
            <Bar
              dataKey="value"
              name="Value"
              fill={color}
              radius={[4, 4, 0, 0]}
              barSize={barSize}
              animationDuration={1500}
              animationEasing="ease-out"
              isAnimationActive={true}
              activeBar={{ fill: '#1d4ed8', stroke: '#1e40af', strokeWidth: 2 }}
              shape={(props: any) => {
                const { x, y, width, height, index } = props;
                const isHighlighted = index === highlightedIndex;
                
                return (
                  <g>
                    <rect 
                      x={x} 
                      y={y} 
                      width={width} 
                      height={height} 
                      fill={isHighlighted ? '#1d4ed8' : color}
                      stroke={isHighlighted ? '#1e40af' : 'none'}
                      strokeWidth={isHighlighted ? 2 : 0}
                      rx={4}
                      ry={4}
                    />
                    {isHighlighted && (
                      <motion.rect
                        x={x} 
                        y={y} 
                        width={width} 
                        height={height}
                        fill="transparent"
                        stroke="#1e40af"
                        strokeWidth={2}
                        rx={4}
                        ry={4}
                        initial={{ opacity: 0.3, strokeWidth: 1 }}
                        animate={{ 
                          opacity: [0.7, 0.3, 0.7], 
                          strokeWidth: [3, 1, 3] 
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5
                        }}
                      />
                    )}
                  </g>
                );
              }}
            />
            
            {hasComparisonData && (
              <Bar
                dataKey="comparisonValue"
                name="Comparison"
                fill={comparisonColor}
                radius={[4, 4, 0, 0]}
                barSize={barSize}
                animationDuration={1500}
                animationEasing="ease-out"
                isAnimationActive={true}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default AnimatedBarChart;