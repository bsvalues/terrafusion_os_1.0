/**
 * Certification gates exercised through the real page, shared workflow hook,
 * Pilot client and export retrieval. Only HTTP and browser download APIs are doubled.
 */
import { createElement } from 'react';
import { createHash, webcrypto } from 'node:crypto';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../auth/authContextDef';
import RollReadiness from '../../pages/dais/RollReadiness';

const county = '19190019-1919-1919-1919-191919191919';
const studyId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const draftId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const packageRef = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const revision = '1'.repeat(64);
const token = 'e30.' + btoa(JSON.stringify({ sub: 'test-operator', countyId: county, roles: ['appraiser'], exp: 4102444800 })) + '.fixture';
const draft = { countyId: county, studyId, draftId, taxYear: 2024, revision, artifactCount: 1, createdAt: '2026-09-07T12:00:00Z' };
// Deliberate whitespace: a parse/reserialize download would not preserve these bytes.
const content = '{\n  "records": ["persisted study evidence"]\n}\n';
const contentHash = createHash('sha256').update(content).digest('hex');
const exported = { countyId: county, taxYear: 2024, draftId, revision, packageRef,
  payloadRef: '/api/dossier/workflows/exports/' + packageRef,
  downloadUrl: '/api/dossier/workflows/exports/' + packageRef + '/content',
  artifactCount: 1, artifacts: [{ name: 'study.json', sha256: '2'.repeat(64), mediaType: 'application/json', sourceId: studyId }],
  contentHash, createdAt: '2026-09-07T12:01:00Z', status: 'complete', certification: false };
type Wire = { url: URL; method: string; headers: Headers; body?: any };
let requests: Wire[];
let drafts: typeof draft[];
let years: number[];
let overdue: boolean;
let tampered: boolean;
let denied: boolean;
let downloads: Blob[];
let downloadNames: string[];
let invoke: () => Promise<Response>;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('authToken', token);
  localStorage.setItem('tf.session.dev', JSON.stringify({ countyId: 'stale-county', userId: 'stale-user', role: 'admin' }));
  requests = []; drafts = [draft]; years = [2024, 2023]; overdue = false; tampered = false; denied = false;
  downloads = []; downloadNames = [];
  vi.stubGlobal('crypto', webcrypto);
  const BrowserURL = URL;
  vi.stubGlobal('URL', class extends BrowserURL {
    static createObjectURL(blob: Blob) { downloads.push(blob); return 'blob:verified-export'; }
    static revokeObjectURL() {}
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloadNames.push(this.download); });
  invoke = async () => json({ ok: true, result: exported, correlationId: 'corr-export' });
  vi.stubGlobal('fetch', async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString(), 'http://localhost');
    const wire = { url, method: init.method ?? 'GET', headers: new Headers(init.headers), body: init.body ? JSON.parse(String(init.body)) : undefined };
    requests.push(wire);
    if (url.pathname === '/api/dossier/workflows/context') {
      if (denied) return json({ error: 'Forbidden' }, 403);
      return json({ countyId: county, taxYears: years, studies: years.map(taxYear => ({ studyId, taxYear, status: 'active', baselineVersion: 'baseline-1' })), drafts, exports: [] });
    }
    if (url.pathname === '/api/dossier/workflows/drafts' && wire.method === 'POST') {
      drafts = [draft]; return json(draft, 201);
    }
    if (url.pathname === '/api/dais/cert/status') return json([{
      area: 'Synthetic test area', totalParcels: 2, completedParcels: 1,
      percentComplete: 50, deadline: '2026-12-01', status: overdue ? 'overdue' : 'at-risk',
    }]);
    if (url.pathname === '/api/pilot/invoke') return invoke();
    if (url.pathname === exported.payloadRef) return json(exported);
    if (url.pathname === exported.downloadUrl) return new Response(tampered ? '{"records":["tampered"]}' : content, { headers: { 'Content-Type': 'application/json' } });
    return json({ error: 'Unexpected test request' }, 404);
  });
});
afterEach(async () => {
  await act(async () => { await Promise.resolve(); });
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function renderPage(authenticated = true) {
  return render(createElement(AuthContext.Provider, { value: {
    token: authenticated ? token : null, isAuthenticated: authenticated, login() {}, logout() {},
  } }, createElement(RollReadiness)));
}
async function ready() {
  await act(async () => { renderPage(); });
  await screen.findByRole('button', { name: 'Export Certification Package', exact: true });
}
async function exportPackage() {
  await act(async () => { fireEvent.click(screen.getByLabelText('Confirm equalization export')); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Export Certification Package', exact: true })); });
  return screen.findByRole('region', { name: 'Completed export' });
}
function invocations() { return requests.filter(request => request.url.pathname === '/api/pilot/invoke'); }
async function blobBytes(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

describe('RollReadiness persisted certification export gates', () => {
  it('requires explicit human confirmation before any Pilot invocation', async () => {
    await ready();
    expect(screen.getByTestId('roll-certification-gate')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm equalization export')).not.toBeChecked();
    const button = screen.getByRole('button', { name: 'Export Certification Package', exact: true });
    expect(button).toBeDisabled();
    await act(async () => { fireEvent.click(button); });
    expect(invocations()).toHaveLength(0);
  });

  it('sends the authenticated county and actual saved draft/revision through the shared Pilot action', async () => {
    await ready();
    expect(screen.getByLabelText('Assessment year')).toHaveValue('2024');
    expect(screen.getByLabelText('Saved draft')).toHaveValue(draftId);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await exportPackage();
    expect(invocations()).toHaveLength(1);
    const request = invocations()[0];
    expect(request.body).toMatchObject({ toolId: 'export_equalization_package', mode: 'pilot',
      params: { county, taxYear: 2024, draftVersion: draftId, revision },
      confirmation: true, reasonCode: 'annual_certification' });
    expect(request.body.params.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(request.headers.get('Authorization')).toBe('Bearer ' + token);
    expect(request.headers.get('x-county-id')).toBe(county);
    expect(request.headers.get('x-user-id')).toBe('test-operator');
    expect(request.headers.get('x-role')).toBe('appraiser');
    expect(requests.filter(r => r.url.pathname.startsWith('/api/dossier/workflows/')).every(r => r.url.searchParams.get('county') === county)).toBe(true);
  });

  it('cannot export without a saved draft and saves an immutable study snapshot through the UI', async () => {
    drafts = [];
    await ready();
    await act(async () => { fireEvent.click(screen.getByLabelText('Confirm equalization export')); });
    expect(screen.getByRole('button', { name: 'Export Certification Package', exact: true })).toBeDisabled();
    expect(invocations()).toHaveLength(0);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save study snapshot' })); });
    await waitFor(() => expect(screen.getByLabelText('Saved draft')).toHaveValue(draftId));
    await waitFor(() => expect(screen.getByLabelText('Confirm equalization export')).not.toBeChecked());
    const saved = requests.find(r => r.method === 'POST' && r.url.pathname === '/api/dossier/workflows/drafts')!;
    expect(saved.body).toMatchObject({ county, studyId });
    expect(saved.body.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(saved.headers.get('Authorization')).toBe('Bearer ' + token);
  });

  it('discloses overdue hazards and does not mistake confirmation or export for roll approval', async () => {
    overdue = true;
    await ready();
    expect(screen.getByTestId('cert-gate-overdue-warning')).toHaveTextContent('Overdue areas detected');
    expect(screen.getByRole('button', { name: 'Export Certification Package', exact: true })).toBeDisabled();
    await exportPackage();
    expect(screen.getByRole('region', { name: 'Completed export' })).toHaveTextContent('does not certify or approve the roll');
  });

  it('shows a backend refusal with correlation and keeps it distinct from a completed artifact', async () => {
    invoke = async () => json({ ok: false, error: 'Controlled export refusal', errorCode: 'REFUSED', correlationId: 'corr-refusal' }, 403);
    await ready();
    await act(async () => { fireEvent.click(screen.getByLabelText('Confirm equalization export')); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Export Certification Package', exact: true })); });
    expect(await screen.findByTestId('cert-gate-error')).toHaveTextContent('Controlled export refusal');
    expect(screen.getByTestId('cert-gate-error')).toHaveTextContent('corr-refusal');
    expect(screen.queryByRole('region', { name: 'Completed export' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Inspect output' })).not.toBeInTheDocument();
  });

  it('renders real artifact provenance and retrieves authenticated hash-verified JSON', async () => {
    await ready();
    const result = await exportPackage();
    expect(result).toHaveTextContent(packageRef);
    expect(result).toHaveTextContent('study.json');
    expect(result).toHaveTextContent(studyId);
    expect(result).toHaveTextContent('2'.repeat(64));
    expect(result).toHaveTextContent(contentHash);
    expect(result).not.toHaveTextContent('checklist');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Inspect output' })); });
    await screen.findByText('Retrieved bytes verified against the saved SHA-256.');
    expect(screen.getByLabelText('Export JSON').textContent).toBe(content);
    const reads = requests.filter(r => r.url.pathname === exported.payloadRef || r.url.pathname === exported.downloadUrl);
    expect(reads.map(r => r.url.pathname)).toEqual([exported.payloadRef, exported.downloadUrl]);
    expect(reads.every(r => r.headers.get('Authorization') === 'Bearer ' + token && r.url.searchParams.get('county') === county)).toBe(true);
  });

  it('downloads the exact verified bytes rather than a reserialized JSON document', async () => {
    await ready();
    await exportPackage();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Download JSON' })); });
    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(downloadNames).toEqual(['dossier-' + packageRef + '.json']);
    expect(Buffer.from(await blobBytes(downloads[0])).toString('utf8')).toBe(content);
  });

  it.each(['Inspect output', 'Download JSON'])('rejects tampered content during %s without a false intact claim', async action => {
    tampered = true;
    await ready();
    await exportPackage();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: action })); });
    await screen.findByText(/Content integrity check failed/);
    expect(screen.queryByLabelText('Export JSON')).not.toBeInTheDocument();
    expect(screen.queryByText('Retrieved bytes verified against the saved SHA-256.')).not.toBeInTheDocument();
    expect(downloads).toHaveLength(0);
    expect(downloadNames).toHaveLength(0);
  });

  it('invalidates confirmation and a late export through year A to B to A', async () => {
    let finish!: (response: Response) => void;
    invoke = () => new Promise(resolve => { finish = resolve; });
    await ready();
    await act(async () => { fireEvent.click(screen.getByLabelText('Confirm equalization export')); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Export Certification Package', exact: true })); });
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    await act(async () => { fireEvent.change(screen.getByLabelText('Assessment year'), { target: { value: '2023' } }); });
    await act(async () => { fireEvent.change(screen.getByLabelText('Assessment year'), { target: { value: '2024' } }); });
    await act(async () => finish(json({ ok: true, result: exported, correlationId: 'late' })));
    expect(screen.queryByRole('region', { name: 'Completed export' })).not.toBeInTheDocument();
    expect(await screen.findByLabelText('Confirm equalization export')).not.toBeChecked();
  });

  it('offers the existing creation workflow, not a calendar year or fake draft, when persisted context is empty', async () => {
    years = []; drafts = [];
    renderPage();
    expect(await screen.findByRole('link', { name: 'Open County Studio' })).toHaveAttribute('href', '/forge/county-studio');
    expect(screen.queryByLabelText('Assessment year')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Export Certification Package', exact: true })).not.toBeInTheDocument();
    expect(invocations()).toHaveLength(0);
  });

  it('does not fall back to a development session when authenticated context is absent', async () => {
    renderPage(false);
    await screen.findByText(/Sign in with a county-scoped identity/);
    expect(requests).toHaveLength(0);
  });

  it('keeps denied workflow context non-actionable without inventing readiness', async () => {
    denied = true;
    renderPage();
    await screen.findByText(/Workflow access denied/);
    expect(screen.queryByTestId('roll-certification-gate')).not.toBeInTheDocument();
    expect(invocations()).toHaveLength(0);
  });
});
