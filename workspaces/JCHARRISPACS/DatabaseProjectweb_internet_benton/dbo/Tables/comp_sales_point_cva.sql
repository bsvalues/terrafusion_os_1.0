CREATE TABLE [dbo].[comp_sales_point_cva] (
    [lPointDiff] INT         NOT NULL,
    [lPoints]    INT         NOT NULL,
    [lYear]      NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_point_cva] PRIMARY KEY CLUSTERED ([lYear] ASC, [lPointDiff] ASC) WITH (FILLFACTOR = 100)
);


GO

