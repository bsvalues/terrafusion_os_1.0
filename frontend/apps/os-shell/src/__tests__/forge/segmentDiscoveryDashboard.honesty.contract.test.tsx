/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SegmentDiscoveryDashboard from '../../pages/forge/calibration/SegmentDiscoveryDashboard';
import { statisticsAPI } from '@/services/forge/statisticsAPI';

vi.mock('@/services/forge/statisticsAPI', () => ({
  statisticsAPI: {
    discoverSegments: vi.fn(),
  },
}));

const mockedDiscoverSegments = vi.mocked(statisticsAPI.discoverSegments);

describe('SegmentDiscoveryDashboard honesty contract', () => {
  beforeEach(() => {
    mockedDiscoverSegments.mockReset();
  });

  it('renders explicit unavailable state instead of fixture fallback when discovery fails', async () => {
    mockedDiscoverSegments.mockRejectedValue(new Error('discovery service unavailable'));

    render(<SegmentDiscoveryDashboard />);

    expect(await screen.findByTestId('segment-discovery-unavailable')).toBeInTheDocument();
    expect(screen.queryByText('DEMO DATA')).not.toBeInTheDocument();
    expect(
      screen.getByText('No governed segment evidence is being replaced with fixture data on this surface.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Segment discovery unavailable. No governed segments are being shown.')
    ).toBeInTheDocument();
  });

  it('renders live segment evidence when discovery succeeds', async () => {
    mockedDiscoverSegments.mockResolvedValue([
      {
        id: 'seg-1',
        name: 'North Richland Standard',
        boundaryDescription: 'North Richland neighborhood code 104 with standard-grade homes',
        status: 'pending',
        confidence: 0.92,
        parcelCount: 412,
        medianValue: 428000,
        avgSqft: 2140,
        avgAge: 18,
        keyCharacteristics: ['Neighborhood 104', 'Standard', 'Single Family'],
      },
    ]);

    render(<SegmentDiscoveryDashboard />);

    expect(await screen.findByText('North Richland Standard')).toBeInTheDocument();
    expect(screen.queryByTestId('segment-discovery-unavailable')).not.toBeInTheDocument();
    expect(screen.getByText('92% confidence')).toBeInTheDocument();
    expect(screen.getByText('412')).toBeInTheDocument();
  });
});
