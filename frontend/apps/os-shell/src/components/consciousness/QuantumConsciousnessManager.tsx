import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(() => ({
  background:
    'linear-gradient(135deg, hsl(var(--tf-accent-quantum-hs) 16% / 0.1), hsl(var(--tf-accent-quantum-hs) 8% / 0.2))',
  backdropFilter: 'blur(20px)',
  border: '1px solid hsl(var(--tf-accent-quantum-hs) 79% / 0.2)',
  borderRadius: '16px',
  height: '100%',
}));

const QuantumConsciousnessManager: React.FC = () => {
  return (
    <StyledCard data-testid='quantum-consciousness-manager-unavailable'>
      <CardContent>
        <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
          <Typography variant='h6' sx={{ color: 'var(--tf-accent-quantum)', fontWeight: 600 }}>
            Quantum Consciousness Manager
          </Typography>
          <Chip label='Unavailable' color='warning' size='small' />
        </Stack>

        <Typography variant='subtitle1' sx={{ color: 'white', fontWeight: 600, mb: 1.5 }}>
          Parameter tuning unavailable
        </Typography>

        <Typography variant='body2' sx={{ color: 'hsl(var(--tf-text-primary-hs) 100% / 0.8)', mb: 1.5 }}>
          No governed consciousness manager-state contract is connected to this operator surface.
        </Typography>

        <Typography variant='body2' sx={{ color: 'hsl(var(--tf-text-primary-hs) 100% / 0.7)', mb: 2 }}>
          Live tuning actions are blocked because the available backend consciousness services still rely on synthetic assumptions and hardcoded swarm counts.
        </Typography>

        <Box sx={{ display: 'grid', gap: 1 }}>
          <Typography variant='caption' sx={{ color: 'hsl(var(--tf-text-primary-hs) 100% / 0.6)' }}>
            Protocol changes require governed execution.
          </Typography>
          <Typography variant='caption' sx={{ color: 'hsl(var(--tf-text-primary-hs) 100% / 0.6)' }}>
            Metrics remain withheld until provider evidence and provenance are connected.
          </Typography>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default QuantumConsciousnessManager;
