# Terrafusion OS Directive

Authoritative directive: Terrafusion is an Operating System (OS), not an
application.

- The PWA is one interface layer of the OS, not the OS itself.
- Electron and Tauri shells are interface containers of the OS.
- A custom Terrafusion Browser is a native OS component.
- All modules plug into Terrafusion OS via the kernel APIs and the OS API
  Gateway.
- Deployments are county-specific and isolated (no multi-county orchestration by
  default).

## OS-First Design Paradigm

- Core Kernel: Process Manager, Memory Allocator, Module Loader, API Gateway
- Interfaces: PWA, Electron Shell, Tauri Shell, Custom Terrafusion Browser
- Modules: Loaded via OS Module Loader with sandboxed permissions
- Communication: WebSocket-first with HTTPS polling fallback

## Flexible Deployment Models

### 🏰 Sovereign County Deployment

**Complete Independence & Data Sovereignty**

- Master Node (physical server): terrafusion_core, api_gateway,
  marketplace_server, browser_distribution_server
- Satellite Terminals (VMs): connect via Terrafusion Browser using persistent
  WebSockets
- **Data Isolation**: Zero cross-county sharing, dedicated database schema per
  county
- **Infrastructure**: Independent resources, county-scoped API access
- **Security**: County-specific RBAC, isolated audit trails
- **Perfect for**: Privacy-focused counties requiring complete data sovereignty

### 🌐 Federated Counties Deployment

**Regional Cooperation & Shared Services**

- Unified API Gateway: Single point of access for multiple counties
- Shared Infrastructure: Cost-efficient resource pooling across counties
- **Cross-County Analytics**: Regional insights and comparative reporting
- **Controlled Data Sharing**: Secure collaboration between participating
  counties
- **Unified Management**: Centralized administration with county-specific
  permissions
- **Perfect for**: Cost-conscious regions seeking operational efficiency through
  cooperation

### Deployment Selection Criteria

- **Sovereign**: Choose when data sovereignty, privacy, and complete
  independence are paramount
- **Federated**: Choose when cost efficiency, regional cooperation, and shared
  analytics are priorities
- **Hybrid**: Counties can migrate between models based on changing requirements

## Security Principles

- Credentials: SecureVault
- Permissions: Role-Based Access Control (RBAC)
- Audit: Comprehensive OS-level logging
- Encryption: End-to-end where applicable

## Validation & Testing

- Use production-grade validation (see `tests/`, `scripts/`, `championship/`)
- No reliance on mock or simplified test runners for production validation

## CAMA Integrations

- Client standard: Harris PACS (Benton County converting from PACS 9.0)
- Each county tracked independently in `docs/cama/CONVERSION_TRACKER.md`
