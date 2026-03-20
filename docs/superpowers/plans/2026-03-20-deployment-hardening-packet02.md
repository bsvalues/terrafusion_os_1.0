# Deployment Hardening Packet 02 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the deployment truth gate into CI, add Helm lint validation to the governance gate, and extend release-lane smoke coverage — making the sealed post-roadmap baseline provably shippable.

**Architecture:** Three independent work streams executing in parallel. Each stream touches a different file surface (CI workflow, Helm CI, release lane) and produces a self-contained, green-tested commit. A final integration step verifies all three changes pass the seal gate together.

**Tech Stack:** GitHub Actions (YAML), Node.js (node --test), Bash, Helm v4, Docker Compose

---

## Parallel Execution Map

```
Stream A (CI wiring)     Stream B (Helm lint CI)    Stream C (Release smoke)
      |                        |                            |
      v                        v                            v
seal-gate-fast.yml      kubernetes-infra-ci.yml     release-lane.yml
+ deployment-truth-gate   + helm lint Linux fix       + route contract probe
      |                        |                            |
      └──────────── Integration commit ───────────────────┘
```

Streams A, B, C are independent. Dispatch as parallel subagents. Integration runs after all three complete.

---

## File Map

| File | Action | Stream |
|------|--------|--------|
| `.github/workflows/seal-gate-fast.yml` | Add deployment truth gate step to Governance Fast Gate job | A |
| `.github/workflows/kubernetes-infrastructure-ci.yml` | Add helm lint step that runs on Ubuntu (not Windows) | B |
| `.github/workflows/release-lane.yml` | Add shell route contract smoke step post-health-check | C |
| `tests/deployment-truth-gate.test.mjs` | No changes needed — 63 specs already green | — |

---

## Stream A — Wire Deployment Truth Gate into Seal Gate

**Files:**
- Modify: `.github/workflows/seal-gate-fast.yml` (Governance Fast Gate job, after line 553)

### Task A1: Add deployment truth gate step

- [ ] **Step A1.1: Read the governance gate job context**

  Confirm insertion point after the `workflow-inventory-snapshot` step (around line 560) and before the repo shape guard. The step runs `node --test tests/deployment-truth-gate.test.mjs`.

- [ ] **Step A1.2: Add the step**

  Insert after the `workflow-inventory-snapshot` step:

  ```yaml
      - name: Deployment truth gate (63 specs)
        id: deployment-truth-gate
        shell: bash
        run: node --test tests/deployment-truth-gate.test.mjs
        continue-on-error: true
  ```

  And add it to the escape hatch condition:

  Find the `Governance test escape hatch` step condition. It currently reads:
  ```
  if: steps.quarantine-tests.outcome == 'failure' || steps.phase83-tests.outcome == 'failure' || ...
  ```

  Add `|| steps.deployment-truth-gate.outcome == 'failure'` to the condition.

- [ ] **Step A1.3: Verify the YAML is valid**

  Run:
  ```bash
  python3 -c "import yaml; yaml.safe_load(open('.github/workflows/seal-gate-fast.yml'))" && echo "VALID"
  ```
  Expected: `VALID`

- [ ] **Step A1.4: Run the truth gate locally to confirm it still passes**

  ```bash
  node --test tests/deployment-truth-gate.test.mjs
  ```
  Expected: `63 pass, 0 fail`

- [ ] **Step A1.5: Commit**

  ```bash
  git add .github/workflows/seal-gate-fast.yml
  git commit -m "ci(gate): wire deployment truth gate into governance fast gate

  Adds node --test tests/deployment-truth-gate.test.mjs as a governance
  gate step in seal-gate-fast.yml. Currently non-blocking (continue-on-error)
  consistent with other governance tests. 63 specs cover env contract,
  Docker structure, Helm charts, CI coverage, shell route contract."
  ```

---

## Stream B — Helm Lint in CI (Linux)

**Files:**
- Modify: `.github/workflows/kubernetes-infrastructure-ci.yml` (add helm lint job)

### Task B1: Add Helm lint step for CI

**Context:** Helm lint fails on Windows due to path resolution bug in Helm v4. CI runs on Ubuntu — this works correctly. We document the Windows workaround and wire the CI step.

- [ ] **Step B1.1: Read the kubernetes-infrastructure-ci.yml file**

  Find the existing `helm lint` section (Stage 1: Lint & Format). Understand whether it already runs `helm lint` on the four service charts.

  ```bash
  grep -n "helm lint\|helm template\|helm dependency" .github/workflows/kubernetes-infrastructure-ci.yml | head -30
  ```

- [ ] **Step B1.2: Add or verify helm lint step for all four service charts**

  If the existing step already lints all four charts, move on. If it only lints the platform umbrella, add:

  ```yaml
      - name: Helm lint — all service charts
        shell: bash
        run: |
          set -euo pipefail
          for chart in backend/helm/terrafusion-api backend/helm/terrafusion-consciousness backend/helm/terrafusion-gateway backend/helm/terrafusion-operations; do
            echo "Linting $chart..."
            helm lint "$chart" --strict
          done
          echo "All service charts lint clean"
  ```

- [ ] **Step B1.3: Add a comment to the repo documenting the Windows path bug**

  Add to `.github/KNOWN_ISSUES.md` (create if missing):

  ```markdown
  ## Helm v4 + Windows: Chart.yaml not found from deep repo paths

  **Symptom:** `helm lint backend/helm/<chart>/` reports "Chart.yaml file is missing"
  even when the file exists.

  **Root cause:** Helm v4's Go runtime resolves paths via `GetFileAttributesEx`
  which conflicts with Git Bash UNIX-style path translation at deep directory depths.

  **Workaround (local dev):** Copy chart to a shallow temp path before linting:
  ```bash
  cp -rL backend/helm/terrafusion-api C:/tmp/tf-api && helm lint C:/tmp/tf-api
  ```

  **CI:** Not affected — CI runs on Ubuntu where paths resolve correctly.
  ```

- [ ] **Step B1.4: Verify YAML validity**

  ```bash
  python3 -c "import yaml; yaml.safe_load(open('.github/workflows/kubernetes-infrastructure-ci.yml'))" && echo "VALID"
  ```
  Expected: `VALID`

- [ ] **Step B1.5: Commit**

  ```bash
  git add .github/workflows/kubernetes-infrastructure-ci.yml .github/KNOWN_ISSUES.md
  git commit -m "ci(helm): verify helm lint runs on all service charts in CI

  Adds explicit helm lint step for all four service charts in
  kubernetes-infrastructure-ci.yml. Documents Windows Helm v4 path
  resolution bug in KNOWN_ISSUES.md with workaround."
  ```

---

## Stream C — Release Smoke Extension

**Files:**
- Modify: `.github/workflows/release-lane.yml` (after "Verify public health and release header" step)

### Task C1: Add shell route contract smoke probe

**Context:** release-lane.yml already verifies `/health` returns 200 and the `X-Release-Sha` header matches. We need to add a probe that verifies the shell route contract — that `/` (OS shell root) and at least one suite route respond without 5xx.

- [ ] **Step C1.1: Read the existing health verification step**

  ```bash
  sed -n '303,365p' .github/workflows/release-lane.yml
  ```

  Understand the existing `curl` pattern and the VPS host variable used.

- [ ] **Step C1.2: Add shell route smoke probes after the health header verification**

  Insert a new step after "Verify public health and release header":

  ```yaml
      - name: Shell route contract smoke
        shell: bash
        env:
          HOST: ${{ steps.preflight-dns.outputs.host || inputs.target_env == 'production' && 'api.terrafusionmarket.com' || 'staging.terrafusionmarket.com' }}
        run: |
          set -euo pipefail
          echo "=== Shell route smoke ==="

          probe() {
            local path="$1"
            local status
            status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${HOST}${path}" || echo "000")
            if [[ "$status" =~ ^[25] ]]; then
              echo "✅ $path → $status"
            else
              echo "::error::Shell route smoke failed: $path → $status (expected 2xx/3xx)"
              exit 1
            fi
          }

          probe "/"
          probe "/property"
          echo "Shell route contract intact"
  ```

- [ ] **Step C1.3: Verify YAML validity**

  ```bash
  python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release-lane.yml'))" && echo "VALID"
  ```
  Expected: `VALID`

- [ ] **Step C1.4: Commit**

  ```bash
  git add .github/workflows/release-lane.yml
  git commit -m "ci(release): add shell route contract smoke to release-lane

  After health header verification, probes / and /property to confirm
  the OS shell root and property search route respond without 5xx.
  Uses the same HOST derivation pattern as the existing health check."
  ```

---

## Integration — Final Gate Verification

Run after all three streams complete. Verifies the working tree is clean and the truth gate still passes.

### Task D1: Integration verification

- [ ] **Step D1.1: Confirm working tree is clean**

  ```bash
  git status -s
  ```
  Expected: no output (clean tree)

- [ ] **Step D1.2: Run deployment truth gate**

  ```bash
  node --test tests/deployment-truth-gate.test.mjs
  ```
  Expected: 63 pass, 0 fail

- [ ] **Step D1.3: Validate all three modified workflows are valid YAML**

  ```bash
  for f in .github/workflows/seal-gate-fast.yml .github/workflows/kubernetes-infrastructure-ci.yml .github/workflows/release-lane.yml; do
    python3 -c "import yaml; yaml.safe_load(open('$f'))" && echo "✅ $f" || echo "❌ $f"
  done
  ```
  Expected: all three print ✅

- [ ] **Step D1.4: Log completion**

  ```bash
  git log --oneline -5
  ```
  Should show the three stream commits + this session's prior work.

---

## Success Criteria (Packet 02 Complete)

All five must be true:

1. `node --test tests/deployment-truth-gate.test.mjs` → 63/63 pass ✅
2. `seal-gate-fast.yml` includes `deployment-truth-gate` step ✅
3. `kubernetes-infrastructure-ci.yml` lints all four Helm service charts ✅
4. `release-lane.yml` probes shell routes post-deploy ✅
5. Working tree clean, no type errors ✅

---

## Scope Boundary

**In scope:**
- `.github/workflows/seal-gate-fast.yml`
- `.github/workflows/kubernetes-infrastructure-ci.yml`
- `.github/workflows/release-lane.yml`
- `.github/KNOWN_ISSUES.md` (new, documentation only)

**Out of scope:**
- New product features
- Phase 12 definition
- Visual design changes
- Backend service changes
- New Helm templates (NetworkPolicy gap is documented, deferred)
