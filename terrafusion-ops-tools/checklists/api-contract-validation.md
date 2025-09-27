# Terrafusion API Contract Validation Checklist

## Overview

This checklist ensures API compatibility between the original and new
Terrafusion systems, preventing integration issues during migration.

## Pre-Validation Setup

### 1. API Inventory

- [ ] List all REST endpoints from original backend
- [ ] List all REST endpoints from new backend
- [ ] Document any GraphQL endpoints
- [ ] Identify WebSocket connections
- [ ] Note any third-party API integrations

### 2. Documentation Gathering

- [ ] Original API documentation (Swagger/OpenAPI)
- [ ] New API documentation
- [ ] Postman/Insomnia collections
- [ ] Example requests/responses
- [ ] Authentication flow documentation

## Endpoint Validation

### For Each API Endpoint:

#### 1. Endpoint Matching

- [ ] URL path matches (or document mapping)
- [ ] HTTP method matches (GET, POST, PUT, DELETE, PATCH)
- [ ] Query parameters supported
- [ ] Path parameters handled correctly
- [ ] Request headers requirements

#### 2. Request Validation

**Request Body Structure**

```json
// Document expected format for each endpoint
{
  "field1": "type and constraints",
  "field2": "required/optional",
  "nested": {
    "subfield": "validation rules"
  }
}
```

- [ ] All required fields present
- [ ] Field types match (string, number, boolean, array, object)
- [ ] Field names match exactly (case-sensitive)
- [ ] Nested object structures preserved
- [ ] Array item types consistent
- [ ] Date/time format compatibility
- [ ] File upload handling (multipart/form-data)

#### 3. Response Validation

**Response Structure**

```json
// Expected response format
{
  "status": "success/error",
  "data": {
    "id": "string",
    "results": []
  },
  "meta": {
    "pagination": {}
  }
}
```

- [ ] Status codes match (200, 201, 400, 401, 403, 404, 500)
- [ ] Response body structure matches
- [ ] Field names and types consistent
- [ ] Pagination format preserved
- [ ] Error response format compatible
- [ ] Response headers present

#### 4. Authentication & Authorization

- [ ] Authentication method compatible (Bearer token, API key, OAuth)
- [ ] Token format matches
- [ ] Permission requirements same
- [ ] Role-based access preserved
- [ ] Session handling compatible

## Validation Test Cases

### 1. Happy Path Tests

```bash
# Example test script
curl -X POST https://api.terrafusion.com/v1/projects \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project", "type": "construction"}'
```

- [ ] Create operations work
- [ ] Read operations return expected data
- [ ] Update operations apply changes
- [ ] Delete operations remove data
- [ ] List operations include filtering/sorting

### 2. Edge Cases

- [ ] Empty request bodies handled
- [ ] Missing required fields rejected
- [ ] Invalid data types rejected
- [ ] Oversized payloads handled
- [ ] Special characters in strings
- [ ] Null vs undefined handling
- [ ] Empty arrays vs missing arrays

### 3. Error Scenarios

- [ ] 400 Bad Request format
- [ ] 401 Unauthorized response
- [ ] 403 Forbidden response
- [ ] 404 Not Found response
- [ ] 422 Validation Error details
- [ ] 500 Server Error handling
- [ ] Rate limiting responses

### 4. Performance Tests

- [ ] Response time acceptable (<500ms for most endpoints)
- [ ] Large dataset handling
- [ ] Concurrent request handling
- [ ] Rate limiting implemented
- [ ] Timeout handling

## API Comparison Matrix

| Endpoint                  | Original | New | Status    | Notes                         |
| ------------------------- | -------- | --- | --------- | ----------------------------- |
| POST /auth/login          | ✅       | ✅  | Matched   | Returns JWT token             |
| GET /api/projects         | ✅       | ✅  | Matched   | Pagination working            |
| POST /api/projects        | ✅       | ⚠️  | Different | New requires 'category' field |
| GET /api/costs/calculate  | ✅       | ❌  | Missing   | Needs implementation          |
| POST /api/ai/predict      | ✅       | ❌  | Missing   | AI engine integration pending |
| DELETE /api/projects/:id  | ✅       | ✅  | Matched   | Soft delete implemented       |
| GET /api/reports/generate | ✅       | ⚠️  | Different | New uses async job queue      |
| WebSocket /ws/updates     | ❌       | ✅  | New       | Real-time updates added       |

## Breaking Changes Documentation

### Fields Renamed

```
Original -> New
project_name -> name
cost_estimate -> estimated_cost
created_date -> created_at
is_active -> active
```

### New Required Fields

```
- category (in projects)
- timezone (in user profile)
- currency (in cost estimates)
```

### Deprecated Endpoints

```
- GET /api/legacy/costs (use /api/costs instead)
- POST /api/batch/process (use queue system)
```

### Response Format Changes

```
// Original
{
  "success": true,
  "result": {...}
}

// New
{
  "status": "success",
  "data": {...},
  "meta": {...}
}
```

## Migration Strategy

### 1. API Versioning

- [ ] Implement API versioning (/v1, /v2)
- [ ] Maintain backward compatibility
- [ ] Set deprecation timeline
- [ ] Document version differences

### 2. Frontend Adapter

```javascript
// Example adapter pattern
class APIAdapter {
  async getProjects(params) {
    const response = await newAPI.getProjects(params);
    return this.transformToOldFormat(response);
  }

  transformToOldFormat(newData) {
    return {
      success: newData.status === 'success',
      result: newData.data,
      // Map other fields
    };
  }
}
```

### 3. Gradual Migration

- [ ] Implement feature flags
- [ ] Route traffic progressively
- [ ] Monitor error rates
- [ ] Rollback plan ready

## Validation Tools

### 1. Automated Testing

```javascript
// Example contract test
describe('API Contract Tests', () => {
  test('GET /api/projects matches contract', async () => {
    const response = await api.get('/api/projects');
    expect(response.status).toBe(200);
    expect(response.data).toMatchSchema(projectListSchema);
  });
});
```

### 2. Contract Testing Tools

- [ ] Pact for consumer-driven contracts
- [ ] Postman contract tests
- [ ] OpenAPI diff tools
- [ ] Custom validation scripts

### 3. Monitoring

- [ ] API response time monitoring
- [ ] Error rate tracking
- [ ] Contract violation alerts
- [ ] Usage analytics

## Sign-off Checklist

### Technical Review

- [ ] All endpoints documented
- [ ] Breaking changes identified
- [ ] Migration path defined
- [ ] Performance benchmarks met
- [ ] Security review completed

### Stakeholder Approval

- [ ] Frontend team sign-off
- [ ] Mobile team sign-off (if applicable)
- [ ] QA team validation
- [ ] Product owner approval
- [ ] Operations readiness

## Rollback Plan

1. **Immediate Rollback Triggers**
   - Error rate > 5%
   - Response time > 2x baseline
   - Authentication failures
   - Data corruption detected

2. **Rollback Steps**
   - Revert load balancer configuration
   - Restore previous API version
   - Clear caches
   - Notify stakeholders
   - Post-mortem analysis

## Contact Information

- **API Team Lead**: api-team@terrafusion.com
- **On-call Engineer**: +1-XXX-XXX-XXXX
- **Escalation**: engineering-leads@terrafusion.com
