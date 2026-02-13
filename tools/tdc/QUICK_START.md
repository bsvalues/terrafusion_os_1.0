# TDC Quick Start Guide

## 30-Second Start

```bash
# From repository root
npm run tdc doctor
```

That's it! No installation required.

## All Commands

```bash
npm run tdc doctor              # Health check
npm run tdc compliance          # FISMA compliance
npm run tdc context             # Context packs
npm run tdc launch              # Start services
npm run tdc companion           # AI companion status
```

## Command Options

```bash
# Doctor
npm run tdc doctor --verbose

# Compliance
npm run tdc compliance --framework=fisma
npm run tdc compliance --framework=nist-800-53
npm run tdc compliance --framework=wcag
npm run tdc compliance --framework=all

# Context
npm run tdc context --action=view
npm run tdc context --action=regenerate
npm run tdc context --scope=backend
npm run tdc context --scope=frontend
npm run tdc context --scope=all

# Launch
npm run tdc launch --services=all
npm run tdc launch --mode=dev

# Companion
npm run tdc companion --action=status
npm run tdc companion --action=health
```

## Help & Version

```bash
npm run tdc -- --help           # Show help
npm run tdc -- --version        # Show version
```

## Global Installation (Optional)

```bash
# Option 1: npm link
cd tools/tdc
npm link
tdc doctor

# Option 2: Alias (add to ~/.bashrc or ~/.zshrc)
alias tdc='node /home/user/terrafusion_os_1.0/tools/tdc/index.mjs'
tdc doctor
```

## Exit Codes

- **0** = Success
- **1** = Warning/Failure
- **2** = Fatal Error

## Example Output

```json
{
  "status": "pass",
  "checks": [
    { "name": "node-version", "status": "pass", "message": "..." },
    { "name": "pnpm-available", "status": "pass", "message": "..." }
  ],
  "summary": { "passed": 5, "warned": 0, "failed": 0, "total": 5 }
}
```

## Documentation

- Full README: `tools/tdc/TDC_CLI_README.md`
- Installation: `tools/tdc/INSTALL.md`
- Summary: `tools/tdc/TDC_IMPLEMENTATION_SUMMARY.md`

## Common Use Cases

### CI/CD Health Check

```yaml
- run: npm run tdc doctor
- run: npm run tdc compliance
```

### Pre-commit Hook

```bash
#!/bin/bash
npm run tdc doctor || exit 1
```

### VS Code Task

```json
{
  "label": "Health Check",
  "type": "shell",
  "command": "npm run tdc doctor"
}
```

## Troubleshooting

**Problem:** Command not found
**Solution:** Use `npm run tdc doctor` (not just `tdc doctor`)

**Problem:** Permission denied
**Solution:** `chmod +x tools/tdc/index.mjs`

**Problem:** Contract not found
**Solution:** Check you're in repo root: `pwd`

## Support

See full documentation in `tools/tdc/TDC_CLI_README.md`
