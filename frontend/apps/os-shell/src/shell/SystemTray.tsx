import { Memory, Notifications, Speed } from '@mui/icons-material';
import { Box, Chip, Typography } from '@mui/material';
import React from 'react';

import { useSystemHealth } from '../hooks/useSystemHealth';

export const SystemTray: React.FC = () => {
  const { systemHealth } = useSystemHealth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        background: 'hsl(var(--tf-neutral-hs) 0% / 0.9)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        borderTop: '1px solid hsl(var(--tf-neutral-hs) 100% / 0.1)',
        zIndex: 1000,
      }}
    >
      {/* Left side - System info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant='caption' sx={{ color: 'hsl(var(--tf-neutral-hs) 100% / 0.7)' }}>
          Terrafusion OS 1.0
        </Typography>
        <Chip
          icon={<Memory />}
          label={`${systemHealth.activeModules}/${systemHealth.totalModules} modules`}
          size='small'
          color='primary'
          variant='outlined'
        />
      </Box>

      {/* Center - Active modules count */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant='caption' sx={{ color: 'hsl(var(--tf-neutral-hs) 100% / 0.7)' }}>
          {new Date().toLocaleTimeString()}
        </Typography>
      </Box>

      {/* Right side - System health */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={<Memory />}
          label={`${systemHealth.memory}MB`}
          size='small'
          color={getStatusColor(systemHealth.memoryStatus)}
          variant='outlined'
        />
        <Chip
          icon={<Speed />}
          label={`${systemHealth.cpu}%`}
          size='small'
          color={getStatusColor(systemHealth.cpuStatus)}
          variant='outlined'
        />
        {systemHealth.notifications > 0 && (
          <Chip
            icon={<Notifications />}
            label={systemHealth.notifications}
            size='small'
            color='warning'
            variant='outlined'
          />
        )}
      </Box>
    </Box>
  );
};
