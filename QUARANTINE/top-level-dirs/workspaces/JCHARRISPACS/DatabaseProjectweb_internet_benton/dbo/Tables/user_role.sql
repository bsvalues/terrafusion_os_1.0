CREATE TABLE [dbo].[user_role] (
    [role_id]            INT           NOT NULL,
    [role_description]   VARCHAR (255) NOT NULL,
    [role_type]          TINYINT       NOT NULL,
    [role_sub_attribute] TINYINT       NOT NULL,
    CONSTRAINT [CPK_user_role] PRIMARY KEY CLUSTERED ([role_id] ASC) WITH (FILLFACTOR = 100)
);


GO

