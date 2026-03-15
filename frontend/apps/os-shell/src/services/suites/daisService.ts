/**
 * TerraDais Service — Assessor Operations Workflow Engine
 * ===================================================================
 * Constitutional service for TerraDais (assessor workflow operations).
 *
 * Owns: appeals, permits, exemptions, notices, certification, workflow states.
 * No valuation math — that belongs to TerraForge.
 *
 * Typed fetch wrappers to backend endpoints. No business logic.
 */

const API = '/api/dais';

// ============================================================================
// Types
// ============================================================================

export interface Appeal {
  appealId: string;
  parcelId: string;
  status: 'filed' | 'scheduled' | 'hearing' | 'decided' | 'withdrawn';
  filedDate: string;
  hearingDate?: string;
  petitionerName: string;
  currentValue: number;
  requestedValue: number;
  outcome?: 'sustained' | 'reduced' | 'dismissed';
}

export interface Permit {
  permitId: string;
  parcelId: string;
  type: string;
  status: string;
  issuedDate: string;
  description?: string;
  applicant?: string;
}

export interface Exemption {
  exemptionId: string;
  parcelId: string;
  type: string;
  tier: string;
  status: string;
  renewalDate: string;
  applicantName?: string;
  approvedDate?: string;
}

export interface Notice {
  noticeId: string;
  parcelId: string;
  type: string;
  status: 'draft' | 'approved' | 'sent' | 'returned';
  generatedAt: string;
  sentAt?: string;
}

export interface CertificationStatus {
  area: string;
  totalParcels: number;
  completedParcels: number;
  percentComplete: number;
  deadline: string;
  status: 'on-track' | 'at-risk' | 'overdue';
}

// ============================================================================
// Appeal Operations
// ============================================================================

export async function getAppeals(parcelId: string): Promise<Appeal[]> {
  const res = await fetch(`${API}/appeals?parcelId=${encodeURIComponent(parcelId)}`);
  if (!res.ok) throw new Error(`Failed to fetch appeals: ${res.statusText}`);
  return res.json();
}

export async function getAllAppeals(): Promise<Appeal[]> {
  const res = await fetch(`${API}/appeals`);
  if (!res.ok) throw new Error(`Failed to fetch appeals: ${res.statusText}`);
  return res.json();
}

export async function updateAppealStatus(
  appealId: string,
  status: Appeal['status']
): Promise<void> {
  const res = await fetch(`${API}/appeals/${encodeURIComponent(appealId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Failed to update appeal status: ${res.statusText}`);
}

export async function createAppeal(
  appeal: Omit<Appeal, 'appealId'>
): Promise<Appeal> {
  const res = await fetch(`${API}/appeals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appeal),
  });
  if (!res.ok) throw new Error(`Failed to create appeal: ${res.statusText}`);
  return res.json();
}

// ============================================================================
// Permit Operations
// ============================================================================

export async function getPermits(parcelId: string): Promise<Permit[]> {
  const res = await fetch(`${API}/permits?parcelId=${encodeURIComponent(parcelId)}`);
  if (!res.ok) throw new Error(`Failed to fetch permits: ${res.statusText}`);
  return res.json();
}

export async function updatePermitStatus(
  permitId: string,
  status: string
): Promise<void> {
  const res = await fetch(`${API}/permits/${encodeURIComponent(permitId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Failed to update permit status: ${res.statusText}`);
}

// ============================================================================
// Exemption Operations
// ============================================================================

export async function getExemptions(parcelId: string): Promise<Exemption[]> {
  const res = await fetch(
    `${API}/exemptions?parcelId=${encodeURIComponent(parcelId)}`
  );
  if (!res.ok) throw new Error(`Failed to fetch exemptions: ${res.statusText}`);
  return res.json();
}

export async function processExemption(
  exemptionId: string,
  action: 'approve' | 'deny' | 'renew' | 'revoke'
): Promise<void> {
  const res = await fetch(
    `${API}/exemptions/${encodeURIComponent(exemptionId)}/process`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }
  );
  if (!res.ok) throw new Error(`Failed to process exemption: ${res.statusText}`);
}

// ============================================================================
// Certification / Roll Readiness
// ============================================================================

export async function getCertificationStatus(): Promise<CertificationStatus[]> {
  const res = await fetch(`${API}/certification/status`);
  if (!res.ok) throw new Error(`Failed to fetch certification status: ${res.statusText}`);
  return res.json();
}

// ============================================================================
// Notices
// ============================================================================

export async function getNotices(parcelId: string): Promise<Notice[]> {
  const res = await fetch(`${API}/notices?parcelId=${encodeURIComponent(parcelId)}`);
  if (!res.ok) throw new Error(`Failed to fetch notices: ${res.statusText}`);
  return res.json();
}
