CREATE TABLE [dbo].[escrow_activity_report_batch_list] (
    [pacs_user_id] INT NOT NULL,
    [batch_id]     INT NOT NULL,
    CONSTRAINT [CPK_escrow_activity_report_batch_list] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [batch_id] ASC) WITH (FILLFACTOR = 100)
);


GO

