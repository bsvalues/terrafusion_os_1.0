import { generateReportHtml } from '../tools/bin/commands/reports/report-engine.mjs';
import { writeFileSync } from 'fs';
import { createHash } from 'crypto';

const reports = [
  { type: 'rollback-notice', data: { parcelId: '1-0567-200-0045', ownerName: 'John Smith', classification: 'CUFA', enrollmentYear: 2015, removalYear: 2025, penaltyException: null, yearBreakdown: [{year:2016,currentUseValue:45000,marketValue:180000,taxDifference:1350},{year:2017,currentUseValue:47000,marketValue:195000,taxDifference:1480},{year:2018,currentUseValue:49000,marketValue:210000,taxDifference:1610},{year:2019,currentUseValue:51000,marketValue:225000,taxDifference:1740},{year:2020,currentUseValue:53000,marketValue:240000,taxDifference:1870},{year:2021,currentUseValue:55000,marketValue:260000,taxDifference:2050},{year:2022,currentUseValue:57000,marketValue:285000,taxDifference:2280},{year:2023,currentUseValue:59000,marketValue:310000,taxDifference:2510},{year:2024,currentUseValue:61000,marketValue:335000,taxDifference:2740},{year:2025,currentUseValue:63000,marketValue:360000,taxDifference:2970}], totalRollbackTax: 20600, penaltyAmount: 4120, interestAmount: 3090, grandTotal: 27810 }},
  { type: 'levy-certification', data: { taxYear: 2026, totalAssessedValue: 28500000000, levyDistricts: [{code:'0010',name:'State School',rate:2.1604,amount:61571400},{code:'0020',name:'County General',rate:1.5200,amount:43320000},{code:'0030',name:'County Road',rate:2.2500,amount:64125000},{code:'0040',name:'City of Kennewick',rate:3.1050,amount:88492500}], compositeRate: 9.0354, totalLevyAmount: 257509900 }},
  { type: 'cost-valuation', data: { parcelId: '1-0234-100-0001', ownerName: 'Jane Doe', propertyAddress: '1234 W Canal Dr, Kennewick WA', buildingType: 'SFR', squareFootage: 2450, yearBuilt: 1998, quality: 'Average', condition: 'Good', region: 'Benton County', baseCostPerSqFt: 142.50, qualityMultiplier: 1.0, regionMultiplier: 0.98, replacementCostNew: 349125, effectiveAge: 15, depreciationRate: 0.25, depreciationAmount: 87281, rcnld: 261844, landValue: 95000, totalValue: 356844 }},
  { type: 'ratio-study', data: { taxYear: 2026, neighborhood: '15112', propertyType: 'Residential', sampleSize: 127, medianRatio: 0.965, meanRatio: 0.972, weightedMean: 0.968, cod: 8.4, prd: 1.012, prb: -0.003, iaaoCompliance: { cod: true, prd: true, prb: true } }}
];

const results = [];
for (const r of reports) {
  const html = generateReportHtml(r.type, r.data);
  const hash = createHash('sha256').update(html).digest('hex').slice(0,16);
  const outPath = '/home/ubuntu/terrafusion_os_1.0/evidence/sample-' + r.type + '.html';
  writeFileSync(outPath, html);
  results.push({ type: r.type, size: html.length, hash, file: outPath });
}

console.log(JSON.stringify(results, null, 2));
