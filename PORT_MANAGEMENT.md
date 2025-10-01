# TerraFusion OS - Port Management System

## 🚨 CRITICAL: NO HARDCODED PORTS ALLOWED

This system uses **dynamic port configuration** to prevent conflicts between applications.

### Port Configuration Files
- `.env.ports` - Master port configuration 
- `.env` - Environment-specific overrides

### Environment Variables
```bash
TF_API_PORT=\${{TF_API_PORT:-5000}}         # Backend API
TF_FRONTEND_PORT=\${{TF_API_PORT:-5000}}    # Frontend development server
TF_SHELL_PORT=\${{TF_API_PORT:-5000}}       # Government shell
TF_DESKTOP_PORT=\${{TF_API_PORT:-5000}}     # Desktop environment
TF_STATIC_PORT=\${{TF_API_PORT:-5000}}      # Static file server
```

### Usage Examples

#### JavaScript/TypeScript
```javascript
// ❌ WRONG - Hardcoded port
const apiUrl = 'http://localhost:\${{TF_API_PORT:-5000}}';

// ✅ CORRECT - Environment variable
const apiUrl = process.env.VITE_API_URL || 'http://localhost:\${{TF_API_PORT:-5000}}/api';
```

#### Python
```python
# ❌ WRONG - Hardcoded port
port=\${{TF_API_PORT:-5000}}

# ✅ CORRECT - Environment variable
port = int(os.environ.get('TF_API_PORT', 5046))
```

#### Shell Scripts
```bash
# ❌ WRONG - Hardcoded port
curl http://localhost:\${{TF_API_PORT:-5000}}/health

# ✅ CORRECT - Environment variable
curl http://localhost:${TF_API_PORT:-5046}/health
```

### Validation
Run the port validator to check for violations:
```bash
python3 scripts/port-validator.py
```

### AI Agent Protection
Comments like `// NO HARDCODED PORTS!` are added to prevent AI agents from reverting to hardcoded values.

### Port Ranges
- 3100-3110: Frontend services
- 5040-5050: Backend APIs
- 7000-7010: Security services
- 8080-8090: Infrastructure
