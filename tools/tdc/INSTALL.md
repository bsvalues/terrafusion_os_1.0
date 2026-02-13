# TDC CLI Installation Guide

## Quick Start

The TDC CLI is already available through npm scripts. No installation required!

```bash
# From the repository root
npm run tdc doctor
npm run tdc compliance
npm run tdc context
npm run tdc launch
npm run tdc companion
```

## Global Installation (Optional)

To use `tdc` as a global command:

### Option 1: npm link (Recommended for Development)

```bash
# From the repository root
cd tools/tdc
npm link

# Test it works
tdc doctor
tdc --help

# Uninstall when done
cd tools/tdc
npm unlink
```

### Option 2: Add to PATH

**Linux/macOS:**

Add to your `~/.bashrc`, `~/.zshrc`, or `~/.profile`:

```bash
export PATH="$PATH:/home/user/terrafusion_os_1.0/tools/tdc"
```

Then reload your shell:

```bash
source ~/.bashrc  # or ~/.zshrc
```

**Windows (PowerShell):**

```powershell
# Add to system PATH
$env:PATH += ";C:\path\to\terrafusion_os_1.0\tools\tdc"

# Or permanently with:
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\path\to\terrafusion_os_1.0\tools\tdc", "User")
```

### Option 3: Alias (Quick and Easy)

**Linux/macOS:**

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias tdc='node /home/user/terrafusion_os_1.0/tools/tdc/index.mjs'
```

**Windows (PowerShell Profile):**

Edit your PowerShell profile:

```powershell
notepad $PROFILE
```

Add:

```powershell
function tdc { node C:\path\to\terrafusion_os_1.0\tools\tdc\index.mjs $args }
```

## Verification

After installation, verify it works:

```bash
# Check version
tdc --version

# Run health check
tdc doctor

# View help
tdc --help
```

Expected output from `tdc doctor`:

```json
{
  "status": "pass",
  "checks": [
    {
      "name": "node-version",
      "status": "pass",
      "message": "Node.js 22.21.1 detected (required: >=18.0.0 <25.0.0)"
    },
    {
      "name": "pnpm-available",
      "status": "pass",
      "message": "pnpm 9.0.0 available"
    },
    {
      "name": "git-status",
      "status": "pass",
      "message": "Git repository detected"
    },
    {
      "name": "backend-exists",
      "status": "pass",
      "message": "Backend directory exists"
    },
    {
      "name": "frontend-exists",
      "status": "pass",
      "message": "Frontend directory exists"
    }
  ],
  "summary": {
    "passed": 5,
    "warned": 0,
    "failed": 0,
    "total": 5
  }
}
```

## Troubleshooting

### Command not found

**Problem:** `tdc: command not found`

**Solution:**

1. Check if Node.js is installed: `node --version`
2. Verify the file is executable: `chmod +x tools/tdc/index.mjs`
3. Use the full path: `node /home/user/terrafusion_os_1.0/tools/tdc/index.mjs doctor`
4. Or use npm script: `npm run tdc doctor`

### Permission denied

**Problem:** `Permission denied: tools/tdc/index.mjs`

**Solution:**

```bash
chmod +x tools/tdc/index.mjs
```

### npm link fails

**Problem:** `npm link` returns an error

**Solution:**

1. Ensure you're in the correct directory: `cd tools/tdc`
2. Check package.json has "bin" field: `cat package.json | grep bin`
3. Try with sudo (Linux/macOS): `sudo npm link`
4. Or use an alias instead (see Option 3 above)

### Contract not found error

**Problem:** `Error: Command contract not found: <command>`

**Solution:**

1. Verify you're in the repository root
2. Check contracts exist: `ls tools/dx/command-contracts/`
3. Ensure git repository is clean and up-to-date

## Integration with Development Tools

### VS Code

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "TDC Doctor",
      "type": "shell",
      "command": "npm run tdc doctor",
      "problemMatcher": []
    },
    {
      "label": "TDC Compliance",
      "type": "shell",
      "command": "npm run tdc compliance",
      "problemMatcher": []
    }
  ]
}
```

### Git Hooks

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
npm run tdc doctor || exit 1
npm run tdc compliance || exit 1
```

Make executable:

```bash
chmod +x .git/hooks/pre-commit
```

### CI/CD (GitHub Actions)

```yaml
- name: Run TDC Health Check
  run: npm run tdc doctor

- name: Run TDC Compliance Check
  run: npm run tdc compliance
```

## Uninstallation

### Remove npm link

```bash
cd tools/tdc
npm unlink
```

### Remove from PATH

Remove the PATH export line from your shell profile (`~/.bashrc`, `~/.zshrc`, etc.)

### Remove alias

Remove the alias line from your shell profile

## Support

For issues or questions:

1. Check the main README: `tools/tdc/TDC_CLI_README.md`
2. Review contract definitions: `tools/dx/command-contracts/`
3. See project instructions: `CLAUDE.md` and `.github/copilot-instructions.md`
