# WACO Canon local runtime boundary

This repair connects the existing TerraCanon conference UI to the existing Pilot
Canon handlers through an authenticated .NET host adapter. It does not expose the
development server's generic execution, filesystem, or Git endpoints.

The explicit conference frontend build uses `/api/pilot/canon/{action}` and the
existing `apiFetch` bearer-token boundary. Non-conference development transport
is unchanged. The API is disabled unless `CANON_CONFERENCE_ENABLED=1`; it permits
only `ping`, `corpus`, `doctor`, and `gatefast`, uses trusted claim-derived trace
identity, and sends a separately supplied internal host credential to fixed
`http://127.0.0.1:4317`. Redirects and system HTTP proxies are disabled. Missing
identity, malformed inputs, unavailable credentials/runtime, invalid/oversized
responses, and local capacity exhaustion fail closed.

Run `scripts/waco-conference/Dockerfile.canon-runtime` in the API container's
network namespace with no published port, read-only filesystem, all capabilities
dropped, and no-new-privileges. Its `TF_CANON_CONFERENCE_ONLY=1` guard rejects every
unlisted route before dispatch and requires the same internal host credential and
identity headers. No lab, external-drive, county source, or remote provider is
needed. The image contains only tracked local code and the corpus lock; it is not
a county-data package or a full development checkout.

The bounded conference check is real Canon `ping`, not a dry run: the existing
CLI invokes `explain_model_inputs` through ToolRunner and reports its actual
normalized result. Corpus status reads the packaged lock. The model-input
description is a tool self-check, not a county-data or valuation proof.

`doctor` and `gatefast` remain genuine repository diagnostics. A portable image
without a full Git checkout/development toolchain may report them unsuccessful;
that negative result must remain visible and must not be converted into a pass.
The passive Gate Runner registry is not execution evidence. The unsafe legacy
Git-status route and filesystem operations are not included in this slice.

Release acceptance must separately prove an authenticated real Monaco editor
journey and the live local Canon check on the final protected image identity.
Unit tests and an HTTP 200 alone do not prove those gates. WO-103 remains COMPLETE
on its historical physical-disconnect evidence; the final candidate verification
keeps OMEN online and isolates only product traffic. This document does not assert
`WACO_2026_TERRAFUSION_RELEASE_READY`.
