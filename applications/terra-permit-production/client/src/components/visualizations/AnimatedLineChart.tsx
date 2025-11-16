import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';

export interface DataPoint {
  name: string;
  value: number;
  prevValue?: number;
  timestamp?: string;
  category?: string;
}

interface AnimatedLineChartProps {
  data: DataPoint[];
  title: string;
  description?: string;
  color?: string;
  isAnimating?: boolean;
  withGradient?: boolean;
  height?: number;
  showControls?: boolean;
}

const AnimatedLineChart: React.FC<AnimatedLineChartProps> = ({
  data,
  title,
  description,
  color = '#3b82f6',
  isAnimating = true,
  withGradient = true,
  height = 300,
  showControls = false
}) => {
  const [displayData, setDisplayData] = useState<DataPoint[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [highlightPoint, setHighlightPoint] = useState<number | null>(null);

  const gradientId = `colorGradient-${title.replace(/\s+/g, '')}`;

  // Effect to animate data sequentially
  useEffect(() => {
    if (!isAnimating || isPaused || !data.length) return;

    const timer = setTimeout(() => {
      if (currentIndex < data.length) {
        setDisplayData(data.slice(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
        
        // Add insight tooltips at specific points in the data
        if (data[currentIndex]?.value > (data[currentIndex - 1]?.value || 0) * 1.2) {
          setTooltipContent(`Significant increase observed at ${data[currentIndex].name}`);
          setHighlightPoint(currentIndex);
        }
      } else {
        // Reset to start over with animation
        setTimeout(() => {
          setCurrentIndex(0);
          setDisplayData([]);
          setTooltipContent(null);
          setHighlightPoint(null);
        }, 5000);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [data, currentIndex, isAnimating, isPaused]);

  // If not animating, show full data
  useEffect(() => {
    if (!isAnimating) {
      setDisplayData(data);
    }
  }, [data, isAnimating]);

  const handlePlayPause = () => {
    setIsPaused(prev => !prev);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setDisplayData([]);
    setIsPaused(false);
    setTooltipContent(null);
    setHighlightPoint(null);
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

      {/* Insights/Tooltips Displayed Above Chart */}
      {tooltipContent && (
        <motion.div 
          className="p-3 mb-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <span className="font-bold">Insight:</span> {tooltipContent}
        </motion.div>
      )}

      <div className="relative" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={displayData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              {withGradient && (
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#4b5563' }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <YAxis 
              tick={{ fill: '#4b5563' }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Line
              key="animated-line"
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              dot={(props) => {
                const { cx, cy, index } = props;
                const isHighlighted = index === highlightPoint;
                
                return (
                  <svg key={`dot-${index}`}>
                    <circle 
                      key={`circle-${index}`}
                      cx={cx} 
                      cy={cy} 
                      r={isHighlighted ? 6 : 4} 
                      fill={isHighlighted ? '#ef4444' : 'white'} 
                      stroke={color} 
                      strokeWidth={2} 
                    />
                    {isHighlighted && (
                      <motion.circle 
                        key={`highlight-circle-${index}`}
                        cx={cx}
                        cy={cy}
                        r={10}
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth={2}
                        initial={{ opacity: 0, r: 4 }}
                        animate={{ opacity: 1, r: 12 }}
                        transition={{ 
                          repeat: Infinity,
                          repeatType: "reverse",
                          duration: 1 
                        }}
                      />
                    )}
                  </svg>
                );
              }}
              activeDot={{ r: 8, fill: color, stroke: 'white', strokeWidth: 2 }}
              isAnimationActive={false}
              fillOpacity={1}
              fill={withGradient ? `url(#${gradientId})` : "transparent"}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {showControls && (
        <motion.div 
          className="flex justify-center mt-4 space-x-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        ><>

          <button 
            onClick={handlePlayPause} 
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {isPaused ? 'Play' : 'Pause'}
          </button>
          <button
</> 
            onClick={handleReset}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnimatedLineChart;