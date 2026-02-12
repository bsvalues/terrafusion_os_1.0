CREATE TABLE [dbo].[CatalogItemExtendedContent] (
    [Id]           BIGINT           IDENTITY (1, 1) NOT NULL,
    [ItemId]       UNIQUEIDENTIFIER NULL,
    [ContentType]  VARCHAR (50)     NULL,
    [Content]      VARBINARY (MAX)  NULL,
    [ModifiedDate] DATETIME         NULL,
    CONSTRAINT [PK_CatalogItemExtendedContent] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_CatalogItemExtendedContent_Catalog] FOREIGN KEY ([ItemId]) REFERENCES [dbo].[Catalog] ([ItemID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_ItemId_CatalogItemExtendedContent]
    ON [dbo].[CatalogItemExtendedContent]([ItemId] ASC, [ContentType] ASC);


GO

GRANT SELECT
    ON OBJECT::[dbo].[CatalogItemExtendedContent] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[CatalogItemExtendedContent] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[CatalogItemExtendedContent] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[CatalogItemExtendedContent] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[CatalogItemExtendedContent] TO [RSExecRole]
    AS [dbo];


GO

