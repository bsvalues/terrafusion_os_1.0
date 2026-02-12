CREATE TABLE [dbo].[comp_sales_point_time_sale] (
    [lTimeSale] INT         NOT NULL,
    [lPoints]   INT         NOT NULL,
    [lYear]     NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_point_time_sale] PRIMARY KEY CLUSTERED ([lYear] ASC, [lTimeSale] ASC) WITH (FILLFACTOR = 100)
);


GO

