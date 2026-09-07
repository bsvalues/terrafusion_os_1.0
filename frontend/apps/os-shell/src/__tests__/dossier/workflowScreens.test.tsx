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
const appealId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
const packetRef = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
const documentId = '12121212-1212-1212-1212-121212121212';
const evidenceId = '13131313-1313-1313-1313-131313131313';
const record = (sourceTable: string, sourceId: string, fields: Record<string, unknown>) => ({ sourceTable, sourceId, countyId: countyA, taxYear: 2024, artifactType: 'persisted-record-metadata', record: { id: sourceId, ...(sourceTable === 'DossierPacketItems' ? {} : { countyId: countyA }), ...fields } });
const actualPacket = { countyId: countyA, taxYear: 2024, appealId, parcelId: 'PARCEL-1', packetRef,
  payloadRef: `/api/dossier/workflows/appeals/${appealId}/packet?county=${countyA}&taxYear=2024&parcelId=PARCEL-1`,
  packet: { ...record('DossierPackets', packetRef, { appealId, parcelId: 'PARCEL-1', taxYear: 2024, name: 'Persisted appeal packet' }), items: [record('DossierPacketItems', '14141414-1414-1414-1414-141414141414', { packetId: packetRef, documentId })] },
  documents: [record('DossierDocuments', documentId, { title: 'Actual supporting document', parcelId: 'PARCEL-1' })],
  evidence: [record('DossierEvidenceItems', evidenceId, { documentId, description: 'Actual linked evidence' })],
  custody: [record('DossierCustodyEvents', '15151515-1515-1515-1515-151515151515', { evidenceId, action: 'Registered by test operator' })] };
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
let packetResponse: () => Promise<Response>;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'X-Correlation-ID': 'corr-http' } });
function wrapper(children: React.ReactNode, jwt = token(), parcelId = 'PARCEL-1', route = '/') {
  localStorage.setItem('authToken', jwt);
  return <AuthContext.Provider value={{ token: jwt, isAuthenticated: true, login() {}, logout() {} }}>
    <MemoryRouter initialEntries={[route]}><WorkbenchTabCtx.Provider value={{ parcelId, propertyData: { parcelId }, workMode: 'appraisal' } as WorkbenchTabData}>{children}</WorkbenchTabCtx.Provider></MemoryRouter>
  </AuthContext.Provider>;
}

async function mount(element: React.ReactElement) {
  let view!: ReturnType<typeof render>;
  await act(async () => { view = render(element); });
  return view;
}

beforeEach(() => {
  localStorage.clear();
  requests = []; drafts = [draft]; years = [2024, 2023]; exports = []; contentTampered = false; saveResponse = undefined;
  vi.stubGlobal('crypto', webcrypto);
  exported.contentHash = contentHash;
  localStorage.setItem('tf.session.dev', JSON.stringify({ userId: 'stale-user', countyId: 'benton', role: 'admin' }));
  invokeResponse = async () => json({ ok: true, result: exported, correlationId: 'corr-export' });
  packetResponse = async () => json(actualPacket);
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
    if (path === `/api/dossier/workflows/appeals/${appealId}/packet`) return packetResponse();
    if (path.startsWith('/api/dais/cert/status')) return json([{ area: 'Synthetic test area', totalParcels: 2, completedParcels: 2, percentComplete: 100, status: 'on-track', deadline: '2026-12-01' }]);
    if (path.includes('/details')) return json({ parcelId: 'PARCEL-1', countyId: countyA, generatedAt: '2026-09-07', piiRedacted: true, property: null, valuation: null, levies: { recent: [], levyCountTotal: 0, levyCountReturned: 0 }, notes: { items: [], noteCountTotal: 0, noteCountReturned: 0 }, links: {} });
    if (path.includes('/evidence/registry')) return json({ schemaVersion: '1.0.0', parcelId: 'PARCEL-1', results: [], total: 0, hasMore: false });
    if (path.includes('/documents') || path.includes('/evidence/search')) return json({ documents: [], evidence: [], results: [], total: 0 });
    if (path.includes('stats') || path.includes('metrics')) return json({ totalParcels: 2, activeAppeals: 0, pendingAssessments: 0, totalDocuments: 0, totalEvidence: 0 });
    return json([]);
  });
});
afterEach(async () => { await act(async () => {}); cleanup(); vi.unstubAllGlobals(); });

describe('persisted county workflow screens', () => {
  it('downloads exact authenticated packet bytes without treating the payloadRef as a trusted link', async () => {
    const raw = '\n' + JSON.stringify(actualPacket, null, 2) + '\n';
    const downloads: Blob[] = [];
    const BrowserURL = URL;
    vi.stubGlobal('URL', class extends BrowserURL {
      static createObjectURL(blob: Blob) { downloads.push(blob); return 'blob:packet-test'; }
      static revokeObjectURL() {}
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      invokeResponse = async () => json({ ok: true, result: { ...actualPacket, payloadRef: 'https://untrusted.invalid/packet' }, correlationId: 'packet-read' });
      packetResponse = async () => new Response(raw, { headers: { 'Content-Type': 'application/json' } });
      await mount(wrapper(<DossierSuiteHome />));
      await act(async () => { fireEvent.change(screen.getByLabelText('Appeal ID'), { target: { value: appealId } }); });
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Open Packet', exact: true })); });
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Download packet JSON' })); });
      await waitFor(() => expect(downloads).toHaveLength(1));
      const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer); reader.onerror = reject; reader.readAsArrayBuffer(downloads[0]);
      });
      expect(Array.from(new Uint8Array(bytes))).toEqual(Array.from(new TextEncoder().encode(raw)));
      expect(click.mock.instances[0]).toHaveProperty('download', `appeal-packet-${packetRef}.json`);
      expect(screen.queryByRole('link', { name: /untrusted/ })).not.toBeInTheDocument();
      expect(requests.filter(r => r.path.endsWith(`/appeals/${appealId}/packet`))).toHaveLength(1);
      expect(screen.getByText(/endpoint supplies no content hash/)).toBeInTheDocument();
    } finally { click.mockRestore(); }
  });

  it.each([401, 403])('does not expose packet content when authenticated re-fetch is denied (%s)', async status => {
    invokeResponse = async () => json({ ok: true, result: actualPacket, correlationId: 'packet-read' });
    packetResponse = async () => json({ error: 'Access denied' }, status);
    await mount(wrapper(<DossierSuiteHome />));
    await act(async () => { fireEvent.change(screen.getByLabelText('Appeal ID'), { target: { value: appealId } }); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Open Packet', exact: true })); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Inspect packet content' })); });
    expect(await screen.findByRole('alert')).toHaveTextContent('Workflow access denied.');
    expect(screen.queryByLabelText('Appeal packet JSON')).not.toBeInTheDocument();
  });

  it.each([['suite', () => <DossierSuiteHome />], ['property', () => <PropertyDossier />]] as const)('rejects a mismatched initial packet response in the %s screen', async (_name, component) => {
    invokeResponse = async () => json({ ok: true, result: { ...actualPacket, appealId: 'wrong-appeal' }, correlationId: 'packet-read' });
    await mount(wrapper(component()));
    await act(async () => { fireEvent.change(screen.getByLabelText('Appeal ID'), { target: { value: appealId } }); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Open (Appeal )?Packet$/ })); });
    expect(await screen.findByText(/packet does not match/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Inspect packet content' })).not.toBeInTheDocument();
  });

  it('rejects unrelated evidence records during packet inspection', async () => {
    invokeResponse = async () => json({ ok: true, result: actualPacket, correlationId: 'packet-read' });
    packetResponse = async () => json({ ...actualPacket, evidence: [record('DossierEvidenceItems', evidenceId, { documentId: 'unrelated-document' })] });
    await mount(wrapper(<DossierSuiteHome />));
    await act(async () => { fireEvent.change(screen.getByLabelText('Appeal ID'), { target: { value: appealId } }); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Open Packet', exact: true })); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Inspect packet content' })); });
    expect(await screen.findByRole('alert')).toHaveTextContent(/packet does not match/);
    expect(screen.queryByLabelText('Appeal packet JSON')).not.toBeInTheDocument();
  });

  it.each([['suite', () => <DossierSuiteHome />], ['property', () => <PropertyDossier />]] as const)('inspects actual authenticated packet records from the %s screen', async (_name, component) => {
    invokeResponse = async () => json({ ok: true, result: actualPacket, correlationId: 'packet-read' });
    await mount(wrapper(component()));
    await screen.findByLabelText('Assessment year');
    await act(async () => { fireEvent.change(screen.getByLabelText('Appeal ID'), { target: { value: appealId } }); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Open (Appeal )?Packet$/ })); });
    { const target = await screen.findByRole('button', { name: 'Inspect packet content' }); await act(async () => { fireEvent.click(target); }); }
    expect(await screen.findByLabelText('Appeal packet JSON')).toHaveTextContent('Actual supporting document');
    expect(screen.getByLabelText('Appeal packet JSON')).toHaveTextContent('Actual linked evidence');
    expect(screen.getByLabelText('Appeal packet JSON')).toHaveTextContent('Registered by test operator');
    const read = requests.find(r => r.path.endsWith(`/appeals/${appealId}/packet`))!;
    expect(read.headers.get('Authorization')).toBe(`Bearer ${token()}`);
    expect(Object.fromEntries(read.query)).toEqual({ county: countyA, taxYear: '2024', parcelId: 'PARCEL-1' });
    expect(screen.getByRole('button', { name: 'Download packet JSON' })).toBeEnabled();
  });

  it.each(['packetRef', 'countyId', 'taxYear', 'appealId', 'parcelId'] as const)('refuses packet inspection if the returned %s changes', async field => {
    invokeResponse = async () => json({ ok: true, result: actualPacket, correlationId: 'packet-read' });
    packetResponse = async () => json({ ...actualPacket, [field]: field === 'taxYear' ? 2023 : 'another-identity' });
    await mount(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    await act(async () => { fireEvent.change(screen.getByLabelText('Appeal ID'), { target: { value: appealId } }); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Open (Appeal )?Packet$/ })); });
    { const target = await screen.findByRole('button', { name: 'Inspect packet content' }); await act(async () => { fireEvent.click(target); }); }
    await screen.findByText(/packet does not match/);
    expect(screen.queryByLabelText('Appeal packet JSON')).not.toBeInTheDocument();
  });

  it('ignores delayed packet inspection after appeal identity A to B to A', async () => {
    let finish!: (response: Response) => void;
    invokeResponse = async () => json({ ok: true, result: actualPacket, correlationId: 'packet-read' });
    packetResponse = () => new Promise(resolve => { finish = resolve; });
    await mount(wrapper(<PropertyDossier />));
    await screen.findByLabelText('Assessment year');
    await act(async () => { fireEvent.change(screen.getByLabelText('Appeal ID'), { target: { value: appealId } }); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Open (Appeal )?Packet$/ })); });
    { const target = await screen.findByRole('button', { name: 'Inspect packet content' }); await act(async () => { fireEvent.click(target); }); }
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    await act(async () => { fireEvent.change(screen.getByLabelText('Appeal ID'), { target: { value: 'different-appeal' } }); });
    await act(async () => { fireEvent.change(screen.getByLabelText('Appeal ID'), { target: { value: appealId } }); });
    await act(async () => finish(json(actualPacket)));
    expect(screen.queryByLabelText('Appeal packet JSON')).not.toBeInTheDocument();
  });
  it('shares the outer Dais year with Roll Readiness and invalidates its confirmed in-flight export', async () => {
    let finish!: (response: Response) => void;
    invokeResponse = () => new Promise(resolve => { finish = resolve; });
    await mount(wrapper(<DaisSuiteHome />));
    const outerYear = await screen.findByLabelText('Assessment year');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Roll readiness', exact: true })); });
    const roll = within(await screen.findByTestId('roll-readiness'));
    await roll.findByLabelText('Confirm equalization export');
    await act(async () => { fireEvent.click(roll.getByLabelText('Confirm equalization export')); });
    await act(async () => { fireEvent.click(roll.getByRole('button', { name: 'Export Certification Package', exact: true })); });
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    await act(async () => { fireEvent.change(outerYear, { target: { value: '2023' } }); });
    await waitFor(() => expect(roll.getByLabelText('Assessment year')).toHaveValue('2023'));
    await act(async () => finish(json({ ok: true, result: exported, correlationId: 'old-roll-scope' })));
    expect(roll.queryByRole('region', { name: 'Completed export' })).not.toBeInTheDocument();
    expect(await roll.findByLabelText('Confirm equalization export')).not.toBeChecked();
    expect(roll.getByRole('button', { name: 'Export Certification Package', exact: true })).toBeDisabled();
  });

  it('renders the actual nested backend morning brief and clears it on year change', async () => {
    invokeResponse = async () => json({ ok: true, correlationId: 'actual-brief', result: { countyId: countyA, taxYear: 2024,
      brief: { role: 'chief_appraiser', queueType: 'calibration_review', priority: 'low', dueWindow: 'No deadline inferred', blockingDependencies: [], recommendedTool: 'generate_morning_brief', readyToAct: true },
      findings: [{ findingId: `CountyStudySessions:${studyId}`, findingType: 'NO_ACTION', scope: 'county', severity: 'low', confidence: 1,
        countyId: countyA, taxYear: 2024, evidenceLineage: [{ source: 'CountyStudySessions', asOf: '2026-09-07T12:00:00Z', recordCount: 1, citation: `CountyStudySessions/${studyId}` }],
        affectedParcelIds: [], recommendedAction: 'Review the existing study in County Studio.', assignedRole: 'chief_appraiser', sourceStatus: 'Active' }],
      summary: '1 persisted operational record(s) for 2024.', generatedAt: '2026-09-07T12:00:00Z' } });
    await mount(wrapper(<DaisSuiteHome />));
    await screen.findByLabelText('Assessment year');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Refresh Brief', exact: true })); });
    expect(await screen.findByTestId('county-morning-brief-result')).toHaveTextContent('calibration review');
    expect(screen.getByTestId('county-morning-brief-result')).toHaveTextContent('Review the existing study in County Studio.');
    await act(async () => { fireEvent.change(screen.getByLabelText('Assessment year'), { target: { value: '2023' } }); });
    expect(screen.queryByTestId('county-morning-brief-result')).not.toBeInTheDocument();
  });
  it('allows a new-context snapshot save while a previous-context save is still pending', async () => {
    let finish!: (response: Response) => void;
    saveResponse = () => new Promise(resolve => { finish = resolve; });
    await mount(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save study snapshot' })); });
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    await act(async () => { fireEvent.change(screen.getByLabelText('Assessment year'), { target: { value: '2023' } }); });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save study snapshot' })).toBeEnabled());
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save study snapshot' })); });
    await waitFor(() => expect(requests.filter(r => r.method === 'POST' && r.path.endsWith('/drafts'))).toHaveLength(2));
  });

  it('clears confirmation and results after a draft change and return', async () => {
    const otherDraftId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    drafts = [draft, { ...draft, draftId: otherDraftId, revision: '5'.repeat(64) }];
    await mount(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Saved draft');
    await act(async () => { fireEvent.click(screen.getByLabelText('Confirm equalization export')); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Equalization Package', exact: true })); });
    await screen.findByText(packageRef);
    await act(async () => { fireEvent.change(screen.getByLabelText('Saved draft'), { target: { value: otherDraftId } }); });
    await act(async () => { fireEvent.change(screen.getByLabelText('Saved draft'), { target: { value: draftId } }); });
    expect(screen.queryByText(packageRef)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Confirm equalization export')).not.toBeChecked();
  });

  it('refuses to display or download tampered persisted content', async () => {
    contentTampered = true;
    await mount(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    await act(async () => { fireEvent.click(screen.getByLabelText('Confirm equalization export')); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Equalization Package', exact: true })); });
    await screen.findByText(packageRef);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Inspect output' })); });
    await screen.findByText(/Content integrity check failed/);
    expect(screen.queryByLabelText('Export JSON')).not.toBeInTheDocument();
  });
  it.each(['county', 'revision', 'artifacts'] as const)('refuses an export response with a mismatched %s', async field => {
    invokeResponse = async () => json({ ok: true, result: { ...exported, ...(field === 'county' ? { countyId: countyB } : field === 'revision' ? { revision: 'incorrect' } : { artifacts: [{ ...exported.artifacts[0], sha256: '' }, exported.artifacts[1]] }) }, correlationId: 'mismatch' });
    await mount(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    await act(async () => { fireEvent.click(screen.getByLabelText('Confirm equalization export')); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Equalization Package', exact: true })); });
    await screen.findByText(/returned export does not match/);
    expect(screen.queryByText(packageRef)).not.toBeInTheDocument();
  });

  it('ignores malformed persisted selection without inventing a year', async () => {
    localStorage.setItem(`tf.dossier.workflow:${countyA}:operator-1:`, 'null');
    await mount(wrapper(<DossierSuiteHome />));
    expect(await screen.findByLabelText('Assessment year')).toHaveValue('2024');
  });

  it('retries a failed export with the same request identity and never sends duplicate pending invocations', async () => {
    let finish!: (response: Response) => void;
    invokeResponse = () => new Promise(resolve => { finish = resolve; });
    await mount(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    await act(async () => { fireEvent.click(screen.getByLabelText('Confirm audit export')); });
    const button = screen.getByRole('button', { name: 'Audit Bundle', exact: true });
    await act(async () => { fireEvent.click(button); fireEvent.click(button); });
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    const first = requests.filter(r => r.path === '/api/pilot/invoke');
    expect(first).toHaveLength(1);
    await act(async () => finish(json({ ok: false, errorCode: 'INTERRUPTED', error: 'Generation interrupted', correlationId: 'interrupted' })));
    await screen.findByText('Generation interrupted');
    invokeResponse = async () => json({ ok: true, result: exported, correlationId: 'retry' });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Audit Bundle', exact: true })); });
    await screen.findByText(packageRef);
    const second = requests.filter(r => r.path === '/api/pilot/invoke')[1];
    expect(second.body.params.requestId).toBe(first[0].body.params.requestId);
  });

  it('keeps reserved offices out of route-based navigation', async () => {
    await mount(wrapper(<Routes><Route path='/property/:parcelId' element={<PropertyWorkbench />} /></Routes>, token(countyA, 'admin'), 'PARCEL-1', '/property/PARCEL-1'));
    await screen.findByRole('link', { name: 'Summary', exact: true });
    for (const name of ['Clerk', 'Treasury', 'Audit']) expect(screen.queryByRole('link', { name, exact: true })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link').filter(link => ['Summary', 'Forge', 'Atlas', 'Dais', 'Dossier', 'Pilot'].includes(link.textContent!.trim())).map(link => link.textContent!.trim())).toEqual(['Summary', 'Forge', 'Atlas', 'Dais', 'Dossier', 'Pilot']);
  });
  it.each(['clerk', 'treasury', 'audit'])('shows an unavailable boundary for reserved %s deep launch without restoring its tab', async tabId => {
    await mount(wrapper(<PropertyWorkbenchWindow metadata={{ parcelId: 'PARCEL-1', tabId }} />));
    expect(await screen.findByText('Reserved office unavailable')).toBeInTheDocument();
    for (const name of ['Clerk', 'Treasury', 'Audit']) expect(screen.queryByRole('tab', { name, exact: true })).not.toBeInTheDocument();
    expect(requests.some(r => r.path === '/api/pilot/invoke')).toBe(false);
  });

  it('mounts the existing Roll Readiness page from the Dais suite', async () => {
    await mount(wrapper(<DaisSuiteHome />));
    { const target = await screen.findByRole('button', { name: 'Roll readiness', exact: true }); await act(async () => { fireEvent.click(target); }); }
    expect(await screen.findByTestId('roll-readiness')).toBeInTheDocument();
  });

  it('reopens a persisted export after remount and retrieves its actual authenticated records', async () => {
    exports = [exported];
    const view = await mount(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    view.unmount();
    await mount(wrapper(<DossierSuiteHome />));
    { const target = await screen.findByRole('button', { name: 'Reopen saved export' }); await act(async () => { fireEvent.click(target); }); }
    await screen.findByText(packageRef);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Inspect output' })); });
    await screen.findByText(/actual persisted study/);
    expect(requests.filter(r => r.path.includes('/workflows/exports/')).every(r => r.headers.get('Authorization') === `Bearer ${token()}`)).toBe(true);
  });

  it.each([
    ['Property Dossier', () => <PropertyDossier />, 'Export Equalization Package'],
    ['Roll Readiness', () => <RollReadiness />, 'Export Certification Package'],
  ] as const)('%s uses the same saved revision and confirmation boundary', async (_name, component, buttonName) => {
    await mount(wrapper(component()));
    await screen.findByLabelText('Assessment year');
    const button = await screen.findByRole('button', { name: buttonName, exact: true });
    expect(button).toBeDisabled();
    await act(async () => { fireEvent.click(screen.getByLabelText(/Confirm equalization export/)); });
    await act(async () => { fireEvent.click(button); });
    await screen.findByText(packageRef);
    expect(requests.find(r => r.path === '/api/pilot/invoke')?.body).toMatchObject({
      params: { county: countyA, taxYear: 2024, draftVersion: draftId, revision }, confirmation: true, reasonCode: 'annual_certification',
    });
  });

  it('requests a role briefing in muse mode and rejects a late result after role changes', async () => {
    let finish!: (response: Response) => void;
    invokeResponse = () => new Promise(resolve => { finish = resolve; });
    await mount(wrapper(<DaisSuiteHome />));
    await screen.findByLabelText('Assessment year');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Refresh Brief', exact: true })); });
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    expect(requests.find(r => r.path === '/api/pilot/invoke')?.body).toMatchObject({ toolId: 'generate_morning_brief', mode: 'muse', params: { county: countyA, taxYear: 2024, role: 'chief_appraiser' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Residential Analyst', exact: true })); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Chief Appraiser', exact: true })); });
    await act(async () => finish(json({ ok: true, correlationId: 'late-brief', result: { countyId: countyA, taxYear: 2024, brief: { role: 'chief_appraiser', queueType: 'expired_brief', priority: 'high', dueWindow: 'yesterday', blockingDependencies: [], recommendedTool: 'old_tool', readyToAct: false }, findings: [] } })));
    expect(screen.queryByText('expired brief')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh Brief', exact: true })).toBeEnabled();
  });

  it.each(['county', 'role', 'session', 'parcel'] as const)('invalidates an in-flight export on %s changes including return to the original identity', async change => {
    let finish!: (response: Response) => void;
    invokeResponse = () => new Promise(resolve => { finish = resolve; });
    const view = await mount(wrapper(<PropertyDossier />));
    await screen.findByLabelText('Assessment year');
    await act(async () => { fireEvent.click(screen.getByLabelText('Confirm equalization export')); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Export Equalization Package', exact: true })); });
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    const nextToken = change === 'county' ? token(countyB) : change === 'role' ? token(countyA, 'viewer') : change === 'session' ? token(countyA, 'appraiser', 'operator-2') : token();
    await act(async () => { view.rerender(wrapper(<PropertyDossier />, nextToken, change === 'parcel' ? 'PARCEL-2' : 'PARCEL-1')); });
    await act(async () => { view.rerender(wrapper(<PropertyDossier />)); });
    await act(async () => finish(json({ ok: true, result: exported, correlationId: 'old-context' })));
    expect(screen.queryByText(packageRef)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Confirm equalization export')).not.toBeChecked();
  });

  it('offers persisted years and an immutable snapshot save when no draft exists', async () => {
    drafts = [];
    await mount(wrapper(<DossierSuiteHome />));
    expect(await screen.findByLabelText('Assessment year')).toHaveValue('2024');
    expect(screen.getByRole('button', { name: 'Equalization Package', exact: true })).toBeDisabled();
    expect(screen.getByText(/No saved draft/i)).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save study snapshot' })); });
    await waitFor(() => expect(screen.getByLabelText('Saved draft')).toHaveValue(draftId));
    const save = requests.find(r => r.method === 'POST' && r.path.endsWith('/drafts'))!;
    expect(save.body.studyId).toBe(studyId);
    expect(save.body.county).toBe(countyA);
    expect(save.body.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(save.headers.get('Authorization')).toBe(`Bearer ${token()}`);
  });

  it('exports only after confirmation with exact persisted scope and retrieves authenticated JSON', async () => {
    await mount(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    const button = screen.getByRole('button', { name: 'Equalization Package', exact: true });
    expect(button).toBeDisabled();
    await act(async () => { fireEvent.click(screen.getByLabelText('Confirm equalization export')); });
    await act(async () => { fireEvent.click(button); });
    await screen.findByText(packageRef);
    const invoke = requests.find(r => r.path === '/api/pilot/invoke')!;
    expect(invoke.body).toMatchObject({ toolId: 'export_equalization_package', mode: 'pilot', params: { county: countyA, taxYear: 2024, draftVersion: draftId, revision }, confirmation: true, reasonCode: 'annual_certification' });
    expect(invoke.headers.get('x-county-id')).toBe(countyA);
    expect(invoke.body.params.requestId).toMatch(/^[0-9a-f-]{36}$/);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Inspect output' })); });
    await screen.findByText(/actual persisted study/);
    expect(requests.find(r => r.path.endsWith('/content'))?.headers.get('Authorization')).toBe(`Bearer ${token()}`);
    expect(requests.filter(r => r.path.startsWith('/api/dossier/workflows/') && r.method === 'GET').every(r => r.query.get('county') === countyA)).toBe(true);
    expect(screen.getByText(/does not certify/i)).toBeInTheDocument();
  });

  it('clears confirmation and ignores a late export after year A to B to A', async () => {
    let finish!: (response: Response) => void;
    invokeResponse = () => new Promise(resolve => { finish = resolve; });
    await mount(wrapper(<DossierSuiteHome />));
    await screen.findByLabelText('Assessment year');
    await act(async () => { fireEvent.click(screen.getByLabelText('Confirm equalization export')); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Equalization Package', exact: true })); });
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    await act(async () => { fireEvent.change(screen.getByLabelText('Assessment year'), { target: { value: '2023' } }); });
    await act(async () => { fireEvent.change(screen.getByLabelText('Assessment year'), { target: { value: '2024' } }); });
    await act(async () => finish(json({ ok: true, result: exported, correlationId: 'old' })));
    expect(screen.queryByText(packageRef)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Confirm equalization export')).not.toBeChecked();
  });

  it('does not invent the current year when persisted records are empty', async () => {
    years = []; drafts = [];
    await mount(wrapper(<DossierSuiteHome />));
    expect(await screen.findByRole('link', { name: /County Studio/i })).toHaveAttribute('href', '/forge/county-studio');
    expect(requests.some(r => r.path === '/api/pilot/invoke')).toBe(false);
    expect(screen.getByRole('button', { name: 'Equalization Package', exact: true })).toBeDisabled();
  });
});
