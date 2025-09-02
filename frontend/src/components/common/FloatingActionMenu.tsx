import React, { useState } from 'react';
import {
  Box,
  SpeedDial,
  SpeedDialAction
} from '@mui/material';
import { Add,
  Business,
  Search,
  Analytics,
  Security,
  CloudDownload } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledSpeedDial = styled(SpeedDial)(() => ({
  position: 'fixed',
  bottom: 32,
  right: 32,
  zIndex: 1300,
  '& .MuiFab-primary': {
    background: 'linear-gradient(135deg, #00d2ff, #667eea)',
    color: 'white',
    width: 64,
    height: 64,
    boxShadow: '0 8px 32px rgba(0, 210, 255, 0.4)',
    '&:hover': {
      background: 'linear-gradient(135deg, #0891b2, #00d2ff)',
      boxShadow: '0 12px 40px rgba(0, 210, 255, 0.6)',
      transform: 'scale(1.1)',
    },
  },
  '& .MuiSpeedDialAction-fab': {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 210, 255, 0.2)',
    color: 'white',
    '&:hover': {
      background: 'rgba(0, 210, 255, 0.2)',
      border: '1px solid rgba(0, 210, 255, 0.4)',
      transform: 'scale(1.1)',
    },
  },
}));

interface FloatingActionMenuProps {
  onNewAssessment?: () => void;
  onSearch?: () => void;
  onAnalytics?: () => void;
  onSecurity?: () => void;
  onExport?: () => void;
}

const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  onNewAssessment,
  onSearch,
  onAnalytics,
  onSecurity,
  onExport
}) => {
  const [open, setOpen] = useState(false);

  const actions = [
    {
      icon: <Business />,
      name: 'New Property Assessment',
      onClick: onNewAssessment,
      color: '#0891b2'
    },
    {
      icon: <Search />,
      name: 'Search Properties',
      onClick: onSearch,
      color: '#00d2ff'
    },
    {
      icon: <Analytics />,
      name: 'View Analytics',
      onClick: onAnalytics,
      color: '#667eea'
    },
    {
      icon: <Security />,
      name: 'Security Dashboard',
      onClick: onSecurity,
      color: '#00ffaa'
    },
    {
      icon: <CloudDownload />,
      name: 'Export Data',
      onClick: onExport,
      color: '#ffa500'
    }
  ];

  return (
    <StyledSpeedDial
      ariaLabel="Quick Actions"
      icon={<Add className="tf-rotate-glow" />}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      direction="up"
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={
            <Box 
              className="tf-scale-in"
              sx={{ 
                color: action.color,
                transition: 'all 0.3s ease',
                '&:hover': {
                  filter: `drop-shadow(0 0 10px ${action.color})`,
                }
              }}
            >
              {action.icon}
            </Box>
          }
          tooltipTitle={action.name}
          onClick={() => {
            action.onClick?.();
            setOpen(false);
          }}
          sx={{
            '& .MuiSpeedDialAction-staticTooltip': {
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 210, 255, 0.2)',
              borderRadius: '8px',
            }
          }}
        />
      ))}
    </StyledSpeedDial>
  );
};

export default FloatingActionMenu;