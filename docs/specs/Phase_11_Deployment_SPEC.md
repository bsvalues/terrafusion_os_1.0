# Phase 11: Production Site Prep - SPEC

**Feature**: Production Host Preparation ("The Landing Zone")
**Goal**: Prepare the physical host (`jcharrispacs`) to host the Sovereign OS.

---

## 1. Directives

### A. Host Environment
- **Target**: `jcharrispacs` (Windows Server)
- **Runtime**: Docker Desktop for Windows (Assumed, as it handles WSL2 and networking gracefully on mixed environments).
- **Network**: Service runs on Host Ports `80` (Frontend), `5000` (Iron), `8006` (Cortex).
- **Storage**: Persistent data maps to `C:\TerraFusion\Data`.

### B. Database Strategy (The Neural Link)
- **Concept**: "Brain on Container, Memory on Host".
- **Implementation**:
    - Containers connect to Host MSSQL via `host.docker.internal` (Docker Desktop DNS).
    - **Phase 11.2** will handle the code switch (`UseSqlServer`).
    - **This Phase**: Prepare connectivity and firewall rules.

### C. Security
- **Secrets**: Injected via `secrets.prod.env` (managed by Ops, never committed).
- **Firewall**: Ensure inbound traffic allowed on `80`, `443` (future).

---

## 2. Artifact Definition

### 1. `ops/prod/docker-compose.prod.server.yml`
- **Base**: `docker-compose.prod.yml`
- **Modifications**:
    - **Images**: Pinned to `v1.1.0-SOVEREIGN` digests.
    - **Restart Policy**: `always`.
    - **Extra Hosts**: `host.docker.internal:host-gateway` (for MSSQL access).
    - **Logging**: JSON driver with limits (prevent disk saturation).
    - **Environment**: Reads from `secrets.prod.env`.

### 2. `ops/prod/setup_host.ps1`
- **Purpose**: "One-click" site prep.
- **Actions**:
    - Create `C:\TerraFusion\Data\{logs,postgres,redis}`.
    - Test ports `80, 5000, 8006`.
    - Validate Docker Engine is running.
    - Check for `secrets.prod.env` existence.

### 3. `ops/prod/secrets_template.env`
- **Purpose**: Template for the "Operational Key".
- **Content**: Empty keys for `OPENAI_API_KEY`, `MSSQL_CONNECTION_STRING`, `JWT_SECRET`.

## 3. Execution Plan
1.  Generate Artifacts.
2.  Run `setup_host.ps1 -DryRun` to verify.
3.  Commit Infrastructure-as-Code.

