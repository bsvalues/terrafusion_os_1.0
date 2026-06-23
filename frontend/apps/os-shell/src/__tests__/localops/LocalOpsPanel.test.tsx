import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('exposes no autonomous-action affordances (only section tabs + optional close)', () => {
    const { container } = render(<LocalOpsPanel data={baseVm()} />);
    // Buttons present are the six section tabs only (no close handler passed here).
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(6);
  });
});
