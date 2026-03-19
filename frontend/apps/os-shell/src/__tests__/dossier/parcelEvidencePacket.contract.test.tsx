/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 1
 * ParcelEvidencePacket Component Contract
 *
 * Tests the packet shell: evidence item list, selection,
 * assembly trigger, and status display.
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Mock the dossier service
vi.mock('../../services/suites/dossierService', () => ({
  getDocuments: vi.fn(),
  getEvidence: vi.fn(),
  assemblePacket: vi.fn(),
  getPackets: vi.fn(),
}));

// Mock writeLane (ParcelEvidencePacket doesn't call it directly, but service does)
vi.mock('../../services/writeLane', () => ({
  assertWriteLane: vi.fn(),
  checkWriteLane: vi.fn(() => true),
  WRITE_LANE_MATRIX: {},
}));

import {
  getDocuments,
  getEvidence,
  assemblePacket,
  getPackets,
} from '../../services/suites/dossierService';
import ParcelEvidencePacket from '../../components/dossier/ParcelEvidencePacket';

const mockGetDocuments = getDocuments as ReturnType<typeof vi.fn>;
const mockGetEvidence = getEvidence as ReturnType<typeof vi.fn>;
const mockAssemblePacket = assemblePacket as ReturnType<typeof vi.fn>;
const mockGetPackets = getPackets as ReturnType<typeof vi.fn>;

const MOCK_DOCUMENTS = [
  {
    documentId: 'DOC-001',
    parcelId: 'P-100',
    type: 'assessment',
    fileName: 'assessment-2026.pdf',
    uploadedAt: '2026-03-01T00:00:00Z',
    uploadedBy: 'jsmith',
  },
  {
    documentId: 'DOC-002',
    parcelId: 'P-100',
    type: 'photo',
    fileName: 'front-photo.jpg',
    uploadedAt: '2026-03-02T00:00:00Z',
    uploadedBy: 'jsmith',
  },
];

const MOCK_EVIDENCE = [
  {
    evidenceId: 'EV-001',
    parcelId: 'P-100',
    type: 'comparable-sale',
    description: 'Comparable sale at 123 Main St',
    addedAt: '2026-03-01T00:00:00Z',
  },
];

describe('ParcelEvidencePacket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDocuments.mockResolvedValue(MOCK_DOCUMENTS);
    mockGetEvidence.mockResolvedValue(MOCK_EVIDENCE);
    mockGetPackets.mockResolvedValue([]);
    mockAssemblePacket.mockResolvedValue({
      packetId: 'PKT-001',
      parcelId: 'P-100',
      documents: ['DOC-001'],
      status: 'assembled',
    });
  });

  it('renders loading state initially', () => {
    // Make promises hang to see loading state
    mockGetDocuments.mockReturnValue(new Promise(() => {}));
    mockGetEvidence.mockReturnValue(new Promise(() => {}));
    mockGetPackets.mockReturnValue(new Promise(() => {}));

    render(<ParcelEvidencePacket parcelId="P-100" />);

    expect(screen.getByTestId('evidence-packet-loading')).toBeInTheDocument();
  });

  it('renders evidence items after loading', async () => {
    render(<ParcelEvidencePacket parcelId="P-100" />);

    await waitFor(() => {
      expect(screen.getAllByTestId('evidence-item')).toHaveLength(3);
    });
  });

  it('renders empty state when no documents or evidence exist', async () => {
    mockGetDocuments.mockResolvedValue([]);
    mockGetEvidence.mockResolvedValue([]);

    render(<ParcelEvidencePacket parcelId="P-100" />);

    await waitFor(() => {
      expect(screen.getByTestId('evidence-packet-empty')).toBeInTheDocument();
    });
  });

  it('disables assemble button when no items selected', async () => {
    render(<ParcelEvidencePacket parcelId="P-100" />);

    await waitFor(() => {
      expect(screen.getByTestId('assemble-packet-btn')).toBeDisabled();
    });
  });

  it('enables assemble button when items are selected', async () => {
    render(<ParcelEvidencePacket parcelId="P-100" />);

    await waitFor(() => {
      expect(screen.getAllByTestId('evidence-item')).toHaveLength(3);
    });

    // Click the first checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(screen.getByTestId('assemble-packet-btn')).toBeEnabled();
  });

  it('shows packet status after assembly', async () => {
    render(<ParcelEvidencePacket parcelId="P-100" />);

    await waitFor(() => {
      expect(screen.getAllByTestId('evidence-item')).toHaveLength(3);
    });

    // Select an item and assemble
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(screen.getByTestId('assemble-packet-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('packet-status')).toHaveTextContent('assembled');
    });
  });

  it('calls assemblePacket with selected document IDs', async () => {
    render(<ParcelEvidencePacket parcelId="P-100" />);

    await waitFor(() => {
      expect(screen.getAllByTestId('evidence-item')).toHaveLength(3);
    });

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(screen.getByTestId('assemble-packet-btn'));

    await waitFor(() => {
      expect(mockAssemblePacket).toHaveBeenCalledWith('P-100', ['DOC-001']);
    });
  });
});
