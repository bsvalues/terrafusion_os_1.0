import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('DotnetWarningTaxonomy Artifacts Contract', () => {
  const taxonomyPath = path.resolve(__dirname, '../../dotnet-warning-taxonomy.json');
  const logPath = path.resolve(__dirname, '../../ci_dotnet_warning_taxonomy.log');

  const runScript = () => {
    // We expect the script to exist and be runnable
    // Note: This might take time if it runs real build, so we might skip this in quick CI or mock
    // For this contract test, we'll try to run it. If it's too slow, we can mock the build step or use a dry run flag if implemented.
    // Assuming for now we run it.
    try {
      execSync('node scripts/governance/dotnetWarningTaxonomy.mjs', { stdio: 'ignore' });
    } catch (e) {
      // Ignore exit code if it's just reporting warnings (it shouldn't fail unless crash)
    }
  };

  it('should generate dotnet-warning-taxonomy.json with correct schema', () => {
    if (!fs.existsSync('scripts/governance/dotnetWarningTaxonomy.mjs')) {
      console.warn('Script not found, skipping artifact test');
      return;
    }

    // Ensure Clean State
    if (fs.existsSync(taxonomyPath)) fs.unlinkSync(taxonomyPath);

    // Run
    execSync('node scripts/governance/dotnetWarningTaxonomy.mjs', { stdio: 'ignore' });

    // Verify Existence
    expect(fs.existsSync(taxonomyPath)).toBe(true);
    expect(fs.existsSync(logPath)).toBe(true);

    // Verify Schema
    const data = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));

    expect(data).toHaveProperty('generatedAt');
    expect(data).toHaveProperty('totalWarnings');
    expect(typeof data.totalWarnings).toBe('number');

    expect(data).toHaveProperty('byCode');
    expect(data).toHaveProperty('byProject');
    expect(data).toHaveProperty('topFiles');
    expect(Array.isArray(data.topFiles)).toBe(true);
  }, 120000); // High timeout for build
});
