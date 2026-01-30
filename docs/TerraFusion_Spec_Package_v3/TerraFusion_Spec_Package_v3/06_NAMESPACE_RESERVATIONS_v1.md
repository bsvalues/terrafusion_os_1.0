# Namespace Reservations + Collision Avoidance (v1)

## Purpose
Prevent future elected-office suites (Clerk/Treasurer/Auditor) from colliding with Assessor suites.

## Reserved suite names (future)
- TerraClerk
- TerraTreasury
- TerraAudit (or TerraAuditor)
- TerraRecorder (optional)

## Reserved module prefixes
- terra-clerk-*
- terra-treasury-*
- terra-audit-*
- terra-recorder-*

## Assessor admin suite (locked)
- TerraDais
- Allowed module prefixes: terra-levy, terra-pilt, terra-permit, terra-exempt, terra-appeal, terra-notice, terra-cert, terra-queue

## Naming lint rules
- “Tara*” is invalid
- Suites: TerraXxx (PascalCase)
- Module IDs: terra-xxx (kebab-case)
- Workbench tab slugs: forge|atlas|dais|dossier|pilot
