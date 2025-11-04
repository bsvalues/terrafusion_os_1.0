CREATE TABLE [dbo].[sub_type_user_role_assoc] (
    [image_type] CHAR (10) NOT NULL,
    [rect_type]  CHAR (10) NOT NULL,
    [sub_type]   CHAR (10) NOT NULL,
    [role_type]  INT       NOT NULL,
    [role_id]    INT       NOT NULL,
    CONSTRAINT [CPK_sub_type_user_role_assoc] PRIMARY KEY CLUSTERED ([image_type] ASC, [rect_type] ASC, [sub_type] ASC, [role_type] ASC, [role_id] ASC)
);


GO

