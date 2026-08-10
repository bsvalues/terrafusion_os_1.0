import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalOpsPanel, type LocalOpsViewModel } from '../../components/localops/LocalOpsPanel';

function baseVm(overrides: Partial<LocalOpsViewModel> = {}): LocalOpsViewModel {
  return {
    profile: 'localops',
    provider: 'ollama',
    model: 'llama3',
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
      { name: 'ai.profile', status: 'ok', summary: 'active AI profile: localops' },
      { name: 'provider.status', status: 'ok', summary: 'provider status: success' },
    ],
    grounded: true,
    sources: [
      {
        sourceFile: 'docs/localops/README.md',
        heading: 'Doctrine',
        snippet: 'local-first, source-grounded',
      },
    ],
    traceEvents: [
      {
        type: 'localops.tool.diagnostic.completed',
        ts: '2026-06-11T00:00:00Z',
        summary: 'provider-status ok',
      },
    ],
    ...overrides,
  };
}

describe('LocalOpsPanel (WO-LOCALOPS-006)', () => {
  it('renders inside the shell as a complementary panel (not a window/app)', () => {
    render(<LocalOpsPanel data={baseVm()} />);
    const panel = screen.getByTestId('localops-panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute('role', 'complementary');
    expect(panel).toHaveAttribute('aria-label', 'TerraPilot LocalOps');
    // position:fixed shell chrome — never a routed standalone window
    expect(panel.style.position).toBe('fixed');
  });

  it('shows active profile and the external-calls-disabled badge', () => {
    render(<LocalOpsPanel data={baseVm()} />);
    expect(screen.getByTestId('localops-profile-badge')).toHaveTextContent('profile: localops');
    expect(screen.getByTestId('localops-external-calls-badge')).toHaveTextContent(
      'external calls: disabled'
    );
  });

  it('shows external-calls ON when a profile permits it', () => {
    render(
      <LocalOpsPanel
        data={baseVm({ profile: 'cloud-dev', flags: { ...baseVm().flags, externalCalls: true } })}
      />
    );
    expect(screen.getByTestId('localops-external-calls-badge')).toHaveTextContent(
      'external calls: ON'
    );
  });

  it('shows provider status', () => {
    render(<LocalOpsPanel data={baseVm()} />);
    const card = screen.getByTestId('localops-provider-status');
    expect(card).toHaveTextContent('Provider');
    expect(card).toHaveTextContent('success');
    expect(card).toHaveTextContent('ollama');
  });

  it('shows read-only diagnostics (Diagnose is the default section)', () => {
    render(<LocalOpsPanel data={baseVm()} />);
    const diag = screen.getByTestId('localops-diagnostics');
    expect(diag).toHaveTextContent('ai.profile');
    expect(diag).toHaveTextContent('provider.status');
  });

  it('shows a grounded local diagnostic insight only after an operator-triggered request', () => {
    const onDiagnose = vi.fn();
    const data = {
      ...baseVm(),
      insight: {
        text: 'LocalOps explains diagnostic readiness from approved local evidence. [1]',
        grounded: true,
      },
    };

    render(
      <LocalOpsPanel
        {...({ data, onDiagnose, diagnosePending: false } as React.ComponentProps<
          typeof LocalOpsPanel
        >)}
      />
    );

    expect(screen.getByTestId('localops-diagnostic-insight')).toHaveTextContent(
      'LocalOps explains diagnostic readiness'
    );
    fireEvent.click(screen.getByTestId('localops-run-diagnostic'));
    expect(onDiagnose).toHaveBeenCalledTimes(1);
  });

  it('offers grounded runbook guidance without an execution affordance', async () => {
    const user = userEvent.setup();
    const onRunbookGuidance = vi.fn();
    const data = baseVm({
      sources: [
        {
          sourceFile: 'docs/localops/BENTON_SERVER_RUNBOOK.md',
          heading: 'R0 — LocalOps self-readiness diagnostic',
          snippet: 'The operator performs the documented step; LocalOps does not execute it.',
        },
      ],
      insight: {
        text: 'Review the read-only finding, perform R1 manually, and escalate if it fails. [1]',
        grounded: true,
      },
      insightKind: 'runbook-guidance',
    });

    render(
      <LocalOpsPanel
        data={data}
        onRunbookGuidance={onRunbookGuidance}
        runbookGuidancePending={false}
      />
    );

    await user.click(screen.getByTestId('localops-section-runbook'));
    expect(screen.getByTestId('localops-runbook-guidance')).toHaveTextContent(
      'perform R1 manually'
    );
    expect(screen.getByTestId('localops-runbook-source')).toHaveTextContent(
      'docs/localops/BENTON_SERVER_RUNBOOK.md'
    );
    await user.click(screen.getByTestId('localops-get-runbook-guidance'));
    expect(onRunbookGuidance).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('button', { name: /execute|restart|apply/i })
    ).not.toBeInTheDocument();
  });

  it('offers a source-grounded Explain journey without mutation affordances', async () => {
    const user = userEvent.setup();
    const onExplain = vi.fn();
    const data = baseVm({
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
    });

    render(<LocalOpsPanel data={data} onExplain={onExplain} explainPending={false} />);

    await user.click(screen.getByTestId('localops-section-explain'));
    expect(screen.getByTestId('localops-explain-workflow')).not.toHaveAttribute('style');
    expect(screen.getByTestId('localops-get-explanation')).not.toHaveAttribute('style');
    expect(screen.getByTestId('localops-explanation')).not.toHaveAttribute('style');
    expect(screen.getByTestId('localops-explain-source')).not.toHaveAttribute('style');
    expect(screen.getByTestId('localops-explanation')).toHaveTextContent('source-grounded');
    expect(screen.getByTestId('localops-explain-source')).toHaveTextContent(
      'docs/localops/LOCALOPS_DOCTRINE.md'
    );
    await user.click(screen.getByTestId('localops-get-explanation'));
    expect(onExplain).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('button', { name: /execute|restart|apply/i })
    ).not.toBeInTheDocument();
  });

  it('shows a structured refusal card clearly when present', () => {
    render(
      <LocalOpsPanel
        data={baseVm({
          refusal: {
            reasonCode: 'EXTERNAL_PROVIDER_REFUSED',
            status: 'refused',
            message:
              "provider 'openai' requires external calls, which the localops profile forbids.",
            safeAlternatives: ['Use AI_PROFILE=hybrid-approved with a documented approval record'],
          },
        })}
      />
    );
    const card = screen.getByTestId('localops-refusal-card');
    expect(card).toHaveTextContent('REFUSED');
    expect(card).toHaveTextContent('EXTERNAL_PROVIDER_REFUSED');
    expect(card).toHaveTextContent('forbids');
    expect(card).toHaveTextContent('hybrid-approved');
  });

  it('Sources section shows source references when grounded', () => {
    render(<LocalOpsPanel data={baseVm()} />);
    fireEvent.click(screen.getByTestId('localops-section-sources'));
    const sources = screen.getByTestId('localops-sources');
    expect(sources).toHaveTextContent('docs/localops/README.md');
    expect(sources).toHaveTextContent('Doctrine');
  });

  it('Sources section shows an honest no-source state when ungrounded', () => {
    render(<LocalOpsPanel data={baseVm({ grounded: false, sources: [] })} />);
    fireEvent.click(screen.getByTestId('localops-section-sources'));
    const none = screen.getByTestId('localops-no-source');
    expect(none).toHaveTextContent('No local source found');
    expect(none).toHaveTextContent('will not answer without support');
  });

  it('Trace section renders events', () => {
    render(<LocalOpsPanel data={baseVm()} />);
    fireEvent.click(screen.getByTestId('localops-section-trace'));
    expect(screen.getByTestId('localops-trace')).toHaveTextContent(
      'localops.tool.diagnostic.completed'
    );
  });

  it('renders all six sections', () => {
    render(<LocalOpsPanel data={baseVm()} />);
    for (const id of ['ask', 'explain', 'diagnose', 'runbook', 'sources', 'trace']) {
      expect(screen.getByTestId(`localops-section-${id}`)).toBeInTheDocument();
    }
  });

  it('handles the unavailable (null) state without crashing', () => {
    render(<LocalOpsPanel data={null} />);
    expect(screen.getByTestId('localops-panel')).toHaveTextContent('LocalOps is unavailable');
  });

  it('exposes no autonomous-action affordances when no operator request handlers are supplied', () => {
    const { container } = render(<LocalOpsPanel data={baseVm()} />);
    // Buttons present are the six section tabs only (no close handler passed here).
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(6);
  });
});

describe('LocalOpsPanel deployment-readiness Ask journey', () => {
  it('offers a grounded readiness brief without an execution or mutation affordance', async () => {
    const user = userEvent.setup();
    const onAskReadiness = vi.fn();
    const data = baseVm({
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
    });

    render(
      <LocalOpsPanel data={data} onAskReadiness={onAskReadiness} askReadinessPending={false} />
    );

    await user.click(screen.getByTestId('localops-section-ask'));
    expect(screen.getByTestId('localops-deployment-readiness')).toHaveTextContent(
      'provider work, KB/RAG indexing'
    );
    expect(screen.getByTestId('localops-deployment-readiness-source')).toHaveTextContent(
      'docs/localops/BENTON_IT_QUESTIONS.md'
    );
    await user.click(screen.getByTestId('localops-get-deployment-readiness'));
    expect(onAskReadiness).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('button', { name: /execute|restart|apply|enable now/i })
    ).not.toBeInTheDocument();
  });

  it('shows a readiness-scoped correlation ID and copy control without a brief', async () => {
    const user = userEvent.setup();
    render(
      <LocalOpsPanel
        data={baseVm({ insightKind: 'deployment-readiness-ask' })}
        onAskReadiness={vi.fn()}
        askReadinessNetworkFailure={{
          message: 'The local provider failed safely.',
          correlationId: 'corr-localops-readiness-proof',
        }}
      />
    );

    await user.click(screen.getByTestId('localops-section-ask'));
    expect(screen.getByRole('alert')).toHaveTextContent('corr-localops-readiness-proof');
    expect(screen.getByRole('button', { name: 'Copy Correlation ID' })).toBeInTheDocument();
    expect(screen.queryByTestId('localops-deployment-readiness')).not.toBeInTheDocument();
    expect(screen.queryByTestId('localops-deployment-readiness-source')).not.toBeInTheDocument();
  });
});
