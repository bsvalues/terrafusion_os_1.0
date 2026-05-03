import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Notifications,
  Business,
  Analytics,
  Security,
  CloudQueue,
  Warning,
} from '@mui/icons-material';
import { alpha, styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  /* HS Channel Anchors (file-local, professional-header palette) */
  '--tf-prh-cyan-hs': '191 100%',
  '--tf-prh-teal-hs': '192 91%',
  '--tf-prh-neutral-hs': '0 0%',
  background: 'linear-gradient(135deg, hsl(var(--tf-prh-teal-hs) 36% / 0.95), hsl(var(--tf-prh-cyan-hs) 50% / 0.85))',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid hsl(var(--tf-prh-cyan-hs) 50% / 0.2)',
  boxShadow: '0 8px 32px hsl(var(--tf-prh-cyan-hs) 50% / 0.1)',
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  background: alpha(theme.palette.warning.main, 0.14),
  color: theme.palette.warning.dark,
  border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
  fontWeight: 600,
  '& .MuiChip-icon': {
    color: theme.palette.warning.dark,
  },
}));

const SystemStats = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  alignItems: 'center',
}));

const ProfessionalHeader: React.FC = () => {
  const statusChips = [
    {
      icon: <CloudQueue />,
      label: 'Runtime status unavailable',
      testId: 'professional-header-runtime-status',
    },
    {
      icon: <Analytics />,
      label: 'County connectivity unverified',
      testId: 'professional-header-county-status',
    },
    {
      icon: <Security />,
      label: 'Compliance state unavailable',
      testId: 'professional-header-compliance-status',
    },
  ];

  return (
    <StyledAppBar position='static' elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
        <LogoContainer>
          <Box
            sx={{
              width: 48,
              height: 48,
              background: 'linear-gradient(135deg, var(--tf-transcend-cyan), var(--tf-accent-quantum))',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px hsl(var(--tf-prh-cyan-hs) 50% / 0.3)',
            }}
          >
            <Business sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography
              variant='h5'
              sx={{
                fontWeight: 700,
                color: 'white',
                textShadow: '0 2px 8px hsl(var(--tf-prh-neutral-hs) 0% / 0.3)',
                letterSpacing: '-0.5px',
              }}
            >
              Terrafusion OS
            </Typography>
            <Typography
              variant='caption'
              sx={{
                color: 'hsl(var(--tf-prh-neutral-hs) 100% / 0.8)',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Governed Operator Surface
            </Typography>
          </Box>
        </LogoContainer>

        <SystemStats>
          {statusChips.map((statusChip) => (
            <StatusChip
              key={statusChip.label}
              icon={statusChip.icon}
              label={statusChip.label}
              size='small'
              data-testid={statusChip.testId}
            />
          ))}
        </SystemStats>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant='outlined'
            disabled
            sx={{
              color: 'white',
              borderColor: 'hsl(var(--tf-prh-neutral-hs) 100% / 0.3)',
              '&:hover': {
                borderColor: 'hsl(var(--tf-prh-neutral-hs) 100% / 0.5)',
                background: 'hsl(var(--tf-prh-neutral-hs) 100% / 0.1)',
              },
            }}
          >
            Operator Access Pending
          </Button>

          <IconButton sx={{ color: 'white' }} aria-label='Notifications unavailable'>
            <Notifications />
          </IconButton>

          <Avatar
            sx={{
              background: 'linear-gradient(135deg, var(--tf-accent-quantum), var(--tf-accent-quantum))',
              ml: 1,
            }}
          >
            <Warning />
          </Avatar>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default ProfessionalHeader;
