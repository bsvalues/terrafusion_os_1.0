import { useMemo, useState } from 'react';
import { AlertTriangle, Database, RefreshCw, Search } from 'lucide-react';
import { getToken } from '@/auth/authStorage';
import { getSession } from '@/auth/session';
import { apiFetchJson } from '@/lib/apiBase';
import { buildCountyScopedSessionHeaders } from '@/services/countyIsolation';

interface CamaPropertyResponse {
  parcelId?: string;
  parcelNumber?: string;
  address?: string | null;
  situsAddress?: string | null;
  propertyType?: string | null;
  squareFeet?: number | null;
  grossLivingArea?: number | null;
  basementSqft?: number | null;
  garageSqft?: number | null;
  yearBuilt?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  landAcres?: number | null;
  legalDescription?: string | null;
}

function buildRuntimeHeaders(): Record<string, string> {
  const session = getSession();
  const { headers } = buildCountyScopedSessionHeaders(session);
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function fmt(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'Unavailable';
  }
  return typeof value === 'number' ? value.toLocaleString() : value;
}

export default function CamaCharacteristicsModule() {
  const [parcelNumber, setParcelNumber] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [property, setProperty] = useState<CamaPropertyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmedParcel = parcelNumber.trim();
  const canQuery = trimmedParcel.length > 0 && status !== 'loading';

  const rows = useMemo(
    () => [
      ['Property Type', property?.propertyType],
      ['Gross Living Area', property?.grossLivingArea ?? property?.squareFeet],
      ['Basement Sqft', property?.basementSqft],
      ['Garage Sqft', property?.garageSqft],
      ['Year Built', property?.yearBuilt],
      ['Bedrooms', property?.bedrooms],
      ['Bathrooms', property?.bathrooms],
      ['Land Acres', property?.landAcres],
    ],
    [property],
  );

  const loadCharacteristics = async () => {
    if (!canQuery) {
      return;
    }
    setStatus('loading');
    setError(null);
    setProperty(null);
    try {
      const data = await apiFetchJson<CamaPropertyResponse>(
        `/Properties/parcel/${encodeURIComponent(trimmedParcel)}`,
        { headers: buildRuntimeHeaders() },
      );
      setProperty(data);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CAMA characteristics unavailable.');
      setStatus('error');
    }
  };

  return (
    <div data-testid="cama-characteristics-module" className="h-full overflow-auto bg-background p-5 text-foreground">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">TerraForge - CAMA Characteristics</p>
          <h1 className="text-2xl font-semibold">CAMA Characteristics</h1>
          <p className="text-sm text-muted-foreground">
            Read-only TerraFusion property characteristics used by Forge valuation workflows.
          </p>
        </div>
        <div className="rounded border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Runtime path: /api/Properties/parcel/:parcelNumber
        </div>
      </header>

      <section className="mb-5 rounded-lg border bg-card p-4">
        <label className="mb-2 block text-xs font-medium uppercase text-muted-foreground" htmlFor="cama-parcel-number">
          Parcel Number
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="cama-parcel-number"
            className="min-w-[260px] flex-1 rounded border bg-background px-3 py-2 text-sm"
            value={parcelNumber}
            onChange={(event) => setParcelNumber(event.target.value)}
            placeholder="Enter parcel number"
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
            style={{ background: 'hsl(var(--tf-suite-forge))', color: 'hsl(var(--tf-bg))' }}
            onClick={loadCharacteristics}
            disabled={!canQuery}
          >
            {status === 'loading' ? <RefreshCw size={14} /> : <Search size={14} />}
            {status === 'loading' ? 'Loading' : 'Load Characteristics'}
          </button>
        </div>
      </section>

      {status === 'idle' && (
        <div className="rounded border bg-muted/20 p-4 text-sm text-muted-foreground">
          Enter a parcel number to read TerraFusion CAMA characteristics. No sample or fallback rows are rendered.
        </div>
      )}

      {status === 'error' && (
        <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="mb-1 flex items-center gap-2 font-medium"><AlertTriangle size={16} /> Characteristics unavailable</div>
          <p>{error}</p>
        </div>
      )}

      {status === 'success' && property && (
        <section className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <Database size={18} />
            <div>
              <h2 className="text-base font-semibold">{fmt(property.parcelNumber ?? property.parcelId)}</h2>
              <p className="text-sm text-muted-foreground">{fmt(property.address ?? property.situsAddress)}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded border bg-background/70 px-3 py-2">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-sm font-medium">{fmt(value)}</div>
              </div>
            ))}
          </div>
          {property.legalDescription && (
            <div className="mt-4 rounded border bg-muted/20 px-3 py-2 text-sm">
              <div className="text-xs text-muted-foreground">Legal Description</div>
              <div>{property.legalDescription}</div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
