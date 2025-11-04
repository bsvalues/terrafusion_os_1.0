CREATE TABLE [dbo].[comp_sales_point_nra] (
    [lNRADiff] INT         NOT NULL,
    [lPoints]  INT         NOT NULL,
    [lYear]    NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_point_nra] PRIMARY KEY CLUSTERED ([lYear] ASC, [lNRADiff] ASC) WITH (FILLFACTOR = 100)
);


GO

