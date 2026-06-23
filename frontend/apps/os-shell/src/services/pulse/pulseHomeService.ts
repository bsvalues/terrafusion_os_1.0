/**
 * TerraFusion OS — Pulse Home Read Layer (MVP)
 * ═══════════════════════════════════════════════════════════════
 *
 * Unavailable-safe adapter that assembles a {@link PulseHomeSnapshot} for the
 * future live "County Nerve Center" Home. It is the bridge from the typed
 * PulseHome contract to real, governed data — WITHOUT inventing any.
 *
 * MVP posture (honest by default):
 * - No governed Pulse endpoints are wired yet, so the DEFAULT readers return
 *   {@link pulseUnavailable} with an explicit reason for every region. Out of
 *   the box this adapter fabricates nothing — it reports gaps.
 * - Readers are dependency-injected. Real region readers (TerraForge ratio
 *   study, TerraDais queues, TerraTrace audit, notice/certification services)
 *   can be supplied later, one region at a time, enabling true PARTIAL
 *   availability: live-with-source where a source exists, explicit gap elsewhere.
 * - A reader that throws is mapped to `unavailable` (never a crash, never a
 *   fabricated value).
 * - Renders nothing. This is a service module only.
 *
 * Note on `loading`: the contract supports a `loading` read for the UI tier
 * (a future `usePulseHome` hook surfaces it while this promise is in flight).
 * The resolved snapshot regions are always `live` or `unavailable`.
 *
 * @see contracts/pulseHome.ts
 * @see docs/contracts/pulse-home-contract.md
 */

import {
  pulseUnavailable,
  type PulseActivityEvent,
  type PulseCountyRef,
  type PulseEvidenceSummary,
  type PulseHomeBrief,
  type PulseHomeSnapshot,
  type PulseRead,
} from '../../contracts/pulseHome';

// ============================================================================
// Reader contracts
// ============================================================================

/** Scope handed to every region reader. */
export interface PulseReaderContext {
  county: PulseCountyRef;
}

/**
 * Region readers. Each resolves to its region's read. A reader MUST return
 * `pulseUnavailable(...)` (or a live read with a source) — it must never
 * synthesize counts. Rejections are caught and mapped to `unavailable`.
 */
export interface PulseHomeReaders {
  readBrief: (ctx: PulseReaderContext) => Promise<PulseRead<PulseHomeBrief>>;
  readActivity: (ctx: PulseReaderContext) => Promise<PulseRead<PulseActivityEvent[]>>;
  readEvidence: (ctx: PulseReaderContext) => Promise<PulseRead<PulseEvidenceSummary>>;
}

/** Options for {@link getPulseHomeSnapshot}. */
export interface PulseHomeSnapshotOptions {
  /** Display label for the county. Defaults to the countyId (no fabrication). */
  label?: string;
  /** Override one or more region readers (defaults report gaps). */
  readers?: Partial<PulseHomeReaders>;
}

// ============================================================================
// Default readers — honest gaps until governed sources are wired
// ============================================================================

const NO_BRIEF_SOURCE =
  'No governed morning-brief source is wired yet. Pulse brief is unavailable rather than fabricated.';
const NO_ACTIVITY_SOURCE =
  'No governed activity feed is wired yet. Overnight activity is unavailable rather than fabricated.';
const NO_EVIDENCE_SOURCE =
  'No governed evidence source is wired yet. Evidence summary is unavailable rather than fabricated.';

/**
 * The default reader set. Every region is an explicit gap. This is the honest
 * current state of the platform: the contract exists, the live sources do not.
 */
export const DEFAULT_PULSE_HOME_READERS: PulseHomeReaders = {
  readBrief: async () => pulseUnavailable(NO_BRIEF_SOURCE),
  readActivity: async () => pulseUnavailable(NO_ACTIVITY_SOURCE),
  readEvidence: async () => pulseUnavailable(NO_EVIDENCE_SOURCE),
};

// ============================================================================
// Adapter
// ============================================================================

/** Run one region reader, mapping any rejection to an explicit gap. */
async function readRegion<T>(
  label: string,
  reader: (ctx: PulseReaderContext) => Promise<PulseRead<T>>,
  ctx: PulseReaderContext
): Promise<PulseRead<T>> {
  try {
    return await reader(ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return pulseUnavailable(`${label} read failed: ${message}`);
  }
}

/**
 * Assemble a {@link PulseHomeSnapshot} for a county + roll year.
 *
 * Each region is read independently and resolves to `live` (with a source) or
 * `unavailable` (with a reason). With no readers supplied, every region is an
 * explicit gap — nothing is fabricated.
 *
 * @param countyId  County scope, e.g. "benton".
 * @param rollYear  Assessment roll year, e.g. 2026.
 * @param options   Optional display label and region reader overrides.
 */
export async function getPulseHomeSnapshot(
  countyId: string,
  rollYear: number,
  options: PulseHomeSnapshotOptions = {}
): Promise<PulseHomeSnapshot> {
  const county: PulseCountyRef = {
    countyId,
    label: options.label ?? countyId,
    rollYear,
  };
  const readers: PulseHomeReaders = { ...DEFAULT_PULSE_HOME_READERS, ...options.readers };
  const ctx: PulseReaderContext = { county };

  const [brief, activity, evidence] = await Promise.all([
    readRegion('brief', readers.readBrief, ctx),
    readRegion('activity', readers.readActivity, ctx),
    readRegion('evidence', readers.readEvidence, ctx),
  ]);

  return { county, brief, activity, evidence };
}
