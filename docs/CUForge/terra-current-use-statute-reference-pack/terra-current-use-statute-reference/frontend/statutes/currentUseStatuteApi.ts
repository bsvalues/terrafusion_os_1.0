
import type {
  CurrentUseRuleProvenance,
  CurrentUseStatuteReference,
} from './currentUseStatuteTypes';

export async function getCurrentUseStatutesMock():
  Promise<CurrentUseStatuteReference[]> {
  return [
    {
      stateCode: 'WA',
      citation: 'RCW 84.34',
      topic: 'Current Use Taxation',
      summary: 'Washington Current Use taxation framework.',
      effectiveVersion: '2025.09.01',
      sourceUrl: 'https://app.leg.wa.gov/rcw/default.aspx?cite=84.34',
    }
  ];
}

export async function getCurrentUseRuleProvenanceMock():
  Promise<CurrentUseRuleProvenance[]> {
  return [
    {
      ruleKey: 'farm_ag.rollback_years.after_2025_09_01',
      policyVersion: '2025.09.01',
      citation: 'RCW 84.34.108',
      explanation: 'Farm & Agricultural rollback reduced to four years.',
    }
  ];
}
