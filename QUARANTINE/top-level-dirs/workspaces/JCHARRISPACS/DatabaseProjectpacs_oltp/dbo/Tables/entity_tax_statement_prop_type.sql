CREATE TABLE [dbo].[entity_tax_statement_prop_type] (
    [pacs_user_id]  INT         NOT NULL,
    [levy_group_id] INT         NOT NULL,
    [levy_group_yr] NUMERIC (4) NOT NULL,
    [levy_sup_num]  INT         NOT NULL,
    [levy_run]      INT         NOT NULL,
    [prop_type_cd]  CHAR (5)    NOT NULL,
    CONSTRAINT [CPK_entity_tax_statement_prop_type] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [levy_group_id] ASC, [levy_group_yr] ASC, [levy_sup_num] ASC, [levy_run] ASC, [prop_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

