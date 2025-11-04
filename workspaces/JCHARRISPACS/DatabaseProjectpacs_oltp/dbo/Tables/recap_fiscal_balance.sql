CREATE TABLE [dbo].[recap_fiscal_balance] (
    [entity_id]   INT             NOT NULL,
    [tax_month]   INT             NOT NULL,
    [tax_year]    NUMERIC (4)     NOT NULL,
    [coll_year]   NUMERIC (4)     NOT NULL,
    [balance_mno] NUMERIC (14, 2) NULL,
    [balance_ins] NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_recap_fiscal_balance] PRIMARY KEY CLUSTERED ([entity_id] ASC, [tax_month] ASC, [tax_year] ASC, [coll_year] ASC) WITH (FILLFACTOR = 100)
);


GO

