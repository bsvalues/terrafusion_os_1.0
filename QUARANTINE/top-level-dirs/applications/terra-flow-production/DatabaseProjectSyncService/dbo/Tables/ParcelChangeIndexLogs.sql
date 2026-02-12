CREATE TABLE [dbo].[ParcelChangeIndexLogs] (
    [Id]             INT              IDENTITY (1, 1) NOT NULL,
    [DownSyncId]     UNIQUEIDENTIFIER NOT NULL,
    [TableName]      NVARCHAR (MAX)   NULL,
    [Action]         NVARCHAR (MAX)   NULL,
    [ParcelId]       INT              NOT NULL,
    [AuxRowId]       NVARCHAR (MAX)   NULL,
    [ParentRowId]    NVARCHAR (MAX)   NULL,
    [Keys]           NVARCHAR (MAX)   NULL,
    [NewValue]       NVARCHAR (MAX)   NULL,
    [FieldId]        INT              NOT NULL,
    [ReviewedBy]     NVARCHAR (MAX)   NULL,
    [ReviewTime]     DATETIME         NOT NULL,
    [QCBy]           NVARCHAR (MAX)   NULL,
    [QCTime]         NVARCHAR (MAX)   NULL,
    [PCIStatus]      NVARCHAR (MAX)   NULL,
    [PCIDescription] NVARCHAR (MAX)   NULL,
    CONSTRAINT [PK_dbo.ParcelChangeIndexLogs] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO

