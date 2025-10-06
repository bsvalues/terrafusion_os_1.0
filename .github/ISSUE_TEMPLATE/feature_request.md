---
name: Feature Request / New Component
about: Add a new service, module, agent, or other component to TerraFusion OS
title: '[FEATURE] '
labels: 'enhancement, needs-atlas-registration'
assignees: ''
---

## 📋 Feature Description

<!-- Provide a clear and concise description of the feature/component -->

**Component Type:** 
- [ ] Service
- [ ] Engine  
- [ ] Frontend
- [ ] Agent
- [ ] Module
- [ ] Dataset
- [ ] Pipeline
- [ ] Other: _____

**Component Name:** 

**Purpose:** 

## 🗺️ Atlas Registration

> ⚠️ **Required:** All new components must be registered in the TerraFusion Atlas before merging.

**Atlas Registration Status:**
- [ ] Item registered in appropriate registry
- [ ] Atlas ID assigned: `_____________`
- [ ] Owner team assigned
- [ ] Tags added (minimum 2)
- [ ] Dependencies documented
- [ ] Source path verified

**How to register:**
```bash
cd terrafusion-atlas
python3 scripts/atlas_seed.py \
  --type <service|engine|frontend|agent|module|dataset|pipeline> \
  --id "your.component.id" \
  --name "Your Component Name" \
  --description "Brief description" \
  --owner "team-name" \
  --tags "tag1,tag2,tag3" \
  --path "src/path/to/component"
```

## 🏗️ Technical Details

**Technology Stack:**
<!-- e.g., Rust, TypeScript, Python -->

**Dependencies:**
<!-- List major dependencies -->

**APIs/Endpoints:**
<!-- If applicable -->

**Database/Storage:**
<!-- If applicable -->

## 📊 Implementation Plan

**Phase 1:**
- [ ] Task 1
- [ ] Task 2

**Phase 2:**
- [ ] Task 3
- [ ] Task 4

## ✅ Definition of Done

- [ ] Code implemented and tested
- [ ] **Atlas registration complete** (see above)
- [ ] Documentation added (README, API docs)
- [ ] Unit tests added (>80% coverage)
- [ ] Integration tests pass
- [ ] Code reviewed by 2+ team members
- [ ] No security vulnerabilities detected
- [ ] Performance benchmarks met

## 🔗 Related

**Related Atlas Items:**
<!-- Link to related services, engines, datasets -->

**Related Issues:**
<!-- Link to related GitHub issues -->

**References:**
<!-- External documentation, RFCs, etc. -->

---

**Checklist before submitting:**
- [ ] I have read the [Atlas Playbook](../terrafusion-atlas/docs/ATLAS_PLAYBOOK.md)
- [ ] I understand Atlas registration is required
- [ ] I have assigned appropriate labels
- [ ] I have identified the owner team
