# Work Order Next-Candidate Scoring

This packet defines the deterministic scoring policy for selecting the next Work Order (WO) from the registry. It does not execute work, query GitHub, mutate repository state, or override human authority gates.

## Purpose

The Work Order Engine needs a repeatable way to answer "what is next?" without turning the operator into a message bus. Scoring is advisory until a higher-level Goal + Loop packet authorizes execution.

The selector must:

- exclude candidates that violate authority boundaries before scoring;
- prefer dependency-cleared, evidence-backed, same-risk work;
- penalize active blockers and ambiguous state;
- produce explainable reasons for the recommendation;
- preserve deterministic tie-breaking.

## Inputs

Candidate scoring uses only registry and evidence fields defined by the Work Order data model:

- `riskClass`
- `status`
- `dependencies`
- `allowedSystems`
- `blockedSystems`
- `evidence`
- `validationGates`
- `derivedState.git`
- `derivedState.github`
- `stopConditions`
- `nextCandidates`

Live repository, GitHub, Azure, filesystem, or secret inspection belongs to future tools. This scoring packet only defines the rule contract.

## Hard Exclusions

A candidate is not eligible for scoring if any hard exclusion is true:

- dependency is not cleared;
- status is `complete`, `cancelled`, or `superseded`;
- risk class is above the current operator authority;
- candidate requires secrets, credentials, protected data, PACS, county SQL, production deployment, release, or destructive cleanup without explicit authorization;
- canonical evidence is missing for a prerequisite WO;
- active PR, branch, or worktree state is ambiguous and the WO is not explicitly a read-only audit;
- the next step would require runtime, CI, Docker, Kubernetes, or production expansion outside the current authorized chain.

Hard exclusions return `blocked`, not a low score.

## Weighted Factors

Eligible candidates are scored on a 100 point scale:

| Factor | Weight | Direction | Meaning |
| --- | ---: | --- | --- |
| Dependency readiness | 25 | higher is better | Required upstream WOs are complete or explicitly waived. |
| Risk/authority fit | 20 | higher is better | Candidate stays within current authorized risk class. |
| Evidence readiness | 15 | higher is better | Required evidence exists and is recent enough for execution. |
| Operational value | 15 | higher is better | Candidate closes an active lane, unlocks follow-up work, or reduces operator friction. |
| Scope size/reversibility | 10 | higher is better | Smaller, reversible changes outrank broad or hard-to-revert work. |
| Safety margin | 10 | higher is better | Candidate avoids protected systems and has clear stop gates. |
| Blocker pressure | 5 | higher is better | Fewer known blockers, review threads, auth walls, or unstable checks. |

Scores must be computed from normalized factor values in the range `0.0` to `1.0` multiplied by the factor weight.

## Decision Bands

| Score | Verdict | Meaning |
| ---: | --- | --- |
| 85.0-100.0 | `recommend` | Strong next WO if no hard exclusions apply. |
| 70.0-84.999 | `eligible` | Safe candidate, but not necessarily the best next step. |
| 50.0-69.999 | `defer` | Do not start automatically; needs stronger evidence or lower-risk alternatives first. |
| 0.0-49.999 | `weak` | Not useful enough to start unless explicitly chosen by the operator. |

Scores are evaluated as decimals without implicit rounding. Hard exclusions always produce `blocked` outside the numeric band table regardless of score.

## Tie-Breakers

If two candidates have the same score, apply tie-breakers in order:

1. Lower risk class wins.
2. Fewer unresolved blockers wins.
3. More recently completed dependency chain wins.
4. Candidate that closes the current active lane wins.
5. Lexicographically smaller WO ID wins.

Tie-breakers must be stable and must not use wall-clock randomness.

## Output Shape

A scoring result must include:

- candidate WO ID;
- verdict;
- score;
- factor breakdown;
- hard exclusions, if any;
- blockers;
- evidence references used;
- next recommended action.

The companion schema and rules files define the machine-readable contract used by future read-only query tooling.

## Non-Goals

This packet does not:

- create an execution engine;
- query PR status;
- merge PRs;
- open or mutate worktrees;
- migrate existing WO artifacts;
- change CI/CD behavior;
- change runtime code.
