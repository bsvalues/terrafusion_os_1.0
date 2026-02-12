CREATE TABLE [dbo].[entity_tax_statement_group] (
    [group_id]      INT          NOT NULL,
    [group_yr]      NUMERIC (4)  NOT NULL,
    [group_desc]    VARCHAR (50) NOT NULL,
    [assigned_id]   CHAR (1)     NULL,
    [assigned_date] DATETIME     NULL,
    CONSTRAINT [CPK_entity_tax_statement_group] PRIMARY KEY CLUSTERED ([group_id] ASC, [group_yr] ASC, [group_desc] ASC) WITH (FILLFACTOR = 100)
);


GO

