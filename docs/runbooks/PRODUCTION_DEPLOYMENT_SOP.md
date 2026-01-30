# PRODUCTION DEPLOYMENT STANDARD OPERATING PROCEDURE (SOP)
# Target: Sovereign Host (jcharrispacs)
# Version: v1.1.0-sov

## 1. Transport (The Hand-off)
1.  Locate `dist/TerraFusion_v1.1.0_SOVEREIGN.zip` on the build machine.
2.  Securely copy this file to the target server: `jcharrispacs`.
    *   **Destination**: `C:\TerraFusion_Install\` (Create if needed).

## 2. Unpack (The Landing)
On `jcharrispacs`:
1.  Open PowerShell as Administrator.
2.  Navigate to destination: `Set-Location C:\TerraFusion_Install`
3.  Extract the artifact:
    ```powershell
    Expand-Archive -Path TerraFusion_v1.1.0_SOVEREIGN.zip -DestinationPath C:\TerraFusion -Force
    ```
4.  Navigate to the runtime directory:
    ```powershell
    Set-Location C:\TerraFusion\v1.1.0-sov
    ```

## 3. Host Prep (The Foundation)
1.  Run the host setup script to check prerequisites (Docker, Ports, Directories):
    ```powershell
    .\setup_host.ps1
    ```
    *   *Resolve any errors before proceeding.*

## 3. Configure (The Injection)
1.  Rename the secrets template:
    ```powershell
    Rename-Item secrets.env secrets.prod.env
    ```
2.  **CRITICAL**: Edit `secrets.prod.env` with the actual production values.
    ```powershell
    notepad secrets.prod.env
    ```
    *   Set `ConnectionStrings__DefaultConnection` password.
    *   Set `TerraFusion__Auth__KeycloakSecret` password.
    *   Ensure `Server=host.docker.internal` is preserved.
3.  Verify the configuration:
    ```powershell
    .\verify.ps1
    ```
    *   *Must return "✅ Secrets appear valid".*

## 4. Ignite (The Launch)
1.  Start the stack:
    ```powershell
    docker compose up -d
    ```
    *(Optional: Include observability if requested)*
    ```powershell
    docker compose -f docker-compose.yml -f docker-compose.obs.yml up -d
    ```

## 5. Verify (The Pulse)
1.  Wait for services to stabilize (approx. 30 seconds).
2.  Check container status:
    ```powershell
    docker compose ps
    ```
3.  Check health endpoints:
    ```powershell
    Invoke-WebRequest http://localhost:5000/health
    ```
    *   *Expected: 200 OK*
