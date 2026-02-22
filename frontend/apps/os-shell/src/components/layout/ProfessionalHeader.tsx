import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Badge,
  Avatar,
} from '@mui/material';
import {
  Notifications,
  AccountCircle,
  Business,
  Analytics,
  Security,
  CloudQueue,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  /* HS Channel Anchors (file-local, professional-header palette) */
  '--tf-prh-cyan-hs': '191 100%',
  '--tf-prh-teal-hs': '192 91%',
  '--tf-prh-green-hs': '160 100%',
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
  background: 'hsl(var(--tf-prh-green-hs) 50% / 0.15)',
  color: 'var(--tf-accent-success)',
  border: '1px solid hsl(var(--tf-prh-green-hs) 50% / 0.3)',
  fontWeight: 600,
  '& .MuiChip-icon': {
    color: 'var(--tf-accent-success)',
  },
}));

const SystemStats = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  alignItems: 'center',
}));

const ProfessionalHeader: React.FC = () => {
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
              Government. Transcended.
            </Typography>
          </Box>
        </LogoContainer>

        <SystemStats>
          <StatusChip icon={<CloudQueue />} label='1,008 AI Agents Active' size='small' />
          <StatusChip icon={<Analytics />} label='County System Online' size='small' />

          <StatusChip icon={<Security />} label='FISMA Compliant' size='small' />
        </SystemStats>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant='outlined'
            sx={{
              color: 'white',
              borderColor: 'hsl(var(--tf-prh-neutral-hs) 100% / 0.3)',
              '&:hover': {
                borderColor: 'hsl(var(--tf-prh-neutral-hs) 100% / 0.5)',
                background: 'hsl(var(--tf-prh-neutral-hs) 100% / 0.1)',
              },
            }}
          >
            Admin Portal
          </Button>

          <IconButton sx={{ color: 'white' }}>
            <Badge badgeContent={3} color='error'>
              <Notifications />
            </Badge>
          </IconButton>

          <Avatar
            sx={{
              background: 'linear-gradient(135deg, var(--tf-accent-quantum), var(--tf-accent-quantum))',
              ml: 1,
            }}
          >
            <AccountCircle />
          </Avatar>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default ProfessionalHeader;
