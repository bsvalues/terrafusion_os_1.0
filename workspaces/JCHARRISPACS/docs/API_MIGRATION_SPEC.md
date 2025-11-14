# PACS API Migration Specification

Modernize legacy WCF/extended stored procedures behind a secure REST API using a strangler-fig approach. This document outlines the initial contracts, rollout, and routing/mapping to legacy assets.

## Goals

- Incrementally publish REST endpoints without breaking the PACS client.
- Introduce standard auth, versioning, and observability.
- Target 20 endpoints/year prioritized by public website and operations impact.

## Architecture Strategy

- Strangler Proxy: Route-compatible façade in front of WCF and SQL procs.
- Versioning: URL-based `v1`, `v2`; deprecate via headers and docs.
- Auth: OAuth2 client credentials/Bearer tokens; RBAC per route.
- Telemetry: Structured logs + traces; correlate to DB calls.

## Priority Domains (Wave 1)

1. Property Core

- GET /properties/{property_id}
- GET /properties/{property_id}/values?year={yyyy}
- GET /properties/search?taxlot=|address=

1. Situs/Address

- GET /situs/{property_id}

1. Ownership

- GET /owners/{owner_id}
- GET /properties/{property_id}/owners

1. Permits (CIAPS)

- GET /properties/{property_id}/permits

1. Recalculation Triggering (Ops Only)

- POST /operations/recalc/property/{property_id}

## Mapping to Legacy

- Property data → `pacs_oltp.dbo.property`, `property_val`, `situs` tables and relevant views.
- Owners → `pacs_oltp` ownership tables.
- Permits → via CIAPS synonyms to `pacs_oltp` permit tables.
- Recalc → wraps existing proc path to `xp_RecalcProperty*` (remove plaintext pw).

## Error Model

```json
{
  "error": {
    "code": "string",
    "message": "human readable",
    "correlationId": "guid"
  }
}
```

## OpenAPI (Excerpt)

```yaml
openapi: 3.0.3
info:
  title: Benton County PACS API
  version: 1.0.0
servers:
  - url: https://api.benton.gov/pacs/v1
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security:
  - bearerAuth: []
paths:
  /properties/{propertyId}:
    get:
      summary: Get property base profile
      parameters:
        - in: path
          name: propertyId
          required: true
          schema: { type: integer }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Property'
        '404': { description: Not Found }
  /properties/{propertyId}/values:
    get:
      summary: Get property values for a year
      parameters:
        - in: path
          name: propertyId
          required: true
          schema: { type: integer }
        - in: query
          name: year
          required: true
          schema: { type: integer, minimum: 1900 }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/PropertyValue' }
        '404': { description: Not Found }
components:
  schemas:
    Property:
      type: object
      properties:
        propertyId: { type: integer }
        geoId: { type: string }
        situsAddress: { type: string }
        landUse: { type: string }
    PropertyValue:
      type: object
      properties:
        year: { type: integer }
        marketValue: { type: number }
        assessedValue: { type: number }
```

## Rollout Plan

- Quarter 1: Publish GET property core and values; internal consumers only.
- Quarter 2: Add search and owners; start public website integration via proxy.
- Quarter 3: CIAPS permits read endpoints.
- Quarter 4: Controlled recalc operation endpoint (ops-only), remove plaintext credentials.

## De-Risking Notes

- Preserve DB schema; API reads via views/stored procs where stable.
- Add feature flags for endpoint exposure.
- Contract tests lock the response schema early.
