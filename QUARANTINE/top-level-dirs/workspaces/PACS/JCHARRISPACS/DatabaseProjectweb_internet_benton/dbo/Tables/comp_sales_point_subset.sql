CREATE TABLE [dbo].[comp_sales_point_subset] (
    [lSubsetDiff] INT         NOT NULL,
    [lPoints]     INT         NOT NULL,
    [lYear]       NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_point_subset] PRIMARY KEY CLUSTERED ([lYear] ASC, [lSubsetDiff] ASC) WITH (FILLFACTOR = 100)
);


GO

