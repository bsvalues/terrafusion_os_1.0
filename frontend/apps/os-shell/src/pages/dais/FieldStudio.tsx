/**
 * Field Studio Dashboard (TFR-073)
 * ===================================================================
 * Shows pending inspections, completed inspections, sync status.
 * Map view placeholder of inspection locations. Uses fieldStore.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { fieldStore, type FieldObservation } from '../../services/fieldStore';

// ============================================================================
// Condition Badge
// ============================================================================

const CONDITION_VARIANTS: Record<string, string> = {
  excellent: 'bg-primary text-primary-foreground',
  good: 'bg-primary text-primary-foreground',
  average: 'bg-secondary text-secondary-foreground',
  fair: 'bg-secondary text-secondary-foreground',
  poor: 'bg-destructive text-destructive-foreground',
  demolished: 'bg-destructive text-destructive-foreground',
};

function ConditionBadge({ condition }: { condition: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${CONDITION_VARIANTS[condition] || 'bg-white/10 text-muted-foreground'}`}
    >
      {condition}
    </span>
  );
}

// ============================================================================
// Sync Status Bar
// ============================================================================

function SyncStatusBar({
  total,
  synced,
  onSync,
  syncing,
}: {
  total: number;
  synced: number;
  onSync: () => void;
  syncing: boolean;
}) {
  const unsynced = total - synced;
  const online = navigator.onLine;

  return (
    <div className="flex items-center justify-between rounded-lg bg-card p-4" style={{ border: '1px solid hsl(var(--tf-border) / 0.15)' }} data-testid="sync-status" data-material="bento">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Total Observations</div>
          <div className="text-xl font-bold">{total}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Synced</div>
          <div className="text-xl font-bold text-green-400">{synced}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Pending Sync</div>
          <div className="text-xl font-bold text-yellow-400">{unsynced}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            online ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
          }`}
        >
          {online ? 'Online' : 'Offline'}
        </span>
        <button
          onClick={onSync}
          disabled={syncing || unsynced === 0 || !online}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : `Sync ${unsynced} Pending`}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// New Observation Form
// ============================================================================

function NewObservationForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [parcelId, setParcelId] = useState('');
  const [notes, setNotes] = useState('');
  const [condition, setCondition] = useState<FieldObservation['condition']>('average');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fieldStore.save({
        id: crypto.randomUUID(),
        parcelId,
        timestamp: new Date().toISOString(),
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
        photos: [],
        notes,
        condition,
        synced: false,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      });
    }
  };

  return (
    <div className="rounded-lg bg-card p-6" style={{ border: '1px solid hsl(var(--tf-border) / 0.15)' }} data-testid="observation-form" data-material="bento">
      <h3 className="mb-4 text-lg font-semibold">New Field Observation</h3>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Parcel ID</label>
            <input
              type="text"
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Condition</label>
            <select
              value={condition}
              onChange={(e) =>
                setCondition(e.target.value as FieldObservation['condition'])
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="demolished">Demolished</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Latitude</label>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Longitude</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleGetLocation}
                className="whitespace-nowrap rounded-md border border-border px-3 py-2 text-xs hover:bg-accent"
              >
                GPS
              </button>
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Observation'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// Map Placeholder
// ============================================================================

function MapPlaceholder({ observations }: { observations: FieldObservation[] }) {
  const withCoords = observations.filter((o) => o.lat !== 0 && o.lng !== 0);

  return (
    <div className="rounded-lg bg-card p-4" style={{ border: '1px solid hsl(var(--tf-border) / 0.15)' }} data-material="bento">
      <h3 className="mb-3 text-lg font-semibold">Inspection Locations</h3>
      <div className="flex h-64 items-center justify-center rounded-md bg-muted/20" style={{ border: '1px dashed hsl(var(--tf-border) / 0.15)' }}>
        <div className="text-center text-muted-foreground">
          <div className="text-sm">Map View</div>
          <div className="mt-1 text-xs">
            {withCoords.length} observation{withCoords.length !== 1 ? 's' : ''} with GPS
            coordinates
          </div>
          <div className="mt-2 text-xs">
            (Map integration pending — Leaflet/Mapbox)
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function FieldStudio() {
  const [observations, setObservations] = useState<FieldObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');

  const loadObservations = useCallback(async () => {
    setLoading(true);
    try {
      // Load all observations from local store (get unsynced + by-parcel scan)
      const unsynced = await fieldStore.getUnsyncedAll();
      // For a full list, we read from localStorage directly
      const raw = localStorage.getItem('terrafusion:field-observations');
      const all: FieldObservation[] = raw ? JSON.parse(raw) : [];
      setObservations(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadObservations();
  }, [loadObservations]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fieldStore.syncToBackend();
      await loadObservations();
    } finally {
      setSyncing(false);
    }
  };

  const pending = observations.filter((o) => !o.synced);
  const completed = observations.filter((o) => o.synced);
  const syncedCount = completed.length;

  const displayed = tab === 'pending' ? pending : completed;

  return (
    <div className="space-y-6 p-6" data-testid="field-studio" style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-fg))' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Field Studio</h1>
          <p className="text-sm text-muted-foreground">
            Field inspection management and offline observation tracking
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? 'Close Form' : 'New Observation'}
        </button>
      </div>

      {/* Sync Status */}
      <SyncStatusBar
        total={observations.length}
        synced={syncedCount}
        onSync={handleSync}
        syncing={syncing}
      />

      {/* New Observation Form */}
      {showForm && (
        <NewObservationForm
          onSaved={() => {
            setShowForm(false);
            loadObservations();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Map */}
      <MapPlaceholder observations={observations} />

      {/* Tabs */}
      <div className="flex gap-1 rounded-md bg-muted p-1">
        <button
          onClick={() => setTab('pending')}
          className={`rounded px-4 py-2 text-sm font-medium ${
            tab === 'pending'
              ? 'bg-background shadow'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`rounded px-4 py-2 text-sm font-medium ${
            tab === 'completed'
              ? 'bg-background shadow'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Synced ({completed.length})
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading observations...
        </div>
      )}

      {/* Observations List */}
      {!loading && displayed.length > 0 && (
        <div className="rounded-lg" style={{ border: '1px solid hsl(var(--tf-border) / 0.15)' }} data-testid="observation-table">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                <th className="px-4 py-3 text-left text-sm font-medium">Parcel</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Condition</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Notes</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Photos</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((obs) => (
                <tr key={obs.id} className="last:border-0" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                  <td className="px-4 py-3 font-mono text-sm">{obs.parcelId}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(obs.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <ConditionBadge condition={obs.condition} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {obs.lat !== 0
                      ? `${obs.lat.toFixed(4)}, ${obs.lng.toFixed(4)}`
                      : 'No GPS'}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-sm">
                    {obs.notes || '--'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {obs.photos.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && displayed.length === 0 && (
        <div className="rounded-lg p-8 text-center text-muted-foreground" style={{ border: '1px dashed hsl(var(--tf-border) / 0.15)' }}>
          {tab === 'pending'
            ? 'No pending observations. All synced.'
            : 'No synced observations yet.'}
        </div>
      )}
    </div>
  );
}
