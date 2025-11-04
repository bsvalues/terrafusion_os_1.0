CREATE TABLE [dbo].[user_role_user_assoc] (
    [pacs_user_id] INT NOT NULL,
    [role_id]      INT NOT NULL,
    [default_role] BIT NOT NULL,
    CONSTRAINT [CPK_user_role_user_assoc] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [role_id] ASC) WITH (FILLFACTOR = 100)
);


GO

