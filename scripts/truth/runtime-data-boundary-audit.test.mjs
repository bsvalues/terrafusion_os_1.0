#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const scriptPath = path.resolve('scripts/truth/runtime-data-boundary-audit.mjs');
const execFileAsync = promisify(execFile);

function makeTempRepo(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(root, 'backend', 'src', 'TerraFusion.API', 'Controllers'), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, 'backend', 'src', 'TerraFusion.Sync', 'Workbench', 'ETL'), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, 'frontend', 'apps', 'os-shell', 'src', 'pages'), {
    recursive: true,
  });
  return root;
}

async function runAudit(root) {
  await execFileAsync('node', [scriptPath, root], {
    cwd: process.cwd(),
    env: { ...process.env, TF_RUNTIME_DATA_BOUNDARY_STRICT: '0' },
  });
  return JSON.parse(
    fs.readFileSync(
      path.join(root, 'generated', 'truth', 'runtime-data-boundary-audit.json'),
      'utf8'
    )
  );
}

test('product runtime controller with direct legacy source connection is blocked', async () => {
  const root = makeTempRepo('tf-boundary-product-legacy-');
  fs.writeFileSync(
    path.join(root, 'backend', 'src', 'TerraFusion.API', 'Controllers', 'CostForgeController.cs'),
    `
      [Route("api/costforge")]
      public class CostForgeController : ControllerBase
      {
        public IActionResult Estimate() {
          using var connection = new SqlConnection("Server=tf-mssql;Database=pacs_oltp");
          return Ok();
        }
      }
    `
  );

  const report = await runAudit(root);
  const endpoint = report.backendEndpoints.find(item =>
    item.filePath.endsWith('CostForgeController.cs')
  );
  assert.equal(endpoint.zone, 'forbidden_product_runtime');
  assert.equal(endpoint.dataSourceClass, 'legacy_source_direct');
  assert.ok(
    endpoint.blockers.includes(
      'Product runtime endpoint has direct legacy source dependency evidence.'
    )
  );
});

test('sync ingest code may reference legacy source', async () => {
  const root = makeTempRepo('tf-boundary-sync-legacy-');
  fs.writeFileSync(
    path.join(
      root,
      'backend',
      'src',
      'TerraFusion.Sync',
      'Workbench',
      'ETL',
      'SourceController.cs'
    ),
    `
      [Route("api/sync/source")]
      public class SourceController : ControllerBase
      {
        public IActionResult Ingest(Guid sourceConnectionId) {
          var system = "PACS";
          return Ok(system);
        }
      }
    `
  );

  const report = await runAudit(root);
  const endpoint = report.backendEndpoints.find(item =>
    item.filePath.endsWith('SourceController.cs')
  );
  assert.equal(endpoint.zone, 'allowed_sync_ingest');
  assert.equal(endpoint.dataSourceClass, 'legacy_source_direct');
  assert.deepEqual(endpoint.blockers, []);
});

test('product controller reading TerraFusion canonical table passes', async () => {
  const root = makeTempRepo('tf-boundary-product-canonical-');
  fs.writeFileSync(
    path.join(
      root,
      'backend',
      'src',
      'TerraFusion.API',
      'Controllers',
      'CountyStudioController.cs'
    ),
    `
      [Route("api/county-studio")]
      public class CountyStudioController : ControllerBase
      {
        private readonly TerraFusionDbContext _db;
        public IActionResult Health() {
          return Ok(_db.CanonicalSaleQualifications.Count());
        }
      }
    `
  );

  const report = await runAudit(root);
  const endpoint = report.backendEndpoints.find(item =>
    item.filePath.endsWith('CountyStudioController.cs')
  );
  assert.equal(endpoint.zone, 'forbidden_product_runtime');
  assert.equal(endpoint.dataSourceClass, 'terrafusion_canonical');
  assert.deepEqual(endpoint.blockers, []);
});

test('product controller reading TerraFusion CamaCharacteristics is canonical, not source direct', async () => {
  const root = makeTempRepo('tf-boundary-product-cama-canonical-');
  fs.writeFileSync(
    path.join(root, 'backend', 'src', 'TerraFusion.API', 'Controllers', 'CostForgeController.cs'),
    `
      [Route("api/costforge")]
      public class CostForgeController : ControllerBase
      {
        private readonly TerraFusionDbContext _db;
        public IActionResult Estimate() {
          return Ok(_db.CamaCharacteristics.Count());
        }
      }
    `
  );

  const report = await runAudit(root);
  const endpoint = report.backendEndpoints.find(item =>
    item.filePath.endsWith('CostForgeController.cs')
  );
  assert.equal(endpoint.zone, 'forbidden_product_runtime');
  assert.equal(endpoint.dataSourceClass, 'terrafusion_canonical');
  assert.deepEqual(endpoint.directLegacyTerms, []);
  assert.deepEqual(endpoint.blockers, []);
});

test('product endpoint with neither canonical nor legacy evidence is unproven', async () => {
  const root = makeTempRepo('tf-boundary-product-unproven-');
  fs.writeFileSync(
    path.join(root, 'backend', 'src', 'TerraFusion.API', 'Controllers', 'AtlasController.cs'),
    `
      [Route("api/atlas")]
      public class AtlasController : ControllerBase
      {
        public IActionResult Overlay() => Ok(new { status = "ok" });
      }
    `
  );

  const report = await runAudit(root);
  const endpoint = report.backendEndpoints.find(item =>
    item.filePath.endsWith('AtlasController.cs')
  );
  assert.equal(endpoint.zone, 'forbidden_product_runtime');
  assert.equal(endpoint.dataSourceClass, 'unproven');
  assert.ok(
    endpoint.blockers.includes(
      'Product runtime endpoint has no TerraFusion canonical/runtime data evidence.'
    )
  );
});

test('frontend user-facing legacy source reference is blocked', async () => {
  const root = makeTempRepo('tf-boundary-frontend-legacy-');
  fs.writeFileSync(
    path.join(root, 'frontend', 'apps', 'os-shell', 'src', 'pages', 'CountyStudio.tsx'),
    `
      export function CountyStudio() {
        fetch('/api/county-studio/health');
        return <span>PACS source status</span>;
      }
    `
  );
  fs.writeFileSync(
    path.join(
      root,
      'backend',
      'src',
      'TerraFusion.API',
      'Controllers',
      'CountyStudioController.cs'
    ),
    `
      [Route("api/county-studio")]
      public class CountyStudioController : ControllerBase
      {
        private readonly TerraFusionDbContext _db;
        public IActionResult Health() => Ok(_db.CanonicalSaleQualifications.Count());
      }
    `
  );

  const report = await runAudit(root);
  assert.ok(
    report.frontendCalls.some(
      call =>
        call.filePath.endsWith('CountyStudio.tsx') &&
        call.surface === 'county_studio' &&
        call.endpoint === '/api/county-studio/health' &&
        call.legacyTerms.includes('PACS') &&
        call.blockers.includes(
          'Frontend product surface contains user-facing legacy source terminology.'
        )
    )
  );
  assert.equal(report.summary.frontendLegacyViolations, 1);
  const endpoint = report.backendEndpoints.find(item =>
    item.filePath.endsWith('CountyStudioController.cs')
  );
  assert.equal(endpoint.dataSourceClass, 'terrafusion_canonical');
});
