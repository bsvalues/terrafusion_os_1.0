CREATE TABLE [dbo].[comp_sales_corp_score_school] (
    [lSchool] INT         NOT NULL,
    [lPoints] INT         NOT NULL,
    [lYear]   NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_comp_sales_corp_score_school] PRIMARY KEY CLUSTERED ([lYear] ASC, [lSchool] ASC) WITH (FILLFACTOR = 100)
);


GO

