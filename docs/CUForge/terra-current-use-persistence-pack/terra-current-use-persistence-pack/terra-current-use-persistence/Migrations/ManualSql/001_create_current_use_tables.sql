-- TerraForge Current Use Command Center — Phase 1 Persistence
-- SQL Server style manual baseline. Prefer EF migrations in the actual repo.

CREATE TABLE CurrentUseClassifications (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    CountyId UNIQUEIDENTIFIER NOT NULL,
    ParcelId UNIQUEIDENTIFIER NOT NULL,
    ClassificationType NVARCHAR(64) NOT NULL,
    LifecycleState NVARCHAR(64) NOT NULL,
    ClassifiedAcres DECIMAL(18,4) NOT NULL,
    TotalParcelAcresSnapshot DECIMAL(18,4) NULL,
    HomesiteExcludedAcres DECIMAL(18,4) NULL,
    ApprovalDate DATE NULL,
    EffectiveTaxYear INT NULL,
    CurrentUseApplicationNumber NVARCHAR(128) NULL,
    AgreementNumber NVARCHAR(128) NULL,
    ContiguousGroupId NVARCHAR(128) NULL,
    Active BIT NOT NULL,
    CreatedAt DATETIMEOFFSET NOT NULL,
    CreatedBy NVARCHAR(256) NOT NULL,
    UpdatedAt DATETIMEOFFSET NOT NULL,
    UpdatedBy NVARCHAR(256) NOT NULL
);

CREATE INDEX IX_CurrentUseClassifications_County_Parcel_Active
ON CurrentUseClassifications (CountyId, ParcelId, Active);

CREATE TABLE CurrentUseRollbackCalculations (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    CountyId UNIQUEIDENTIFIER NOT NULL,
    ParcelId UNIQUEIDENTIFIER NOT NULL,
    ClassificationId UNIQUEIDENTIFIER NOT NULL,
    RemovalId UNIQUEIDENTIFIER NULL,
    CalculationVersion NVARCHAR(128) NOT NULL,
    InputSnapshotJson NVARCHAR(MAX) NOT NULL,
    ResultSnapshotJson NVARCHAR(MAX) NOT NULL,
    AdditionalTaxSubtotal DECIMAL(18,2) NOT NULL,
    InterestSubtotal DECIMAL(18,2) NOT NULL,
    PenaltyAmount DECIMAL(18,2) NOT NULL,
    TotalDue DECIMAL(18,2) NOT NULL,
    PenaltyApplied BIT NOT NULL,
    PenaltySuppressionReason NVARCHAR(128) NULL,
    StatutoryExceptionApplied BIT NOT NULL,
    StatutoryExceptionReason NVARCHAR(128) NULL,
    Locked BIT NOT NULL,
    CreatedAt DATETIMEOFFSET NOT NULL,
    CreatedBy NVARCHAR(256) NOT NULL
);

CREATE INDEX IX_CurrentUseRollbackCalculations_County_Parcel
ON CurrentUseRollbackCalculations (CountyId, ParcelId);

CREATE TABLE CurrentUseEvidenceItems (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    CountyId UNIQUEIDENTIFIER NOT NULL,
    ParcelId UNIQUEIDENTIFIER NOT NULL,
    ClassificationId UNIQUEIDENTIFIER NULL,
    ReviewId UNIQUEIDENTIFIER NULL,
    EvidenceType NVARCHAR(128) NOT NULL,
    Status NVARCHAR(64) NOT NULL,
    DocumentId UNIQUEIDENTIFIER NULL,
    ReceivedAt DATETIMEOFFSET NULL,
    ReviewedAt DATETIMEOFFSET NULL,
    ReviewedBy NVARCHAR(256) NULL,
    Notes NVARCHAR(2048) NULL,
    CreatedAt DATETIMEOFFSET NOT NULL,
    CreatedBy NVARCHAR(256) NOT NULL,
    UpdatedAt DATETIMEOFFSET NOT NULL,
    UpdatedBy NVARCHAR(256) NOT NULL
);

CREATE INDEX IX_CurrentUseEvidenceItems_County_Parcel
ON CurrentUseEvidenceItems (CountyId, ParcelId);

CREATE TABLE CurrentUseTimelineEvents (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    CountyId UNIQUEIDENTIFIER NOT NULL,
    ParcelId UNIQUEIDENTIFIER NOT NULL,
    ClassificationId UNIQUEIDENTIFIER NULL,
    EventType NVARCHAR(128) NOT NULL,
    EventDate DATETIMEOFFSET NOT NULL,
    ActorId NVARCHAR(256) NOT NULL,
    ActorDisplayName NVARCHAR(256) NOT NULL,
    Summary NVARCHAR(2048) NOT NULL,
    PayloadJson NVARCHAR(MAX) NULL,
    CorrectionOfEventId UNIQUEIDENTIFIER NULL
);

CREATE INDEX IX_CurrentUseTimelineEvents_County_Parcel_EventDate
ON CurrentUseTimelineEvents (CountyId, ParcelId, EventDate);
