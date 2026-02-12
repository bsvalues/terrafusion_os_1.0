CREATE TABLE [dbo].[ParcelMaps] (
    [Id]           INT            IDENTITY (1, 1) NOT NULL,
    [TableName]    NVARCHAR (128) NOT NULL,
    [CompositeKey] NVARCHAR (MAX) NOT NULL,
    [ParcelId]     NVARCHAR (MAX) NULL,
    CONSTRAINT [PK_dbo.ParcelMaps] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_dbo.ParcelMaps_dbo.TableConfigurations_TableName] FOREIGN KEY ([TableName]) REFERENCES [dbo].[TableConfigurations] ([Name]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_TableName]
    ON [dbo].[ParcelMaps]([TableName] ASC);


GO

