CREATE TABLE [dbo].[escrow_activity_report] (
    [pacs_user_id]  INT             NOT NULL,
    [total_payment] NUMERIC (14, 2) NULL,
    [total_void]    NUMERIC (14, 2) NULL,
    [total_escrow]  NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_escrow_activity_report] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC) WITH (FILLFACTOR = 100)
);


GO

