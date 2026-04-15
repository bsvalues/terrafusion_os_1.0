/**
 * SaleDetailPanel — Full detail expand for a selected sale.
 * Shows all 40+ fields including raw PACS codes, time-of-sale characteristics,
 * and the three-layer qualification data.
 */

import { useSalesForgeStore } from '../salesForgeStore';
import { QualDecisionButtons } from './QualDecisionButtons';

function fmtPrice(n: number | null | undefined): string {
  return n == null ? '—' : `$${n.toLocaleString()}`;
}

function fmtNum(n: number | null | undefined): string {
  return n == null ? '—' : n.toLocaleString();
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function fmtRatio(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${(n * 100).toFixed(2)}%  (${n.toFixed(4)})`;
}

function Val({ value, isNull }: { value: string | number | null | undefined; isNull?: boolean }) {
  const display = value == null || value === '' ? null : String(value);
  if (!display || isNull) {
    return <span className="sf-detail-field__value sf-null-flag">—</span>;
  }
  return <span className="sf-detail-field__value">{display}</span>;
}

function Field({ label, value, isNull }: { label: string; value?: string | number | null; isNull?: boolean }) {
  return (
    <div className="sf-detail-field">
      <div className="sf-detail-field__label">{label}</div>
      <Val value={value} isNull={isNull} />
    </div>
  );
}

export function SaleDetailPanel() {
  const saleDetail    = useSalesForgeStore((s) => s.saleDetail);
  const detailLoading = useSalesForgeStore((s) => s.detailLoading);
  const detailError   = useSalesForgeStore((s) => s.detailError);
  const clearSelection = useSalesForgeStore((s) => s.clearSelection);

  return (
    <div className="sf-detail-panel">
      <div className="sf-detail-header">
        <div className="sf-detail-title">
          {saleDetail ? `${saleDetail.parcelId ?? 'Sale Detail'} — ${saleDetail.address ?? ''}` : 'Sale Detail'}
        </div>
        <button type="button" className="sf-detail-close" onClick={clearSelection} aria-label="Close detail">
          ✕
        </button>
      </div>

      {detailLoading && <div className="sf-state">Loading detail…</div>}
      {detailError && <div className="sf-state sf-state--error">{detailError}</div>}

      {saleDetail && !detailLoading && (
        <>
          {/* Sale facts */}
          <div className="sf-detail-section-heading">Sale facts</div>
          <div className="sf-detail-grid">
            <Field label="Parcel ID"          value={saleDetail.parcelId} />
            <Field label="Address"            value={saleDetail.address} />
            <Field label="Neighborhood"       value={saleDetail.neighborhood ?? saleDetail.hood} />
            <Field label="Property type"      value={saleDetail.propertyType} />
            <Field label="Sale date"          value={fmtDate(saleDetail.saleDate)} />
            <Field label="Sale price"         value={fmtPrice(saleDetail.salePrice)} />
            <Field label="Adjusted price"     value={saleDetail.adjustedSalePrice != null ? fmtPrice(saleDetail.adjustedSalePrice) : null} />
            <Field label="Excise number"      value={saleDetail.exciseNumber} />
            <Field label="DOR sales year"     value={saleDetail.salesYear} />
            <Field label="Deed type"          value={saleDetail.rawSaleTypeCode} />
            <Field label="Financing"          value={saleDetail.rawFinancingCode} />
          </div>

          {/* Time-of-sale characteristics */}
          <div className="sf-detail-section-heading">Characteristics at time of sale</div>
          <div className="sf-detail-grid">
            <Field label="GLA (time of sale)"  value={saleDetail.slLivingArea != null ? `${fmtNum(saleDetail.slLivingArea)} sf` : null} />
            <Field label="Year built (ToS)"    value={saleDetail.slYearBuilt} />
            <Field label="Land (acres, ToS)"   value={saleDetail.slLandAcres} />
            <Field label="Land (sqft, ToS)"    value={saleDetail.slLandSqft != null ? `${fmtNum(saleDetail.slLandSqft)} sf` : null} />
            <Field label="GLA (current)"       value={saleDetail.gla != null ? `${fmtNum(saleDetail.gla)} sf` : null} />
            <Field label="Year built (current)" value={saleDetail.yearBuilt} />
            <Field label="Bedrooms"            value={saleDetail.bedrooms} />
            <Field label="Bathrooms"           value={saleDetail.bathrooms} />
            <Field label="Condition"           value={saleDetail.condition} />
            <Field label="Quality grade"       value={saleDetail.qualityGrade} />
          </div>

          {/* Ratio */}
          <div className="sf-detail-section-heading">Ratio (TF-computed)</div>
          <div className="sf-detail-grid">
            <Field label="Assessed value"      value={fmtPrice(saleDetail.assessedValue)} />
            <Field label="Effective price"     value={fmtPrice(saleDetail.adjustedSalePrice ?? saleDetail.salePrice)} />
            <Field label="Sales ratio"         value={fmtRatio(saleDetail.salesRatio)} />
          </div>

          {/* Raw PACS codes */}
          <div className="sf-detail-section-heading">Qualification codes</div>
          <div className="sf-detail-grid">
            <Field label="WAC code (458-61A)" value={saleDetail.rawWacCd} />
            <Field label="Sale qualifier"      value={saleDetail.rawSaleQualifier} />
            <Field label="County ratio code"   value={saleDetail.rawCountyRatioCd} />
            <Field label="DOR ratio type"      value={saleDetail.rawRatioTypeCd} />
            <Field label="Ratio code"          value={saleDetail.rawRatioCd} />
            <Field label="Ratio code reason"   value={saleDetail.rawRatioCdReason} />
            <Field label="Exclude calc code"   value={saleDetail.rawExcludeCalcCd} />
            <Field label="Adj reason"          value={saleDetail.rawAdjReason} />
            <Field label="Adj code"            value={saleDetail.rawAdjCode} />
            <Field label="Comment"             value={saleDetail.rawComment} />
          </div>

          {/* Suppression flags */}
          <div className="sf-detail-section-heading">Report flags</div>
          <div className="sf-detail-grid">
            <Field label="Suppress from DOR rpt"  value={saleDetail.suppressOnRatioRptCd} />
            <Field label="Suppress reason"         value={saleDetail.suppressOnRatioReason} />
            <Field label="Include no-calc"         value={saleDetail.includeNoCalc != null ? String(saleDetail.includeNoCalc) : null} />
            <Field label="Land only sale"          value={saleDetail.landOnlySale != null ? String(saleDetail.landOnlySale) : null} />
            <Field label="Continue current use"    value={saleDetail.continueCurrentUse != null ? String(saleDetail.continueCurrentUse) : null} />
          </div>

          {/* Qualification */}
          <div className="sf-detail-section-heading">Qualification layers</div>
          <div className="sf-detail-grid">
            <Field label="TF recommendation"    value={saleDetail.qualificationRecommendation} />
            <Field label="Rec. reason"           value={saleDetail.recommendationReason} />
            <Field label="Rec. source"           value={saleDetail.recommendationSource} />
            <Field label="Decision (Layer 3)"    value={saleDetail.qualificationDecision} />
            <Field label="Decision reason"       value={saleDetail.decisionReason} />
            <Field label="Decided by"            value={saleDetail.decisionBy ?? saleDetail.qualificationDecisionBy} />
            <Field label="Decided at"            value={fmtDate(saleDetail.decisionAt ?? saleDetail.qualificationDecisionAt)} />
            <Field label="Decision source"       value={saleDetail.decisionSource} />
          </div>

          {/* Decision area */}
          <QualDecisionButtons saleId={saleDetail.saleId} />
        </>
      )}
    </div>
  );
}
