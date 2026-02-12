# 🎯 TerraFusion Development Session Quick Start

## Mandatory Session Initialization

Every development session MUST begin with these steps:

### 1. Validate Explain-Mode Integration
```bash
npm run validate:explain-mode
```
**Expected**: 90%+ success rate, frontend components verified

### 2. Start Development Environment
```bash
npm run dev
```
**Expected**: Backend API (port 5046) + Frontend (port 3000)

### 3. Verify Executive Interface
- Navigate to http://localhost:3000
- Click "🎯 Executive View" toggle
- Verify all 5 tabs load:
  - System Overview
  - Development Insights  
  - Enterprise Ecosystem
  - Change Analysis
  - AI Operations

### 4. Stakeholder Accessibility Check
- Test plain English explanations
- Verify visual indicators work
- Check contextual help system

## Development Standards

### Code Integration Requirements
✅ **Every feature needs executive explanation**  
✅ **Technical changes include business impact**  
✅ **Validation passes before commits**  
✅ **Documentation updated for government users**

### Stakeholder Communication
🏛️ **County Executives**: Use System Overview tab  
🛡️ **IT Directors**: Use Development Insights tab  
🤝 **Federal Partners**: Use Enterprise Ecosystem tab  
📊 **Budget Planning**: Use Change Analysis tab  
🤖 **AI Operations**: Use AI Operations tab

## Quality Gates

Before any deployment:
```bash
# 1. Validate integration
npm run validate:explain-mode

# 2. Test executive workflow
npm run dev
# Navigate to localhost:3000 → Executive View → Test all tabs

# 3. Verify stakeholder accessibility
# Can a county administrator understand the interface?
```

## Emergency Protocol

If Explain-Mode breaks:
1. Check `EXPLAIN_MODE_INTEGRATION_STATUS.md`
2. Run `npm run validate:explain-mode` for diagnostics
3. Verify frontend components in `/frontend/src/features/explain/`
4. Check backend controllers in `/backend/TerraFusion.API/Controllers/`

## Session End Checklist

Before ending development session:
- [ ] Explain-Mode validation passes
- [ ] Executive View functional
- [ ] Documentation updated
- [ ] Stakeholder accessibility maintained

---

**Remember**: TerraFusion serves government stakeholders who need technical complexity translated into actionable business insights. Every feature must be accessible to non-technical decision makers.