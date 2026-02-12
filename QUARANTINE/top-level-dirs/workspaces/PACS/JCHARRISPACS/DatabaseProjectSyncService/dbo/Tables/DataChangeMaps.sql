CREATE TABLE [dbo].[DataChangeMaps] (
    [Id]            INT            IDENTITY (1, 1) NOT NULL,
    [TableName]     NVARCHAR (MAX) NULL,
    [CompositeKey]  NVARCHAR (MAX) NULL,
    [UniqueCCRowId] NVARCHAR (MAX) NULL,
    CONSTRAINT [PK_dbo.DataChangeMaps] PRIMARY KEY CLUSTERED ([Id] ASC)
);


GO

