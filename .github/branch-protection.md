Branch protection: making the `rust-verify` job required

This repository provides a PR-safe `rust-verify` workflow (file: `.github/workflows/rust-verify.yml`) which performs per-crate cargo metadata checks, builds, and a lightweight smoke test.

Notes before making the job required
- The workflow runs a matrix (stable, nightly). Requiring the job means you should require both matrix runs (they appear as separate checks).
- Make the job required only after you're satisfied the checks are stable for your team. Requiring experimental checks can block PRs.

Steps (UI) to require the job on `main` or your protected branch
1. Go to the repository on GitHub and click Settings → Branches → Branch protection rules.
2. Edit the rule for the branch you want to protect (e.g., `main`) or create a new rule.
3. Under "Require status checks to pass before merging" enable the checkbox.
4. In the list of available checks, search for entries named like:
   - `rust-verify (toolchain: stable)`
   - `rust-verify (toolchain: nightly)`
   (These appear after a workflow run has completed at least once. If you don't see them yet, run the workflow manually once.)
5. Select the checks you want to require and save the rule.

Alternative: require the workflow via the Checks API or use a single non-matrix job
- If you prefer to require a single check, modify the workflow to only run one toolchain (stable) or use a separate workflow that aggregates results into a single check name.

Rollback steps
- If the check later causes blocking, an admin can either disable the rule or un-check the required checks and save.

If you want, I can:
- Add a separate non-matrix `rust-verify:stable` workflow that only runs stable and expose a single required check.
- Or keep the matrix and recommend requiring only the stable run for now.
