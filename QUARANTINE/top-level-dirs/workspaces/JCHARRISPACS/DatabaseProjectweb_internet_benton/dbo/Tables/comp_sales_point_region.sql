CREATE TABLE [dbo].[comp_sales_point_region] (
    [lRegionDiff] INT         NOT NULL,
    [lPoints]     INT         NOT NULL,
    [lYear]       NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_point_region] PRIMARY KEY CLUSTERED ([lYear] ASC, [lRegionDiff] ASC) WITH (FILLFACTOR = 100)
);


GO

