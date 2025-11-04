CREATE TABLE [dbo].[monthly_report_detail] (
    [pacs_user_id] INT             NOT NULL,
    [entity_id]    INT             NOT NULL,
    [year_desc]    VARCHAR (50)    NOT NULL,
    [tax_yr]       NUMERIC (4)     NULL,
    [orig_tax]     NUMERIC (14, 2) NULL,
    [adj_amt]      NUMERIC (14, 2) NULL,
    [prev_coll]    NUMERIC (14, 2) NULL,
    [curr_coll]    NUMERIC (14, 2) NULL,
    [prev_pi]      NUMERIC (14, 2) NULL,
    [curr_pi]      NUMERIC (14, 2) NULL,
    [prev_und]     NUMERIC (14, 2) NULL,
    [curr_und]     NUMERIC (14, 2) NULL,
    [prev_over]    NUMERIC (14, 2) NULL,
    [curr_over]    NUMERIC (14, 2) NULL,
    [prev_disc]    NUMERIC (14, 2) NULL,
    [curr_disc]    NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_monthly_report_detail] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [year_desc] ASC) WITH (FILLFACTOR = 100)
);


GO

