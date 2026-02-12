CREATE TABLE [dbo].[comp_sales_point_location] (
    [lLocationDiff] INT         NOT NULL,
    [lPoints]       INT         NOT NULL,
    [lYear]         NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_point_location] PRIMARY KEY CLUSTERED ([lYear] ASC, [lLocationDiff] ASC) WITH (FILLFACTOR = 100)
);


GO

