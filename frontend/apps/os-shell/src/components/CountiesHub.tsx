import React, { useMemo, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import {
  CloudOff as CloudOffIcon,
  Hub as HubIcon,
  Lan as LanIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import {
  WASHINGTON_COUNTY_RUNTIME_POSTURES,
  getCountyRuntimePosture,
} from '../config/countyRuntimePosture';

const UNAVAILABLE_SECTIONS = [
  {
    title: 'County registry not connected',
    detail:
      'This module is not wired to the governed Washington county acquisition registry, so county readiness tables and adapter-family coverage are not rendered here.',
    icon: <HubIcon color='warning' />,
  },
  {
    title: 'Readiness metrics withheld',
    detail:
      'Parcel totals, budget totals, integration percentages, and source-system classifications are suppressed until the canonical county control plane is attached.',
    icon: <LanIcon color='warning' />,
  },
  {
    title: 'Migration actions blocked',
    detail:
      'County migration initiation and drilldown actions remain unavailable because this surface has no governed execution path or evidence trail.',
    icon: <MapIcon color='warning' />,
  },
];

const CountiesHub: React.FC = () => {
  const [selectedCountySlug, setSelectedCountySlug] = useState('yakima');
  const selectedPosture = getCountyRuntimePosture(selectedCountySlug);
  const runtimeEnabledCount = useMemo(
    () => WASHINGTON_COUNTY_RUNTIME_POSTURES.filter((posture) => posture.runtimeActionsAllowed).length,
    []
  );
  const intakeCount = WASHINGTON_COUNTY_RUNTIME_POSTURES.length - runtimeEnabledCount;

  return (
    <Box sx={{ p: 4 }} data-testid='counties-hub-unavailable'>
      <Typography variant='h4' gutterBottom sx={{ mb: 2 }}>
        Washington County Integration Hub
      </Typography>

      <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
        This surface is the governed Phase 4 county posture host. It exposes which Washington
        counties are runtime-enabled now and which remain source/provenance/onboarding/intake only.
      </Typography>

      <Alert severity='warning' icon={<CloudOffIcon fontSize='inherit' />} sx={{ mb: 3 }}>
        Counties Hub does not display seeded county readiness counts, seeded parcel totals, or
        seeded migration claims. It only displays the governed runtime/intake posture boundary.
      </Alert>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Chip label='Runtime posture governed' color='primary' variant='outlined' />
        <Chip label='Readiness scores withheld' color='warning' variant='outlined' />
        <Chip label='Non-Benton runtime blocked' color='warning' variant='outlined' />
      </Box>

      <Card
        variant='outlined'
        sx={{ mb: 3 }}
        data-testid='county-runtime-posture-summary'
        data-total-counties={String(WASHINGTON_COUNTY_RUNTIME_POSTURES.length)}
        data-runtime-enabled-count={String(runtimeEnabledCount)}
        data-source-intake-count={String(intakeCount)}
        data-benton-runtime-mode={getCountyRuntimePosture('benton').runtimeMode}
        data-intake-canonical-import-allowed='false'
      >
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Phase 4 runtime/source posture
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Typography variant='overline' color='text.secondary'>Washington counties</Typography>
              <Typography variant='h5'>39</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant='overline' color='text.secondary'>Runtime-enabled</Typography>
              <Typography variant='h5'>{runtimeEnabledCount}</Typography>
              <Typography variant='body2' color='text.secondary'>Benton County</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant='overline' color='text.secondary'>County Data Intake</Typography>
              <Typography variant='h5'>{intakeCount}</Typography>
              <Typography variant='body2' color='text.secondary'>Source/provenance/onboarding/intake</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant='overline' color='text.secondary'>Intake import boundary</Typography>
              <Typography variant='h5'>false</Typography>
              <Typography variant='body2' color='text.secondary'>canonicalImportAllowed for non-Benton counties</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card
        variant='outlined'
        sx={{ mb: 3 }}
        data-testid='county-runtime-posture-boundary'
        data-county-slug={selectedPosture.countySlug}
        data-runtime-mode={selectedPosture.runtimeMode}
        data-runtime-actions-allowed={String(selectedPosture.runtimeActionsAllowed)}
        data-canonical-import-allowed={String(selectedPosture.canonicalImportAllowed)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Box>
              <Typography variant='overline' color='text.secondary'>
                {selectedPosture.boundaryLabel}
              </Typography>
              <Typography variant='h6'>
                {selectedPosture.countyName} County
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 720 }}>
                {selectedPosture.sourcePosture}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`runtimeActionsAllowed: ${String(selectedPosture.runtimeActionsAllowed)}`} />
              <Chip label={`canonicalImportAllowed: ${String(selectedPosture.canonicalImportAllowed)}`} />
              <Chip label={selectedPosture.runtimeMode} color={selectedPosture.runtimeActionsAllowed ? 'success' : 'warning'} />
            </Box>
          </Box>
          <Typography variant='body2' sx={{ mt: 2 }}>
            {selectedPosture.nextAction}
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }} aria-label='County posture selector'>
        {WASHINGTON_COUNTY_RUNTIME_POSTURES.map((posture) => (
          <Button
            key={posture.countySlug}
            type='button'
            data-testid={`county-posture-option-${posture.countySlug}`}
            onClick={() => setSelectedCountySlug(posture.countySlug)}
            size='small'
            variant={posture.countySlug === selectedPosture.countySlug ? 'contained' : 'outlined'}
            color={posture.runtimeActionsAllowed ? 'success' : 'warning'}
            sx={{ textTransform: 'none' }}
          >
            {posture.countyName}
          </Button>
        ))}
      </Box>

      <Grid container spacing={3}>
        {UNAVAILABLE_SECTIONS.map((section) => (
          <Grid item xs={12} md={4} key={section.title}>
            <Card variant='outlined' sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {section.icon}
                  <Typography variant='h6'>{section.title}</Typography>
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  {section.detail}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CountiesHub;
