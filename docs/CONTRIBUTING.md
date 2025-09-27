# Contributing Guide

## Branching & PRs

- Feature branches: `feat/<area>-<short-desc>`
- Fix branches: `fix/<area>-<short-desc>`
- PRs must include: summary, screenshots (UI), test evidence, and risk notes.

## Coding Standards

- Frontend: React 18, MUI, Redux Toolkit, Vite. Lint with ESLint/Prettier.
- Backend: .NET 8, C#. Follow analyzers and warnings-as-errors where enabled.
- Scripts: Prefer `scripts/` with OS-specific subfolders.

## Tests

- Use the production-grade suite, not mock-only runners.
- Quick start:
  - All tests: `./testing/scripts/run-all-tests.sh`
  - Category: `./testing/scripts/run-category-tests.sh <category>`
- CI runs under `.github/workflows/`.

## Commit Hygiene

- Small, focused commits; descriptive messages.
- Update `CHANGELOG.md` (Unreleased) for user-facing changes.

## County Isolation

- Never introduce cross-county coupling in Sovereign mode.
- Validate Benton County Harris PACS integration paths when touching ingestion.
