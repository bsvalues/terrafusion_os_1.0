CREATE TABLE [dbo].[comp_sales_point_neighborhood] (
    [lNeighborhoodDiff] INT         NOT NULL,
    [lPoints]           INT         NOT NULL,
    [lYear]             NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_point_neighborhood] PRIMARY KEY CLUSTERED ([lYear] ASC, [lNeighborhoodDiff] ASC) WITH (FILLFACTOR = 100)
);


GO

