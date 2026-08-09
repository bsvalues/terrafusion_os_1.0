import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AcademyLocalOpsJourney } from '../../components/academy/AcademyLocalOpsJourney';
import { askAcademyLocalOps } from '../../api/academyLocalOpsApi';

vi.mock('../../api/academyLocalOpsApi', () => ({
  askAcademyLocalOps: vi.fn(),
}));

const askMock = vi.mocked(askAcademyLocalOps);

describe('AcademyLocalOpsJourney', () => {
  beforeEach(() => {
    askMock.mockReset();
  });

  it('sends only the selected synthetic question id and renders a grounded local answer', async () => {
    askMock.mockResolvedValue({
      ok: true,
      status: 'success',
      journey: 'academy-localops',
      question: {
        id: 'localops-safety-boundary',
        label: 'Why is LocalOps read-only?',
      },
      answer: {
        text: 'LocalOps stays read-only so reasoning cannot mutate county systems.',
        grounded: true,
        sources: [
          {
            sourceFile: 'docs/localops/LOCALOPS_DOCTRINE.md',
            heading: 'Safety boundary',
            snippet: 'Read-only and local-first.',
          },
        ],
      },
      provider: { name: 'ollama', model: 'llama3.2:3b', boundary: 'hermes-ssh-tunnel' },
      safety: {
        externalCalls: false,
        allowWeb: false,
        allowShell: false,
        allowMutation: false,
        requireTrace: true,
        requireSources: true,
      },
      trace: { eventCount: 2 },
    });

    render(<AcademyLocalOpsJourney />);

    fireEvent.click(screen.getByRole('button', { name: 'Ask local model' }));

    await waitFor(() =>
      expect(askMock).toHaveBeenCalledWith({ questionId: 'localops-safety-boundary' })
    );
    expect(await screen.findByText(/reasoning cannot mutate county systems/i)).toBeInTheDocument();
    expect(screen.getByText('llama3.2:3b')).toBeInTheDocument();
    expect(screen.getByText('docs/localops/LOCALOPS_DOCTRINE.md')).toBeInTheDocument();
    expect(screen.getByText(/external providers: off/i)).toBeInTheDocument();
  });

  it('shows a safe, visible unavailable state without fallback content', async () => {
    askMock.mockResolvedValue({
      ok: false,
      status: 'unavailable',
      reasonCode: 'LOCAL_PROVIDER_FAILED',
      message: 'The local model path is unavailable. No external provider was called.',
      safeAlternatives: ['Restore the approved Hermes tunnel and try again.'],
    });

    render(<AcademyLocalOpsJourney />);
    fireEvent.click(screen.getByRole('button', { name: 'Ask local model' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/unavailable/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/no external provider was called/i);
    expect(screen.queryByText(/template answer/i)).not.toBeInTheDocument();
  });

  it('renders network failure as unavailable rather than inventing an answer', async () => {
    askMock.mockRejectedValue(new Error('fetch failed'));

    render(<AcademyLocalOpsJourney />);
    fireEvent.click(screen.getByRole('button', { name: 'Ask local model' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach localops/i);
    expect(screen.queryByTestId('academy-localops-answer')).not.toBeInTheDocument();
  });
});
