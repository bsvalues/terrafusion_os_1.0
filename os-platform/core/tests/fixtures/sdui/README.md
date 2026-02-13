# SDUI Test Fixtures

Test schemas for Phase 10 SDUI validation and policy enforcement.

## Valid Schemas

### valid-minimal.json
Basic Text component - simplest valid schema.

### valid-property-card.json
PropertyCard component with government property data.

### valid-table.json
Table component with column definitions and data rows.

### valid-with-action-intent.json
Button with read action intent - demonstrates safe action pattern.

### valid-write-with-owner.json
Button with write action intent + ownerLane - demonstrates governance boundary.

## Invalid Schemas (Should be Rejected)

### invalid-unknown-component.json
Unknown component type (not in allowlist) - tests component rejection.

### invalid-inline-code.json
Button with inline onClick/onEvent handlers - tests code safety guard.

### invalid-write-missing-owner.json
Write action without ownerLane specification - tests write lane policy.

## Usage

These fixtures are imported by:
- `phase10-sdui.parse.test.mjs` - Module import and export tests
- `phase10-sdui.policy.test.mjs` - Governance boundary enforcement tests

## Governance Invariants

All schemas enforce:
- **Component Allowlist:** Text, Card, Table, PropertyCard, Button only
- **Action Intents:** No inline code execution (onClick/onEvent forbidden)
- **Write Lane Policy:** Write actions require ownerLane (dev/governance/security/ui)
- **Code Safety:** No eval, no Function constructor, no dynamic code execution
- **Read-Safe Default:** Actions as tool intents with explicit risk levels
