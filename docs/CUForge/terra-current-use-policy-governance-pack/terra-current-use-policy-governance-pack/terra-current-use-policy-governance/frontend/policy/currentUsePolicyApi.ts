
import type { CurrentUsePolicyPack } from './currentUsePolicyTypes';

export async function getCurrentUsePolicyPacksMock(
  countyId: string,
): Promise<CurrentUsePolicyPack[]> {
  return [
    {
      policyPackId: 'policy-001',
      countyId,
      policyPackName: 'Current Use 2025 Policy Pack',
      policyVersion: '2025.09.01',
      status: 'ACTIVE',
      effectiveStartDate: '2025-09-01',
      notes: 'Implements four-year rollback for Farm & Agricultural removals.',
      rules: [
        {
          ruleKey: 'farm_ag.rollback_years.after_2025_09_01',
          ruleType: 'ROLLBACK_YEARS',
          value: '4',
          description: 'Farm & Agricultural rollback limited to four years.'
        }
      ]
    }
  ];
}
