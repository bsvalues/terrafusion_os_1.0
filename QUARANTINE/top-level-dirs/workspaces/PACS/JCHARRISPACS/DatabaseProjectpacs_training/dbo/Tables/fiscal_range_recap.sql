CREATE TABLE [dbo].[fiscal_range_recap] (
    [pacs_user_id]    INT          NOT NULL,
    [entity_id]       INT          NOT NULL,
    [report_month]    VARCHAR (20) NULL,
    [report_year]     NUMERIC (4)  NULL,
    [fiscal_year]     VARCHAR (20) NULL,
    [report_begin_dt] DATETIME     NULL,
    [report_end_dt]   DATETIME     NULL,
    CONSTRAINT [CPK_fiscal_range_recap] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 100)
);


GO

