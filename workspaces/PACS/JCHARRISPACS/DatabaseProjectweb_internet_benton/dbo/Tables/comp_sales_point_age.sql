CREATE TABLE [dbo].[comp_sales_point_age] (
    [lAgeDiff] INT         NOT NULL,
    [lPoints]  INT         NOT NULL,
    [lYear]    NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_point_age] PRIMARY KEY CLUSTERED ([lYear] ASC, [lAgeDiff] ASC) WITH (FILLFACTOR = 100)
);


GO

