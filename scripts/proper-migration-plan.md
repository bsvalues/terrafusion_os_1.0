# Proper Migration Plan - Missing Systems

## Current Status

- Found 15 missing systems totaling 1.47GB and 31,733 files
- Need to do REAL file copying, not just MCP boilerplate generation
- Need proper naming conventions

## Missing Systems (by priority/size):

### TIER 1 - Large Systems (>100MB)

1. **TerraFusionDashboard_PRODUCTION** - 945.27MB, 26,738 files →
   `src-enhanced/terrafusion-dashboard`
2. **BCBSGISPRO_PRODUCTION** - 306.62MB, 890 files →
   `src-enhanced/terrafusion-gis` (rename to Terra)
3. **MCP_Servers_PRODUCTION** - 64.63MB, 242 files →
   `src-enhanced/mcp-servers-production`

### TIER 2 - Medium Systems (10-100MB)

4. **TerraFusionSync_PRODUCTION_OLD_BACKUP** - 49.82MB, 1,587 files →
   `src-enhanced/terrafusion-sync-backup`
5. **TerraFusionPlayground-main** - 46.27MB, 1,433 files →
   `src-enhanced/terrafusion-playground-main`

### TIER 3 - Small Systems (<10MB)

6. **TerraFusionProPlus_PRODUCTION** - 5.15MB, 328 files →
   `src-enhanced/terrafusion-pro-plus`
7. **TerraFusionPrimeView_PRODUCTION** - 1.7MB, 191 files →
   `src-enhanced/terrafusion-prime-view`
8. **SystemPrompts_AI_Tools_PRODUCTION** - 1.5MB, 181 files →
   `src-enhanced/system-prompts-ai-tools`
9. **TerraFusionV0Demo_PRODUCTION** - 1.39MB, 188 files →
   `src-enhanced/terrafusion-v0-demo`
10. **TerraFusionGama_PRODUCTION** - 0.42MB, 97 files →
    `src-enhanced/terrafusion-gama`
11. **TerraFusion_NextGen_Elite_Execution** - 0.28MB, 28 files →
    `src-enhanced/terrafusion-nextgen-elite`
12. **TerraFusion-Enterprise** - 0.04MB, 33 files →
    `src-enhanced/terrafusion-enterprise`
13. **TerraFusionEcosystem_PRODUCTION** - 0.02MB, 2 files →
    `src-enhanced/terrafusion-ecosystem`
14. **SECURITY_PRODUCTION** - 0.02MB, 4 files →
    `src-enhanced/security-production`
15. **MONITORING_PRODUCTION** - 0.01MB, 4 files →
    `src-enhanced/monitoring-production`

## Additional Tasks:

- Rename `bsincomevaluation-production` → `terrafusion-income`
- Verify all existing migrations are complete and accurate

## Migration Process (REAL this time):

1. Create target directory structure
2. Copy ALL source files (not just count them)
3. Preserve file structure and permissions
4. Create proper integration points
5. Verify file counts match exactly
6. Document what was actually moved

No fake confidence percentages. No treasure language. Just real work.
