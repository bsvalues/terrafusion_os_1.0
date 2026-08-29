/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from 'vitest';
import {
  filterLauncherItems,
  getLauncherItems,
  getLauncherSections,
  navigateToLauncherItem,
} from '../../components/launcher/launcherModel';

function getCountiesHubLauncherItem() {
  const item = getLauncherItems().find((candidate) => candidate.id === 'counties-hub');
  expect(item).toBeDefined();
  return item!;
}

describe('Counties HUB launcher entry', () => {
  it('exposes the Washington assessor journey through the real launcher model', () => {
    const item = getCountiesHubLauncherItem();

    expect(item).toMatchObject({
      label: 'Counties HUB',
      description: 'Washington assessor county workspace',
      intent: 'system',
      route: '/counties',
      iconName: 'Map',
    });
    expect(item.keywords).toEqual(
      expect.arrayContaining(['county', 'washington', 'assessor', 'terraforge', 'public data']),
    );
    expect(item.a11yLabel).toMatch(/Washington assessor county workspace/i);

    const systemSection = getLauncherSections().find((section) => section.id === 'system');
    expect(systemSection?.items).toContainEqual(item);
    expect(filterLauncherItems(getLauncherItems(), 'assessor')).toContainEqual(item);
  });

  it('navigates from the primary launcher to the existing Counties HUB route', () => {
    const navigate = vi.fn();

    navigateToLauncherItem(getCountiesHubLauncherItem(), navigate);

    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/counties');
  });
});
