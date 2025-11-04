CREATE TABLE [dbo].[fiscal_year_month_end_balance_due] (
    [fiscal_year_id]  INT             NOT NULL,
    [collection_year] NUMERIC (4)     NOT NULL,
    [tax_year]        NUMERIC (4)     NOT NULL,
    [tax_month]       INT             NOT NULL,
    [balance_due]     NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_fiscal_year_month_end_balance_due] PRIMARY KEY CLUSTERED ([fiscal_year_id] ASC, [collection_year] ASC, [tax_year] ASC, [tax_month] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_fiscal_year_month_end_balance_due_tax_year_tax_month] FOREIGN KEY ([tax_year], [tax_month]) REFERENCES [dbo].[fiscal_month] ([tax_year], [tax_month])
);


GO

