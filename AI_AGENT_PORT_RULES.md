# ⚠️ CRITICAL: AI AGENT PORT MANAGEMENT RULES

## 🚨 MANDATORY READING FOR ALL AI AGENTS

**This document is CRITICAL for preventing port conflicts in TerraFusion OS.**

### ❌ ABSOLUTELY FORBIDDEN
```bash
# NEVER use hardcoded ports like these:
localhost:\${{TF_FRONTEND_PORT:-3000}}
localhost:\${{TF_FRONTEND_PORT:-3000}}
localhost:\${{TF_FRONTEND_PORT:-3000}}
port=\${{TF_API_PORT:-5000}}
PORT=\${{TF_FRONTEND_PORT:-3000}}
:5173
```

### ✅ ALWAYS REQUIRED
```bash
# ALWAYS use environment variables:
localhost:${TF_API_PORT:-5046}
localhost:${TF_FRONTEND_PORT:-3102}
port = process.env.TF_API_PORT || 5046
PORT = int(os.environ.get('TF_FRONTEND_PORT', 3102))
```

## 🛡️ AI AGENT PROTECTION SYSTEM

### When modifying ANY file:
1. ✅ Check for environment variables: `TF_*_PORT`
2. ✅ Add comment: `// NO HARDCODED PORTS!` 
3. ✅ Use fallback values: `|| 5046` or `:-5046`
4. ❌ NEVER hardcode localhost:\${{TF_FRONTEND_PORT:-3000}} (conflicts with TerraFusion Agent)
5. ❌ NEVER hardcode localhost:\${{TF_FRONTEND_PORT:-3000}} (conflicts with other React apps)

### Required Environment Variables
```bash
TF_API_PORT=\${{TF_FRONTEND_PORT:-3000}}         # Backend API (NOT 5000!)
TF_FRONTEND_PORT=\${{TF_FRONTEND_PORT:-3000}}    # Frontend (NOT 3000!)
TF_SHELL_PORT=\${{TF_FRONTEND_PORT:-3000}}       # Shell (NOT 3001!)
TF_DESKTOP_PORT=\${{TF_FRONTEND_PORT:-3000}}     # Desktop (NOT 3002!)
TF_STATIC_PORT=\${{TF_FRONTEND_PORT:-3000}}      # Static files
```

### Language-Specific Patterns

#### JavaScript/TypeScript Files
```javascript
// ❌ WRONG (causes conflicts)
const apiUrl = 'http://localhost:\${{TF_FRONTEND_PORT:-3000}}';
const port=\${{TF_API_PORT:-5000}};

// ✅ CORRECT (dynamic ports)
const apiUrl = process.env.VITE_API_URL || 'http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api';
const port = process.env.TF_FRONTEND_PORT || 3102;
```

#### Python Files
```python
# ❌ WRONG (causes conflicts)
port=\${{TF_API_PORT:-5000}}
app.run(port=\${{TF_API_PORT:-5000}})

# ✅ CORRECT (dynamic ports)
port = int(os.environ.get('TF_API_PORT', 5046))
app.run(port=int(os.environ.get('TF_FRONTEND_PORT', 3102)))
```

#### JSON Configuration
```json
// ❌ WRONG
"devPath": "http://localhost:\${{TF_FRONTEND_PORT:-3000}}"

// ✅ CORRECT  
"devPath": "http://localhost:${TF_API_PORT:-5046}"
```

#### Shell Scripts
```bash
# ❌ WRONG
curl http://localhost:\${{TF_FRONTEND_PORT:-3000}}/health

# ✅ CORRECT
curl http://localhost:${TF_API_PORT:-5046}/health
```

## 🔍 Validation Commands

Before making ANY changes, run:
```bash
# Check for hardcoded ports
python3 scripts/port-validator.py

# Auto-fix violations
python3 scripts/port-fix-engine.py
```

## 🚨 WHY THIS MATTERS

1. **Port \${{TF_API_PORT:-5000}} Conflict**: User's TerraFusion Agent uses port \${{TF_API_PORT:-5000}}
2. **Multi-App Environment**: Multiple workspaces running simultaneously  
3. **AI Agent Regressions**: Previous AI agents kept reverting to hardcoded ports
4. **Production Deployment**: Dynamic ports required for containerization

## 📋 CHECKLIST FOR AI AGENTS

Before submitting ANY code change:

- [ ] ✅ No hardcoded ports in files
- [ ] ✅ Environment variables used
- [ ] ✅ Fallback values provided
- [ ] ✅ Anti-regression comments added
- [ ] ✅ Port validator passes
- [ ] ✅ Documentation updated

## 🎯 REMEMBER

**The user specifically mentioned this is a "violation of standards" and that AI agents keep "fixing" things back to hardcoded ports. DO NOT BE THAT AI AGENT!**

Use this checklist for EVERY change:
1. Replace hardcoded port → Environment variable
2. Add protection comment → `// NO HARDCODED PORTS!`
3. Test with validator → `python3 scripts/port-validator.py`
4. Document the change → Update relevant docs

---

**This system saves hours of debugging port conflicts. Follow it religiously.**