CREATE TABLE [dbo].[image_type_user_role_assoc] (
    [image_type] CHAR (10) NOT NULL,
    [role_type]  TINYINT   NOT NULL,
    CONSTRAINT [CPK_image_type_user_role_assoc] PRIMARY KEY CLUSTERED ([image_type] ASC, [role_type] ASC)
);


GO

