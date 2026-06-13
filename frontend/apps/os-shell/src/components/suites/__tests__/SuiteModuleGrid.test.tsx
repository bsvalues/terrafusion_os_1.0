/**
 * SuiteModuleGrid launch contract — WO-SUITE-ROUTING-001
 *
 * Standalone suite tiles must open through the canonical activation path
 * (activateModule → openWindow), NOT a bare `navigate('/${moduleId}')` that
 * has no registered route and silently no-ops. The workbench launch branch
 * must keep using navigate().
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileText } from 'lucide-react';
import { SuiteModuleGrid, type SuiteModuleDef } from '../SuiteModuleGrid';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockActivateModule = vi.fn();
vi.mock('../../../orchestration/moduleActivation', () => ({
  activateModule: (...args: unknown[]) => mockActivateModule(...args),
}));

let activeParcel: { parcelId: string } | null = null;
vi.mock('../../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (s: { activeParcel: typeof activeParcel }) => unknown) =>
    selector({ activeParcel }),
}));

function makeModule(
  over: Partial<SuiteModuleDef> & Pick<SuiteModuleDef, 'id' | 'label'>,
): SuiteModuleDef {
  return {
    icon: FileText,
    description: 'desc',
    launchMode: 'standalone',
    ...over,
  };
}

describe('SuiteModuleGrid launch contract (WO-SUITE-ROUTING-001)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeParcel = null;
  });

  it('opens a standalone tile via activateModule, not navigate', async () => {
    render(
      <SuiteModuleGrid
        modules={[makeModule({ id: 'terra-notice', label: 'TerraNotice', priority: 'primary' })]}
      />,
    );

    await userEvent.click(screen.getByText('TerraNotice'));

    expect(mockActivateModule).toHaveBeenCalledWith('terra-notice', { source: 'system' });
    expect(mockNavigate).not.toHaveBeenCalledWith('/terra-notice');
  });

  it.each(['terra-queue', 'terra-cert', 'county-studio', 'sales-forge'])(
    'opens existing standalone module %s via activateModule',
    async (moduleId) => {
      render(<SuiteModuleGrid modules={[makeModule({ id: moduleId, label: moduleId })]} />);

      await userEvent.click(screen.getByText(moduleId));

      expect(mockActivateModule).toHaveBeenCalledWith(moduleId, { source: 'system' });
      expect(mockNavigate).not.toHaveBeenCalled();
    },
  );

  it('honors an explicit moduleId override over the tile id', async () => {
    render(
      <SuiteModuleGrid
        modules={[makeModule({ id: 'tile-id', label: 'Override', moduleId: 'terra-cert' })]}
      />,
    );

    await userEvent.click(screen.getByText('Override'));

    expect(mockActivateModule).toHaveBeenCalledWith('terra-cert', { source: 'system' });
  });

  it('leaves the workbench launch branch on navigate() (parcel-less)', async () => {
    render(
      <SuiteModuleGrid
        modules={[
          makeModule({
            id: 'income',
            label: 'Income',
            launchMode: 'workbench',
            workbenchTab: 'income' as SuiteModuleDef['workbenchTab'],
          }),
        ]}
      />,
    );

    await userEvent.click(screen.getByText('Income'));

    expect(mockNavigate).toHaveBeenCalledWith('/property?openTab=income');
    expect(mockActivateModule).not.toHaveBeenCalled();
  });

  it('routes the workbench branch to the active parcel when one is set', async () => {
    activeParcel = { parcelId: 'P-123' };
    render(
      <SuiteModuleGrid
        modules={[
          makeModule({
            id: 'income',
            label: 'Income',
            launchMode: 'workbench',
            workbenchTab: 'income' as SuiteModuleDef['workbenchTab'],
          }),
        ]}
      />,
    );

    await userEvent.click(screen.getByText('Income'));

    expect(mockNavigate).toHaveBeenCalledWith('/property/P-123/income');
    expect(mockActivateModule).not.toHaveBeenCalled();
  });
});
