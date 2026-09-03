import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUploadOutlined as CloudUploadIcon,
  ShieldOutlined as ShieldIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import {
  fetchCountyCsvUploadHistory,
  uploadCountyCsv,
  type CountyCsvApiFetch,
  type CountyCsvDataset,
  type CountyCsvUploadHistory,
  type CountyCsvUploadReceipt,
} from './countyCsvUpload';

function normalizeCountyName(value: string): string {
  return value
    .replace(/\s+county$/i, '')
    .trim()
    .toLowerCase();
}

function countyKey(countyName: string): string {
  return `wa-${countyName.toLowerCase().replaceAll(' ', '-')}`;
}

function formatSnapshotDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}

export interface CountyCsvAdmissionPageProps {
  apiFetch: CountyCsvApiFetch;
  counties: ReadonlyArray<{ code: string; name: string }>;
}

export default function CountyCsvAdmissionPage({
  apiFetch,
  counties,
}: CountyCsvAdmissionPageProps) {
  const { countyCode } = useParams<{ countyCode: string }>();
  const county = useMemo(
    () => counties.find((candidate) => candidate.code === countyCode) ?? null,
    [counties, countyCode]
  );
  const [uploadContextLoading, setUploadContextLoading] = useState(false);
  const [uploadContext, setUploadContext] = useState<CountyCsvUploadHistory | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDataset, setUploadDataset] = useState<CountyCsvDataset>('Sales');
  const [uploading, setUploading] = useState(false);
  const [uploadReceipt, setUploadReceipt] = useState<CountyCsvUploadReceipt | null>(null);
  const requestGeneration = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    requestGeneration.current += 1;
    setUploadContextLoading(false);
    setUploadContext(null);
    setUploadError(null);
    setUploadFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadDataset('Sales');
    setUploading(false);
    setUploadReceipt(null);
  }, [countyCode]);

  const authenticatedUploadMatchesSelection = Boolean(
    county &&
    uploadContext &&
    normalizeCountyName(uploadContext.countyName) === normalizeCountyName(county.name) &&
    uploadContext.countyKey === countyKey(county.name)
  );

  const loadAuthenticatedUploadContext = useCallback(async () => {
    if (!county) return;
    const generation = requestGeneration.current + 1;
    requestGeneration.current = generation;
    setUploadContextLoading(true);
    setUploadError(null);
    setUploadReceipt(null);
    try {
      const history = await fetchCountyCsvUploadHistory(apiFetch);
      if (requestGeneration.current !== generation) return;
      setUploadContext(history);
      if (
        normalizeCountyName(history.countyName) !== normalizeCountyName(county.name) ||
        history.countyKey !== countyKey(county.name)
      ) {
        setUploadError(
          `Your authenticated county is ${history.countyName} County. Return to Counties HUB and select that county before uploading; no data was uploaded.`
        );
      }
    } catch (error) {
      if (requestGeneration.current !== generation) return;
      setUploadContext(null);
      setUploadError(
        error instanceof Error ? error.message : 'Authenticated county upload is unavailable.'
      );
    } finally {
      if (requestGeneration.current === generation) {
        setUploadContextLoading(false);
      }
    }
  }, [apiFetch, county]);

  const submitCountyUpload = useCallback(async () => {
    if (!county || !uploadContext || !authenticatedUploadMatchesSelection || !uploadFile) return;
    const generation = requestGeneration.current + 1;
    requestGeneration.current = generation;
    setUploading(true);
    setUploadError(null);
    setUploadReceipt(null);
    try {
      const receipt = await uploadCountyCsv(apiFetch, uploadFile, uploadDataset);
      if (requestGeneration.current !== generation) return;
      if (
        receipt.countyId !== uploadContext.countyId ||
        receipt.countyKey !== uploadContext.countyKey ||
        normalizeCountyName(receipt.countyName) !== normalizeCountyName(county.name)
      ) {
        setUploadContext(null);
        setUploadError(
          'The upload receipt did not match the authenticated county context. No availability claim was applied.'
        );
        return;
      }
      setUploadReceipt(receipt);
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      const refreshedHistory = await fetchCountyCsvUploadHistory(apiFetch);
      if (requestGeneration.current !== generation) return;
      if (
        refreshedHistory.countyId !== receipt.countyId ||
        refreshedHistory.countyKey !== receipt.countyKey ||
        normalizeCountyName(refreshedHistory.countyName) !== normalizeCountyName(county.name)
      ) {
        setUploadContext(null);
        setUploadError(
          'The refreshed upload history did not match the authenticated county context. No availability claim was applied.'
        );
        return;
      }
      setUploadContext(refreshedHistory);
    } catch (error) {
      if (requestGeneration.current !== generation) return;
      setUploadError(error instanceof Error ? error.message : 'County CSV upload failed.');
    } finally {
      if (requestGeneration.current === generation) {
        setUploading(false);
      }
    }
  }, [
    apiFetch,
    authenticatedUploadMatchesSelection,
    county,
    uploadContext,
    uploadDataset,
    uploadFile,
  ]);

  if (!county) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Stack spacing={2}>
          <Typography variant='h4' component='h1'>
            County CSV admission
          </Typography>
          <Alert severity='error'>
            This route does not name one of Washington&apos;s 39 canonical county codes. No upload
            is available.
          </Alert>
          <Button
            component='a'
            href='/counties'
            startIcon={<ArrowBackIcon />}
            sx={{ alignSelf: 'start' }}
          >
            Return to Counties HUB
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      data-testid='county-csv-admission-page'
      sx={{ height: '100%', overflow: 'auto', p: { xs: 2, md: 4 } }}
    >
      <Stack spacing={3} sx={{ maxWidth: 980, mx: 'auto' }}>
        <Button
          component='a'
          href='/counties'
          startIcon={<ArrowBackIcon />}
          sx={{ alignSelf: 'start' }}
        >
          Back to Counties HUB
        </Button>
        <Box>
          <Typography variant='overline' color='text.secondary'>
            TerraForge data admission
          </Typography>
          <Typography variant='h4' component='h1' gutterBottom>
            {county.name} County CSV admission
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Authenticate {county.name} County before admitting a Parcels or Sales CSV. Admission
            validates CSV structure and stores immutable metadata; it does not yet stage, publish,
            or enable rows in TerraForge.
          </Typography>
        </Box>

        <Alert severity='info' icon={<ShieldIcon fontSize='inherit' />}>
          Route selection is navigation context only. The protected API derives county authority
          from the authenticated session and rejects unresolved or different county context.
        </Alert>

        <Card variant='outlined' data-testid='county-csv-upload-panel'>
          <CardContent>
            <Stack spacing={2}>
              {!uploadContext && (
                <Button
                  variant='outlined'
                  startIcon={uploadContextLoading ? <CircularProgress size={16} /> : <ShieldIcon />}
                  disabled={uploadContextLoading}
                  onClick={() => void loadAuthenticatedUploadContext()}
                  sx={{ alignSelf: 'start' }}
                >
                  {uploadContextLoading
                    ? 'Checking authenticated county…'
                    : 'Check authenticated county'}
                </Button>
              )}

              {uploadContext && authenticatedUploadMatchesSelection && (
                <>
                  <Alert severity='success'>
                    Authenticated for {uploadContext.countyName} County. Recent history below
                    contains this county only.
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
                        ref={fileInputRef}
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
                      Selected: {uploadFile.name} ({uploadFile.size.toLocaleString()} bytes)
                    </Typography>
                  )}
                  {uploadReceipt && (
                    <Alert severity='success' data-testid='county-upload-receipt'>
                      {uploadReceipt.duplicateDisposition === 'Duplicate'
                        ? 'This exact county dataset was already admitted.'
                        : 'CSV admitted durably.'}{' '}
                      {uploadReceipt.acceptedRowCount.toLocaleString()} structurally valid rows ·
                      batch {uploadReceipt.batchId}. Rows remain unavailable to TerraForge until
                      staging and promotion are completed.
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
                          <Box
                            key={batch.batchId}
                            data-testid={`county-upload-batch-${batch.batchId}`}
                          >
                            <Typography variant='body2'>
                              {batch.sourceFileName} · {batch.dataset} ·{' '}
                              {batch.acceptedRowCount.toLocaleString()} structurally valid rows
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              Admitted {formatSnapshotDate(batch.receivedAtUtc)} · not staged or
                              available to TerraForge
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
      </Stack>
    </Box>
  );
}
