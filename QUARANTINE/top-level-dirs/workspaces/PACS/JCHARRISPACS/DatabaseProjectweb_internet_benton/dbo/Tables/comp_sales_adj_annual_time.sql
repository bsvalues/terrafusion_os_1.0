CREATE TABLE [dbo].[comp_sales_adj_annual_time] (
    [szPropUse] VARCHAR (10) NOT NULL,
    [fAdjPct]   REAL         NOT NULL,
    [lYear]     NUMERIC (4)  NOT NULL,
    CONSTRAINT [CPK_comp_sales_adj_annual_time] PRIMARY KEY CLUSTERED ([lYear] ASC, [szPropUse] ASC) WITH (FILLFACTOR = 100)
);


GO

