CREATE TABLE [dbo].[comp_sales_adj_finance] (
    [szFinanceCode] CHAR (5)    NOT NULL,
    [fAdjPct]       REAL        NOT NULL,
    [lYear]         NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_adj_finance] PRIMARY KEY CLUSTERED ([lYear] ASC, [szFinanceCode] ASC) WITH (FILLFACTOR = 100)
);


GO

