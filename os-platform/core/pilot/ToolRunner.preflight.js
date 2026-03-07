"use strict";
/**
 * Phase 48A: ToolRunner Preflight (Additive)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPreflight = createPreflight;
const commandGovernance_js_1 = require("../types/commandGovernance.js");
function createPreflight(policy) {
    const p = policy ?? (() => ({ allow: true }));
    return Object.freeze({
        decide(req) {
            try {
                return (0, commandGovernance_js_1.normalizeDecision)(p(req));
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : 'Policy exception';
                return { allow: false, reason: msg || 'Policy exception', visibility: 'restricted' };
            }
        },
    });
}
