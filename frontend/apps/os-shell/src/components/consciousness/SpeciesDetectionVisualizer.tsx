import React from 'react';
import {
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(() => ({
  background: 'hsl(var(--tf-text) / 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid hsl(var(--tf-info) / 0.2)',
  borderRadius: '16px',
  height: '100%',
}));

const SpeciesDetectionVisualizer: React.FC = () => {
  return (
    <StyledCard data-testid='species-detection-visualizer-unavailable'>
      <CardContent>
        <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
          <Typography variant='h6' sx={{ color: 'var(--tf-accent-quantum)', fontWeight: 600 }}>
            Species Detection Service
          </Typography>
          <Chip label='Unavailable' color='warning' size='small' />
        </Stack>

        <Typography variant='subtitle1' sx={{ color: 'white', fontWeight: 600, mb: 1.5 }}>
          Species detection feed unavailable
        </Typography>

        <Typography variant='body2' sx={{ color: 'hsl(var(--tf-text-primary-hs) 100% / 0.8)', mb: 1.5 }}>
          No governed species-detection feed is connected to this operator surface.
        </Typography>

        <Typography variant='body2' sx={{ color: 'hsl(var(--tf-text-primary-hs) 100% / 0.7)', mb: 1.5 }}>
          Live entity detection claims are withheld until a real provider with provenance, retention, and operator evidence is attached.
        </Typography>

        <Typography variant='caption' sx={{ color: 'hsl(var(--tf-text-primary-hs) 100% / 0.6)' }}>
          Synthetic detection polling has been removed from the mounted dashboard.
        </Typography>
      </CardContent>
    </StyledCard>
  );
};

export default SpeciesDetectionVisualizer;
