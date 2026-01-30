# TerraFusion Spec-Lock Templates

> Standardized contract language for APIs, UIs, Metrics, and Alerts

**Version**: 1.0.0
**Status**: ACTIVE

---

## Overview

Spec-Lock documents **freeze contracts** before implementation. They enable:

1. **Contract-first development** — Define before code
2. **Drift detection** — Tests fail if reality ≠ spec
3. **Change control** — Version bumps required for modifications
4. **Team alignment** — Everyone uses same contract language

---

## Template Index

| Template | Use For | File Pattern |
|----------|---------|--------------|
| [API](#api-spec-lock) | REST/GraphQL endpoints | `API_SPEC_LOCK_vX.Y.Z.md` |
| [UI](#ui-spec-lock) | React components | `UI_SPEC_LOCK_vX.Y.Z.md` |
| [Metrics](#metrics-spec-lock) | Prometheus metrics | `METRICS_SPEC_LOCK_vX.Y.Z.md` |
| [Dashboard](#dashboard-spec-lock) | Grafana dashboards | `DASHBOARD_SPEC_LOCK_vX.Y.Z.md` |
| [Alerts](#alerts-spec-lock) | Prometheus alerts | `ALERTS_SPEC_LOCK_vX.Y.Z.md` |
| [Events](#events-spec-lock) | SSE/WebSocket/Message Bus | `EVENTS_SPEC_LOCK_vX.Y.Z.md` |

---

## API Spec-Lock

```markdown
# {{Feature Name}} API Spec Lock v1.0.0

Status: **FROZEN**
Last Updated: {{date}}
Author: {{author}}

---

## 1) Purpose

### What This API Does
- Brief description of functionality

### Non-Goals
- What this API explicitly does NOT do

---

## 2) Endpoints

### POST /api/{{resource}}

**Description**: Create a new {{resource}}

**Authentication**: JWT Bearer (required)

**Authorization**: 
- Role: `county_admin`
- County: Must match `county_id` in body

**Request Headers**:
| Header | Required | Value |
|--------|----------|-------|
| Authorization | ✅ | Bearer {{token}} |
| Content-Type | ✅ | application/json |
| X-Request-Id | ❌ | UUID (for tracing) |

**Request Body**:
```json
{
  "county_id": "string (required, GUID)",
  "name": "string (required, 1-255 chars)",
  "config": {
    "enabled": "boolean (default: true)",
    "threshold": "number (0-100, default: 50)"
  }
}
```

**Response: 201 Created**
```json
{
  "id": "string (GUID)",
  "county_id": "string (GUID)",
  "name": "string",
  "config": { ... },
  "created_at": "string (ISO 8601)",
  "created_by": "string (user_id)"
}
```

**Response: 400 Bad Request**
```json
{
  "error": "string (human readable)",
  "code": "string (machine code)",
  "details": { ... }
}
```

**Error Codes**:
| Code | Meaning |
|------|---------|
| VALIDATION_FAILED | Request body validation failed |
| DUPLICATE_NAME | Resource with this name already exists |

**Response: 401 Unauthorized**
```json
{
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

**Response: 403 Forbidden**
```json
{
  "error": "Access denied to county",
  "code": "COUNTY_ACCESS_DENIED"
}
```

---

### GET /api/{{resource}}/{id}

**Description**: Get {{resource}} by ID

**Path Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| id | GUID | ✅ | Resource identifier |

**Query Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| include | string | ❌ | none | Comma-separated relations |

**Response: 200 OK**
```json
{
  "id": "string (GUID)",
  "county_id": "string (GUID)",
  ...
}
```

**Response: 404 Not Found**
```json
{
  "error": "Resource not found",
  "code": "RESOURCE_NOT_FOUND"
}
```

---

## 3) Deterministic Examples

### Example 1: Create Resource (Happy Path)

**Request**:
```http
POST /api/runbooks HTTP/1.1
Host: api.terrafusion.gov
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "county_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Daily Backup",
  "config": {
    "enabled": true,
    "threshold": 75
  }
}
```

**Response**:
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "county_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Daily Backup",
  "config": {
    "enabled": true,
    "threshold": 75
  },
  "created_at": "2025-01-15T10:30:00Z",
  "created_by": "user-123"
}
```

### Example 2: Validation Error

**Request**:
```http
POST /api/runbooks HTTP/1.1
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "county_id": "",
  "name": ""
}
```

**Response**:
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Validation failed",
  "code": "VALIDATION_FAILED",
  "details": {
    "county_id": "County ID is required",
    "name": "Name is required"
  }
}
```

---

## 4) Forbidden Changes

The following MUST NOT change without a version bump:

- Route paths
- HTTP methods
- Required fields
- Response structure
- Error codes
- Authentication requirements
- County isolation logic

---

## 5) Validation Rules

Tests enforce this spec via:

```csharp
[Fact]
public async Task CreateResource_ValidRequest_Returns201()
{
    // Exact response structure validation
}

[Fact]
public async Task CreateResource_MissingCounty_Returns400WithCode()
{
    // response.code.Should().Be("VALIDATION_FAILED");
}

[Fact]
public async Task CreateResource_WrongCounty_Returns403()
{
    // County isolation enforcement
}
```

---

## 6) Change Control

To modify any of the above:
1. Create new spec version (e.g., v1.1.0)
2. Update validation tests
3. Run breaker agent
4. Document migration path
5. Announce breaking changes
```

---

## UI Spec-Lock

```markdown
# {{Component Name}} UI Spec Lock v1.0.0

Status: **FROZEN**
Last Updated: {{date}}
Author: {{author}}

---

## 1) Purpose

### What This Component Does
- Brief description

### Non-Goals
- What this component does NOT do

---

## 2) Component Contract

### Props Interface

```typescript
interface {{ComponentName}}Props {
  /** County ID for data isolation (required) */
  countyId: string;
  
  /** Initial data to display */
  initialData?: ResourceData;
  
  /** Called when user submits the form */
  onSubmit: (data: SubmitPayload) => Promise<void>;
  
  /** Called when user cancels */
  onCancel?: () => void;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Error to display */
  error?: Error | null;
}
```

### Data Types

```typescript
interface ResourceData {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
}

interface SubmitPayload {
  countyId: string;
  name: string;
  config: {
    enabled: boolean;
    threshold: number;
  };
}
```

---

## 3) Test IDs (data-testid)

| Element | Test ID | Required |
|---------|---------|----------|
| Root container | `{{component}}-root` | ✅ |
| Form | `{{component}}-form` | ✅ |
| Name input | `{{component}}-name-input` | ✅ |
| Submit button | `{{component}}-submit-btn` | ✅ |
| Cancel button | `{{component}}-cancel-btn` | ❌ |
| Error message | `{{component}}-error` | ✅ |
| Loading spinner | `{{component}}-loading` | ✅ |

---

## 4) State Transitions

```
Initial
  ↓ (user types)
Editing
  ↓ (user clicks submit)
Submitting
  ↓ (success)          ↓ (failure)
Submitted            Error
                       ↓ (user retries)
                     Submitting
```

### State Machine

| State | User Actions | Transitions |
|-------|--------------|-------------|
| Initial | type, cancel | → Editing |
| Editing | submit, cancel | → Submitting, Initial |
| Submitting | none (disabled) | → Submitted, Error |
| Submitted | none | terminal |
| Error | retry, cancel | → Submitting, Initial |

---

## 5) Accessibility Requirements

- [ ] All inputs have labels
- [ ] Form has ARIA live region for errors
- [ ] Submit button disabled during loading
- [ ] Focus management on error
- [ ] Keyboard navigation works

---

## 6) Deterministic Examples

### Example 1: Initial Render

**Props**:
```tsx
<ResourceForm
  countyId="benton-123"
  onSubmit={handleSubmit}
/>
```

**Rendered Output** (structure):
```html
<div data-testid="resource-form-root">
  <form data-testid="resource-form-form">
    <input data-testid="resource-form-name-input" value="" />
    <button data-testid="resource-form-submit-btn" disabled>Submit</button>
  </form>
</div>
```

### Example 2: Error State

**Props**:
```tsx
<ResourceForm
  countyId="benton-123"
  onSubmit={handleSubmit}
  error={new Error("Network error")}
/>
```

**Rendered Output**:
```html
<div data-testid="resource-form-root">
  <div data-testid="resource-form-error" role="alert">
    Network error
  </div>
  ...
</div>
```

---

## 7) Forbidden Changes

- Test IDs (data-testid values)
- Props interface shape
- Required vs optional props
- State machine transitions
- Accessibility requirements

---

## 8) Validation Tests

```typescript
describe('ResourceForm', () => {
  it('renders with required test IDs', () => {
    render(<ResourceForm countyId="test" onSubmit={jest.fn()} />);
    
    expect(screen.getByTestId('resource-form-root')).toBeInTheDocument();
    expect(screen.getByTestId('resource-form-form')).toBeInTheDocument();
    expect(screen.getByTestId('resource-form-submit-btn')).toBeInTheDocument();
  });

  it('calls onSubmit with correct payload', async () => {
    const onSubmit = jest.fn();
    render(<ResourceForm countyId="benton" onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByTestId('resource-form-name-input'), {
      target: { value: 'Test Name' }
    });
    fireEvent.click(screen.getByTestId('resource-form-submit-btn'));
    
    expect(onSubmit).toHaveBeenCalledWith({
      countyId: 'benton',
      name: 'Test Name',
      config: expect.any(Object)
    });
  });
});
```
```

---

## Metrics Spec-Lock

```markdown
# {{Feature}} Metrics Spec Lock v1.0.0

Status: **FROZEN**
Last Updated: {{date}}
Author: {{author}}

---

## 1) Purpose

### What These Metrics Measure
- Brief description of observability goals

### Non-Goals
- What these metrics do NOT measure

---

## 2) Allowed Metrics

| Metric Name | Type | Description |
|-------------|------|-------------|
| `tf_{{feature}}_total` | Counter | Total operations |
| `tf_{{feature}}_duration_seconds` | Histogram | Operation latency |
| `tf_{{feature}}_errors_total` | Counter | Error count by type |
| `tf_{{feature}}_active` | Gauge | Currently active items |

---

## 3) Label Specifications

### Required Labels (all metrics)

| Label | Allowed Values | Description |
|-------|----------------|-------------|
| `county` | `benton`, `yakima`, `...` | County identifier |
| `environment` | `prod`, `staging`, `dev` | Deployment environment |

### Per-Metric Labels

#### tf_{{feature}}_total

| Label | Allowed Values | Description |
|-------|----------------|-------------|
| `operation` | `create`, `update`, `delete` | Operation type |
| `status` | `success`, `failure` | Outcome |

#### tf_{{feature}}_errors_total

| Label | Allowed Values | Description |
|-------|----------------|-------------|
| `error_type` | `validation`, `auth`, `timeout`, `internal` | Error category |

---

## 4) Banned Labels (Cardinality Risk)

The following labels are **FORBIDDEN** on any metric:

| Banned Label | Reason |
|--------------|--------|
| `user_id` | High cardinality (millions of values) |
| `request_id` | Unique per request |
| `timestamp` | Unique per event |
| `parcel_id` | High cardinality |
| `session_id` | Unique per session |
| `correlation_id` | Unique per trace |
| `error_message` | Unbounded strings |
| `stack_trace` | Unbounded strings |
| `ip_address` | PII + cardinality |

---

## 5) Instrumentation Examples

### Counter

```csharp
private readonly Counter<long> _operationCounter = 
    Meter.CreateCounter<long>(
        "tf_feature_total",
        description: "Total operations");

// Usage
_operationCounter.Add(1, 
    new("county", countyId),
    new("operation", "create"),
    new("status", "success"));
```

### Histogram

```csharp
private readonly Histogram<double> _durationHistogram = 
    Meter.CreateHistogram<double>(
        "tf_feature_duration_seconds",
        unit: "s",
        description: "Operation latency");

// Usage
using var timer = new ValueStopwatch();
try {
    await DoOperation();
    _durationHistogram.Record(timer.GetElapsedTime().TotalSeconds,
        new("county", countyId),
        new("operation", "create"));
}
```

---

## 6) Validation Rules

```csharp
[Fact]
public void Metrics_ShouldNotContainBannedLabels()
{
    var metrics = CollectAllMetrics();
    var bannedLabels = new[] { "user_id", "request_id", "timestamp", ... };
    
    foreach (var metric in metrics)
    {
        var usedBanned = metric.Labels.Intersect(bannedLabels);
        usedBanned.Should().BeEmpty(
            "metric {0} uses banned labels: {1}",
            metric.Name,
            string.Join(", ", usedBanned));
    }
}

[Fact]
public void Metrics_ShouldOnlyUseAllowedNames()
{
    var allowedPattern = new Regex(@"^tf_[a-z_]+_(total|duration_seconds|errors_total|active)$");
    var metrics = CollectAllMetrics();
    
    foreach (var metric in metrics)
    {
        allowedPattern.IsMatch(metric.Name).Should().BeTrue(
            "metric {0} does not match allowed pattern",
            metric.Name);
    }
}
```

---

## 7) Change Control

To add/modify metrics:
1. Bump spec version
2. Update allowed metrics table
3. Update validation tests
4. Update dashboard spec-lock (if displayed)
5. Announce to observability team
```

---

## Dashboard Spec-Lock

```markdown
# {{Feature}} Dashboard Spec Lock v1.0.0

Status: **FROZEN**
Last Updated: {{date}}
Author: {{author}}

---

## 1) Metrics Spec Lock Reference

See: `METRICS_SPEC_LOCK_v1.0.0.md`

### Allowed metric names (subset for this dashboard):
- tf_{{feature}}_total
- tf_{{feature}}_duration_seconds
- tf_{{feature}}_errors_total

### Banned labels anywhere (cardinality risk):
- user_id
- request_id
- parcel_id
- ...

---

## 2) Dashboard: {{Dashboard Name}}

- **UID**: `{{dashboard-uid}}`
- **Title**: `{{Dashboard Title}}`
- **Tags**: `terrafusion`, `{{feature}}`, `ops`
- **Refresh**: `30s`
- **Time Range**: `Last 1 hour`

---

## 3) Panels

### P1 — {{Panel 1 Name}}

- **Title**: `{{Exact Panel Title}}`
- **Type**: `timeseries`
- **Position**: Row 1

**PromQL**:
```promql
sum(rate(tf_{{feature}}_total{county="$county"}[5m])) by (operation)
```

---

### P2 — {{Panel 2 Name}}

- **Title**: `{{Exact Panel Title}}`
- **Type**: `stat`
- **Position**: Row 1

**PromQL**:
```promql
sum(tf_{{feature}}_active{county="$county"})
```

---

## 4) Variables

| Variable | Label | Type | Query/Options |
|----------|-------|------|---------------|
| county | County | Query | `label_values(tf_{{feature}}_total, county)` |

---

## 5) Validation Rules

```csharp
[Fact]
public void Dashboard_Uid_ShouldMatch()
{
    var dashboard = LoadDashboard("{{dashboard-uid}}.json");
    dashboard.Uid.Should().Be("{{dashboard-uid}}");
}

[Fact]
public void Dashboard_Title_ShouldMatch()
{
    var dashboard = LoadDashboard("{{dashboard-uid}}.json");
    dashboard.Title.Should().Be("{{Dashboard Title}}");
}

[Fact]
public void Dashboard_P1_PromQL_ShouldMatchExactly()
{
    var panel = FindPanel("{{Exact Panel Title}}");
    panel.Targets[0].Expr.Should().Be(
        "sum(rate(tf_{{feature}}_total{county=\"$county\"}[5m])) by (operation)");
}

[Fact]
public void Dashboard_ShouldNotUseBannedLabels()
{
    var dashboard = LoadDashboard("{{dashboard-uid}}.json");
    var queries = ExtractAllPromQL(dashboard);
    
    foreach (var query in queries)
    {
        query.Should().NotContainAny(BannedLabels,
            "query uses banned label");
    }
}
```
```

---

## Alerts Spec-Lock

```markdown
# {{Feature}} Alerts Spec Lock v1.0.0

Status: **FROZEN**
Last Updated: {{date}}
Author: {{author}}

---

## 1) Alert Rules

### Group: tf_{{feature}}_alerts

**Evaluation Interval**: `30s`

---

### A1 — High Error Rate

```yaml
alert: TF{{Feature}}HighErrorRate
expr: |
  sum(rate(tf_{{feature}}_errors_total{county="$county"}[5m])) 
  / 
  sum(rate(tf_{{feature}}_total{county="$county"}[5m])) 
  > 0.05
for: 5m
labels:
  severity: warning
  team: platform
annotations:
  summary: "High error rate for {{feature}} in {{ $labels.county }}"
  description: "Error rate is {{ $value | humanizePercentage }} over last 5m"
  runbook_url: "https://wiki.terrafusion.gov/runbooks/{{feature}}-errors"
```

---

### A2 — Service Down

```yaml
alert: TF{{Feature}}Down
expr: |
  absent(tf_{{feature}}_total{county="$county"}) == 1
for: 2m
labels:
  severity: critical
  team: platform
annotations:
  summary: "{{Feature}} service down for {{ $labels.county }}"
  description: "No metrics received for 2 minutes"
  runbook_url: "https://wiki.terrafusion.gov/runbooks/{{feature}}-down"
```

---

## 2) Alertmanager Routes

```yaml
routes:
  - match:
      alertname: TF{{Feature}}HighErrorRate
    receiver: slack-platform
    continue: true
    
  - match:
      alertname: TF{{Feature}}Down
      severity: critical
    receiver: pagerduty-critical
```

---

## 3) Receivers

| Receiver | Type | Targets |
|----------|------|---------|
| slack-platform | Slack | #platform-alerts |
| pagerduty-critical | PagerDuty | Platform On-Call |

---

## 4) Validation Rules

```csharp
[Fact]
public void AlertRules_ShouldExist()
{
    var rules = LoadAlertRules("{{feature}}.yml");
    rules.Groups.Should().Contain(g => g.Name == "tf_{{feature}}_alerts");
}

[Fact]
public void AlertRules_ShouldHaveRunbooks()
{
    var rules = LoadAlertRules("{{feature}}.yml");
    foreach (var rule in rules.AllRules())
    {
        rule.Annotations.Should().ContainKey("runbook_url");
    }
}

[Fact]
public void AlertRules_ShouldNotUseBannedLabels()
{
    var rules = LoadAlertRules("{{feature}}.yml");
    foreach (var rule in rules.AllRules())
    {
        rule.Expr.Should().NotContainAny(BannedLabels);
    }
}
```
```

---

## Events Spec-Lock

```markdown
# {{Feature}} Events Spec Lock v1.0.0

Status: **FROZEN**
Last Updated: {{date}}
Author: {{author}}

---

## 1) Purpose

### What These Events Communicate
- Real-time state changes
- Progress updates
- Error notifications

### Non-Goals
- Large data payloads (use API instead)
- Guaranteed delivery (at-most-once)

---

## 2) SSE Endpoint

**URL**: `GET /api/{{feature}}/events`

**Authentication**: JWT Bearer

**Query Parameters**:
| Param | Required | Description |
|-------|----------|-------------|
| county_id | ✅ | Filter events to county |

---

## 3) Event Types

### {{feature}}.started

**When**: Operation begins

**Payload**:
```json
{
  "event": "{{feature}}.started",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "id": "string (GUID)",
    "county_id": "string (GUID)",
    "operation": "string"
  }
}
```

---

### {{feature}}.progress

**When**: Progress update

**Payload**:
```json
{
  "event": "{{feature}}.progress",
  "timestamp": "2025-01-15T10:30:05Z",
  "data": {
    "id": "string (GUID)",
    "progress_percent": "number (0-100)",
    "current_step": "string",
    "steps_total": "number"
  }
}
```

---

### {{feature}}.completed

**When**: Operation finishes successfully

**Payload**:
```json
{
  "event": "{{feature}}.completed",
  "timestamp": "2025-01-15T10:30:30Z",
  "data": {
    "id": "string (GUID)",
    "result": { ... },
    "duration_ms": "number"
  }
}
```

---

### {{feature}}.failed

**When**: Operation fails

**Payload**:
```json
{
  "event": "{{feature}}.failed",
  "timestamp": "2025-01-15T10:30:30Z",
  "data": {
    "id": "string (GUID)",
    "error": "string",
    "code": "string (machine code)",
    "recoverable": "boolean"
  }
}
```

---

## 4) Validation Rules

```typescript
describe('SSE Events', () => {
  it('emits started event with correct structure', async () => {
    const events = await collectEvents('/api/feature/events?county_id=test');
    const started = events.find(e => e.event === 'feature.started');
    
    expect(started).toBeDefined();
    expect(started.data).toMatchObject({
      id: expect.any(String),
      county_id: 'test',
      operation: expect.any(String)
    });
  });

  it('filters events by county_id', async () => {
    const events = await collectEvents('/api/feature/events?county_id=benton');
    
    events.forEach(e => {
      expect(e.data.county_id).toBe('benton');
    });
  });
});
```
```

---

## Usage Guide

1. **Copy the appropriate template** to your feature directory
2. **Fill in placeholders** (`{{feature}}`, `{{author}}`, etc.)
3. **Remove unused sections** (not all features need all sections)
4. **Create validation tests** that enforce the spec
5. **Version the spec** (`v1.0.0` → `v1.1.0` for additions, `v2.0.0` for breaking)

---

*TerraFusion Spec-Lock Templates — Freeze Contracts, Enable Velocity*
