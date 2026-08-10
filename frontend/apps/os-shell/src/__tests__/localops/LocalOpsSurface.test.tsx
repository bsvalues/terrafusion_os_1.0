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

  it('keeps a diagnostic transport error out of the runbook journey', async () => {
    askLocalOpsMock.mockRejectedValue(new Error('socket unavailable'));

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-run-diagnostic'));

    await screen.findByRole('alert');
    fireEvent.click(screen.getByTestId('localops-section-runbook'));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('localops-refusal-card')).toHaveTextContent(
      'LOCALOPS_NETWORK_UNAVAILABLE'
    );

    fireEvent.click(screen.getByTestId('localops-get-runbook-guidance'));
    const runbookAlert = await screen.findByRole('alert');
    expect(runbookAlert).toHaveTextContent('Could not reach LocalOps');
    expect(runbookAlert).toHaveTextContent(/net-[a-z0-9-]+/i);
    expect(screen.queryByTestId('localops-runbook-guidance')).not.toBeInTheDocument();
    expect(askLocalOpsMock).toHaveBeenCalledTimes(2);
  });

  it('fails closed when a provider refusal contains malformed fields', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: false,
      status: 'unavailable',
      reasonCode: 'LOCAL_PROVIDER_FAILED',
      message: { unsafe: true },
      safeAlternatives: { unsafe: true },
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

  it('renders canonical runbook guidance through the existing LocalOps journey', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'localops-runbook-guidance',
      viewModel: {
        ...DEFAULT_LOCALOPS_VIEW_MODEL,
        profile: 'localops',
        provider: 'ollama',
        model: 'llama3.2:3b',
        providerStatus: { ok: true, status: 'success', adapter: 'ollama' },
        grounded: true,
        sources: [
          {
            sourceFile: 'docs/localops/BENTON_SERVER_RUNBOOK.md',
            heading: 'R0 — LocalOps self-readiness diagnostic',
            snippet: 'LocalOps proposes the documented operator step and does not execute it.',
          },
        ],
        insight: {
          text: 'Review the read-only diagnostic, perform the documented step manually, and escalate on failure. [1]',
          grounded: true,
        },
        insightKind: 'runbook-guidance',
      },
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-runbook'));
    fireEvent.click(screen.getByTestId('localops-get-runbook-guidance'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-runbook-guidance')).toHaveTextContent(
        'perform the documented step manually'
      )
    );
    expect(askLocalOpsMock).toHaveBeenCalledWith({ questionId: 'localops-runbook-guidance' });
    expect(screen.getByTestId('localops-runbook-source')).toHaveTextContent(
      'docs/localops/BENTON_SERVER_RUNBOOK.md'
    );
  });

  it('renders a canonical source-grounded explanation through the existing LocalOps journey', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'localops-source-grounded-explain',
      viewModel: {
        ...DEFAULT_LOCALOPS_VIEW_MODEL,
        profile: 'localops',
        provider: 'ollama',
        model: 'llama3.2:3b',
        providerStatus: { ok: true, status: 'success', adapter: 'ollama' },
        grounded: true,
        sources: [
          {
            sourceFile: 'docs/localops/LOCALOPS_DOCTRINE.md',
            heading: '2. What LocalOps IS',
            snippet: 'LocalOps v1 observes and explains without mutation.',
          },
        ],
        insight: {
          text: 'LocalOps is local-first, source-grounded, trace-emitting, and read-only. [1]',
          grounded: true,
        },
        insightKind: 'source-grounded-explain',
      },
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-explain'));
    fireEvent.click(screen.getByTestId('localops-get-explanation'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-explanation')).toHaveTextContent('source-grounded')
    );
    expect(askLocalOpsMock).toHaveBeenCalledWith({
      questionId: 'localops-source-grounded-explain',
    });
  });

  it('fails closed and shows no explanation when Explain returns a noncanonical source', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'localops-source-grounded-explain',
      viewModel: {
        ...DEFAULT_LOCALOPS_VIEW_MODEL,
        profile: 'localops',
        provider: 'ollama',
        model: 'llama3.2:3b',
        providerStatus: { ok: true, status: 'success', adapter: 'ollama' },
        grounded: true,
        sources: [
          {
            sourceFile: 'docs/operations/UNRELATED.md',
            heading: 'Unrelated',
            snippet: 'Outside the fixed Explain contract.',
          },
        ],
        insight: { text: 'Unsafe explanation. [1]', grounded: true },
        insightKind: 'source-grounded-explain',
      },
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-explain'));
    fireEvent.click(screen.getByTestId('localops-get-explanation'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-refusal-card')).toHaveTextContent(
        'INVALID_LOCALOPS_PANEL_RESPONSE'
      )
    );
    expect(screen.queryByTestId('localops-explanation')).not.toBeInTheDocument();
  });

  it.each([
    ['a wrong doctrine heading', '3. What LocalOps IS NOT — hard prohibitions'],
    ['a missing doctrine heading', undefined],
  ])('fails closed when Explain returns %s', async (_case, heading) => {
    askLocalOpsMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'localops-source-grounded-explain',
      viewModel: {
        ...DEFAULT_LOCALOPS_VIEW_MODEL,
        profile: 'localops',
        provider: 'ollama',
        model: 'llama3.2:3b',
        providerStatus: { ok: true, status: 'success', adapter: 'ollama' },
        grounded: true,
        sources: [
          {
            sourceFile: 'docs/localops/LOCALOPS_DOCTRINE.md',
            ...(heading ? { heading } : {}),
            snippet: 'This evidence does not satisfy the fixed Explain contract.',
          },
        ],
        insight: { text: 'Unsafe explanation. [1]', grounded: true },
        insightKind: 'source-grounded-explain',
      },
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-explain'));
    fireEvent.click(screen.getByTestId('localops-get-explanation'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-refusal-card')).toHaveTextContent(
        'INVALID_LOCALOPS_PANEL_RESPONSE'
      )
    );
    expect(screen.queryByTestId('localops-explanation')).not.toBeInTheDocument();
  });

  it('scopes an unavailable-provider error to Explain and shows no explanation', async () => {
    askLocalOpsMock.mockRejectedValue(new Error('approved tunnel unavailable'));

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-explain'));
    fireEvent.click(screen.getByTestId('localops-get-explanation'));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not reach LocalOps');
    expect(alert).toHaveTextContent(/net-[a-z0-9-]+/i);
    expect(screen.queryByTestId('localops-explanation')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('localops-section-runbook'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('preserves an Explain backend correlation ID and copy control', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: false,
      status: 'failed',
      reasonCode: 'LOCAL_PROVIDER_FAILED',
      message: 'The local provider failed safely.',
      correlationId: 'corr-localops-explain-proof',
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-explain'));
    fireEvent.click(screen.getByTestId('localops-get-explanation'));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('corr-localops-explain-proof');
    expect(screen.getByRole('button', { name: 'Copy Correlation ID' })).toBeInTheDocument();
    expect(screen.queryByTestId('localops-explanation')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('localops-section-runbook'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('fails closed and shows no runbook guidance when the canonical runbook source is missing', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'localops-runbook-guidance',
      viewModel: {
        ...DEFAULT_LOCALOPS_VIEW_MODEL,
        profile: 'localops',
        provider: 'ollama',
        model: 'llama3.2:3b',
        providerStatus: { ok: true, status: 'success', adapter: 'ollama' },
        grounded: true,
        sources: [
          {
            sourceFile: 'docs/localops/README.md',
            heading: 'Overview',
            snippet: 'LocalOps is read-only.',
          },
        ],
        insight: { text: 'Untrusted generic guidance. [1]', grounded: true },
        insightKind: 'runbook-guidance',
      },
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-runbook'));
    fireEvent.click(screen.getByTestId('localops-get-runbook-guidance'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-refusal-card')).toHaveTextContent(
        'INVALID_LOCALOPS_PANEL_RESPONSE'
      )
    );
    expect(screen.queryByTestId('localops-runbook-guidance')).not.toBeInTheDocument();
  });

  it('rejects a mixed-source runbook response even when the canonical runbook is present', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'localops-runbook-guidance',
      viewModel: {
        ...DEFAULT_LOCALOPS_VIEW_MODEL,
        profile: 'localops',
        provider: 'ollama',
        model: 'llama3.2:3b',
        providerStatus: { ok: true, status: 'success', adapter: 'ollama' },
        grounded: true,
        sources: [
          {
            sourceFile: 'docs/localops/BENTON_SERVER_RUNBOOK.md',
            heading: 'R0',
            snippet: 'Canonical guidance.',
          },
          {
            sourceFile: 'docs/operations/UNRELATED_RUNBOOK.md',
            heading: 'Unrelated',
            snippet: 'Outside the fixed contract.',
          },
        ],
        insight: { text: 'Mixed-source guidance. [1] [2]', grounded: true },
        insightKind: 'runbook-guidance',
      },
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-runbook'));
    fireEvent.click(screen.getByTestId('localops-get-runbook-guidance'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-refusal-card')).toHaveTextContent(
        'INVALID_LOCALOPS_PANEL_RESPONSE'
      )
    );
    expect(screen.queryByTestId('localops-runbook-guidance')).not.toBeInTheDocument();
  });

  it('rejects runbook-labeled insight returned through the diagnostic journey', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'localops-diagnostic-panel',
      viewModel: {
        profile: 'localops',
        provider: 'ollama',
        model: 'llama3.2:3b',
        flags: DEFAULT_LOCALOPS_VIEW_MODEL.flags,
        providerStatus: { ok: true, status: 'success', adapter: 'ollama' },
        diagnostics: [],
        grounded: true,
        sources: [
          {
            sourceFile: 'docs/localops/BENTON_SERVER_RUNBOOK.md',
            heading: 'R0',
            snippet: 'Canonical guidance.',
          },
        ],
        traceEvents: [],
        insight: { text: 'Cross-journey content. [1]', grounded: true },
        insightKind: 'runbook-guidance',
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

  it('serializes diagnostic and runbook requests so an older response cannot overwrite a newer journey', async () => {
    let resolveDiagnostic!: (value: unknown) => void;
    askLocalOpsMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDiagnostic = resolve;
        })
    );

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-run-diagnostic'));
    fireEvent.click(screen.getByTestId('localops-section-runbook'));

    expect(screen.getByTestId('localops-get-runbook-guidance')).toBeDisabled();
    fireEvent.click(screen.getByTestId('localops-get-runbook-guidance'));
    expect(askLocalOpsMock).toHaveBeenCalledTimes(1);

    resolveDiagnostic({
      ok: false,
      status: 'unavailable',
      reasonCode: 'LOCAL_PROVIDER_TIMEOUT',
      message: 'The local provider timed out safely.',
    });
    await waitFor(() => expect(screen.getByTestId('localops-get-runbook-guidance')).toBeEnabled());
  });

  it('shows a visible refusal and no runbook guidance when the local provider is unavailable', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: false,
      status: 'unavailable',
      reasonCode: 'LOCAL_PROVIDER_FETCH_FAILED',
      message: 'The local provider is unavailable. No external provider was called.',
      correlationId: 'corr-localops-runbook-503',
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-runbook'));
    fireEvent.click(screen.getByTestId('localops-get-runbook-guidance'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-refusal-card')).toHaveTextContent(
        'LOCAL_PROVIDER_FETCH_FAILED'
      )
    );
    expect(screen.queryByTestId('localops-runbook-guidance')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('corr-localops-runbook-503');
  });
});

describe('LocalOpsSurface deployment-readiness Ask journey', () => {
  beforeEach(() => {
    askLocalOpsMock.mockReset();
    useLocalOpsStore.setState({ isOpen: true, data: DEFAULT_LOCALOPS_VIEW_MODEL });
  });

  it('renders the canonical readiness brief through the existing LocalOps path', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'localops-deployment-readiness',
      viewModel: {
        ...DEFAULT_LOCALOPS_VIEW_MODEL,
        profile: 'localops',
        provider: 'ollama',
        model: 'llama3.2:3b',
        providerStatus: { ok: true, status: 'success', adapter: 'ollama' },
        grounded: true,
        sources: [
          {
            sourceFile: 'docs/localops/BENTON_IT_QUESTIONS.md',
            heading: 'Stop conditions',
            snippet: 'Unanswered boundary questions are stop conditions.',
          },
        ],
        insight: {
          text: 'Confirm the documented gates for provider work, KB/RAG indexing, and capabilities above read-only. [1]',
          grounded: true,
        },
        insightKind: 'deployment-readiness-ask',
      },
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-ask'));
    fireEvent.click(screen.getByTestId('localops-get-deployment-readiness'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-deployment-readiness')).toHaveTextContent(
        'provider work, KB/RAG indexing'
      )
    );
    expect(askLocalOpsMock).toHaveBeenCalledWith({
      questionId: 'localops-deployment-readiness',
    });
  });

  it('shows no readiness brief when the response cites a mismatched readiness section', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'localops-deployment-readiness',
      viewModel: {
        ...DEFAULT_LOCALOPS_VIEW_MODEL,
        profile: 'localops',
        provider: 'ollama',
        model: 'llama3.2:3b',
        providerStatus: { ok: true, status: 'success', adapter: 'ollama' },
        grounded: true,
        sources: [
          {
            sourceFile: 'docs/localops/BENTON_IT_QUESTIONS.md',
            heading: '1. Network & egress',
            snippet: 'Outside the fixed stop-condition section contract.',
          },
        ],
        insight: { text: 'Unsafe readiness answer. [1]', grounded: true },
        insightKind: 'deployment-readiness-ask',
      },
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-ask'));
    fireEvent.click(screen.getByTestId('localops-get-deployment-readiness'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-refusal-card')).toHaveTextContent(
        'INVALID_LOCALOPS_PANEL_RESPONSE'
      )
    );
    expect(screen.queryByTestId('localops-deployment-readiness')).not.toBeInTheDocument();
  });

  it('preserves a readiness backend correlation ID and renders no readiness brief', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: false,
      status: 'failed',
      reasonCode: 'LOCAL_PROVIDER_FAILED',
      message: 'The local provider failed safely.',
      correlationId: 'corr-localops-readiness-503',
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-ask'));
    fireEvent.click(screen.getByTestId('localops-get-deployment-readiness'));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('corr-localops-readiness-503');
    expect(screen.getByRole('button', { name: 'Copy Correlation ID' })).toBeInTheDocument();
    expect(screen.queryByTestId('localops-deployment-readiness')).not.toBeInTheDocument();
  });

  it('normalizes a rejected readiness request to a net correlation ID and no brief', async () => {
    askLocalOpsMock.mockRejectedValue(new Error('approved tunnel unavailable'));

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-ask'));
    fireEvent.click(screen.getByTestId('localops-get-deployment-readiness'));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not reach LocalOps');
    expect(alert).toHaveTextContent(/net-[a-z0-9-]+/i);
    expect(screen.queryByTestId('localops-deployment-readiness')).not.toBeInTheDocument();
  });
});

describe('LocalOpsSurface synthetic exemption advisory journey', () => {
  beforeEach(() => {
    askLocalOpsMock.mockReset();
    useLocalOpsStore.setState({ isOpen: true, data: DEFAULT_LOCALOPS_VIEW_MODEL });
  });

  it('renders the fixed synthetic exemption advisory through the existing LocalOps request path', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'localops-synthetic-exemption-advisory',
      viewModel: {
        ...DEFAULT_LOCALOPS_VIEW_MODEL,
        profile: 'localops',
        provider: 'ollama',
        model: 'llama3.2:3b',
        providerStatus: { ok: true, status: 'success', adapter: 'ollama' },
        grounded: true,
        sources: [
          {
            sourceFile: 'synthetic-demo/localops-exemption-review-v1',
            heading: 'Fixed senior exemption review facts',
            snippet:
              'applicantAge: 71; ownerOccupied: true; incomeDocumentation: not_provided; residencyDocumentation: provided',
          },
        ],
        insightKind: 'synthetic-exemption-advisory',
        exemptionAdvisory: {
          synthetic: true,
          verdict: 'needs_review',
          groundingFacts: [
            'applicantAge: 71',
            'ownerOccupied: true',
            'incomeDocumentation: not_provided',
            'residencyDocumentation: provided',
          ],
          disclaimer:
            'Advisory only — not an exemption determination. A human assessor must verify against statute and evidence before any action.',
        },
      },
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-ask'));
    fireEvent.click(screen.getByTestId('localops-get-exemption-advisory'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-exemption-advisory')).toHaveTextContent('needs review')
    );
    expect(askLocalOpsMock).toHaveBeenCalledWith({
      questionId: 'localops-synthetic-exemption-advisory',
    });
  });

  it('rejects a synthetic exemption advisory when any fixed grounding fact drifts', async () => {
    askLocalOpsMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'localops-synthetic-exemption-advisory',
      viewModel: {
        ...DEFAULT_LOCALOPS_VIEW_MODEL,
        profile: 'localops',
        provider: 'ollama',
        model: 'llama3.2:3b',
        providerStatus: { ok: true, status: 'success', adapter: 'ollama' },
        grounded: true,
        sources: [
          {
            sourceFile: 'synthetic-demo/localops-exemption-review-v1',
            heading: 'Fixed senior exemption review facts',
            snippet: 'applicantAge: 72',
          },
        ],
        insightKind: 'synthetic-exemption-advisory',
        exemptionAdvisory: {
          synthetic: true,
          verdict: 'likely_eligible',
          groundingFacts: ['applicantAge: 72'],
          disclaimer: 'Advisory only.',
        },
      },
    });

    render(<LocalOpsSurface />);
    fireEvent.click(screen.getByTestId('localops-section-ask'));
    fireEvent.click(screen.getByTestId('localops-get-exemption-advisory'));

    await waitFor(() =>
      expect(screen.getByTestId('localops-refusal-card')).toHaveTextContent(
        'INVALID_LOCALOPS_PANEL_RESPONSE'
      )
    );
    expect(screen.queryByTestId('localops-exemption-advisory')).not.toBeInTheDocument();
  });
});
