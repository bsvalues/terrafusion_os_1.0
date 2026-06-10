# Autonomy Incident Response Playbook

## Doctrine

Trust Proofs, not labels. Labels may route an incident review, but release promotion, rollback, and archive decisions must be based on verified evidence bundles, signed artifacts, and incident triage output.

## Verify

Before any incident artifact is trusted, verify the bundle and signature evidence:

```bash
pnpm perf:verify-bundle --zip autonomy-incident-bundle-<pr>-<run>.zip --strict
pnpm perf:verify-signature --artifact autonomy-incident-bundle-<pr>-<run>.zip --bundle autonomy-incident-bundle-<pr>-<run>.zip.bundle
```

If verification fails, stop the workflow, preserve the failed artifacts, and open an incident follow-up with the correlation ID and release tag.

## Rollback

Rollback is a source-controlled action. Prefer a non-destructive revert that preserves the evidence trail:

```bash
git revert <incident-causing-sha>
```

After rollback, rerun the affected governance gates and attach the new verification output to the incident record.

## Archive

Incident evidence must remain available for the incident retention tier. Incident releases and their verification packets are retained for 7-year minimum retention unless a longer legal hold applies.

## Checklist

- [ ] Confirm the incident release tag and PR number.
- [ ] Verify the incident bundle with `perf:verify-bundle --strict`.
- [ ] Verify signature triplets and expected identity pins.
- [ ] Confirm the rollback target SHA and rationale.
- [ ] Execute or document `git revert` if rollback is required.
- [ ] Attach verification output, rollback proof, and final disposition to the archive.
