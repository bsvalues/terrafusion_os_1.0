CREATE TABLE [dbo].[fiscal_month] (
    [tax_year]   NUMERIC (4) NOT NULL,
    [tax_month]  INT         NOT NULL,
    [begin_date] DATETIME    NULL,
    [end_date]   DATETIME    NULL,
    CONSTRAINT [CPK_fiscal_month] PRIMARY KEY CLUSTERED ([tax_year] ASC, [tax_month] ASC) WITH (FILLFACTOR = 100)
);


GO

