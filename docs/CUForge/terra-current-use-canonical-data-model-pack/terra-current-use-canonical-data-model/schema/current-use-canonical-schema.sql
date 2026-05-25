-- Terra Current Use Canonical Schema
-- SQL Server baseline. Prefer EF migrations in repo.

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
    ContiguousGroupId NVARCHAR(128) NULL,
    Active BIT NOT NULL,
    CreatedAt DATETIMEOFFSET NOT NULL,
    CreatedBy NVARCHAR(256) NOT NULL,
    UpdatedAt DATETIMEOFFSET NOT NULL,
    UpdatedBy NVARCHAR(256) NOT NULL
);

CREATE TABLE CurrentUseRemovals (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    CountyId UNIQUEIDENTIFIER NOT NULL,
    ParcelId UNIQUEIDENTIFIER NOT NULL,
    ClassificationId UNIQUEIDENTIFIER NOT NULL,
    RemovalType NVARCHAR(64) NOT NULL,
    Status NVARCHAR(64) NOT NULL,
    RemovalReason NVARCHAR(2048) NOT NULL,
    IntentNoticeDate DATE NULL,
    OwnerResponseDueDate DATE NULL,
    FinalRemovalDate DATE NULL,
    CreatedAt DATETIMEOFFSET NOT NULL,
    CreatedBy NVARCHAR(256) NOT NULL,
    UpdatedAt DATETIMEOFFSET NOT NULL,
    UpdatedBy NVARCHAR(256) NOT NULL,
    CONSTRAINT FK_CurrentUseRemovals_Classifications
        FOREIGN KEY (ClassificationId) REFERENCES CurrentUseClassifications(Id)
);

CREATE TABLE CurrentUseRollbackCalculations (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    CountyId UNIQUEIDENTIFIER NOT NULL,
    ParcelId UNIQUEIDENTIFIER NOT NULL,
    ClassificationId UNIQUEIDENTIFIER NOT NULL,
    RemovalId UNIQUEIDENTIFIER NULL,
    PolicyPackId UNIQUEIDENTIFIER NULL,
    PolicyVersion NVARCHAR(128) NULL,
    CalculationVersion NVARCHAR(128) NOT NULL,
    InputSnapshotJson NVARCHAR(MAX) NOT NULL,
    ResultSnapshotJson NVARCHAR(MAX) NOT NULL,
    AdditionalTaxSubtotal DECIMAL(18,2) NOT NULL,
    InterestSubtotal DECIMAL(18,2) NOT NULL,
    PenaltyAmount DECIMAL(18,2) NOT NULL,
    TotalDue DECIMAL(18,2) NOT NULL,
    PenaltyApplied BIT NOT NULL,
    StatutoryExceptionApplied BIT NOT NULL,
    Locked BIT NOT NULL,
    CreatedAt DATETIMEOFFSET NOT NULL,
    CreatedBy NVARCHAR(256) NOT NULL,
    CONSTRAINT FK_CurrentUseRollback_Classifications
        FOREIGN KEY (ClassificationId) REFERENCES CurrentUseClassifications(Id),
    CONSTRAINT FK_CurrentUseRollback_Removals
        FOREIGN KEY (RemovalId) REFERENCES CurrentUseRemovals(Id)
);

CREATE TABLE CurrentUseEvidenceItems (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    CountyId UNIQUEIDENTIFIER NOT NULL,
    ParcelId UNIQUEIDENTIFIER NOT NULL,
    ClassificationId UNIQUEIDENTIFIER NULL,
    EvidenceType NVARCHAR(128) NOT NULL,
    Status NVARCHAR(64) NOT NULL,
    DossierDocumentId UNIQUEIDENTIFIER NULL,
    ReceivedAt DATETIMEOFFSET NULL,
    ReviewedAt DATETIMEOFFSET NULL,
    ReviewedBy NVARCHAR(256) NULL,
    Notes NVARCHAR(2048) NULL,
    CreatedAt DATETIMEOFFSET NOT NULL,
    CreatedBy NVARCHAR(256) NOT NULL,
    UpdatedAt DATETIMEOFFSET NOT NULL,
    UpdatedBy NVARCHAR(256) NOT NULL
);

CREATE TABLE CurrentUseTraceEvents (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    CountyId UNIQUEIDENTIFIER NOT NULL,
    ParcelId UNIQUEIDENTIFIER NOT NULL,
    ClassificationId UNIQUEIDENTIFIER NULL,
    CorrelationId UNIQUEIDENTIFIER NULL,
    Action NVARCHAR(128) NOT NULL,
    ActorId NVARCHAR(256) NOT NULL,
    ActorDisplayName NVARCHAR(256) NOT NULL,
    Timestamp DATETIMEOFFSET NOT NULL,
    Summary NVARCHAR(2048) NOT NULL,
    PayloadJson NVARCHAR(MAX) NULL,
    Hash NVARCHAR(128) NOT NULL,
    PreviousHash NVARCHAR(128) NULL
);

CREATE INDEX IX_CU_Classifications_County_Parcel ON CurrentUseClassifications(CountyId, ParcelId);
CREATE INDEX IX_CU_Removals_County_Parcel ON CurrentUseRemovals(CountyId, ParcelId);
CREATE INDEX IX_CU_Rollback_County_Parcel ON CurrentUseRollbackCalculations(CountyId, ParcelId);
CREATE INDEX IX_CU_Evidence_County_Parcel ON CurrentUseEvidenceItems(CountyId, ParcelId);
CREATE INDEX IX_CU_Trace_County_Parcel_Timestamp ON CurrentUseTraceEvents(CountyId, ParcelId, Timestamp);
