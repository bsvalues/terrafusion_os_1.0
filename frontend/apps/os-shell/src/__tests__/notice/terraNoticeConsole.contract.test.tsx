/**
 * TerraNotice Console Contract.
 *
 * Verifies the governed civic communications console renders its operator
 * shell: the honesty ribbon, all twelve navigable areas, and area switching.
 * TerraNotice must present as a governed control surface, not a mail-merge tool.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TerraNoticeConsole from '../../pages/notice/TerraNoticeConsole';
import type { ConsoleAreaId } from '../../pages/notice/types';

const AREA_IDS: ConsoleAreaId[] = [
  'command-center',
  'county-configuration',
  'policy-packs',
  'template-governance',
  'batch-operations',
  'freeze-snapshots',
  'vendor-dispatch',
  'returned-mail',
  'citizen-portal',
  'telemetry',
  'audit-vault',
  'release-console',
];

async function renderConsole() {
  render(<TerraNoticeConsole />);
  // Snapshot loads asynchronously; wait for the nav rail to appear.
  await screen.findByTestId('notice-nav-rail');
}

describe('TerraNotice Console Contract', () => {
  it('renders the console shell after loading the snapshot', async () => {
    await renderConsole();
    expect(screen.getByTestId('terra-notice-console')).toBeDefined();
  });

  it('shows the sandbox honesty ribbon (no fabricated-as-live data)', async () => {
    await renderConsole();
    const ribbon = screen.getByTestId('notice-sandbox-ribbon');
    expect(ribbon).toBeDefined();
    expect(ribbon.textContent).toContain('County Sandbox');
  });

  it('exposes all twelve governed console areas in the nav rail', async () => {
    await renderConsole();
    for (const id of AREA_IDS) {
      expect(screen.getByTestId(`notice-nav-${id}`)).toBeDefined();
    }
  });

  it('opens the Command Center by default', async () => {
    await renderConsole();
    expect(screen.getByTestId('notice-area-command-center')).toBeDefined();
  });

  it('switches areas when a nav item is selected', async () => {
    await renderConsole();

    fireEvent.click(screen.getByTestId('notice-nav-returned-mail'));
    await waitFor(() => expect(screen.getByTestId('notice-area-returned-mail')).toBeDefined());
    expect(screen.getByTestId('exception-queue-table')).toBeDefined();

    fireEvent.click(screen.getByTestId('notice-nav-audit-vault'));
    await waitFor(() => expect(screen.getByTestId('notice-area-audit-vault')).toBeDefined());
  });
});
