import React from 'react';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';

interface PerformanceGaugeProps {
  title: string;
  value: number;
  max: number;
  unit?: string;
  color?: string;
  thresholds?: {
    warning: number;
    critical: number;
  };
}

export const PerformanceGauge: React.FC<PerformanceGaugeProps> = ({
  title,
  value,
  max,
  unit = '',
  color = '#1976d2',
  thresholds
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getColor = () => {
    if (thresholds) {
      if (value >= thresholds.critical) return '#f44336';
      if (value >= thresholds.warning) return '#ff9800';
    }
    return color;
  };

  const data = [
    { name: 'value', value: percentage },
    { name: 'remaining', value: 100 - percentage }
  ];

  const COLORS = [getColor(), '#f5f5f5'];

  return (
    <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}><>

      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Box
</> sx={{ position: 'relative', height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius={30}
              outerRadius={50}
              dataKey="value"
            >
              {data.map((entry /* , index */) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}
        ><>

          <Typography variant="h6" sx={{ fontWeight: 'bold', color: getColor() }}>
            {value}{unit}
          </Typography>
          <Typography
</> variant="caption" color="text.secondary">
            of {max}{unit}
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {percentage.toFixed(1)}% utilized
      </Typography>
    </Paper>
  );
};
