import React, { useState, useEffect } from 'react';
import { Box,
  Paper,
  Typography,
  IconButton,
  Badge,
  Tooltip,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  LinearProgress,
  Alert } from '@mui/material';
import { Notifications as NotificationsIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CloudQueue as CloudIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon } from '@mui/icons-material';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface SystemNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const SAMPLE_METRICS: SystemMetric[] = [
  {
    id: 'cpu',
    name: 'CPU Usage',
    value: 23,
    unit: '%',
    status: 'normal',
    trend: 'stable',
  },
  {
    id: 'memory',
    name: 'Memory Usage',
    value: 67,
    unit: '%',
    status: 'normal',
    trend: 'up',
  },
  {
    id: 'ai_agents',
    name: 'AI Agents Active',
    value: 1008,
    unit: 'agents',
    status: 'normal',
    trend: 'stable',
  },
  {
    id: 'quantum_performance',
    name: 'Quantum Performance',
    value: 379000000,
    unit: '× faster',
    status: 'normal',
    trend: 'up',
  },
  {
    id: 'response_time',
    name: 'Avg Response Time',
    value: 0.47,
    unit: 'ms',
    status: 'normal',
    trend: 'down',
  },
];

const SAMPLE_NOTIFICATIONS: SystemNotification[] = [
  {
    id: '1',
    type: 'success',
    title: 'AI Swarm Optimization Complete',
    message: 'All 1,008 AI agents successfully optimized for 379M× performance improvement',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
  },
  {
    id: '2',
    type: 'info',
    title: 'Security Scan Complete',
    message: 'Daily security scan completed successfully - no vulnerabilities detected',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Database Connection Pool',
    message: 'Database connection pool at 80% capacity',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: true,
  },
  {
    id: '4',
    type: 'success',
    title: 'Module Launch',
    message: 'CostForge AI module launched successfully',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    read: true,
  },
];

export const SystemTray: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>(SAMPLE_METRICS);
  const [notifications, setNotifications] = useState<SystemNotification[]>(SAMPLE_NOTIFICATIONS);
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);
  const [metricsAnchor, setMetricsAnchor] = useState<HTMLElement | null>(null);

  // Simulate real-time metric updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((metric) => ({
          ...metric,
          value:
            metric.id === 'cpu'
              ? Math.max(10, Math.min(90, metric.value + (Math.random() - 0.5) * 10))
              : metric.id === 'memory'
                ? Math.max(40, Math.min(95, metric.value + (Math.random() - 0.5) * 5))
                : metric.id === 'response_time'
                  ? Math.max(0.1, Math.min(2.0, metric.value + (Math.random() - 0.5) * 0.2))
                  : metric.value,
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.read);

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleMetricsClick = (event: React.MouseEvent<HTMLElement>) => {
    setMetricsAnchor(event.currentTarget);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon color='success' />;
      case 'warning':
        return <WarningIcon color='warning' />;
      case 'error':
        return <ErrorIcon color='error' />;
      default:
        return <InfoIcon color='info' />;
    }
  };

  const formatValue = (metric: SystemMetric) => {
    if (metric.id === 'quantum_performance') {
      return `${(metric.value / 1000000).toFixed(0)}M${metric.unit}`;
    }
    return `${typeof metric.value === 'number' ? metric.value.toFixed(metric.id === 'response_time' ? 2 : 0) : metric.value}${metric.unit}`;
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1300,
        display: 'flex',
        gap: 1,
      }}
    >
      {/* System Metrics */}
      <Tooltip title='System Metrics'>
        <IconButton
          onClick={handleMetricsClick}
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': { boxShadow: 4 },
          }}
        >
          <SpeedIcon />
        </IconButton>
      </Tooltip>

      {/* Notifications */}
      <Tooltip title='Notifications'>
        <IconButton
          onClick={handleNotificationClick}
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': { boxShadow: 4 },
          }}
        >
          <Badge badgeContent={unreadNotifications.length} color='error'>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Metrics Popover */}
      <Popover
        open={Boolean(metricsAnchor)}
        anchorEl={metricsAnchor}
        onClose={() => setMetricsAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ p: 2, minWidth: 320 }}>
          <Typography
            variant='h6'
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <SpeedIcon />
            System Metrics
          </Typography>

          <List
dense>
            {metrics.map((metric) => (
              <ListItem key={metric.id} sx={{ px: 0 }}>
                <ListItemIcon>
                  {metric.id === 'cpu' && <MemoryIcon />}
                  {metric.id === 'memory' && <MemoryIcon />}
                  {metric.id === 'ai_agents' && <SecurityIcon />}
                  {metric.id === 'quantum_performance' && <SpeedIcon />}
                  {metric.id === 'response_time' && <CloudIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={metric.name}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography variant='body2' component='span'>
                        {formatValue(metric)}
                      </Typography>
                      <Chip
label={metric.status}
                        size='small'
                        color={getStatusColor(metric.status) as any}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ mt: 2 }}>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Terrafusion OS Status: All Systems Operational
            </Typography>
            <LinearProgress
variant='determinate'
              value={95}
              color='success'
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Paper>
      </Popover>

      {/* Notifications Popover */}
      <Popover
        open={Boolean(notificationAnchor)}
        anchorEl={notificationAnchor}
        onClose={() => setNotificationAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ minWidth: 360, maxWidth: 400 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant='h6' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon />
              System Notifications
              {unreadNotifications.length > 0 && (
                <Chip label={`${unreadNotifications.length} new`} size='small' color='primary' />
              )}
            </Typography>
          </Box>

          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {notifications.length === 0 ? (
              <ListItem>
                <ListItemText primary='No notifications' secondary="You're all caught up!" />
              </ListItem>
            ) : (
              notifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  button
                  onClick={() => markNotificationAsRead(notification.id)}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
                  <ListItemText
primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant='subtitle2'>{notification.title}</Typography>
                        {!notification.read && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant='body2' sx={{ mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography
variant='caption' color='text.secondary'>
                          {notification.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>

          {notifications.length > 0 && (
            <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant='caption' color='text.secondary'>
                {notifications.length} total notifications
              </Typography>
            </Box>
          )}
        </Paper>
      </Popover>
    </Box>
  );
};
