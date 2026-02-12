# TerraLevy Telemetry Event Catalog

## Overview

TerraLevy emits telemetry events to Application Insights for production observability. All events are disabled by default (tests/dev) and enabled in production via `VITE_ENABLE_TELEMETRY=true`.

## Event Catalog

### User Actions

#### `levy_calculated`
**Triggered**: User calculates optimal levy rate
**Properties**:
- `assessedValue` (number) - Total assessed value input
- `budgetRequirement` (number) - Target budget requirement
- `levyRate` (number) - Calculated optimal rate
- `isCompliant` (boolean) - Whether rate meets compliance
- `countyId` (string) - County identifier
- `duration` (number, optional) - Calculation time in milliseconds

**Business Context**: Tracks calculator usage and compliance rates

**Example**:
```typescript
emitTelemetry('levy_calculated', {
  assessedValue: 5000000,
  budgetRequirement: 72500,
  levyRate: 0.0145,
  isCompliant: true,
  countyId: 'county-123',
  duration: 145,
});
```

---

#### `projections_generated`
**Triggered**: User generates multi-year revenue projections
**Properties**:
- `levyRate` (number) - Rate used for projections
- `years` (number) - Number of years projected
- `startingValue` (number) - Initial assessed value
- `growthRate` (number) - Assumed annual growth rate
- `countyId` (string) - County identifier

**Business Context**: Tracks revenue planning usage and projection parameters

**Example**:
```typescript
emitTelemetry('projections_generated', {
  levyRate: 0.0145,
  years: 5,
  startingValue: 5000000,
  growthRate: 0.03,
  countyId: 'county-123',
});
```

---

#### `scenarios_compared`
**Triggered**: User compares multiple levy scenarios
**Properties**:
- `scenarioCount` (number) - Number of scenarios compared
- `scenarioIds` (string[]) - Scenario identifiers
- `selectedScenarioId` (string, optional) - User's selection
- `countyId` (string) - County identifier

**Business Context**: Tracks decision-making process and scenario analysis patterns

**Example**:
```typescript
emitTelemetry('scenarios_compared', {
  scenarioCount: 3,
  scenarioIds: ['scenario-1', 'scenario-2', 'scenario-3'],
  selectedScenarioId: 'scenario-2',
  countyId: 'county-123',
});
```

---

#### `measure_viewed`
**Triggered**: User views levy measure details
**Properties**:
- `measureId` (string) - Measure identifier
- `measureType` (string) - Type of levy measure
- `hasScenarios` (boolean) - Whether measure has scenarios
- `countyId` (string) - County identifier

**Business Context**: Tracks content engagement and popular measures

**Example**:
```typescript
emitTelemetry('measure_viewed', {
  measureId: 'measure-456',
  measureType: 'property-tax',
  hasScenarios: true,
  countyId: 'county-123',
});
```

---

### System Events

#### `rq_error`
**Triggered**: React Query error (query/mutation failure)
**Properties**:
- `type` (string) - 'query' or 'mutation'
- `key` (string | unknown[]) - React Query key
- `message` (string) - Error message
- `countyId` (string, optional) - County context

**Business Context**: Tracks API reliability and error patterns

**Example**:
```typescript
emitTelemetry('rq_error', {
  type: 'query',
  key: ['levy-measures', 'county-123'],
  message: 'API Error: 500 - Internal Error',
  countyId: 'county-123',
});
```

---

#### `module_initialized`
**Triggered**: TerraLevy module loads successfully
**Properties**:
- `countyId` (string) - County identifier
- `quantumFactor` (number) - Quantum optimization factor (949)
- `targetAccuracy` (number) - Accuracy target (0.995)
- `apiHealthy` (boolean) - API health check result

**Business Context**: Tracks module adoption and initialization success rate

**Example**:
```typescript
emitTelemetry('module_initialized', {
  countyId: 'county-123',
  quantumFactor: 949,
  targetAccuracy: 0.995,
  apiHealthy: true,
});
```

---

## Performance Metrics

### Recommended Custom Metrics

**Calculation Time**: Track `levy_calculated` duration to monitor performance
```typescript
const startTime = performance.now();
// ... calculation logic ...
const duration = performance.now() - startTime;

emitTelemetry('levy_calculated', {
  // ... other properties
  duration,
});
```

**Error Rate**: Monitor `rq_error` frequency relative to total operations

**User Journey Completion**: Track sequences like `measure_viewed` → `scenarios_compared` → `levy_calculated`

---

## Privacy & Compliance

- **No PII**: Events contain no personally identifiable information
- **County Isolation**: All events include `countyId` for data segmentation
- **Failure Safety**: Telemetry errors never interrupt user flows
- **Opt-out**: Telemetry disabled by default; explicit opt-in required

---

## Testing

Telemetry is **no-op when disabled** (VITE_ENABLE_TELEMETRY=false):
- Zero performance impact on test suite
- No network calls or side effects
- Fast, isolated test execution

To test telemetry integration:
```typescript
// Set env var in test
vi.stubEnv('VITE_ENABLE_TELEMETRY', 'true');
vi.stubEnv('VITE_APP_INSIGHTS_KEY', 'test-key');

// Initialize and emit
initializeTelemetry();
emitTelemetry('test_event', { prop: 'value' });

// Verify Application Insights called (mock/spy required)
```

---

## Dashboard Queries (KQL)

### Top Events by Volume
```kql
customEvents
| where timestamp > ago(7d)
| where customDimensions.module == "terra-levy"
| summarize count() by name
| order by count_ desc
```

### Calculation Performance
```kql
customEvents
| where name == "levy_calculated"
| extend duration = todouble(customDimensions.duration)
| summarize avg(duration), percentile(duration, 95), percentile(duration, 99) by bin(timestamp, 1h)
```

### Error Rate by County
```kql
customEvents
| where name == "rq_error"
| extend countyId = tostring(customDimensions.countyId)
| summarize errorCount = count() by countyId, bin(timestamp, 1d)
| order by errorCount desc
```

### User Journey Funnel
```kql
customEvents
| where timestamp > ago(7d)
| where name in ("measure_viewed", "scenarios_compared", "levy_calculated")
| summarize count() by name
```

---

## Extending Telemetry

To add new events:

1. **Define event** in this catalog with properties and business context
2. **Emit event** at appropriate code location:
   ```typescript
   import { emitTelemetry } from '../utils/telemetry';
   
   emitTelemetry('new_event_name', {
     property1: value1,
     property2: value2,
     countyId: currentCounty,
   });
   ```
3. **Update tests** if event emission is critical path
4. **Create dashboard queries** for monitoring

---

**Championship Excellence**: TerraLevy telemetry provides production-grade observability without compromising test performance or user privacy. **Government. Transcended.**
