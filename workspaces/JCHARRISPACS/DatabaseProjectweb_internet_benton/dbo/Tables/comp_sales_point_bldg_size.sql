CREATE TABLE [dbo].[comp_sales_point_bldg_size] (
    [lBldgSizeDiff] INT         NOT NULL,
    [lPoints]       INT         NOT NULL,
    [lYear]         NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_point_bldg_size] PRIMARY KEY CLUSTERED ([lYear] ASC, [lBldgSizeDiff] ASC) WITH (FILLFACTOR = 100)
);


GO

