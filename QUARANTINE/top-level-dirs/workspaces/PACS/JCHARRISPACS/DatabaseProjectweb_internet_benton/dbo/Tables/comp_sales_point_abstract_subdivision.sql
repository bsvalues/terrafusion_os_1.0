CREATE TABLE [dbo].[comp_sales_point_abstract_subdivision] (
    [lAbstractSubdivisionDiff] INT         NOT NULL,
    [lPoints]                  INT         NOT NULL,
    [lYear]                    NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_point_abstract_subdivision] PRIMARY KEY CLUSTERED ([lYear] ASC, [lAbstractSubdivisionDiff] ASC) WITH (FILLFACTOR = 100)
);


GO

