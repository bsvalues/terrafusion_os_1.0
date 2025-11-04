CREATE TABLE [dbo].[FieldDefaultValues] (
    [Id]           INT            IDENTITY (1, 1) NOT NULL,
    [TableName]    NVARCHAR (128) NOT NULL,
    [ColumnName]   NVARCHAR (MAX) NOT NULL,
    [DefaultValue] NVARCHAR (MAX) NOT NULL,
    CONSTRAINT [PK_dbo.FieldDefaultValues] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_dbo.FieldDefaultValues_dbo.TableConfigurations_TableName] FOREIGN KEY ([TableName]) REFERENCES [dbo].[TableConfigurations] ([Name]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_TableName]
    ON [dbo].[FieldDefaultValues]([TableName] ASC);


GO

