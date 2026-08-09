import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { LocalOpsSurface } from '../../components/localops/LocalOpsSurface';
import { DEFAULT_LOCALOPS_VIEW_MODEL, useLocalOpsStore } from '../../stores/localOpsStore';

const { askLocalOpsMock } = vi.hoisted(() => ({
  askLocalOpsMock: vi.fn(),
}));

vi.mock('../../api/academyLocalOpsApi', () => ({
  askAcademyLocalOps: askLocalOpsMock,
}));

describe('LocalOpsSurface live diagnostic adapter', () => {
  beforeEach(() => {
    askLocalOpsMock.mockReset();
    useLocalOpsStore.setState({ isOpen: true, data: DEFAULT_LOCALOPS_VIEW_MODEL });
  });

  it('renders the grounded engine view model after the operator runs a local diagnostic', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'localops-diagnostic-panel',
      viewModel: {
        profile: 'localops',
        provider: 'ollama',
        model: 'llama3.2:3b',
        flags: {
          externalCalls: false,
          allowWeb: false,
          allowShell: false,
          allowMutation: false,
          requireTrace: true,
          requireSources: true,
        },
        providerStatus: { ok: true, status: 'success', adapter: 'ollama' },
        diagnostics: [
          { name: 'provider.status', status: 'ok', summary: 'provider status: success' },
        ],
        grounded: true,
        sources: [
          {
            sourceFile: 'docs/localops/README.md',
            heading: 'Read-only diagnostics',
            snippet: 'Diagnostics observe and explain only.',
          },
        ],
        traceEvents: [
          {
            type: 'localops.ai.responded',
            ts: '2026-08-09T00:00:00Z',
            summary: 'success',
          },
        ],
        insight: {
          text: 'The local diagnostic path is grounded and read-only. [1]',
          grounded: true,
        },
      },
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-run-diagnostic'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-diagnostic-insight')).toHaveTextContent(
        'grounded and read-only'
      )
    );
    expect(screen.getByTestId('localops-provider-status')).toHaveTextContent('success');
    expect(screen.getByTestId('localops-external-calls-badge')).toHaveTextContent(
      'external calls: disabled'
    );
  });

  it('shows a visible refusal and no insight when the local provider is unavailable', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: false,
      status: 'unavailable',
      reasonCode: 'LOCAL_PROVIDER_FETCH_FAILED',
      message: 'The local provider is unavailable. No external provider was called.',
      safeAlternatives: ['Check the approved Hermes tunnel and local Ollama service.'],
      correlationId: 'corr-localops-provider-123',
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-run-diagnostic'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-refusal-card')).toHaveTextContent(
        'LOCAL_PROVIDER_FETCH_FAILED'
      )
    );
    expect(screen.queryByTestId('localops-diagnostic-insight')).not.toBeInTheDocument();
    expect(screen.getByTestId('localops-provider-status')).toHaveTextContent('unavailable');
    expect(screen.getByTestId('localops-external-calls-badge')).toHaveTextContent(
      'external calls: disabled'
    );
    expect(screen.getByRole('alert')).toHaveTextContent('corr-localops-provider-123');
  });

  it('refuses an unsafe or malformed panel view model instead of rendering it', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'localops-diagnostic-panel',
      viewModel: {
        ...DEFAULT_LOCALOPS_VIEW_MODEL,
        profile: 'cloud-dev',
        provider: 'openai',
        flags: {
          ...DEFAULT_LOCALOPS_VIEW_MODEL.flags,
          externalCalls: true,
        },
        providerStatus: { ok: true, status: 'success', adapter: 'openai' },
        grounded: true,
        sources: [{ sourceFile: 'external', heading: 'unsafe', snippet: 'not local evidence' }],
        insight: { text: 'Unsafe external response', grounded: true },
      },
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-run-diagnostic'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-refusal-card')).toHaveTextContent(
        'INVALID_LOCALOPS_PANEL_RESPONSE'
      )
    );
    expect(screen.queryByTestId('localops-diagnostic-insight')).not.toBeInTheDocument();
    expect(screen.getByTestId('localops-external-calls-badge')).toHaveTextContent(
      'external calls: disabled'
    );
  });

  it('surfaces network failures through the correlation-id error contract', async () => {
    askLocalOpsMock.mockRejectedValue(new Error('socket unavailable'));

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-run-diagnostic'));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not reach LocalOps');
    expect(alert).toHaveTextContent(/net-[a-z0-9-]+/i);
    expect(screen.queryByTestId('localops-diagnostic-insight')).not.toBeInTheDocument();
  });

  it('rejects unsafe nested fields and a non-Ollama adapter', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'localops-diagnostic-panel',
      viewModel: {
        profile: 'localops',
        provider: 'ollama',
        model: 'llama3.2:3b',
        flags: {
          externalCalls: false,
          allowWeb: false,
          allowShell: false,
          allowMutation: false,
          requireTrace: true,
          requireSources: true,
        },
        providerStatus: { ok: true, status: 'success', adapter: 'openai' },
        diagnostics: [{ name: 'provider.status', status: 'ok', summary: { unsafe: true } }],
        grounded: true,
        sources: [
          {
            sourceFile: 'docs/localops/README.md',
            heading: { unsafe: true },
            snippet: 'Diagnostics observe and explain only.',
          },
        ],
        traceEvents: [{ type: 'done', ts: {}, summary: 'success' }],
        insight: { text: 'Unsafe nested response', grounded: true },
      },
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-run-diagnostic'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-refusal-card')).toHaveTextContent(
        'INVALID_LOCALOPS_PANEL_RESPONSE'
      )
    );
    expect(screen.queryByTestId('localops-diagnostic-insight')).not.toBeInTheDocument();
  });
});
