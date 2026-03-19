/**
 * Appeals Workflow Page (TFR-055)
 * ===================================================================
 * Appeal creation form, timeline view, audit log, status transitions.
 * Uses daisService. DataTable of appeals with status badges.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  type Appeal,
  getAllAppeals,
  createAppeal,
  updateAppealStatus,
} from '../../services/suites/daisService';

// ============================================================================
// Status Badge
// ============================================================================

const STATUS_VARIANTS: Record<Appeal['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  filed: 'default',
  scheduled: 'secondary',
  hearing: 'outline',
  decided: 'default',
  withdrawn: 'secondary',
};

const OUTCOME_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  sustained: 'default',
  reduced: 'secondary',
  dismissed: 'destructive',
};

function StatusBadge({ status }: { status: Appeal['status'] }) {
  const variant = STATUS_VARIANTS[status] || 'secondary';
  const variantClasses: Record<string, string> = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-white/10 text-muted-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    outline: 'border border-border text-foreground',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${variantClasses[variant]}`}
    >
      {status}
    </span>
  );
}

// ============================================================================
// Appeal Creation Form
// ============================================================================

interface AppealFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

function AppealForm({ onCreated, onCancel }: AppealFormProps) {
  const [parcelId, setParcelId] = useState('');
  const [petitionerName, setPetitionerName] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [requestedValue, setRequestedValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createAppeal({
        parcelId,
        petitionerName,
        currentValue: parseFloat(currentValue),
        requestedValue: parseFloat(requestedValue),
        status: 'filed',
        filedDate: new Date().toISOString(),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appeal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6" data-testid="appeal-form" data-material="bento">
      <h3 className="mb-4 text-lg font-semibold">File New Appeal</h3>
      {error && (
        <div className="mb-4 rounded-md bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Parcel ID</label>
            <input
              type="text"
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. 1-0234-100-0001-000"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Petitioner Name</label>
            <input
              type="text"
              value={petitionerName}
              onChange={(e) => setPetitionerName(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Current Assessed Value</label>
            <input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Requested Value</label>
            <input
              type="number"
              value={requestedValue}
              onChange={(e) => setRequestedValue(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? 'Filing...' : 'File Appeal'}
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
// Timeline View
// ============================================================================

function AppealTimeline({ appeal }: { appeal: Appeal }) {
  const steps: { label: string; date?: string; active: boolean }[] = [
    { label: 'Filed', date: appeal.filedDate, active: true },
    {
      label: 'Scheduled',
      date: appeal.hearingDate,
      active: ['scheduled', 'hearing', 'decided'].includes(appeal.status),
    },
    {
      label: 'Hearing',
      active: ['hearing', 'decided'].includes(appeal.status),
    },
    {
      label: 'Decided',
      active: appeal.status === 'decided',
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <div className="flex flex-col items-center">
            <div
              className={`h-3 w-3 rounded-full ${step.active ? 'bg-primary' : 'bg-muted'}`}
            />
            <span className="mt-1 text-xs text-muted-foreground">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 ${step.active ? 'bg-primary' : 'bg-muted'}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function AppealsWorkflow() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);

  const loadAppeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllAppeals();
      setAppeals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appeals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppeals();
  }, [loadAppeals]);

  const handleStatusChange = async (appealId: string, newStatus: Appeal['status']) => {
    try {
      await updateAppealStatus(appealId, newStatus);
      await loadAppeals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 p-6" data-testid="appeals-workflow" style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-fg))' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appeals Workflow</h1>
          <p className="text-sm text-muted-foreground">
            Board of Equalization appeal tracking and management
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? 'Close Form' : 'File New Appeal'}
        </button>
      </div>

      {/* Appeal Form */}
      {showForm && (
        <AppealForm
          onCreated={() => {
            setShowForm(false);
            loadAppeals();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-900/20 p-4 text-sm text-red-400">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading appeals...
        </div>
      )}

      {/* Appeals Table */}
      {!loading && appeals.length > 0 && (
        <div className="rounded-lg border border-border" data-material="bento">
          <table className="w-full" data-testid="appeals-table">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Appeal ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Parcel</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Petitioner</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Current Value</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Requested</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Outcome</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Filed</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appeals.map((appeal) => (
                <tr
                  key={appeal.appealId}
                  role="link"
                  className="border-b border-border hover:bg-white/5 cursor-pointer"
                  onClick={() => setSelectedAppeal(appeal)}
                >
                  <td className="px-4 py-3 text-sm font-mono">{appeal.appealId}</td>
                  <td className="px-4 py-3 text-sm font-mono">{appeal.parcelId}</td>
                  <td className="px-4 py-3 text-sm">{appeal.petitionerName}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatCurrency(appeal.currentValue)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatCurrency(appeal.requestedValue)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={appeal.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {appeal.outcome ? (
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                          (() => {
                            const v = OUTCOME_VARIANTS[appeal.outcome] || 'outline';
                            const c: Record<string, string> = {
                              default: 'bg-primary text-primary-foreground',
                              secondary: 'bg-white/10 text-muted-foreground',
                              destructive: 'bg-destructive text-destructive-foreground',
                              outline: 'border border-border text-foreground',
                            };
                            return c[v];
                          })()
                        }`}
                      >
                        {appeal.outcome}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(appeal.filedDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      className="rounded border border-border bg-background px-2 py-1 text-xs"
                      value={appeal.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        handleStatusChange(appeal.appealId, e.target.value as Appeal['status'])
                      }
                    >
                      <option value="filed">Filed</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="hearing">Hearing</option>
                      <option value="decided">Decided</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && appeals.length === 0 && !error && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No appeals found. Click "File New Appeal" to get started.
        </div>
      )}

      {/* Selected Appeal Detail */}
      {selectedAppeal && (
        <div className="rounded-lg border border-border bg-card p-6" data-material="bento">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Appeal {selectedAppeal.appealId}
            </h3>
            <button
              onClick={() => setSelectedAppeal(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <AppealTimeline appeal={selectedAppeal} />
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Parcel:</span>{' '}
              <span className="font-mono">{selectedAppeal.parcelId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Petitioner:</span>{' '}
              {selectedAppeal.petitionerName}
            </div>
            <div>
              <span className="text-muted-foreground">Current Value:</span>{' '}
              {formatCurrency(selectedAppeal.currentValue)}
            </div>
            <div>
              <span className="text-muted-foreground">Requested Value:</span>{' '}
              {formatCurrency(selectedAppeal.requestedValue)}
            </div>
            <div>
              <span className="text-muted-foreground">Difference:</span>{' '}
              {formatCurrency(selectedAppeal.currentValue - selectedAppeal.requestedValue)}
            </div>
            {selectedAppeal.hearingDate && (
              <div>
                <span className="text-muted-foreground">Hearing Date:</span>{' '}
                {new Date(selectedAppeal.hearingDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
