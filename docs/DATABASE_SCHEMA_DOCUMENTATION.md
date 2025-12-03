# TerraFusion OS - Database Schema Documentation

**Database**: SQLite (Development) / PostgreSQL (Production)  
**File**: `backend/TerraFusion.API/terrafusion_dev.db`  
**Last Updated**: December 2025  
**Total Tables**: 44

---

## Table Overview

| Category | Tables | Description |
|----------|--------|-------------|
| Core Government | 6 | Counties, Properties, Assessments, Taxes, Users |
| AI System | 3 | AI Agents, Models, Performance Metrics |
| Module System | 2 | Modules, Valuations |
| Marketplace | 5 | Plugins, Submissions, Installations, Revenue, Analytics |
| Collaboration | 11 | Teams, Projects, Tasks, Documents, Permissions |
| Security | 3 | Sessions, Events, Audit Logs |
| Analytics | 5 | Codex Framework, Quantum Notebooks, Workflows |
| Experiments | 2 | Experiments, Runs |

---

## Entity Relationship Diagram (Simplified)

```
┌─────────────────┐      ┌─────────────────┐      ┌──────────────────┐
│     Counties    │      │   Properties    │      │  PropertyAssess- │
│─────────────────│      │─────────────────│      │     ments        │
│ Id (PK)         │◄─────│ CountyId (FK)   │◄─────│ PropertyId (FK)  │
│ Name            │      │ Id (PK)         │      │ Id (PK)          │
│ State           │      │ ParcelId        │      │ AssessedValue    │
│ FipsCode        │      │ Address         │      │ TaxYear          │
│ Population      │      │ AssessedValue   │      │ Status           │
└─────────────────┘      └─────────────────┘      └──────────────────┘
                                │
                                ▼
                         ┌─────────────────┐
                         │   TaxLevies     │
                         │─────────────────│
                         │ PropertyId (FK) │
                         │ Amount          │
                         │ DueDate         │
                         └─────────────────┘

┌─────────────────┐      ┌─────────────────┐      ┌──────────────────┐
│    AIAgents     │      │    AIModels     │      │  Performance-    │
│─────────────────│      │─────────────────│      │    Metrics       │
│ Id (PK)         │      │ Id (PK)         │      │ Id (PK)          │
│ Name            │      │ Name            │      │ AgentId (FK)     │
│ Type            │      │ ModelType       │      │ Metric           │
│ Status          │      │ Version         │      │ Value            │
│ AssignedCounty  │      │ Accuracy        │      │ Timestamp        │
│ PerformanceScore│      │ Configuration   │      └──────────────────┘
└─────────────────┘      └─────────────────┘

┌─────────────────┐      ┌─────────────────┐      ┌──────────────────┐
│    Modules      │      │    Plugins      │      │  Plugin-         │
│─────────────────│      │─────────────────│      │  Installations   │
│ Id (PK)         │      │ Id (PK)         │      │ Id (PK)          │
│ Name            │      │ Name            │      │ PluginId (FK)    │
│ Version         │      │ Version         │      │ CountyId (FK)    │
│ Status          │      │ Status          │      │ InstalledAt      │
│ Tier            │      │ Price           │      │ Status           │
│ IsCore          │      │ Author          │      └──────────────────┘
└─────────────────┘      └─────────────────┘
```

---

## Core Government Entities

### Counties
Primary table for Washington State county data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | UUID | PK | Unique county identifier |
| Name | VARCHAR(100) | NOT NULL | County name (e.g., "Benton County") |
| State | VARCHAR(2) | NOT NULL | State code (e.g., "WA") |
| FipsCode | VARCHAR(5) | UNIQUE | Federal FIPS code |
| Population | INT | NOT NULL | County population |
| Area | DOUBLE | NOT NULL | Area in square miles |
| CreatedAt | TIMESTAMP | NOT NULL | Record creation time |
| UpdatedAt | TIMESTAMP | NOT NULL | Last update time |

### Properties
Central property records with county isolation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | UUID | PK | Unique property identifier |
| PropertyId | VARCHAR(50) | NOT NULL | External property ID |
| ParcelId | VARCHAR(50) | UNIQUE | Parcel identifier |
| ParcelNumber | VARCHAR(50) | NOT NULL | Parcel number |
| Address | VARCHAR(500) | NOT NULL | Property address |
| OwnerName | VARCHAR(200) | NULL | Property owner |
| PropertyType | VARCHAR(100) | NULL | Residential/Commercial/etc. |
| YearBuilt | INT | NULL | Construction year |
| AssessedValue | DECIMAL(18,2) | NOT NULL | Assessed value |
| LandValue | DECIMAL | NOT NULL | Land component value |
| ImprovementValue | DECIMAL | NOT NULL | Improvement value |
| MarketValue | DECIMAL | NOT NULL | Fair market value |
| CountyId | UUID | FK → Counties | **County isolation key** |
| TaxYear | INT | NOT NULL | Tax assessment year |

**Indexes**: `IX_Properties_CountyId`, `IX_Properties_ParcelId (UNIQUE)`

### PropertyAssessments
Assessment history and records.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| PropertyId | UUID | FK → Properties |
| AssessmentDate | TIMESTAMP | Assessment date |
| AssessedValue | DECIMAL | Assessment amount |
| AssessorId | UUID | FK → GovernmentUsers |
| Status | VARCHAR | Pending/Approved/Appealed |

### TaxLevies
Tax levy records tied to properties.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| PropertyId | UUID | FK → Properties |
| Amount | DECIMAL | Tax amount |
| DueDate | DATE | Payment due date |
| PaidDate | DATE | Actual payment date |
| Status | VARCHAR | Outstanding/Paid/Delinquent |

### GovernmentUsers
County government employees and roles.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| Email | VARCHAR | User email |
| Name | VARCHAR | Full name |
| Role | VARCHAR | Assessor/Admin/Analyst |
| CountyId | UUID | FK → Counties |
| Department | VARCHAR | Department name |

---

## AI System Entities

### AIAgents
AI agent registry with task tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | UUID | PK | Agent identifier |
| Name | VARCHAR(100) | NOT NULL | Agent name |
| Type | VARCHAR(50) | NOT NULL | CommandBrain/SwarmCoordinator/etc. |
| Status | VARCHAR(20) | NOT NULL | Active/Processing/Idle/Error |
| Configuration | JSONB | NULL | Agent configuration |
| CurrentTask | TEXT | NULL | Current task description |
| ProcessedTasks | INT | NOT NULL | Total tasks completed |
| AssignedCounty | VARCHAR | NULL | County assignment |
| PerformanceScore | DOUBLE | NOT NULL | 0.0-1.0 performance metric |
| CreatedAt | TIMESTAMP | NOT NULL | Creation time |
| LastActiveAt | TIMESTAMP | NOT NULL | Last activity |

**Index**: `IX_AIAgents_Status`

### AIModels
Machine learning model registry.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| Name | VARCHAR | Model name |
| ModelType | VARCHAR | PropertyValuation/Classification/etc. |
| Version | VARCHAR | Semantic version |
| Accuracy | DOUBLE | Model accuracy (0-1) |
| Configuration | JSONB | Model parameters |
| Status | VARCHAR | Training/Active/Deprecated |
| TrainedAt | TIMESTAMP | Training completion time |

### PerformanceMetrics
Time-series performance tracking.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| AgentId | UUID | FK → AIAgents |
| MetricName | VARCHAR | throughput/latency/accuracy |
| Value | DOUBLE | Metric value |
| Timestamp | TIMESTAMP | Measurement time |
| Tags | JSONB | Additional metadata |

---

## Module System Entities

### Modules
TerraFusion OS module catalog.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | INT | PK | Module ID |
| Name | VARCHAR(100) | UNIQUE | Module identifier |
| DisplayName | VARCHAR(150) | NOT NULL | Human-readable name |
| Description | VARCHAR(500) | NULL | Module description |
| Version | VARCHAR(20) | NOT NULL | Semantic version |
| Status | INT | NOT NULL | 0=Disabled, 1=Active |
| Tier | INT | NOT NULL | 1-5 (Core to Premium) |
| IconPath | VARCHAR(200) | NULL | Icon file path |
| LaunchPath | VARCHAR(500) | NULL | Executable/URL path |
| IsCore | BOOL | NOT NULL | Core vs optional |
| Priority | INT | NOT NULL | Load priority |

---

## Marketplace Entities

### Plugins
Third-party plugin marketplace.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| Name | VARCHAR | Plugin name |
| Description | TEXT | Full description |
| Version | VARCHAR | Current version |
| Author | VARCHAR | Developer name |
| Price | DECIMAL | Monthly price (0 = free) |
| Status | VARCHAR | Pending/Approved/Rejected |
| Downloads | INT | Download count |
| Rating | DOUBLE | Average rating |

### PluginInstallations
Track plugin installations per county.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| PluginId | UUID | FK → Plugins |
| CountyId | UUID | FK → Counties |
| InstalledAt | TIMESTAMP | Installation time |
| Status | VARCHAR | Active/Disabled |
| Configuration | JSONB | County-specific config |

---

## Collaboration Entities

### Teams
Government team management.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| Name | VARCHAR | Team name |
| CountyId | UUID | FK → Counties |
| CreatedBy | UUID | FK → GovernmentUsers |
| Description | TEXT | Team purpose |

### Projects
Government projects.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| Name | VARCHAR | Project name |
| TeamId | UUID | FK → Teams |
| Status | VARCHAR | Planning/Active/Complete |
| StartDate | DATE | Project start |
| EndDate | DATE | Target completion |

### Tasks
Task management.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| ProjectId | UUID | FK → Projects |
| Title | VARCHAR | Task title |
| Description | TEXT | Task details |
| AssigneeId | UUID | FK → GovernmentUsers |
| Status | VARCHAR | Todo/InProgress/Done |
| Priority | INT | 1-5 priority |
| DueDate | DATE | Due date |

---

## Security Entities

### AuditLogs
Comprehensive audit trail.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| UserId | UUID | FK → GovernmentUsers |
| Action | VARCHAR | CREATE/READ/UPDATE/DELETE |
| EntityType | VARCHAR | Affected table |
| EntityId | UUID | Affected record |
| OldValues | JSONB | Previous state |
| NewValues | JSONB | New state |
| IpAddress | VARCHAR | Client IP |
| Timestamp | TIMESTAMP | Action time |

### SecurityEvents
Security monitoring.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| EventType | VARCHAR | LoginSuccess/LoginFailed/etc. |
| UserId | UUID | Associated user |
| Severity | VARCHAR | Info/Warning/Critical |
| Details | JSONB | Event details |
| Timestamp | TIMESTAMP | Event time |

### UserSessions
Active session tracking.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| UserId | UUID | FK → GovernmentUsers |
| Token | VARCHAR | Session token |
| IpAddress | VARCHAR | Client IP |
| UserAgent | VARCHAR | Browser/client info |
| CreatedAt | TIMESTAMP | Login time |
| ExpiresAt | TIMESTAMP | Session expiry |

---

## Analytics Entities

### QuantumNotebooks
Jupyter-like analysis notebooks.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| Name | VARCHAR | Notebook name |
| Content | JSONB | Notebook cells |
| OwnerId | UUID | FK → GovernmentUsers |
| Status | VARCHAR | Draft/Published |
| CreatedAt | TIMESTAMP | Creation time |

### AnalysisResults
Stored analysis outputs.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| NotebookId | UUID | FK → QuantumNotebooks |
| ResultType | VARCHAR | Chart/Table/Report |
| Data | JSONB | Result data |
| GeneratedAt | TIMESTAMP | Generation time |

### Workflows
Automated workflow definitions.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| Name | VARCHAR | Workflow name |
| Definition | JSONB | Workflow steps |
| Schedule | VARCHAR | Cron expression |
| Status | VARCHAR | Active/Paused |

### WorkflowExecutions
Workflow run history.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| WorkflowId | UUID | FK → Workflows |
| StartedAt | TIMESTAMP | Start time |
| CompletedAt | TIMESTAMP | End time |
| Status | VARCHAR | Running/Success/Failed |
| Output | JSONB | Execution results |

---

## Codex 3-6-9 Framework

### CodexMetrics
Tesla 3-6-9 harmonic metrics.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| Category | VARCHAR | 3/6/9 category |
| MetricName | VARCHAR | Metric identifier |
| Value | DOUBLE | Current value |
| Timestamp | TIMESTAMP | Measurement time |

### CodexScores
Aggregate codex scores.

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | PK |
| EntityType | VARCHAR | Agent/Module/County |
| EntityId | UUID | Associated entity |
| Score369 | DOUBLE | Harmonic score |
| CalculatedAt | TIMESTAMP | Score time |

---

## County Data Isolation

**Critical Pattern**: All queries MUST filter by `CountyId` to maintain sovereign data boundaries.

```sql
-- ✅ CORRECT: County-scoped query
SELECT * FROM Properties WHERE CountyId = 'benton-uuid' AND ParcelId = '123';

-- ❌ WRONG: Cross-county data leak
SELECT * FROM Properties WHERE ParcelId = '123';
```

All tables with county-specific data include:
- `CountyId` column (UUID, FK → Counties)
- Index on `CountyId` for query performance
- Cascade delete when county is removed

---

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| Initial | 2025-01 | Core schema |
| AddAIAgents | 2025-03 | AI agent tables |
| AddMarketplace | 2025-05 | Plugin marketplace |
| AddCollaboration | 2025-07 | Team/Project tables |
| AddQuantumAnalytics | 2025-09 | Workflow/Notebook tables |
| AddCodexFramework | 2025-11 | 3-6-9 metrics |

---

*Generated by MIT PhD System Audit - Phase 2*
