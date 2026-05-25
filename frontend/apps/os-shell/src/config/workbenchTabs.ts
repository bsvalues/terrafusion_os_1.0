import type { WorkbenchTabSlug } from '../contracts/workbench';

export interface WorkbenchTabDefinition {
  id: WorkbenchTabSlug;
  label: string;
  path: string;
  enabled: boolean;
  group: 'primary-parcel' | 'linked-county-office' | 'os-support';
  owner: 'parcel' | 'suite' | 'office' | 'os';
}

export const WORKBENCH_TABS: readonly WorkbenchTabDefinition[] = [
  { id: 'summary', label: 'Summary', path: '', enabled: true, group: 'primary-parcel', owner: 'parcel' },
  { id: 'forge', label: 'Forge', path: 'forge', enabled: true, group: 'primary-parcel', owner: 'suite' },
  { id: 'atlas', label: 'Atlas', path: 'atlas', enabled: true, group: 'primary-parcel', owner: 'suite' },
  { id: 'dais', label: 'Dais', path: 'dais', enabled: true, group: 'primary-parcel', owner: 'suite' },
  { id: 'dossier', label: 'Dossier', path: 'dossier', enabled: true, group: 'primary-parcel', owner: 'suite' },
  { id: 'clerk', label: 'Clerk', path: 'clerk', enabled: true, group: 'linked-county-office', owner: 'office' },
  { id: 'treasury', label: 'Treasury', path: 'treasury', enabled: true, group: 'linked-county-office', owner: 'office' },
  { id: 'audit', label: 'Audit', path: 'audit', enabled: true, group: 'linked-county-office', owner: 'office' },
  { id: 'pilot', label: 'Pilot', path: 'pilot', enabled: true, group: 'os-support', owner: 'os' },
  { id: 'trace', label: 'Trace', path: 'trace', enabled: true, group: 'os-support', owner: 'os' },
] as const;

export const WORKBENCH_TAB_IDS: readonly WorkbenchTabSlug[] = WORKBENCH_TABS.map((tab) => tab.id);

export function isCanonicalWorkbenchTab(value: string): value is WorkbenchTabSlug {
  return WORKBENCH_TAB_IDS.includes(value as WorkbenchTabSlug);
}
