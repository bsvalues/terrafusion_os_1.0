CREATE TABLE [dbo].[comp_sales_adj_feature] (
    [lYear]          NUMERIC (4)  NOT NULL,
    [szQualityCode]  VARCHAR (10) NOT NULL,
    [lAttributeCode] INT          NOT NULL,
    [lRangeAmount]   INT          NOT NULL,
    [lAdjAmount]     INT          NOT NULL,
    CONSTRAINT [CPK_comp_sales_adj_feature] PRIMARY KEY CLUSTERED ([lYear] ASC, [szQualityCode] ASC, [lAttributeCode] ASC, [lRangeAmount] ASC) WITH (FILLFACTOR = 100)
);


GO

