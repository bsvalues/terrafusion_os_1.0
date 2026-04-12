# TerraForge Rust Kernels

Deterministic, auditable, version-pinned stdin/stdout calculation binaries.
Preserved from quarantine on 2026-04-11 for v1.2 batch calculation path.

## Why These Exist

The .NET CostForgeController handles all online calculation correctly.
These kernels exist for:

1. **High-performance batch calculation** — `POST /api/costforge/batch-calculate` will
   shell out to the cost kernel for parallel parcel processing without hitting the HTTP stack.
2. **Offline / air-gapped operation** — County assessors who work offline can run
   calculations locally by piping JSON through the binary.
3. **Audited calculation engine** — The binary is compiled to a single stripped executable.
   Hash it and you can prove the exact code that produced a valuation (FISMA audit trail).

## Binaries

### `terraforge-kernel-cost`

Calculates Replacement Cost New (RCN) and RCNLD from building attributes and cost tables.

**Action:** `calculate_cost`

**Input (stdin):**
```json
{
  "contractPackVersion": "1.0",
  "moduleApiVersion": "1.0",
  "requestId": "uuid-here",
  "action": "calculate_cost",
  "payload": {
    "subject": {
      "parcelId": "123-456-789",
      "attributes": {
        "sqft": 1800,
        "quality": "Standard",
        "condition": "Good"
      }
    },
    "tables": {
      "baseRate": 95.50,
      "modifiers": {
        "Standard": 1.00,
        "Premium": 1.30,
        "Economy": 0.75,
        "Good": 1.00,
        "Average": 0.95,
        "Fair": 0.85,
        "Poor": 0.70,
        "DepreciationRate": 0.12
      }
    }
  }
}
```

**Output (stdout):**
```json
{
  "success": true,
  "data": {
    "replacementCost": 171900.0,
    "depreciation": 20628.0,
    "rcnld": 151272.0
  },
  "auditEvent": {
    "eventId": "...",
    "timestamp": "2026-04-11T...",
    "actor": "system",
    "action": "calculate_cost",
    "resourceId": "123-456-789",
    "module": "terraforge.kernel.cost",
    "hash": "rust-steel-hash-123"
  }
}
```

**Note:** Pass `DepreciationRate` in the modifiers map to override the default 10% flat rate.
The .NET API's `depreciation-calculate` endpoint computes age/condition-adjusted rates —
pass those values here for production-accurate RCNLD.

---

### `terraforge-kernel-valuation`

Combines RCNLD from the cost kernel with land value to produce the final reconciled value.

**Action:** `valuate`

**Input (stdin):**
```json
{
  "contractPackVersion": "1.0",
  "moduleApiVersion": "1.0",
  "requestId": "uuid-here",
  "action": "valuate",
  "payload": {
    "subject": {
      "parcelId": "123-456-789",
      "attributes": {}
    },
    "costBreakdown": {
      "replacementCost": 171900.0,
      "depreciation": 20628.0,
      "rcnld": 151272.0
    },
    "model": {
      "landValue": 45000.0,
      "adjustmentFactors": {
        "neighborhood": 1.05,
        "location": 1.00
      }
    }
  }
}
```

**Output (stdout):**
```json
{
  "success": true,
  "data": {
    "totalValue": 203835.6,
    "components": {
      "land": 45000.0,
      "building": 158835.6
    }
  },
  "auditEvent": { ... }
}
```

## Build

```bash
cd packages/terrabuild/server/kernels

# Debug
cargo build

# Release (stripped, LTO, single binary)
cargo build --release

# Binaries at:
#   target/release/terraforge-kernel-cost.exe
#   target/release/terraforge-kernel-valuation.exe
```

## Pipeline Usage (v1.2 batch path)

```bash
# Single parcel
echo '{ ...invocation json... }' | ./terraforge-kernel-cost | jq '.data.rcnld'

# Batch: one JSON invocation per line, parallel processing
cat parcels.jsonl | parallel -j8 'echo {} | ./terraforge-kernel-cost' > results.jsonl
```

## FISMA Audit Provenance

The `hash` field in every `auditEvent` is `"git:<12-char-sha>"` embedded at build time
by `build.rs`. This closes the audit loop:

1. Appraiser runs calculation → result stored with `hash: "git:bd1b539f210c"`
2. Auditor questions the math → check out commit `bd1b539f210c`
3. `cargo build --release` → rebuild is byte-for-byte identical (Rust + LTO + `strip=true`)
4. Run the same input through the rebuilt binary → same output proves the calculation

**This is stronger than binary hash** — a binary SHA256 proves the file wasn't tampered with,
but `git:<sha>` proves the *source code* that produced the number, which is what FISMA
actually cares about (reproducible, auditable calculation engine).

## Wiring Into .NET (v1.2)

The batch endpoint will call these via `Process.Start`:

```csharp
// CostForgeController.cs — batch-calculate action (v1.2)
var process = new Process {
    StartInfo = new ProcessStartInfo {
        FileName = "terraforge-kernel-cost",
        RedirectStandardInput = true,
        RedirectStandardOutput = true,
        UseShellExecute = false,
    }
};
process.Start();
await process.StandardInput.WriteAsync(invocationJson);
process.StandardInput.Close();
var result = await process.StandardOutput.ReadToEndAsync();
```
