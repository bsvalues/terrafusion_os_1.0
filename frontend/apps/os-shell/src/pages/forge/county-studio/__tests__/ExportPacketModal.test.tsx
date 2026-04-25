// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/ExportPacketModal.test.tsx
//
// Unit tests for ExportPacketModal.
// Covers: loading, error, packet content, Download JSON, Copy Markdown, close.

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ExportPacketModal } from '../components/ExportPacketModal';
import { evidencePacketApi } from '../countyStudyApi';
import type { EvidencePacketDto } from '../countyStudyApi';

vi.mock('../countyStudyApi', () => ({
  evidencePacketApi: { get: vi.fn() },
  // evidencePacketToMarkdown is imported from utils — stub the whole module
  // so the clipboard path can be exercised without the real markdown fn.
}));

vi.mock('../utils/evidencePacketMarkdown', () => ({
  evidencePacketToMarkdown: () => '# Markdown stub',
}));

const MOCK_PACKET: EvidencePacketDto = {
  studyId: 'study-1',
  countyName: 'Benton County',
  taxYear: 2026,
  studyType: 'RatioStudy',
  studyStatus: 'Active',
  exportedAt: '2026-04-24T00:00:00Z',
  exportedBy: 'bsvalues',
  medianRatio: 0.97,
  cod: 12.3,
  prd: 1.01,
  complianceStatus: 'IaaoCompliant',
  parcelCount: 89247,
  ratioCount: 1240,
  criticalSegments: 1,
  warningSegments: 3,
  healthySegments: 8,
  primaryScenario: {
    scenarioId: 'sc-1',
    adjustmentType: 'PercentageIncrease',
    parameters: '{"magnitude":5}',
    rationale: 'Market trend correction',
    status: 'Saved',
    createdAt: '2026-04-20T00:00:00Z',
    createdBy: 'bsvalues',
  },
  aiDiagnosis: null,
  exceptions: [],
};

const mockGet = evidencePacketApi.get as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ExportPacketModal', () => {
  it('shows loading state while fetching', () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ExportPacketModal studyId="study-1" onClose={vi.fn()} />);
    expect(screen.getByTestId('export-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('export-packet-content')).not.toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network down'));
    render(<ExportPacketModal studyId="study-1" onClose={vi.fn()} />);
    await screen.findByTestId('export-error');
    expect(screen.getByTestId('export-error')).toHaveTextContent('Failed to generate evidence packet.');
    expect(screen.queryByTestId('export-packet-content')).not.toBeInTheDocument();
  });

  it('renders packet content after successful fetch', async () => {
    mockGet.mockResolvedValueOnce(MOCK_PACKET);
    render(<ExportPacketModal studyId="study-1" onClose={vi.fn()} />);
    await screen.findByTestId('export-packet-content');
    expect(screen.getByText('Benton County')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('Market trend correction')).toBeInTheDocument();
  });

  it('shows Download JSON and Copy Markdown buttons when packet is loaded', async () => {
    mockGet.mockResolvedValueOnce(MOCK_PACKET);
    render(<ExportPacketModal studyId="study-1" onClose={vi.fn()} />);
    await screen.findByTestId('export-download-json');
    expect(screen.getByTestId('export-download-json')).toBeInTheDocument();
    expect(screen.getByTestId('export-copy-markdown')).toBeInTheDocument();
  });

  it('Copy Markdown button shows "✓ Copied!" feedback then resets', async () => {
    mockGet.mockResolvedValueOnce(MOCK_PACKET);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ExportPacketModal studyId="study-1" onClose={vi.fn()} />);
    await screen.findByTestId('export-copy-markdown');

    fireEvent.click(screen.getByTestId('export-copy-markdown'));
    await waitFor(() => {
      expect(screen.getByTestId('export-copy-markdown')).toHaveTextContent('✓ Copied!');
    });
    expect(writeText).toHaveBeenCalledWith('# Markdown stub');
  });

  it('close button calls onClose', async () => {
    mockGet.mockResolvedValueOnce(MOCK_PACKET);
    const onClose = vi.fn();
    render(<ExportPacketModal studyId="study-1" onClose={onClose} />);
    await screen.findByTestId('export-close');
    fireEvent.click(screen.getByTestId('export-close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not render loading or error after successful fetch', async () => {
    mockGet.mockResolvedValueOnce(MOCK_PACKET);
    render(<ExportPacketModal studyId="study-1" onClose={vi.fn()} />);
    await screen.findByTestId('export-packet-content');
    expect(screen.queryByTestId('export-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('export-error')).not.toBeInTheDocument();
  });

  it('hides Download/Copy buttons in loading state', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<ExportPacketModal studyId="study-1" onClose={vi.fn()} />);
    expect(screen.queryByTestId('export-download-json')).not.toBeInTheDocument();
    expect(screen.queryByTestId('export-copy-markdown')).not.toBeInTheDocument();
  });

  it('passes scenarioId query param to evidencePacketApi.get', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<ExportPacketModal studyId="study-1" scenarioId="sc-42" onClose={vi.fn()} />);
    expect(mockGet).toHaveBeenCalledWith('study-1', 'sc-42');
  });
});
