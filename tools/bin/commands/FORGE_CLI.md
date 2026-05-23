# TerraForge CLI Reference

> `tf forge <module> <action> [options]`

Unified command-line interface for all TerraForge mass appraisal modules. Supports interactive single-parcel workflows, batch processing via NDJSON files, and native Rust kernel acceleration for high-throughput scenarios.

## Modules

| Module | Description | Actions |
|--------|-------------|---------|
| `cuforge` | Current Use (RCW 84.34) | rollback, interest, enroll, removals, classifications, penalties |
| `levy` | Levy Calculation (RCW 84.52/84.55) | calculate, rates, certify, project, risk |
| `sales` | Sales Analysis (IAAO) | qualify, comps, ratio, regression |
| `cost` | Cost Approach (Marshall & Swift) | estimate, depreciation, income, matrix, batch |

## Global Options

| Flag | Description |
|------|-------------|
| `--api <url>` | Override API base URL (default: `http://localhost:5000`) |
| `--json` | Machine-readable JSON output |
| `--csv` | CSV output for list/table commands |
| `--batch <file>` | Process NDJSON batch file |
| `--kernel` | Use Rust kernel for batch (cost only) |
| `--help` | Show help |

## CUForge Commands

### `tf forge cuforge rollback`

Calculate rollback tax for a parcel removed from current use.

```bash
tf forge cuforge rollback \
  --parcel P-12345 \
  --start-year 2018 \
  --end-year 2025 \
  --market-value 450000 \
  --use-value 35000
```

### `tf forge cuforge interest`

Query WAC 458-30-590 interest rates or calculate compound interest.

```bash
# List all rates
tf forge cuforge interest --json

# Calculate interest on rollback amount
tf forge cuforge interest --calculate --principal 50000 --start-year 2020 --end-year 2025
```

### `tf forge cuforge enroll`

Create a new current use enrollment.

```bash
tf forge cuforge enroll --parcel P-99999 --code DFL --acreage 40 --date 2025-01-15
```

### `tf forge cuforge removals`

List or initiate removal proceedings.

```bash
# List all removals
tf forge cuforge removals

# Initiate removal
tf forge cuforge removals --initiate --parcel P-12345 --reason Voluntary --date 2025-06-01
```

### `tf forge cuforge classifications`

Query enrolled classifications with pagination.

```bash
tf forge cuforge classifications --page 1 --page-size 50 --csv
```

### `tf forge cuforge penalties`

Evaluate penalty exceptions for a parcel.

```bash
tf forge cuforge penalties --parcel P-12345
```

## Levy Commands

### `tf forge levy calculate`

Calculate levy amount for a district.

```bash
tf forge levy calculate --district FD1 --av 500000 --rate 1.5 --year 2025
```

### `tf forge levy rates`

Get current IPD rates.

```bash
tf forge levy rates --json
```

### `tf forge levy certify`

Submit a district for certification.

```bash
tf forge levy certify --district FD1 --year 2025
```

### `tf forge levy project`

Generate multi-year revenue projection.

```bash
tf forge levy project --district FD1 --years 5 --json
```

### `tf forge levy risk`

Get risk score for a district.

```bash
tf forge levy risk --district FD1
```

## Sales Commands

### `tf forge sales qualify`

Run 5-layer sale qualification on a parcel.

```bash
tf forge sales qualify --parcel P-12345 --json
```

### `tf forge sales comps`

Build comparable sales pool.

```bash
tf forge sales comps --parcel P-12345 --radius 2.0 --months 18
```

### `tf forge sales ratio`

Run IAAO ratio study for an area.

```bash
tf forge sales ratio --area Downtown --year 2025 --json
```

### `tf forge sales regression`

Run OLS regression analysis.

```bash
tf forge sales regression --area Downtown --json
```

## Cost Commands

### `tf forge cost estimate`

Calculate replacement cost new (RCN).

```bash
tf forge cost estimate --type residential --sqft 2400 --quality good --region Benton --year-built 2005
```

### `tf forge cost depreciation`

Calculate depreciation schedule.

```bash
tf forge cost depreciation --age 25 --condition average --type residential
```

### `tf forge cost income`

Run income approach valuation.

```bash
tf forge cost income --income 120000 --vacancy 0.05 --expense-ratio 0.35 --cap-rate 0.08
```

### `tf forge cost matrix`

View cost matrix for a region.

```bash
tf forge cost matrix --region Benton --json
```

### `tf forge cost batch`

Process multiple parcels from an NDJSON file.

```bash
# HTTP batch (through API)
tf forge cost batch --batch parcels.ndjson

# Rust kernel batch (10x throughput, offline)
tf forge cost batch --batch parcels.ndjson --kernel
```

**NDJSON format for batch:**
```json
{"subject":{"parcel_id":"P-001","attributes":{"sqft":2400,"quality":"Good","condition":"Average"}},"tables":{"base_rate":155.0,"modifiers":{"Good":1.15,"Average":1.0,"DepreciationRate":0.12}}}
{"subject":{"parcel_id":"P-002","attributes":{"sqft":1800,"quality":"Average","condition":"Good"}},"tables":{"base_rate":145.5,"modifiers":{"Average":1.0,"Good":1.05,"DepreciationRate":0.08}}}
```

## Rust Kernel Integration

The `--kernel` flag routes batch processing through the native Rust binary (`terraforge-kernel-cost`) for:

- **10x throughput** vs HTTP API for large batches (10K+ parcels)
- **Offline operation** — no backend server required
- **FISMA audit provenance** — each result includes `git:<sha>` hash for reproducibility
- **Zero network overhead** — stdin/stdout JSON pipe

### Building the Kernel

```bash
cd packages/terrabuild/kernels/terraforge.kernel.cost
cargo build --release
```

The binary will be at `target/release/terraforge-kernel-cost`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TERRAFORGE_API_URL` | `http://localhost:5000` | API base URL |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (invalid args, API failure, kernel failure) |
