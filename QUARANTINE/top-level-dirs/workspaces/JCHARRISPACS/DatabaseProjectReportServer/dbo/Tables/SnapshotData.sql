CREATE TABLE [dbo].[SnapshotData] (
    [SnapshotDataID]    UNIQUEIDENTIFIER NOT NULL,
    [CreatedDate]       DATETIME         NOT NULL,
    [ParamsHash]        INT              NULL,
    [QueryParams]       NTEXT            NULL,
    [EffectiveParams]   NTEXT            NULL,
    [Description]       NVARCHAR (512)   NULL,
    [DependsOnUser]     BIT              NULL,
    [PermanentRefcount] INT              NOT NULL,
    [TransientRefcount] INT              NOT NULL,
    [ExpirationDate]    DATETIME         NOT NULL,
    [PageCount]         INT              NULL,
    [HasDocMap]         BIT              NULL,
    [PaginationMode]    SMALLINT         NULL,
    [ProcessingFlags]   INT              NULL,
    CONSTRAINT [PK_SnapshotData] PRIMARY KEY CLUSTERED ([SnapshotDataID] ASC)
);


GO
EXECUTE sp_tableoption @TableNamePattern = N'[dbo].[SnapshotData]', @OptionName = N'text in row', @OptionValue = N'256';


GO

CREATE NONCLUSTERED INDEX [IX_SnapshotCleaning]
    ON [dbo].[SnapshotData]([PermanentRefcount] ASC);


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[SnapshotData] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[SnapshotData] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[SnapshotData] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[SnapshotData] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[SnapshotData] TO [RSExecRole]
    AS [dbo];


GO

