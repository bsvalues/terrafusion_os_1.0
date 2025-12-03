import { describe, expect, it } from 'vitest';
import { OS_OBJECT_CATALOG, listOSObjects, resolveOSObjectComponent } from '../osObjects';

describe('OS_OBJECT_CATALOG', () => {
  it('contains object_quicklist as a registered OS object', () => {
    const objects = listOSObjects();
    const quickList = objects.find((entry) => entry.id === 'object_quicklist');

    expect(quickList).toBeDefined();
    expect(quickList?.label).toBe('Object Quick List');
    expect(typeof quickList?.component).toBe('function');
  });

  it('contains workspace_status_chip as a registered OS object', () => {
    const objects = listOSObjects();
    const statusChip = objects.find((entry) => entry.id === 'workspace_status_chip');

    expect(statusChip).toBeDefined();
    expect(statusChip?.label).toBe('Workspace Status Chip');
    expect(typeof statusChip?.component).toBe('function');
  });

  it('contains workspace_activity_feed as a registered OS object', () => {
    const objects = listOSObjects();
    const activityFeed = objects.find((entry) => entry.id === 'workspace_activity_feed');

    expect(activityFeed).toBeDefined();
    expect(activityFeed?.label).toBe('Workspace Activity Feed');
    expect(typeof activityFeed?.component).toBe('function');
  });

  it('contains workspace_command_palette as a registered OS object', () => {
    const objects = listOSObjects();
    const commandPalette = objects.find((entry) => entry.id === 'workspace_command_palette');

    expect(commandPalette).toBeDefined();
    expect(commandPalette?.label).toBe('Workspace Command Palette');
    expect(typeof commandPalette?.component).toBe('function');
  });

  it('keeps catalog entries domain-neutral (no parcel/property semantics)', () => {
    const forbidden = ['parcel', 'property', 'levy', 'tax', 'cama'];

    for (const entry of OS_OBJECT_CATALOG) {
      const label = (entry.label || '').toLowerCase();
      const description = (entry.description || '').toLowerCase();

      for (const word of forbidden) {
        expect(label.includes(word)).toBe(false);
        expect(description.includes(word)).toBe(false);
      }
    }
  });

  it('resolves known object IDs and returns null for unknown IDs', () => {
    const QuickListComponent = resolveOSObjectComponent('object_quicklist');
    expect(QuickListComponent).not.toBeNull();
    expect(typeof QuickListComponent).toBe('function');

    const StatusChipComponent = resolveOSObjectComponent('workspace_status_chip');
    expect(StatusChipComponent).not.toBeNull();
    expect(typeof StatusChipComponent).toBe('function');

    const ActivityFeedComponent = resolveOSObjectComponent('workspace_activity_feed');
    expect(ActivityFeedComponent).not.toBeNull();
    expect(typeof ActivityFeedComponent).toBe('function');

    const CommandPaletteComponent = resolveOSObjectComponent('workspace_command_palette');
    expect(CommandPaletteComponent).not.toBeNull();
    expect(typeof CommandPaletteComponent).toBe('function');

    // @ts-expect-error invalid ids resolve to null at runtime
    const Unknown = resolveOSObjectComponent('non_existent_object');
    expect(Unknown).toBeNull();
  });

  it('has at least four entries, proving catalog scales', () => {
    expect(OS_OBJECT_CATALOG.length).toBeGreaterThanOrEqual(4);
  });
});
