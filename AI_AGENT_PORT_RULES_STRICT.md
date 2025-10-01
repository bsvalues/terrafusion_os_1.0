# TerraFusion OS - AI Agent Port Management Rules
# ================================================
# CRITICAL: ALL AI AGENTS MUST FOLLOW THESE RULES

## ABSOLUTE PROHIBITIONS

1. **NEVER HARDCODE PORTS** - Any hardcoded port number in code is a critical violation
2. **ALWAYS USE ENVIRONMENT VARIABLES** - All port references must use ${VAR_NAME} format
3. **CHECK .env.ports FIRST** - Always consult existing port mappings before adding new ones
4. **VALIDATE BEFORE COMMIT** - Run port-validator.py before any code changes

## REQUIRED PATTERNS

### ✅ CORRECT - Use environment variables:
```bash
--urls=http://localhost:${TF_API_PORT:-5046}
```

```javascript
const port = process.env.TF_API_PORT || 5046;
```

```json
{
  "port": "${TF_API_PORT:-5046}"
}
```

### ❌ WRONG - Never hardcode:
```bash
--urls=http://localhost:\${{TF_API_PORT:-5000}}
```

```javascript
const port=\${{TF_API_PORT:-5000}};
```

```json
{
  "port": \${{TF_API_PORT:-5000}}
}
```

## ENFORCEMENT

- Pre-commit hooks MUST run port validation
- CI/CD MUST fail on any hardcoded ports
- Code reviews MUST check port management compliance
- AI agents MUST validate ports before any changes

## VIOLATION CONSEQUENCES

Any AI agent that introduces hardcoded ports will be:
1. Immediately flagged for retraining
2. Required to fix ALL violations before proceeding
3. Subjected to enhanced oversight

NO EXCEPTIONS - ZERO TOLERANCE FOR HARDCODED PORTS
