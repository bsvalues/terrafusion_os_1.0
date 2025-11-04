CREATE TABLE [dbo].[GlobalSettings] (
    [Id]                           INT            IDENTITY (1, 1) NOT NULL,
    [CamaCloudState]               NVARCHAR (MAX) NOT NULL,
    [LastSyncJobId]                NVARCHAR (MAX) NULL,
    [LastAssignmentGroupSyncJobId] NVARCHAR (MAX) NULL,
    [LastChangeSchemaJobId]        NVARCHAR (MAX) NULL,
    [LastPhotoDownloadJobId]       NVARCHAR (MAX) NULL,
    [IsPhotoMetaDataSchemaSent]    BIT            NOT NULL,
    [LastSyncTime]                 DATETIME       NOT NULL,
    [LastDownSyncTime]             DATETIME       NOT NULL,
    [ImageUploadCompletedTime]     DATETIME       NOT NULL,
    [CurrentTable]                 BIGINT         NOT NULL,
    [TotalTables]                  BIGINT         NOT NULL,
    [TotalPhotoPages]              BIGINT         NOT NULL,
    [CurrentPhotoPage]             BIGINT         NOT NULL,
    [UserQueueRunId]               INT            NULL,
    [ImageQueueRunId]              INT            NULL,
    [UpSyncQueueRunId]             INT            NULL,
    [AssignmentGroupQueueRunId]    INT            NULL,
    [TotalNumberOfLookupTables]    BIGINT         NOT NULL,
    [CurrentLookupTablesUploaded]  BIGINT         NOT NULL,
    [IsPropertyTableComplete]      BIT            NOT NULL,
    [HasPhotos]                    BIT            NOT NULL,
    [IsFinalized]                  BIT            NOT NULL,
    [LastChangeId]                 BIGINT         NOT NULL,
    [RelinkAssignmentGroup]        BIT            NOT NULL,
    [LastCleanDataJobId]           NVARCHAR (MAX) NULL,
    [CleanDataRunId]               INT            NULL,
    CONSTRAINT [PK_dbo.GlobalSettings] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO

