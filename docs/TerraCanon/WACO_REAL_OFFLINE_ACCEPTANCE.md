# WACO Lane B real offline acceptance

This is the terminal acceptance contract for WO-103. The mock/nginx scaffold in
PR #1555 is preparation evidence only and cannot satisfy this contract.

## Preconditions

Run the acceptance on the target conference-machine shape with:

1. the actual TerraFusion Shell and Counties HUB deployed;
2. a governed county package containing real county sales data;
3. TerraForge and SalesForge available through the real product route;
4. all optional external providers disabled or unavailable; and
5. the machine physically disconnected from the network before the first run.

The runner requires an explicit `--offline-confirmed` attestation. It also
fails on any non-loopback request, any mutation method, synthetic/reference
package marker, missing real county sales shard, or unavailable SalesForge
state. The runner does not manufacture county data and does not treat a
repository fixture as real evidence.

## Execute

From the repository root on the conference machine:

```text
node scripts/waco-conference/real-offline-acceptance.mjs \
  --base-url http://127.0.0.1:5173 \
  --county "Kitsap" \
  --sales-sentinel "<known real sale identifier>" \
  --offline-confirmed \
  --runs 2
```

The runner creates a fresh browser context for every repetition. Each
repetition proves:

```text
cold start -> Shell -> Counties HUB -> governed county -> TerraForge -> SalesForge
close/reset -> fresh context -> repeat
```

`--sales-sentinel` must be a value known from the governed conference package,
not from `frontend/apps/os-shell/src/lib/washingtonAssessorReferencePackage.json`.

## Evidence boundary

Only a passing run on the target machine with the machine physically
disconnected can advance WO-103 toward terminal acceptance. A local pass with
the repository-reference package, an nginx mock, a hosted public-data fallback,
or a network-connected machine is not terminal evidence.
