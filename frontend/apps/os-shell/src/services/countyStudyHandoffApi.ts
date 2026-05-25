/**
 * Neutral County Studio handoff API facade.
 *
 * Suite homes consume handoff receipts through this service boundary instead
 * of importing the Forge suite implementation directly.
 */
export {
  adjustmentSetApi,
  exceptionApi,
  type CountyApplyHandoffReceiptDto,
  type CountyApplyHandoffReceiptStatus,
  type CountyDownstreamClosureReceiptDto,
  type DownstreamClosureReceiptDestination,
  type DownstreamClosureReceiptSource,
  type DownstreamClosureReceiptStatus,
} from '../pages/forge/county-studio/countyStudyApi';
