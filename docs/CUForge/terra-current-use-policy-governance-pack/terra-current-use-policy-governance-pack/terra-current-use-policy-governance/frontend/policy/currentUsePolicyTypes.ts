
export interface CurrentUsePolicyRule {
  ruleKey: string;
  ruleType: string;
  value: string;
  description: string;
}

export interface CurrentUsePolicyPack {
  policyPackId: string;
  countyId: string;
  policyPackName: string;
  policyVersion: string;
  status: 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';
  effectiveStartDate: string;
  effectiveEndDate?: string;
  rules: CurrentUsePolicyRule[];
  notes: string;
}
