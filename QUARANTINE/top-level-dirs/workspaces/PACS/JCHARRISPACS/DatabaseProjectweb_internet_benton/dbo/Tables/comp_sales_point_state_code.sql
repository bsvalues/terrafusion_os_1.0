CREATE TABLE [dbo].[comp_sales_point_state_code] (
    [lStateCodeDiff] INT         NOT NULL,
    [lPoints]        INT         NOT NULL,
    [lYear]          NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_point_state_code] PRIMARY KEY CLUSTERED ([lYear] ASC, [lStateCodeDiff] ASC) WITH (FILLFACTOR = 100)
);


GO

