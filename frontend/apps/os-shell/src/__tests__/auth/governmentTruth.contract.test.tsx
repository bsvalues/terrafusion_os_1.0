import fs from 'node:fs';
import path from 'node:path';

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GovernmentAIStatus } from '../../components/ai/GovernmentAIStatus';

const SRC_ROOT = path.resolve(__dirname, '../..');
const REPO_ROOT = path.resolve(SRC_ROOT, '../../../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

function readRepo(relPath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf-8');
}

const serviceMocks = vi.hoisted(() => ({
  getGovernmentMetrics: vi.fn(),
}));

vi.mock('../../services/TerraFusionEliteAPI', () => ({
  terraFusionAPI: {
    getGovernmentMetrics: serviceMocks.getGovernmentMetrics,
  },
}));

describe('government truth contract', () => {
  beforeEach(() => {
    serviceMocks.getGovernmentMetrics.mockReset();
  });

  it('GovernmentController no longer exposes static fallback government claims', () => {
    const src = readRepo('backend/src/TerraFusion.API/Controllers/GovernmentController.cs');
    expect(src).not.toContain('1008_AGENTS_ACTIVE');
    expect(src).not.toContain('GOVERNMENT_TRANSCENDED');
    expect(src).not.toContain('STATIC_FALLBACK');
  });

  it('AgentsController no longer hardcodes a 1008-agent runtime claim', () => {
    const src = readRepo('backend/src/TerraFusion.API/Controllers/AgentsController.cs');
    expect(src).not.toContain('totalAgents = 1008');
    expect(src).toContain('SentinelEventBuffer');
  });

  it('GovernmentAIStatus separates loading from unavailable evidence', async () => {
    serviceMocks.getGovernmentMetrics.mockResolvedValue({
      success: false,
      error: 'Backend unavailable and no fresh cached evidence exists for this endpoint.',
      source: 'QUANTUM_SIMULATION',
      timestamp: Date.now(),
    });

    render(<GovernmentAIStatus />);

    await waitFor(() => {
      expect(screen.getByText('Government AI evidence unavailable')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Backend unavailable and no fresh cached evidence exists/i)
    ).toBeInTheDocument();
  });
});
