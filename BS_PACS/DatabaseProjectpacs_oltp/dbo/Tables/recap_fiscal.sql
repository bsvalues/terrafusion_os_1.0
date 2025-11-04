CREATE TABLE [dbo].[recap_fiscal] (
    [entity_id]   INT          NOT NULL,
    [fiscal_year] VARCHAR (20) NOT NULL,
    [begin_date]  DATETIME     NOT NULL,
    [end_date]    DATETIME     NOT NULL,
    CONSTRAINT [CPK_recap_fiscal] PRIMARY KEY CLUSTERED ([entity_id] ASC, [fiscal_year] ASC) WITH (FILLFACTOR = 100)
);


GO

