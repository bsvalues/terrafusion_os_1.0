CREATE TABLE [dbo].[entity_tax_statement_group_assoc] (
    [group_id]  INT NOT NULL,
    [entity_id] INT NOT NULL,
    CONSTRAINT [CPK_entity_tax_statement_group_assoc] PRIMARY KEY CLUSTERED ([group_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 100)
);


GO

