CREATE TABLE [dbo].[fiscal_year_totals] (
    [entity_id]   INT             NOT NULL,
    [fiscal_year] VARCHAR (20)    NOT NULL,
    [tax_year]    NUMERIC (4)     NOT NULL,
    [beg_mno]     NUMERIC (14, 2) NULL,
    [beg_ins]     NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_fiscal_year_totals] PRIMARY KEY CLUSTERED ([entity_id] ASC, [fiscal_year] ASC, [tax_year] ASC) WITH (FILLFACTOR = 100)
);


GO

