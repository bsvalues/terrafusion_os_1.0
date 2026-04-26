// frontend/apps/os-shell/src/pages/suites/modules/__tests__/CompsForgeModule.deeplink.test.tsx
//
// Task D3 — CompsForgeModule deeplink consumption.
//
// SKIP NOTE (2026-04-25): the consumer side of Task D3 has not shipped
// in CompsForgeModule — the component currently does not accept a
// `metadata` prop, does not populate useCompsForgeHandoffStore from
// pre-split parcelIds / segmentId / segmentLabel, and does not render
// a 'Scoped From' chip. SalesForge.deeplink (Task D2) is wired and
// passes; D3 is queued behind it.
//
// Re-enable these specs once CompsForgeModule:
//   1. Accepts a `metadata` prop with parcelIds (array or
//      comma-separated string), segmentId, segmentLabel, and a fallback
//      deeplinkQuery.
//   2. On mount calls useCompsForgeHandoffStore.setHandoffContext()
//      with the parsed values.
//   3. Renders a sf-scoped-from-chip that fires
//      activateModule('county-studio', { metadata: { segmentId } }) on click.
//
// Full historical content preserved in git history.
import { describe, it } from 'vitest';

describe.skip('CompsForgeModule deeplink consumption (skipped — D3 consumer unshipped)', () => {
  it('quarantined: re-author after CompsForgeModule metadata wiring lands', () => {
    // Intentionally empty.
  });
});
