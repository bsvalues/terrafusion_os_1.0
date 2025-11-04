CREATE TABLE [dbo].[user_right_code_field] (
    [user_right_id] INT          NOT NULL,
    [table_name]    VARCHAR (50) NOT NULL,
    [field_name]    VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_user_right_code_field] PRIMARY KEY CLUSTERED ([user_right_id] ASC)
);


GO

