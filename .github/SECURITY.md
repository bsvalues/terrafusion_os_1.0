# Security Policy

## Reporting a Vulnerability

Do not open a normal issue for a live vulnerability or exposed credential.

Report sensitive issues privately:

- Email: `security@bsvalues.com`

If the report involves a possibly exposed credential:

1. rotate the credential first if you control it
2. do not paste the live value into GitHub
3. describe impact, scope, and where the credential was observed

## What to Include

- affected component or workflow
- exact impact
- safe reproduction steps
- commit SHA, workflow run ID, URL, or file path if relevant
- whether secrets, customer data, or deploy access might be affected
- what has already been rotated or contained

## Non-Sensitive Security Tracking

Use the `security_report.yml` issue template only for:

- hardening follow-up work
- non-sensitive design issues
- post-rotation cleanup tasks
- policy/documentation improvements

Do not use the issue tracker for live secrets, private keys, or exploit details
that increase immediate risk.

## Repository-Specific Notes

- This repository is private.
- GitHub Discussions and Wiki are disabled.
- Secrets belong in GitHub environment secrets, VPS-local env files, or a secure
  vault, not in tracked files.
- Deployment and exposure-remediation state is tracked in
  [hostinger-control-plane.md](../os-platform/core/pilot/ops/hostinger-control-plane.md).

## Response Expectations

Target internal handling:

- acknowledgment within 1 business day
- triage and containment plan as soon as practical
- documented rotation/remediation steps for confirmed exposure

If you are unsure whether something is sensitive, treat it as sensitive first.
