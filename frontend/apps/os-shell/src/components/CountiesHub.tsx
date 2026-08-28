import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Launch as LaunchIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ShieldOutlined as ShieldIcon,
} from '@mui/icons-material';
import activateModule from '../orchestration/moduleActivation';
import {
  getWashingtonSalesReviewCapability,
  isWashingtonSalesReviewLaunchEnabled,
} from '../pages/forge/sales/washingtonSalesReviewCapability';
import {
  fetchWashingtonCountyStatus,
  type WashingtonCountyStatusEntry,
} from '../services/washingtonCountyLaunch';

const EXPECTED_WASHINGTON_COUNTIES = 39;

function formatStatus(value: string | null | undefined): string {
  if (!value) return 'Not reported';
  return value.replaceAll('_', ' ');
}

const CountiesHub = () => {
  const [counties, setCounties] = useState<WashingtonCountyStatusEntry[]>([]);
  const [selectedCountyCode, setSelectedCountyCode] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const launchDataEnabled = isWashingtonSalesReviewLaunchEnabled();

  const loadCounties = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(null);
    try {
      const observedCounties = await fetchWashingtonCountyStatus(signal);
      if (signal?.aborted) return;
      setCounties(observedCounties);
      setSelectedCountyCode((current) =>
        current && observedCounties.some((county) => county.countyCode === current)
          ? current
          : null,
      );
    } catch (error) {
      if (signal?.aborted) return;
      setCounties([]);
      setSelectedCountyCode(null);
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Washington county status could not be loaded.',
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadCounties(controller.signal);
    return () => controller.abort();
  }, [loadCounties]);

  const selectedCounty = useMemo(
    () => counties.find((county) => county.countyCode === selectedCountyCode) ?? null,
    [counties, selectedCountyCode],
  );
  const selectedCapability = useMemo(
    () => selectedCounty ? getWashingtonSalesReviewCapability(selectedCounty) : null,
    [selectedCounty],
  );

  const filteredCounties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return counties;
    return counties.filter((county) =>
      county.county.toLowerCase().includes(normalizedQuery)
      || county.countyCode.includes(normalizedQuery)
      || county.primarySourceMode.toLowerCase().includes(normalizedQuery),
    );
  }, [counties, query]);

  const launchSelectedCounty = useCallback(async () => {
    if (!selectedCounty || !selectedCapability?.eligible || !launchDataEnabled) {
      return;
    }

    setLaunching(true);
    setLaunchError(null);
    try {
      await activateModule('sales-forge', {
        source: 'system',
        metadata: {
          countyCode: selectedCounty.countyCode,
          countyName: selectedCounty.county,
          resetValuationScope: true,
          launchContext: 'washington-counties-hub',
          dataTrustTier: 'public-reference-not-county-certified',
        },
      });
    } catch (error) {
      setLaunchError(
        error instanceof Error ? error.message : 'TerraForge could not be opened.',
      );
    } finally {
      setLaunching(false);
    }
  }, [launchDataEnabled, selectedCapability, selectedCounty]);

  return (
    <Box
      data-testid='counties-hub'
      sx={{ height: '100%', overflow: 'auto', p: { xs: 2, md: 4 } }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant='h4' component='h1' gutterBottom>
            Washington Counties Hub
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ maxWidth: 900 }}>
            Inspect the governed public/reference data posture for a Washington county, then open
            the supported TerraForge sales-review workflow in that explicit navigation context.
          </Typography>
        </Box>

        <Alert severity='info' icon={<ShieldIcon fontSize='inherit' />}>
          County selection here is navigation context only. It does not grant county authority, and
          displayed launch data is not county-certified valuation truth. Protected operations remain
          bound to the authenticated county session.
        </Alert>

        {loading && (
          <Stack
            role='status'
            aria-live='polite'
            alignItems='center'
            justifyContent='center'
            spacing={2}
            sx={{ minHeight: 220 }}
          >
            <CircularProgress size={36} />
            <Typography color='text.secondary'>Loading governed Washington county status…</Typography>
          </Stack>
        )}

        {!loading && loadError && (
          <Alert
            severity='error'
            action={(
              <Button
                color='inherit'
                size='small'
                startIcon={<RefreshIcon />}
                onClick={() => void loadCounties()}
              >
                Retry
              </Button>
            )}
          >
            {loadError} No county readiness or capability claim is shown while the governed feed is
            unavailable.
          </Alert>
        )}

        {!loading && !loadError && (
          <>
            {counties.length !== EXPECTED_WASHINGTON_COUNTIES && (
              <Alert severity='warning'>
                The governed feed currently reports {counties.length} of{' '}
                {EXPECTED_WASHINGTON_COUNTIES} Washington counties. Missing counties remain
                explicitly unavailable rather than being synthesized.
              </Alert>
            )}

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', md: 'center' }}
              justifyContent='space-between'
            >
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Chip label={`${counties.length} observed county contexts`} color='primary' />
                <Chip label='Public/reference · not county-certified' variant='outlined' />
              </Stack>
              <TextField
                label='Find a county'
                size='small'
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                inputProps={{ 'aria-label': 'Find a Washington county' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon fontSize='small' />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: { xs: '100%', md: 320 } }}
              />
            </Stack>

            {selectedCounty ? (
              <Card variant='outlined' data-testid='selected-county-context'>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                      justifyContent='space-between'
                      alignItems={{ xs: 'stretch', sm: 'center' }}
                    >
                      <Box>
                        <Typography variant='overline' color='text.secondary'>
                          Selected navigation context
                        </Typography>
                        <Typography variant='h5'>
                          {selectedCounty.county} County
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Washington county code {selectedCounty.countyCode} · source{' '}
                          {formatStatus(selectedCounty.primarySourceMode)}
                        </Typography>
                      </Box>
                      <Button
                        variant='contained'
                        startIcon={<LaunchIcon />}
                        disabled={
                          launching
                          || !launchDataEnabled
                          || !selectedCapability?.eligible
                        }
                        onClick={() => void launchSelectedCounty()}
                      >
                        {launching ? 'Opening TerraForge…' : 'Review public sales in TerraForge'}
                      </Button>
                    </Stack>

                    <Divider />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>Observed records</Typography>
                        <Typography variant='body1'>{selectedCounty.stagedSales.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>Latest observed sale</Typography>
                        <Typography variant='body1'>{selectedCounty.latestSaleDate ?? 'Not reported'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>Records needing review</Typography>
                        <Typography variant='body1'>{selectedCounty.needsReview.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>Runtime posture</Typography>
                        <Typography variant='body1'>{formatStatus(selectedCounty.prometheusStatus)}</Typography>
                      </Grid>
                    </Grid>

                    {!launchDataEnabled && (
                      <Alert severity='warning'>
                        The Washington public launch package is not enabled in this environment, so
                        TerraForge cannot safely use this navigation context here.
                      </Alert>
                    )}
                    {!selectedCapability?.eligible && selectedCapability?.unavailableMessage && (
                      <Alert severity='warning'>
                        {selectedCapability.unavailableMessage}
                      </Alert>
                    )}
                    {launchError && <Alert severity='error'>{launchError}</Alert>}
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <Alert severity='info'>Select a county to establish navigation context.</Alert>
            )}

            <Grid
              container
              spacing={2}
              role='listbox'
              aria-label='Washington county navigation contexts'
            >
              {filteredCounties.map((county) => {
                const selected = county.countyCode === selectedCountyCode;
                const capability = getWashingtonSalesReviewCapability(county);
                return (
                  <Grid item xs={12} sm={6} lg={4} key={county.countyCode}>
                    <Card
                      variant='outlined'
                      sx={{
                        height: '100%',
                        borderColor: selected ? 'primary.main' : undefined,
                        borderWidth: selected ? 2 : 1,
                      }}
                    >
                      <CardActionArea
                        role='option'
                        aria-selected={selected}
                        aria-label={`Select ${county.county} County`}
                        onClick={() => {
                          setSelectedCountyCode(county.countyCode);
                          setLaunchError(null);
                        }}
                        sx={{ height: '100%', alignItems: 'stretch' }}
                      >
                        <CardContent>
                          <Stack spacing={1.5}>
                            <Stack direction='row' justifyContent='space-between' spacing={1}>
                              <Box>
                                <Typography variant='h6'>{county.county} County</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  WA-{county.countyCode}
                                </Typography>
                              </Box>
                              <Chip
                                size='small'
                                color={capability.eligible ? 'success' : 'default'}
                                label={capability.statusLabel}
                              />
                            </Stack>
                            <Typography variant='body2' color='text.secondary'>
                              Source: {formatStatus(county.primarySourceMode)}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              Freshness: {county.latestSaleDate ?? 'Not reported'}
                            </Typography>
                            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                              <Chip
                                size='small'
                                variant='outlined'
                                label={formatStatus(county.confidence.rawStatus)}
                              />
                              {county.confidence.rawDriftDetected && (
                                <Chip size='small' color='warning' label='Source drift reported' />
                              )}
                            </Stack>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {filteredCounties.length === 0 && (
              <Alert severity='info'>No observed Washington county matches “{query}”.</Alert>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
};

export default CountiesHub;
