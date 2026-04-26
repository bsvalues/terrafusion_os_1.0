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
  background: 'hsl(var(--tf-neutral-hs) 100% / 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid hsl(var(--tf-primary-hs) 70% / 0.2)',
  borderRadius: '16px',
  height: '100%',
}));

const UniversalTranslationInterface: React.FC = () => {
  return (
    <StyledCard data-testid='universal-translation-interface-unavailable'>
      <CardContent>
        <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
          <Typography variant='h6' sx={{ color: 'var(--tf-accent-quantum)', fontWeight: 600 }}>
            Universal Translation Protocol
          </Typography>
          <Chip label='Unavailable' color='warning' size='small' />
        </Stack>

        <Typography variant='subtitle1' sx={{ color: 'white', fontWeight: 600, mb: 1.5 }}>
          Translation provider unavailable
        </Typography>

        <Typography variant='body2' sx={{ color: 'hsl(var(--tf-neutral-hs) 100% / 0.8)', mb: 1.5 }}>
          No governed consciousness translation provider is connected to this operator surface.
        </Typography>

        <Typography variant='body2' sx={{ color: 'hsl(var(--tf-neutral-hs) 100% / 0.7)', mb: 1.5 }}>
          Legacy translation requests are blocked because that contract is not part of the active runtime.
        </Typography>

        <Typography variant='caption' sx={{ color: 'hsl(var(--tf-neutral-hs) 100% / 0.6)' }}>
          Use county-scoped assistant workflows and governed evidence paths instead of synthetic cross-species translation claims.
        </Typography>
      </CardContent>
    </StyledCard>
  );
};

export default UniversalTranslationInterface;
