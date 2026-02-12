CREATE TABLE [dbo].[FieldConfigurations] (
    [Id]          INT            IDENTITY (1, 1) NOT NULL,
    [TableName]   NVARCHAR (128) NOT NULL,
    [Name]        NVARCHAR (MAX) NOT NULL,
    [PolicyType]  INT            NOT NULL,
    [Label]       NVARCHAR (MAX) NULL,
    [CamaCloudId] NVARCHAR (MAX) NULL,
    [Type]        NVARCHAR (MAX) NOT NULL,
    [Length]      INT            NULL,
    [Precision]   INT            NULL,
    [Scale]       INT            NULL,
    CONSTRAINT [PK_dbo.FieldConfigurations] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_dbo.FieldConfigurations_dbo.TableConfigurations_TableName] FOREIGN KEY ([TableName]) REFERENCES [dbo].[TableConfigurations] ([Name]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_TableName]
    ON [dbo].[FieldConfigurations]([TableName] ASC);


GO

