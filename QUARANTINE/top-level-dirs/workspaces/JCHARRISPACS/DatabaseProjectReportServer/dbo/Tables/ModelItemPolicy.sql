CREATE TABLE [dbo].[ModelItemPolicy] (
    [ID]            UNIQUEIDENTIFIER NOT NULL,
    [CatalogItemID] UNIQUEIDENTIFIER NOT NULL,
    [ModelItemID]   NVARCHAR (425)   NOT NULL,
    [PolicyID]      UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [PK_ModelItemPolicy] PRIMARY KEY NONCLUSTERED ([ID] ASC),
    CONSTRAINT [FK_PoliciesPolicyID] FOREIGN KEY ([PolicyID]) REFERENCES [dbo].[Policies] ([PolicyID]) ON DELETE CASCADE
);


GO

CREATE CLUSTERED INDEX [IX_ModelItemPolicy]
    ON [dbo].[ModelItemPolicy]([CatalogItemID] ASC, [ModelItemID] ASC);


GO

