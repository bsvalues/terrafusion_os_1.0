import fs from 'node:fs';
import type { UiTokenComplianceContract } from '../contracts/ui-token-compliance.contract';

export function printTokenReport(contractPath: string): string {
  const raw = fs.readFileSync(contractPath, 'utf8');
  const c = JSON.parse(raw) as UiTokenComplianceContract;

  if (c.ok) return '✅ Token compliance: OK (0 violations)\n';

  const byFile = new Map<string, number>();
  for (const v of c.violations) byFile.set(v.file, (byFile.get(v.file) ?? 0) + 1);

  const top = [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);

  let out = `❌ Token compliance FAILED: ${c.violationCount} violations across ${byFile.size} files\n\nTop files:\n`;
  for (const [file, n] of top) out += `  ${String(n).padStart(4)}  ${file}\n`;

  out += '\nNext action: fix top offenders first (highest leverage).\n';
  return out;
}
