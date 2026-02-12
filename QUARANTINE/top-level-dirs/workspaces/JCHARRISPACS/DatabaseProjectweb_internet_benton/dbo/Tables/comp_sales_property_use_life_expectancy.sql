CREATE TABLE [dbo].[comp_sales_property_use_life_expectancy] (
    [szPropUse]       VARCHAR (10) NOT NULL,
    [lLifeExpectancy] INT          NOT NULL,
    [lYear]           NUMERIC (4)  NOT NULL,
    CONSTRAINT [CPK_comp_sales_property_use_life_expectancy] PRIMARY KEY CLUSTERED ([lYear] ASC, [szPropUse] ASC) WITH (FILLFACTOR = 100)
);


GO

