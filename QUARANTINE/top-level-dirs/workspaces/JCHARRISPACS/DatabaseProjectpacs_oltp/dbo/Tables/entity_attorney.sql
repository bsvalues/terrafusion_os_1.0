CREATE TABLE [dbo].[entity_attorney] (
    [entity_id]          INT         NOT NULL,
    [entity_attorney_id] INT         NOT NULL,
    [attorney_tax_yr]    NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_entity_attorney] PRIMARY KEY CLUSTERED ([entity_id] ASC, [entity_attorney_id] ASC, [attorney_tax_yr] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_entity_attorney_entity_attorney_id] FOREIGN KEY ([entity_attorney_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_entity_attorney_entity_id] FOREIGN KEY ([entity_id]) REFERENCES [dbo].[entity] ([entity_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_entity_attorney_id]
    ON [dbo].[entity_attorney]([entity_attorney_id] ASC) WITH (FILLFACTOR = 90);


GO

