# Quarantine Findings

**Method:** Explore scout (read-only) over `QUARANTINE/`. Completeness %, line counts, and
"renders X" claims below are **scout estimates — unverified**. Paths marked ✅ were independently
git-verified. Treat the rest as candidates to open before lifting.

## Academy scaffolds (✅ both paths git-verified earlier)
- `QUARANTINE/top-level-dirs/applications/terra-v0demo-production/components/ai-certification-academy.tsx`
- `QUARANTINE/top-level-dirs/applications/terra-assessor-production/TerraFusionAssessor/components/ai-certification-academy.tsx`

Scout: the two are functionally identical (~728 vs ~859 lines, formatting only); tabbed UI —
Training Courses / Certifications / Learning Paths / Instructors; deps `@mui/icons-material` + shadcn/ui.
**Verdict:** lift the **terra-v0demo-production** copy (cleaner). **Must open and confirm before lifting.**

## Other candidates (scout-claimed, UNVERIFIED — open before trusting)
| Demo need | Path | Scout completeness | Note |
|---|---|---|---|
| County Pulse | `…/terra-v0demo-production/components/county-assessor-dashboard.tsx` | ~80% | scout flags an async/await compile bug; verify |
| Atlas dossier (themed) | `…/applications/terra-dossier/src/components/TerraDossier.tsx` | ~65% | sci-fi themed; likely NOT conference-appropriate |
| Demo nav | `…/terra-v0demo-production/app/layout.tsx` | ~95% | Next.js layout; our app is Vite/react-router — not drop-in |
| Ask Academy scoring | `QUARANTINE/root-artifacts/Codex_369Framework.ts` | ~40% | numeric framework; not pedagogy |
| Component library | `…/terra-v0demo-production/components/` (30+ files) | mixed | shadcn-based; dependency/stack mismatch risk |

## ⚠️ Skeptical read (important)
The scout's headline — "you have 95% of a complete demo app, lift terra-v0demo-production wholesale" —
is **dependency-blind**. That app is **Next.js + shadcn/@mui**; our target (`os-shell`) is **Vite +
react-router + tf-* design tokens**. Wholesale lift would drag an incompatible stack and break the
UI token contract. Correct use: mine these for **content and layout ideas**, re-implement in the
os-shell idiom — not copy-paste.

## Actionable takeaway
- Academy: lift the **content/structure** of `ai-certification-academy.tsx`, re-skin to tf-* tokens.
- County Pulse: prefer the **already-in-main** `os-platform/.../CountyPulse.tsx` (same stack) over the
  quarantine `county-assessor-dashboard.tsx`.
- Do NOT wholesale-import any Next.js/shadcn app.
