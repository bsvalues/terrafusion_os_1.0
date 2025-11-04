# TerraFusion.API runtime quick guide

This API uses dynamic port allocation by default for frictionless local runs. Here’s how to find and fix the port for testing.

- Start (dynamic port): Use the VS Code task “Launch TerraFusion API Gateway” or run the API without --urls. The server picks an available port and prints it during startup as:
  
  "Configured URLs: http://localhost:PORT"

  A copy of the live startup output is typically written to `backend/api.out.txt` (look for the "Configured URLs:" line).

- Start (fixed port): Use the task “Launch TerraFusion API on Port 5001” to bind the API to http://localhost:5001.

- Health checks:
  - GET /health → overall process + module loader status
  - GET /api/test → basic liveness
  - GET /metrics → Prometheus metrics
  - GET /api/transcendence/health → minimal OK probe (no heavy services)

- When port is unknown:
  1) Open `backend/api.out.txt` and search for `Configured URLs:`
  2) Use that URL for browser or curl requests (e.g., `/health`, `/api/test`).

- Notes:
  - If you need a predictable port for scripts, always launch with the fixed-port task.
  - If a port check fails (connection refused), the app may still be starting. Retry after a few seconds or confirm the current port from the log.
