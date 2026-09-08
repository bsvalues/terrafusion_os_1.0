import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PacketFinalizationPanel from '../../components/dossier/PacketFinalizationPanel';

const county = '11111111-1111-4111-8111-111111111111';
const packetId = '22222222-2222-4222-8222-222222222222';
const handoffId = '33333333-3333-4333-8333-333333333333';
const revision = 'a'.repeat(64);
const context = { countyId: county, taxYear: 2026, parcelId: 'SYNTHETIC-PACKET', token: 'synthetic-token' };
const view = (status = 'complete') => ({ ...context, token: undefined, packetId, name: 'Stored synthetic packet', revision,
  status, packetStatus: status, narrative: { content: 'Persisted narrative.', revision, contentHash: revision },
  evidence: [{ evidenceId: '44444444-4444-4444-8444-444444444444', revision, contentHash: revision, countyId: county, taxYear: 2026, parcelId: context.parcelId }],
  decision: { decision: 'accepted', status, violations: [] }, finalization: status === 'sealed' ? { finalizationId: packetId } : null, handoff: null });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.unstubAllGlobals());
describe('durable Dossier packet workflow', () => {
  it('renders the actual persisted seal and handoff CID and copyable receipt again after reload', async () => {
    const seal = { schemaVersion: '1.0.0', contractId: 'dossier.packet-finalization', finalizationId: packetId,
      packetId, countyId: county, taxYear: 2026, parcelId: context.parcelId, packetRevision: revision,
      status: 'sealed', finalizedBy: 'synthetic-actor', finalizedAt: '2026-09-07T10:00:00.0000000Z',
      provenance: { traceId: '55555555-5555-4555-8555-555555555555', suiteCommit: 'b'.repeat(40), artifactSha256: 'c'.repeat(64), contractVersion: '1.0.0' } };
    const handoff = { ...seal, contractId: 'dossier.appeal-handoff', handoffId, preparedBy: 'synthetic-actor',
      preparedAt: '2026-09-07T10:01:00.0000000Z', provenance: { ...seal.provenance, traceId: '66666666-6666-4666-8666-666666666666' } };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes(`/packets/${packetId}`)
      ? json({ ...view('sealed'), finalization: seal, handoff })
      : json({ countyId: county, taxYear: 2026, parcelId: context.parcelId, packets: [{ packetId, name: 'Stored synthetic packet', status: 'sealed' }] })));
    render(<MemoryRouter><PacketFinalizationPanel {...context} /></MemoryRouter>);
    expect(await screen.findByText(seal.provenance.traceId, { exact: true })).toBeVisible();
    expect(screen.getByText(handoff.provenance.traceId, { exact: true })).toBeVisible();
    const handoffReceipt = within(screen.getByRole('region', { name: 'Handoff receipt', exact: true }));
    expect(handoffReceipt.getByText(handoffId, { exact: true })).toBeVisible();
    expect(handoffReceipt.getByText(handoff.preparedAt, { exact: true })).toBeVisible();
    expect(JSON.parse((screen.getByRole('textbox', { name: 'Finalization receipt payload' }) as HTMLTextAreaElement).value)).toEqual(seal);
    expect(JSON.parse((screen.getByRole('textbox', { name: 'Handoff receipt payload' }) as HTMLTextAreaElement).value)).toEqual(handoff);
    fireEvent.click(screen.getByRole('button', { name: 'Reload packet' }));
    expect(await screen.findByText(handoff.provenance.traceId, { exact: true })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Handoff receipt payload' })).toHaveAttribute('readonly');
  });

  it('shows a failed action CID matching the actual request without inventing a successful receipt', async () => {
    let cid = '';
    vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
      if (url.includes('/finalize')) { cid = JSON.parse(String(options?.body)).requestId;
        return json({ code: 'REVISION_CONFLICT', error: 'Source revision changed; reload.' }, 409); }
      return url.includes(`/packets/${packetId}`) ? json(view())
        : json({ countyId: county, taxYear: 2026, parcelId: context.parcelId, packets: [{ packetId, name: 'Stored synthetic packet', status: 'complete' }] });
    }));
    render(<MemoryRouter><PacketFinalizationPanel {...context} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Finalize this revision' }));
    const failure = await screen.findByRole('alert');
    expect(failure).toHaveTextContent('Source revision changed');
    expect(cid).not.toBe(''); expect(failure).toHaveTextContent(cid);
    expect(screen.queryByRole('textbox', { name: 'Finalization receipt payload' })).not.toBeInTheDocument();
  });

  it('does not manufacture receipt provenance when a reopened payload lacks it', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes(`/packets/${packetId}`) ? json(view('sealed'))
      : json({ countyId: county, taxYear: 2026, parcelId: context.parcelId, packets: [{ packetId, name: 'Stored synthetic packet', status: 'sealed' }] })));
    render(<MemoryRouter><PacketFinalizationPanel {...context} /></MemoryRouter>);
    expect(await screen.findByText('Persisted receipt provenance is unavailable. Reload before relying on this receipt.')).toBeVisible();
    expect(screen.queryByRole('textbox', { name: 'Finalization receipt payload' })).not.toBeInTheDocument();
  });

  it.each([false, true])('uses a fresh intent after finalize -> revise -> finalize at the same revision (failed readback=%s)', async (failedReadback) => {
    let sealed = false; let failNextRead = false;
    const completed = new Set<string>();
    const commands: Array<{ operation: string; requestId: string }> = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
      const operation = url.includes('/finalize') ? 'finalize' : url.includes('/revise') ? 'revise' : null;
      if (operation) {
        const body = JSON.parse(String(options?.body));
        commands.push({ operation, requestId: body.requestId });
        // Model only the HTTP idempotency boundary: completed keys never perform a second write.
        const key = operation + ':' + body.requestId;
        if (!completed.has(key)) {
          completed.add(key); sealed = operation === 'finalize';
          if (commands.length === 1 && failedReadback) failNextRead = true;
        }
        return json({ recordId: packetId, status: operation === 'finalize' ? 'sealed' : 'draft' });
      }
      if (url.includes(`/packets/${packetId}`)) {
        if (failNextRead) { failNextRead = false; throw new Error('Synthetic readback failure after committed mutation'); }
        return json(sealed ? view('sealed') : { ...view(), packetStatus: 'draft' });
      }
      return json({ countyId: county, taxYear: 2026, parcelId: context.parcelId, packets: [{ packetId, name: 'Stored synthetic packet', status: 'draft' }] });
    }));
    render(<MemoryRouter><PacketFinalizationPanel {...context} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Finalize this revision' }));
    if (failedReadback) {
      expect(await screen.findByRole('alert')).toHaveTextContent('readback failure');
      fireEvent.click(screen.getByRole('button', { name: 'Reload packet' }));
    }
    fireEvent.change(await screen.findByRole('textbox', { name: 'Revision reason' }), { target: { value: 'Review the same source revision' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reopen for revision' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Finalize this revision' }));
    await waitFor(() => expect(screen.getByTestId('finalization-status')).toHaveTextContent('sealed'));
    const seals = commands.filter(x => x.operation === 'finalize');
    expect(seals).toHaveLength(2);
    expect(seals[1].requestId).not.toBe(seals[0].requestId);
  });

  it('retries an unknown committed outcome with the original ID and accepts the same durable receipt', async () => {
    const keys: string[] = []; const receipts = new Set<string>();
    vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
      if (url.includes('/finalize')) {
        const body = JSON.parse(String(options?.body)); keys.push(body.requestId); receipts.add(body.requestId);
        if (keys.length === 1) throw new Error('Synthetic response lost after commit');
        return json({ finalizationId: packetId, status: 'sealed' });
      }
      return url.includes(`/packets/${packetId}`) ? json(view(receipts.size ? 'sealed' : 'complete'))
        : json({ countyId: county, taxYear: 2026, parcelId: context.parcelId, packets: [{ packetId, name: 'Stored synthetic packet', status: 'complete' }] });
    }));
    render(<MemoryRouter><PacketFinalizationPanel {...context} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Finalize this revision' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('response lost after commit');
    fireEvent.click(screen.getByRole('button', { name: 'Finalize this revision' }));
    await screen.findByRole('button', { name: 'Prepare appeal handoff' });
    expect(keys).toHaveLength(2); expect(keys[1]).toBe(keys[0]); expect(receipts.size).toBe(1);
  });

  it('loads explicit scope, finalizes backend revision and prepares only a server handoff', async () => {
    let sealed = false;
    const calls: { url: string; body?: Record<string, unknown>; auth: unknown; cid: string | null }[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
      calls.push({ url, body: options?.body ? JSON.parse(String(options.body)) : undefined, auth: new Headers(options?.headers).get('Authorization'), cid: new Headers(options?.headers).get('X-Correlation-ID') });
      if (url.includes('/finalize')) { sealed = true; return json({ ...view('sealed'), finalizationId: packetId }); }
      if (url.includes('/prepare')) return json({ schemaVersion: '1.0.0', contractId: 'dossier.appeal-handoff', handoffId,
        countyId: county, taxYear: 2026, parcelId: context.parcelId, packetId, packetRevision: revision });
      if (url.includes(`/packets/${packetId}`)) return json(view(sealed ? 'sealed' : 'complete'));
      return json({ countyId: county, taxYear: 2026, parcelId: context.parcelId, packets: [{ packetId, name: 'Stored synthetic packet', status: 'complete' }] });
    }));
    render(<MemoryRouter><PacketFinalizationPanel {...context} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Finalize this revision' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Prepare appeal handoff' }));
    const link = await screen.findByRole('link', { name: 'Continue in Dais' });
    expect(link.getAttribute('href')).toBe(`/property/${context.parcelId}/dais?handoffId=${handoffId}&packetRevision=${revision}&taxYear=2026`);
    const command = calls.find(x => x.url.includes('/finalize'))!;
    expect(command.body).toMatchObject({ county, taxYear: 2026, parcelId: context.parcelId, expectedRevision: revision });
    expect(command.body).not.toHaveProperty('finalizationId');
    expect(command.body).not.toHaveProperty('effectiveAt');
    expect(command.body).not.toHaveProperty('provenance');
    expect(command.cid).toBe(command.body?.requestId);
    expect(calls.every(x => x.auth === 'Bearer synthetic-token')).toBe(true);
  });

  it('shows backend stale conflict without an invented successful seal', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes('/finalize')
      ? json({ code: 'REVISION_CONFLICT', error: 'Source revision changed; reload.' }, 409)
      : url.includes(`/packets/${packetId}`) ? json(view())
      : json({ countyId: county, taxYear: 2026, parcelId: context.parcelId, packets: [{ packetId, name: 'Stored synthetic packet', status: 'complete' }] })));
    render(<MemoryRouter><PacketFinalizationPanel {...context} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Finalize this revision' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Source revision changed');
    expect(screen.queryByRole('button', { name: 'Prepare appeal handoff' })).not.toBeInTheDocument();
  });

  it('scope change clears old packet while new request is unresolved', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes('OTHER') ? new Promise<Response>(() => {})
      : url.includes(`/packets/${packetId}`) ? json(view())
      : json({ countyId: county, taxYear: 2026, parcelId: context.parcelId, packets: [{ packetId, name: 'Stored synthetic packet', status: 'complete' }] })));
    const rendered = render(<MemoryRouter><PacketFinalizationPanel {...context} /></MemoryRouter>);
    await screen.findByRole('button', { name: 'Finalize this revision' });
    rendered.rerender(<MemoryRouter><PacketFinalizationPanel {...context} parcelId='OTHER' /></MemoryRouter>);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Finalize this revision' })).not.toBeInTheDocument());
  });

  it('fails closed without explicit county/year and performs no guessed request', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    render(<MemoryRouter><PacketFinalizationPanel parcelId='SYNTHETIC-PACKET' /></MemoryRouter>);
    expect(screen.getByText(/Select an authenticated county and assessment year/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('loads under StrictMode remount effects without reusing an aborted request', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
      if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      return url.includes(`/packets/${packetId}`) ? json(view())
        : json({ countyId: county, taxYear: 2026, parcelId: context.parcelId, packets: [{ packetId, name: 'Stored synthetic packet', status: 'complete' }] });
    }));
    render(<React.StrictMode><MemoryRouter><PacketFinalizationPanel {...context} /></MemoryRouter></React.StrictMode>);
    expect(await screen.findByRole('button', { name: 'Finalize this revision' })).toBeEnabled();
  });

  it('saves narrative against the selected revision then reloads the durable snapshot', async () => {
    let content = 'Persisted narrative.';
    let saved = false;
    const posted: Record<string, unknown>[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
      if (url.includes('/narrative')) {
        const body = JSON.parse(String(options?.body)); posted.push(body); content = body.content; saved = true;
        return json({ recordId: packetId, content });
      }
      return url.includes(`/packets/${packetId}`) ? json({ ...view(), revision: saved ? 'b'.repeat(64) : revision, narrative: { ...view().narrative, content } })
        : json({ countyId: county, taxYear: 2026, parcelId: context.parcelId, packets: [{ packetId, name: 'Stored synthetic packet', status: 'complete' }] });
    }));
    render(<MemoryRouter><PacketFinalizationPanel {...context} /></MemoryRouter>);
    fireEvent.change(await screen.findByRole('textbox', { name: 'Packet narrative' }), { target: { value: 'Updated persisted narrative.' } });
    expect(screen.getByRole('button', { name: 'Finalize this revision' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Save narrative' }));
    expect(await screen.findByText('b'.repeat(64))).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Packet narrative' })).toHaveValue('Updated persisted narrative.');
    expect(posted[0]).toMatchObject({ expectedRevision: revision, content: 'Updated persisted narrative.', county, taxYear: 2026 });
    expect(posted[0]).not.toHaveProperty('revision');
  });

  it('reloads a stale snapshot explicitly and never retains its prepared handoff', async () => {
    let fresh = false;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes(`/packets/${packetId}`)) return json(fresh ? view('stale') : { ...view('sealed'), handoff: { countyId: county, taxYear: 2026, parcelId: context.parcelId, packetId, packetRevision: revision, handoffId } });
      return json({ countyId: county, taxYear: 2026, parcelId: context.parcelId, packets: [{ packetId, name: 'Stored synthetic packet', status: 'sealed' }] });
    }));
    render(<MemoryRouter><PacketFinalizationPanel {...context} /></MemoryRouter>);
    await screen.findByRole('link', { name: 'Continue in Dais' }); fresh = true;
    fireEvent.click(screen.getByRole('button', { name: 'Reload packet' }));
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Continue in Dais' })).not.toBeInTheDocument());
    expect(await screen.findByText('stale')).toBeInTheDocument();
  });

  it('refuses a reopened handoff whose scope differs from the selected packet', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes(`/packets/${packetId}`)
      ? json({ ...view('sealed'), handoff: { countyId: county, taxYear: 2025, parcelId: context.parcelId, packetId, packetRevision: revision, handoffId } })
      : json({ countyId: county, taxYear: 2026, parcelId: context.parcelId, packets: [{ packetId, name: 'Stored synthetic packet', status: 'sealed' }] })));
    render(<MemoryRouter><PacketFinalizationPanel {...context} /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent(/scope|identity/i);
    expect(screen.queryByRole('link', { name: 'Continue in Dais' })).not.toBeInTheDocument();
  });

  it('retries an ambiguous command with its same correlation key and expected revision', async () => {
    const commands: Record<string, unknown>[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
      if (url.includes('/finalize')) {
        commands.push(JSON.parse(String(options?.body)));
        throw new Error('Synthetic connection loss');
      }
      return url.includes(`/packets/${packetId}`) ? json(view())
        : json({ countyId: county, taxYear: 2026, parcelId: context.parcelId, packets: [{ packetId, name: 'Stored synthetic packet', status: 'complete' }] });
    }));
    render(<MemoryRouter><PacketFinalizationPanel {...context} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Finalize this revision' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Finalize this revision' }));
    await waitFor(() => expect(commands).toHaveLength(2));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Finalize this revision' })).toBeEnabled());
    expect(commands[0].requestId).toEqual(expect.any(String));
    expect(commands[1]).toEqual(commands[0]);
  });

  it('reopens a sealed packet through the backend before allowing narrative edits', async () => {
    let reopened = false;
    const commands: Record<string, unknown>[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
      if (url.includes('/revise')) { commands.push(JSON.parse(String(options?.body))); reopened = true; return json({ recordId: packetId, status: 'draft' }); }
      return url.includes(`/packets/${packetId}`) ? json(reopened ? { ...view(), packetStatus: 'draft' } : view('sealed'))
        : json({ countyId: county, taxYear: 2026, parcelId: context.parcelId, packets: [{ packetId, name: 'Stored synthetic packet', status: 'sealed' }] });
    }));
    render(<MemoryRouter><PacketFinalizationPanel {...context} /></MemoryRouter>);
    expect(await screen.findByRole('textbox', { name: 'Packet narrative' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reopen for revision' })).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Revision reason' }), { target: { value: 'Correct supporting narrative' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reopen for revision' }));
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Packet narrative' })).toBeEnabled());
    expect(screen.queryByRole('button', { name: 'Prepare appeal handoff' })).not.toBeInTheDocument();
    expect(commands[0]).toMatchObject({ expectedRevision: revision, reason: 'Correct supporting narrative', county, taxYear: 2026, parcelId: context.parcelId });
  });
});
