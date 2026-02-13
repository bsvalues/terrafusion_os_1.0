# MCP PostGIS Test Fixtures (Phase 12A)

This directory contains test fixtures for Phase 12A: Read-Only MCP PostGIS hardening.

## Purpose

These fixtures enable **regression immunity** for MCP PostGIS query validation. They prevent:
- SQL injection via multi-statement or string concatenation
- Write operations (INSERT/UPDATE/DELETE) in read mode
- DDL operations (CREATE/ALTER/DROP)
- Dangerous filesystem access (COPY, pg_read_file)

## Fixture Categories

### Valid Cases (READ Mode)

1. **valid-simple-select.json**
   - Basic SELECT with parameterized county filter
   - Enforces row limit (100)

2. **valid-select-with-limit.json**
   - SELECT with explicit LIMIT clause
   - Spatial function (ST_AsGeoJSON)

3. **valid-select-with-where.json**
   - SELECT with multiple WHERE parameters
   - Complex filtering (county + year + value)

4. **valid-select-join.json**
   - SELECT with JOIN across tables
   - Read-only multi-table query

5. **valid-select-aggregate.json**
   - SELECT with aggregate functions (COUNT, SUM)
   - GROUP BY clause

### Invalid Cases (Must be Rejected)

1. **invalid-insert.json**
   - INSERT statement (write operation)
   - Must reject: "Write operation not allowed in read mode"

2. **invalid-multi-statement.json**
   - Multiple statements with semicolon (SQL injection)
   - Must reject: "Multiple statements not allowed"

3. **invalid-ddl.json**
   - CREATE TABLE (DDL operation)
   - Must reject: "DDL operation not allowed"

4. **invalid-missing-params.json**
   - String literal in WHERE clause (injection risk)
   - Must reject: "Query must use parameterized inputs"

5. **invalid-dangerous-keyword.json**
   - COPY command (filesystem access)
   - Must reject: "Dangerous keyword not allowed"

## Fixture Schema

```json
{
  "description": "Human-readable test case description",
  "tool": "mcp-postgis-query",
  "mode": "read",
  "query": "SQL query with $1, $2 placeholders",
  "params": ["param1", "param2"],
  "expectedRisk": "read | write | ddl | injection",
  "expectedNormalized": "lowercase normalized query (for hashing)",
  "expectedRejection": "Error message (for invalid cases)"
}
```

## Usage in Tests

```javascript
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const fixture = JSON.parse(
  readFileSync(join(fixturesDir, 'valid-simple-select.json'), 'utf-8')
);

test('validates query against fixture', async (t) => {
  const result = await validateQuery(fixture.query, fixture.params, fixture.mode);
  assert.strictEqual(result.risk, fixture.expectedRisk);
  assert.strictEqual(result.normalized, fixture.expectedNormalized);
});
```

## Governance Contract

- **Fixtures are immutable** once committed (no silent changes)
- **New fixtures require test coverage** (add test case in phase12-mcp.*.test.mjs)
- **Breaking changes require migration plan** (fixture versioning)

---

**Last Updated:** February 13, 2026  
**Phase:** 12A (Read-Only MCP PostGIS)  
**Classification:** Test Infrastructure  
**AI-Collaboration:** claude-sonnet-4
