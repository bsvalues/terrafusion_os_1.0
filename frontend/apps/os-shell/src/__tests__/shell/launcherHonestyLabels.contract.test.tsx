import { vi, describe, it, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../config/suiteRegistry', () => ({
  CONSTITUTIONAL_SUITES: [
    {
      id: 'forge',
      displayName: 'TerraForge',
      shortName: 'Forge',
      description: 'Live valuation workspace',
      iconName: 'Hammer',
      route: '/forge',
      color: 'hsl(var(--tf-suite-forge))',
      status: 'live',
    },
    {
      id: 'dossier',
      displayName: 'TerraDossier',
      shortName: 'Dossier',
      description: 'Evidence workspace still in progress',
      iconName: 'FileStack',
      route: '/dossier',
      color: 'hsl(var(--tf-suite-dossier))',
      status: 'queued',
    },
    {
      id: 'gpt',
      displayName: 'TerraGPT',
      shortName: 'GPT',
      description: 'Future assistant surface',
      iconName: 'Bot',
      route: '/gpt',
      color: 'hsl(var(--tf-suite-gpt))',
      status: 'unavailable',
    },
  ],
  OS_FEATURES: [
    {
      id: 'pilot',
      displayName: 'TerraPilot',
      shortName: 'Pilot',
      description: 'Pilot runtime',
      iconName: 'Compass',
      route: '/pilot',
      status: 'live',
    },
    {
      id: 'trace',
      displayName: 'TerraTrace',
      shortName: 'Trace',
      description: 'Trace console',
      iconName: 'Activity',
      route: '/trace',
      status: 'queued',
    },
    {
      id: 'canon',
      displayName: 'TerraCanon',
      shortName: 'Canon',
      description: 'Canon surface',
      iconName: 'Building',
      status: 'unavailable',
    },
  ],
}));

import { SuiteLauncher } from '../../components/launcher/SuiteLauncher';

describe('Launcher honesty labels', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('maps non-live suite statuses to explicit user-facing labels', () => {
    render(<SuiteLauncher />);

    expect(screen.queryByTestId('suite-status-badge-forge')).not.toBeInTheDocument();
    expect(screen.getByTestId('suite-status-badge-dossier')).toHaveTextContent('Queued');
    expect(screen.getByTestId('suite-status-badge-gpt')).toHaveTextContent('Unavailable');
    expect(screen.queryByText('WIP')).not.toBeInTheDocument();
  });

  it('maps non-live OS feature statuses to explicit user-facing labels', () => {
    render(<SuiteLauncher />);

    expect(screen.queryByTestId('feature-status-badge-pilot')).not.toBeInTheDocument();
    expect(screen.getByTestId('feature-status-badge-trace')).toHaveTextContent('Queued');
    expect(screen.getByTestId('feature-status-badge-canon')).toHaveTextContent('Unavailable');
    expect(screen.queryByText('WIP')).not.toBeInTheDocument();
  });
});
