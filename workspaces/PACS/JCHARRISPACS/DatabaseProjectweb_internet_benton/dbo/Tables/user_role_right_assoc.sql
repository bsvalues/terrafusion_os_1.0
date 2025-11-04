CREATE TABLE [dbo].[user_role_right_assoc] (
    [role_id]       INT NOT NULL,
    [user_right_id] INT NOT NULL,
    CONSTRAINT [CPK_user_role_right_assoc] PRIMARY KEY CLUSTERED ([role_id] ASC, [user_right_id] ASC) WITH (FILLFACTOR = 100)
);


GO

