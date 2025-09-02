import React, { useState } from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
  Typography,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  actions?: AlertAction[];
  dismissed?: boolean;
}

interface AlertAction {
  label: string;
  action: () => void;
  variant?: 'contained' | 'outlined' | 'text';
}

interface AlertsPanelProps {
  alerts: AlertItem[];
  onDismiss?: (alertId: string) => void;
  maxVisible?: number;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onDismiss,
  maxVisible = 3
}) => {
  const [expanded, setExpanded] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const activeAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));
  const visibleAlerts = expanded ? activeAlerts : activeAlerts.slice(0, maxVisible);
  const hiddenCount = activeAlerts.length - maxVisible;

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
    onDismiss?.(alertId);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error.main';
      case 'high':
        return 'warning.main';
      case 'medium':
        return 'info.main';
      case 'low':
        return 'success.main';
      default:
        return 'grey.500';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'success':
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <Box>
      {visibleAlerts.map((alert) => (
        <Alert
          key={alert.id}
          severity={alert.type}
          sx={{ mb: 1 }}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={alert.severity.toUpperCase()}
                size="small"
                sx={{ bgcolor: getSeverityColor(alert.severity), color: 'white' }}
              />
              <IconButton
                size="small"
                onClick={() => handleDismiss(alert.id)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        ><>

          <AlertTitle>{alert.title}</AlertTitle>
          <Typography
</> variant="body2" sx={{ mb: 1 }}>
            {alert.message}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {alert.category} • {alert.timestamp.toLocaleTimeString()}
            </Typography>
            {alert.actions && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {alert.actions.map((action /* , index */) => (
                  <Button
                    key={index}
                    size="small"
                    variant={action.variant || 'outlined'}
                    onClick={action.action}
                  >
                    {action.label}
                  </Button>
                ))}
              </Box>
            )}
          </Box>
        </Alert>
      ))}

      {hiddenCount > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {expanded ? 'Show Less' : `Show ${hiddenCount} More Alerts`}
          </Button>
        </Box>
      )}
    </Box>
  );
};
