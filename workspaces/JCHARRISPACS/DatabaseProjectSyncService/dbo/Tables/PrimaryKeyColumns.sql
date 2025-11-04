CREATE TABLE [dbo].[PrimaryKeyColumns] (
    [Id]        INT            IDENTITY (1, 1) NOT NULL,
    [TableName] NVARCHAR (128) NOT NULL,
    [Name]      NVARCHAR (MAX) NOT NULL,
    [Order]     INT            NOT NULL,
    CONSTRAINT [PK_dbo.PrimaryKeyColumns] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_dbo.PrimaryKeyColumns_dbo.TableConfigurations_TableName] FOREIGN KEY ([TableName]) REFERENCES [dbo].[TableConfigurations] ([Name]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_TableName]
    ON [dbo].[PrimaryKeyColumns]([TableName] ASC);


GO

