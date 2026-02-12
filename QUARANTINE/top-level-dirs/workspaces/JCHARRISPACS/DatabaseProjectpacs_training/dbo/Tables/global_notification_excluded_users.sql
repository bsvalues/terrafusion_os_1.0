CREATE TABLE [dbo].[global_notification_excluded_users] (
    [notification_id] INT NOT NULL,
    [pacs_user_id]    INT NOT NULL,
    CONSTRAINT [CFK_global_notification_excluded_users_notification_id] FOREIGN KEY ([notification_id]) REFERENCES [dbo].[global_notification] ([notification_id]),
    CONSTRAINT [CFK_global_notification_excluded_users_pacs_user_id] FOREIGN KEY ([pacs_user_id]) REFERENCES [dbo].[pacs_user] ([pacs_user_id])
);


GO

CREATE CLUSTERED INDEX [idx_notification_id_pacs_user_id]
    ON [dbo].[global_notification_excluded_users]([notification_id] ASC, [pacs_user_id] ASC);


GO

