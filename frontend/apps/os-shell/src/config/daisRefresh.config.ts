// No swarmIntervalMs — useSwarmLive is push-driven (SignalR), not polled.
// The no-hardcoded-interval rule applies to HTTP-polling hooks only.
export const DAIS_REFRESH = {
  appealsQueueMs:       45_000,
  appealsStaleAfterMs:  90_000,
  pacsStatusMs:         60_000,
  pacsStaleAfterMs:    180_000,
  workloadMs:          120_000,
  workloadStaleAfterMs: 300_000,
  swarmStaleAfterMs:    10_000,  // stale detection only — not a poll interval
} as const
