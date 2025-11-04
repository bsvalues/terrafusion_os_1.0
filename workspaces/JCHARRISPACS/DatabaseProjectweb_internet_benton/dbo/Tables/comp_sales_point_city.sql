CREATE TABLE [dbo].[comp_sales_point_city] (
    [lCityDiff] INT         NOT NULL,
    [lPoints]   INT         NOT NULL,
    [lYear]     NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_point_city] PRIMARY KEY CLUSTERED ([lYear] ASC, [lCityDiff] ASC) WITH (FILLFACTOR = 100)
);


GO

