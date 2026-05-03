// DAIS refresh cadences. Swarm now uses governed HTTP polling instead of the
// retired consciousness SignalR hub contract.
export const DAIS_REFRESH = {
  appealsQueueMs:       45_000,
  appealsStaleAfterMs:  90_000,
  assessmentSourceStatusMs:      60_000,
  assessmentSourceStaleAfterMs: 180_000,
  workloadMs:          120_000,
  workloadStaleAfterMs: 300_000,
  swarmMs:              30_000,
  swarmStaleAfterMs:    45_000,
} as const
