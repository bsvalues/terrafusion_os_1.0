/**
 * TerraForge Report Engine
 *
 * Generates PDF reports for county assessor workflows:
 * - Current Use Rollback Notice (RCW 84.34.108)
 * - Levy Certification Report (RCW 84.52.070)
 * - Cost Approach Valuation Report (IAAO Standard)
 * - Sales Ratio Study Report (IAAO Standard on Ratio Studies)
 *
 * Uses HTML templates → WeasyPrint/Puppeteer for PDF generation.
 * Designed for batch mailing workflows (10K+ notices per run).
 *
 * @module terraforge-reports
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Report Templates ────────────────────────────────────────────────────────

/**
 * Current Use Rollback Notice
 * Per RCW 84.34.108: When land is removed from current use classification,
 * the county assessor must notify the owner of additional tax, interest, and penalty.
 */
function renderRollbackNotice(data) {
  const {
    countyName = "Benton County",
    assessorName = "County Assessor",
    parcelId,
    ownerName,
    ownerAddress,
    propertyAddress,
    classificationCode,
    enrollmentDate,
    removalDate,
    removalReason,
    yearBreakdown = [],
    totalAdditionalTax,
    totalInterest,
    totalPenalty,
    grandTotal,
    penaltyExceptions = [],
    appealDeadline,
    generatedDate = new Date().toISOString().split("T")[0],
  } = data;

  const yearRows = yearBreakdown
    .map(
      (y) => `
    <tr>
      <td>${y.year}</td>
      <td class="currency">$${fmt(y.marketValue)}</td>
      <td class="currency">$${fmt(y.useValue)}</td>
      <td class="currency">$${fmt(y.difference)}</td>
      <td class="currency">$${fmt(y.additionalTax)}</td>
      <td class="pct">${(y.interestRate * 100).toFixed(3)}%</td>
      <td class="currency">$${fmt(y.interest)}</td>
    </tr>`
    )
    .join("\n");

  const exceptionRows =
    penaltyExceptions.length > 0
      ? penaltyExceptions
          .map(
            (e) => `
    <tr><td>${e.code}</td><td>${e.description}</td><td>${e.applies ? "✓ Applies" : "✗ Does not apply"}</td></tr>`
          )
          .join("\n")
      : `<tr><td colspan="3">No penalty exceptions evaluated</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Current Use Rollback Notice — ${parcelId}</title>
<style>
  @page { size: letter; margin: 0.75in; }
  body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.4; color: #1a1a1a; }
  .header { text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 12pt; margin-bottom: 18pt; }
  .header h1 { font-size: 16pt; margin: 0; color: #1a365d; }
  .header h2 { font-size: 13pt; margin: 4pt 0 0; font-weight: normal; }
  .header .county { font-size: 14pt; font-weight: bold; margin-bottom: 4pt; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; margin-bottom: 18pt; }
  .meta-box { border: 1px solid #ccc; padding: 8pt; border-radius: 4pt; }
  .meta-box h3 { margin: 0 0 6pt; font-size: 10pt; text-transform: uppercase; color: #666; }
  .meta-box p { margin: 2pt 0; font-size: 10pt; }
  .legal-notice { background: #f7f7f0; border-left: 4pt solid #b8860b; padding: 10pt 12pt; margin: 18pt 0; font-size: 10pt; }
  .legal-notice strong { display: block; margin-bottom: 4pt; }
  table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 9.5pt; }
  th { background: #1a365d; color: white; padding: 6pt 8pt; text-align: left; font-size: 9pt; }
  td { padding: 5pt 8pt; border-bottom: 1px solid #ddd; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .currency { text-align: right; font-family: 'Courier New', monospace; }
  .pct { text-align: center; }
  .totals { margin-top: 18pt; }
  .totals table { width: 50%; margin-left: auto; }
  .totals td { font-weight: bold; font-size: 11pt; }
  .totals .grand-total td { border-top: 2px solid #1a365d; font-size: 12pt; color: #1a365d; }
  .appeal-box { border: 2px solid #c53030; padding: 12pt; margin: 18pt 0; border-radius: 4pt; }
  .appeal-box h3 { color: #c53030; margin: 0 0 6pt; }
  .footer { margin-top: 36pt; border-top: 1px solid #ccc; padding-top: 12pt; font-size: 9pt; color: #666; }
  .footer .sig-line { margin-top: 36pt; border-top: 1px solid #333; width: 250pt; }
  .audit-hash { font-family: monospace; font-size: 8pt; color: #999; margin-top: 12pt; }
</style>
</head>
<body>
<div class="header">
  <div class="county">${countyName}</div>
  <h1>NOTICE OF ADDITIONAL TAX, INTEREST, AND PENALTY</h1>
  <h2>Current Use Removal — RCW 84.34.108</h2>
</div>

<div class="meta-grid">
  <div class="meta-box">
    <h3>Property Owner</h3>
    <p><strong>${ownerName}</strong></p>
    <p>${ownerAddress || "Address on file"}</p>
  </div>
  <div class="meta-box">
    <h3>Property Information</h3>
    <p><strong>Parcel:</strong> ${parcelId}</p>
    <p><strong>Address:</strong> ${propertyAddress || "See parcel records"}</p>
    <p><strong>Classification:</strong> ${classificationCode}</p>
    <p><strong>Enrolled:</strong> ${enrollmentDate} | <strong>Removed:</strong> ${removalDate}</p>
  </div>
</div>

<div class="legal-notice">
  <strong>LEGAL BASIS</strong>
  Pursuant to RCW 84.34.108, when land is removed from current use classification, additional tax,
  interest, and penalty shall be imposed. Interest is calculated per WAC 458-30-590 using the
  inflation rate published annually by the Department of Revenue.
  <br><br><strong>Reason for Removal:</strong> ${removalReason}
</div>

<h3>Year-by-Year Rollback Calculation</h3>
<table>
  <thead>
    <tr>
      <th>Year</th>
      <th>Market Value</th>
      <th>Use Value</th>
      <th>Difference</th>
      <th>Additional Tax</th>
      <th>Interest Rate</th>
      <th>Interest</th>
    </tr>
  </thead>
  <tbody>
    ${yearRows}
  </tbody>
</table>

<div class="totals">
  <table>
    <tr><td>Additional Tax:</td><td class="currency">$${fmt(totalAdditionalTax)}</td></tr>
    <tr><td>Interest (WAC 458-30-590):</td><td class="currency">$${fmt(totalInterest)}</td></tr>
    <tr><td>Penalty (20%):</td><td class="currency">$${fmt(totalPenalty)}</td></tr>
    <tr class="grand-total"><td>TOTAL DUE:</td><td class="currency">$${fmt(grandTotal)}</td></tr>
  </table>
</div>

<h3>Penalty Exception Evaluation</h3>
<table>
  <thead><tr><th>Exception Code</th><th>Description</th><th>Status</th></tr></thead>
  <tbody>${exceptionRows}</tbody>
</table>

<div class="appeal-box">
  <h3>RIGHT TO APPEAL</h3>
  <p>You may appeal this determination to the ${countyName} Board of Equalization within
  <strong>60 days</strong> of the date of this notice (by <strong>${appealDeadline || "See county records"}</strong>).
  Contact the Assessor's Office for appeal forms and procedures.</p>
</div>

<div class="footer">
  <p>Generated: ${generatedDate} | ${countyName} Assessor's Office</p>
  <div class="sig-line"></div>
  <p>${assessorName}<br>${countyName} Assessor</p>
  <div class="audit-hash">Audit: SHA-256:${generateAuditHash(data)}</div>
</div>
</body>
</html>`;
}

/**
 * Levy Certification Report
 * Per RCW 84.52.070: The county assessor certifies levy rates to the county treasurer.
 */
function renderLevyCertification(data) {
  const {
    countyName = "Benton County",
    assessorName = "County Assessor",
    taxYear,
    certificationDate,
    districts = [],
    totalAV,
    totalLevy,
    generatedDate = new Date().toISOString().split("T")[0],
  } = data;

  const districtRows = districts
    .map(
      (d) => `
    <tr>
      <td>${d.code}</td>
      <td>${d.name}</td>
      <td class="currency">$${fmt(d.assessedValue)}</td>
      <td class="pct">${d.rate.toFixed(6)}</td>
      <td class="currency">$${fmt(d.levyAmount)}</td>
      <td class="pct">${((d.levyAmount / d.assessedValue) * 100).toFixed(2)}%</td>
      <td>${d.status}</td>
    </tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Levy Certification Report — ${taxYear}</title>
<style>
  @page { size: letter landscape; margin: 0.5in; }
  body { font-family: 'Arial', sans-serif; font-size: 10pt; line-height: 1.3; color: #1a1a1a; }
  .header { text-align: center; border-bottom: 3px solid #1a365d; padding-bottom: 10pt; margin-bottom: 14pt; }
  .header h1 { font-size: 15pt; margin: 0; color: #1a365d; }
  .header .subtitle { font-size: 11pt; color: #444; }
  .summary { display: flex; justify-content: space-around; margin: 14pt 0; padding: 10pt; background: #f0f4f8; border-radius: 4pt; }
  .summary .stat { text-align: center; }
  .summary .stat .value { font-size: 16pt; font-weight: bold; color: #1a365d; }
  .summary .stat .label { font-size: 8pt; text-transform: uppercase; color: #666; }
  table { width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 9pt; }
  th { background: #1a365d; color: white; padding: 5pt 6pt; text-align: left; font-size: 8.5pt; }
  td { padding: 4pt 6pt; border-bottom: 1px solid #ddd; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .currency { text-align: right; font-family: 'Courier New', monospace; }
  .pct { text-align: center; }
  .certification { margin-top: 24pt; border: 2px solid #1a365d; padding: 14pt; border-radius: 4pt; }
  .certification h3 { color: #1a365d; margin: 0 0 8pt; }
  .sig-block { display: grid; grid-template-columns: 1fr 1fr; gap: 24pt; margin-top: 24pt; }
  .sig-block .sig { border-top: 1px solid #333; padding-top: 4pt; font-size: 9pt; }
  .footer { margin-top: 18pt; font-size: 8pt; color: #666; text-align: center; }
  .audit-hash { font-family: monospace; font-size: 7.5pt; color: #999; }
</style>
</head>
<body>
<div class="header">
  <h1>${countyName.toUpperCase()} — LEVY CERTIFICATION REPORT</h1>
  <div class="subtitle">Tax Year ${taxYear} | Certified ${certificationDate} | RCW 84.52.070</div>
</div>

<div class="summary">
  <div class="stat"><div class="value">${districts.length}</div><div class="label">Districts</div></div>
  <div class="stat"><div class="value">$${fmtM(totalAV)}</div><div class="label">Total Assessed Value</div></div>
  <div class="stat"><div class="value">$${fmtM(totalLevy)}</div><div class="label">Total Levy</div></div>
  <div class="stat"><div class="value">${((totalLevy / totalAV) * 1000).toFixed(4)}</div><div class="label">Effective Rate (per $1,000)</div></div>
</div>

<table>
  <thead>
    <tr>
      <th>Code</th><th>District Name</th><th>Assessed Value</th>
      <th>Rate (per $1)</th><th>Levy Amount</th><th>Utilization</th><th>Status</th>
    </tr>
  </thead>
  <tbody>${districtRows}</tbody>
</table>

<div class="certification">
  <h3>CERTIFICATION</h3>
  <p>I hereby certify that the above levy rates have been calculated in accordance with
  RCW 84.52.043 (statutory limits), RCW 84.55.005 (limit factor/IPD), and RCW 84.55.092
  (banked capacity). All rates are within constitutional and statutory limits.</p>
  <div class="sig-block">
    <div><div class="sig">${assessorName}, ${countyName} Assessor</div></div>
    <div><div class="sig">Date: ${certificationDate}</div></div>
  </div>
</div>

<div class="footer">
  <p>Generated: ${generatedDate} | ${countyName} Assessor's Office — TerraForge LevyForge Module</p>
  <div class="audit-hash">Audit: SHA-256:${generateAuditHash(data)}</div>
</div>
</body>
</html>`;
}

/**
 * Cost Approach Valuation Report
 * Per IAAO Standard on Mass Appraisal: Documents the cost approach methodology.
 */
function renderCostValuationReport(data) {
  const {
    countyName = "Benton County",
    parcelId,
    ownerName,
    propertyAddress,
    buildingType,
    squareFootage,
    yearBuilt,
    quality,
    condition,
    region,
    baseCostPerSqFt,
    qualityMultiplier,
    regionMultiplier,
    replacementCostNew,
    effectiveAge,
    depreciationRate,
    depreciationAmount,
    rcnld,
    landValue,
    totalValue,
    assessmentDate,
    generatedDate = new Date().toISOString().split("T")[0],
  } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Cost Approach Valuation — ${parcelId}</title>
<style>
  @page { size: letter; margin: 0.75in; }
  body { font-family: 'Arial', sans-serif; font-size: 10pt; line-height: 1.4; color: #1a1a1a; }
  .header { text-align: center; border-bottom: 2px solid #2d5016; padding-bottom: 10pt; margin-bottom: 14pt; }
  .header h1 { font-size: 14pt; margin: 0; color: #2d5016; }
  .header .subtitle { font-size: 10pt; color: #444; }
  .section { margin: 14pt 0; }
  .section h3 { color: #2d5016; border-bottom: 1px solid #2d5016; padding-bottom: 4pt; font-size: 11pt; }
  .prop-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8pt; margin: 10pt 0; }
  .prop-item { background: #f0f4e8; padding: 8pt; border-radius: 4pt; }
  .prop-item .label { font-size: 8pt; text-transform: uppercase; color: #666; }
  .prop-item .value { font-size: 12pt; font-weight: bold; color: #2d5016; }
  .calc-table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
  .calc-table td { padding: 6pt 10pt; border-bottom: 1px solid #eee; }
  .calc-table .label-col { width: 60%; }
  .calc-table .value-col { width: 40%; text-align: right; font-family: 'Courier New', monospace; font-weight: bold; }
  .calc-table .subtotal td { border-top: 1px solid #2d5016; font-weight: bold; }
  .calc-table .total td { border-top: 2px solid #2d5016; font-size: 12pt; color: #2d5016; }
  .methodology { background: #f7f7f0; padding: 10pt; border-radius: 4pt; font-size: 9pt; margin: 14pt 0; }
  .footer { margin-top: 24pt; border-top: 1px solid #ccc; padding-top: 10pt; font-size: 8pt; color: #666; }
  .audit-hash { font-family: monospace; font-size: 7.5pt; color: #999; }
</style>
</head>
<body>
<div class="header">
  <h1>COST APPROACH VALUATION REPORT</h1>
  <div class="subtitle">${countyName} | Assessment Date: ${assessmentDate || generatedDate}</div>
</div>

<div class="section">
  <h3>Property Information</h3>
  <div class="prop-grid">
    <div class="prop-item"><div class="label">Parcel ID</div><div class="value">${parcelId}</div></div>
    <div class="prop-item"><div class="label">Owner</div><div class="value">${ownerName}</div></div>
    <div class="prop-item"><div class="label">Address</div><div class="value">${propertyAddress || "On file"}</div></div>
    <div class="prop-item"><div class="label">Building Type</div><div class="value">${buildingType}</div></div>
    <div class="prop-item"><div class="label">Square Footage</div><div class="value">${fmt(squareFootage)} SF</div></div>
    <div class="prop-item"><div class="label">Year Built</div><div class="value">${yearBuilt}</div></div>
    <div class="prop-item"><div class="label">Quality</div><div class="value">${quality}</div></div>
    <div class="prop-item"><div class="label">Condition</div><div class="value">${condition}</div></div>
    <div class="prop-item"><div class="label">Region</div><div class="value">${region}</div></div>
  </div>
</div>

<div class="section">
  <h3>Cost Calculation</h3>
  <table class="calc-table">
    <tr><td class="label-col">Base Cost per SF (${buildingType}, ${region})</td><td class="value-col">$${baseCostPerSqFt.toFixed(2)}</td></tr>
    <tr><td class="label-col">× Square Footage</td><td class="value-col">${fmt(squareFootage)} SF</td></tr>
    <tr><td class="label-col">× Quality Multiplier (${quality})</td><td class="value-col">${qualityMultiplier.toFixed(4)}</td></tr>
    <tr><td class="label-col">× Region Multiplier (${region})</td><td class="value-col">${regionMultiplier.toFixed(4)}</td></tr>
    <tr class="subtotal"><td class="label-col">= Replacement Cost New (RCN)</td><td class="value-col">$${fmt(replacementCostNew)}</td></tr>
  </table>

  <h3>Depreciation</h3>
  <table class="calc-table">
    <tr><td class="label-col">Effective Age</td><td class="value-col">${effectiveAge} years</td></tr>
    <tr><td class="label-col">Depreciation Rate</td><td class="value-col">${(depreciationRate * 100).toFixed(1)}%</td></tr>
    <tr><td class="label-col">Depreciation Amount</td><td class="value-col">($${fmt(depreciationAmount)})</td></tr>
    <tr class="subtotal"><td class="label-col">= RCNLD (Replacement Cost New Less Depreciation)</td><td class="value-col">$${fmt(rcnld)}</td></tr>
  </table>

  <h3>Total Value</h3>
  <table class="calc-table">
    <tr><td class="label-col">RCNLD (Building)</td><td class="value-col">$${fmt(rcnld)}</td></tr>
    <tr><td class="label-col">+ Land Value</td><td class="value-col">$${fmt(landValue)}</td></tr>
    <tr class="total"><td class="label-col">= TOTAL ASSESSED VALUE</td><td class="value-col">$${fmt(totalValue)}</td></tr>
  </table>
</div>

<div class="methodology">
  <strong>Methodology:</strong> Cost approach per IAAO Standard on Mass Appraisal of Real Property.
  Base costs from ${countyName} 2025 Cost Schedule (Marshall & Swift adjusted).
  Depreciation per age-condition matrix. Land valued by sales comparison.
</div>

<div class="footer">
  <p>Generated: ${generatedDate} | ${countyName} Assessor's Office — TerraForge CostForge Module</p>
  <div class="audit-hash">Audit: SHA-256:${generateAuditHash(data)}</div>
</div>
</body>
</html>`;
}

/**
 * Sales Ratio Study Report
 * Per IAAO Standard on Ratio Studies: Documents assessment uniformity.
 */
function renderRatioStudyReport(data) {
  const {
    countyName = "Benton County",
    area,
    taxYear,
    sampleSize,
    medianRatio,
    meanRatio,
    cod,
    prd,
    prb,
    codTarget = 15.0,
    prdLow = 0.98,
    prdHigh = 1.03,
    strata = [],
    generatedDate = new Date().toISOString().split("T")[0],
  } = data;

  const codStatus = cod <= codTarget ? "COMPLIANT" : "NON-COMPLIANT";
  const prdStatus = prd >= prdLow && prd <= prdHigh ? "COMPLIANT" : "NON-COMPLIANT";
  const codColor = cod <= codTarget ? "#2d5016" : "#c53030";
  const prdColor = prd >= prdLow && prd <= prdHigh ? "#2d5016" : "#c53030";

  const strataRows = strata
    .map(
      (s) => `
    <tr>
      <td>${s.name}</td>
      <td class="pct">${s.sampleSize}</td>
      <td class="pct">${s.medianRatio.toFixed(4)}</td>
      <td class="pct">${s.cod.toFixed(2)}%</td>
      <td class="pct">${s.prd.toFixed(4)}</td>
      <td style="color: ${s.cod <= codTarget ? "#2d5016" : "#c53030"}">${s.cod <= codTarget ? "✓" : "✗"}</td>
    </tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Ratio Study Report — ${area} ${taxYear}</title>
<style>
  @page { size: letter; margin: 0.75in; }
  body { font-family: 'Arial', sans-serif; font-size: 10pt; line-height: 1.4; color: #1a1a1a; }
  .header { text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 10pt; margin-bottom: 14pt; }
  .header h1 { font-size: 14pt; margin: 0; color: #1a365d; }
  .header .subtitle { font-size: 10pt; color: #444; }
  .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10pt; margin: 14pt 0; }
  .metric { text-align: center; padding: 10pt; border-radius: 4pt; border: 1px solid #ddd; }
  .metric .value { font-size: 18pt; font-weight: bold; }
  .metric .label { font-size: 8pt; text-transform: uppercase; color: #666; }
  .metric .status { font-size: 8pt; font-weight: bold; margin-top: 4pt; }
  .section h3 { color: #1a365d; border-bottom: 1px solid #1a365d; padding-bottom: 4pt; }
  table { width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 9pt; }
  th { background: #1a365d; color: white; padding: 5pt 6pt; text-align: left; }
  td { padding: 4pt 6pt; border-bottom: 1px solid #ddd; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .pct { text-align: center; }
  .iaao-box { background: #f0f4f8; border: 1px solid #1a365d; padding: 10pt; border-radius: 4pt; margin: 14pt 0; }
  .iaao-box h4 { margin: 0 0 6pt; color: #1a365d; }
  .footer { margin-top: 24pt; border-top: 1px solid #ccc; padding-top: 10pt; font-size: 8pt; color: #666; }
  .audit-hash { font-family: monospace; font-size: 7.5pt; color: #999; }
</style>
</head>
<body>
<div class="header">
  <h1>ASSESSMENT RATIO STUDY REPORT</h1>
  <div class="subtitle">${countyName} | ${area} | Tax Year ${taxYear} | IAAO Standard on Ratio Studies</div>
</div>

<div class="metrics">
  <div class="metric">
    <div class="value">${medianRatio.toFixed(4)}</div>
    <div class="label">Median Ratio</div>
    <div class="status" style="color: ${Math.abs(medianRatio - 1.0) <= 0.05 ? "#2d5016" : "#c53030"}">
      Target: 1.0000
    </div>
  </div>
  <div class="metric">
    <div class="value">${cod.toFixed(2)}%</div>
    <div class="label">COD</div>
    <div class="status" style="color: ${codColor}">${codStatus} (≤${codTarget}%)</div>
  </div>
  <div class="metric">
    <div class="value">${prd.toFixed(4)}</div>
    <div class="label">PRD</div>
    <div class="status" style="color: ${prdColor}">${prdStatus} (${prdLow}–${prdHigh})</div>
  </div>
  <div class="metric">
    <div class="value">${sampleSize}</div>
    <div class="label">Sample Size</div>
    <div class="status" style="color: #2d5016">n=${sampleSize}</div>
  </div>
</div>

<div class="section">
  <h3>Stratified Analysis</h3>
  <table>
    <thead>
      <tr><th>Stratum</th><th>Sample</th><th>Median</th><th>COD</th><th>PRD</th><th>IAAO</th></tr>
    </thead>
    <tbody>${strataRows}</tbody>
  </table>
</div>

<div class="iaao-box">
  <h4>IAAO Compliance Summary</h4>
  <p><strong>COD (Coefficient of Dispersion):</strong> Measures assessment uniformity.
  Target ≤ ${codTarget}% for residential. Current: ${cod.toFixed(2)}% — <strong style="color:${codColor}">${codStatus}</strong></p>
  <p><strong>PRD (Price-Related Differential):</strong> Measures vertical equity (regressivity).
  Target ${prdLow}–${prdHigh}. Current: ${prd.toFixed(4)} — <strong style="color:${prdColor}">${prdStatus}</strong></p>
  ${prb ? `<p><strong>PRB (Price-Related Bias):</strong> ${prb.toFixed(4)} (target: -0.05 to +0.05)</p>` : ""}
</div>

<div class="footer">
  <p>Generated: ${generatedDate} | ${countyName} Assessor's Office — TerraForge SalesForge Module</p>
  <div class="audit-hash">Audit: SHA-256:${generateAuditHash(data)}</div>
</div>
</body>
</html>`;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return "0.00";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtM(n) {
  if (n == null) return "0";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toFixed(0);
}

function generateAuditHash(data) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex")
    .substring(0, 16);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const REPORT_TYPES = {
  "rollback-notice": {
    name: "Current Use Rollback Notice",
    render: renderRollbackNotice,
    description: "RCW 84.34.108 removal notice with year-by-year breakdown",
  },
  "levy-certification": {
    name: "Levy Certification Report",
    render: renderLevyCertification,
    description: "RCW 84.52.070 certified levy rates for all districts",
  },
  "cost-valuation": {
    name: "Cost Approach Valuation Report",
    render: renderCostValuationReport,
    description: "IAAO cost approach with RCN, depreciation, and RCNLD",
  },
  "ratio-study": {
    name: "Ratio Study Report",
    render: renderRatioStudyReport,
    description: "IAAO ratio study with COD, PRD, and stratified analysis",
  },
};

/**
 * Generate an HTML report from data.
 * @param {string} reportType - One of: rollback-notice, levy-certification, cost-valuation, ratio-study
 * @param {object} data - Report data
 * @returns {string} HTML string
 */
export function generateReportHtml(reportType, data) {
  const config = REPORT_TYPES[reportType];
  if (!config) throw new Error(`Unknown report type: ${reportType}. Available: ${Object.keys(REPORT_TYPES).join(", ")}`);
  return config.render(data);
}

/**
 * Generate a PDF report by writing HTML to a temp file and converting.
 * Uses WeasyPrint (Python) if available, falls back to Puppeteer.
 * @param {string} reportType
 * @param {object} data
 * @param {string} outputPath - Where to write the PDF
 */
export async function generateReportPdf(reportType, data, outputPath) {
  const { execSync } = await import("node:child_process");
  const html = generateReportHtml(reportType, data);
  const tmpHtml = path.join(path.dirname(outputPath), `.tmp-report-${Date.now()}.html`);

  fs.writeFileSync(tmpHtml, html, "utf-8");

  try {
    // Try WeasyPrint first (lighter, no browser needed)
    execSync(`weasyprint "${tmpHtml}" "${outputPath}"`, { stdio: "pipe", timeout: 30000 });
  } catch {
    try {
      // Fallback: use manus-md-to-pdf style conversion
      execSync(`wkhtmltopdf --enable-local-file-access "${tmpHtml}" "${outputPath}"`, { stdio: "pipe", timeout: 30000 });
    } catch {
      // Last resort: save HTML and inform user
      const htmlOutput = outputPath.replace(/\.pdf$/, ".html");
      fs.copyFileSync(tmpHtml, htmlOutput);
      throw new Error(`PDF generation failed. HTML saved to: ${htmlOutput}. Install weasyprint: pip3 install weasyprint`);
    }
  } finally {
    try { fs.unlinkSync(tmpHtml); } catch {}
  }

  return outputPath;
}

export default { REPORT_TYPES, generateReportHtml, generateReportPdf };
