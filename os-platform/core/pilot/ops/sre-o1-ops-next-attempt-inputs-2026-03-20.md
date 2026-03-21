# SRE-O1-OPS Next Attempt Inputs

Date: 2026-03-20
Status: READY
Scope: Exact operator-supplied input bundle required before the next truthful `SRE-O1-OPS` closure attempt

## Purpose

This artifact narrows the remaining operator handoff to the smallest concrete input set.

It exists because the current blocker is no longer documentation shape or repo ambiguity.

The remaining blocker is missing operator-side access and release-binding inputs needed to execute the off-box pager/on-call drill without improvisation.

Use this artifact together with:

- `os-platform/core/pilot/ops/sre-o1-ops-closure-delta-2026-03-20.md`
- `os-platform/core/pilot/ops/cp17-sre-o1-ops-operator-checklist-2026-03-20.md`
- `os-platform/core/pilot/ops/sre-o1-pager-oncall-evidence-path-2026-03-20.md`

## Input Bundle Required Before Attempt Start

All items below must be known or available before the next attempt begins.

## 1. Azure Access Input

- Azure tenant identity for the intended Benton release lane
- Azure subscription identity authorized for `terrafusion-prod`
- one usable auth method:
  - interactive `az login` with the correct principal
  - or a valid `AZURE_CREDENTIALS` payload usable for the execution shell
- confirmation that `az account show` succeeds in the same shell that will run the drill

If this input is missing, the attempt is blocked at `azure-auth`.

## 2. AKS Access Input

- confirmed target cluster: `terrafusion-aks-prod`
- confirmed resource group: `terrafusion-prod`
- one usable cluster-access path:
  - permission to run `az aks get-credentials --resource-group terrafusion-prod --name terrafusion-aks-prod`
  - or a valid kubeconfig that already contains the target AKS context
- confirmation that the resulting current context is the target AKS context, not `docker-desktop`

If this input is missing, the attempt is blocked at `aks-context`.

## 3. Monitoring Surface Input

- exact target environment for the drill: `staging` or `production`
- matching namespace for that environment:
  - `monitoring` for staging
  - `production-monitoring` for production
- confirmation that the operator expects live Prometheus and Alertmanager on that namespace
- confirmation that the real critical receiver path is enabled for that environment

If this input is missing, the attempt is blocked at `namespace-reachability` or `receiver-proof`.

## 4. Benton Release Binding Input

- Benton lane identity for the drill
- release SHA, deployed-at stamp, or equivalent release identifier for the active runtime under test
- runtime identity for the same release window:
  - public host
  - environment name
  - any deployment stamp needed to tie the alert to the release lane

If this input is missing, the attempt cannot close truthfully even if alert routing works.

## 5. Incident Capture Input

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

1. Which Azure principal or credential payload will authenticate this shell?
2. Which subscription and tenant does that principal land in?
3. How will this shell obtain the `terrafusion-aks-prod` context?
4. Which environment is under test: `staging` or `production`?
5. What Benton release identifier binds the alert window to the current lane?
6. What real critical receiver path should produce the on-call receipt?
7. Which artifact path will store the sanitized outcome?

If any answer is missing, stop and collect the missing input first.

## Truthful Next Action

If all inputs above are available, proceed to the operator checklist and execute the off-box drill.

If any input is still missing, publish a new blocked-attempt receipt that names the exact missing item rather than broadening the failure description.