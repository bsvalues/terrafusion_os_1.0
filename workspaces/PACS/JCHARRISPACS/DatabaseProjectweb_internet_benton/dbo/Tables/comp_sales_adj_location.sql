CREATE TABLE [dbo].[comp_sales_adj_location] (
    [szSubmarket] VARCHAR (10) NOT NULL,
    [fAdjPct]     REAL         NOT NULL,
    [lYear]       NUMERIC (4)  NOT NULL,
    CONSTRAINT [CPK_comp_sales_adj_location] PRIMARY KEY CLUSTERED ([lYear] ASC, [szSubmarket] ASC) WITH (FILLFACTOR = 100)
);


GO

