import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon
} from '@mui/icons-material';

interface KPICardProps {
  title: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
  format?: 'currency' | 'percentage' | 'number';
  target?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  color?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  trend,
  format = 'number',
  target,
  status = 'info',
  icon,
  color
}) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" fontSize="small" />;
      case 'down':
        return <TrendingDownIcon color="error" fontSize="small" />;
      case 'flat':
        return <TrendingFlatIcon color="action" fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'success.main';
      case 'warning':
        return 'warning.main';
      case 'error':
        return 'error.main';
      default:
        return 'primary.main';
    }
  };

  const progress = target ? Math.min((Number(value) / target) * 100, 100) : undefined;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          {icon && (
            <Avatar sx={{ bgcolor: color || getStatusColor(), width: 32, height: 32 }}>
              {icon}
            </Avatar>
          )}
        </Box><>

        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          {formatValue(value)}
        </Typography>
        
        <Box
</>
sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getTrendIcon()}
              <Chip
                label={`${change > 0 ? '+' : ''}${change}%`}
                size="small"
                color={change > 0 ? 'success' : change < 0 ? 'error' : 'default'}
                variant="outlined"
                sx={{ ml: 0.5 }}
              />
            </Box>
          )}
        </Box>
        
        {target && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><>

              <Typography variant="caption" color="text.secondary">
                Progress to Target
              </Typography>
              <Typography
</>
variant="caption" color="text.secondary">
                {formatValue(target)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={progress >= 100 ? 'success' : progress >= 75 ? 'primary' : 'warning'}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
