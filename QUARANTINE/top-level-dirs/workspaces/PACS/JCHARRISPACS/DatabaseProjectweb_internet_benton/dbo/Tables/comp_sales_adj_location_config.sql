CREATE TABLE [dbo].[comp_sales_adj_location_config] (
    [szSubmarket] VARCHAR (10) NOT NULL,
    [szComment]   VARCHAR (64) NULL,
    [lYear]       NUMERIC (4)  NOT NULL,
    CONSTRAINT [CPK_comp_sales_adj_location_config] PRIMARY KEY CLUSTERED ([lYear] ASC, [szSubmarket] ASC) WITH (FILLFACTOR = 100)
);


GO

