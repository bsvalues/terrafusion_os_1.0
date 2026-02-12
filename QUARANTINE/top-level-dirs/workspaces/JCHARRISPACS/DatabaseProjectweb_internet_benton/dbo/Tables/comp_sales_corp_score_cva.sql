CREATE TABLE [dbo].[comp_sales_corp_score_cva] (
    [szCVA]   VARCHAR (10) NOT NULL,
    [lPoints] INT          NOT NULL,
    [lYear]   NUMERIC (4)  NOT NULL,
    CONSTRAINT [CPK_comp_sales_corp_score_cva] PRIMARY KEY CLUSTERED ([lYear] ASC, [szCVA] ASC) WITH (FILLFACTOR = 100)
);


GO

