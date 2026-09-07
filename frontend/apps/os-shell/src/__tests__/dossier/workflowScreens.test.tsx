import React from 'react';
import { createHash, webcrypto } from 'node:crypto';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DossierSuiteHome from '../../pages/suites/DossierSuiteHome';
import DaisSuiteHome from '../../pages/suites/DaisSuiteHome';
import RollReadiness from '../../pages/dais/RollReadiness';
import PropertyDossier from '../../pages/workbench/tabs/PropertyDossier';
import PropertyWorkbenchWindow from '../../pages/workbench/PropertyWorkbenchWindow';
import PropertyWorkbench from '../../pages/workbench/PropertyWorkbench';
import { AuthContext } from '../../auth/authContextDef';
import { WorkbenchTabCtx, type WorkbenchTabData } from '../../context/workbenchTabContext';

const countyA = '19190019-1919-1919-1919-191919191919';
const countyB = '20200020-2020-2020-2020-202020202020';
const draftId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const studyId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const packageRef = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const revision = '1'.repeat(64);
const persistedContent = { records: ['actual persisted study', 'actual persisted evidence'] };
const contentHash = createHash('sha256').update(JSON.stringify(persistedContent)).digest('hex');
function token(county = countyA, role = 'appraiser', user = 'operator-1') {
  return `e30.${btoa(JSON.stringify({ sub: user, countyId: county, roles: [role], exp: 4102444800 }))}.signature`;
}
const draft = { draftId, studyId, countyId: countyA, taxYear: 2024, revision, artifactCount: 2, createdAt: '2026-09-07T12:00:00Z' };
const exported = { packageRef, payloadRef: `/api/dossier/workflows/exports/${packageRef}`, countyId: countyA, taxYear: 2024, draftId, revision, artifactCount: 2, artifacts: [{ name: 'study.json', sha256: '2'.repeat(64), mediaType: 'application/json', sourceId: studyId }, { name: 'evidence.json', sha256: '3'.repeat(64), mediaType: 'application/json', sourceId: 'evidence-1' }], contentHash: '4'.repeat(64), downloadUrl: `/api/dossier/workflows/exports/${packageRef}/content`, createdAt: '2026-09-07T12:01:00Z', status: 'complete', certification: false };
type Wire = { path: string; query: URLSearchParams; headers: Headers; body: any; method: string };
let requests: Wire[];
let drafts: typeof draft[];
let years: number[];
let exports: typeof exported[];
let contentTampered: boolean;
let saveResponse: (() => Promise<Response>) | undefined;
let invokeResponse: (wire: Wire) => Promise<Response>;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'X-Correlation-ID': 'corr-http' } });
function wrapper(children: React.ReactNode, jwt = token(), parcelId = 'PARCEL-1', route = '/') {
  localStorage.setItem('authToken', jwt);
  return <AuthContext.Provider value={{ token: jwt, isAuthenticated: true, login() {}, logout() {} }}>
    <MemoryRouter initialEntries={[route]}><WorkbenchTabCtx.Provider value={{ parcelId, propertyData: { parcelId }, workMode: 'appraisal' } as WorkbenchTabData}>{children}</WorkbenchTabCtx.Provider></MemoryRouter>
  </AuthContext.Provider>;
}

beforeEach(() => {
  localStorage.clear();
  requests = []; drafts = [draft]; years = [2024, 2023]; exports = []; contentTampered = false; saveResponse = undefined;
  vi.stubGlobal('crypto', webcrypto);
  exported.contentHash = contentHash;
  localStorage.setItem('tf.session.dev', JSON.stringify({ userId: 'stale-user', countyId: 'benton', role: 'admin' }));
  invokeResponse = async () => json({ ok: true, result: exported, correlationId: 'corr-export' });
  vi.stubGlobal('fetch', async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.toString(), 'http://localhost');
    const path = url.pathname;
    const wire = { path, query: url.searchParams, headers: new Headers(init.headers), method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : null };
    requests.push(wire);
    if (path.startsWith('/api/properties/parcel/')) return json({ id: 'property-1', parcelNumber: decodeURIComponent(path.split('/').pop()!), address: 'Synthetic test parcel', ownerName: 'Synthetic Owner', assessedValue: 100000, landValue: 40000, improvementValue: 60000, marketValue: 100000, taxYear: 2024 });
    if (path.startsWith('/api/dossier/workflows/context')) {
      const county = wire.headers.get('Authorization') === `Bearer ${token(countyB)}` ? countyB : countyA;
      return json({ countyId: county, taxYears: years, studies: years.map(taxYear => ({ studyId: taxYear === 2024 ? studyId : 'older-study', taxYear, status: 'active', baselineVersion: 'baseline-1' })), drafts: drafts.map(d => ({ ...d, countyId: county })), exports });
    }
    if (path === '/api/dossier/workflows/drafts' && wire.method === 'POST') { if (saveResponse) return saveResponse(); drafts = [draft]; return json(draft, 201); }
    if (path === `/api/dossier/workflows/drafts/${draftId}`) return json(draft);
    if (path === `/api/dossier/workflows/exports/${packageRef}/content`) return json(contentTampered ? { records: ['tampered evidence'] } : persistedContent);
    if (path === `/api/dossier/workflows/exports/${packageRef}`) return json(exported);
    if (path === '/api/pilot/invoke') return invokeResponse(wire);
    if (path.startsWith('/api/dais/cert/status')) return json({ county: countyA, taxYear: 2024, totalParcels: 2, completedParcels: 2, percentComplete: 100, status: 'on-track', deadline: '2026-12-01' });
    if (path.includes('/details')) return json({ parcelId: 'PARCEL-1', countyId: countyA, generatedAt: '2026-09-07', piiRedacted: true, property: null, valuation: null, levies: { recent: [], levyCountTotal: 0, levyCountReturned: 0 }, notes: { items: [], noteCountTotal: 0, noteCountReturned: 0 }, links: {} });
    if (path.includes('/evidence/registry')) return json({ schemaVersion: '1.0.0', parcelId: 'PARCEL-1', results: [], total: 0, hasMore: false });
    if (path.includes('/documents') || path.includes('/evidence/search')) return json({ documents: [], evidence: [], results: [], total: 0 });
    if (path.includes('stats') || path.includes('metrics')) return json({ totalParcels: 2, activeAppeals: 0, pendingAssessments: 0, totalDocuments: 0, totalEvidence: 0 });
    return json([]);
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('persisted county workflow screens', () => {
  it('allows a new-context snapshot save while a previous-context save is still pending', async () => {
    let finish!: (response: Response) => void;
    saveResponse = () => new Promise(resolve => { finish = resolve; });
    render(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    fireEvent.click(screen.getByRole('button', { name: 'Save study snapshot' }));
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    fireEvent.change(screen.getByLabelText('Assessment year'), { target: { value: '2023' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save study snapshot' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Save study snapshot' }));
    await waitFor(() => expect(requests.filter(r => r.method === 'POST' && r.path.endsWith('/drafts'))).toHaveLength(2));
  });

  it('clears confirmation and results after a draft change and return', async () => {
    const otherDraftId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    drafts = [draft, { ...draft, draftId: otherDraftId, revision: '5'.repeat(64) }];
    render(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Saved draft');
    fireEvent.click(screen.getByLabelText('Confirm equalization export'));
    fireEvent.click(screen.getByRole('button', { name: 'Equalization Package', exact: true }));
    await screen.findByText(packageRef);
    fireEvent.change(screen.getByLabelText('Saved draft'), { target: { value: otherDraftId } });
    fireEvent.change(screen.getByLabelText('Saved draft'), { target: { value: draftId } });
    expect(screen.queryByText(packageRef)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Confirm equalization export')).not.toBeChecked();
  });

  it('refuses to display or download tampered persisted content', async () => {
    contentTampered = true;
    render(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    fireEvent.click(screen.getByLabelText('Confirm equalization export'));
    fireEvent.click(screen.getByRole('button', { name: 'Equalization Package', exact: true }));
    await screen.findByText(packageRef);
    fireEvent.click(screen.getByRole('button', { name: 'Inspect output' }));
    await screen.findByText(/Content integrity check failed/);
    expect(screen.queryByLabelText('Export JSON')).not.toBeInTheDocument();
  });
  it.each(['county', 'revision', 'artifacts'] as const)('refuses an export response with a mismatched %s', async field => {
    invokeResponse = async () => json({ ok: true, result: { ...exported, ...(field === 'county' ? { countyId: countyB } : field === 'revision' ? { revision: 'incorrect' } : { artifacts: [{ ...exported.artifacts[0], sha256: '' }, exported.artifacts[1]] }) }, correlationId: 'mismatch' });
    render(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    fireEvent.click(screen.getByLabelText('Confirm equalization export'));
    fireEvent.click(screen.getByRole('button', { name: 'Equalization Package', exact: true }));
    await screen.findByText(/returned export does not match/);
    expect(screen.queryByText(packageRef)).not.toBeInTheDocument();
  });

  it('ignores malformed persisted selection without inventing a year', async () => {
    localStorage.setItem(`tf.dossier.workflow:${countyA}:operator-1:`, 'null');
    render(wrapper(<DossierSuiteHome />));
    expect(await screen.findByLabelText('Assessment year')).toHaveValue('2024');
  });

  it('retries a failed export with the same request identity and never sends duplicate pending invocations', async () => {
    let finish!: (response: Response) => void;
    invokeResponse = () => new Promise(resolve => { finish = resolve; });
    render(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    fireEvent.click(screen.getByLabelText('Confirm audit export'));
    const button = screen.getByRole('button', { name: 'Audit Bundle', exact: true });
    fireEvent.click(button); fireEvent.click(button);
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    const first = requests.filter(r => r.path === '/api/pilot/invoke');
    expect(first).toHaveLength(1);
    await act(async () => finish(json({ ok: false, errorCode: 'INTERRUPTED', error: 'Generation interrupted', correlationId: 'interrupted' })));
    await screen.findByText('Generation interrupted');
    invokeResponse = async () => json({ ok: true, result: exported, correlationId: 'retry' });
    fireEvent.click(screen.getByRole('button', { name: 'Audit Bundle', exact: true }));
    await screen.findByText(packageRef);
    const second = requests.filter(r => r.path === '/api/pilot/invoke')[1];
    expect(second.body.params.requestId).toBe(first[0].body.params.requestId);
  });

  it('keeps reserved offices out of route-based navigation', async () => {
    render(wrapper(<Routes><Route path='/property/:parcelId' element={<PropertyWorkbench />} /></Routes>, token(countyA, 'admin'), 'PARCEL-1', '/property/PARCEL-1'));
    await screen.findByRole('link', { name: 'Summary', exact: true });
    for (const name of ['Clerk', 'Treasury', 'Audit']) expect(screen.queryByRole('link', { name, exact: true })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link').filter(link => ['Summary', 'Forge', 'Atlas', 'Dais', 'Dossier', 'Pilot'].includes(link.textContent!.trim())).map(link => link.textContent!.trim())).toEqual(['Summary', 'Forge', 'Atlas', 'Dais', 'Dossier', 'Pilot']);
  });
  it.each(['clerk', 'treasury', 'audit'])('shows an unavailable boundary for reserved %s deep launch without restoring its tab', async tabId => {
    render(wrapper(<PropertyWorkbenchWindow metadata={{ parcelId: 'PARCEL-1', tabId }} />));
    expect(await screen.findByText('Reserved office unavailable')).toBeInTheDocument();
    for (const name of ['Clerk', 'Treasury', 'Audit']) expect(screen.queryByRole('tab', { name, exact: true })).not.toBeInTheDocument();
    expect(requests.some(r => r.path === '/api/pilot/invoke')).toBe(false);
  });

  it('mounts the existing Roll Readiness page from the Dais suite', async () => {
    render(wrapper(<DaisSuiteHome />));
    fireEvent.click(await screen.findByRole('button', { name: 'Roll readiness', exact: true }));
    expect(await screen.findByTestId('roll-readiness')).toBeInTheDocument();
  });

  it('reopens a persisted export after remount and retrieves its actual authenticated records', async () => {
    exports = [exported];
    const view = render(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    view.unmount();
    render(wrapper(<DossierSuiteHome />));
    fireEvent.click(await screen.findByRole('button', { name: 'Reopen saved export' }));
    await screen.findByText(packageRef);
    fireEvent.click(screen.getByRole('button', { name: 'Inspect output' }));
    await screen.findByText(/actual persisted study/);
    expect(requests.filter(r => r.path.includes('/workflows/exports/')).every(r => r.headers.get('Authorization') === `Bearer ${token()}`)).toBe(true);
  });

  it.each([
    ['Property Dossier', () => <PropertyDossier />, 'Export Equalization Package'],
    ['Roll Readiness', () => <RollReadiness />, 'Export Certification Package'],
  ] as const)('%s uses the same saved revision and confirmation boundary', async (_name, component, buttonName) => {
    render(wrapper(component()));
    await screen.findByLabelText('Assessment year');
    const button = await screen.findByRole('button', { name: buttonName, exact: true });
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Confirm equalization export/));
    fireEvent.click(button);
    await screen.findByText(packageRef);
    expect(requests.find(r => r.path === '/api/pilot/invoke')?.body).toMatchObject({
      params: { county: countyA, taxYear: 2024, draftVersion: draftId, revision }, confirmation: true, reasonCode: 'annual_certification',
    });
  });

  it('requests a role briefing in muse mode and rejects a late result after role changes', async () => {
    let finish!: (response: Response) => void;
    invokeResponse = () => new Promise(resolve => { finish = resolve; });
    render(wrapper(<DaisSuiteHome />));
    await screen.findByLabelText('Assessment year');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh Brief', exact: true }));
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    expect(requests.find(r => r.path === '/api/pilot/invoke')?.body).toMatchObject({ toolId: 'generate_morning_brief', mode: 'muse', params: { county: countyA, taxYear: 2024, role: 'chief_appraiser' } });
    fireEvent.click(screen.getByRole('button', { name: 'Residential Analyst', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Chief Appraiser', exact: true }));
    await act(async () => finish(json({ ok: true, correlationId: 'late-brief', result: { role: 'chief_appraiser', queueType: 'expired_brief', priority: 'high', dueWindow: 'yesterday', blockingDependencies: [], recommendedTool: 'old_tool', readyToAct: false, findings: [] } })));
    expect(screen.queryByText('expired brief')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh Brief', exact: true })).toBeEnabled();
  });

  it.each(['county', 'role', 'session', 'parcel'] as const)('invalidates an in-flight export on %s changes including return to the original identity', async change => {
    let finish!: (response: Response) => void;
    invokeResponse = () => new Promise(resolve => { finish = resolve; });
    const view = render(wrapper(<PropertyDossier />));
    await screen.findByLabelText('Assessment year');
    fireEvent.click(screen.getByLabelText('Confirm equalization export'));
    fireEvent.click(screen.getByRole('button', { name: 'Export Equalization Package', exact: true }));
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    const nextToken = change === 'county' ? token(countyB) : change === 'role' ? token(countyA, 'viewer') : change === 'session' ? token(countyA, 'appraiser', 'operator-2') : token();
    view.rerender(wrapper(<PropertyDossier />, nextToken, change === 'parcel' ? 'PARCEL-2' : 'PARCEL-1'));
    view.rerender(wrapper(<PropertyDossier />));
    await act(async () => finish(json({ ok: true, result: exported, correlationId: 'old-context' })));
    expect(screen.queryByText(packageRef)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Confirm equalization export')).not.toBeChecked();
  });

  it('offers persisted years and an immutable snapshot save when no draft exists', async () => {
    drafts = [];
    render(wrapper(<DossierSuiteHome />));
    expect(await screen.findByLabelText('Assessment year')).toHaveValue('2024');
    expect(screen.getByRole('button', { name: 'Equalization Package', exact: true })).toBeDisabled();
    expect(screen.getByText(/No saved draft/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save study snapshot' }));
    await waitFor(() => expect(screen.getByLabelText('Saved draft')).toHaveValue(draftId));
    const save = requests.find(r => r.method === 'POST' && r.path.endsWith('/drafts'))!;
    expect(save.body.studyId).toBe(studyId);
    expect(save.body.county).toBe(countyA);
    expect(save.body.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(save.headers.get('Authorization')).toBe(`Bearer ${token()}`);
  });

  it('exports only after confirmation with exact persisted scope and retrieves authenticated JSON', async () => {
    render(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    const button = screen.getByRole('button', { name: 'Equalization Package', exact: true });
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Confirm equalization export'));
    fireEvent.click(button);
    await screen.findByText(packageRef);
    const invoke = requests.find(r => r.path === '/api/pilot/invoke')!;
    expect(invoke.body).toMatchObject({ toolId: 'export_equalization_package', mode: 'pilot', params: { county: countyA, taxYear: 2024, draftVersion: draftId, revision }, confirmation: true, reasonCode: 'annual_certification' });
    expect(invoke.headers.get('x-county-id')).toBe(countyA);
    expect(invoke.body.params.requestId).toMatch(/^[0-9a-f-]{36}$/);
    fireEvent.click(screen.getByRole('button', { name: 'Inspect output' }));
    await screen.findByText(/actual persisted study/);
    expect(requests.find(r => r.path.endsWith('/content'))?.headers.get('Authorization')).toBe(`Bearer ${token()}`);
    expect(requests.filter(r => r.path.startsWith('/api/dossier/workflows/') && r.method === 'GET').every(r => r.query.get('county') === countyA)).toBe(true);
    expect(screen.getByText(/does not certify/i)).toBeInTheDocument();
  });

  it('clears confirmation and ignores a late export after year A to B to A', async () => {
    let finish!: (response: Response) => void;
    invokeResponse = () => new Promise(resolve => { finish = resolve; });
    render(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    fireEvent.click(screen.getByLabelText('Confirm equalization export'));
    fireEvent.click(screen.getByRole('button', { name: 'Equalization Package', exact: true }));
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    fireEvent.change(screen.getByLabelText('Assessment year'), { target: { value: '2023' } });
    fireEvent.change(screen.getByLabelText('Assessment year'), { target: { value: '2024' } });
    await act(async () => finish(json({ ok: true, result: exported, correlationId: 'old' })));
    expect(screen.queryByText(packageRef)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Confirm equalization export')).not.toBeChecked();
  });

  it('does not invent the current year when persisted records are empty', async () => {
    years = []; drafts = [];
    render(wrapper(<DossierSuiteHome />));
    expect(await screen.findByRole('link', { name: /County Studio/i })).toHaveAttribute('href', '/forge/county-studio');
    expect(requests.some(r => r.path === '/api/pilot/invoke')).toBe(false);
    expect(screen.getByRole('button', { name: 'Equalization Package', exact: true })).toBeDisabled();
  });
});
