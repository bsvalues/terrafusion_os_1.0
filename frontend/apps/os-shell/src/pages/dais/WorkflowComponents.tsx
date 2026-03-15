/**
 * Dais Workflow Components (TFR-056)
 * ===================================================================
 * Exports: PermitsWorkflow, ExemptionsWorkflow, NoticesPanel, CertificationDashboard.
 * Each is a section component with DataTable and status badges.
 * Uses daisService.
 */

import React, { useEffect, useState } from 'react';
import {
  type Permit,
  type Exemption,
  type Notice,
  type CertificationStatus,
  getPermits,
  updatePermitStatus,
  getExemptions,
  processExemption,
  getNotices,
  getCertificationStatus,
} from '../../services/suites/daisService';

// ============================================================================
// Shared Components
// ============================================================================

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center gap-2 py-4 text-muted-foreground">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      Loading...
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-md bg-red-900/20 p-3 text-sm text-red-400">
      {message}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function StatusBadge({
  status,
  variant = 'default',
}: {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}) {
  const colors = {
    default: 'bg-gray-600 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${colors[variant]}`}
    >
      {status}
    </span>
  );
}

function getPermitStatusVariant(
  status: string
): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'issued':
      return 'success';
    case 'pending':
    case 'review':
      return 'warning';
    case 'denied':
    case 'expired':
      return 'error';
    case 'submitted':
      return 'info';
    default:
      return 'default';
  }
}

function getExemptionStatusVariant(
  status: string
): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status.toLowerCase()) {
    case 'active':
    case 'approved':
      return 'success';
    case 'pending':
    case 'renewal':
      return 'warning';
    case 'denied':
    case 'revoked':
      return 'error';
    default:
      return 'default';
  }
}

// ============================================================================
// PermitsWorkflow
// ============================================================================

export function PermitsWorkflow({ parcelId }: { parcelId: string }) {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getPermits(parcelId)
      .then(setPermits)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [parcelId]);

  const handleStatusChange = async (permitId: string, newStatus: string) => {
    try {
      await updatePermitStatus(permitId, newStatus);
      const updated = await getPermits(parcelId);
      setPermits(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permit');
    }
  };

  return (
    <SectionCard title="Permits">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && permits.length === 0 && (
        <EmptyState message="No permits found for this parcel." />
      )}
      {!loading && permits.length > 0 && (
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
              <th className="pb-2">Permit ID</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Issued</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {permits.map((p) => (
              <tr key={p.permitId} className="border-b border-border last:border-0">
                <td className="py-2 font-mono text-sm">{p.permitId}</td>
                <td className="py-2 text-sm">{p.type}</td>
                <td className="py-2">
                  <StatusBadge
                    status={p.status}
                    variant={getPermitStatusVariant(p.status)}
                  />
                </td>
                <td className="py-2 text-sm text-muted-foreground">
                  {new Date(p.issuedDate).toLocaleDateString()}
                </td>
                <td className="py-2">
                  <select
                    className="rounded border border-border bg-background px-2 py-1 text-xs"
                    value={p.status}
                    onChange={(e) => handleStatusChange(p.permitId, e.target.value)}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="review">Review</option>
                    <option value="approved">Approved</option>
                    <option value="issued">Issued</option>
                    <option value="denied">Denied</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SectionCard>
  );
}

// ============================================================================
// ExemptionsWorkflow
// ============================================================================

export function ExemptionsWorkflow({ parcelId }: { parcelId: string }) {
  const [exemptions, setExemptions] = useState<Exemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getExemptions(parcelId)
      .then(setExemptions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [parcelId]);

  const handleProcess = async (
    exemptionId: string,
    action: 'approve' | 'deny' | 'renew' | 'revoke'
  ) => {
    try {
      await processExemption(exemptionId, action);
      const updated = await getExemptions(parcelId);
      setExemptions(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process exemption');
    }
  };

  return (
    <SectionCard title="Exemptions">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && exemptions.length === 0 && (
        <EmptyState message="No exemptions found for this parcel." />
      )}
      {!loading && exemptions.length > 0 && (
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
              <th className="pb-2">Exemption ID</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Tier</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Renewal</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exemptions.map((ex) => (
              <tr key={ex.exemptionId} className="border-b border-border last:border-0">
                <td className="py-2 font-mono text-sm">{ex.exemptionId}</td>
                <td className="py-2 text-sm">{ex.type}</td>
                <td className="py-2 text-sm">{ex.tier}</td>
                <td className="py-2">
                  <StatusBadge
                    status={ex.status}
                    variant={getExemptionStatusVariant(ex.status)}
                  />
                </td>
                <td className="py-2 text-sm text-muted-foreground">
                  {new Date(ex.renewalDate).toLocaleDateString()}
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    {ex.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleProcess(ex.exemptionId, 'approve')}
                          className="rounded bg-green-700 px-2 py-0.5 text-xs text-white hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleProcess(ex.exemptionId, 'deny')}
                          className="rounded bg-red-700 px-2 py-0.5 text-xs text-white hover:bg-red-600"
                        >
                          Deny
                        </button>
                      </>
                    )}
                    {ex.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleProcess(ex.exemptionId, 'renew')}
                          className="rounded bg-blue-700 px-2 py-0.5 text-xs text-white hover:bg-blue-600"
                        >
                          Renew
                        </button>
                        <button
                          onClick={() => handleProcess(ex.exemptionId, 'revoke')}
                          className="rounded bg-red-700 px-2 py-0.5 text-xs text-white hover:bg-red-600"
                        >
                          Revoke
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SectionCard>
  );
}

// ============================================================================
// NoticesPanel
// ============================================================================

export function NoticesPanel({ parcelId }: { parcelId: string }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getNotices(parcelId)
      .then(setNotices)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [parcelId]);

  const noticeStatusVariant = (
    status: Notice['status']
  ): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'sent':
        return 'success';
      case 'approved':
        return 'info';
      case 'draft':
        return 'warning';
      case 'returned':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <SectionCard title="Assessment Notices">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && notices.length === 0 && (
        <EmptyState message="No notices found for this parcel." />
      )}
      {!loading && notices.length > 0 && (
        <div className="space-y-2">
          {notices.map((n) => (
            <div
              key={n.noticeId}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm">{n.noticeId}</span>
                <span className="text-sm text-muted-foreground">{n.type}</span>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge
                  status={n.status}
                  variant={noticeStatusVariant(n.status)}
                />
                <span className="text-xs text-muted-foreground">
                  {new Date(n.generatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ============================================================================
// CertificationDashboard
// ============================================================================

export function CertificationDashboard() {
  const [statuses, setStatuses] = useState<CertificationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getCertificationStatus()
      .then(setStatuses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const statusVariant = (
    s: CertificationStatus['status']
  ): 'default' | 'success' | 'warning' | 'error' => {
    switch (s) {
      case 'on-track':
        return 'success';
      case 'at-risk':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <SectionCard title="Certification Status">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && statuses.length === 0 && (
        <EmptyState message="No certification data available." />
      )}
      {!loading && statuses.length > 0 && (
        <div className="space-y-3">
          {statuses.map((s) => (
            <div key={s.area} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{s.area}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.status} variant={statusVariant(s.status)} />
                  <span className="text-muted-foreground">
                    {s.completedParcels.toLocaleString()} / {s.totalParcels.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    s.percentComplete >= 90
                      ? 'bg-green-600'
                      : s.percentComplete >= 70
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(s.percentComplete, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{s.percentComplete.toFixed(1)}% complete</span>
                <span>Deadline: {new Date(s.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
