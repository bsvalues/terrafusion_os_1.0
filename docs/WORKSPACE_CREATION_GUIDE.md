# Workspace Creation Guide

## Add a New Workspace (Backend)
1. Update `TerraFusion_Command_Portal_Starter/terrafusion-command-portal/backend/src/workspace_service.rs`:
   - Add a tuple to `get_workspace_mapping()` with the new `workspace_id`, relative path (e.g., `workspaces/<id>`), and type (`core`, `government`, `commercial`, `terra-app`, `specialized`, `system`).
2. Ensure the physical directory exists under `workspaces/<id>`.
3. Rebuild/redeploy the backend.

## Expose Workspace in Frontend FileExplorer
1. Pass the new workspace ID into `FileExplorer` via the `workspaceIds` prop.
2. Verify the FileExplorer root switches to `workspaces/<id>` and browsing works via `/api/filesystem/browse`.

## Test
1. Call backend list endpoint (or `WorkspaceService::list_workspaces`) to confirm the workspace is recognized.
2. Open the frontend and confirm the selector includes the new workspace and browsing works.
