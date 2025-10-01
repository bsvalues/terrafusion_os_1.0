TerraFusion tfctl Quickstart

This small README describes the tfctl helper added for developer/operator workflows.

Files
- tfctl.py: control tool for launching, health-checking, and repairing the local TerraFusion stack.

Commands
- python3 tfctl.py status
  - Show API health and detected service modules.

- python3 tfctl.py launch --open
  - Launch the API and open the web shell in your browser. By default the API is started in-process (thread) so logs are visible in your terminal.

- python3 tfctl.py launch --open --fg
  - Run the API in the foreground (non-daemon thread) so it keeps the terminal attached for debugging and logs.

- python3 tfctl.py fix
  - Run best-effort repair hooks. tfctl calls small shim functions added to the service modules (auto_fix, heal_connectors, reconcile_policies, etc.).

- python3 tfctl.py logs
  - Tail logs from processes started by this tfctl session (best-effort).

- python3 tfctl.py kill
  - Terminate any detached processes that tfctl started in this session.

Notes
- The launcher prefers the repository's `desktop.api_server.TerraFusionAPI` class and calls its `run(host, port)` method in-process so logs are unified.
- Health checks use `/api/status` and related endpoints. If your API exposes different health endpoints, update `HEALTH_PATHS` in `tfctl.py`.
- Small shim repair functions were added to the services under `services/` to make `tfctl.py fix` functional without modifying core service logic. These are minimal and safe (no destructive changes).
- For native webview support, pre-install `pywebview` and set `TF_USE_NATIVE_WEBVIEW=true` before launching `desktop/web_shell.py`.

Adding more hooks
- To enable richer automated repair actions, implement the following functions in the related modules:
  - services/enhanced_ai_swarm_coordinator.py: def auto_fix(reason: str)
  - services/enhanced_terrafusion_sync.py: def heal_connectors()
  - services/security_mesh.py: def reconcile_policies()
  - services/workflow_automation.py: def repair_stalled_workflows()
  - services/terra_flow.py: def rebuild_pipelines()
  - services/government_analytics.py: def prime_caches()

Example
```
# Start locally and open UI
python3 tfctl.py launch --open

# If the API fails to reach health endpoint
python3 tfctl.py fix
python3 tfctl.py status
```
