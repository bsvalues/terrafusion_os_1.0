import type { CurrentUseCountyTenant } from './currentUseTenantTypes';

export async function getCurrentUseTenantsMock(): Promise<CurrentUseCountyTenant[]> {
  return [
    {
      countyId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      countyName: 'Benton County',
      stateCode: 'WA',
      status: 'ACTIVE',
      policyVersion: '2025.09.01',
      theme: 'terrafusion-default',
      aiAssistEnabled: false,
      atlasEnabled: false,
      dossierEnabled: true,
      daisEnabled: false,
      treasurerEnabled: false,
    },
    {
      countyId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      countyName: 'Yakima County',
      stateCode: 'WA',
      status: 'ONBOARDING',
      policyVersion: '2025.09.01',
      theme: 'yakima-theme',
      aiAssistEnabled: false,
      atlasEnabled: false,
      dossierEnabled: false,
      daisEnabled: false,
      treasurerEnabled: false,
    },
  ];
}
