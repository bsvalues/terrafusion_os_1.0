CREATE TABLE [dbo].[recap_balance] (
    [type]      VARCHAR (5)     NOT NULL,
    [entity_id] INT             NOT NULL,
    [tax_month] INT             NOT NULL,
    [tax_yr]    NUMERIC (4)     NOT NULL,
    [balance]   NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_recap_balance] PRIMARY KEY CLUSTERED ([type] ASC, [entity_id] ASC, [tax_yr] ASC, [tax_month] ASC) WITH (FILLFACTOR = 100)
);


GO

