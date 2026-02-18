// GENERATED - DO NOT EDIT
"use strict";
/**
 * Phase 48A: TerraCanon/TerraPilot Command Governance Types
 *
 * Additive, backwards-compatible governance metadata and preflight policy contract.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCommandGovernanceMeta = isCommandGovernanceMeta;
exports.normalizeDecision = normalizeDecision;
function isCommandGovernanceMeta(v) {
    if (typeof v !== 'object' || v === null || Array.isArray(v))
        return false;
    const o = v;
    const keys = Object.keys(o);
    if (keys.length !== 3)
        return false;
    if (!('intent' in o) || !('mutation' in o) || !('visibility' in o))
        return false;
    const intent = o.intent;
    const mutation = o.mutation;
    const visibility = o.visibility;
    const intentOk = intent === 'inspect' ||
        intent === 'explain' ||
        intent === 'plan' ||
        intent === 'simulate' ||
        intent === 'mutate' ||
        intent === 'execute';
    const mutationOk = mutation === 'none' || mutation === 'transient' || mutation === 'durable';
    const visibilityOk = visibility === 'public' || visibility === 'restricted' || visibility === 'secret';
    return intentOk && mutationOk && visibilityOk;
}
function normalizeDecision(d) {
    if (d.allow)
        return { allow: true };
    const reason = typeof d.reason === 'string' && d.reason.trim().length > 0
        ? d.reason.trim()
        : 'Policy denied';
    return {
        allow: false,
        reason,
        visibility: d.visibility ?? 'restricted',
    };
}
