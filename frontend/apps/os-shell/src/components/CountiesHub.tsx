import { useCallback, useEffect, useMemo, useState } from 'react';
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
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CloudUploadOutlined as CloudUploadIcon,
  Launch as LaunchIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ShieldOutlined as ShieldIcon,
} from '@mui/icons-material';
import {
  getWashingtonPublicSourceInventory,
  matchesWashingtonPublicSourceQuery,
  WASHINGTON_PUBLIC_SOURCE_INVENTORY_GENERATED_AT,
  WASHINGTON_PUBLIC_SOURCE_INVENTORY_LIMITATION,
  type WashingtonPublicSourceInventoryEntry,
} from '../lib/washingtonPublicSourceInventory';
import activateModule from '../orchestration/moduleActivation';
import {
  getWashingtonSalesReviewCapability,
  isWashingtonSalesReviewLaunchEnabled,
  type WashingtonCountiesHubHandoff,
  type WashingtonSalesReviewCapability,
} from '../pages/forge/sales/washingtonSalesReviewCapability';
import { WASHINGTON_COUNTIES } from '../pages/forge/sales/washingtonLaunchApi';
import {
  resolveWashingtonCountyStatus,
  verifyWashingtonCountySalesShard,
  type WashingtonCountyStatusEntry,
} from '../services/washingtonCountyLaunch';
import {
  fetchCountyCsvUploadHistory,
  uploadCountyCsv,
  type CountyCsvDataset,
  type CountyCsvUploadHistory,
  type CountyCsvUploadReceipt,
} from '../services/countyCsvUpload';

const EXPECTED_WASHINGTON_COUNTIES = 39;

interface WashingtonCountyDirectoryEntry {
  county: string;
  countyCode: string;
  status: WashingtonCountyStatusEntry | null;
  capability: WashingtonSalesReviewCapability | null;
  identityMismatch: WashingtonCountyStatusEntry | null;
  publicSource: WashingtonPublicSourceInventoryEntry | null;
}

function formatStatus(value: string | null | undefined): string {
  if (!value) return 'Not reported';
  return value.trim().replaceAll('_', ' ');
}

function normalizeCountyName(value: string): string {
  return value
    .replace(/\s+county$/i, '')
    .trim()
    .toLowerCase();
}

function formatInventoryStatus(status: WashingtonPublicSourceInventoryEntry['status']): string {
  return status === 'adapter-ready' ? 'Acquisition path adapter-ready' : 'Source path researched';
}

function formatSnapshotDate(value: string | null): string {
  if (!value) return 'date not reported';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}

const CountiesHub = () => {
  const [counties, setCounties] = useState<WashingtonCountyStatusEntry[]>([]);
  const [selectedCountyCode, setSelectedCountyCode] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [uploadContextLoading, setUploadContextLoading] = useState(false);
  const [uploadContext, setUploadContext] = useState<CountyCsvUploadHistory | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDataset, setUploadDataset] = useState<CountyCsvDataset>('Sales');
  const [uploading, setUploading] = useState(false);
  const [uploadReceipt, setUploadReceipt] = useState<CountyCsvUploadReceipt | null>(null);
  const [countyStatusSource, setCountyStatusSource] =
    useState<WashingtonCountiesHubHandoff['referencePackageSource']>('repository-reference');
  const [usedRepositoryFallback, setUsedRepositoryFallback] = useState(false);
  const launchDataEnabled = isWashingtonSalesReviewLaunchEnabled({
    explicitReferenceHandoff: true,
  });

  const loadCounties = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(null);
    try {
      const resolution = await resolveWashingtonCountyStatus(signal);
      if (signal?.aborted) return;
      setCounties(resolution.counties);
      setCountyStatusSource(resolution.packageSource);
      setUsedRepositoryFallback(resolution.usedRepositoryFallback);
      setSelectedCountyCode((current) =>
        current && WASHINGTON_COUNTIES.some((county) => county.code === current) ? current : null
      );
    } catch (error) {
      if (signal?.aborted) return;
      setCounties([]);
      setUsedRepositoryFallback(false);
      setSelectedCountyCode(null);
      setLoadError(
        error instanceof Error ? error.message : 'Washington county status could not be loaded.'
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

  const { directory: countyDirectory, registryIssueStatuses } = useMemo<{
    directory: WashingtonCountyDirectoryEntry[];
    registryIssueStatuses: WashingtonCountyStatusEntry[];
  }>(() => {
    const canonicalNameByCode = new Map<string, string>(
      WASHINGTON_COUNTIES.map((county) => [county.code, county.name] as const)
    );
    const canonicalCodeByName = new Map<string, string>(
      WASHINGTON_COUNTIES.map((county) => [normalizeCountyName(county.name), county.code] as const)
    );
    const validatedStatusByCode = new Map<string, WashingtonCountyStatusEntry>();
    const identityMismatchByCode = new Map<string, WashingtonCountyStatusEntry>();
    const registryIssueStatuses: WashingtonCountyStatusEntry[] = [];

    for (const observedStatus of counties) {
      const canonicalName = canonicalNameByCode.get(observedStatus.countyCode);
      const canonicalCodeForName = canonicalCodeByName.get(
        normalizeCountyName(observedStatus.county)
      );

      if (
        canonicalName &&
        canonicalCodeForName === observedStatus.countyCode &&
        normalizeCountyName(observedStatus.county) === normalizeCountyName(canonicalName)
      ) {
        validatedStatusByCode.set(observedStatus.countyCode, observedStatus);
      } else {
        registryIssueStatuses.push(observedStatus);
        if (canonicalName) {
          identityMismatchByCode.set(observedStatus.countyCode, observedStatus);
        }
        if (canonicalCodeForName) {
          identityMismatchByCode.set(canonicalCodeForName, observedStatus);
        }
      }
    }

    const directory = WASHINGTON_COUNTIES.map((county) => {
      const identityMismatch = identityMismatchByCode.get(county.code) ?? null;
      const status = identityMismatch ? null : (validatedStatusByCode.get(county.code) ?? null);
      return {
        county: county.name,
        countyCode: county.code,
        status,
        capability: status ? getWashingtonSalesReviewCapability(status) : null,
        identityMismatch,
        publicSource: getWashingtonPublicSourceInventory(county.name),
      };
    });

    return { directory, registryIssueStatuses };
  }, [counties]);

  const selectedCounty = useMemo(
    () => countyDirectory.find((county) => county.countyCode === selectedCountyCode) ?? null,
    [countyDirectory, selectedCountyCode]
  );
  const selectedStatus = selectedCounty?.status ?? null;
  const selectedShardRetryAvailable =
    countyStatusSource === 'hosted' &&
    selectedStatus?.salesShardVerification === 'unavailable' &&
    Boolean(selectedStatus.staticRoutes.salesShard.trim());

  const retrySelectedCountySalesShard = useCallback(() => {
    if (!selectedStatus || !selectedShardRetryAvailable) return;
    const retryCountyCode = selectedStatus.countyCode;
    setCounties((current) =>
      current.map((status) =>
        status.countyCode === retryCountyCode
          ? { ...status, salesShardVerification: 'unverified' as const }
          : status
      )
    );
    setLaunchError(null);
  }, [selectedShardRetryAvailable, selectedStatus]);

  useEffect(() => {
    if (
      countyStatusSource !== 'hosted' ||
      !selectedStatus ||
      selectedStatus.salesShardVerification !== 'unverified'
    ) {
      return;
    }

    const controller = new AbortController();
    void verifyWashingtonCountySalesShard(selectedStatus, controller.signal)
      .then((verifiedStatus) => {
        if (controller.signal.aborted) return;
        setCounties((current) =>
          current.map((status) => (status === selectedStatus ? verifiedStatus : status))
        );
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setCounties((current) =>
          current.map((status) =>
            status === selectedStatus
              ? { ...status, salesShardVerification: 'unavailable' as const }
              : status
          )
        );
      });

    return () => controller.abort();
  }, [countyStatusSource, selectedStatus]);

  const selectedCapability = selectedCounty?.capability ?? null;
  const selectedObservedReference = selectedCapability?.referenceData.observed ?? null;
  const selectedIdentityMismatch = selectedCounty?.identityMismatch ?? null;
  const observedCountyCount = useMemo(
    () =>
      countyDirectory.filter((county) => Boolean(county.capability?.referenceData.observed)).length,
    [countyDirectory]
  );
  const selectedSalesReviewAvailable = Boolean(selectedCapability?.eligible && launchDataEnabled);
  const selectedSalesReviewVerifying = Boolean(
    launchDataEnabled &&
    countyStatusSource === 'hosted' &&
    selectedStatus?.salesShardVerification === 'unverified' &&
    selectedCapability?.status === 'sales-shard-verification-required'
  );
  const selectedSalesReviewUnavailableMessage = useMemo(() => {
    if (selectedIdentityMismatch) {
      return (
        'The observed public-data status has a county registry mismatch, so no ' +
        'TerraForge sales workflow can use it.'
      );
    }
    if (!selectedCapability) {
      return `No governed public sales state is available for ${selectedCounty?.county ?? 'this'} County.`;
    }
    if (!launchDataEnabled) {
      return 'The Washington public sales package is not enabled in this environment.';
    }
    return selectedCapability?.unavailableMessage;
  }, [launchDataEnabled, selectedCapability, selectedCounty, selectedIdentityMismatch]);

  const filteredCounties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return countyDirectory;
    return countyDirectory.filter(
      (county) =>
        county.county.toLowerCase().includes(normalizedQuery) ||
        county.countyCode.includes(normalizedQuery) ||
        county.capability?.referenceData.posture.includes(normalizedQuery) ||
        matchesWashingtonPublicSourceQuery(county.publicSource, normalizedQuery) ||
        (county.identityMismatch !== null && 'registry mismatch'.includes(normalizedQuery)) ||
        (!county.capability && 'unavailable'.includes(normalizedQuery))
    );
  }, [countyDirectory, query]);
  const repositoryReferenceDemo = useMemo(
    () =>
      countyDirectory.some(
        (county) => county.capability?.referenceData.isSyntheticReference === true
      ),
    [countyDirectory]
  );

  const launchSelectedCounty = useCallback(async () => {
    if (!selectedCounty) return;

    setLaunching(true);
    setLaunchError(null);
    try {
      const metadata = {
        countyCode: selectedCounty.countyCode,
        countyName: selectedCounty.county,
        resetValuationScope: true,
        launchContext: 'washington-counties-hub',
        dataTrustTier: 'public-reference-not-county-certified',
        referencePackageSource: countyStatusSource,
        referenceDataPosture: selectedCapability?.referenceData.posture ?? 'unavailable',
        referenceRecordCount: selectedObservedReference?.recordCount ?? null,
        latestReferenceSaleDate: selectedObservedReference?.latestSaleDate ?? null,
        salesReviewAvailability: selectedSalesReviewAvailable
          ? 'available'
          : selectedSalesReviewVerifying
            ? 'verifying'
            : 'unavailable',
        salesReviewUnavailableMessage: selectedSalesReviewAvailable
          ? null
          : selectedSalesReviewVerifying
            ? null
            : (selectedSalesReviewUnavailableMessage ??
              'No governed public sales workflow is available for this county.'),
      } satisfies WashingtonCountiesHubHandoff;

      await activateModule('suite-forge', {
        source: 'system',
        metadata,
      });
    } catch (error) {
      setLaunchError(error instanceof Error ? error.message : 'TerraForge could not be opened.');
    } finally {
      setLaunching(false);
    }
  }, [
    countyStatusSource,
    selectedCounty,
    selectedCapability,
    selectedObservedReference,
    selectedSalesReviewAvailable,
    selectedSalesReviewVerifying,
    selectedSalesReviewUnavailableMessage,
  ]);

  const authenticatedUploadMatchesSelection = Boolean(
    selectedCounty &&
    uploadContext &&
    normalizeCountyName(uploadContext.countyName) === normalizeCountyName(selectedCounty.county) &&
    uploadContext.countyKey === `wa-${selectedCounty.county.toLowerCase().replaceAll(' ', '-')}`
  );

  const loadAuthenticatedUploadContext = useCallback(async () => {
    if (!selectedCounty) return;
    setUploadContextLoading(true);
    setUploadError(null);
    setUploadReceipt(null);
    try {
      const history = await fetchCountyCsvUploadHistory();
      setUploadContext(history);
      if (
        normalizeCountyName(history.countyName) !== normalizeCountyName(selectedCounty.county) ||
        history.countyKey !== `wa-${selectedCounty.county.toLowerCase().replaceAll(' ', '-')}`
      ) {
        setUploadError(
          `Your authenticated county is ${history.countyName} County. Select that county before uploading; no data was uploaded.`
        );
      }
    } catch (error) {
      setUploadContext(null);
      setUploadError(
        error instanceof Error ? error.message : 'Authenticated county upload is unavailable.'
      );
    } finally {
      setUploadContextLoading(false);
    }
  }, [selectedCounty]);

  const submitCountyUpload = useCallback(async () => {
    if (!selectedCounty || !uploadContext || !authenticatedUploadMatchesSelection || !uploadFile) {
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadReceipt(null);
    try {
      const receipt = await uploadCountyCsv(uploadFile, uploadDataset);
      if (
        receipt.countyId !== uploadContext.countyId ||
        receipt.countyKey !== uploadContext.countyKey ||
        normalizeCountyName(receipt.countyName) !== normalizeCountyName(selectedCounty.county)
      ) {
        setUploadContext(null);
        setUploadError(
          'The upload receipt did not match the authenticated county context. No availability claim was applied.'
        );
        return;
      }
      setUploadReceipt(receipt);
      setUploadFile(null);
      setUploadContext(await fetchCountyCsvUploadHistory());
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'County CSV upload failed.');
    } finally {
      setUploading(false);
    }
  }, [
    authenticatedUploadMatchesSelection,
    selectedCounty,
    uploadContext,
    uploadDataset,
    uploadFile,
  ]);

  return (
    <Box data-testid='counties-hub' sx={{ height: '100%', overflow: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant='h4' component='h1' gutterBottom>
            Washington Counties Hub
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ maxWidth: 900 }}>
            Inspect the governed public/reference data posture for a Washington county, then enter
            TerraForge in that explicit navigation context. Each data-dependent workflow reports its
            own availability.
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
            <Typography color='text.secondary'>
              Loading governed Washington county status…
            </Typography>
          </Stack>
        )}

        {!loading && loadError && (
          <Alert
            severity='error'
            action={
              <Button
                color='inherit'
                size='small'
                startIcon={<RefreshIcon />}
                onClick={() => void loadCounties()}
              >
                Retry
              </Button>
            }
          >
            {loadError} Governed status claims are suppressed while the feed is unavailable. All 39
            counties remain selectable with explicit unavailable state.
          </Alert>
        )}

        {!loading && (
          <>
            {observedCountyCount !== EXPECTED_WASHINGTON_COUNTIES && (
              <Alert severity='warning'>
                Counties HUB currently has verified observed status for {observedCountyCount} of{' '}
                {EXPECTED_WASHINGTON_COUNTIES} Washington counties. Select a county to validate its
                linked sales package; unverified or missing data remains explicitly unavailable.
              </Alert>
            )}

            {registryIssueStatuses.length > 0 && (
              <Alert severity='error' data-testid='county-registry-integrity-error'>
                The governed feed reported {registryIssueStatuses.length} unregistered or mismatched
                county {registryIssueStatuses.length === 1 ? 'identity' : 'identities'}. Their
                status data is suppressed:{' '}
                {registryIssueStatuses
                  .map((status) => `${status.county} (${status.countyCode})`)
                  .join(', ')}
                .
              </Alert>
            )}

            {usedRepositoryFallback && (
              <Alert severity='warning'>
                A valid same-origin Washington public sales package was not available. Counties HUB
                is using its tracked repository reference for navigation and source research;
                invented interface fixtures remain suppressed from assessor workflows and observed
                public-data counts.
              </Alert>
            )}

            {repositoryReferenceDemo && !usedRepositoryFallback && (
              <Alert severity='warning'>
                This hosted package contains invented synthetic sales for interface testing. They
                cannot enable an assessor workflow, are not observed public sales, and are not
                county records.
              </Alert>
            )}

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', md: 'center' }}
              justifyContent='space-between'
            >
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Chip label={`${countyDirectory.length} Washington counties`} color='primary' />
                <Chip
                  label={`${observedCountyCount} with verified observed status`}
                  variant='outlined'
                />
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
                        <Typography variant='h5'>{selectedCounty.county} County</Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Washington county code {selectedCounty.countyCode} · source{' '}
                          {selectedCapability
                            ? formatStatus(selectedCapability.referenceData.posture)
                            : 'Unavailable'}
                        </Typography>
                      </Box>
                      <Button
                        variant='contained'
                        startIcon={<LaunchIcon />}
                        disabled={launching}
                        onClick={() => void launchSelectedCounty()}
                      >
                        {launching ? 'Opening TerraForge…' : 'Open TerraForge'}
                      </Button>
                    </Stack>

                    <Divider />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Reference records
                        </Typography>
                        <Typography variant='body1'>
                          {selectedObservedReference
                            ? selectedObservedReference.recordCount.toLocaleString()
                            : 'Unavailable'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Latest reference sale
                        </Typography>
                        <Typography variant='body1'>
                          {selectedObservedReference
                            ? (selectedObservedReference.latestSaleDate ?? 'Not reported')
                            : 'Unavailable'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Records needing review
                        </Typography>
                        <Typography variant='body1'>
                          {selectedObservedReference
                            ? selectedObservedReference.needsReview.toLocaleString()
                            : 'Unavailable'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant='caption' color='text.secondary'>
                          Runtime posture
                        </Typography>
                        <Typography variant='body1'>
                          {selectedObservedReference
                            ? formatStatus(selectedObservedReference.runtimePosture)
                            : 'Unavailable'}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Card variant='outlined' data-testid='county-csv-upload-panel'>
                      <CardContent>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant='h6'>County-provided CSV</Typography>
                            <Typography variant='body2' color='text.secondary'>
                              Authenticate the selected county before admitting a Parcels or Sales
                              CSV. Admission validates CSV structure and stores immutable metadata;
                              it does not yet stage, publish, or enable rows in TerraForge.
                            </Typography>
                          </Box>

                          {!uploadContext && (
                            <Button
                              variant='outlined'
                              startIcon={
                                uploadContextLoading ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <ShieldIcon />
                                )
                              }
                              disabled={uploadContextLoading}
                              onClick={() => void loadAuthenticatedUploadContext()}
                            >
                              {uploadContextLoading
                                ? 'Checking authenticated county…'
                                : 'Check authenticated county'}
                            </Button>
                          )}

                          {uploadContext && authenticatedUploadMatchesSelection && (
                            <>
                              <Alert severity='success'>
                                Authenticated for {uploadContext.countyName} County. Recent history
                                below contains this county only.
                              </Alert>
                              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                  select
                                  size='small'
                                  label='Dataset'
                                  value={uploadDataset}
                                  onChange={(event) => {
                                    setUploadDataset(event.target.value as CountyCsvDataset);
                                    setUploadReceipt(null);
                                  }}
                                  sx={{ minWidth: 160 }}
                                >
                                  <MenuItem value='Sales'>Sales</MenuItem>
                                  <MenuItem value='Parcels'>Parcels</MenuItem>
                                </TextField>
                                <Button component='label' variant='outlined'>
                                  Choose CSV
                                  <input
                                    hidden
                                    type='file'
                                    accept='.csv,text/csv'
                                    aria-label='Choose county CSV'
                                    onChange={(event) => {
                                      setUploadFile(event.target.files?.[0] ?? null);
                                      setUploadReceipt(null);
                                      setUploadError(null);
                                    }}
                                  />
                                </Button>
                                <Button
                                  variant='contained'
                                  startIcon={
                                    uploading ? (
                                      <CircularProgress size={16} color='inherit' />
                                    ) : (
                                      <CloudUploadIcon />
                                    )
                                  }
                                  disabled={!uploadFile || uploading}
                                  onClick={() => void submitCountyUpload()}
                                >
                                  {uploading ? 'Uploading…' : 'Admit county CSV'}
                                </Button>
                              </Stack>
                              {uploadFile && (
                                <Typography variant='body2'>
                                  Selected: {uploadFile.name} ({uploadFile.size.toLocaleString()}{' '}
                                  bytes)
                                </Typography>
                              )}
                              {uploadReceipt && (
                                <Alert severity='success' data-testid='county-upload-receipt'>
                                  {uploadReceipt.duplicateDisposition === 'Duplicate'
                                    ? 'This exact county dataset was already admitted.'
                                    : 'CSV admitted durably.'}{' '}
                                  {uploadReceipt.acceptedRowCount.toLocaleString()} structurally
                                  valid rows · batch {uploadReceipt.batchId}. Rows remain
                                  unavailable to TerraForge until staging and promotion are
                                  completed.
                                </Alert>
                              )}
                              <Box>
                                <Typography variant='subtitle2'>Recent admitted batches</Typography>
                                {uploadContext.batches.length === 0 ? (
                                  <Typography variant='body2' color='text.secondary'>
                                    No durable CSV admissions exist for this county.
                                  </Typography>
                                ) : (
                                  <Stack spacing={1} sx={{ mt: 1 }}>
                                    {uploadContext.batches.map((batch) => (
                                      <Box key={batch.batchId}>
                                        <Typography variant='body2'>
                                          {batch.sourceFileName} · {batch.dataset} ·{' '}
                                          {batch.acceptedRowCount.toLocaleString()} structurally
                                          valid rows
                                        </Typography>
                                        <Typography variant='caption' color='text.secondary'>
                                          Admitted {formatSnapshotDate(batch.receivedAtUtc)} · not
                                          staged or available to TerraForge
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Stack>
                                )}
                              </Box>
                            </>
                          )}

                          {uploadError && <Alert severity='error'>{uploadError}</Alert>}
                        </Stack>
                      </CardContent>
                    </Card>

                    {selectedCounty.publicSource ? (
                      <Alert
                        severity='info'
                        icon={<ShieldIcon fontSize='inherit' />}
                        data-testid='county-public-source-inventory'
                      >
                        <Stack spacing={1.5}>
                          <Box>
                            <Typography variant='subtitle2'>
                              Tracked official public source
                            </Typography>
                            <Typography variant='body2'>
                              {selectedCounty.county} County official assessor website
                            </Typography>
                          </Box>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Typography variant='caption' color='text.secondary'>
                                Primary public sales workflow
                              </Typography>
                              <Typography variant='body2'>
                                {selectedCounty.publicSource.primarySalesSource}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant='caption' color='text.secondary'>
                                Fallback public workflow
                              </Typography>
                              <Typography variant='body2'>
                                {selectedCounty.publicSource.fallbackSource ?? 'Not inventoried'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant='caption' color='text.secondary'>
                                GIS / map surface
                              </Typography>
                              <Typography variant='body2'>
                                {selectedCounty.publicSource.gisMapSurface ?? 'Not inventoried'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant='caption' color='text.secondary'>
                                Acquisition family
                              </Typography>
                              <Typography variant='body2'>
                                {selectedCounty.publicSource.acquisitionFamily}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant='caption' color='text.secondary'>
                                Inventory posture
                              </Typography>
                              <Typography variant='body2'>
                                {formatInventoryStatus(selectedCounty.publicSource.status)}
                              </Typography>
                            </Grid>
                          </Grid>
                          <Box>
                            <Button
                              component='a'
                              href={selectedCounty.publicSource.officialAssessorBaseUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              variant='outlined'
                              size='small'
                              startIcon={<OpenInNewIcon />}
                              aria-label={`Open official ${selectedCounty.county} County public assessor source in a new tab`}
                            >
                              Open official public source
                            </Button>
                          </Box>
                          <Typography variant='caption' color='text.secondary'>
                            Read-only external source · inventory snapshot{' '}
                            {formatSnapshotDate(WASHINGTON_PUBLIC_SOURCE_INVENTORY_GENERATED_AT)}.{' '}
                            {WASHINGTON_PUBLIC_SOURCE_INVENTORY_LIMITATION}
                          </Typography>
                        </Stack>
                      </Alert>
                    ) : (
                      <Alert severity='warning'>
                        No tracked official public-source inventory is available for this county.
                      </Alert>
                    )}

                    {!launchDataEnabled && (
                      <Alert severity='warning'>
                        The Washington public sales package is not enabled in this environment.
                        TerraForge still opens in this county context and marks that workflow
                        unavailable.
                      </Alert>
                    )}
                    {selectedIdentityMismatch && (
                      <Alert severity='error'>
                        The observed county name and code do not match the Washington registry. The
                        feed reported {selectedIdentityMismatch.county} County with code{' '}
                        {selectedIdentityMismatch.countyCode} for canonical {selectedCounty.county}{' '}
                        County. Its record counts, freshness, and runtime posture are suppressed.
                      </Alert>
                    )}
                    {!selectedCapability && !selectedIdentityMismatch && (
                      <Alert severity='warning'>
                        No governed public sales state is available for {selectedCounty.county}{' '}
                        County. TerraForge still opens in this county context, while sales review
                        remains unavailable instead of borrowing another county&apos;s data.
                      </Alert>
                    )}
                    {!selectedIdentityMismatch &&
                      !selectedCapability?.eligible &&
                      selectedCapability?.unavailableMessage && (
                        <Alert
                          severity='warning'
                          action={
                            selectedShardRetryAvailable ? (
                              <Button
                                color='inherit'
                                size='small'
                                startIcon={<RefreshIcon />}
                                onClick={retrySelectedCountySalesShard}
                              >
                                Retry sales data
                              </Button>
                            ) : undefined
                          }
                        >
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
                const capability = county.capability;
                const observedReference = capability?.referenceData.observed ?? null;
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
                        disabled={uploadContextLoading || uploading}
                        onClick={() => {
                          setSelectedCountyCode(county.countyCode);
                          setLaunchError(null);
                          setUploadContext(null);
                          setUploadError(null);
                          setUploadFile(null);
                          setUploadReceipt(null);
                        }}
                        sx={{ height: '100%' }}
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
                                color={capability?.eligible ? 'success' : 'default'}
                                label={
                                  county.identityMismatch
                                    ? 'Registry mismatch'
                                    : (capability?.statusLabel ?? 'Public data unavailable')
                                }
                              />
                            </Stack>
                            <Typography variant='body2' color='text.secondary'>
                              Source:{' '}
                              {capability
                                ? formatStatus(capability.referenceData.posture)
                                : 'Unavailable'}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              Freshness:{' '}
                              {observedReference
                                ? (observedReference.latestSaleDate ?? 'Not reported')
                                : 'Unavailable'}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              Public path:{' '}
                              {county.publicSource
                                ? county.publicSource.acquisitionFamily
                                : 'Not inventoried'}
                            </Typography>
                            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                              <Chip
                                size='small'
                                variant='outlined'
                                label={
                                  observedReference
                                    ? formatStatus(observedReference.sourceStatus)
                                    : 'Not reported'
                                }
                              />
                              {observedReference?.sourceDriftDetected && (
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
              <Alert severity='info'>No Washington county matches “{query}”.</Alert>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
};

export default CountiesHub;
