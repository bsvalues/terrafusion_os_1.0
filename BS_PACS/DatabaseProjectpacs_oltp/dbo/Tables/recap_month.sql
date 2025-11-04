CREATE TABLE [dbo].[recap_month] (
    [tax_month]  INT         NOT NULL,
    [tax_yr]     NUMERIC (4) NOT NULL,
    [begin_date] DATETIME    NULL,
    [end_date]   DATETIME    NULL,
    CONSTRAINT [CPK_recap_month] PRIMARY KEY CLUSTERED ([tax_yr] ASC, [tax_month] ASC) WITH (FILLFACTOR = 100)
);


GO

