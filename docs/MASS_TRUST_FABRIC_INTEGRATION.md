# TerraFusion OS - Mass Trust Fabric Integration

This directory contains the universal solution for integrating trust fabric across ALL TerraFusion microservices without manual frontend editing.

## 🎯 Problem Solved

Instead of manually editing 20+ microservice frontends, this solution provides:
- **ONE universal adapter** for all microservices
- **ONE command** to update everything
- **Zero manual editing** required
- **Gradual rollout** with monitoring
- **Automatic rollback** capabilities

## 📁 Components

### `/shared-libraries/trust-fabric-adapter/`
Universal adapter that works with ANY frontend architecture:
- Auto-detects environment (Node.js/Browser)
- Intercepts ALL API calls (fetch, XMLHttpRequest, axios)
- Gradual rollout via environment variables
- Zero-touch integration

### `/scripts/inject-trust-fabric.sh` (Linux/Mac)
Bash script for automated injection across all frontends

### `/scripts/inject-trust-fabric.ps1` (Windows)
PowerShell script for automated injection across all frontends

## 🚀 Quick Start

### 1. Review the Solution
```bash
# Check the universal adapter
cat shared-libraries/trust-fabric-adapter/index.js

# Review injection script
cat scripts/inject-trust-fabric.sh
```

### 2. Execute Mass Injection

**Linux/Mac:**
```bash
cd terrafusion_os_1.0
chmod +x scripts/inject-trust-fabric.sh
./scripts/inject-trust-fabric.sh
```

**Windows:**
```powershell
cd terrafusion_os_1.0
./scripts/inject-trust-fabric.ps1
```

### 3. Start Gradual Rollout
```bash
# Start with 10% of requests
export TRUST_FABRIC_ROLLOUT=10

# Test one service
cd services/property-assessment
npm start

# Monitor logs for trust fabric activity
tail -f logs/trust-fabric.log
```

### 4. Increase Rollout
```bash
# If successful, increase to 50%
export TRUST_FABRIC_ROLLOUT=50

# Eventually go to 100%
export TRUST_FABRIC_ROLLOUT=100
```

## 🛡️ Safety Features

### Automatic Backups
All modified files are backed up before injection:
```
./trust-fabric-backup-20250115_143022/
├── index.js_143022
├── main.tsx_143025
└── package.json_property_143030
```

### Dry Run Mode
Test without making changes:
```bash
# Linux/Mac
./scripts/inject-trust-fabric.sh --dry-run

# Windows
./scripts/inject-trust-fabric.ps1 -DryRun
```

### Emergency Rollback
```bash
# Disable trust fabric immediately
export TRUST_FABRIC_FORCE=false

# Or restore from backups
# Backup location shown after injection
```

## 📊 What Gets Injected

### JavaScript/TypeScript Files
Injection into `index.js`, `main.ts`, `app.jsx`, etc.:
```javascript
// TerraFusion Trust Fabric Integration - AUTO-INJECTED
try {
  if (typeof require !== 'undefined') {
    const TrustFabricAdapter = require('@terrafusion/trust-fabric-adapter');
    new TrustFabricAdapter().initialize();
  } else if (typeof window !== 'undefined') {
    // Browser loading logic
  }
} catch (error) {
  console.warn('Trust Fabric Adapter failed to load:', error);
}
```

### HTML Files
Script tag injection into `index.html`:
```html
<script src="/shared/trust-fabric-adapter.js"></script>
<script>
  try {
    new TrustFabricAdapter().initialize();
  } catch(e) {
    console.warn("Trust Fabric initialization failed:", e);
  }
</script>
```

### Package.json Files
Dependency addition:
```json
{
  "dependencies": {
    "@terrafusion/trust-fabric-adapter": "file:../../shared-libraries/trust-fabric-adapter"
  }
}
```

## 🔍 Monitoring

### Trust Fabric Logs
```bash
# Check trust fabric activity
tail -f logs/trust-fabric.log

# Check rollout percentage
curl localhost:\${{TF_API_PORT:-5000}}/trust-fabric/status
```

### Service Health
```bash
# Check service compliance
curl localhost:\${{TF_API_PORT:-5000}}/trust-fabric/services

# Expected output:
# {
#   "total_services": 53,
#   "trust_fabric_enabled": 40,
#   "compliance_rate": "75%"
# }
```

## 🎯 Rollout Strategy

### Phase 1: Testing (10%)
- Start with 10% rollout
- Monitor one service intensively
- Check logs for errors
- Validate API interception

### Phase 2: Expansion (50%)
- Increase to 50% after 24 hours
- Monitor multiple services
- Check performance impact
- Validate security logs

### Phase 3: Full Deployment (100%)
- Complete rollout after validation
- Monitor all services
- Confirm 100% compliance
- Document any issues

## 🚨 Troubleshooting

### Common Issues

**"npm link failed"**
```bash
# Fix npm linking issues
cd shared-libraries/trust-fabric-adapter
npm link
cd ../../services/[service-name]
npm link "@terrafusion/trust-fabric-adapter"
```

**"Already injected, skipping"**
- This is normal - script detects existing injections
- Use `--force` to re-inject if needed

**"Trust Fabric Adapter failed to load"**
- Check trust fabric service: `curl localhost:\${{TF_API_PORT:-5000}}/health`
- Verify adapter package: `ls shared-libraries/trust-fabric-adapter/`

### Rollback Process

1. **Stop rollout:**
   ```bash
   export TRUST_FABRIC_ROLLOUT=0
   ```

2. **Disable adapter:**
   ```bash
   export TRUST_FABRIC_FORCE=false
   ```

3. **Restore from backup:**
   ```bash
   # Backup location shown after injection
   cp trust-fabric-backup-*/index.js frontend/src/
   ```

## ✅ Success Criteria

- [ ] All 20+ microservices have trust fabric adapter injected
- [ ] Zero manual frontend editing required
- [ ] Gradual rollout successful (10% → 50% → 100%)
- [ ] Trust fabric compliance reaches 100%
- [ ] No performance degradation
- [ ] All API calls properly intercepted
- [ ] Security audit logs show full coverage

## 📈 Expected Results

After successful injection:
- **Trust Fabric Compliance:** 100% (up from 75%)
- **API Interception:** All HTTP calls routed through trust fabric
- **Security Coverage:** Complete cryptographic verification
- **Performance Impact:** <5ms latency overhead
- **Zero Manual Work:** No individual frontend editing needed

This solution eliminates the need for individual microservice frontend modifications while providing comprehensive trust fabric integration across the entire TerraFusion OS ecosystem.