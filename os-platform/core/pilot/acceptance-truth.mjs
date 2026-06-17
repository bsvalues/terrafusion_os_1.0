const HTTP_ERROR_RE = /\bHTTP\s+(401|403|500)\b/i;
const PACS_TEXT_RE = /\bPACS\b|\bPacs\b|pacs_/;
const VISIBLE_SHA_RE = /\bSHA:\s*([^\s]+)/i;

const FORGE_SUITE_BLOCKERS = [
  /Full TerraForge not done/i,
  /Suite metrics app-backed partial/i,
  /preview-locked/i,
  /county rollup blocked/i,
];

const CAPABILITY_RULES = {
  costforge: {
    label: 'CostForge',
    expectedModuleIds: ['costforge'],
    expectedWindowTitles: [/CostForge/i],
    shellOnlyPatterns: [
      /County scope required to load CostForge\./i,
      /County scope required for CostForge\./i,
      /Parcels valued\s*—/i,
      /Avg cost\/sqft\s*—/i,
    ],
    successPatterns: [/Parcels valued\s+[1-9]\d*/i, /Avg cost\/sqft\s+(?:\$)?[1-9]\d*/i],
  },
  compsforge: {
    label: 'CompsForge',
    expectedModuleIds: ['comps-forge'],
    expectedWindowTitles: [/CompsForge/i],
    wrongSurfacePatterns: [
      /Select a parcel before running sales comparison\./i,
      /missing a county code/i,
      /county sales shard/i,
    ],
    shellOnlyPatterns: [/0 scoped sales/i, /Comparable sales are unavailable/i],
    successPatterns: [/[1-9]\d*\s+scoped sales/i],
  },
  salesforge: {
    label: 'SalesForge',
    expectedModuleIds: ['sales-forge'],
    expectedWindowTitles: [/SalesForge/i],
    failurePatterns: [HTTP_ERROR_RE],
    shellOnlyPatterns: [/Qualified\s+0\b/i, /Median ratio\s+—/i, /COD\s+—/i, /PRD\s+—/i],
    successPatterns: [
      /Qualified\s+[1-9]\d*/i,
      /Median ratio\s+(?!—)[0-9.]+/i,
      /COD\s+(?!—)[0-9.]+/i,
      /PRD\s+(?!—)[0-9.]+/i,
    ],
    successMode: 'all',
  },
  incomeforge: {
    label: 'IncomeForge',
    expectedModuleIds: ['income-forge'],
    expectedWindowTitles: [/IncomeForge/i],
    failurePatterns: [HTTP_ERROR_RE],
    honestUnavailablePatterns: [/explicitly deferred/i],
    partialPatterns: [
      /Run the valuation to calculate NOI, risk, and indicated value\./i,
      /Property Types\s+0\b/i,
      /Locations\s+0\b/i,
      /Market Cap Rate\s+0\.00%/i,
    ],
    successPatterns: [
      /Property Types\s+[1-9]\d*/i,
      /Locations\s+[1-9]\d*/i,
      /Market Cap Rate\s+(?!0\.00%)[0-9.]+%/i,
      /Median Home\s+\$[1-9]\d*/i,
      /Median Income\s+\$[1-9]\d*/i,
    ],
    minSuccessSignals: 2,
  },
  reconciliation: {
    label: 'Reconciliation',
    expectedModuleIds: ['reconciliation'],
    expectedWindowTitles: [/Reconciliation/i, /Value Reconciliation/i],
    shellOnlyPatterns: [
      /Select a parcel to reconcile/i,
      /Select a parcel and enter at least one positive approach indication to reconcile\./i,
    ],
    successPatterns: [/Reconciled Value/i, /Final Value/i, /Weighted Average/i],
  },
  'calibration-qc': {
    label: 'Calibration / QC',
    expectedModuleIds: ['calibration-qc'],
    expectedWindowTitles: [/Calibration/i, /QC/i],
    successPatterns: [/PRD/i, /COD/i, /segment/i],
  },
  'cama-characteristics': {
    label: 'CAMA Characteristics',
    expectedModuleIds: ['cama-characteristics'],
    expectedWindowTitles: [/CAMA Characteristics/i],
    shellOnlyPatterns: [
      /Enter a parcel number to read TerraFusion CAMA characteristics\./i,
      /No sample or fallback rows are rendered\./i,
    ],
    successPatterns: [/Gross Living Area/i, /Year Built/i, /Characteristic/i],
  },
  'valuation-notes-defensibility': {
    label: 'Valuation Notes \/ Defensibility',
    expectedModuleIds: ['valuation-notes-defensibility'],
    expectedWindowTitles: [/Valuation Notes/i, /Defensibility/i],
    shellOnlyPatterns: [
      /Enter a parcel ID to read valuation signals and note headers\./i,
      /No sample packets or fallback notes are rendered\./i,
    ],
    successPatterns: [/Valuation/i, /Notes/i, /Rationale/i, /Evidence/i],
    minSuccessSignals: 2,
  },
};

function hasTextMatch(text, patterns = []) {
  return patterns.some(pattern => pattern.test(text));
}

function matchedPatterns(text, patterns = []) {
  return patterns.filter(pattern => pattern.test(text)).map(pattern => pattern.source);
}

function countMatches(text, patterns = []) {
  return patterns.filter(pattern => pattern.test(text)).length;
}

export function extractVisibleReleaseSha(bodyText) {
  const match = bodyText.match(VISIBLE_SHA_RE);
  return match?.[1] ?? null;
}

export function evaluateVisibleReleaseIdentity({ bodyText, expectedReleaseSha }) {
  const visibleSha = extractVisibleReleaseSha(bodyText);
  if (!visibleSha) {
    return {
      status: 'FAIL',
      visibleSha: null,
      reason: 'Visible shell SHA was not found on the rendered surface.',
    };
  }
  if (visibleSha.toLowerCase() === 'dev') {
    return {
      status: 'FAIL',
      visibleSha,
      reason: 'Visible shell SHA is dev, so the rendered surface does not prove the expected release identity.',
    };
  }
  if (expectedReleaseSha && visibleSha !== expectedReleaseSha) {
    return {
      status: 'FAIL',
      visibleSha,
      reason: `Visible shell SHA ${visibleSha} does not match expected release ${expectedReleaseSha}.`,
    };
  }
  return {
    status: 'PASS',
    visibleSha,
    reason: null,
  };
}

export function evaluateSurfaceObservation({
  family,
  path,
  bodyText,
  expectedReleaseSha,
  pageErrors = [],
}) {
  const blockers = [];
  const releaseIdentity = evaluateVisibleReleaseIdentity({ bodyText, expectedReleaseSha });
  if (releaseIdentity.status !== 'PASS') {
    blockers.push(releaseIdentity.reason);
  }
  if (family !== 'feature' && PACS_TEXT_RE.test(bodyText)) {
    blockers.push(`${path} exposes PACS-facing runtime text.`);
  }
  if (pageErrors.length > 0) {
    blockers.push(`Browser page errors: ${pageErrors.join(' | ')}`);
  }
  return {
    ready: blockers.length === 0,
    blockers,
    visibleReleaseSha: releaseIdentity.visibleSha,
  };
}

export function classifyCapabilityObservation(capabilityId, observation) {
  const rule = CAPABILITY_RULES[capabilityId];
  if (!rule) {
    throw new Error(`Unknown TerraForge capability rule: ${capabilityId}`);
  }

  const bodyText = observation.bodyText ?? '';
  const reasons = [];

  if (!observation.cardVisible) {
    return {
      id: capabilityId,
      label: rule.label,
      status: 'MISSING',
      reasons: ['Primary capability card is not visible on /forge.'],
    };
  }

  if (!observation.launchActionable) {
    return {
      id: capabilityId,
      label: rule.label,
      status: 'FAIL',
      reasons: ['Primary capability card is not launchable from /forge.'],
    };
  }

  if (
    observation.launchedModuleId &&
    Array.isArray(rule.expectedModuleIds) &&
    !rule.expectedModuleIds.includes(observation.launchedModuleId)
  ) {
    return {
      id: capabilityId,
      label: rule.label,
      status: 'WRONG SURFACE',
      reasons: [
        `Expected module ${rule.expectedModuleIds.join(' or ')}, observed ${observation.launchedModuleId}.`,
      ],
    };
  }

  if (
    observation.windowTitle &&
    Array.isArray(rule.expectedWindowTitles) &&
    !rule.expectedWindowTitles.some(pattern => pattern.test(observation.windowTitle))
  ) {
    return {
      id: capabilityId,
      label: rule.label,
      status: 'WRONG SURFACE',
      reasons: [`Unexpected window title "${observation.windowTitle}".`],
    };
  }

  if (hasTextMatch(bodyText, rule.failurePatterns)) {
    return {
      id: capabilityId,
      label: rule.label,
      status: 'FAIL',
      reasons: matchedPatterns(bodyText, rule.failurePatterns),
    };
  }

  if (hasTextMatch(bodyText, rule.wrongSurfacePatterns)) {
    return {
      id: capabilityId,
      label: rule.label,
      status: 'WRONG SURFACE',
      reasons: matchedPatterns(bodyText, rule.wrongSurfacePatterns),
    };
  }

  if (hasTextMatch(bodyText, rule.honestUnavailablePatterns)) {
    return {
      id: capabilityId,
      label: rule.label,
      status: 'HONEST UNAVAILABLE',
      reasons: matchedPatterns(bodyText, rule.honestUnavailablePatterns),
    };
  }

  const successSignals = countMatches(bodyText, rule.successPatterns);
  const requiredSignals =
    rule.successMode === 'all'
      ? rule.successPatterns?.length ?? 0
      : rule.minSuccessSignals ?? (rule.successPatterns?.length ? 1 : 0);

  if (requiredSignals > 0 && successSignals >= requiredSignals) {
    return {
      id: capabilityId,
      label: rule.label,
      status: 'PASS',
      reasons,
    };
  }

  if (hasTextMatch(bodyText, rule.shellOnlyPatterns)) {
    return {
      id: capabilityId,
      label: rule.label,
      status: 'SHELL ONLY',
      reasons: matchedPatterns(bodyText, rule.shellOnlyPatterns),
    };
  }

  if (hasTextMatch(bodyText, rule.partialPatterns)) {
    return {
      id: capabilityId,
      label: rule.label,
      status: 'PARTIAL',
      reasons: matchedPatterns(bodyText, rule.partialPatterns),
    };
  }

  return {
    id: capabilityId,
    label: rule.label,
    status: 'FAIL',
    reasons: ['No visible app-specific runtime success state was detected.'],
  };
}

export function evaluateTerraForgeProof({
  expectedReleaseSha,
  suiteBodyText,
  capabilityResults,
  supportCapabilities,
  workbenchCountedAsProof,
  pacsRuntimeTextFound,
}) {
  const blockers = [];
  const releaseIdentity = evaluateVisibleReleaseIdentity({
    bodyText: suiteBodyText,
    expectedReleaseSha,
  });

  if (releaseIdentity.status !== 'PASS') {
    blockers.push(releaseIdentity.reason);
  }

  const suiteTruthBlockers = matchedPatterns(suiteBodyText, FORGE_SUITE_BLOCKERS);
  blockers.push(...suiteTruthBlockers.map(source => `Suite posture blocker matched: /${source}/`));

  if (workbenchCountedAsProof) {
    blockers.push('Workbench parcel-scoped route appeared in TerraForge suite proof.');
  }

  if (pacsRuntimeTextFound) {
    blockers.push('PACS-facing runtime text found on /forge.');
  }

  const nonPassingCapabilities = capabilityResults.filter(result => result.status !== 'PASS');
  for (const capability of nonPassingCapabilities) {
    blockers.push(
      `${capability.label}: ${capability.status}${capability.reasons.length ? ` (${capability.reasons.join(' | ')})` : ''}`,
    );
  }

  return {
    status: blockers.length === 0 ? 'PASS' : 'FAIL',
    blockers,
    visibleReleaseSha: releaseIdentity.visibleSha,
    capabilityResults,
    supportCapabilities,
  };
}
