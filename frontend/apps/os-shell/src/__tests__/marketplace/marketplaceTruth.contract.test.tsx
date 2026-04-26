/**
 * Marketplace truth contract
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import fs from 'node:fs';
import path from 'node:path';

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MarketplaceApp from '../../components/marketplace/MarketplaceApp';

const SRC_ROOT = path.resolve(__dirname, '../..');
const REPO_ROOT = path.resolve(SRC_ROOT, '../../../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

function readRepo(relPath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf-8');
}

const axiosMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    get: axiosMocks.get,
    post: axiosMocks.post,
  },
}));

describe('marketplace truth contract', () => {
  beforeEach(() => {
    axiosMocks.get.mockReset();
    axiosMocks.post.mockReset();
  });

  it('mounted marketplace surfaces use MarketplaceApp instead of hardcoded catalogs', () => {
    const desktopSrc = readSrc('components/Marketplace.tsx');
    const routeSrc = readSrc('components/marketplace/TerraFusionMarketplace.tsx');

    expect(desktopSrc).toContain('MarketplaceApp');
    expect(routeSrc).toContain('<MarketplaceApp embedded />');
    expect(routeSrc).not.toContain('AI CONSCIOUSNESS');
    expect(routeSrc).not.toContain('50,000+ Autonomous AI Agents');
  });

  it('MarketplaceApp uses the registry-backed marketplace controller only', () => {
    const src = readSrc('components/marketplace/MarketplaceApp.tsx');

    expect(src).toContain('/api/marketplace/plugins');
    expect(src).toContain('/api/marketplace/categories');
    expect(src).toContain('/api/marketplace/plugins/${plugin.id}/download');
    expect(src).not.toContain('/api/terrafusionmarketplace/');
    expect(src).not.toContain('/rate');
    expect(src).not.toContain('window.open(');
    expect(src).not.toContain('alert(');
    expect(src).toContain('Usage metrics unavailable');
    expect(src).toContain('Launch actions are real registry-backed requests');
  });

  it('TerraFusionMarketplaceController is compatibility-only and no longer returns fabricated analytics', () => {
    const src = readRepo('backend/src/TerraFusion.API/Controllers/TerraFusionMarketplaceController.cs');

    expect(src).toContain('status = "unavailable"');
    expect(src).toContain('/api/marketplace/plugins');
    expect(src).not.toContain('TotalAIAgentsAllocated = 1008');
    expect(src).not.toContain('AverageModulePerformanceScore = 0.96m');
    expect(src).not.toContain('PopularModule');
  });

  it('MarketplaceController slugs modules consistently for launch requests', () => {
    const src = readRepo('backend/src/TerraFusion.API/Controllers/MarketplaceController.cs');

    expect(src).toContain('BuildPluginId');
    expect(src).toContain('metricsAvailable = false');
    expect(src).toContain('sort = "name"');
  });

  it('renders registry-backed marketplace results without fake metrics', async () => {
    axiosMocks.get.mockImplementation((url: string) => {
      if (url.startsWith('/api/marketplace/plugins')) {
        return Promise.resolve({
          data: {
            plugins: [
              {
                id: 'costforge',
                name: 'CostForge',
                version: '1.2.3',
                description: 'Mass appraisal workflow',
                category: 'Core',
                tags: ['core', 'government'],
                metricsAvailable: false,
              },
            ],
          },
        });
      }

      if (url === '/api/marketplace/categories') {
        return Promise.resolve({
          data: [{ name: 'Core', count: 1, icon: 'Package' }],
        });
      }

      return Promise.reject(new Error(`Unexpected url: ${url}`));
    });

    axiosMocks.post.mockResolvedValue({ data: { message: 'ok' } });

    render(<MarketplaceApp />);

    await waitFor(() => {
      expect(screen.getByText('CostForge')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Usage metrics unavailable').length).toBeGreaterThan(0);
    expect(screen.getByText(/Launch actions are real registry-backed requests/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Launch' })).toBeInTheDocument();
    expect(screen.queryByText(/AI CONSCIOUSNESS/i)).not.toBeInTheDocument();
  });
});
