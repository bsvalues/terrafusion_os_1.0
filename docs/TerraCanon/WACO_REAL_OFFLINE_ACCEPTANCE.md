# WACO Lane B real offline acceptance

This is the terminal acceptance contract for WO-103. The mock/nginx scaffold in
PR #1555 is preparation evidence only and cannot satisfy this contract.

## Preconditions

Run the acceptance on **OMEN**, the portable WACO conference appliance. HERMES
remains the lab/runtime anchor and must not be a runtime dependency for the
conference product; DAEDALUS/P620 remains a heavy-compute lab node and is not
the travel-machine target.

The OMEN acceptance target must have:

1. the actual TerraFusion Shell and Counties HUB deployed;
2. a governed county package containing real county sales data;
3. TerraForge and SalesForge available through the real product route;
4. all optional external providers disabled or unavailable; and
5. the machine physically disconnected from the network before the first run.

The payload is assembled from the HERMES Lab fabric, not recovered from an
OMEN-attached external drive. HERMES supplies build/runtime artifacts; the
authoritative Benton county source is the lab's ATLAS `/forge` estate. The
portable payload must be a bounded, manifest-digested conference subset staged
onto OMEN internal storage. Its manifest must contain no external-drive
letters, HERMES or ATLAS network paths, lab-only mounts, or runtime dependency
on any lab node. A lab image or database volume without current commit,
package-provenance, and county-data evidence is not a conference payload.

The runner requires an explicit `--offline-confirmed` attestation and enforces
that `--base-url` is `127.0.0.1`, `localhost`, or `[::1]`. It also fails on any
non-loopback request, any mutation method, synthetic/reference package marker,
missing real county sales shard, or unavailable SalesForge state. The runner
does not manufacture county data and does not treat a repository fixture as
real evidence.

## Execute

From the repository root on the conference machine:

```text
node scripts/waco-conference/real-offline-acceptance.mjs \
  --base-url http://127.0.0.1:5173 \
  --county "Kitsap" \
  --sales-sentinel "<known real sale identifier>" \
  --offline-confirmed \
  --journey-id 1
```

Each invocation proves one fresh browser-context journey:

```text
Shell -> Counties HUB -> governed county -> TerraForge -> SalesForge
```

The runner intentionally does **not** call a fresh browser context a cold
start, reset, runtime restart, or package reload. No supported TerraFusion
restart mechanism was found in this bounded slice, so the runtime boundary is
owned by the target-machine supervisor.

To prove the two-journey acceptance, run the command once, then use the
existing supported conference supervisor mechanism to stop/reset/restart the
real TerraFusion stack and reload the governed county package. Run the command
again with `--journey-id 2`. Only when both invocations pass, with that actual
runtime boundary between them, may the evidence be labelled:

```text
REAL_OFFLINE_TWO_FRESH_CONTEXT_JOURNEYS_PASS
```

That label is not emitted by this runner and must not be recorded without the
external runtime restart/reset evidence.

`--sales-sentinel` must be a value known from the governed conference package,
not from `frontend/apps/os-shell/src/lib/washingtonAssessorReferencePackage.json`.

## Evidence boundary

Only two passing invocations on the target machine, with the machine
physically disconnected and an actual supported runtime restart/reset boundary
between them, can advance WO-103 toward terminal acceptance. A local pass with
the repository-reference package, an nginx mock, a hosted public-data fallback,
a network-connected machine, or two browser contexts without a runtime reset
is not terminal evidence.

The terminal evidence label for this deployment is:

```text
OMEN_WACO_REAL_OFFLINE_TWO_RUN_ACCEPTANCE_PASS
```

It may only be recorded after the two OMEN invocations and the external
runtime restart/reset evidence above are complete. This document records the
deployment assignment; it does not claim that OMEN is currently provisioned or
that WO-103 is complete.
