# 🔧 Atlas Maintenance Guide

**Last Updated:** October 5, 2025  
**Maintainers:** @platform-team

---

## 📅 Regular Maintenance Schedule

### Daily (Automated)
- ✅ CI/CD validation on every PR
- ✅ Pre-commit hooks block invalid registrations
- ✅ GitHub Actions check for duplicates

### Weekly
- [ ] Review new registrations (every Monday)
- [ ] Check health dashboard
- [ ] Address critical issues
- [ ] Review and respond to questions in #atlas-help

### Monthly
- [ ] Run comprehensive health check
- [ ] Update lifecycle statuses
- [ ] Review and improve tagging
- [ ] Clean up stale/archived items
- [ ] Generate and distribute metrics report

### Quarterly
- [ ] Full Atlas audit
- [ ] Review and update documentation
- [ ] Evaluate process improvements
- [ ] Update partner packages
- [ ] Strategic planning for next quarter

---

## 🔍 Health Monitoring

### Run Health Check

```bash
cd terrafusion-atlas
python3 scripts/atlas_health_check.py
```

**Expected Output:**
- Overall health score: 90%+
- Ownership coverage: 100%
- Tagging coverage: 80%+
- No duplicate IDs
- No broken paths

### Key Metrics to Track

| Metric | Target | Action if Below Target |
|--------|--------|------------------------|
| **Ownership Coverage** | 100% | Assign owners immediately |
| **Tagging Coverage** | 80% | Monthly tag improvement sprint |
| **Description Quality** | 90% | Review and improve descriptions |
| **Path Validity** | 95% | Update or remove stale items |
| **Duplicate IDs** | 0 | Fix immediately (critical) |

---

## 🧹 Common Maintenance Tasks

### 1. Add New Item

```bash
cd terrafusion-atlas
python3 scripts/atlas_seed.py \
  --type service \
  --id "new.service.id" \
  --name "New Service" \
  --description "What it does" \
  --owner "platform-team" \
  --tags "api,backend" \
  --path "src/services/new-service"
```

### 2. Update Existing Item

Manually edit the registry file:

```bash
# Open the appropriate registry
vim registries/services.json

# Find your item by ID
# Update fields as needed
# Save and validate
python3 scripts/atlas_validate.py
```

### 3. Remove Obsolete Item

```bash
# Open registry file
vim registries/services.json

# Delete the item's JSON object
# Validate
python3 scripts/atlas_validate.py

# Check for broken dependencies
python3 scripts/atlas_health_check.py | grep -A 10 "DEPENDENCIES"
```

### 4. Bulk Update Tags

```python
# Create a script: update_tags.py
import json
from pathlib import Path

registry_file = Path('registries/services.json')
with open(registry_file) as f:
    data = json.load(f)

for item in data['items']:
    if 'api' not in item.get('tags', []):
        item.setdefault('tags', []).append('api')

with open(registry_file, 'w') as f:
    json.dump(data, f, indent=2)

print("✅ Tags updated")
```

### 5. Update Lifecycle Statuses

```bash
# Run interactive update
python3 -c "
import json
from pathlib import Path

for reg_file in Path('registries').glob('*.json'):
    with open(reg_file) as f:
        data = json.load(f)
    
    for item in data['items']:
        if item.get('lifecycle') == 'unknown':
            print(f\"Update {item.get('id')}?\")
            # Set to appropriate status
            item['lifecycle'] = 'active'  # or experimental, deprecated
    
    with open(reg_file, 'w') as f:
        json.dump(data, f, indent=2)
"
```

### 6. Find Unregistered Components

```bash
python3 scripts/check_unregistered.py | head -20
```

### 7. Generate Export for Stakeholders

```bash
python3 scripts/atlas_export.py
# Creates CSV, JSON, Markdown, and HTML exports
```

### 8. Regenerate Visualizations

```bash
python3 scripts/generate_visuals.py
# Updates architecture diagrams
```

### 9. Rebuild Partner Packages

```bash
python3 scripts/build_partner_deliverables.py
# Creates new ZIP archives for all partners
```

---

## 🚨 Handling Issues

### Issue: Duplicate ID Detected

**Symptoms:**
- Validation fails
- CI/CD pipeline red
- Health check shows duplicates

**Solution:**
```bash
# Find duplicates
python3 scripts/atlas_health_check.py | grep -A 5 "DUPLICATE"

# Rename one of the IDs
vim registries/services.json
# Change one ID to be unique, e.g., "old.service" → "old.service.v2"

# Validate
python3 scripts/atlas_validate.py
```

### Issue: Broken Dependency

**Symptoms:**
- Health check shows broken dependencies
- Component references missing item

**Solution:**
```bash
# Find broken dependencies
python3 scripts/atlas_health_check.py | grep -A 10 "DEPENDENCIES"

# Option 1: Register the missing dependency
python3 scripts/atlas_seed.py --type service --id "missing.service" ...

# Option 2: Remove the dependency reference
vim registries/services.json
# Remove the broken dependency from "depends_on" array
```

### Issue: Invalid Path

**Symptoms:**
- Path validation fails
- Health check shows invalid paths
- Component not found

**Solution:**
```bash
# Find invalid paths
python3 scripts/atlas_health_check.py | grep -A 10 "PATHS"

# Option 1: Update to correct path
vim registries/services.json
# Update "source_path" to actual location

# Option 2: Remove stale item if component no longer exists
# Delete the item from registry

# Validate
python3 scripts/atlas_validate.py
```

### Issue: Low Tagging Coverage

**Symptoms:**
- Health score below target
- Poor discoverability
- Hard to filter items

**Solution:**
```bash
# Find items without tags
python3 scripts/atlas_health_check.py | grep -A 10 "TAGGING"

# Create bulk tag update script
cat > add_tags.py << 'EOF'
import json
from pathlib import Path

for reg_file in Path('registries').glob('*.json'):
    with open(reg_file) as f:
        data = json.load(f)
    
    updated = 0
    for item in data['items']:
        if len(item.get('tags', [])) < 2:
            # Add relevant tags based on registry and name
            registry = reg_file.stem
            item.setdefault('tags', []).append(registry)
            
            # Add more specific tags
            name = item.get('name', '').lower()
            if 'api' in name:
                item['tags'].append('api')
            if 'ai' in name or 'agent' in name:
                item['tags'].append('ai')
            # ... add more logic
            
            updated += 1
    
    if updated > 0:
        with open(reg_file, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"✅ Updated {updated} items in {reg_file.name}")
EOF

python3 add_tags.py
```

---

## 📊 Monthly Health Report Template

```markdown
# Atlas Health Report - [Month Year]

## Executive Summary
- Total Items: [X]
- Registries: 14
- Overall Health: [X]%
- New Items This Month: [X]
- Items Removed: [X]

## Key Metrics
- Ownership Coverage: [X]%
- Tagging Coverage: [X]%
- Description Quality: [X]%
- Path Validity: [X]%
- Zero Duplicates: ✅/❌

## Issues Identified
1. [Issue 1]
2. [Issue 2]

## Actions Taken
1. [Action 1]
2. [Action 2]

## Next Month Goals
1. [Goal 1]
2. [Goal 2]

## Team Feedback
- [Feedback 1]
- [Feedback 2]
```

---

## 🔄 Backup & Recovery

### Create Backup

```bash
# Automated daily backup
cd terrafusion-atlas
tar -czf "../atlas-backup-$(date +%Y%m%d).tar.gz" registries/ schemas/

# Or use git
git add registries/
git commit -m "Atlas backup $(date +%Y%m%d)"
git push
```

### Restore from Backup

```bash
# From tarball
tar -xzf atlas-backup-20251005.tar.gz

# From git
git checkout <commit-hash> -- registries/

# Validate after restore
python3 scripts/atlas_validate.py
```

---

## 🎓 Training New Maintainers

**Onboarding Checklist:**

1. **Week 1: Understand the System**
   - [ ] Read all documentation
   - [ ] Review existing registries
   - [ ] Run all CLI tools
   - [ ] View architecture diagrams

2. **Week 2: Practice**
   - [ ] Add a test item
   - [ ] Run health check
   - [ ] Fix a validation error
   - [ ] Generate exports

3. **Week 3: Real Tasks**
   - [ ] Review new registrations
   - [ ] Update lifecycle statuses
   - [ ] Respond to questions
   - [ ] Create weekly report

4. **Week 4: Full Access**
   - [ ] Own a maintenance cycle
   - [ ] Handle an issue
   - [ ] Improve documentation
   - [ ] Train next person

---

## 📞 Support Escalation

**Level 1: Self-Service**
- Documentation
- Health check tool
- Validation scripts

**Level 2: Team Support**
- #atlas-help Slack channel
- Office hours (Tuesdays 2-3pm)
- Ask @platform-team

**Level 3: Emergency**
- Critical duplicate IDs
- Data corruption
- System outage
- Contact: @platform-team (urgent)

---

## 🎯 Continuous Improvement

### Process Improvements

**Monthly Review Questions:**
1. What friction points did teams encounter?
2. Which tasks are most time-consuming?
3. What can be automated further?
4. How can we improve documentation?
5. Are there missing features?

**Improvement Ideas:**
- Auto-suggest tags based on name/description
- GitHub bot for Atlas operations
- Slack integration for queries
- VS Code extension
- API for programmatic access

---

## 📈 Success Metrics

Track these KPIs:

- **Adoption Rate:** % of new components registered
- **Health Score:** Overall Atlas health percentage
- **Resolution Time:** How fast issues are fixed
- **User Satisfaction:** Developer feedback scores
- **Coverage:** % of codebase cataloged
- **Partner Satisfaction:** Partner feedback on deliverables

**Target KPIs:**
- Adoption: 95%+
- Health Score: 90%+
- Resolution Time: < 24 hours
- User Satisfaction: 4+/5
- Coverage: 95%+

---

**Remember:** The Atlas is a living system. Regular maintenance keeps it valuable and trusted by the entire team.

*Last reviewed: October 5, 2025*
