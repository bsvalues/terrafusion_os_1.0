CREATE TABLE [dbo].[user_rights] (
    [user_right_id]   INT          NOT NULL,
    [user_right_desc] VARCHAR (50) NOT NULL,
    [user_right_type] CHAR (1)     NOT NULL,
    CONSTRAINT [CPK_user_rights] PRIMARY KEY CLUSTERED ([user_right_id] ASC, [user_right_type] ASC) WITH (FILLFACTOR = 100)
);


GO

