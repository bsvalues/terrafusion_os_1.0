import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  classifyCapabilityObservation,
  evaluateSurfaceObservation,
  evaluateTerraForgeProof,
  evaluateVisibleReleaseIdentity,
} from './acceptance-truth.mjs';

const EXPECTED_RELEASE_SHA = '6f7755090a21efc90fee423fe35b8d72805ef1e5';

describe('visible release identity truth gate', () => {
  it('fails when the visible sentinel SHA is dev', () => {
    const result = evaluateVisibleReleaseIdentity({
      bodyText: 'SENTINEL CONSOLE\nSHA: dev\nAPI: /api/system/health',
      expectedReleaseSha: EXPECTED_RELEASE_SHA,
    });

    assert.equal(result.status, 'FAIL');
    assert.equal(result.visibleSha, 'dev');
    assert.match(result.reason, /visible shell sha/i);
  });

  it('passes only when the visible sentinel SHA matches the expected release', () => {
    const result = evaluateVisibleReleaseIdentity({
      bodyText: `SENTINEL CONSOLE\nSHA: ${EXPECTED_RELEASE_SHA}\nAPI: /api/system/health`,
      expectedReleaseSha: EXPECTED_RELEASE_SHA,
    });

    assert.equal(result.status, 'PASS');
    assert.equal(result.visibleSha, EXPECTED_RELEASE_SHA);
  });
});

describe('surface truth evaluation', () => {
  it('fails a ready-looking surface when the visible shell SHA is dev', () => {
    const result = evaluateSurfaceObservation({
      family: 'suite',
      path: '/forge',
      bodyText: 'TerraForge\nSENTINEL CONSOLE\nSHA: dev\nAPI: /api/system/health',
      expectedReleaseSha: EXPECTED_RELEASE_SHA,
      pageErrors: [],
    });

    assert.equal(result.ready, false);
    assert.match(result.blockers.join(' | '), /visible shell sha/i);
  });

  it('detects lowercase PACS runtime text on suite surfaces', () => {
    const result = evaluateSurfaceObservation({
      family: 'suite',
      path: '/forge',
      bodyText: `TerraForge\nSENTINEL CONSOLE\nSHA: ${EXPECTED_RELEASE_SHA}\npacs export source`,
      expectedReleaseSha: EXPECTED_RELEASE_SHA,
      pageErrors: [],
    });

    assert.equal(result.ready, false);
    assert.equal(result.pacsTextFound, true);
    assert.match(result.blockers.join(' | '), /PACS-facing runtime text/i);
  });
});

describe('TerraForge primary capability classification', () => {
  it('marks CostForge county-scope posture as shell-only', () => {
    const result = classifyCapabilityObservation('costforge', {
      cardVisible: true,
      launchActionable: true,
      launchedModuleId: 'costforge',
      windowTitle: 'CostForge',
      bodyText:
        'TerraFusion · Cost Approach\nCostForge\nCounty scope required to load CostForge.\nParcels valued —\nAvg cost/sqft —',
    });

    assert.equal(result.status, 'SHELL ONLY');
  });

  it('marks SalesForge HTTP 401 as fail', () => {
    const result = classifyCapabilityObservation('salesforge', {
      cardVisible: true,
      launchActionable: true,
      launchedModuleId: 'sales-forge',
      windowTitle: 'SalesForge',
      bodyText:
        'TerraForge · Sale Qualification\nSalesForge\nLive TerraFusion API\nHTTP 401\nQualified 0\nMedian ratio —\nCOD —',
    });

    assert.equal(result.status, 'FAIL');
  });

  it('marks CompsForge parcel-only blockage as wrong surface', () => {
    const result = classifyCapabilityObservation('compsforge', {
      cardVisible: true,
      launchActionable: true,
      launchedModuleId: 'comps-forge',
      windowTitle: 'CompsForge - Sales Comparison',
      bodyText:
        'CompsForge - Sales Comparison\nSelect a parcel before running sales comparison.\nActive parcel is missing a county code, so CompsForge cannot load the county sales shard.\n0 scoped sales',
    });

    assert.equal(result.status, 'WRONG SURFACE');
  });

  it('marks Calibration / QC opening CostForge as wrong surface', () => {
    const result = classifyCapabilityObservation('calibration-qc', {
      cardVisible: true,
      launchActionable: true,
      launchedModuleId: 'costforge',
      windowTitle: 'CostForge',
      bodyText: 'TerraFusion · Cost Approach\nCostForge\nCounty scope required to load CostForge.',
    });

    assert.equal(result.status, 'WRONG SURFACE');
  });

  it('marks IncomeForge manual-only posture as partial', () => {
    const result = classifyCapabilityObservation('incomeforge', {
      cardVisible: true,
      launchActionable: true,
      launchedModuleId: 'income-forge',
      windowTitle: 'IncomeForge',
      bodyText:
        'IncomeForge\nProperty Types 0\nLocations 0\nMarket Cap Rate 0.00%\nMedian Home $0\nMedian Income $0\nRun the valuation to calculate NOI, risk, and indicated value.',
    });

    assert.equal(result.status, 'PARTIAL');
  });

  it('marks a capability missing from the suite as missing', () => {
    const result = classifyCapabilityObservation('reconciliation', {
      cardVisible: false,
      launchActionable: false,
      launchedModuleId: null,
      windowTitle: null,
      bodyText: '',
    });

    assert.equal(result.status, 'MISSING');
  });

  it('requires visible app-specific runtime success for PASS', () => {
    const result = classifyCapabilityObservation('salesforge', {
      cardVisible: true,
      launchActionable: true,
      launchedModuleId: 'sales-forge',
      windowTitle: 'SalesForge',
      bodyText:
        'TerraForge · Sale Qualification\nSalesForge\nLive TerraFusion API\nQualified 128\nNon-qualified 14\nPending 9\nMedian ratio 0.97\nCOD 11.2\nPRD 1.01',
    });

    assert.equal(result.status, 'PASS');
  });

  it('fails HTTP errors for every capability before success-looking text', () => {
    const result = classifyCapabilityObservation('costforge', {
      cardVisible: true,
      launchActionable: true,
      launchedModuleId: 'costforge',
      windowTitle: 'CostForge',
      bodyText: 'CostForge\nHTTP 500\nParcels valued 128\nAvg cost/sqft $226',
    });

    assert.equal(result.status, 'FAIL');
  });

  it('checks shell-only blockers before success signals', () => {
    const result = classifyCapabilityObservation('costforge', {
      cardVisible: true,
      launchActionable: true,
      launchedModuleId: 'costforge',
      windowTitle: 'CostForge',
      bodyText:
        'CostForge\nCounty scope required to load CostForge.\nParcels valued 128\nAvg cost/sqft $226',
    });

    assert.equal(result.status, 'SHELL ONLY');
  });

  it('does not count valuation-notes title text as runtime proof', () => {
    const result = classifyCapabilityObservation('valuation-notes-defensibility', {
      cardVisible: true,
      launchActionable: true,
      launchedModuleId: 'valuation-notes-defensibility',
      windowTitle: 'Valuation Notes / Defensibility',
      bodyText: 'Valuation Notes / Defensibility',
    });

    assert.equal(result.status, 'FAIL');
  });

  it('passes valuation-notes only when rationale and evidence are visible', () => {
    const result = classifyCapabilityObservation('valuation-notes-defensibility', {
      cardVisible: true,
      launchActionable: true,
      launchedModuleId: 'valuation-notes-defensibility',
      windowTitle: 'Valuation Notes / Defensibility',
      bodyText:
        'Valuation Notes / Defensibility\nRationale: reconciled income and sales signals.\nEvidence: county valuation note packet.',
    });

    assert.equal(result.status, 'PASS');
  });
});

describe('TerraForge proof summary', () => {
  it('fails the suite when /forge itself says Full TerraForge not done', () => {
    const result = evaluateTerraForgeProof({
      expectedReleaseSha: EXPECTED_RELEASE_SHA,
      suiteBodyText:
        `TerraForge\nSuite metrics app-backed partial\nFull TerraForge not done\nSENTINEL CONSOLE\nSHA: ${EXPECTED_RELEASE_SHA}`,
      capabilityResults: [
        {
          id: 'salesforge',
          label: 'SalesForge',
          status: 'PASS',
          reasons: [],
        },
      ],
      supportCapabilities: [],
      workbenchCountedAsProof: false,
      pacsRuntimeTextFound: false,
    });

    assert.equal(result.status, 'FAIL');
    assert.match(result.blockers.join(' | '), /full terraforge not done/i);
  });
});
