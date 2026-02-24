/**
 * Phase 48: Governed Command Gate (Core)
 *
 * Any mutating command requires explicit allow from a policy check.
 * Deny returns a reason string. Never throws; exceptions become deny(reason).
 *
 * @module canon/commandGate
 * @see Phase 48: TerraCanon Core Contracts
 */

/**
 * @typedef {{ id: string; mutates: boolean; meta?: Readonly<Record<string, string | number | boolean>> }} CommandRequest
 * @typedef {Readonly<{ allow: true }> | Readonly<{ allow: false; reason: string }>} CommandDecision
 * @typedef {(req: CommandRequest) => CommandDecision} PolicyCheck
 */

/**
 * Create a governed command gate from a policy check function.
 *
 * The gate wraps the policy in a fail-safe envelope:
 * - Invalid decision shape → deny("Policy returned invalid decision")
 * - Exception in policy → deny(error.message || "Policy exception")
 * - Empty reason string → deny("Policy denied")
 *
 * @param {PolicyCheck} check
 * @returns {Readonly<{ decide: (req: CommandRequest) => CommandDecision, run: <T>(req: CommandRequest, thunk: () => T) => Readonly<{ decision: CommandDecision, value?: T }> }>}
 */
export function createCommandGate(check) {
  return Object.freeze({
    /**
     * Evaluate policy for a command request.
     * @param {CommandRequest} req
     * @returns {CommandDecision}
     */
    decide(req) {
      try {
        const d = check(req);
        if (d && typeof d === 'object' && 'allow' in d) {
          if (d.allow === true) return { allow: true };
          const reason = /** @type {{ allow: false; reason?: unknown }} */ (d).reason;
          return {
            allow: false,
            reason: typeof reason === 'string' && reason.length > 0 ? reason : 'Policy denied',
          };
        }
        return { allow: false, reason: 'Policy returned invalid decision' };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Policy exception';
        return { allow: false, reason: msg || 'Policy exception' };
      }
    },

    /**
     * Execute a command thunk under policy.
     * - If denied, returns denied decision and does not call thunk.
     * - If allowed, calls thunk and returns allow + value.
     *
     * @template T
     * @param {CommandRequest} req
     * @param {() => T} thunk
     * @returns {Readonly<{ decision: CommandDecision, value?: T }>}
     */
    run(req, thunk) {
      const decision = this.decide(req);
      if (!decision.allow) return { decision };
      return { decision, value: thunk() };
    },
  });
}
