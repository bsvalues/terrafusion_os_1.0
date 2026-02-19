export type TokenViolationKind =
  | 'RAW_HEX'
  | 'TAILWIND_ARBITRARY_COLOR'
  | 'DISALLOWED_COLOR_FUNCTION';

export interface TokenAuditScope {
  include?: string[];
  exclude?: string[];
}

export interface UiTokenBaseline {
  contract: 'ui-token-baseline.json';
  version: 'v1';
  scopeHash: string;
  violationCount: number;
  generatedAtIso: string;
}

export interface TokenViolation {
  kind: TokenViolationKind;
  file: string;
  line: number;
  column: number;
  excerpt: string;
}

export interface UiTokenComplianceContract {
  contract: 'ui-token-compliance.contract.json';
  version: 'v1';
  ok: boolean;
  scannedFileCount: number;
  violationCount: number;
  violations: TokenViolation[];
  generatedAtIso: string;
}
