/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { activateModuleMock } = vi.hoisted(() => ({
  activateModuleMock: vi.fn(),
}));

vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: activateModuleMock,
}));

import {
  filterLauncherItems,
  getLauncherItems,
  getLauncherSections,
  navigateToLauncherItem,
} from '../../components/launcher/launcherModel';

function getCountiesHubLauncherItem() {
  const item = getLauncherItems().find((candidate) => candidate.id === 'counties');
  expect(item).toBeDefined();
  return item!;
}

describe('Counties HUB launcher entry', () => {
  beforeEach(() => {
    activateModuleMock.mockReset().mockResolvedValue(undefined);
  });

  it('exposes the Washington assessor journey through the real launcher model', () => {
    const item = getCountiesHubLauncherItem();

    expect(item).toMatchObject({
      label: 'Counties HUB',
      description: 'Washington assessor county workspace',
      intent: 'standalone',
      route: '/counties',
      moduleId: 'counties',
      iconName: 'Map',
    });
    expect(item.keywords).toEqual(
      expect.arrayContaining(['county', 'washington', 'assessor', 'terraforge', 'public data']),
    );
    expect(item.a11yLabel).toMatch(/Washington assessor county workspace/i);

    const sections = getLauncherSections();
    const operationsSection = sections.find((section) => section.id === 'operations');
    const suitesSection = sections.find((section) => section.id === 'suites');
    expect(operationsSection).toMatchObject({ label: 'Operational Apps' });
    expect(operationsSection?.items).toContainEqual(item);
    expect(suitesSection?.items).not.toContainEqual(item);
    expect(filterLauncherItems(getLauncherItems(), 'assessor')).toContainEqual(item);
  });

  it('activates the canonical Counties HUB window through the module orchestrator', async () => {
    const navigate = vi.fn();
    const actor = {
      userId: 'assessor-7',
      countyId: 'wa-063',
      roles: ['assessor'],
    };

    navigateToLauncherItem(getCountiesHubLauncherItem(), navigate, actor);

    await vi.waitFor(() => {
      expect(activateModuleMock).toHaveBeenCalledOnce();
      expect(activateModuleMock).toHaveBeenCalledWith('counties', {
        source: 'start_menu',
        actor,
      });
    });
    expect(navigate).not.toHaveBeenCalled();
  });
});
