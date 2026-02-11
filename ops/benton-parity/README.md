# Benton Parity Harness

> **Philosophy:** Start at maximum restriction (DENY ALL outbound), then *only*
> loosen what we can justify with evidence. Every loosening becomes a documented
> requirement in the evidence pack.

## Quick Start

```bash
# On the target Linux host (bare metal or VM):

# 1. Enable Benton Mode (requires root)
sudo ops/benton-parity/benton-mode.sh enable

# 2. Run the full harness (discovers requirements by failing)
ops/benton-parity/run-harness.sh

# 3. Generate evidence pack from failures
ops/benton-parity/evidence-pack.sh

# 4. Disable Benton Mode when done
sudo ops/benton-parity/benton-mode.sh disable
```

## Architecture

```
ops/benton-parity/
├── benton-mode.sh          # DENY-ALL toggle (iptables + logging)
├── run-harness.sh           # Orchestrator: runs all phases sequentially
├── capture-requirements.sh  # Parses deny logs → machine-readable requirements
├── evidence-pack.sh         # Generates the final IT-ready evidence pack
├── lib/
│   ├── common.sh            # Shared functions (logging, paths, colors)
│   ├── net-probe.sh         # Network probing under deny-all
│   ├── build-probe.sh       # Build attempts (dotnet + pnpm) with capture
│   ├── runtime-probe.sh     # Service start + health check probing
│   └── ci-probe.sh          # PR-gate job simulation
├── evidence/                # Generated output (gitignored)
│   ├── network-requirements.json
│   ├── supply-chain-requirements.json
│   ├── secrets-requirements.json
│   ├── ports-requirements.json
│   ├── deny.log             # Raw iptables deny log
│   └── evidence-pack.md     # Human-readable evidence pack
└── README.md                # This file
```

## Benton Mode

Benton Mode applies **outbound DENY ALL** at the OS firewall (iptables/nftables)
with full logging. Only loopback and already-established connections are permitted.

| State | Outbound | Logging | Effect |
|-------|----------|---------|--------|
| `enable` | DENY ALL | Every denied packet logged | Discovery mode |
| `disable` | ALLOW ALL | Logging removed | Normal operation |

## Evidence Pack Output

After running the harness, you get machine-readable requirement files:

- **network-requirements.json** — Every domain/IP:port that was denied
- **supply-chain-requirements.json** — Every package fetch that failed
- **secrets-requirements.json** — Every secret/env var that was missing
- **ports-requirements.json** — Every internal port that needs to be open
- **evidence-pack.md** — Human-readable summary for IT handoff

## CI Integration

The GitHub Actions workflow `.github/workflows/benton-parity.yml` runs the
harness on the self-hosted Benton runner under BENTON MODE constraints.
