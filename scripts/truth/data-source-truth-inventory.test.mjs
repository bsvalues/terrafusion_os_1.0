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
  assert.ok(yakima.blockingReasons.some(reason => reason.includes('demo')));
});
