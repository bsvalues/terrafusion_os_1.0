export const postDbRefreshQuickCommand = 'pnpm run truth:post-db-refresh-rerun';
export const postDbRefreshFullReadinessCommand = 'pnpm run readiness:june10';

export const postDbRefreshPlan = [
  {
    name: 'Runtime DB identity',
    command: 'pnpm',
    args: ['run', 'truth:runtime-db-identity'],
    proves:
      'The running API is connected to the intended TerraFusion DB before row counts are trusted.',
    expectedArtifacts: [
      'generated/truth/runtime-db-identity.json',
      'generated/truth/runtime-db-identity.md',
    ],
  },
  {
    name: 'Runtime DB content',
    command: 'pnpm',
    args: ['run', 'truth:runtime-db-content'],
    proves: 'TerraFusion DB product runtime tables are present with expected table-level shape.',
    expectedArtifacts: [
      'generated/truth/runtime-db-content-audit.json',
      'generated/truth/runtime-db-content-audit.md',
    ],
  },
  {
    name: 'Product load ledger',
    command: 'pnpm',
    args: ['run', 'truth:terrafusion-db-product-load-ledger'],
    proves:
      'Product runtime rows have ProductLoadReceipts evidence for table, county, count, and load timestamp.',
    expectedArtifacts: [
      'generated/truth/terrafusion-db-product-load-ledger.json',
      'generated/truth/terrafusion-db-product-load-ledger.md',
    ],
  },
  {
    name: 'Benton parcel count sanity',
    command: 'pnpm',
    args: ['run', 'truth:benton-parcel-count-sanity'],
    proves:
      'Benton parcel endpoint returns active/current distinct parcel semantics, not raw mirror rows.',
    expectedArtifacts: [
      'generated/truth/benton-parcel-count-sanity.json',
      'generated/truth/benton-parcel-count-sanity.md',
    ],
  },
  {
    name: 'Runtime source lineage',
    command: 'pnpm',
    args: ['run', 'truth:runtime-source-lineage'],
    proves: 'Runtime row-path proof remains inside TerraFusion DB/API boundaries.',
    expectedArtifacts: [
      'generated/truth/runtime-row-source-lineage-proof.json',
      'generated/truth/runtime-row-source-lineage-proof.md',
    ],
  },
  {
    name: 'Runtime sale qualification',
    command: 'pnpm',
    args: ['run', 'truth:runtime-sale-qualification'],
    proves:
      'Benton sales qualification is canonical-backed or fails closed with explicit blockers.',
    expectedArtifacts: [
      'generated/truth/runtime-sale-qualification-lineage-proof.json',
      'generated/truth/runtime-sale-qualification-lineage-proof.md',
    ],
  },
  {
    name: 'Benton runtime pilot closure',
    command: 'pnpm',
    args: ['run', 'truth:benton-runtime-pilot-closure'],
    proves:
      'Benton pilot can close only after DB identity, load receipts, parcel sanity, and sales pass.',
    expectedArtifacts: [
      'generated/truth/benton-runtime-pilot-closure.json',
      'generated/truth/benton-runtime-pilot-closure.md',
    ],
  },
  {
    name: 'June 10 readiness packet',
    command: 'pnpm',
    args: ['run', 'truth:june10-readiness-packet'],
    proves: 'Final June 10 packet reflects the refreshed TerraFusion DB state.',
    expectedArtifacts: [
      'generated/truth/june10-readiness-packet.json',
      'generated/truth/june10-readiness-packet.md',
    ],
  },
];

export function commandText(command) {
  return [command.command, ...command.args].join(' ');
}

export function postDbRefreshChecklist() {
  return postDbRefreshPlan.map((item, index) => ({
    order: index + 1,
    command: commandText(item),
    proves: item.proves,
  }));
}
