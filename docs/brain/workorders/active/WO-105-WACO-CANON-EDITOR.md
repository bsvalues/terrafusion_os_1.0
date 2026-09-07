# WO-105 child: WACO TerraCanon editor correctness

Authority source: William's direct instructions in the active WACO execution
task, recorded on 2026-09-07. The owner explicitly authorized "Fully authorized
for all tasks and needs for all TerraFusion work" and then directed the
"TerraCanon product gate — fix the real routing/editor defects and prove the
actual conference TerraCanon journey works." This is a bounded implementation
of that owner grant, not authority inferred from a commit message.

This child reserves only the existing editor, its regression test, and this
record. The separately reserved Canon runtime transport, Benton consumer,
deployment and assurance lanes remain independent. Coordinator owns protected
delivery; independent assurance is Kepler. Owner authorization is already
granted and does not require another owner approval.

Observed defect: opening README in the deployed TerraCanon editor threw while
reading the nonexistent Monaco languages.CodeActionKind. Preserve Monaco's
string CodeAction.kind contract instead. The regression invokes the real
component mount callback with only external Monaco/worker boundaries doubled.
Its Node URL alias also preserves source loading under the repository's jsdom
Vitest configuration, without changing product behavior or CI configuration.

This child does not grant production mutation, county-data activation, broad
shell changes, Wi-Fi/network control, Docker repair, or statewide completion.
WO-103 remains COMPLETE. Source delivery is not deployed release certification.
Final WACO readiness still requires the exact new protected candidate on OMEN,
actual TerraCanon/Benton product proof and integrated two-journey assurance.

```json
{
  "id": "WO-105-WACO-CANON-EDITOR",
  "task": "Repair and verify the actual WACO TerraCanon editor mount",
  "risk": "R2",
  "suite": "OS",
  "allowed_files": [
    "frontend/apps/os-shell/src/canon/CanonEditor.tsx",
    "frontend/apps/os-shell/src/canon/CanonEditor.mount.test.mjs",
    "docs/brain/workorders/active/WO-105-WACO-CANON-EDITOR.md"
  ],
  "forbidden_patterns": [".github/**", "backend/**", "config/counties/**", "**/ARCHIVE/**"],
  "required_proof": ["actual component mount regression in Node and repository jsdom", "core typecheck", "Phase83", "independent assurance", "protected PR checks", "final deployed Monaco journey"]
}
```
