/**
 * gptBackendTruth.ts — Wave 2 Backend Truth Registry
 *
 * Documents the truth status of every GPT, RAG, and CoPilot backend
 * endpoint as discovered during CP-W2-1 backend recon.
 *
 * This registry serves as both documentation and a testable contract:
 *   - Every endpoint's implementation status (real vs stub)
 *   - Auth enforcement status ([Authorize] vs [AllowAnonymous])
 *   - County isolation status (scoped vs unscoped)
 *   - Frontend alignment (has client call vs unreachable)
 */

// ============================================================================
// Types
// ============================================================================

export type ImplementationStatus = 'real' | 'stub' | 'placeholder';
export type AuthStatus = 'authorized' | 'anonymous' | 'role_gated';
export type IsolationStatus = 'county_scoped' | 'unscoped' | 'hardcoded_county';
export type AlignmentStatus = 'aligned' | 'no_frontend_client' | 'no_backend_endpoint';

export interface BackendEndpoint {
  /** Controller name */
  controller: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Route pattern */
  route: string;
  /** Implementation status */
  implementation: ImplementationStatus;
  /** Auth enforcement */
  auth: AuthStatus;
  /** County isolation */
  isolation: IsolationStatus;
  /** Frontend alignment */
  alignment: AlignmentStatus;
  /** Persistence mechanism */
  persistence: string;
  /** Security finding ID if applicable */
  securityFinding?: string;
}

// ============================================================================
// RAG Controller Endpoints
// ============================================================================

export const RAG_ENDPOINTS: readonly BackendEndpoint[] = [
  {
    controller: 'RAGController',
    method: 'GET',
    route: '/api/rag/datasets',
    implementation: 'real',
    auth: 'authorized',
    isolation: 'county_scoped',
    alignment: 'aligned',
    persistence: 'ef_core',
  },
  {
    controller: 'RAGController',
    method: 'GET',
    route: '/api/rag/datasets/{id}',
    implementation: 'real',
    auth: 'authorized',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'ef_core',
    securityFinding: 'W2-RAG-01',
  },
  {
    controller: 'RAGController',
    method: 'POST',
    route: '/api/rag/datasets',
    implementation: 'real',
    auth: 'authorized',
    isolation: 'county_scoped',
    alignment: 'aligned',
    persistence: 'ef_core',
  },
  {
    controller: 'RAGController',
    method: 'DELETE',
    route: '/api/rag/datasets/{id}',
    implementation: 'real',
    auth: 'authorized',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'ef_core',
    securityFinding: 'W2-RAG-02',
  },
  {
    controller: 'RAGController',
    method: 'POST',
    route: '/api/rag/datasets/{id}/reindex',
    implementation: 'real',
    auth: 'authorized',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'ef_core',
    securityFinding: 'W2-RAG-03',
  },
  {
    controller: 'RAGController',
    method: 'GET',
    route: '/api/rag/datasets/{datasetId}/documents',
    implementation: 'real',
    auth: 'authorized',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'ef_core',
    securityFinding: 'W2-RAG-04',
  },
  {
    controller: 'RAGController',
    method: 'POST',
    route: '/api/rag/datasets/{datasetId}/documents',
    implementation: 'real',
    auth: 'authorized',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'ef_core',
    securityFinding: 'W2-RAG-05',
  },
  {
    controller: 'RAGController',
    method: 'DELETE',
    route: '/api/rag/documents/{id}',
    implementation: 'real',
    auth: 'authorized',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'ef_core',
    securityFinding: 'W2-RAG-06',
  },
  {
    controller: 'RAGController',
    method: 'GET',
    route: '/api/rag/documents/{documentId}/chunks',
    implementation: 'real',
    auth: 'authorized',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'ef_core',
    securityFinding: 'W2-RAG-07',
  },
] as const;

// ============================================================================
// GPT Controller Endpoints (representative — 40 total, key findings listed)
// ============================================================================

export const GPT_ANONYMOUS_ENDPOINTS: readonly BackendEndpoint[] = [
  {
    controller: 'GPTController',
    method: 'GET',
    route: '/api/gpt/rag/health',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'ef_core',
    securityFinding: 'W2-GPT-A01',
  },
  {
    controller: 'GPTController',
    method: 'POST',
    route: '/api/gpt/rag/index/{datasetId}',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'hardcoded_county',
    alignment: 'aligned',
    persistence: 'ef_core',
    securityFinding: 'W2-GPT-A02',
  },
  {
    controller: 'GPTController',
    method: 'GET',
    route: '/api/gpt/system/diagnostics',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'county_scoped',
    alignment: 'aligned',
    persistence: 'in_memory',
    securityFinding: 'W2-GPT-A03',
  },
  {
    controller: 'GPTController',
    method: 'GET',
    route: '/api/gpt/system/diagnostics/download',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'in_memory',
    securityFinding: 'W2-GPT-A04',
  },
  {
    controller: 'GPTController',
    method: 'POST',
    route: '/api/gpt/system/safe-mode',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'in_memory',
    securityFinding: 'W2-GPT-A05',
  },
  {
    controller: 'GPTController',
    method: 'GET',
    route: '/api/gpt/system/safe-mode',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'in_memory',
    securityFinding: 'W2-GPT-A06',
  },
  {
    controller: 'GPTController',
    method: 'GET',
    route: '/api/gpt/rag/benton_cama_basics/export',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'hardcoded_county',
    alignment: 'aligned',
    persistence: 'ef_core',
    securityFinding: 'W2-GPT-A07',
  },
  {
    controller: 'GPTController',
    method: 'GET',
    route: '/api/gpt/system/events',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'county_scoped',
    alignment: 'aligned',
    persistence: 'in_memory',
    securityFinding: 'W2-GPT-A08',
  },
  {
    controller: 'GPTController',
    method: 'GET',
    route: '/api/gpt/system/metrics',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'county_scoped',
    alignment: 'aligned',
    persistence: 'in_memory',
    securityFinding: 'W2-GPT-A09',
  },
  {
    controller: 'GPTController',
    method: 'GET',
    route: '/api/gpt/system/federated-overview',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'in_memory',
    securityFinding: 'W2-GPT-A10',
  },
  {
    controller: 'GPTController',
    method: 'GET',
    route: '/api/gpt/system/policy',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'county_scoped',
    alignment: 'aligned',
    persistence: 'in_memory',
    securityFinding: 'W2-GPT-A11',
  },
  {
    controller: 'GPTController',
    method: 'POST',
    route: '/api/gpt/system/policy/evaluate',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'county_scoped',
    alignment: 'aligned',
    persistence: 'in_memory',
    securityFinding: 'W2-GPT-A12',
  },
  {
    controller: 'GPTController',
    method: 'GET',
    route: '/api/gpt/system/policy/all',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'in_memory',
    securityFinding: 'W2-GPT-A13',
  },
  {
    controller: 'GPTController',
    method: 'GET',
    route: '/api/gpt/system/fleet/rag-readiness',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'in_memory',
    securityFinding: 'W2-GPT-A14',
  },
  {
    controller: 'GPTController',
    method: 'GET',
    route: '/api/gpt/system/atlas',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'in_memory',
    securityFinding: 'W2-GPT-A15',
  },
  {
    controller: 'GPTController',
    method: 'POST',
    route: '/api/gpt/explain',
    implementation: 'real',
    auth: 'anonymous',
    isolation: 'unscoped',
    alignment: 'aligned',
    persistence: 'in_memory',
    securityFinding: 'W2-GPT-A16',
  },
] as const;

// ============================================================================
// CoPilot Controller Endpoints
// ============================================================================

export const COPILOT_ENDPOINTS: readonly BackendEndpoint[] = [
  {
    controller: 'CoPilotController',
    method: 'POST',
    route: '/api/copilot/analyze',
    implementation: 'real',
    auth: 'authorized',
    isolation: 'county_scoped',
    alignment: 'no_frontend_client',
    persistence: 'in_memory',
  },
  {
    controller: 'CoPilotController',
    method: 'POST',
    route: '/api/copilot/generate',
    implementation: 'real',
    auth: 'authorized',
    isolation: 'county_scoped',
    alignment: 'no_frontend_client',
    persistence: 'in_memory',
  },
  {
    controller: 'CoPilotController',
    method: 'POST',
    route: '/api/copilot/suggestions',
    implementation: 'real',
    auth: 'authorized',
    isolation: 'unscoped',
    alignment: 'no_frontend_client',
    persistence: 'in_memory',
  },
  {
    controller: 'CoPilotController',
    method: 'POST',
    route: '/api/copilot/agent/execute',
    implementation: 'real',
    auth: 'authorized',
    isolation: 'unscoped',
    alignment: 'no_frontend_client',
    persistence: 'in_memory',
  },
] as const;

// ============================================================================
// Aggregate queries
// ============================================================================

const ALL_ENDPOINTS: readonly BackendEndpoint[] = [
  ...RAG_ENDPOINTS,
  ...GPT_ANONYMOUS_ENDPOINTS,
  ...COPILOT_ENDPOINTS,
];

/** All endpoints across all controllers */
export function getAllEndpoints(): readonly BackendEndpoint[] {
  return ALL_ENDPOINTS;
}

/** Endpoints with real implementation (not stubs) */
export function getRealEndpoints(): readonly BackendEndpoint[] {
  return ALL_ENDPOINTS.filter((e) => e.implementation === 'real');
}

/** Endpoints missing auth ([AllowAnonymous]) */
export function getAnonymousEndpoints(): readonly BackendEndpoint[] {
  return ALL_ENDPOINTS.filter((e) => e.auth === 'anonymous');
}

/** Endpoints with county isolation gaps */
export function getUnscopedEndpoints(): readonly BackendEndpoint[] {
  return ALL_ENDPOINTS.filter(
    (e) => e.isolation === 'unscoped' || e.isolation === 'hardcoded_county',
  );
}

/** Endpoints with no frontend client */
export function getUnreachableEndpoints(): readonly BackendEndpoint[] {
  return ALL_ENDPOINTS.filter((e) => e.alignment === 'no_frontend_client');
}

/** Endpoints with security findings */
export function getEndpointsWithFindings(): readonly BackendEndpoint[] {
  return ALL_ENDPOINTS.filter((e) => e.securityFinding != null);
}

/** Frontend-aligned endpoints (frontend has a client for this route) */
export function getAlignedEndpoints(): readonly BackendEndpoint[] {
  return ALL_ENDPOINTS.filter((e) => e.alignment === 'aligned');
}
