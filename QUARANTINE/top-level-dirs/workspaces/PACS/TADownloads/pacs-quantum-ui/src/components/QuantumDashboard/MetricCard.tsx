/**
 * Metric Card Component
 * Displays a single metric with trend indicator
 */

import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { TrendingUp, TrendingDown, Remove } from '@mui/icons-material';
import type { TrendData } from '../../types/pacs';

interface MetricCardProps {
  title: string;
  value: number;
  trend?: TrendData;
  onClick?: () => void;
  isExpanded?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  onClick,
  isExpanded,
}) => {
  const formatValue = (val: number): string => {
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(2)}M`;
    }
    if (val >= 1000) {
      return `$${(val / 1000).toFixed(2)}K`;
    }
    return val.toLocaleString();
  };

  const TrendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Remove;
  const trendColor = trend?.direction === 'up' ? 'success' : trend?.direction === 'down' ? 'error' : 'default';

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? { boxShadow: 4, transform: 'translateY(-2px)' } : {},
        border: isExpanded ? 2 : 1,
        borderColor: isExpanded ? 'primary.main' : 'divider',
      }}
      onClick={onClick}
    >
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="h4" component="div" fontWeight="bold">
            {formatValue(value)}
          </Typography>
          {trend && (
            <Chip
              icon={<TrendIcon />}
              label={`${trend.changePercent > 0 ? '+' : ''}${trend.changePercent.toFixed(2)}%`}
              color={trendColor}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        {trend && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.change.toLocaleString()}{' '}
            from previous period
          </Typography>
        )}
        {isExpanded && (
          <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
            Click to collapse breakdown
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

