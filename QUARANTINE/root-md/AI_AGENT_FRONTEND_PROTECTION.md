# 🛡️ AI AGENT FRONTEND PROTECTION SYSTEM

## ⚠️ CRITICAL FRONTEND ARCHITECTURE GUIDANCE

**Date**: September 17, 2025  
**Status**: MANDATORY COMPLIANCE  
**Protection Level**: 11-Layer AI Orchestration

---

## 🚨 ABSOLUTE RULES FOR AI AGENTS

### ❌ FORBIDDEN PATHS
**NEVER work in these directories:**
- `/workspaces/terrafusion_os_1.0/frontend/` (LEGACY - 97+ errors)
- `/workspaces/terrafusion_os_1.0/terrafusion/frontend/` (OLD STRUCTURE)
- Any path containing just `frontend/` without `frontend-v2/`

### ✅ AUTHORIZED PATHS
**PRODUCTION CURRENT - EXPERIENCE SUITE v5:**
- `/workspaces/terrafusion_os_1.0/experience-suite/temp-extract/experience-suite-v5/` ⭐ **PRIMARY**
- `/workspaces/terrafusion_os_1.0/experience-suite/temp-extract/experience-suite-v5/ui/` (React + MSW)
- `/workspaces/terrafusion_os_1.0/experience-suite/temp-extract/experience-suite-v5/tools/` (Build tools)

**LEGACY (Only for migration/reference):**
- `/workspaces/terrafusion_os_1.0/frontend-v2/` (SUPERSEDED BY EXPERIENCE SUITE v5)
- `/workspaces/terrafusion_os_1.0/terrafusion-frontend/` (System components)

---

## 🎯 CORRECT DEVELOPMENT WORKFLOW

### **Step 1: Verify Location**
```bash
pwd
# MUST show: /workspaces/terrafusion_os_1.0/experience-suite/temp-extract/experience-suite-v5/
```

### **Step 2: Use Experience Suite v5 Commands**
```bash
# From experience-suite-v5:
chmod +x enable-v5.sh
./enable-v5.sh
npx style-dictionary build --config tools/style-dictionary/v5.config.json
npm i -D msw
npx msw init public --save
```

# Or direct navigation:
cd /workspaces/terrafusion_os_1.0/frontend-v2/shell
npm run dev:os          # Port ${TF_LOKI_PORT:-3100}
```

### **Step 3: Validate Architecture**
```bash
# Check package.json version - MUST be 2.0.0
grep '"version"' package.json
# Expected: "version": "2.0.0"

# Check for enterprise dependencies
grep -E "(styled-components|framer-motion|@reduxjs/toolkit)" package.json
```

---

## 🔍 VALIDATION CHECKPOINTS

### **Before ANY Frontend Work**
1. ✅ **Path Verification**: Confirm in `/frontend-v2/` directory
2. ✅ **Version Check**: Package.json shows version "2.0.0"
3. ✅ **Architecture Validation**: Modern TypeScript 5.3.3 + React 18.2.0
4. ✅ **Zero Errors**: No TypeScript compilation errors

### **During Development**
1. ✅ **Port Confirmation**: Using ${TF_LOKI_PORT:-3100} for shell
2. ✅ **API Gateway**: Connecting to http://localhost:${TF_API_PORT:-5046}
3. ✅ **Brand System**: Using TerraFusionBrand components
4. ✅ **Enterprise Features**: Trust Fabric + Government Services

---

## 🚫 ERROR PREVENTION SYSTEM

### **Red Flags - STOP IMMEDIATELY**
- Working in any directory named just `frontend/`
- TypeScript compilation errors (97+ errors = wrong frontend)
- Missing styled-components or modern dependencies
- Port conflicts or old build systems

### **Green Flags - PROCEED**
- Working in `frontend-v2/shell/` or `frontend-v2/packages/`
- Zero TypeScript errors
- Modern React 18.2.0 + TypeScript 5.3.3
- TerraFusionBrand system active

---

## 🏗️ ENTERPRISE ARCHITECTURE OVERVIEW

### **Frontend-v2 Structure**
```
frontend-v2/
├── shell/                      # Main OS Shell (Port 3100)
│   ├── src/
│   │   ├── components/        # Government OS Components
│   │   ├── features/          # Government Services
│   │   └── styles/           # TerraFusion Brand System
│   └── package.json          # Version 2.0.0
├── packages/
│   ├── shared/               # Brand System & Components
│   └── modules/              # Government Service Modules
```

### **Technology Stack**
- **React**: 18.2.0 (Modern)
- **TypeScript**: 5.3.3 (Latest)
- **Styled-Components**: 6.1.6 (Professional theming)
- **Framer Motion**: 10.18.0 (Transcendent animations)
- **Redux Toolkit**: 2.0.1 (State management)

---

## 🎯 SUCCESS METRICS

### **Quality Gates**
- ✅ Zero TypeScript compilation errors
- ✅ All components use TerraFusionBrand system
- ✅ Government services integration verified
- ✅ Trust Fabric dashboard operational

### **Performance Targets**
- ✅ Load time: <3 seconds
- ✅ Bundle size: Optimized for government deployment
- ✅ Accessibility: WCAG 2.1 AA compliance
- ✅ Security: Government-grade protection

---

## 🛠️ TROUBLESHOOTING

### **If You're in the Wrong Frontend**
1. **STOP** all current work
2. **NAVIGATE** to `/workspaces/terrafusion_os_1.0/frontend-v2/shell`
3. **VERIFY** package.json shows version "2.0.0"
4. **RESTART** development with correct commands

### **Common Mistakes**
- Using `npm run dev:frontend` (points to legacy)
- Working in `/frontend/` instead of `/frontend-v2/`
- Missing the `-v2` suffix in directory navigation
- Ignoring TypeScript compilation errors

---

## 📞 EMERGENCY PROTOCOL

**If Frontend Confusion Occurs:**
1. Read this document completely
2. Verify current working directory
3. Use only authorized `/frontend-v2/` paths
4. Execute validation checkpoints
5. Report prevention mechanism failures

---

**🎯 REMEMBER: Frontend-v2 is the ONLY authorized frontend architecture for TerraFusion OS development. Any work in legacy `/frontend/` directories is wasted effort and must be prevented.**

---

*This protection system ensures MIT PhD-level engineering standards and prevents architectural confusion in AI agent operations.*