# ADR-001: Multi-Tenant Architecture

## Status

Accepted

## Context

Terrafusion needs to support multiple government entities (counties, states, federal agencies) while ensuring:

- Complete data isolation between tenants
- Efficient resource utilization
- Scalability to thousands of tenants
- Compliance with government security requirements
- Cost-effective operations

We evaluated three approaches:

1. **Separate Database per Tenant**: Each tenant gets their own database
2. **Shared Database, Separate Schema**: All tenants share a database but have separate schemas
3. **Shared Database, Shared Schema**: All tenants share the same schema with row-level security

## Decision

We will implement **Shared Database, Separate Schema** approach with the following architecture:

- Single PostgreSQL cluster with separate schemas per tenant
- Row-level security (RLS) as an additional security layer
- Tenant identification through subdomain (e.g., county1.terrafusion.gov)
- Connection pooling with tenant-aware routing

## Rationale

### Advantages of Chosen Approach

1. **Security**: Schema isolation provides strong boundaries
2. **Performance**: Easier to optimize and index per tenant
3. **Maintenance**: Can update schemas independently
4. **Compliance**: Clear data boundaries for auditing
5. **Backup/Restore**: Can backup/restore individual tenants

### Implementation Details

```sql
-- Tenant schema creation
CREATE SCHEMA IF NOT EXISTS tenant_${tenant_id};

-- Set search path for tenant
SET search_path TO tenant_${tenant_id}, shared, public;

-- Row-level security as additional layer
CREATE POLICY tenant_isolation ON sensitive_data
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### Tenant Resolution Flow

```typescript
// Middleware for tenant resolution
export async function resolveTenant(req: Request): Promise<string> {
  // 1. Check subdomain
  const subdomain = req.hostname.split(".")[0];

  // 2. Validate tenant exists
  const tenant = await tenantRepository.findByDomain(subdomain);
  if (!tenant) throw new TenantNotFoundError();

  // 3. Set tenant context
  await db.setTenantContext(tenant.id);

  return tenant.id;
}
```

## Consequences

### Positive

- Clear isolation between tenants
- Easier compliance with data residency requirements
- Simplified backup and disaster recovery per tenant
- Better performance isolation
- Easier to implement tenant-specific customizations

### Negative

- More complex database administration
- Higher memory usage (schema objects per tenant)
- Schema migration must be run for each tenant
- Connection pool management is more complex

### Mitigation Strategies

1. **Automated Schema Management**: Build tools for automated schema creation and migration
2. **Connection Pool Optimization**: Implement smart connection pooling with tenant affinity
3. **Monitoring**: Add tenant-aware monitoring and alerting
4. **Migration Tools**: Create robust migration tools that handle all tenant schemas

## References

- [PostgreSQL Schema Documentation](https://www.postgresql.org/docs/current/ddl-schemas.html)
- [Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-tenant SaaS Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/overview)
