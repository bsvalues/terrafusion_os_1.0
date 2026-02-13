# TerraFusion DX Hooks

Git hooks for the DX Spine governance layer.

## Available Hooks

### pre-commit-context-pack.sh

Automatically regenerates the context pack (`.terrafusion/context/latest.json`) before each commit. This ensures the AI memory layer is always synchronized with the latest code state.

**Install:**
```bash
# Option 1: Copy directly
cp tools/dx/hooks/pre-commit-context-pack.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Option 2: Append to existing pre-commit hook
echo 'bash tools/dx/hooks/pre-commit-context-pack.sh' >> .git/hooks/pre-commit
```

**Behavior:**
- Runs `tools/dx/context-pack/generate.mjs` with a 10-second timeout
- Stages the updated context pack automatically
- Non-fatal: will not block commits if generation fails
- Skips gracefully if Node.js or the generator is missing

## Hook Conventions

- All hooks are non-fatal by default (exit 0 on failure)
- Hooks have timeouts to prevent blocking developer workflow
- Hooks log with `[DX Spine]` prefix for visibility
- Hooks are idempotent (safe to run multiple times)
