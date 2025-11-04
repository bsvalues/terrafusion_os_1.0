CREATE TABLE [dbo].[comp_sales_point_quality] (
    [lQualityDiff] INT         NOT NULL,
    [lPoints]      INT         NOT NULL,
    [lYear]        NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_point_quality] PRIMARY KEY CLUSTERED ([lYear] ASC, [lQualityDiff] ASC) WITH (FILLFACTOR = 100)
);


GO

