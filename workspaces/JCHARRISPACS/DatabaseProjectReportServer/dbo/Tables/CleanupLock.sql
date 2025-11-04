CREATE TABLE [dbo].[CleanupLock] (
    [ID]          INT            NOT NULL,
    [MachineName] NVARCHAR (256) NULL,
    [LockDate]    DATETIME       NOT NULL,
    CONSTRAINT [PK_ID] PRIMARY KEY CLUSTERED ([ID] ASC)
);


GO

