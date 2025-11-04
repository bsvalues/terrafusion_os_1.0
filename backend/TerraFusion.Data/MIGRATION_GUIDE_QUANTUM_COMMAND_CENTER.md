# TerraFlow Quantum Command Center - Database Migration Guide

**Author**: TerraFusion Elite Government OS Engineering Agent
**Date**: October 31, 2025
**Phase**: Phase 1 Week 3 - Database Schema Implementation
**Status**: Ready for Migration

---

## Overview

This guide documents the database schema additions for the TerraFlow Quantum Command Center, including 4 new tables for storing notebooks, analysis results, workflows, and execution history.

## New Tables Added

### 1. QuantumNotebooks
**Purpose**: Store Jupyter-style notebooks for PhD-level data analysis

**Columns**:
- `Id` (int, PK) - Auto-increment primary key
- `Name` (varchar(200), required) - Notebook name
- `Description` (varchar(1000), nullable) - Notebook description
- `UserId` (int, FK → GovernmentUsers) - Owning user
- `CountyId` (int, FK → Counties) - County context for data isolation
- `CellsJson` (text, required) - Notebook cells (JSON array)
- `MetadataJson` (text, nullable) - Notebook metadata (JSON object)
- `Language` (varchar(50), required, default: 'javascript') - Programming language
- `Visibility` (varchar(20), required, default: 'private') - Visibility level
- `IsFavorite` (boolean, default: false) - User favorite flag
- `IsArchived` (boolean, default: false) - Archive status
- `LastExecutedAt` (datetime, nullable) - Last execution timestamp
- `ExecutionCount` (int, default: 0) - Total executions
- `Tags` (varchar(500), nullable) - Comma-separated tags
- `CreatedAt` (datetime, required) - Creation timestamp
- `UpdatedAt` (datetime, required) - Last update timestamp
- `CreatedBy` (varchar(100), required) - Creator username
- `UpdatedBy` (varchar(100), required) - Last updater username

**Indexes**:
- `IX_QuantumNotebooks_UserId` - User lookup
- `IX_QuantumNotebooks_CountyId` - County filtering
- `IX_QuantumNotebooks_UserId_Name` - Composite user/name lookup
- `IX_QuantumNotebooks_CreatedAt` - Chronological sorting
- `IX_QuantumNotebooks_IsArchived` - Archive filtering
- `IX_QuantumNotebooks_Language` - Language filtering

### 2. AnalysisResults
**Purpose**: Store statistical analysis results with publication-ready output

**Columns**:
- `Id` (int, PK) - Auto-increment primary key
- `AnalysisType` (varchar(100), required) - Test type (t-test, anova, etc.)
- `UserId` (int, FK → GovernmentUsers) - Owning user
- `CountyId` (int, FK → Counties) - County context
- `NotebookId` (int, FK → QuantumNotebooks, nullable) - Optional notebook association
- `InputDataJson` (text, required) - Input data (JSON)
- `ParametersJson` (text, nullable) - Analysis parameters (JSON)
- `TestStatistic` (decimal(18,6), required) - Test statistic value
- `PValue` (decimal(18,10), required) - P-value (high precision)
- `DegreesOfFreedom` (decimal(18,6), nullable) - Degrees of freedom
- `EffectSizeType` (varchar(50), nullable) - Effect size type (cohens-d, eta-squared, etc.)
- `EffectSizeValue` (decimal(18,6), nullable) - Effect size value
- `ConfidenceIntervalLower` (decimal(18,6), nullable) - CI lower bound
- `ConfidenceIntervalUpper` (decimal(18,6), nullable) - CI upper bound
- `Conclusion` (text, nullable) - Statistical conclusion
- `LatexOutput` (text, nullable) - LaTeX formatted output
- `ApaOutput` (text, nullable) - APA 7th edition formatted output
- `ResultJson` (text, required) - Complete result object (JSON)
- `ExecutionTimeMs` (int, required) - Execution time in milliseconds
- `IsFavorite` (boolean, default: false) - User favorite flag
- `IsArchived` (boolean, default: false) - Archive status
- `Tags` (varchar(500), nullable) - Comma-separated tags
- `Notes` (text, nullable) - User notes
- `CreatedAt` (datetime, required) - Creation timestamp
- `UpdatedAt` (datetime, required) - Last update timestamp
- `CreatedBy` (varchar(100), required) - Creator username
- `UpdatedBy` (varchar(100), required) - Last updater username

**Indexes**:
- `IX_AnalysisResults_UserId` - User lookup
- `IX_AnalysisResults_CountyId` - County filtering
- `IX_AnalysisResults_NotebookId` - Notebook association
- `IX_AnalysisResults_AnalysisType` - Test type filtering
- `IX_AnalysisResults_CreatedAt` - Chronological sorting
- `IX_AnalysisResults_IsArchived` - Archive filtering
- `IX_AnalysisResults_UserId_AnalysisType` - Composite user/type lookup
- `IX_AnalysisResults_PValue` - P-value range queries

### 3. Workflows
**Purpose**: Store visual workflow definitions for AI agent orchestration

**Columns**:
- `Id` (int, PK) - Auto-increment primary key
- `Name` (varchar(200), required) - Workflow name
- `Description` (varchar(1000), nullable) - Workflow description
- `UserId` (int, FK → GovernmentUsers) - Owning user
- `CountyId` (int, FK → Counties) - County context
- `Category` (varchar(50), required, default: 'data-processing') - Workflow category
- `Complexity` (varchar(20), required, default: 'moderate') - Complexity level
- `DefinitionJson` (text, required) - Workflow definition (React Flow format JSON)
- `MetadataJson` (text, nullable) - Workflow metadata (JSON)
- `IsTemplate` (boolean, default: false) - Template flag
- `TemplateId` (int, FK → Workflows, nullable) - Template source (self-referencing)
- `Visibility` (varchar(20), required, default: 'private') - Visibility level
- `IsFavorite` (boolean, default: false) - User favorite flag
- `IsArchived` (boolean, default: false) - Archive status
- `NodeCount` (int, default: 0) - Total node count
- `ExecutionCount` (int, default: 0) - Total execution count
- `LastExecutedAt` (datetime, nullable) - Last execution timestamp
- `LastExecutionStatus` (varchar(50), nullable) - Last execution status
- `AverageExecutionTime` (decimal(18,2), nullable) - Average execution time (seconds)
- `Tags` (varchar(500), nullable) - Comma-separated tags
- `CreatedAt` (datetime, required) - Creation timestamp
- `UpdatedAt` (datetime, required) - Last update timestamp
- `CreatedBy` (varchar(100), required) - Creator username
- `UpdatedBy` (varchar(100), required) - Last updater username

**Indexes**:
- `IX_Workflows_UserId` - User lookup
- `IX_Workflows_CountyId` - County filtering
- `IX_Workflows_UserId_Name` - Composite user/name lookup
- `IX_Workflows_Category` - Category filtering
- `IX_Workflows_Complexity` - Complexity filtering
- `IX_Workflows_IsTemplate` - Template filtering
- `IX_Workflows_CreatedAt` - Chronological sorting
- `IX_Workflows_IsArchived` - Archive filtering

### 4. WorkflowExecutions
**Purpose**: Track individual workflow execution runs with status and results

**Columns**:
- `Id` (int, PK) - Auto-increment primary key
- `WorkflowId` (int, FK → Workflows) - Workflow reference
- `UserId` (int, FK → GovernmentUsers) - Executor user
- `CountyId` (int, FK → Counties) - County context
- `Status` (varchar(50), required, default: 'running') - Execution status
- `StartedAt` (datetime, required) - Start timestamp
- `CompletedAt` (datetime, nullable) - Completion timestamp
- `DurationMs` (int, nullable) - Execution duration (milliseconds)
- `TotalNodes` (int, required) - Total node count
- `NodesExecuted` (int, default: 0) - Successfully executed nodes
- `NodesFailed` (int, default: 0) - Failed nodes
- `ExecutionLogJson` (text, nullable) - Execution log (JSON array)
- `OutputJson` (text, nullable) - Final output (JSON)
- `ErrorMessage` (text, nullable) - Error message (if failed)
- `ErrorStackTrace` (text, nullable) - Stack trace (if failed)
- `ContextJson` (text, nullable) - Execution context (JSON)
- `CreatedAt` (datetime, required) - Creation timestamp
- `UpdatedAt` (datetime, required) - Last update timestamp
- `CreatedBy` (varchar(100), required) - Creator username
- `UpdatedBy` (varchar(100), required) - Last updater username

**Indexes**:
- `IX_WorkflowExecutions_WorkflowId` - Workflow lookup
- `IX_WorkflowExecutions_UserId` - User lookup
- `IX_WorkflowExecutions_CountyId` - County filtering
- `IX_WorkflowExecutions_Status` - Status filtering
- `IX_WorkflowExecutions_StartedAt` - Chronological sorting
- `IX_WorkflowExecutions_WorkflowId_Status` - Composite workflow/status lookup
- `IX_WorkflowExecutions_WorkflowId_StartedAt` - Composite workflow/time lookup

---

## Entity Relationships

### Foreign Key Relationships

```
GovernmentUser (1) ──< (N) QuantumNotebook
GovernmentUser (1) ──< (N) AnalysisResult
GovernmentUser (1) ──< (N) Workflow
GovernmentUser (1) ──< (N) WorkflowExecution

County (1) ──< (N) QuantumNotebook
County (1) ──< (N) AnalysisResult
County (1) ──< (N) Workflow
County (1) ──< (N) WorkflowExecution

QuantumNotebook (1) ──< (N) AnalysisResult (optional)

Workflow (1) ──< (N) WorkflowExecution
Workflow (1) ──< (N) Workflow (self-referencing for templates)
```

### Delete Behaviors

| Relationship | Delete Behavior | Rationale |
|--------------|-----------------|-----------|
| User → Notebook | Restrict | Prevent accidental user deletion |
| User → AnalysisResult | Restrict | Preserve scientific results |
| User → Workflow | Restrict | Protect workflow definitions |
| User → WorkflowExecution | Restrict | Maintain audit trail |
| County → * (all tables) | Restrict | Sovereign County isolation |
| Notebook → AnalysisResult | SetNull | Allow notebook deletion |
| Workflow → WorkflowExecution | Cascade | Clean up execution history |
| Workflow (template) → Workflow | SetNull | Allow template deletion |

---

## Running the Migration

### Prerequisites

1. **.NET 8 SDK** installed
2. **EF Core CLI tools** installed:
   ```bash
   dotnet tool install --global dotnet-ef
   ```
3. **Database connection** configured in `appsettings.json`
4. **Backup existing database** (CRITICAL - production safety)

### Step 1: Create Migration

Navigate to the solution directory and run:

```bash
cd /mnt/c/Users/bsval/terrafusion_os_1.0/backend

dotnet ef migrations add AddQuantumCommandCenterTables \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API \
  --context TerraFusionDbContext
```

**Expected Output**:
```
Build started...
Build succeeded.
Done. To undo this action, use 'ef migrations remove'
```

**Files Created**:
- `TerraFusion.Data/Migrations/{timestamp}_AddQuantumCommandCenterTables.cs`
- `TerraFusion.Data/Migrations/{timestamp}_AddQuantumCommandCenterTables.Designer.cs`
- `TerraFusion.Data/Migrations/TerraFusionDbContextModelSnapshot.cs` (updated)

### Step 2: Review Migration

**CRITICAL**: Review the generated migration before applying:

```bash
# View SQL that will be executed
dotnet ef migrations script \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API \
  --context TerraFusionDbContext
```

Verify the SQL includes:
- ✅ CREATE TABLE statements for 4 new tables
- ✅ CREATE INDEX statements for all indexes
- ✅ FOREIGN KEY constraints with correct delete behaviors
- ✅ DEFAULT constraints for fields with default values
- ❌ NO DROP statements (unless intentional)
- ❌ NO destructive changes to existing tables

### Step 3: Apply Migration

#### Development Environment

```bash
dotnet ef database update \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API \
  --context TerraFusionDbContext
```

#### Production Environment

**NEVER run migrations directly in production**. Follow government deployment procedures:

1. **Generate SQL script**:
   ```bash
   dotnet ef migrations script \
     --project TerraFusion.Data \
     --startup-project TerraFusion.API \
     --context TerraFusionDbContext \
     --output migration.sql
   ```

2. **Review SQL script** with DBA team

3. **Test in staging environment** with production-like data

4. **Schedule maintenance window** with county stakeholders

5. **Execute via DBA-approved deployment process**

6. **Validate schema** after deployment:
   ```sql
   -- PostgreSQL
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name LIKE 'Quantum%' OR table_name LIKE 'Workflow%';

   -- SQLite
   SELECT name FROM sqlite_master WHERE type='table'
   AND (name LIKE 'Quantum%' OR name LIKE 'Workflow%');
   ```

---

## Rollback Procedure

### If Migration Fails

```bash
# Remove last migration
dotnet ef migrations remove \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API \
  --context TerraFusionDbContext

# Revert database to previous migration
dotnet ef database update {PreviousMigrationName} \
  --project TerraFusion.Data \
  --startup-project TerraFusion.API \
  --context TerraFusionDbContext
```

### Manual Rollback (Production)

If automated rollback fails:

```sql
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS WorkflowExecutions;
DROP TABLE IF EXISTS AnalysisResults;
DROP TABLE IF EXISTS Workflows;
DROP TABLE IF EXISTS QuantumNotebooks;

-- Remove migration history entry (if present)
DELETE FROM __EFMigrationsHistory WHERE MigrationId = '{MigrationId}';
```

---

## Verification Checklist

After migration, verify:

- [ ] All 4 tables created successfully
- [ ] All indexes created
- [ ] Foreign key constraints active
- [ ] Default values configured
- [ ] Audit fields (CreatedAt, UpdatedAt, etc.) present
- [ ] No errors in application logs
- [ ] TerraFusion.API starts without errors
- [ ] TerraFusion.QuantumAnalytics starts without errors
- [ ] Sample data can be inserted:
  ```sql
  -- Test insert (SQLite/PostgreSQL compatible)
  INSERT INTO QuantumNotebooks
    (Name, UserId, CountyId, CellsJson, Language, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
  VALUES
    ('Test Notebook', 1, 1, '[]', 'javascript', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'System', 'System');
  ```
- [ ] Sample data can be queried:
  ```sql
  SELECT * FROM QuantumNotebooks WHERE IsArchived = 0;
  ```

---

## Post-Migration Tasks

### 1. Update Repository Layer

Create repositories for new entities in `TerraFusion.Data/Repositories/`:
- `IQuantumNotebookRepository.cs`
- `QuantumNotebookRepository.cs`
- `IAnalysisResultRepository.cs`
- `AnalysisResultRepository.cs`
- `IWorkflowRepository.cs`
- `WorkflowRepository.cs`
- `IWorkflowExecutionRepository.cs`
- `WorkflowExecutionRepository.cs`

### 2. Update Services

Modify services to use database persistence:
- `TerraFusion.QuantumAnalytics/Services/QuantumAnalyticsService.cs` - Save analysis results
- Frontend `AnalyticsWorkbench` - Load/save notebooks
- Frontend `WorkflowDesigner` - Load/save workflows

### 3. Seed Sample Data

Create seed data for development/testing:
- Sample notebooks for each county
- Example analysis results (t-test, ANOVA)
- Pre-built workflow templates (6 templates from WorkflowDesigner)

### 4. Integration Tests

Create integration tests for:
- CRUD operations on all 4 entities
- Foreign key constraint validation
- County data isolation (user from County A cannot access County B data)
- Cascade delete behavior (Workflow → WorkflowExecutions)

---

## Troubleshooting

### Error: "Cannot create a DbSet for 'QuantumNotebook'"

**Cause**: Entity not registered in DbContext
**Fix**: Verify DbSet declaration in TerraFusionDbContext.cs:
```csharp
public DbSet<QuantumNotebook> QuantumNotebooks { get; set; }
```

### Error: "Foreign key constraint failed"

**Cause**: Referencing non-existent UserId or CountyId
**Fix**: Ensure valid references:
```csharp
var userId = 1; // Must exist in GovernmentUsers
var countyId = 1; // Must exist in Counties
```

### Error: "Cannot apply configuration for 'QuantumNotebookConfiguration'"

**Cause**: Configuration class not found
**Fix**: Verify configuration file exists and namespace is correct:
```bash
ls backend/TerraFusion.Data/Configurations/QuantumNotebookConfiguration.cs
```

### Error: "Column 'CellsJson' cannot be null"

**Cause**: Missing required field
**Fix**: Always provide CellsJson (minimum empty array):
```csharp
CellsJson = "[]"
```

---

## Files Created in This Migration

1. `backend/TerraFusion.Core/Entities/QuantumNotebook.cs` - Entity model
2. `backend/TerraFusion.Core/Entities/AnalysisResult.cs` - Entity model
3. `backend/TerraFusion.Core/Entities/Workflow.cs` - Entity model
4. `backend/TerraFusion.Core/Entities/WorkflowExecution.cs` - Entity model
5. `backend/TerraFusion.Data/Configurations/QuantumNotebookConfiguration.cs` - EF Core config
6. `backend/TerraFusion.Data/Configurations/AnalysisResultConfiguration.cs` - EF Core config
7. `backend/TerraFusion.Data/Configurations/WorkflowConfiguration.cs` - EF Core config
8. `backend/TerraFusion.Data/Configurations/WorkflowExecutionConfiguration.cs` - EF Core config
9. `backend/TerraFusion.Data/TerraFusionDbContext.cs` - Updated (DbSets + ApplyConfiguration)
10. `backend/TerraFusion.Data/MIGRATION_GUIDE_QUANTUM_COMMAND_CENTER.md` - This document

---

## Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     GovernmentUser (Existing)                        │
│  Id, Email, FirstName, LastName, Department, Role, CountyId         │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               │ (1:N)
               │
    ┌──────────┼──────────┬──────────┬──────────┐
    │          │          │          │          │
    ▼          ▼          ▼          ▼          │
┌───────────────────┐ ┌──────────────────┐ ┌────────────────┐ ┌─────────────────────┐
│ QuantumNotebook   │ │ AnalysisResult   │ │ Workflow       │ │ WorkflowExecution   │
│ ─────────────────│ │ ───────────────  │ │ ─────────────  │ │ ──────────────────  │
│ Id (PK)           │ │ Id (PK)          │ │ Id (PK)        │ │ Id (PK)             │
│ Name              │ │ AnalysisType     │ │ Name           │ │ WorkflowId (FK)     │
│ UserId (FK)       │ │ UserId (FK)      │ │ UserId (FK)    │ │ UserId (FK)         │
│ CountyId (FK)     │ │ CountyId (FK)    │ │ CountyId (FK)  │ │ CountyId (FK)       │
│ CellsJson         │ │ NotebookId (FK?) │ │ DefinitionJson │ │ Status              │
│ Language          │ │ TestStatistic    │ │ Category       │ │ StartedAt           │
│ ExecutionCount    │ │ PValue           │ │ Complexity     │ │ CompletedAt         │
│ ...               │ │ EffectSize       │ │ NodeCount      │ │ DurationMs          │
│ CreatedAt         │ │ LatexOutput      │ │ ...            │ │ OutputJson          │
│ UpdatedAt         │ │ ApaOutput        │ │ CreatedAt      │ │ CreatedAt           │
└───────────────────┘ └──────────────────┘ │ UpdatedAt      │ │ UpdatedAt           │
                            │               └────────┬───────┘ └─────────────────────┘
                            └─────────(Optional)─────┘              │
                                                                     │ (1:N)
                                                                     │
                                                      ┌──────────────▼──────────────┐
                                                      │  Workflow.Executions        │
                                                      │  (Collection Navigation)    │
                                                      └─────────────────────────────┘
```

---

**Classification**: Database Schema Documentation - FISMA-HIGH Compliant Development
**Next Steps**: Run migration, create repository layer, implement persistence in services
**Contact**: TerraFusion Elite Engineering Team

---

**Version**: 1.0.0 (Phase 1 Week 3)
**Last Updated**: October 31, 2025
