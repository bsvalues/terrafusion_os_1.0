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

import { getToken } from '@/auth/authStorage';

const API = '/api/dais';

// ============================================================================
// Auth Helper (mirrors atlasService pattern)
// ============================================================================

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function authHeadersReadOnly(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

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
  const res = await fetch(`${API}/appeals/parcel/${encodeURIComponent(parcelId)}`, { headers: authHeadersReadOnly() });
  if (!res.ok) throw new Error(`Failed to fetch appeals: ${res.statusText}`);
  return res.json();
}

export async function getAllAppeals(): Promise<Appeal[]> {
  const res = await fetch(`${API}/appeals`, { headers: authHeadersReadOnly() });
  if (!res.ok) throw new Error(`Failed to fetch appeals: ${res.statusText}`);
  return res.json();
}

export async function updateAppealStatus(
  appealId: string,
  status: Appeal['status'],
  decisionNotes?: string,
  decidedValue?: number
): Promise<void> {
  const res = await fetch(`${API}/appeals/${encodeURIComponent(appealId)}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status, decisionNotes, decidedValue }),
  });
  if (!res.ok) throw new Error(`Failed to update appeal status: ${res.statusText}`);
}

export async function createAppeal(
  appeal: Omit<Appeal, 'appealId'>
): Promise<Appeal> {
  const res = await fetch(`${API}/appeals`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(appeal),
  });
  if (!res.ok) throw new Error(`Failed to create appeal: ${res.statusText}`);
  return res.json();
}

// ============================================================================
// Permit Operations
// ============================================================================

export async function getPermits(parcelId: string): Promise<Permit[]> {
  const res = await fetch(`${API}/permits?parcelId=${encodeURIComponent(parcelId)}`, { headers: authHeadersReadOnly() });
  if (!res.ok) throw new Error(`Failed to fetch permits: ${res.statusText}`);
  return res.json();
}

export async function updatePermitStatus(
  permitId: string,
  status: string
): Promise<void> {
  const res = await fetch(`${API}/permits/${encodeURIComponent(permitId)}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Failed to update permit status: ${res.statusText}`);
}

// ============================================================================
// Exemption Operations
// ============================================================================

export async function getExemptions(parcelId: string): Promise<Exemption[]> {
  const res = await fetch(
    `${API}/exemptions/parcel/${encodeURIComponent(parcelId)}`,
    { headers: authHeadersReadOnly() }
  );
  if (!res.ok) throw new Error(`Failed to fetch exemptions: ${res.statusText}`);
  return res.json();
}

export async function processExemption(
  exemptionId: string,
  action: 'approve' | 'deny' | 'renew' | 'revoke'
): Promise<void> {
  const statusMap: Record<string, string> = {
    approve: 'approved',
    deny: 'denied',
    renew: 'renewed',
    revoke: 'revoked',
  };
  const res = await fetch(
    `${API}/exemptions/${encodeURIComponent(exemptionId)}/status`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status: statusMap[action] ?? action }),
    }
  );
  if (!res.ok) throw new Error(`Failed to process exemption: ${res.statusText}`);
}

// ============================================================================
// Certification / Roll Readiness
// ============================================================================

export async function getCertificationStatus(): Promise<CertificationStatus[]> {
  const res = await fetch(`${API}/cert/status`, { headers: authHeadersReadOnly() });
  if (!res.ok) throw new Error(`Failed to fetch certification status: ${res.statusText}`);
  return res.json();
}

// ============================================================================
// Notices
// ============================================================================

export async function getNotices(parcelId: string): Promise<Notice[]> {
  const res = await fetch(`${API}/notices/parcel/${encodeURIComponent(parcelId)}`, { headers: authHeadersReadOnly() });
  if (!res.ok) throw new Error(`Failed to fetch notices: ${res.statusText}`);
  return res.json();
}
