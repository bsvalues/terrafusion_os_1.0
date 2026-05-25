
export interface CurrentUseStatuteReference {
  stateCode: string;
  citation: string;
  topic: string;
  summary: string;
  effectiveVersion: string;
  sourceUrl: string;
}

export interface CurrentUseRuleProvenance {
  ruleKey: string;
  policyVersion: string;
  citation: string;
  explanation: string;
}
