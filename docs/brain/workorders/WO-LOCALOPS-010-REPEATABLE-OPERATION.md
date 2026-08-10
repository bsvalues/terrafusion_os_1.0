# WO-LOCALOPS-010 — Repeatable LocalOps Operation

**Authorization:** `TERRAFUSION_STAGE5_CONTINUOUS_LOCALOPS_DELIVERY`
**Milestone:** `LOCALOPS_REPEATABLE_OPERATION`
**Risk:** R1, local read-only operational tooling

## Outcome

Replace routine manual SSH-tunnel choreography with one controlled TerraFusion command that owns the
complete start, health-check, LocalOps use, and cleanup lifecycle.

## Boundaries

- Forward only OMEN loopback to Hermes loopback Ollama through the existing `hermes` SSH alias.
- Require `llama3.2:3b` before inference and use the existing LocalOps/Ollama proof contract.
- Keep external calls, web, shell, and mutation disabled for the model.
- Refuse an already-owned local port; never kill or reuse an unknown listener.
- Fix the SSH alias, model, and synthetic prompt; reject inherited SSH forwarding directives and
  disable multiplexing, backgrounding, agent forwarding, and local commands.
- Propagate interruption into active inference while retaining signal handlers through cleanup.
- Treat health, inference, interruption, child-process, or listener cleanup failure as non-success.
- Do not change Hermes, Forge, Atlas, credentials, databases, migrations, or production state.

## Required proof

- Focused lifecycle tests cover success, missing model, provider failure, unexpected use failure,
  unowned-listener refusal, and cleanup failure.
- Existing Ollama proof and LocalOps regressions remain green.
- A live run through Hermes records positive inference plus exact listener release.
- A negative run proves refusal of an occupied port without touching its owner.
- Required core governance and generated-code gates pass at the reviewed PR head.
