/**
 * County Study bridge — OS-owned governed boundary (Article III / write-lane doctrine).
 *
 * D-012 / WO-0006: Dais and Dossier surfaces need to record downstream receipts / apply-handoff
 * receipts against Forge's county-study sets, but suites must NOT import another suite's internals
 * directly (TF-052 Article III; cross-lane intent travels through a governed boundary).
 *
 * This module is that boundary: an OS-owned facade over Forge's county-studio API. Non-Forge code
 * imports receipts functionality from HERE, never from `pages/forge/**`. If the underlying Forge
 * module moves, only this bridge changes.
 */
export { adjustmentSetApi, exceptionApi } from '../pages/forge/county-studio/countyStudyApi';
export type {
  CountyApplyHandoffReceiptDto,
  CountyApplyHandoffReceiptStatus,
} from '../pages/forge/county-studio/countyStudyApi';
