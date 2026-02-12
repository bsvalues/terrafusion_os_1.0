CREATE TABLE [dbo].[fiscal_year] (
    [fiscal_year_id]  INT         IDENTITY (1, 1) NOT NULL,
    [district_id]     INT         NOT NULL,
    [begin_tax_year]  NUMERIC (4) NULL,
    [begin_tax_month] INT         NULL,
    [end_tax_year]    NUMERIC (4) NULL,
    [end_tax_month]   INT         NULL,
    [prelim_end_date] DATETIME    NULL,
    CONSTRAINT [CPK_fiscal_year] PRIMARY KEY CLUSTERED ([fiscal_year_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_fiscal_year_district_id] FOREIGN KEY ([district_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_fiscal_year_end_tax_year_end_tax_month] FOREIGN KEY ([end_tax_year], [end_tax_month]) REFERENCES [dbo].[fiscal_month] ([tax_year], [tax_month])
);


GO

