CREATE TABLE [dbo].[curr_delq_batch_list] (
    [pacs_user_id] INT NOT NULL,
    [batch_id]     INT NOT NULL,
    CONSTRAINT [CPK_curr_delq_batch_list] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [batch_id] ASC) WITH (FILLFACTOR = 100)
);


GO

