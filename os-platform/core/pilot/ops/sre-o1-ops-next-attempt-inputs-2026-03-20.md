# SRE-O1-OPS Next Attempt Inputs

Date: 2026-03-21
Status: REVISED
Scope: Exact operator-supplied input bundle required before the next truthful `SRE-O1-OPS` closure attempt

## Purpose

This artifact narrows the remaining operator handoff to the smallest concrete input set.

It exists because the current blocker is no longer documentation shape or repo ambiguity.

The remaining blocker is missing operator-side execution-surface, access, and release-binding inputs needed to execute the pager/on-call drill without improvisation.

Use this artifact together with:

- `os-platform/core/pilot/ops/sre-o1-ops-closure-delta-2026-03-20.md`
- `os-platform/core/pilot/ops/cp17-sre-o1-ops-operator-checklist-2026-03-20.md`
- `os-platform/core/pilot/ops/sre-o1-pager-oncall-evidence-path-2026-03-20.md`

## Input Bundle Required Before Attempt Start

All items below must be known or available before the next attempt begins.

## 1. Execution Surface Input

- concrete identity of the claimed pager-capable surface for the Benton release lane
- confirmation that the surface is live now, not historical or hypothetical
- confirmation that the surface is bound to the same Benton release lane as the Hostinger runtime under test
- direct operator access path for the same shell or workstation session that will run the drill

If this input is missing, the attempt is blocked at `surface-identity` or `surface-verification`.

Do not substitute Azure/AKS assumptions for this input. If Azure/AKS is claimed as the execution surface, proof that it is live for the Benton lane must be supplied before the attempt begins.

## 2. Monitoring And Receiver Input

- exact target environment for the drill: `staging` or `production`
- exact monitoring or alerting surface identity for that environment
- confirmation that the operator expects live alert evaluation and routing there
- confirmation that the real critical receiver path is enabled for that environment

If this input is missing, the attempt is blocked at `monitoring-reachability` or `receiver-proof`.

Monitoring namespaces, cluster names, or Grafana URLs are not valid defaults by themselves. They become usable only after the claimed surface is separately verified for this lane.

## 3. Benton Release Binding Input

- Benton lane identity for the drill
- release SHA, deployed-at stamp, or equivalent release identifier for the active runtime under test
- runtime identity for the same release window:
  - public host
  - environment name
  - any deployment stamp needed to tie the alert to the release lane

If this input is missing, the attempt cannot close truthfully even if alert routing works.

## 4. Incident Capture Input

- sanitized identifier shape for the real on-call receipt
- operator acknowledgement path for the same incident window
- confirmation of where the sanitized proof artifact will be published under `os-platform/core/pilot/ops/**`
- preferred successful-drill template:
  - `os-platform/core/pilot/ops/sre-o1-ops-verification-template.md`
- preferred blocked-attempt template:
  - `os-platform/core/pilot/ops/sre-o1-ops-blocked-attempt-template.md`

If this input is missing, the drill may execute but the evidence bundle will still be incomplete.

## Minimal Ready Check

Do not begin the next attempt unless the operator can answer all of the following with concrete values:

1. What exact live execution surface will run the pager/on-call drill?
2. How has that surface been verified as real and currently deployed for this lane?
3. How will this shell or workstation reach that surface?
4. Which environment is under test: `staging` or `production`?
5. What Benton release identifier binds the alert window to the current lane?
6. What real critical receiver path should produce the on-call receipt?
7. Which artifact path will store the sanitized outcome?

If any answer is missing, stop and collect the missing input first.

Do not start with `az`, `az aks get-credentials`, `kubectl`, or namespace checks unless the execution-surface answers above have already established Azure/AKS as the verified lane.

## Truthful Next Action

If all inputs above are available, proceed to the operator checklist and execute the drill.

If any input is still missing, publish a new blocked-attempt receipt that names the exact missing item rather than broadening the failure description.