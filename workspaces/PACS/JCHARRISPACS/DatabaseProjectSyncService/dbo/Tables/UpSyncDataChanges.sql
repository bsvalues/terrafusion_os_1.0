CREATE TABLE [dbo].[UpSyncDataChanges] (
    [Id]                  INT            IDENTITY (1, 1) NOT NULL,
    [TableName]           NVARCHAR (MAX) NULL,
    [FieldName]           NVARCHAR (MAX) NULL,
    [Keys]                NVARCHAR (MAX) NULL,
    [NewValue]            NVARCHAR (MAX) NULL,
    [OldValue]            NVARCHAR (MAX) NULL,
    [Action]              NVARCHAR (MAX) NULL,
    [Date]                DATETIME       NULL,
    [RecordInsertedDate]  DATETIME       NOT NULL,
    [IsProcessedDate]     DATETIME       NULL,
    [PACSUser]            NVARCHAR (MAX) NULL,
    [CCFieldId]           NVARCHAR (MAX) NULL,
    [ParcelId]            NVARCHAR (MAX) NULL,
    [UniqueCCRowId]       NVARCHAR (MAX) NULL,
    [UniqueCCParentRowId] NVARCHAR (MAX) NULL,
    [IsProcessed]         BIT            NOT NULL,
    CONSTRAINT [PK_dbo.UpSyncDataChanges] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO

