# TerraFusion AI Agent Emergency Protocols & Troubleshooting Guide

**🚨 CRITICAL GOVERNMENT INFRASTRUCTURE - EMERGENCY RESPONSE PROTOCOLS 🚨**

**Last Updated**: October 18, 2025
**Scope**: Emergency protocols for AI agents working with TerraFusion OS 1.0
**Authority**: Government Critical Infrastructure Protection Standards
**Compliance**: FISMA High + NIST 800-53 Emergency Response

## 🚨 IMMEDIATE EMERGENCY PROTOCOLS

### Code Red: Production AI Swarm Interference
**SYMPTOMS**: Production agents reporting coordination failures, SwarmOrchestrator.ts errors
**IMMEDIATE ACTION**:
```bash
# STOP ALL DEVELOPMENT ACTIVITIES IMMEDIATELY
# DO NOT TOUCH: os-platform/ai-systems/ai-systems/ai-swarm/
# Contact: @ai-infrastructure-team @government-leads
```
**RECOVERY**: Only government-leads and ai-infrastructure-team authorized to restore

### Code Red: County Data Exposure Risk
**SYMPTOMS**: Queries accessing Benton County parcels, Harris PACS data violations
**IMMEDIATE ACTION**:
```bash
# HALT ALL OPERATIONS
# PRESERVE AUDIT TRAIL
# Contact: @government-leads @security-team @compliance-team
```
**RECOVERY**: Full compliance audit required before resumption

### Code Red: Compliance Framework Bypass
**SYMPTOMS**: PluginValidator.ts modifications, audit field tampering, RBAC violations
**IMMEDIATE ACTION**:
```bash
# REVERT ALL CHANGES IMMEDIATELY
# PRESERVE FORENSIC EVIDENCE
# Contact: @security-team @compliance-team
```

## ⚠️ WARNING LEVEL PROTOCOLS

### Warning: Testing Infrastructure Corruption
**SYMPTOMS**: Test failures >50%, testing-suite directory modifications
**ACTION**:
```bash
# Run comprehensive validation
./scripts/discover-all-tests.sh
npm run build:marketplace
python ops/health/generate_workspace_health.py marketplace frontend platform
```

### Warning: Module Validation Failures
**SYMPTOMS**: PluginValidator.ts scores <85%, security scanning failures
**ACTION**:
```bash
# Validate module compliance
./SDK/scripts/create-module.sh --validate-only
# Check manifest patterns against requirements
```

### Warning: Service Health Degradation
**SYMPTOMS**: Health endpoints failing, performance <100ms violations
**ACTION**:
```bash
# Check service configuration
# Review config/core-os.toml patterns
# Validate health endpoint implementations
```

## 🔧 TROUBLESHOOTING QUICK REFERENCE

### AI Agent Cannot Access SwarmOrchestrator
**SOLUTION**:
```javascript
// Verify accessibility
const fs = require('fs');
try {
  const swarmCode = fs.readFileSync('./os-platform/ai-systems/ai-systems/ai-swarm/SwarmOrchestrator.ts', 'utf8');
  console.log('✅ SwarmOrchestrator accessible:', swarmCode.includes('submitTask'));
} catch(e) {
  console.log('❌ EMERGENCY: SwarmOrchestrator not accessible');
}
```

### Module Creation Failing Validation
**SOLUTION**:
```bash
# Verify SDK structure
ls -la SDK/scripts/create-module.sh
# Check PluginValidator.ts accessibility
ls -la infrastructure/marketplace-enhanced/sdk/validation/PluginValidator.ts
# Validate manifest requirements
```

### Testing Infrastructure Not Found
**SOLUTION**:
```bash
# Discover test locations
./scripts/discover-all-tests.sh
# Primary testing location
ls -la os-platform/development/testing-suite/
# Alternative test locations
find . -name "*.test.*" -o -name "*.spec.*"
```

### Configuration Issues
**SOLUTION**:
```bash
# Verify core configuration
cat config/core-os.toml | grep -E "(service|health|performance)"
# Check AI system prompts
cat config/ai-system-prompts.json | jq '.brand_voice'
```

## 📋 ESCALATION PROCEDURES

### Level 1: Development Issues
**Contact**: @platform-team
**Response**: Within 4 hours
**Scope**: Non-critical development workflow issues

### Level 2: Compliance Violations
**Contact**: @security-team @compliance-team
**Response**: Within 1 hour
**Scope**: FISMA/NIST compliance concerns, audit trail issues

### Level 3: Production Infrastructure
**Contact**: @government-leads @ai-infrastructure-team
**Response**: IMMEDIATE
**Scope**: AI swarm coordination, county data, critical infrastructure

### Level 4: Government Critical
**Contact**: @government-leads + EMERGENCY ESCALATION
**Response**: IMMEDIATE + GOVERNMENT NOTIFICATION
**Scope**: Public safety, citizen data exposure, national security

## 🛡️ PREVENTION PROTOCOLS

### Pre-Development Checklist
- [ ] Read .github/copilot-instructions.md completely
- [ ] Verify workspace health: `python ops/health/generate_workspace_health.py marketplace frontend platform`
- [ ] Confirm testing accessibility: `./scripts/discover-all-tests.sh`
- [ ] Validate AI swarm non-interference protocols

### During Development
- [ ] Monitor PluginValidator.ts scores (85%+ required)
- [ ] Preserve audit fields (CreatedAt/UpdatedAt/CreatedBy/UpdatedBy)
- [ ] Follow module manifest patterns exactly
- [ ] Test against 716 real test suite regularly

### Post-Development
- [ ] Run full linting: `npm run lint && cd backend && dotnet format`
- [ ] Validate security compliance
- [ ] Confirm no AI swarm interference
- [ ] Document changes following TerraFusion standards

## 📞 EMERGENCY CONTACTS

### Government Operations Center
**Phone**: [CLASSIFIED]
**Secure Channel**: [CLASSIFIED]
**Authority**: Ultimate escalation for government critical issues

### AI Infrastructure Emergency Response
**Team**: @ai-infrastructure-team
**Scope**: SwarmOrchestrator, 1,008 agent coordination
**Response**: 24/7 monitoring active

### Compliance Emergency Response
**Team**: @compliance-team @security-team
**Scope**: FISMA violations, audit compliance
**Response**: Government notification protocols

## 🎯 SUCCESS VALIDATION

### Green Status Indicators
- ✅ All 716 tests passing >91% rate
- ✅ PluginValidator.ts scores >85%
- ✅ SwarmOrchestrator.ts accessible with submitTask API
- ✅ No audit field violations
- ✅ Linting standards enforced
- ✅ Health endpoints responding <100ms

### System Health Command
```bash
# Complete system validation
python ops/health/generate_workspace_health.py marketplace frontend platform
npm run build:marketplace
npm test
./scripts/discover-all-tests.sh
```

---

**THE TERRAFUSION WAY: Government. Transcended.**
*When in doubt, preserve government standards and escalate appropriately.*
