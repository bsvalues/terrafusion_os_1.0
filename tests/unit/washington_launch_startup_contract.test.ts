import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const frontendDockerfile = readFileSync(resolve(process.cwd(), 'frontend/Dockerfile'), 'utf8');
const devStartScript = readFileSync(resolve(process.cwd(), 'tools/dev/start.ps1'), 'utf8');

describe('Washington assessor startup posture', () => {
  it('builds a navigation-only image when both hosted-data inputs are absent', () => {
    expect(frontendDockerfile).toMatch(
      /if \[ -z "\$launch_pin" \] && \[ -z "\$launch_source" \]; then[\s\\]*echo 'Building the Washington navigation-only fallback without hosted county data'/
    );
    expect(frontendDockerfile).toMatch(
      /else[\s\\]*mkdir -p \/app\/washington-launch-data/
    );
    expect(devStartScript).toContain("$washingtonLaunchMode = 'navigation-only'");

    const baseBuild = devStartScript.indexOf('$buildArgs = @(');
    const configuredBuild = devStartScript.indexOf('if ($hasManifestPin) {');
    const configuredArgs = devStartScript.indexOf('$buildArgs += @(');
    expect(baseBuild).toBeGreaterThanOrEqual(0);
    expect(configuredBuild).toBeGreaterThan(baseBuild);
    expect(configuredArgs).toBeGreaterThan(configuredBuild);
  });

  it('rejects a partial or malformed hosted-data configuration', () => {
    expect(frontendDockerfile).toMatch(
      /elif \[ -z "\$launch_pin" \] \|\| \[ -z "\$launch_source" \]; then[\s\\]*echo 'ERROR: VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256 and WASHINGTON_LAUNCH_DATA_SOURCE_URL must be supplied together'/
    );
    expect(frontendDockerfile).toMatch(/grep -Eq '\^\[0-9a-f\]\{64\}\$'/);
    expect(devStartScript).toMatch(
      /if \(\$hasManifestPin -ne \$hasPackageSource\) \{[\s\S]*must be supplied together/
    );
    expect(devStartScript).toContain("$manifestSha256 -notmatch '^[0-9a-f]{64}$'");
    expect(devStartScript).toContain("$packageSourceUri.Scheme -ne 'https'");
    expect(devStartScript).toContain(
      "$packageSourceUri.AbsolutePath.TrimEnd('/') -ne '/launch-data/washington'"
    );
  });

  it('packages only a complete digest-pinned public-data configuration', () => {
    expect(frontendDockerfile).toMatch(
      /if \[ -n "\$VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256" \]; then[\s\\]*node scripts\/ci\/package_washington_launch_data\.mjs[\s\\]*"\$WASHINGTON_LAUNCH_DATA_SOURCE_URL"[\s\\]*"\$VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256"/
    );
    expect(devStartScript).toMatch(
      /if \(\$hasManifestPin\) \{[\s\S]*\$buildArgs \+= @\([\s\S]*"VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256=\$manifestSha256"[\s\S]*"WASHINGTON_LAUNCH_DATA_SOURCE_URL=\$packageSourceUrl"/
    );
    expect(devStartScript).toContain("$washingtonLaunchMode = 'authenticated-public-data'");
  });
});
