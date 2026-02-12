CREATE TABLE [dbo].[monitors_users] (
    [monitor_id]   INT NOT NULL,
    [pacs_user_id] INT NOT NULL,
    CONSTRAINT [CPK_monitors_users] PRIMARY KEY CLUSTERED ([monitor_id] ASC, [pacs_user_id] ASC) WITH (FILLFACTOR = 100)
);


GO

