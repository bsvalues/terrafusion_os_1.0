import { useMemo, useState } from 'react';
import { AlertTriangle, FileText, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import dossierService from '@/services/dossierService';
import type { DossierDetailsResponse } from '@/contracts/dossierDetails';

function fmt(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'Unavailable';
  }
  return typeof value === 'number' ? value.toLocaleString() : value;
}

export default function ValuationDefensibilityModule() {
  const [parcelId, setParcelId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [details, setDetails] = useState<DossierDetailsResponse | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmedParcel = parcelId.trim();
  const canQuery = trimmedParcel.length > 0 && status !== 'loading';

  const valuationCategories = useMemo(
    () => details?.valuation?.categories ?? [],
    [details],
  );

  const loadDefensibility = async () => {
    if (!canQuery) {
      return;
    }
    setStatus('loading');
    setDetails(null);
    setCorrelationId(null);
    setError(null);
    try {
      const result = await dossierService.getDetails(trimmedParcel, {
        include: 'valuation,notes',
        noteLimit: 5,
      });
      setDetails(result.data);
      setCorrelationId(result.correlationId);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Valuation defensibility details unavailable.');
      setStatus('error');
    }
  };

  return (
    <div data-testid="valuation-defensibility-module" className="h-full overflow-auto bg-background p-5 text-foreground">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">TerraForge - Valuation Defensibility</p>
          <h1 className="text-2xl font-semibold">Valuation Notes / Defensibility</h1>
          <p className="text-sm text-muted-foreground">
            Read-only valuation rationale and note headers from the governed dossier details endpoint.
          </p>
        </div>
        <div className="rounded border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Runtime path: /api/dossier/parcels/:parcelId/details?include=valuation,notes
        </div>
      </header>

      <section className="mb-5 rounded-lg border bg-card p-4">
        <label className="mb-2 block text-xs font-medium uppercase text-muted-foreground" htmlFor="defensibility-parcel-id">
          Parcel ID
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="defensibility-parcel-id"
            className="min-w-[260px] flex-1 rounded border bg-background px-3 py-2 text-sm"
            value={parcelId}
            onChange={(event) => setParcelId(event.target.value)}
            placeholder="Enter parcel ID"
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
            style={{ background: 'hsl(var(--tf-suite-forge))', color: 'hsl(var(--tf-bg))' }}
            onClick={loadDefensibility}
            disabled={!canQuery}
          >
            {status === 'loading' ? <RefreshCw size={14} /> : <Search size={14} />}
            {status === 'loading' ? 'Loading' : 'Load Defensibility'}
          </button>
        </div>
      </section>

      {status === 'idle' && (
        <div className="rounded border bg-muted/20 p-4 text-sm text-muted-foreground">
          Enter a parcel ID to read valuation signals and note headers. No sample packets or fallback notes are rendered.
        </div>
      )}

      {status === 'error' && (
        <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="mb-1 flex items-center gap-2 font-medium"><AlertTriangle size={16} /> Defensibility details unavailable</div>
          <p>{error}</p>
        </div>
      )}

      {status === 'success' && details && (
        <section className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded border bg-card p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck size={14} /> Parcel</div>
              <div className="mt-1 text-sm font-medium">{fmt(details.parcelId)}</div>
            </div>
            <div className="rounded border bg-card p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><FileText size={14} /> Valuation Categories</div>
              <div className="mt-1 text-sm font-medium">{valuationCategories.length.toLocaleString()}</div>
            </div>
            <div className="rounded border bg-card p-3">
              <div className="text-xs text-muted-foreground">Correlation ID</div>
              <div className="mt-1 break-all font-mono text-xs">{fmt(correlationId)}</div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-base font-semibold">Valuation Signals</h2>
            {valuationCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No valuation categories returned by the dossier endpoint.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {valuationCategories.map((category) => (
                  <div key={category.name} className="rounded border bg-background/70 px-3 py-2">
                    <div className="text-sm font-medium">{category.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Amount: {fmt(category.amount)}</div>
                    <div className="mt-2 text-xs">Share: {category.percentage.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-base font-semibold">Note Headers</h2>
            {!details.notes || details.notes.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No note headers returned by the dossier endpoint.</p>
            ) : (
              <div className="space-y-2">
                {details.notes.items.map((note) => (
                  <div key={note.noteId} className="rounded border bg-background/70 px-3 py-2 text-sm">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-medium">{note.noteType}</span>
                      <span className="text-xs text-muted-foreground">{note.createdAt}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">Author kind: {note.authorKind}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
