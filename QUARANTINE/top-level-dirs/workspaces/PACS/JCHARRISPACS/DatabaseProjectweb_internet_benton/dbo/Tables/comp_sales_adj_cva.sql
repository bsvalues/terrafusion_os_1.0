CREATE TABLE [dbo].[comp_sales_adj_cva] (
    [szCVA]   VARCHAR (10) NOT NULL,
    [fAdjPct] REAL         NOT NULL,
    [lYear]   NUMERIC (4)  NOT NULL,
    CONSTRAINT [CPK_comp_sales_adj_cva] PRIMARY KEY CLUSTERED ([lYear] ASC, [szCVA] ASC) WITH (FILLFACTOR = 100)
);


GO

