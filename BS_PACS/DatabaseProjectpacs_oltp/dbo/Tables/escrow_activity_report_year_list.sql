CREATE TABLE [dbo].[escrow_activity_report_year_list] (
    [pacs_user_id] INT         NOT NULL,
    [escrow_year]  NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_escrow_activity_report_year_list] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [escrow_year] ASC) WITH (FILLFACTOR = 100)
);


GO

