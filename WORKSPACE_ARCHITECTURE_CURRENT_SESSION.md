# TerraFusion Workspace Architecture Analysis (CURRENT SESSION)
**Data-Driven Understanding - "The TerraFusion Way"**

## The Discovery

### 1. Backend Workspace Definition (workspace_service.rs)

**WorkspaceService::get_workspace_mapping()** defines ALL known workspaces as a hardcoded list:

```rust
vec![
    ("ai-systems", "os-platform/ai-systems", "domain"),
    ("government-core", "marketplace/government-core", "domain"),
    ("commercial", "marketplace/commercial", "domain"),
    ("infrastructure", "os-platform/infrastructure", "domain"),
    // ... 12 more workspaces
]
```

**Key Finding**: Workspaces are **NOT discovered dynamically**. They must be explicitly defined in this mapping.

### 2. Workspace Resolution Logic

- **workspace_id** (e.g., "government-core") → maps to **relative_path** (e.g., "marketplace/government-core")
- **Full path** = `{REPO_ROOT}/{relative_path}` = `/workspaces/marketplace/government-core` (in container)
- **Security**: `resolve_file_path()` validates that requested paths stay within workspace boundaries

### 3. Current Problem

**terra-levy is NOT in the hardcoded mapping!**

```
❌ "terra-levy" is NOT defined in WorkspaceService::get_workspace_mapping()
❌ Therefore: WorkspaceService::resolve_workspace_path("terra-levy") returns Error
❌ Therefore: FileSystemService cannot list or read files from terra-levy
```

### 4. How Frontend Currently Calls Backend

**FileExplorer.tsx currently does**:
```javascript
axios.post('/api/files/list', {
  workspace_id: 'terra-levy',  // ❌ NOT IN MAPPING
  path: '/'
})
```

**API Response**:
```json
{
  "error": "Unknown workspace: terra-levy",
  "files": [],
  "status": "error"
}
```

### 5. What Frontend SHOULD Do

**Option A - Use Existing Workspaces**:
```javascript
// terra-levy doesn't exist in mapping, but "government-core" does
axios.post('/api/files/list', {
  workspace_id: 'government-core',  // ✅ IS IN MAPPING
  path: '/'
})
```

**Option B - Add terra-levy to Backend Mapping**:
1. Add to `WorkspaceService::get_workspace_mapping()`:
   ```rust
   ("terra-levy", "marketplace/terra-levy", "domain"),
   ```
2. Redeploy backend
3. Then frontend can use workspace_id: "terra-levy"

### 6. Available Workspaces (from backend mapping)

| workspace_id | path | type |
|---|---|---|
| ai-systems | os-platform/ai-systems | domain |
| government-core | marketplace/government-core | domain |
| commercial | marketplace/commercial | domain |
| infrastructure | os-platform/infrastructure | domain |
| services | os-platform/services | domain |
| development | os-platform/development | domain |
| specialized | os-platform/specialized | domain |
| government-edition | marketplace/government-edition | domain |
| monitoring | os-platform/monitoring | domain |
| auth | os-platform/auth | domain |
| security | os-platform/security | domain |
| consciousness | os-platform/consciousness | domain |
| engines | os-platform/engines | domain |
| performance | os-platform/performance | domain |
| trust | os-platform/trust | domain |

### 7. Available on Disk (in /workspaces/marketplace/)

These exist but are NOT in the mapping:
- terra-bank ❌
- terra-collections ❌
- terra-flow ❌
- terra-fusion-dashboard ❌
- terra-fusion-sync ❌
- terra-insight ❌
- terra-justice ❌
- **terra-levy** ❌
- terra-net ❌
- terra-sync ❌
- terra-university ❌

## Decision: The TerraFusion Way

### Three Options

**Option 1: Hardcoded Approach (Current)**
- Pros: Simple, explicit, secure
- Cons: Must redeploy backend to add workspaces
- Action: Add all terra-* workspaces to WorkspaceService::get_workspace_mapping()

**Option 2: Dynamic Discovery**
- Pros: Auto-discovers workspaces from filesystem
- Cons: More complex, requires initialization logic
- Action: Add filesystem scanning during backend init

**Option 3: Database Registry**
- Pros: Admin UI to manage workspaces
- Cons: Requires DB schema and admin panel
- Action: Create workspaces table, admin API

### Recommendation

**Use Option 1 with planned Option 2**:
1. ✅ Immediately add all terra-* workspaces to WorkspaceService::get_workspace_mapping()
2. ✅ Rebuild backend container
3. ✅ Frontend can then browse any terra-* workspace
4. ✅ Plan: Implement Option 2 (dynamic discovery) as enhancement

**Why**:
- Data-driven: We understand exactly what workspaces exist
- Explicit: Clear mapping visible in code
- Quick: 5-minute fix
- Secure: Doesn't auto-expose random directories
- Right First Time: No undo needed later

---

## Next Steps (Data-Driven Order)

1. **[TODO]** Verify that all terra-* directories have valid content
2. **[TODO]** Add all terra-* to WorkspaceService::get_workspace_mapping()
3. **[TODO]** Rebuild backend container with new mapping
4. **[TODO]** Test: Verify backend returns terra-levy in workspace list
5. **[TODO]** Update Frontend: Modify FileExplorer to use workspace selector
6. **[TODO]** Integration Test: End-to-end file browsing

