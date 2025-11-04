CREATE TABLE [dbo].[CachePolicy] (
    [CachePolicyID]   UNIQUEIDENTIFIER NOT NULL,
    [ReportID]        UNIQUEIDENTIFIER NOT NULL,
    [ExpirationFlags] INT              NOT NULL,
    [CacheExpiration] INT              NULL,
    CONSTRAINT [PK_CachePolicy] PRIMARY KEY NONCLUSTERED ([CachePolicyID] ASC),
    CONSTRAINT [FK_CachePolicyReportID] FOREIGN KEY ([ReportID]) REFERENCES [dbo].[Catalog] ([ItemID]) ON DELETE CASCADE
);


GO

CREATE UNIQUE CLUSTERED INDEX [IX_CachePolicyReportID]
    ON [dbo].[CachePolicy]([ReportID] ASC);


GO

GRANT DELETE
    ON OBJECT::[dbo].[CachePolicy] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[CachePolicy] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[CachePolicy] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[CachePolicy] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[CachePolicy] TO [RSExecRole]
    AS [dbo];


GO

