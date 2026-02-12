CREATE TABLE [dbo].[comp_sales_corp_score_neighborhood] (
    [szNeighborhood] VARCHAR (10) NOT NULL,
    [lPoints]        INT          NOT NULL,
    [lYear]          NUMERIC (4)  NOT NULL,
    CONSTRAINT [CPK_comp_sales_corp_score_neighborhood] PRIMARY KEY CLUSTERED ([lYear] ASC, [szNeighborhood] ASC) WITH (FILLFACTOR = 100)
);


GO

