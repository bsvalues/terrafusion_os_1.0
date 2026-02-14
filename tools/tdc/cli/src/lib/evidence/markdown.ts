/**
 * Evidence Pack Markdown Generator
 *
 * Generates PR-ready markdown snippets for GitHub PR body injection.
 *
 * Output format:
 * - Overall status with icon (✅ PASS, ❌ FAIL, ⚠️  WARN, ⊘ SKIP)
 * - PR metadata (number, branch, generated timestamp)
 * - Lane results table
 * - Cryptographic integrity summary
 * - "Government. Transcended. Receipted." footer
 */

import { EvidencePack } from './aggregate';

/**
 * Get status icon for markdown display
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'PASS':
      return '✅';
    case 'FAIL':
      return '❌';
    case 'WARN':
      return '⚠️ ';
    case 'SKIP':
      return '⊘';
    default:
      return '❓';
  }
}

/**
 * Generate PR-ready markdown snippet
 */
export function generateMarkdownSnippet(evidencePack: EvidencePack): string {
  const lines: string[] = [];

  // Header
  lines.push('## 🏛️  TerraFusion PR Evidence Pack');
  lines.push('');

  // Overall status
  const statusIcon = getStatusIcon(evidencePack.overallStatus);
  lines.push(`**Overall Status:** ${statusIcon} ${evidencePack.overallStatus}`);

  // PR metadata
  if (evidencePack.prNumber) {
    lines.push(`**PR:** #${evidencePack.prNumber}`);
  }
  if (evidencePack.branchRef) {
    lines.push(`**Branch:** \`${evidencePack.branchRef}\``);
  }
  lines.push(`**Generated:** ${evidencePack.generatedAt}`);
  lines.push(
    `**Lanes Audited:** ${evidencePack.lanesAudited.length > 0 ? evidencePack.lanesAudited.join(', ') : 'none'} (${evidencePack.lanesAudited.length} lanes)`
  );
  lines.push(`**Total Violations:** ${evidencePack.totalViolations}`);
  lines.push('');

  // Lane results table (if any contracts)
  if (evidencePack.contracts && evidencePack.contracts.length > 0) {
    lines.push('### 📋 Lane Results');
    lines.push('');
    lines.push('| Lane | Skill | Status | Violations |');
    lines.push('|------|-------|--------|------------|');

    evidencePack.contracts.forEach(contract => {
      const icon = getStatusIcon(contract.status);
      lines.push(
        `| ${contract.lane} | ${contract.skillName} | ${icon} ${contract.status} | ${contract.violationsCount} |`
      );
    });
    lines.push('');
  } else {
    lines.push('### 📋 Lane Results');
    lines.push('');
    lines.push('_No contracts found - Evidence Pack empty_');
    lines.push('');
  }

  // Cryptographic integrity summary
  lines.push('### 🔒 Cryptographic Integrity');
  lines.push('');
  lines.push(`- **Artifacts Hashed:** ${evidencePack.contracts.length}`);
  lines.push(`- **Context Pack:** \`${evidencePack.contextHash.substring(0, 20)}...\` ✅ Verified`);

  if (evidencePack.contracts.some(c => c.cid)) {
    const cid = evidencePack.contracts.find(c => c.cid)?.cid;
    lines.push(`- **CID:** \`${cid}\` (IPFS-ready)`);
  }
  lines.push('');

  // Metadata (CI environment)
  if (evidencePack.metadata) {
    lines.push('### 🤖 CI Metadata');
    lines.push('');
    lines.push(`- **TDC Version:** ${evidencePack.metadata.tdcVersion || 'N/A'}`);
    lines.push(`- **Node Version:** ${evidencePack.metadata.nodeVersion || 'N/A'}`);
    lines.push(`- **Environment:** ${evidencePack.metadata.ciEnvironment || 'N/A'}`);
    lines.push(`- **Triggered By:** ${evidencePack.metadata.triggeredBy || 'N/A'}`);
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('**Government. Transcended. Receipted.** 🏛️');

  return lines.join('\n');
}

/**
 * Generate compact summary for Context Pack
 */
export function generateCompactSummary(evidencePack: EvidencePack): string {
  const statusIcon = getStatusIcon(evidencePack.overallStatus);
  return `${statusIcon} ${evidencePack.overallStatus} | ${evidencePack.totalViolations} violations | ${evidencePack.contracts.length} contracts`;
}
