import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip, IconButton, Tooltip } from '@mui/material';
import {
  AccountBalance,
  Assessment,
  Build,
  Dashboard,
  Engineering,
  Gavel,
  Home,
  Insights,
  LocationOn,
  Memory,
  Psychology,
  Public,
  Search,
  Security,
  Settings,
  Speed,
  Storage,
  Timeline,
  Visibility,
  Web,
} from '@mui/icons-material';

interface Module {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  tier: 'Tier1' | 'Tier2' | 'Tier3';
  status: 'active' | 'inactive' | 'loading' | 'error';
  version: string;
  iconPath?: string;
}

interface ModuleLauncherProps {
  modules: Module[];
  onModuleLaunch: (moduleId: string) => void;
}

const getModuleIcon = (moduleName: string) => {
  const iconMap: Record<string, React.ReactElement> = {
    'government-edition': <AccountBalance />,
    'costforge-ai-champion': <Psychology />,
    'marketplace-champion': <Dashboard />,
    'ai-command-brain': <Memory />,
    'terra-agent-champion': <Engineering />,
    'terra-flow-champion': <Timeline />,
    gispro: <LocationOn />,
    'terra-fusion-assessor': <Assessment />,
    'terra-levy': <Gavel />,
    'web-audit-tracker': <Web />,
    'commercial-suite': <Build />,
    development: <Settings />,
    'costforge-ai': <Insights />,
    'terra-agent': <Home />,
    'terra-collections': <Storage />,
    'terra-flow': <Speed />,
    'terra-fusion-dashboard': <Visibility />,
    'terra-fusion-sync': <Public />,
    'terra-insight': <Search />,
    'terra-miner': <Security />,
  };

  return iconMap[moduleName] || <Dashboard />;
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'Tier1':
      return 'error';
    case 'Tier2':
      return 'warning';
    case 'Tier3':
      return 'info';
    default:
      return 'default';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'loading':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
};

export const ModuleLauncher: React.FC<ModuleLauncherProps> = ({ modules, onModuleLaunch }) => {
  const tier1Modules = modules.filter((m) => m.tier === 'Tier1');
  const tier2Modules = modules.filter((m) => m.tier === 'Tier2');
  const tier3Modules = modules.filter((m) => m.tier === 'Tier3');

  const ModuleCard: React.FC<{ module: Module }> = ({ module }) => (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Card
        sx={{
          background: 'color-mix(in srgb, var(--tf-text-primary) 10%, transparent)',
          backdropFilter: 'blur(10px)',
          border: '1px solid color-mix(in srgb, var(--tf-text-primary) 20%, transparent)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'color-mix(in srgb, var(--tf-text-primary) 20%, transparent)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 32px color-mix(in srgb, var(--tf-text-primary) 30%, transparent)',
          },
        }}
        onClick={() => onModuleLaunch(module.id)}
      >
        <CardContent sx={{ textAlign: 'center', p: 2 }}>
          <Box sx={{ mb: 2 }}>
            <IconButton
              sx={{
                bgcolor: 'color-mix(in srgb, var(--tf-text-primary) 20%, transparent)',
                color: 'white',
                mb: 1,
                '&:hover': { bgcolor: 'color-mix(in srgb, var(--tf-text-primary) 30%, transparent)' },
              }}
              size='large'
            >
              {getModuleIcon(module.name)}
            </IconButton>
          </Box>

          <Typography variant='subtitle1' gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
            {module.displayName}
          </Typography>

          {module.description && (
            <Typography variant='body2' sx={{ color: 'color-mix(in srgb, var(--tf-text-primary) 70%, transparent)', mb: 1 }}>
              {module.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 1 }}>
            <Chip label={module.tier} size='small' color={getTierColor(module.tier)} />

            <Chip label={module.status} size='small' color={getStatusColor(module.status)} />
          </Box>

          <Typography variant='caption' sx={{ color: 'color-mix(in srgb, var(--tf-text-primary) 50%, transparent)' }}>
            v{module.version}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ mt: 4 }}>
      {/* Tier 1 - Core Government */}
      {tier1Modules.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant='h5' gutterBottom sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
            Core Government Applications
          </Typography>
          <Grid container spacing={2}>
            {tier1Modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </Grid>
        </Box>
      )}

      {/* Tier 2 - Essential Operations */}
      {tier2Modules.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant='h5' gutterBottom sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
            Essential Operations
          </Typography>
          <Grid container spacing={2}>
            {tier2Modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </Grid>
        </Box>
      )}

      {/* Tier 3 - Extended Features */}
      {tier3Modules.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant='h5' gutterBottom sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
            Extended Features
          </Typography>
          <Grid container spacing={2}>
            {tier3Modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

