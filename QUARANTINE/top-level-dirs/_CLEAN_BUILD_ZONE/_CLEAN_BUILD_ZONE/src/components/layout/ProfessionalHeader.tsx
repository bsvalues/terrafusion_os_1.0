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
  Avatar
} from '@mui/material';
import { Notifications,
  AccountCircle,
  Business,
  Analytics,
  Security,
  CloudQueue } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.95), rgba(0, 210, 255, 0.85))',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(0, 210, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 210, 255, 0.1)',
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  background: 'rgba(0, 255, 170, 0.15)',
  color: '#00ffaa',
  border: '1px solid rgba(0, 255, 170, 0.3)',
  fontWeight: 600,
  '& .MuiChip-icon': {
    color: '#00ffaa',
  },
}));

const SystemStats = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  alignItems: 'center',
}));

const ProfessionalHeader: React.FC = () => {
  return (
    <StyledAppBar position="static" elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
        <LogoContainer>
          <Box
            sx={{
              width: 48,
              height: 48,
              background: 'linear-gradient(135deg, #00d2ff, #667eea)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0, 210, 255, 0.3)',
            }}
          >


            <Business sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box

>


            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: 'white',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                letterSpacing: '-0.5px',
              }}
            >
              Terrafusion OS
            </Typography>
            <Typography

variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
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
          <StatusChip
            icon={<CloudQueue />}
            label="1,008 AI Agents Active"
            size="small"
          />
          <StatusChip
            icon={<Analytics />}
            label="County System Online"
            size="small"
          />


          <StatusChip
            icon={<Security />}
            label="FISMA Compliant"
            size="small"
          />
        </SystemStats>

        <Box

sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>


          <Button
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                background: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Admin Portal
          </Button>
          
          <IconButton

sx={{ color: 'white' }}>
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <Avatar
            sx={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
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
