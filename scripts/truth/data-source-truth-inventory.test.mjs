#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

const scriptPath = path.resolve('scripts/truth/data-source-truth-inventory.mjs');

function makeTempRepo(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('inventory produces county matrix and detects Benton chain evidence', () => {
  const root = makeTempRepo('tf-data-truth-');

  fs.mkdirSync(path.join(root, 'scripts', 'public-data'), { recursive: true });
  fs.mkdirSync(path.join(root, 'data', 'public'), { recursive: true });
  fs.mkdirSync(path.join(root, 'data', 'cost-matrices'), { recursive: true });
  fs.mkdirSync(path.join(root, 'api'), { recursive: true });
  fs.mkdirSync(
    path.join(root, 'frontend', 'apps', 'os-shell', 'src', 'pages', 'forge', 'county-studio'),
    { recursive: true }
  );

  fs.writeFileSync(
    path.join(root, 'scripts', 'public-data', 'benton-scraper.ts'),
    `
    export const county = 'Benton';
    export const sourceUrl = 'https://example.test/benton';
    export async function scrapeBentonPublicData() {
      return [{ parcelId: '123', salePrice: 100000 }];
    }
  `
  );
  fs.writeFileSync(
    path.join(root, 'data', 'public', 'benton-sales.csv'),
    'parcel_id,sale_price\n123,100000\n456,200000\n'
  );
  fs.writeFileSync(
    path.join(root, 'data', 'cost-matrices', 'benton_cost_matrix_live.json'),
    JSON.stringify({
      county: 'Benton',
      parcelId: '123',
      yearBuilt: 1994,
      buildingArea: 2200,
      qualityGrade: 'Good',
      condition: 'Average',
      landSize: 7405,
      neighborhood: 'Benton Test Market',
      salePrice: 100000,
      saleDate: '2025-01-15',
      qualifiedSale: true,
      replacementCost: 245000,
      costSchedule: [{ classCode: 'R1', baseCost: 112 }],
      depreciationTable: [{ age: 30, factor: 0.72 }],
      landModel: [{ marketArea: 'Benton Test Market', rate: 12.5 }],
      calibrationProof: 'Benton canonical calibrated CostForge proof',
    })
  );
  fs.writeFileSync(
    path.join(root, 'api', 'benton-route.ts'),
    `
    import express from 'express';
    export const router = express.Router();
    router.get('/api/counties/benton/sales', async (_req, res) => {
      res.json({ county: 'Benton' });
    });
  `
  );
  fs.writeFileSync(
    path.join(
      root,
      'frontend',
      'apps',
      'os-shell',
      'src',
      'pages',
      'forge',
      'county-studio',
      'BentonCountyStudio.tsx'
    ),
    `
    export function BentonCountyStudio() {
      return <section>County Studio Benton Atlas SalesForge Workbench</section>;
    }
  `
  );

  execFileSync('node', [scriptPath, root], { cwd: process.cwd(), stdio: 'pipe' });

  const report = JSON.parse(
    fs.readFileSync(
      path.join(root, 'generated', 'truth', 'data-source-truth-inventory.json'),
      'utf8'
    )
  );
  const benton = report.rows.find(row => row.county === 'Benton');

  assert.ok(benton);
  assert.equal(benton.scraperOrAdapterExists, true);
  assert.equal(benton.dbTableTargetExists, true);
  assert.ok(benton.rowsLanded >= 2);
  assert.equal(benton.runtimeApiConsumesIt, true);
  assert.ok(benton.uiSurfacePath);
  assert.equal(benton.trustTier, 'public_source_pilot_unproven');
  assert.equal(benton.costForge.costForgeReadinessTier, 'CF5_county_calibrated_cost_model');
  assert.equal(benton.costForge.costForgeCountyMode, 'benton_canonical_calibrated');
  assert.ok(benton.costForge.blockedWorkflows.includes('claim_official_county_cost_schedule'));
});

test('inventory flags demo content as demo-only', () => {
  const root = makeTempRepo('tf-data-truth-demo-');
  fs.mkdirSync(path.join(root, 'data', 'databases', 'county-databases'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'data', 'databases', 'county-databases', 'yakima-demo.sql'),
    `
    -- Yakima demo synthetic placeholder
    INSERT INTO sales VALUES ('fake');
  `
  );

  execFileSync('node', [scriptPath, root], { cwd: process.cwd(), stdio: 'pipe' });

  const report = JSON.parse(
    fs.readFileSync(
      path.join(root, 'generated', 'truth', 'data-source-truth-inventory.json'),
      'utf8'
    )
  );
  const yakima = report.rows.find(row => row.county === 'Yakima');

  assert.ok(yakima);
  assert.equal(yakima.classification, 'demo_artifact');
  assert.equal(yakima.trustTier, 'demo_only');
  assert.equal(yakima.costForge.costForgeReadinessTier, 'CF0_no_runtime_data');
  assert.equal(yakima.costForge.costForgeCountyMode, 'not_available');
  assert.ok(yakima.blockingReasons.some(reason => reason.includes('demo')));
});

test('inventory treats non-Benton CostForge coverage as pilot-derived, not official', () => {
  const root = makeTempRepo('tf-data-truth-costforge-');
  fs.mkdirSync(path.join(root, 'data', 'public'), { recursive: true });

  fs.writeFileSync(
    path.join(root, 'data', 'public', 'island-property-costforge.json'),
    JSON.stringify([
      {
        county: 'Island',
        parcelId: 'I-1',
        yearBuilt: 2002,
        buildingArea: 1800,
        condition: 'Average',
        landSize: 6534,
        neighborhood: 'Island Market A',
        salePrice: 410000,
        saleDate: '2025-03-10',
        replacementCost: 352000,
      },
    ])
  );

  execFileSync('node', [scriptPath, root], { cwd: process.cwd(), stdio: 'pipe' });

  const report = JSON.parse(
    fs.readFileSync(
      path.join(root, 'generated', 'truth', 'data-source-truth-inventory.json'),
      'utf8'
    )
  );
  const island = report.rows.find(row => row.county === 'Island');

  assert.ok(island);
  assert.equal(
    island.costForge.costForgeReadinessTier,
    'CF4_model_derived_cost_estimates_available'
  );
  assert.equal(island.costForge.costForgeCountyMode, 'sales_supported_estimate_mode');
  assert.equal(island.costForge.hasCountySpecificCostSchedule, false);
  assert.ok(island.costForge.allowedWorkflows.includes('run_model_derived_cost_estimate'));
  assert.ok(island.costForge.blockedWorkflows.includes('claim_county_certified_value'));
});
