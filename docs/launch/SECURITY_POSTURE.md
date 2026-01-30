# TerraFusion OS: Security & Sovereignty Statement

**Executive Summary:**
TerraFusion OS v1.1.0-SOVEREIGN is engineered with a "Zero-Trust, Air-Gap First" architecture. It is designed to operate seamlessly within highly regulated government environments without requiring constant external connectivity.

---

## 1. Data Sovereignty (Where is my data?)
*   **Location:** 100% On-Premise. The database (`TerraFusion`) resides on your SQL Server instance (`jcharrispacs`).
*   **Cloud Reliance:** **None.** The core valuation engine, database, and web interface run locally.
*   **Backup:** Compatible with your existing Agency SQL Server backup policies.

## 2. Access Control (Who can see it?)
*   **Authentication:** Integrated with County Active Directory / Keycloak.
*   **Role-Based Access (RBAC):**
    *   *Appraisers:* View/Edit property data.
    *   *Auditors:* Read-only access to audit logs.
    *   *Admins:* System configuration only (cannot modify assessed values).

## 3. Network Architecture (How does it talk?)
*   **Internal Only:** The application binds to `http://localhost:5000` inside a private Docker bridge network.
*   **The Bridge:** Communication with the outside world (Host SQL) occurs via a strictly controlled internal gateway (`host.docker.internal`).
*   **Encryption:** All critical secrets (Connection Strings) are injected at runtime via memory, never stored on disk in plain text.

## 4. Compliance Readiness
*   **Audit Trails:** Every action (Value Change, Comp Selection) is logged with `Timestamp`, `User`, and `Reason`.
*   **Validation:** Input sanitization prevents SQL Injection.
*   **Dependencies:** All software libraries are pinned to specific, scanned versions (SpecLock).

*Verified by Engineering Team - January 8, 2026*
