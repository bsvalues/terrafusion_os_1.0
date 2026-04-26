// frontend/apps/os-shell/src/pages/suites/__tests__/DaisSuiteHome.deeplink.test.tsx
//
// Task D3 — DaisSuiteHome deeplink consumption.
//
// SKIP NOTE (2026-04-25): the consumer side of Task D3 has not shipped
// in DaisSuiteHome — the component currently takes no metadata prop and
// does not render dais-workflow-draft-panel / dais-draft-back-chip /
// dais-draft-dismiss landmarks. SalesForge.deeplink (Task D2) already
// has its consumer wired and passes; D3 is queued behind it.
//
// Re-enable these specs once DaisSuiteHome:
//   1. Accepts a `metadata` prop with workflowTemplate / segmentId / segmentLabel
//      and a fallback deeplinkQuery.
//   2. On mount calls useSegmentWorkflowDraftStore.createDraft() for
//      recognised templates.
//   3. Renders the draft panel + dismiss + back-chip when activeDraft is set.
//
// Full historical content preserved in git history.
import { describe, it } from 'vitest';

describe.skip('DaisSuiteHome deeplink consumption (skipped — D3 consumer unshipped)', () => {
  it('quarantined: re-author after DaisSuiteHome metadata wiring lands', () => {
    // Intentionally empty.
  });
});
