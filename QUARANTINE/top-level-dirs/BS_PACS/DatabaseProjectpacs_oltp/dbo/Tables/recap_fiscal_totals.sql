CREATE TABLE [dbo].[recap_fiscal_totals] (
    [entity_id]   INT             NOT NULL,
    [fiscal_year] VARCHAR (20)    NOT NULL,
    [coll_year]   NUMERIC (4)     NOT NULL,
    [beg_mno]     NUMERIC (14, 2) NOT NULL,
    [beg_ins]     NUMERIC (14, 2) NOT NULL,
    CONSTRAINT [CPK_recap_fiscal_totals] PRIMARY KEY CLUSTERED ([entity_id] ASC, [fiscal_year] ASC, [coll_year] ASC) WITH (FILLFACTOR = 100)
);


GO

