CREATE TABLE [dbo].[user_right_user_assoc] (
    [pacs_user_id]  INT NOT NULL,
    [user_right_id] INT NOT NULL,
    CONSTRAINT [CPK_user_right_user_assoc] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [user_right_id] ASC) WITH (FILLFACTOR = 100)
);


GO

